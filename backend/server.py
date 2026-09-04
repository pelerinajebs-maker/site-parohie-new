from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
from typing import List, Optional, Annotated
from datetime import datetime, timezone, timedelta

import jwt
import bcrypt
import httpx
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionRequest, CheckoutStatusResponse,
)
from bson import ObjectId
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict, EmailStr

# ------------------ DB ------------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

# ------------------ Models ------------------
PyObjectId = Annotated[str, BeforeValidator(str)]

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

# Multilingual content model (ro required, de/en optional)
class MultiLang(BaseModel):
    ro: str = ""
    de: str = ""
    en: str = ""

class ContentIn(BaseModel):
    kind: str  # announcement | magazine | resource
    category: Optional[str] = None  # for resources: calendar, patron, priest, catechesis, prayers
    title: MultiLang
    excerpt: Optional[MultiLang] = None
    body: MultiLang
    image: Optional[str] = None
    date: Optional[str] = None
    published: bool = True

class RenovationItem(BaseModel):
    image: str
    caption: MultiLang = Field(default_factory=MultiLang)
    date: Optional[str] = None

class DonationPackage(BaseModel):
    id: str
    amount: float
    label: MultiLang = Field(default_factory=MultiLang)

class Settings(BaseModel):
    donation_enabled: bool = True
    donation_button_text: MultiLang = Field(default_factory=MultiLang)
    donation_external_link: str = ""
    iban: str = ""
    account_holder: str = ""
    bank_name: str = ""
    whatsapp_number: str = "40787867540"
    phone: str = ""
    email: str = ""
    address: str = ""
    office_hours: MultiLang = Field(default_factory=MultiLang)
    map_embed: str = ""
    donation_packages: List[DonationPackage] = Field(default_factory=list)
    renov_goal: float = 0.0
    renov_raised: float = 0.0
    renov_note: MultiLang = Field(default_factory=MultiLang)

class PageContentIn(BaseModel):
    texts: dict = Field(default_factory=dict)   # {blockKey: {ro,de,en}}
    media: dict = Field(default_factory=dict)   # {mediaKey: url}

class NewsletterSubscribeIn(BaseModel):
    email: EmailStr
    name: Optional[str] = ""

class BroadcastIn(BaseModel):
    subject: str
    body: str

class ContactMessage(BaseModel):
    name: str
    email: str
    message: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

# ------------------ Auth helpers ------------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email,
               "exp": datetime.now(timezone.utc) + timedelta(hours=12), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def serialize(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return doc

# ------------------ App ------------------
app = FastAPI()
api = APIRouter(prefix="/api")

@api.get("/")
async def root():
    return {"message": "Parohia Sigmir API"}

# ---- Auth ----
@api.post("/auth/login")
async def login(payload: LoginIn, response: Response):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email sau parolă incorecte")
    token = create_access_token(str(user["_id"]), email)
    
    # Set secure cookie based on environment
    is_production = os.environ.get('ENV', 'production').lower() == 'production'
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=is_production,  # Only require HTTPS in production
        samesite="lax",        # Better compatibility than "none"
        max_age=43200,
        path="/"
    )
    logger.info(f"✅ User logged in: {email}")
    return {"id": str(user["_id"]), "email": email, "name": user.get("name"), "role": user.get("role")}

@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user

# ---- Public content ----
@api.get("/content")
async def list_content(kind: str, category: Optional[str] = None, all: bool = False,
                       request: Request = None):
    q: dict = {"kind": kind}
    if category:
        q["category"] = category
    if not all:
        q["published"] = True
    docs = await db.content.find(q).sort("date", -1).to_list(500)
    return [serialize(d) for d in docs]

