from datetime import datetime
from sqlalchemy.orm import Session
from app import models, schemas
from typing import Dict, List

def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def get_orders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Order).offset(skip).limit(limit).all()

def get_orders_by_owner(db: Session, owner_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Order).filter(models.Order.owner_id == owner_id).offset(skip).limit(limit).all()

def _adjust_stock(db: Session, items, direction: int) -> None:
    """Reconcile inventory with an order's line items.

    `direction=-1` records a sale (stock goes down), `direction=1` undoes one
    (stock goes back up). `items` may be `OrderItemCreate` payloads (create)
    or ORM `OrderItem` rows (update/delete) — both expose `product_id` and
    `quantity`. Lines are grouped per product so a product mentioned twice is
    adjusted once; lines whose product was deleted (`product_id is None`) are
    skipped.
    """
    delta_by_product: Dict[int, int] = {}
    for item in items:
        if item.product_id is None:
            continue
        delta_by_product[item.product_id] = delta_by_product.get(item.product_id, 0) + item.quantity

    for product_id, quantity in delta_by_product.items():
        inventory = (
            db.query(models.Inventory)
            .filter(models.Inventory.product_id == product_id)
            .first()
        )
        if inventory is None:
            if direction > 0:
                continue  # Nothing was ever stocked, so nothing to put back.
            # Sold a product with no inventory record: create one so the
            # shortfall shows up in the Inventory tab instead of vanishing.
            product = db.query(models.Product).filter(models.Product.id == product_id).first()
            if product is None:
                continue
            inventory = models.Inventory(sku=product.sku, quantity=0, product_id=product_id)
            db.add(inventory)
        # No clamping on purpose: a negative quantity is a real oversell and
        # should be visible for reconciliation (it also trips low-stock flags).
        inventory.quantity = (inventory.quantity or 0) + direction * quantity
        db.add(inventory)

# Shipments created automatically from the order flow carry an `AUTO-` tracking
# prefix so they can be told apart from shipments entered on the Shipments tab.
AUTO_TRACKING_PREFIX = "AUTO-"


def _shipment_status_for(order_status: str) -> str:
    """Mirror an order status onto the shipment status vocabulary."""
    if order_status == "shipped":
        return "in_transit"
    if order_status == "delivered":
        return "delivered"
    return "pending"  # pending, processing, picked, packed


def _auto_shipments(db: Session, order_id: int) -> List["models.Shipment"]:
    return (
        db.query(models.Shipment)
        .filter(
            models.Shipment.order_id == order_id,
            models.Shipment.tracking_number.like(f"{AUTO_TRACKING_PREFIX}%"),
        )
        .all()
    )


def _auto_tracking_number(db: Session, order_number: str) -> str:
    base = f"{AUTO_TRACKING_PREFIX}{order_number}"
    candidate = base
    suffix = 1
    while (
        db.query(models.Shipment)
        .filter(models.Shipment.tracking_number == candidate)
        .first()
        is not None
    ):
        suffix += 1
        candidate = f"{base}-{suffix}"
    return candidate


def _sync_shipment(db: Session, order: models.Order) -> None:
    """Keep the Shipments tab in step with an order.

    - `cancelled`: drop the automatically created shipment (nothing to ship).
      Re-activating the order recreates it, so cancelling twice is a no-op.
    - otherwise: create one if the order has no shipment at all, and mirror
      the status (shipped -> in_transit, delivered -> delivered, else pending).
    - Shipments entered manually (tracking without the `AUTO-` prefix) are
      never modified or removed — their tracking belongs to whoever entered
      them; they only suppress auto-creation so an order never gets two rows.
    """
    if order.status == "cancelled":
        for shipment in _auto_shipments(db, order.id):
            db.delete(shipment)
        return

    has_shipment = (
        db.query(models.Shipment.id)
        .filter(models.Shipment.order_id == order.id)
        .first()
        is not None
    )
    if not has_shipment:
        db.add(
            models.Shipment(
                tracking_number=_auto_tracking_number(db, order.order_number),
                status=_shipment_status_for(order.status),
                order_id=order.id,
                created_by_id=order.owner_id,
            )
        )
        return

    new_status = _shipment_status_for(order.status)
    for shipment in _auto_shipments(db, order.id):
        if shipment.status == new_status:
            continue
        shipment.status = new_status
        shipment.actual_delivery = datetime.utcnow() if new_status == "delivered" else None
        db.add(shipment)


