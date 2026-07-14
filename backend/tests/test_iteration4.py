"""Iteration 4 backend tests: renov settings + pages CRUD arbitrary keys."""
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


def test_settings_has_renov_fields():
    r = requests.get(f"{API}/settings")
    assert r.status_code == 200
    d = r.json()
    for k in ("renov_goal", "renov_raised", "renov_note"):
        assert k in d, f"missing {k}"


def test_settings_put_renov_persists(auth):
    orig = auth.get(f"{API}/settings").json()
    new_goal, new_raised = 222222.0, 55555.0
    payload = dict(orig)
    payload["renov_goal"] = new_goal
    payload["renov_raised"] = new_raised
    r = auth.put(f"{API}/settings", json=payload)
    assert r.status_code == 200, r.text

    got = requests.get(f"{API}/settings").json()
    assert got["renov_goal"] == new_goal
    assert got["renov_raised"] == new_raised

    # restore
    auth.put(f"{API}/settings", json=orig)


PAGE_KEYS = ["about", "community", "renovation", "contact", "donate",
             "newsletter", "calendar", "patron", "priest", "catechesis",
             "prayers", "resources", "announcements", "magazine"]


@pytest.mark.parametrize("key", PAGE_KEYS)
def test_pages_arbitrary_key_put_get(auth, key):
    marker = f"TEST_{key}_{uuid.uuid4().hex[:6]}"
    r = auth.put(f"{API}/pages/{key}",
                 json={"texts": {"title": {"ro": marker}}, "media": {}})
    assert r.status_code == 200, r.text
    got = requests.get(f"{API}/pages/{key}").json()
    assert got["texts"]["title"]["ro"] == marker
    # cleanup
    auth.put(f"{API}/pages/{key}", json={"texts": {}, "media": {}})


def test_pages_put_requires_auth_iter4():
    r = requests.put(f"{API}/pages/renovation",
                     json={"texts": {"title": {"ro": "x"}}, "media": {}})
    assert r.status_code == 401


def test_donations_packages_no_regression():
    r = requests.get(f"{API}/donations/packages")
    assert r.status_code == 200
    d = r.json()
    assert d["currency"] == "RON"
    assert isinstance(d["packages"], dict)
    assert len(d["packages"]) >= 1