@api.get("/content/{item_id}")
async def get_content(item_id: str):
    try:
        doc = await db.content.find_one({"_id": ObjectId(item_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Not found")
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return serialize(doc)

@api.post("/content")
async def create_content(item: ContentIn, user: dict = Depends(get_current_user)):
    doc = item.model_dump()
    doc["date"] = doc.get("date") or now_iso()
    doc["created_at"] = now_iso()
    res = await db.content.insert_one(doc)
    doc = await db.content.find_one({"_id": res.inserted_id})
    return serialize(doc)

@api.put("/content/{item_id}")
async def update_content(item_id: str, item: ContentIn, user: dict = Depends(get_current_user)):
    doc = item.model_dump()
    await db.content.update_one({"_id": ObjectId(item_id)}, {"$set": doc})
    updated = await db.content.find_one({"_id": ObjectId(item_id)})
    if not updated:
        raise HTTPException(status_code=404, detail="Not found")
    return serialize(updated)

@api.delete("/content/{item_id}")
async def delete_content(item_id: str, user: dict = Depends(get_current_user)):
    await db.content.delete_one({"_id": ObjectId(item_id)})
    return {"ok": True}

# ---- Renovation gallery ----
@api.get("/renovation")
async def list_renovation():
    docs = await db.renovation.find().sort("date", -1).to_list(200)
    return [serialize(d) for d in docs]

@api.post("/renovation")
async def add_renovation(item: RenovationItem, user: dict = Depends(get_current_user)):
    doc = item.model_dump()
    doc["date"] = doc.get("date") or now_iso()
    res = await db.renovation.insert_one(doc)
    return serialize(await db.renovation.find_one({"_id": res.inserted_id}))

@api.delete("/renovation/{item_id}")
async def del_renovation(item_id: str, user: dict = Depends(get_current_user)):
    await db.renovation.delete_one({"_id": ObjectId(item_id)})
    return {"ok": True}

# ---- Settings ----
@api.get("/settings")
async def get_settings():
    doc = await db.settings.find_one({"_id": "global"})
    if not doc:
        default = Settings().model_dump()
        default["_id"] = "global"
        await db.settings.insert_one(default)
        doc = default
    doc.pop("_id", None)
    return doc

@api.put("/settings")
async def update_settings(s: Settings, user: dict = Depends(get_current_user)):
    doc = s.model_dump()
    await db.settings.update_one({"_id": "global"}, {"$set": doc}, upsert=True)
    return doc

# ---- Contact ----
@api.post("/contact")
async def submit_contact(msg: ContactMessage):
    doc = msg.model_dump()
    doc["created_at"] = now_iso()
    await db.contact_messages.insert_one(doc)
    return {"ok": True}

@api.get("/contact")
async def list_contact(user: dict = Depends(get_current_user)):
    docs = await db.contact_messages.find().sort("created_at", -1).to_list(500)
    return [serialize(d) for d in docs]

# ---- Orthodox calendar (external API proxy) ----
@api.get("/calendar/{year}/{month}/{day}")
async def calendar(year: int, month: int, day: int):
    url = f"https://orthocal.info/api/gregorian/{year}/{month}/{day}/"
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.get(url)
            r.raise_for_status()
            data = r.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Calendar API indisponibil: {e}")
    return {
        "year": data.get("year"), "month": data.get("month"), "day": data.get("day"),
        "summary_title": data.get("summary_title"),
        "titles": data.get("titles", []),
        "feasts": data.get("feasts", []),
        "saints": data.get("saints", []),
        "fast_level_desc": data.get("fast_level_desc"),
        "fast_exception_desc": data.get("fast_exception_desc"),
        "feast_level_description": data.get("feast_level_description"),
        "readings": [
            {"display": rd.get("display"), "source": rd.get("source")}
            for rd in data.get("readings", [])
        ],
    }

# ------------------ Stripe donations ------------------
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "")
DONATION_CURRENCY = "ron"
# Server-defined preset donation packages (RON)
DONATION_PACKAGES = {
    "seed": 50.0,
    "candle": 100.0,
    "brick": 250.0,
    "pillar": 500.0,
}
CUSTOM_MIN = 5.0
CUSTOM_MAX = 50000.0

# ---- Email (Emergent-managed Resend) ----
EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY", "")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "Parohia Sigmir")

if not EMAIL_KEY:
    logger.warning("⚠️ EMERGENT_EMAIL_KEY not configured - email features will be disabled")

async def send_email(to_list, subject: str, html: str, reply_to: Optional[str] = None) -> bool:
    if not EMAIL_KEY:
        logger.error("❌ Cannot send email: EMERGENT_EMAIL_KEY not configured")
        return False
    if not to_list:
        logger.error("❌ Cannot send email: no recipients provided")
        return False
    payload = {"to": to_list, "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if reply_to:
        payload["contact_email"] = reply_to
    try:
        async with httpx.AsyncClient(timeout=30) as c:
            resp = await c.post(f"{EMAIL_BASE_URL}/api/v1/email/send",
                                headers={"X-Email-Key": EMAIL_KEY}, json=payload)
            resp.raise_for_status()
        logger.info(f"✅ Email sent successfully to {', '.join(to_list[:2])}{'...' if len(to_list) > 2 else ''}")
        return True
    except Exception as e:
        logger.error(f"❌ send_email failed: {e}")
        return False

async def get_donation_packages() -> dict:
    """Return {package_id: amount} from settings, fallback to defaults."""
    doc = await db.settings.find_one({"_id": "global"})
    pkgs = (doc or {}).get("donation_packages") or []
    if pkgs:
        return {p["id"]: float(p["amount"]) for p in pkgs}
    return dict(DONATION_PACKAGES)

def donation_email_html(name: str, amount: float, currency: str) -> str:
    greeting = f"Dragă {name}" if name else "Dragă binefăcătorule"
    return f"""
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE6;padding:32px 0;font-family:Georgia,'Times New Roman',serif;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#FDFBF7;border:1px solid #DAA520;">
      <tr><td style="background:#2C241B;padding:28px 32px;text-align:center;">
        <div style="color:#DAA520;font-size:13px;letter-spacing:3px;text-transform:uppercase;">Parohia Ortodoxă Română</div>
        <div style="color:#FDFBF7;font-size:26px;margin-top:6px;">Sfântul Ierarh Nicolae · Sigmir</div>
      </td></tr>
      <tr><td style="padding:36px 40px;color:#2C241B;">
        <p style="font-size:20px;margin:0 0 16px;">{greeting},</p>
        <p style="font-size:16px;line-height:1.7;margin:0 0 16px;font-family:Arial,sans-serif;">
          Îți mulțumim din inimă pentru donația ta de <strong>{amount:.2f} {currency}</strong>.
          Sprijinul tău ține candela aprinsă și ajută la înnoirea sfântului nostru lăcaș.
        </p>
        <p style="font-size:16px;line-height:1.7;margin:0 0 24px;font-family:Arial,sans-serif;">
          Numele tău va fi pomenit în rugăciunile parohiei. Dumnezeu să te binecuvânteze și să-ți răsplătească dărnicia!
        </p>
        <div style="border-top:1px solid #DAA520;margin:24px 0;"></div>
        <p style="font-size:14px;color:#800020;margin:0;font-family:Arial,sans-serif;">
          Cu binecuvântare,<br/>Parohia Ortodoxă Română „Sfântul Ierarh Nicolae" din Sigmir<br/>
          Sigmir, Bistrița-Năsăud, România
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
"""

async def send_donation_thankyou(tx: dict):
    """Send a thank-you email once per paid donation (idempotent)."""
    if not EMAIL_KEY:
        return
    if tx.get("email_sent"):
        return
    meta = tx.get("metadata") or {}
    donor_email = meta.get("donor_email")
    if not donor_email:
        return
    donor_name = meta.get("donor_name") or ""
    amount = tx.get("amount", 0.0)
    currency = (tx.get("currency") or "ron").upper()
    payload = {
        "to": [donor_email],
        "subject": "Mulțumim pentru donația ta • Parohia Sigmir",
        "html": donation_email_html(donor_name, amount, currency),
        "from_name": EMAIL_FROM_NAME,
        "contact_email": os.environ.get("ADMIN_EMAIL", "contact@parohiasigmir.ro"),
    }
    try:
        async with httpx.AsyncClient(timeout=30) as c:
            resp = await c.post(f"{EMAIL_BASE_URL}/api/v1/email/send",
                                headers={"X-Email-Key": EMAIL_KEY}, json=payload)
            resp.raise_for_status()
        await db.payment_transactions.update_one(
            {"session_id": tx["session_id"]}, {"$set": {"email_sent": True}})
        logger.info(f"Donation thank-you email sent to {donor_email}")
    except Exception as e:
        logger.error(f"Failed to send donation email: {e}")

class DonationCheckoutIn(BaseModel):
    package_id: Optional[str] = None
    custom_amount: Optional[float] = None
    origin_url: str
    donor_name: Optional[str] = None
    donor_email: Optional[str] = None

@api.post("/donations/checkout")
async def create_donation_checkout(payload: DonationCheckoutIn):
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Stripe nu este configurat")
    # amount resolved SERVER-SIDE only
    packages = await get_donation_packages()
    if payload.package_id:
        if payload.package_id not in packages:
            raise HTTPException(status_code=400, detail="Pachet invalid")
        amount = packages[payload.package_id]
    elif payload.custom_amount is not None:
        amount = round(float(payload.custom_amount), 2)
        if amount < CUSTOM_MIN or amount > CUSTOM_MAX:
            raise HTTPException(status_code=400, detail=f"Suma trebuie să fie între {CUSTOM_MIN} și {CUSTOM_MAX} RON")
    else:
        raise HTTPException(status_code=400, detail="Selectează o sumă")

    origin = payload.origin_url.rstrip("/")
    success_url = f"{origin}/doneaza?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/doneaza"
    metadata = {
        "type": "donation",
        "package_id": payload.package_id or "custom",
        "donor_name": payload.donor_name or "",
        "donor_email": payload.donor_email or "",
    }

    webhook_url = f"{origin}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    req = CheckoutSessionRequest(
        amount=amount, currency=DONATION_CURRENCY,
        success_url=success_url, cancel_url=cancel_url, metadata=metadata,
    )
    session = await stripe_checkout.create_checkout_session(req)

    await db.payment_transactions.insert_one({
        "session_id": session.session_id,
        "amount": amount,
        "currency": DONATION_CURRENCY,
        "metadata": metadata,
        "payment_status": "pending",
        "status": "initiated",
        "created_at": now_iso(),
        "updated_at": now_iso(),
    })
    return {"url": session.url, "session_id": session.session_id}

@api.get("/donations/status/{session_id}")
async def donation_status(session_id: str):
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Stripe nu este configurat")
    tx = await db.payment_transactions.find_one({"session_id": session_id})
    if not tx:
        raise HTTPException(status_code=404, detail="Tranzacție inexistentă")

    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)

    # Update only if not already finalized (idempotent)
    if tx.get("payment_status") != "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"status": status.status, "payment_status": status.payment_status,
                      "updated_at": now_iso()}},
        )
        if status.payment_status == "paid":
            fresh = await db.payment_transactions.find_one({"session_id": session_id})
            await send_donation_thankyou(fresh)
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency,
    }

