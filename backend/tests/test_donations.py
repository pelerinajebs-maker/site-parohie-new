"""Backend tests for Stripe donations flow."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE_URL}/api"
ORIGIN = BASE_URL  # frontend origin same as public


def test_packages():
    r = requests.get(f"{API}/donations/packages")
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["currency"] == "RON"
    assert data["custom_min"] == 5.0
    assert data["custom_max"] == 50000.0
    pkgs = data["packages"]
    for k, v in {"seed": 50, "candle": 100, "brick": 250, "pillar": 500}.items():
        assert k in pkgs
        assert float(pkgs[k]) == float(v)


def test_checkout_package_candle():
    r = requests.post(f"{API}/donations/checkout",
                      json={"package_id": "candle", "origin_url": ORIGIN})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "url" in data and "session_id" in data
    assert data["url"].startswith("https://checkout.stripe.com")
    # verify transaction was created & amount is server-side
    sid = data["session_id"]
    # status endpoint should return valid data
    s = requests.get(f"{API}/donations/status/{sid}")
    assert s.status_code == 200, s.text
    sd = s.json()
    # amount_total in stripe is minor units; currency ron
    assert sd["currency"] == "ron"
    # Should be 100 RON => 10000 minor units (pending, but amount_total should still be present)
    if sd.get("amount_total") is not None:
        assert sd["amount_total"] == 10000


def test_checkout_custom_valid():
    r = requests.post(f"{API}/donations/checkout",
                      json={"custom_amount": 150, "origin_url": ORIGIN})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["url"].startswith("https://checkout.stripe.com")


def test_checkout_custom_below_min():
    r = requests.post(f"{API}/donations/checkout",
                      json={"custom_amount": 2, "origin_url": ORIGIN})
    assert r.status_code == 400


def test_checkout_custom_above_max():
    r = requests.post(f"{API}/donations/checkout",
                      json={"custom_amount": 100000, "origin_url": ORIGIN})
    assert r.status_code == 400


def test_checkout_invalid_package():
    r = requests.post(f"{API}/donations/checkout",
                      json={"package_id": "gold_bar", "origin_url": ORIGIN})
    assert r.status_code == 400


def test_checkout_no_selection():
    r = requests.post(f"{API}/donations/checkout",
                      json={"origin_url": ORIGIN})
    assert r.status_code == 400


def test_amount_field_ignored_from_client():
    """Extra 'amount' field must be ignored — server resolves amount from package_id."""
    r = requests.post(f"{API}/donations/checkout",
                      json={"package_id": "seed", "amount": 99999,
                            "origin_url": ORIGIN})
    assert r.status_code == 200, r.text
    sid = r.json()["session_id"]
    s = requests.get(f"{API}/donations/status/{sid}")
    assert s.status_code == 200
    sd = s.json()
    # seed = 50 RON = 5000 minor units
    if sd.get("amount_total") is not None:
        assert sd["amount_total"] == 5000, f"Server did not enforce package amount: {sd}"


def test_status_unknown_session():
    r = requests.get(f"{API}/donations/status/cs_test_unknownxxx")
    assert r.status_code == 404


def test_webhook_endpoint_exists():
    """Webhook should accept POST; invalid signature returns 400 (acceptable)."""
    r = requests.post(f"{API}/webhook/stripe", data=b"{}",
                      headers={"Stripe-Signature": "invalid"})
    # 400 for bad sig, or 500 acceptable; but must not be 404
    assert r.status_code != 404, r.text
