"""Backend tests for newsletter, pages, and dynamic donation packages."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@parohiasigmir.ro"
ADMIN_PASSWORD = "Sigmir2025!"


@pytest.fixture(scope="module")
def auth():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return s


# ------------ Newsletter ------------
def test_newsletter_subscribe_and_dedupe(auth):
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(f"{API}/newsletter/subscribe", json={"email": email, "name": "TEST User"})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["ok"] is True
    assert d["already"] is False

    # duplicate
    r2 = requests.post(f"{API}/newsletter/subscribe", json={"email": email})
    assert r2.status_code == 200
    assert r2.json()["already"] is True

    # list must contain it
    lst = auth.get(f"{API}/newsletter/subscribers")
    assert lst.status_code == 200
    subs = lst.json()
    match = [s for s in subs if s.get("email") == email]
    assert len(match) >= 1
    sid = match[0].get("id") or match[0].get("_id")
    # cleanup
    if sid:
        d2 = auth.delete(f"{API}/newsletter/subscribers/{sid}")
        assert d2.status_code == 200


def test_newsletter_list_requires_auth():
    r = requests.get(f"{API}/newsletter/subscribers")
    assert r.status_code == 401


def test_newsletter_broadcast_requires_auth():
    r = requests.post(f"{API}/newsletter/broadcast", json={"subject": "x", "body": "y"})
    assert r.status_code == 401


def test_newsletter_broadcast(auth):
    # subscribe a temp email so broadcast has at least 1 recipient
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    requests.post(f"{API}/newsletter/subscribe", json={"email": email})
    r = auth.post(f"{API}/newsletter/broadcast",
                  json={"subject": "TEST Subject", "body": "<p>TEST body</p>"})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["ok"] is True
    assert isinstance(d["sent"], int)
    assert d["sent"] >= 1
    # cleanup
    subs = auth.get(f"{API}/newsletter/subscribers").json()
    for s in subs:
        if s.get("email") == email:
            sid = s.get("id") or s.get("_id")
            if sid:
                auth.delete(f"{API}/newsletter/subscribers/{sid}")


# ------------ Pages ------------
def test_pages_get_all():
    r = requests.get(f"{API}/pages")
    assert r.status_code == 200
    assert isinstance(r.json(), dict)


def test_pages_put_requires_auth():
    r = requests.put(f"{API}/pages/home",
                     json={"texts": {"hero_title": {"ro": "X"}}, "media": {}})
    assert r.status_code == 401


def test_pages_put_and_get(auth):
    marker = f"TEST_HERO_{uuid.uuid4().hex[:6]}"
    payload = {"texts": {"hero_title": {"ro": marker}}, "media": {}}
    r = auth.put(f"{API}/pages/home", json=payload)
    assert r.status_code == 200, r.text
    assert r.json()["ok"] is True

    r2 = requests.get(f"{API}/pages/home")
    assert r2.status_code == 200
    got = r2.json()
    assert got["texts"]["hero_title"]["ro"] == marker

    # also in aggregate endpoint
    all_r = requests.get(f"{API}/pages")
    assert all_r.status_code == 200
    all_pages = all_r.json()
    assert "home" in all_pages
    assert all_pages["home"]["texts"]["hero_title"]["ro"] == marker

    # cleanup — reset override to empty
    auth.put(f"{API}/pages/home", json={"texts": {}, "media": {}})


# ------------ Dynamic donation packages ------------
def test_donation_packages_dynamic_from_settings(auth):
    orig = auth.get(f"{API}/settings").json()
    # Build a modified copy of donation_packages with 'seed' amount changed
    orig_pkgs = orig.get("donation_packages") or []
    assert orig_pkgs, "expected donation_packages in settings"
    new_pkgs = []
    for p in orig_pkgs:
        cp = dict(p)
        if cp.get("id") == "seed":
            cp["amount"] = 77
        new_pkgs.append(cp)

    updated = dict(orig)
    updated["donation_packages"] = new_pkgs
    r = auth.put(f"{API}/settings", json=updated)
    assert r.status_code == 200, r.text

    # verify packages endpoint reflects
    p = requests.get(f"{API}/donations/packages").json()
    assert float(p["packages"]["seed"]) == 77.0

    # checkout with seed uses new amount server-side
    ch = requests.post(f"{API}/donations/checkout",
                       json={"package_id": "seed", "origin_url": BASE_URL})
    assert ch.status_code == 200, ch.text
    sid = ch.json()["session_id"]
    st = requests.get(f"{API}/donations/status/{sid}").json()
    if st.get("amount_total") is not None:
        assert st["amount_total"] == 7700  # 77 RON minor units

    # restore
    auth.put(f"{API}/settings", json=orig)
    p2 = requests.get(f"{API}/donations/packages").json()
    assert float(p2["packages"]["seed"]) == float(next(x["amount"] for x in orig_pkgs if x["id"] == "seed"))