@api.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Stripe nu este configurat")
    body = await request.body()
    sig = request.headers.get("Stripe-Signature")
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    try:
        event = await stripe_checkout.handle_webhook(body, sig)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook error: {e}")
    if event.session_id:
        tx = await db.payment_transactions.find_one({"session_id": event.session_id})
        if tx and tx.get("payment_status") != "paid":
            await db.payment_transactions.update_one(
                {"session_id": event.session_id},
                {"$set": {"payment_status": event.payment_status,
                          "updated_at": now_iso()}},
            )
            if event.payment_status == "paid":
                fresh = await db.payment_transactions.find_one({"session_id": event.session_id})
                await send_donation_thankyou(fresh)
    return {"received": True}

@api.get("/donations/packages")
async def donation_packages():
    doc = await db.settings.find_one({"_id": "global"})
    pkgs = (doc or {}).get("donation_packages") or []
    if pkgs:
        packages = {p["id"]: float(p["amount"]) for p in pkgs}
        labels = {p["id"]: p.get("label", {}) for p in pkgs}
    else:
        packages = dict(DONATION_PACKAGES)
        labels = {}
    return {"currency": DONATION_CURRENCY.upper(),
            "packages": packages, "labels": labels,
            "custom_min": CUSTOM_MIN, "custom_max": CUSTOM_MAX}

