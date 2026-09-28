import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_inventory_item():
    # Test creating an inventory item
    response = client.post("/inventory/", json={
        "quantity": 10,
        "location": "A1-B2-C3",
        "reorder_level": 5,
        "product_id": 1
    })
    assert response.status_code == 200
    data = response.json()
    assert data["quantity"] == 10
    assert data["location"] == "A1-B2-C3"
    assert data["reorder_level"] == 5
    assert data["product_id"] == 1

def test_read_inventory_items():
    # Test reading inventory items
    response = client.get("/inventory/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_read_inventory_item():
    # Test reading a specific inventory item
    # First create one
    create_response = client.post("/inventory/", json={
        "quantity": 20,
        "location": "B2-C3-D4",
        "reorder_level": 10,
        "product_id": 2
    })
    assert create_response.status_code == 200
    created_item = create_response.json()
    item_id = created_item["id"]
    
    # Then read it
    response = client.get(f"/inventory/{item_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == item_id
    assert data["quantity"] == 20

def test_update_inventory_item():
    # Test updating an inventory item
    # First create one
    create_response = client.post("/inventory/", json={
        "quantity": 30,
        "location": "C3-D4-E5",
        "reorder_level": 15,
        "product_id": 3
    })
    assert create_response.status_code == 200
    created_item = create_response.json()
    item_id = created_item["id"]
    
    # Then update it
    update_response = client.put(f"/inventory/{item_id}", json={
        "quantity": 35,
        "location": "C3-D4-E5-Updated"
    })
    assert update_response.status_code == 200
    data = update_response.json()
    assert data["quantity"] == 35
    assert data["location"] == "C3-D4-E5-Updated"

def test_delete_inventory_item():
    # Test deleting an inventory item
    # First create one
    create_response = client.post("/inventory/", json={
        "quantity": 40,
        "location": "D4-E5-F6",
        "reorder_level": 20,
        "product_id": 4
    })
    assert create_response.status_code == 200
    created_item = create_response.json()
    item_id = created_item["id"]
    
    # Then delete it
    delete_response = client.delete(f"/inventory/{item_id}")
    assert delete_response.status_code == 200
    
    # Verify it's deleted
    get_response = client.get(f"/inventory/{item_id}")
    assert get_response.status_code == 404