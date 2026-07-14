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
    response.set_cookie(key="access_token", value=token, httponly=True,
                        secure=True, samesite="none", max_age=43200, path="/")
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

app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        ).model_dump()
        s["_id"] = "global"
        await db.settings.insert_one(s)
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

@app.on_event("startup")
async def on_startup():
    await seed()
    logger.info("Startup complete, admin seeded.")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