# ---- Page content (super-admin editable) ----
@api.get("/pages")
async def get_all_pages():
    docs = await db.pages.find().to_list(200)
    return {d["_id"]: {"texts": d.get("texts", {}), "media": d.get("media", {})} for d in docs}

@api.get("/pages/{page_key}")
async def get_page(page_key: str):
    doc = await db.pages.find_one({"_id": page_key})
    if not doc:
        return {"texts": {}, "media": {}}
    return {"texts": doc.get("texts", {}), "media": doc.get("media", {})}

@api.put("/pages/{page_key}")
async def put_page(page_key: str, payload: PageContentIn, user: dict = Depends(get_current_user)):
    await db.pages.update_one({"_id": page_key},
                              {"$set": {"texts": payload.texts, "media": payload.media,
                                        "updated_at": now_iso()}}, upsert=True)
    return {"ok": True}

# ---- Newsletter ----
def newsletter_welcome_html(name: str) -> str:
    greeting = f"Dragă {name}" if name else "Dragă cititorule"
    return f"""
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE6;padding:32px 0;font-family:Georgia,serif;">
  <tr><td align="center"><table width="600" style="background:#FDFBF7;border:1px solid #DAA520;">
    <tr><td style="background:#2C241B;padding:26px;text-align:center;">
      <div style="color:#DAA520;font-size:12px;letter-spacing:3px;text-transform:uppercase;">Newsletter duhovnicesc</div>
      <div style="color:#FDFBF7;font-size:24px;margin-top:6px;">Parohia Sfântul Ierarh Nicolae · Sigmir</div>
    </td></tr>
    <tr><td style="padding:34px 40px;color:#2C241B;font-family:Arial,sans-serif;">
      <p style="font-size:19px;font-family:Georgia,serif;margin:0 0 14px;">{greeting},</p>
      <p style="font-size:16px;line-height:1.7;">Îți mulțumim că te-ai abonat la newsletterul duhovnicesc al parohiei noastre.
      Vei primi recomandări de lectură, articole și vești din viața comunității.</p>
      <p style="font-size:16px;line-height:1.7;">Îți recomandăm cu drag publicațiile ortodoxe:</p>
      <ul style="font-size:16px;line-height:1.9;">
        <li><a href="https://ziarullumina.ro/" style="color:#800020;">Ziarul Lumina</a></li>
        <li><a href="https://revistarenasterea.ro/" style="color:#800020;">Revista Renașterea</a></li>
      </ul>
      <div style="border-top:1px solid #DAA520;margin:22px 0;"></div>
      <p style="font-size:14px;color:#800020;">Cu binecuvântare,<br/>Parohia Ortodoxă Română „Sfântul Ierarh Nicolae" din Sigmir</p>
    </td></tr>
  </table></td></tr>
</table>
"""

