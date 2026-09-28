"""CRUD helpers grouped per model.

Importing the sub-modules here exposes them as attributes of the package, so
the API layer can use `crud.user`, `crud.order`, `crud.product`,
`crud.inventory` and `crud.shipment`.
"""

from app.crud import inventory, order, product, shipment, user

__all__ = ["inventory", "order", "product", "shipment", "user"]
