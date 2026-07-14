"""Backend API tests for Parohia Sigmir."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://flamboyant-chandrasekhar-7.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@parohiasigmir.ro"
ADMIN_PASSWORD = "Sigmir2025!"


@pytest.fixture(scope="session")
def client():
    return requests.Session()


@pytest.fixture(scope="session")
def auth_client():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return s


# ---------------- Health / root ----------------
def test_root(client):
    r = client.get(f"{API}/")
    assert r.status_code == 200
    assert "message" in r.json()


# ---------------- Settings ----------------
def test_get_settings(client):
    r = client.get(f"{API}/settings")
    assert r.status_code == 200
    data = r.json()
    assert "donation_enabled" in data
    assert "whatsapp_number" in data
    assert data["whatsapp_number"] == "40787867540"
    assert "iban" in data


# ---------------- Auth ----------------
def test_login_success_and_me(auth_client):
    r = auth_client.get(f"{API}/auth/me")
    assert r.status_code == 200
    u = r.json()
    assert u["email"] == ADMIN_EMAIL
    assert u.get("role") == "admin"


def test_login_bad_password(client):
    r = client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
    assert r.status_code == 401


def test_me_unauthenticated(client):
    r = requests.get(f"{API}/auth/me")
    assert r.status_code == 401


def test_content_post_unauth_returns_401():
    r = requests.post(f"{API}/content", json={
        "kind": "announcement",
        "title": {"ro": "x", "de": "", "en": ""},
        "body": {"ro": "y", "de": "", "en": ""},
    })
    assert r.status_code == 401


# ---------------- Content ----------------
def test_list_announcements(client):
    r = client.get(f"{API}/content", params={"kind": "announcement"})
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    for item in data:
        assert item["kind"] == "announcement"
        assert item.get("published") is True
        assert "id" in item
        assert "_id" not in item


def test_list_resources_by_category(client):
    r = client.get(f"{API}/content", params={"kind": "resource", "category": "prayers"})
    assert r.status_code == 200
    items = r.json()
    assert len(items) >= 1
    for it in items:
        assert it["category"] == "prayers"


def test_get_content_by_id(client):
    r = client.get(f"{API}/content", params={"kind": "announcement"})
    item_id = r.json()[0]["id"]
    r2 = client.get(f"{API}/content/{item_id}")
    assert r2.status_code == 200
    assert r2.json()["id"] == item_id


def test_content_crud(auth_client):
    payload = {
        "kind": "announcement",
        "title": {"ro": "TEST_Anunț", "de": "TEST_DE", "en": "TEST_EN"},
        "excerpt": {"ro": "test excerpt", "de": "", "en": ""},
        "body": {"ro": "TEST body ro", "de": "", "en": ""},
        "published": True,
    }
    r = auth_client.post(f"{API}/content", json=payload)
    assert r.status_code == 200, r.text
    created = r.json()
    cid = created["id"]
    assert created["title"]["ro"] == "TEST_Anunț"

    # GET verify
    r2 = auth_client.get(f"{API}/content/{cid}")
    assert r2.status_code == 200
    assert r2.json()["title"]["ro"] == "TEST_Anunț"

    # UPDATE
    payload["title"]["ro"] = "TEST_Anunț_updated"
    r3 = auth_client.put(f"{API}/content/{cid}", json=payload)
    assert r3.status_code == 200
    assert r3.json()["title"]["ro"] == "TEST_Anunț_updated"

    # verify persistence
    r4 = auth_client.get(f"{API}/content/{cid}")
    assert r4.json()["title"]["ro"] == "TEST_Anunț_updated"

    # DELETE
    r5 = auth_client.delete(f"{API}/content/{cid}")
    assert r5.status_code == 200

    r6 = auth_client.get(f"{API}/content/{cid}")
    assert r6.status_code == 404


# ---------------- Renovation ----------------
def test_renovation_list(client):
    r = client.get(f"{API}/renovation")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_renovation_crud(auth_client):
    payload = {"image": "https://example.com/test.jpg",
               "caption": {"ro": "TEST caption", "de": "", "en": ""}}
    r = auth_client.post(f"{API}/renovation", json=payload)
    assert r.status_code == 200
    rid = r.json()["id"]
    r2 = auth_client.delete(f"{API}/renovation/{rid}")
    assert r2.status_code == 200


# ---------------- Contact ----------------
def test_contact_submit_and_list(client, auth_client):
    r = client.post(f"{API}/contact", json={
        "name": "TEST_User", "email": "test@example.com", "message": "TEST message"
    })
    assert r.status_code == 200
    r2 = auth_client.get(f"{API}/contact")
    assert r2.status_code == 200
    msgs = r2.json()
    assert any(m["name"] == "TEST_User" for m in msgs)


# ---------------- Settings update ----------------
def test_settings_update(auth_client):
    r = auth_client.get(f"{API}/settings")
    orig = r.json()
    updated = dict(orig)
    updated["phone"] = "+40 700 000 000"
    r2 = auth_client.put(f"{API}/settings", json=updated)
    assert r2.status_code == 200
    assert r2.json()["phone"] == "+40 700 000 000"
    # restore
    auth_client.put(f"{API}/settings", json=orig)


# ---------------- Orthodox calendar ----------------
def test_calendar_st_nicholas(client):
    r = client.get(f"{API}/calendar/2025/12/6")
    assert r.status_code == 200, r.text
    data = r.json()
    text = (data.get("summary_title") or "") + " " + " ".join(
        [s.get("title", "") if isinstance(s, dict) else str(s) for s in (data.get("saints") or [])]
    )
    assert "Nichol" in text or "Nicolae" in text or "Nikolaus" in text.lower() or "nicholas" in text.lower(), text