@api.post("/newsletter/subscribe")
async def newsletter_subscribe(payload: NewsletterSubscribeIn):
    email = payload.email.lower()
    existing = await db.newsletter_subscribers.find_one({"email": email})
    if existing:
        return {"ok": True, "already": True}
    await db.newsletter_subscribers.insert_one({
        "email": email, "name": payload.name or "", "created_at": now_iso()})
    await send_email([email], "Bine ai venit la newsletterul parohiei • Sigmir",
                     newsletter_welcome_html(payload.name or ""))
    return {"ok": True, "already": False}

@api.get("/newsletter/subscribers")
async def newsletter_list(user: dict = Depends(get_current_user)):
    docs = await db.newsletter_subscribers.find().sort("created_at", -1).to_list(2000)
    return [serialize(d) for d in docs]

@api.delete("/newsletter/subscribers/{sub_id}")
async def newsletter_delete(sub_id: str, user: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(sub_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID invalid")
    await db.newsletter_subscribers.delete_one({"_id": oid})
    return {"ok": True}

@api.post("/newsletter/broadcast")
async def newsletter_broadcast(payload: BroadcastIn, user: dict = Depends(get_current_user)):
    subs = await db.newsletter_subscribers.find().to_list(5000)
    emails = [s["email"] for s in subs if s.get("email")]
    if not emails:
        return {"ok": True, "sent": 0}
    html = f"""<table width="100%" style="background:#F4EFE6;padding:24px 0;font-family:Arial,sans-serif;">
      <tr><td align="center"><table width="600" style="background:#FDFBF7;border:1px solid #DAA520;">
      <tr><td style="background:#2C241B;padding:20px;text-align:center;color:#DAA520;font-family:Georgia,serif;font-size:20px;">
        Parohia Sfântul Ierarh Nicolae · Sigmir</td></tr>
      <tr><td style="padding:30px 36px;color:#2C241B;font-size:16px;line-height:1.7;">{payload.body}</td></tr>
      </table></td></tr></table>"""
    sent = 0
    for em in emails:
        if await send_email([em], payload.subject, html):
            sent += 1
    return {"ok": True, "sent": sent}

app.include_router(api)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ------------------ Seeding ------------------
async def seed():
    # indexes
    await db.users.create_index("email", unique=True)
    # admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email, "password_hash": hash_password(admin_password),
            "name": "Administrator", "role": "admin", "created_at": now_iso()})
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email},
                                  {"$set": {"password_hash": hash_password(admin_password)}})
    # settings
    if not await db.settings.find_one({"_id": "global"}):
        s = Settings(
            donation_button_text=MultiLang(ro="Donează", de="Spenden", en="Donate"),
            donation_external_link="https://example.com/donatii",
            iban="RO49 AAAA 1B31 0075 9384 0000",
            account_holder="Parohia Ortodoxă Română Sfântul Ierarh Nicolae Sigmir",
            bank_name="Banca Transilvania",
            whatsapp_number="40787867540",
            phone="+40 787 867 540",
            email="contact@parohiasigmir.ro",
            address="Sat Sigmir, comuna Șieu-Măgheruș, Bistrița-Năsăud, România",
            office_hours=MultiLang(ro="Luni–Vineri: 09:00–17:00",
                                   de="Mo–Fr: 09:00–17:00", en="Mon–Fri: 09:00–17:00"),
            donation_packages=[
                DonationPackage(id="seed", amount=50.0, label=MultiLang(ro="Sămânță", de="Samen", en="Seed")),
                DonationPackage(id="candle", amount=100.0, label=MultiLang(ro="Lumânare", de="Kerze", en="Candle")),
                DonationPackage(id="brick", amount=250.0, label=MultiLang(ro="Cărămidă", de="Ziegel", en="Brick")),
                DonationPackage(id="pillar", amount=500.0, label=MultiLang(ro="Stâlp", de="Säule", en="Pillar")),
            ],
            renov_goal=150000.0,
            renov_raised=42000.0,
            renov_note=MultiLang(ro="Mulțumim tuturor celor care au contribuit până acum la înnoirea bisericii.",
                                 de="Danke an alle, die bisher beigetragen haben.",
                                 en="Thank you to all who have contributed so far."),
        ).model_dump()
        s["_id"] = "global"
        await db.settings.insert_one(s)
    else:
        # ensure donation_packages exist for older settings docs
        existing_s = await db.settings.find_one({"_id": "global"})
        if not existing_s.get("donation_packages"):
            await db.settings.update_one({"_id": "global"}, {"$set": {"donation_packages": [
                {"id": "seed", "amount": 50.0, "label": _ml("Sămânță", "Samen", "Seed")},
                {"id": "candle", "amount": 100.0, "label": _ml("Lumânare", "Kerze", "Candle")},
                {"id": "brick", "amount": 250.0, "label": _ml("Cărămidă", "Ziegel", "Brick")},
                {"id": "pillar", "amount": 500.0, "label": _ml("Stâlp", "Säule", "Pillar")},
            ]}})
        if existing_s.get("renov_goal") in (None, 0, 0.0) and "renov_goal" not in existing_s:
            await db.settings.update_one({"_id": "global"}, {"$set": {
                "renov_goal": 150000.0, "renov_raised": 42000.0,
                "renov_note": _ml("Mulțumim tuturor celor care au contribuit până acum la înnoirea bisericii.",
                                  "Danke an alle, die bisher beigetragen haben.",
                                  "Thank you to all who have contributed so far.")}})
    # sample content
    if await db.content.count_documents({}) == 0:
        await seed_content()
    if await db.renovation.count_documents({}) == 0:
        gallery = [
            {"image": "https://images.pexels.com/photos/19474821/pexels-photo-19474821.jpeg",
             "caption": MultiLang(ro="Interiorul bisericii înainte de renovare",
                                  de="Innenraum vor der Renovierung",
                                  en="Church interior before renovation").model_dump(),
             "date": now_iso()},
            {"image": "https://images.unsplash.com/photo-1476900164809-ff19b8ae5968",
             "caption": MultiLang(ro="Lucrări la iluminatul liturgic",
                                  de="Arbeiten an der liturgischen Beleuchtung",
                                  en="Work on liturgical lighting").model_dump(),
             "date": now_iso()},
        ]
        await db.renovation.insert_many(gallery)

