import pytest


@pytest.mark.asyncio
async def test_register_login_and_me(client):
    register_payload = {
        "email": "jose@example.com",
        "name": "Jose Dela Cruz",
        "password": "pass1234",
        "role": "donor",
        "stellar_public_key": "GABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZAB12",
    }

    register = await client.post("/api/v1/auth/register", json=register_payload)
    assert register.status_code == 201
    registered = register.json()
    assert registered["success"] is True
    assert registered["data"]["email"] == "jose@example.com"
    assert registered["data"]["role"] == "donor"

    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "jose@example.com", "password": "pass1234"},
    )
    assert login.status_code == 200
    body = login.json()
    assert body["success"] is True
    assert body["data"]["token"]
    assert body["data"]["user"]["email"] == "jose@example.com"

    me = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {body['data']['token']}"},
    )
    assert me.status_code == 200
    assert me.json()["data"]["name"] == "Jose Dela Cruz"


@pytest.mark.asyncio
async def test_register_rejects_duplicate_email(client):
    payload = {
        "email": "dupe@example.com",
        "name": "First User",
        "password": "pass1234",
        "role": "donor",
    }
    first = await client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201

    second = await client.post("/api/v1/auth/register", json={**payload, "name": "Second User"})
    assert second.status_code == 400
    assert second.json()["detail"] == "Email already registered"


@pytest.mark.asyncio
async def test_login_rejects_invalid_credentials(client):
    payload = {
        "email": "wrongpass@example.com",
        "name": "Wrong Password",
        "password": "pass1234",
        "role": "donor",
    }
    created = await client.post("/api/v1/auth/register", json=payload)
    assert created.status_code == 201

    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "wrongpass@example.com", "password": "bad-password"},
    )
    assert login.status_code == 401
    assert login.json()["detail"] == "Invalid credentials"