def create_order(db: Session, order: schemas.OrderCreate, owner_id: int):
    db_order = models.Order(
        order_number=order.order_number,
        customer_name=order.customer_name,
        customer_email=order.customer_email,
        customer_address=order.customer_address,
        status=order.status,
        priority=order.priority,
        total_amount=order.total_amount,
        owner_id=owner_id
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    # Create order items
    for item in order.items:
        db_order_item = models.OrderItem(
            quantity=item.quantity,
            price_per_unit=item.price_per_unit,
            order_id=db_order.id,
            product_id=item.product_id
        )
        db.add(db_order_item)
    
    # A new order is a sale: reduce stock so the Inventory tab reconciles.
    # An order created directly as `cancelled` never took stock to begin with.
    if order.status != "cancelled":
        _adjust_stock(db, order.items, direction=-1)

    # Mirror the order onto the Shipments tab (no-op for cancelled orders).
    _sync_shipment(db, db_order)

    db.commit()
    db.refresh(db_order)
    return db_order

def update_order(db: Session, db_obj: models.Order, obj_in: schemas.OrderUpdate):
    update_data = obj_in.dict(exclude_unset=True)
    previous_status = db_obj.status
    for field, value in update_data.items():
        setattr(db_obj, field, value)

    # Reconcile inventory on status flips: cancelling puts the goods back on
    # the shelf, re-activating a cancelled order sells them again. The
    # `previous_status != new_status` guard keeps repeated PUTs idempotent.
    new_status = db_obj.status
    if previous_status != new_status:
        if new_status == "cancelled":
            _adjust_stock(db, db_obj.items, direction=1)
        elif previous_status == "cancelled":
            _adjust_stock(db, db_obj.items, direction=-1)

    # Mirror the order onto the Shipments tab: create the shipment when the
    # order has none (legacy rows) and follow status flips — shipped shows as
    # in_transit, delivered as delivered, cancelled drops the auto shipment.
    # Idempotent: repeating the same PUT changes nothing.
    _sync_shipment(db, db_obj)

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove_order(db: Session, order_id: int):
    obj = db.query(models.Order).get(order_id)
    if obj is None:
        return None
    # Return the goods to stock — unless the order was cancelled, in which
    # case the stock already went back when the status flipped to cancelled.
    if obj.status != "cancelled":
        _adjust_stock(db, obj.items, direction=1)
    # Shipments only make sense while their order exists — remove the linked
    # ones so the Shipments tab never shows rows pointing at a deleted order
    # (SQLite foreign keys are off, so nothing would null them automatically).
    for shipment in (
        db.query(models.Shipment).filter(models.Shipment.order_id == order_id).all()
    ):
        db.delete(shipment)
    # Serialize while still session-bound: after commit() the instance is
    # detached and lazy relationships (e.g. `items`/`owner`) can no longer load.
    snapshot = schemas.Order.model_validate(obj)
    db.delete(obj)
    db.commit()
    return snapshot

# ---------------------------------------------------------------------------
# Generic CRUD names used by the API layer (`app.api.v1.endpoints.orders`).
# ---------------------------------------------------------------------------

def get(db: Session, id: int):
    return get_order(db, order_id=id)

def get_multi(db: Session, skip: int = 0, limit: int = 100):
    return get_orders(db, skip=skip, limit=limit)

def create_with_owner(db: Session, obj_in: schemas.OrderCreate, owner_id: int):
    return create_order(db, order=obj_in, owner_id=owner_id)

def update(db: Session, db_obj: models.Order, obj_in: schemas.OrderUpdate):
    return update_order(db, db_obj=db_obj, obj_in=obj_in)

def remove(db: Session, id: int):
    return remove_order(db, order_id=id)
