from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import aiosqlite
import json
import os
import uuid
import shutil
from datetime import datetime, timedelta
from jose import jwt, JWTError
import bcrypt as bcrypt_lib

from app.database import get_db, init_db, seed_default_data, DB_PATH

app = FastAPI()

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# JWT Config
SECRET_KEY = os.environ.get("JWT_SECRET", "gordotech-secret-key-2024-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Upload directory
UPLOAD_DIR = "/data/uploads" if os.path.exists("/data") else "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount uploads as static files
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ==================== STARTUP ====================

@app.on_event("startup")
async def startup():
    await init_db()
    await seed_default_data()

# ==================== MODELS ====================

class LoginRequest(BaseModel):
    username: str
    password: str

class ProductCreate(BaseModel):
    name: str
    category: str = ""
    condition: str = "Semi-usado"
    image: str = ""
    images: list[str] = []
    colors: list[str] = []
    storage_options: list[str] = []
    badge: Optional[str] = None
    available: list[str] = ["duitama", "tunja"]
    price: str = ""
    description: str = ""
    featured_recommended: bool = False
    featured_trending: bool = False
    sort_order: int = 0

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    condition: Optional[str] = None
    image: Optional[str] = None
    images: Optional[list[str]] = None
    colors: Optional[list[str]] = None
    storage_options: Optional[list[str]] = None
    badge: Optional[str] = None
    available: Optional[list[str]] = None
    price: Optional[str] = None
    description: Optional[str] = None
    featured_recommended: Optional[bool] = None
    featured_trending: Optional[bool] = None
    sort_order: Optional[int] = None

class CategoryCreate(BaseModel):
    slug: str
    name: str
    image: str = ""
    sort_order: int = 0

class CategoryUpdate(BaseModel):
    slug: Optional[str] = None
    name: Optional[str] = None
    image: Optional[str] = None
    sort_order: Optional[int] = None

class BubbleCreate(BaseModel):
    model_id: str
    label: str
    image: str = ""
    sort_order: int = 0

class BubbleUpdate(BaseModel):
    model_id: Optional[str] = None
    label: Optional[str] = None
    image: Optional[str] = None
    sort_order: Optional[int] = None

class RepairServiceCreate(BaseModel):
    title: str
    description: str = ""
    price: str = ""
    icon: str = "Smartphone"
    sort_order: int = 0

class RepairServiceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[str] = None
    icon: Optional[str] = None
    sort_order: Optional[int] = None

class HeroSlideCreate(BaseModel):
    title: str = ""
    subtitle: str = ""
    image: str = ""
    link: str = ""
    active: bool = True
    sort_order: int = 0

class HeroSlideUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    image: Optional[str] = None
    link: Optional[str] = None
    active: Optional[bool] = None
    sort_order: Optional[int] = None

class MarqueeTextCreate(BaseModel):
    text: str = ""
    active: bool = True
    sort_order: int = 0

class MarqueeTextUpdate(BaseModel):
    text: Optional[str] = None
    active: Optional[bool] = None
    sort_order: Optional[int] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

# ==================== AUTH ====================

def create_token(username: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    return jwt.encode({"sub": username, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

async def verify_token(token: str) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Token invalido")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalido o expirado")

async def get_current_admin(authorization: str = Query(None, alias="token")):
    """Get admin from query param token or Authorization header"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No autorizado")
    return await verify_token(authorization)

# Helper to parse row to dict
def row_to_product(row):
    keys = row.keys()
    images_raw = row["images"] if "images" in keys else "[]"
    try:
        images = json.loads(images_raw) if images_raw else []
    except (json.JSONDecodeError, TypeError):
        images = []

    # Backward compatibility: if images is empty but image exists, use it as the first image
    if (not isinstance(images, list) or len(images) == 0) and row["image"]:
        images = [row["image"]]

    return {
        "id": row["id"],
        "name": row["name"],
        "category": row["category"] if "category" in keys else "",
        "condition": row["condition"],
        "image": row["image"],
        "images": images,
        "colors": json.loads(row["colors"]),
        "storage_options": json.loads(row["storage_options"]),
        "badge": row["badge"],
        "available": json.loads(row["available"]),
        "price": row["price"] or "",
        "description": row["description"] or "",
        "featured_recommended": bool(row["featured_recommended"]),
        "featured_trending": bool(row["featured_trending"]),
        "sort_order": row["sort_order"],
    }

def row_to_category(row):
    return {
        "id": row["id"],
        "slug": row["slug"],
        "name": row["name"],
        "image": row["image"],
        "sort_order": row["sort_order"],
    }

def row_to_bubble(row):
    return {
        "id": row["id"],
        "model_id": row["model_id"],
        "label": row["label"],
        "image": row["image"],
        "sort_order": row["sort_order"],
    }

def row_to_hero_slide(row):
    return {
        "id": row["id"],
        "title": row["title"],
        "subtitle": row["subtitle"],
        "image": row["image"],
        "link": row["link"],
        "active": bool(row["active"]),
        "sort_order": row["sort_order"],
    }

def row_to_marquee(row):
    return {
        "id": row["id"],
        "text": row["text"],
        "active": bool(row["active"]),
        "sort_order": row["sort_order"],
    }

def row_to_service(row):
    return {
        "id": row["id"],
        "title": row["title"],
        "description": row["description"],
        "price": row["price"],
        "icon": row["icon"],
        "sort_order": row["sort_order"],
    }

# ==================== HEALTH ====================

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

# ==================== PUBLIC API ====================

@app.get("/api/products")
async def get_products(city: Optional[str] = None, condition: Optional[str] = None, model: Optional[str] = None):
    """Public endpoint - get all products with optional filters"""
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute("SELECT * FROM products ORDER BY sort_order ASC, id ASC")
        rows = await cursor.fetchall()
        products = [row_to_product(r) for r in rows]
        
        if city:
            products = [p for p in products if city in p["available"]]
        if condition and condition != "todos":
            cond_map = {"nuevos": "Nuevo", "semi-usados": "Semi-usado"}
            target = cond_map.get(condition.lower(), condition)
            products = [p for p in products if p["condition"] == target]
        if model and model != "todos":
            products = [p for p in products if p["category"] == model or model.lower() in p["name"].lower()]
        
        return {"products": products, "total": len(products)}
    finally:
        await db.close()

@app.get("/api/products/recommended")
async def get_recommended(city: Optional[str] = None):
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute("SELECT * FROM products WHERE featured_recommended = 1 ORDER BY sort_order ASC LIMIT 8")
        rows = await cursor.fetchall()
        products = [row_to_product(r) for r in rows]
        if city:
            products = [p for p in products if city in p["available"]]
        return {"products": products}
    finally:
        await db.close()

@app.get("/api/products/trending")
async def get_trending(city: Optional[str] = None):
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute("SELECT * FROM products WHERE featured_trending = 1 ORDER BY sort_order ASC LIMIT 8")
        rows = await cursor.fetchall()
        products = [row_to_product(r) for r in rows]
        if city:
            products = [p for p in products if city in p["available"]]
        return {"products": products}
    finally:
        await db.close()

@app.get("/api/products/{product_id}")
async def get_product(product_id: int):
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute("SELECT * FROM products WHERE id = ?", (product_id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        return row_to_product(row)
    finally:
        await db.close()

@app.get("/api/products/{product_id}/related")
async def get_related_products(product_id: int, city: Optional[str] = None):
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute("SELECT * FROM products WHERE id = ?", (product_id,))
        product = await cursor.fetchone()
        if not product:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        
        product_data = row_to_product(product)
        
        cursor = await db.execute("SELECT * FROM products WHERE id != ? ORDER BY sort_order ASC", (product_id,))
        rows = await cursor.fetchall()
        all_products = [row_to_product(r) for r in rows]
        
        if city:
            all_products = [p for p in all_products if city in p["available"]]
        
        # Related = same category first, then same condition
        same_cat = [p for p in all_products if p["category"] == product_data["category"]]
        same_cond = [p for p in all_products if p["condition"] == product_data["condition"] and p["category"] != product_data["category"]]
        related = (same_cat + same_cond)[:4]
        return {"products": related}
    finally:
        await db.close()

@app.get("/api/categories")
async def get_categories():
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute("SELECT * FROM categories ORDER BY sort_order ASC")
        rows = await cursor.fetchall()
        return {"categories": [row_to_category(r) for r in rows]}
    finally:
        await db.close()

@app.get("/api/bubbles")
async def get_bubbles():
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute("SELECT * FROM model_bubbles ORDER BY sort_order ASC")
        rows = await cursor.fetchall()
        return {"bubbles": [row_to_bubble(r) for r in rows]}
    finally:
        await db.close()

@app.get("/api/repair-services")
async def get_repair_services():
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute("SELECT * FROM repair_services ORDER BY sort_order ASC")
        rows = await cursor.fetchall()
        return {"services": [row_to_service(r) for r in rows]}
    finally:
        await db.close()

# ==================== AUTH ENDPOINTS ====================

@app.post("/api/admin/login")
async def admin_login(req: LoginRequest):
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute("SELECT * FROM admin_users WHERE username = ?", (req.username,))
        user = await cursor.fetchone()
        if not user or not bcrypt_lib.checkpw(req.password.encode('utf-8'), user["password_hash"].encode('utf-8')):
            raise HTTPException(status_code=401, detail="Credenciales incorrectas")
        token = create_token(user["username"])
        return {"token": token, "username": user["username"]}
    finally:
        await db.close()

@app.get("/api/admin/me")
async def admin_me(username: str = Depends(get_current_admin)):
    return {"username": username}

@app.post("/api/admin/change-password")
async def change_password(req: ChangePasswordRequest, username: str = Depends(get_current_admin)):
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute("SELECT * FROM admin_users WHERE username = ?", (username,))
        user = await cursor.fetchone()
        if not user or not bcrypt_lib.checkpw(req.current_password.encode('utf-8'), user["password_hash"].encode('utf-8')):
            raise HTTPException(status_code=400, detail="Contrasena actual incorrecta")
        new_hash = bcrypt_lib.hashpw(req.new_password.encode('utf-8'), bcrypt_lib.gensalt()).decode('utf-8')
        await db.execute("UPDATE admin_users SET password_hash = ? WHERE username = ?", (new_hash, username))
        await db.commit()
        return {"message": "Contrasena actualizada"}
    finally:
        await db.close()

# ==================== ADMIN PRODUCT CRUD ====================

@app.get("/api/admin/products")
async def admin_get_products(username: str = Depends(get_current_admin)):
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute("SELECT * FROM products ORDER BY sort_order ASC, id ASC")
        rows = await cursor.fetchall()
        return {"products": [row_to_product(r) for r in rows]}
    finally:
        await db.close()

@app.post("/api/admin/products")
async def admin_create_product(product: ProductCreate, username: str = Depends(get_current_admin)):
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        images = product.images or ([product.image] if product.image else [])
        primary_image = images[0] if images else product.image

        cursor = await db.execute(
            """INSERT INTO products (name, category, condition, image, images, colors, storage_options, badge, available, price, description, featured_recommended, featured_trending, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (product.name, product.category, product.condition, primary_image, json.dumps(images), json.dumps(product.colors),
             json.dumps(product.storage_options), product.badge, json.dumps(product.available),
             product.price, product.description, int(product.featured_recommended),
             int(product.featured_trending), product.sort_order)
        )
        await db.commit()
        new_id = cursor.lastrowid
        cursor = await db.execute("SELECT * FROM products WHERE id = ?", (new_id,))
        row = await cursor.fetchone()
        return row_to_product(row)
    finally:
        await db.close()

@app.put("/api/admin/products/{product_id}")
async def admin_update_product(product_id: int, product: ProductUpdate, username: str = Depends(get_current_admin)):
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute("SELECT * FROM products WHERE id = ?", (product_id,))
        existing = await cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        
        updates = {}
        if product.name is not None:
            updates["name"] = product.name
        if product.category is not None:
            updates["category"] = product.category
        if product.condition is not None:
            updates["condition"] = product.condition
        if product.image is not None:
            updates["image"] = product.image
        if product.images is not None:
            updates["images"] = json.dumps(product.images)
            updates["image"] = product.images[0] if len(product.images) > 0 else ""
        if product.colors is not None:
            updates["colors"] = json.dumps(product.colors)
        if product.storage_options is not None:
            updates["storage_options"] = json.dumps(product.storage_options)
        if product.badge is not None:
            updates["badge"] = product.badge
        if product.available is not None:
            updates["available"] = json.dumps(product.available)
        if product.price is not None:
            updates["price"] = product.price
        if product.description is not None:
            updates["description"] = product.description
        if product.featured_recommended is not None:
            updates["featured_recommended"] = int(product.featured_recommended)
        if product.featured_trending is not None:
            updates["featured_trending"] = int(product.featured_trending)
        if product.sort_order is not None:
            updates["sort_order"] = product.sort_order
        
        if updates:
            updates["updated_at"] = datetime.utcnow().isoformat()
            set_clause = ", ".join(f"{k} = ?" for k in updates)
            values = list(updates.values()) + [product_id]
            await db.execute(f"UPDATE products SET {set_clause} WHERE id = ?", values)
            await db.commit()
        
        cursor = await db.execute("SELECT * FROM products WHERE id = ?", (product_id,))
        row = await cursor.fetchone()
        return row_to_product(row)
    finally:
        await db.close()

@app.delete("/api/admin/products/{product_id}")
async def admin_delete_product(product_id: int, username: str = Depends(get_current_admin)):
    db = await aiosqlite.connect(DB_PATH)
    try:
        cursor = await db.execute("SELECT id FROM products WHERE id = ?", (product_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        await db.execute("DELETE FROM products WHERE id = ?", (product_id,))
        await db.commit()
        return {"message": "Producto eliminado"}
    finally:
        await db.close()

# ==================== ADMIN BUBBLE CRUD ====================

@app.get("/api/admin/bubbles")
async def admin_get_bubbles(username: str = Depends(get_current_admin)):
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute("SELECT * FROM model_bubbles ORDER BY sort_order ASC")
        rows = await cursor.fetchall()
        return {"bubbles": [row_to_bubble(r) for r in rows]}
    finally:
        await db.close()

@app.post("/api/admin/bubbles")
async def admin_create_bubble(bubble: BubbleCreate, username: str = Depends(get_current_admin)):
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute(
            "INSERT INTO model_bubbles (model_id, label, image, sort_order) VALUES (?, ?, ?, ?)",
            (bubble.model_id, bubble.label, bubble.image, bubble.sort_order)
        )
        await db.commit()
        new_id = cursor.lastrowid
        cursor = await db.execute("SELECT * FROM model_bubbles WHERE id = ?", (new_id,))
        row = await cursor.fetchone()
        return row_to_bubble(row)
    finally:
        await db.close()

@app.put("/api/admin/bubbles/{bubble_id}")
async def admin_update_bubble(bubble_id: int, bubble: BubbleUpdate, username: str = Depends(get_current_admin)):
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute("SELECT * FROM model_bubbles WHERE id = ?", (bubble_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Burbuja no encontrada")
        
        updates = {}
        if bubble.model_id is not None:
            updates["model_id"] = bubble.model_id
        if bubble.label is not None:
            updates["label"] = bubble.label
        if bubble.image is not None:
            updates["image"] = bubble.image
        if bubble.sort_order is not None:
            updates["sort_order"] = bubble.sort_order
        
        if updates:
            set_clause = ", ".join(f"{k} = ?" for k in updates)
            values = list(updates.values()) + [bubble_id]
            await db.execute(f"UPDATE model_bubbles SET {set_clause} WHERE id = ?", values)
            await db.commit()
        
        cursor = await db.execute("SELECT * FROM model_bubbles WHERE id = ?", (bubble_id,))
        row = await cursor.fetchone()
        return row_to_bubble(row)
    finally:
        await db.close()

@app.delete("/api/admin/bubbles/{bubble_id}")
async def admin_delete_bubble(bubble_id: int, username: str = Depends(get_current_admin)):
    db = await aiosqlite.connect(DB_PATH)
    try:
        cursor = await db.execute("SELECT id FROM model_bubbles WHERE id = ?", (bubble_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Burbuja no encontrada")
        await db.execute("DELETE FROM model_bubbles WHERE id = ?", (bubble_id,))
        await db.commit()
        return {"message": "Burbuja eliminada"}
    finally:
        await db.close()

# ==================== ADMIN CATEGORIES CRUD ====================

@app.get("/api/admin/categories")
async def admin_get_categories(username: str = Depends(get_current_admin)):
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute("SELECT * FROM categories ORDER BY sort_order ASC")
        rows = await cursor.fetchall()
        return {"categories": [row_to_category(r) for r in rows]}
    finally:
        await db.close()

@app.post("/api/admin/categories")
async def admin_create_category(cat: CategoryCreate, username: str = Depends(get_current_admin)):
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute(
            "INSERT INTO categories (slug, name, image, sort_order) VALUES (?, ?, ?, ?)",
            (cat.slug, cat.name, cat.image, cat.sort_order)
        )
        await db.commit()
        new_id = cursor.lastrowid
        cursor = await db.execute("SELECT * FROM categories WHERE id = ?", (new_id,))
        row = await cursor.fetchone()
        return row_to_category(row)
    finally:
        await db.close()

@app.put("/api/admin/categories/{cat_id}")
async def admin_update_category(cat_id: int, cat: CategoryUpdate, username: str = Depends(get_current_admin)):
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute("SELECT * FROM categories WHERE id = ?", (cat_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Categoria no encontrada")
        
        updates = {}
        if cat.slug is not None:
            updates["slug"] = cat.slug
        if cat.name is not None:
            updates["name"] = cat.name
        if cat.image is not None:
            updates["image"] = cat.image
        if cat.sort_order is not None:
            updates["sort_order"] = cat.sort_order
        
        if updates:
            set_clause = ", ".join(f"{k} = ?" for k in updates)
            values = list(updates.values()) + [cat_id]
            await db.execute(f"UPDATE categories SET {set_clause} WHERE id = ?", values)
            await db.commit()
        
        cursor = await db.execute("SELECT * FROM categories WHERE id = ?", (cat_id,))
        row = await cursor.fetchone()
        return row_to_category(row)
    finally:
        await db.close()

@app.delete("/api/admin/categories/{cat_id}")
async def admin_delete_category(cat_id: int, username: str = Depends(get_current_admin)):
    db = await aiosqlite.connect(DB_PATH)
    try:
        cursor = await db.execute("SELECT id FROM categories WHERE id = ?", (cat_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Categoria no encontrada")
        await db.execute("DELETE FROM categories WHERE id = ?", (cat_id,))
        await db.commit()
        return {"message": "Categoria eliminada"}
    finally:
        await db.close()

# ==================== ADMIN REPAIR SERVICES CRUD ====================

@app.get("/api/admin/repair-services")
async def admin_get_services(username: str = Depends(get_current_admin)):
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute("SELECT * FROM repair_services ORDER BY sort_order ASC")
        rows = await cursor.fetchall()
        return {"services": [row_to_service(r) for r in rows]}
    finally:
        await db.close()

@app.post("/api/admin/repair-services")
async def admin_create_service(service: RepairServiceCreate, username: str = Depends(get_current_admin)):
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute(
            "INSERT INTO repair_services (title, description, price, icon, sort_order) VALUES (?, ?, ?, ?, ?)",
            (service.title, service.description, service.price, service.icon, service.sort_order)
        )
        await db.commit()
        new_id = cursor.lastrowid
        cursor = await db.execute("SELECT * FROM repair_services WHERE id = ?", (new_id,))
        row = await cursor.fetchone()
        return row_to_service(row)
    finally:
        await db.close()

@app.put("/api/admin/repair-services/{service_id}")
async def admin_update_service(service_id: int, service: RepairServiceUpdate, username: str = Depends(get_current_admin)):
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute("SELECT * FROM repair_services WHERE id = ?", (service_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Servicio no encontrado")
        
        updates = {}
        if service.title is not None:
            updates["title"] = service.title
        if service.description is not None:
            updates["description"] = service.description
        if service.price is not None:
            updates["price"] = service.price
        if service.icon is not None:
            updates["icon"] = service.icon
        if service.sort_order is not None:
            updates["sort_order"] = service.sort_order
        
        if updates:
            set_clause = ", ".join(f"{k} = ?" for k in updates)
            values = list(updates.values()) + [service_id]
            await db.execute(f"UPDATE repair_services SET {set_clause} WHERE id = ?", values)
            await db.commit()
        
        cursor = await db.execute("SELECT * FROM repair_services WHERE id = ?", (service_id,))
        row = await cursor.fetchone()
        return row_to_service(row)
    finally:
        await db.close()

@app.delete("/api/admin/repair-services/{service_id}")
async def admin_delete_service(service_id: int, username: str = Depends(get_current_admin)):
    db = await aiosqlite.connect(DB_PATH)
    try:
        cursor = await db.execute("SELECT id FROM repair_services WHERE id = ?", (service_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Servicio no encontrado")
        await db.execute("DELETE FROM repair_services WHERE id = ?", (service_id,))
        await db.commit()
        return {"message": "Servicio eliminado"}
    finally:
        await db.close()

# ==================== HERO SLIDES (PUBLIC) ====================

@app.get("/api/hero-slides")
async def get_hero_slides():
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute("SELECT * FROM hero_slides WHERE active = 1 ORDER BY sort_order ASC")
        rows = await cursor.fetchall()
        return {"slides": [row_to_hero_slide(r) for r in rows]}
    finally:
        await db.close()

@app.get("/api/marquee-texts")
async def get_marquee_texts():
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute("SELECT * FROM marquee_texts WHERE active = 1 ORDER BY sort_order ASC")
        rows = await cursor.fetchall()
        return {"texts": [row_to_marquee(r) for r in rows]}
    finally:
        await db.close()

# ==================== ADMIN HERO SLIDES ====================

@app.get("/api/admin/hero-slides")
async def admin_get_hero_slides(username: str = Depends(get_current_admin)):
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute("SELECT * FROM hero_slides ORDER BY sort_order ASC")
        rows = await cursor.fetchall()
        return {"slides": [row_to_hero_slide(r) for r in rows]}
    finally:
        await db.close()

@app.post("/api/admin/hero-slides")
async def admin_create_hero_slide(slide: HeroSlideCreate, username: str = Depends(get_current_admin)):
    db = await aiosqlite.connect(DB_PATH)
    try:
        cursor = await db.execute(
            "INSERT INTO hero_slides (title, subtitle, image, link, active, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
            (slide.title, slide.subtitle, slide.image, slide.link, int(slide.active), slide.sort_order)
        )
        await db.commit()
        slide_id = cursor.lastrowid
        return {"message": "Slide creado", "id": slide_id}
    finally:
        await db.close()

@app.put("/api/admin/hero-slides/{slide_id}")
async def admin_update_hero_slide(slide_id: int, slide: HeroSlideUpdate, username: str = Depends(get_current_admin)):
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute("SELECT * FROM hero_slides WHERE id = ?", (slide_id,))
        existing = await cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Slide no encontrado")
        
        updates = {}
        if slide.title is not None: updates["title"] = slide.title
        if slide.subtitle is not None: updates["subtitle"] = slide.subtitle
        if slide.image is not None: updates["image"] = slide.image
        if slide.link is not None: updates["link"] = slide.link
        if slide.active is not None: updates["active"] = int(slide.active)
        if slide.sort_order is not None: updates["sort_order"] = slide.sort_order
        
        if updates:
            set_clause = ", ".join(f"{k} = ?" for k in updates)
            values = list(updates.values()) + [slide_id]
            await db.execute(f"UPDATE hero_slides SET {set_clause} WHERE id = ?", values)
            await db.commit()
        
        return {"message": "Slide actualizado"}
    finally:
        await db.close()

@app.delete("/api/admin/hero-slides/{slide_id}")
async def admin_delete_hero_slide(slide_id: int, username: str = Depends(get_current_admin)):
    db = await aiosqlite.connect(DB_PATH)
    try:
        await db.execute("DELETE FROM hero_slides WHERE id = ?", (slide_id,))
        await db.commit()
        return {"message": "Slide eliminado"}
    finally:
        await db.close()

@app.post("/api/admin/hero-slides/{slide_id}/toggle")
async def admin_toggle_hero_slide(slide_id: int, username: str = Depends(get_current_admin)):
    db = await aiosqlite.connect(DB_PATH)
    try:
        await db.execute("UPDATE hero_slides SET active = CASE WHEN active = 1 THEN 0 ELSE 1 END WHERE id = ?", (slide_id,))
        await db.commit()
        return {"message": "Slide actualizado"}
    finally:
        await db.close()

# ==================== ADMIN MARQUEE TEXTS ====================

@app.get("/api/admin/marquee-texts")
async def admin_get_marquee_texts(username: str = Depends(get_current_admin)):
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute("SELECT * FROM marquee_texts ORDER BY sort_order ASC")
        rows = await cursor.fetchall()
        return {"texts": [row_to_marquee(r) for r in rows]}
    finally:
        await db.close()

@app.post("/api/admin/marquee-texts")
async def admin_create_marquee_text(mt: MarqueeTextCreate, username: str = Depends(get_current_admin)):
    db = await aiosqlite.connect(DB_PATH)
    try:
        cursor = await db.execute(
            "INSERT INTO marquee_texts (text, active, sort_order) VALUES (?, ?, ?)",
            (mt.text, int(mt.active), mt.sort_order)
        )
        await db.commit()
        return {"message": "Texto creado", "id": cursor.lastrowid}
    finally:
        await db.close()

@app.put("/api/admin/marquee-texts/{text_id}")
async def admin_update_marquee_text(text_id: int, mt: MarqueeTextUpdate, username: str = Depends(get_current_admin)):
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        cursor = await db.execute("SELECT * FROM marquee_texts WHERE id = ?", (text_id,))
        existing = await cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Texto no encontrado")
        
        updates = {}
        if mt.text is not None: updates["text"] = mt.text
        if mt.active is not None: updates["active"] = int(mt.active)
        if mt.sort_order is not None: updates["sort_order"] = mt.sort_order
        
        if updates:
            set_clause = ", ".join(f"{k} = ?" for k in updates)
            values = list(updates.values()) + [text_id]
            await db.execute(f"UPDATE marquee_texts SET {set_clause} WHERE id = ?", values)
            await db.commit()
        
        return {"message": "Texto actualizado"}
    finally:
        await db.close()

@app.delete("/api/admin/marquee-texts/{text_id}")
async def admin_delete_marquee_text(text_id: int, username: str = Depends(get_current_admin)):
    db = await aiosqlite.connect(DB_PATH)
    try:
        await db.execute("DELETE FROM marquee_texts WHERE id = ?", (text_id,))
        await db.commit()
        return {"message": "Texto eliminado"}
    finally:
        await db.close()

# ==================== IMAGE UPLOAD ==

@app.post("/api/admin/upload")
async def upload_image(file: UploadFile = File(...), username: str = Depends(get_current_admin)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos de imagen")
    
    ext = os.path.splitext(file.filename or "image.jpg")[1] or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    with open(filepath, "wb") as f:
        content = await file.read()
        f.write(content)
    
    return {"url": f"/uploads/{filename}", "filename": filename}

# ==================== ADMIN STATS ====================

@app.get("/api/admin/stats")
async def admin_stats(username: str = Depends(get_current_admin)):
    db = await aiosqlite.connect(DB_PATH)
    try:
        cursor = await db.execute("SELECT COUNT(*) FROM products")
        total_products = (await cursor.fetchone())[0]
        
        cursor = await db.execute("SELECT COUNT(*) FROM products WHERE condition = 'Nuevo'")
        new_count = (await cursor.fetchone())[0]
        
        cursor = await db.execute("SELECT COUNT(*) FROM products WHERE condition = 'Semi-usado'")
        used_count = (await cursor.fetchone())[0]
        
        cursor = await db.execute("SELECT COUNT(*) FROM model_bubbles")
        bubble_count = (await cursor.fetchone())[0]
        
        cursor = await db.execute("SELECT COUNT(*) FROM repair_services")
        service_count = (await cursor.fetchone())[0]
        
        cursor = await db.execute("SELECT COUNT(*) FROM categories")
        category_count = (await cursor.fetchone())[0]
        
        cursor = await db.execute("SELECT COUNT(*) FROM hero_slides")
        slides_count = (await cursor.fetchone())[0]
        
        return {
            "total_products": total_products,
            "new_products": new_count,
            "used_products": used_count,
            "categories": category_count,
            "bubbles": bubble_count,
            "repair_services": service_count,
            "hero_slides": slides_count,
        }
    finally:
        await db.close()