def _ml(ro, de, en):
    return MultiLang(ro=ro, de=de, en=en).model_dump()

# Configure CORS BEFORE including routes
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

async def seed_content():
    items = [
        {"kind": "announcement", "image": None, "published": True, "date": now_iso(),
         "title": _ml("Program special de Crăciun", "Sonderprogramm zu Weihnachten", "Special Christmas Schedule"),
         "excerpt": _ml("Slujbele din perioada Nașterii Domnului.", "Gottesdienste zur Geburt des Herrn.", "Services during the Nativity."),
         "body": _ml("În perioada Nașterii Domnului, Sfânta Liturghie se va oficia zilnic începând cu ora 9:00. Vă așteptăm cu drag.",
                     "Während der Geburt des Herrn wird die Göttliche Liturgie täglich um 9:00 Uhr gefeiert.",
                     "During the Nativity season, the Divine Liturgy will be celebrated daily at 9:00.")},
        {"kind": "announcement", "image": None, "published": True, "date": now_iso(),
         "title": _ml("Sfințirea casei — înscrieri", "Haussegnung — Anmeldung", "House Blessing — Registration"),
         "excerpt": _ml("Vă puteți înscrie pentru sfințirea caselor.", "Anmeldung zur Haussegnung.", "Register for house blessings."),
         "body": _ml("Cei care doresc sfințirea caselor sunt rugați să se înscrie la oficiul parohial sau pe WhatsApp.",
                     "Bitte melden Sie sich im Pfarrbüro oder per WhatsApp an.",
                     "Please register at the parish office or via WhatsApp.")},
        {"kind": "magazine", "image": "https://images.pexels.com/photos/8276064/pexels-photo-8276064.jpeg",
         "published": True, "date": now_iso(),
         "title": _ml("Lumina din candelă — Ediția de iarnă", "Das Licht der Kerze — Winterausgabe", "The Light of the Lamp — Winter Edition"),
         "excerpt": _ml("Reflecții duhovnicești pentru postul Nașterii Domnului.", "Geistliche Betrachtungen.", "Spiritual reflections for the Nativity Fast."),
         "body": _ml("În această ediție vorbim despre rugăciune, milostenie și pregătirea inimii pentru întâmpinarea Pruncului Iisus.",
                     "In dieser Ausgabe sprechen wir über Gebet und Barmherzigkeit.",
                     "In this edition we speak about prayer, mercy, and preparing the heart.")},
        {"kind": "resource", "category": "patron", "image": None, "published": True, "date": now_iso(),
         "title": _ml("Sfântul Ierarh Nicolae", "Heiliger Nikolaus", "St Nicholas the Wonderworker"),
         "excerpt": _ml("Ocrotitorul parohiei noastre.", "Der Schutzpatron unserer Gemeinde.", "The patron of our parish."),
         "body": _ml("Sfântul Ierarh Nicolae, Arhiepiscopul Mirelor Lichiei, este ocrotitorul parohiei noastre. Hramul se prăznuiește pe 6 decembrie, cu Sfântă Liturghie și agapă frățească.",
                     "Der heilige Nikolaus ist der Schutzpatron unserer Gemeinde. Das Patronatsfest ist am 6. Dezember.",
                     "St Nicholas is the patron of our parish. The feast is celebrated on December 6th.")},
        {"kind": "resource", "category": "priest", "image": None, "published": True, "date": now_iso(),
         "title": _ml("Cuvânt la începutul postului", "Wort zum Beginn der Fastenzeit", "A Word at the Start of the Fast"),
         "excerpt": _ml("Mesaj pastoral al preotului paroh.", "Pastorale Botschaft.", "Pastoral message."),
         "body": _ml("Iubiți credincioși, postul este vremea întoarcerii inimii către Dumnezeu, prin rugăciune, iertare și fapte bune.",
                     "Geliebte Gläubige, die Fastenzeit ist die Zeit der Umkehr des Herzens zu Gott.",
                     "Beloved faithful, the fast is a time of turning the heart toward God.")},
        {"kind": "resource", "category": "catechesis", "image": None, "published": True, "date": now_iso(),
         "title": _ml("Ce este Sfânta Liturghie?", "Was ist die Göttliche Liturgie?", "What is the Divine Liturgy?"),
         "excerpt": _ml("Material de catehizare pentru tineri și adulți.", "Katechesematerial.", "Catechesis material."),
         "body": _ml("Sfânta Liturghie este inima vieții liturgice, unde credincioșii se împărtășesc din Trupul și Sângele Domnului.",
                     "Die Göttliche Liturgie ist das Herz des liturgischen Lebens.",
                     "The Divine Liturgy is the heart of liturgical life.")},
        {"kind": "resource", "category": "prayers", "image": None, "published": True, "date": now_iso(),
         "title": _ml("Rugăciune de dimineață", "Morgengebet", "Morning Prayer"),
         "excerpt": _ml("Rugăciune la începutul zilei.", "Gebet am Morgen.", "Prayer at the start of the day."),
         "body": _ml("Doamne, Iisuse Hristoase, Fiul lui Dumnezeu, miluiește-mă pe mine, păcătosul. Îți mulțumesc pentru ziua ce începe și Te rog să mă păzești în toate căile mele.",
                     "Herr Jesus Christus, Sohn Gottes, erbarme dich meiner.",
                     "Lord Jesus Christ, Son of God, have mercy on me.")},
        {"kind": "resource", "category": "prayers", "image": None, "published": True, "date": now_iso(),
         "title": _ml("Rugăciune pentru cei bolnavi", "Gebet für die Kranken", "Prayer for the Sick"),
         "excerpt": _ml("Rugăciune pentru sănătate.", "Gebet für die Gesundheit.", "Prayer for health."),
         "body": _ml("Doamne, Cel ce ai tămăduit toată boala și neputința, caută spre robii Tăi cei bolnavi și le dăruiește sănătate și mângâiere.",
                     "Herr, der du jede Krankheit geheilt hast, schau auf deine kranken Diener.",
                     "Lord, who healed every sickness, look upon your sick servants.")},
    ]
    await db.content.insert_many(items)

# Health check endpoint
@api.get("/health")
async def health_check():
    """Verifică dacă API-ul este disponibil."""
    return {"status": "ok", "service": "parohia-sigmir-api"}

@app.on_event("startup")
async def on_startup():
    try:
        await seed()
        logger.info("✅ Startup complete, database seeded successfully.")
    except Exception as e:
        logger.error(f"❌ Seed failed during startup: {e}", exc_info=True)
        # Server still starts even if seed fails, but logs the error

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
