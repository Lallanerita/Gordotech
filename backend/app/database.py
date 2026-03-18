import aiosqlite
import os
import json

# Use /data/app.db for persistent storage in production, local for dev
DB_PATH = os.environ.get("DB_PATH", "/data/app.db") if os.path.exists("/data") else "app.db"

async def get_db():
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")  # Better concurrent read performance
    await db.execute("PRAGMA synchronous=NORMAL")  # Faster writes
    await db.execute("PRAGMA cache_size=-64000")  # 64MB cache
    await db.execute("PRAGMA busy_timeout=5000")  # 5s timeout for locks
    try:
        yield db
    finally:
        await db.close()

async def init_db():
    db = await aiosqlite.connect(DB_PATH)
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA synchronous=NORMAL")
    await db.execute("PRAGMA cache_size=-64000")
    
    # Categories table
    await db.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            image TEXT NOT NULL DEFAULT '',
            sort_order INTEGER DEFAULT 0
        )
    """)
    
    # Products table
    await db.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT '',
            condition TEXT NOT NULL DEFAULT 'Semi-usado',
            image TEXT NOT NULL DEFAULT '',
            images TEXT NOT NULL DEFAULT '[]',
            colors TEXT NOT NULL DEFAULT '[]',
            storage_options TEXT NOT NULL DEFAULT '[]',
            badge TEXT,
            available TEXT NOT NULL DEFAULT '["duitama","tunja"]',
            price TEXT DEFAULT '',
            description TEXT DEFAULT '',
            featured_recommended INTEGER DEFAULT 0,
            featured_trending INTEGER DEFAULT 0,
            sort_order INTEGER DEFAULT 0,
            model_3d TEXT DEFAULT '',
            old_price TEXT DEFAULT '',
            color_images TEXT NOT NULL DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Migration: add category column if missing
    try:
        await db.execute("SELECT category FROM products LIMIT 1")
    except Exception:
        await db.execute("ALTER TABLE products ADD COLUMN category TEXT NOT NULL DEFAULT ''")

    # Migration: add images column if missing (JSON array of image URLs)
    try:
        await db.execute("SELECT images FROM products LIMIT 1")
    except Exception:
        await db.execute("ALTER TABLE products ADD COLUMN images TEXT NOT NULL DEFAULT '[]'")

    # Migration: add model_3d column if missing
    try:
        await db.execute("SELECT model_3d FROM products LIMIT 1")
    except Exception:
        await db.execute("ALTER TABLE products ADD COLUMN model_3d TEXT DEFAULT ''")

    # Migration: add old_price column if missing
    try:
        await db.execute("SELECT old_price FROM products LIMIT 1")
    except Exception:
        await db.execute("ALTER TABLE products ADD COLUMN old_price TEXT DEFAULT ''")

    # Migration: add color_images column if missing (JSON object mapping color -> image URL)
    try:
        await db.execute("SELECT color_images FROM products LIMIT 1")
    except Exception:
        await db.execute("ALTER TABLE products ADD COLUMN color_images TEXT NOT NULL DEFAULT '{}'")

    
    # Model bubbles table
    await db.execute("""
        CREATE TABLE IF NOT EXISTS model_bubbles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            model_id TEXT NOT NULL UNIQUE,
            label TEXT NOT NULL,
            image TEXT NOT NULL DEFAULT '',
            sort_order INTEGER DEFAULT 0
        )
    """)
    
    # Admin users table
    await db.execute("""
        CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Repair services table
    await db.execute("""
        CREATE TABLE IF NOT EXISTS repair_services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            price TEXT NOT NULL DEFAULT '',
            icon TEXT NOT NULL DEFAULT 'Smartphone',
            sort_order INTEGER DEFAULT 0
        )
    """)
    
    # Site settings table
    await db.execute("""
        CREATE TABLE IF NOT EXISTS site_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL DEFAULT ''
        )
    """)

    # Hero slides table
    await db.execute("""
        CREATE TABLE IF NOT EXISTS hero_slides (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL DEFAULT '',
            subtitle TEXT NOT NULL DEFAULT '',
            image TEXT NOT NULL DEFAULT '',
            video_url TEXT NOT NULL DEFAULT '',
            link TEXT NOT NULL DEFAULT '',
            active INTEGER NOT NULL DEFAULT 1,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Migration: add video_url column to hero_slides if missing
    try:
        await db.execute("SELECT video_url FROM hero_slides LIMIT 1")
    except Exception:
        await db.execute("ALTER TABLE hero_slides ADD COLUMN video_url TEXT NOT NULL DEFAULT ''")


    # Marquee texts table
    await db.execute("""
        CREATE TABLE IF NOT EXISTS marquee_texts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL DEFAULT '',
            active INTEGER NOT NULL DEFAULT 1,
            sort_order INTEGER DEFAULT 0
        )
    """)

    # Sucursales table
    await db.execute("""
        CREATE TABLE IF NOT EXISTS sucursales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL DEFAULT '',
            slug TEXT NOT NULL DEFAULT '',
            address TEXT NOT NULL DEFAULT '',
            city TEXT NOT NULL DEFAULT '',
            image TEXT NOT NULL DEFAULT '',
            whatsapp TEXT NOT NULL DEFAULT '',
            instagram TEXT NOT NULL DEFAULT '',
            tiktok TEXT NOT NULL DEFAULT '',
            phone TEXT NOT NULL DEFAULT '',
            description TEXT NOT NULL DEFAULT '',
            sort_order INTEGER DEFAULT 0,
            active INTEGER NOT NULL DEFAULT 1
        )
    """)

    # Reviews table (resenas)
    await db.execute("""
        CREATE TABLE IF NOT EXISTS resenas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sucursal_slug TEXT NOT NULL DEFAULT '',
            customer_name TEXT NOT NULL DEFAULT '',
            rating INTEGER NOT NULL DEFAULT 5,
            text TEXT NOT NULL DEFAULT '',
            sort_order INTEGER DEFAULT 0,
            active INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Product variants table (storage + color + price combinations)
    await db.execute("""
        CREATE TABLE IF NOT EXISTS product_variants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            storage TEXT NOT NULL DEFAULT '',
            color TEXT NOT NULL DEFAULT '',
            price TEXT NOT NULL DEFAULT '',
            sort_order INTEGER DEFAULT 0,
            active INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
    """)
    
    await db.commit()
    await db.close()

def _load_seed_data():
    """Load seed data from seed_data.json file."""
    seed_path = os.path.join(os.path.dirname(__file__), "seed_data.json")
    if os.path.exists(seed_path):
        with open(seed_path, "r") as f:
            return json.load(f)
    return None

async def seed_default_data():
    """Seed default data only if tables are empty. Loads real product data from seed_data.json."""
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row

    seed = _load_seed_data()
    
    # Check if products exist
    cursor = await db.execute("SELECT COUNT(*) as cnt FROM products")
    row = await cursor.fetchone()
    product_count = row[0]
    
    # Seed categories if empty
    cursor = await db.execute("SELECT COUNT(*) as cnt FROM categories")
    row = await cursor.fetchone()
    cat_count = row[0]
    
    # Seed hero slides if empty
    cursor = await db.execute("SELECT COUNT(*) as cnt FROM hero_slides")
    row = await cursor.fetchone()
    slides_count = row[0]
    
    if slides_count == 0:
        if seed and seed.get("hero_slides"):
            for s in seed["hero_slides"]:
                await db.execute(
                    "INSERT INTO hero_slides (title, subtitle, image, video_url, link, active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (s.get("title", ""), s.get("subtitle", ""), s.get("image", ""), s.get("video_url", ""), s.get("link", ""), 1 if s.get("active", True) else 0, s.get("sort_order", 0))
                )
        else:
            default_slides = [
                ("iPhone 17 Pro Max", "El mas poderoso. Disponible ahora.", "https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=1200&h=600&fit=crop", "", "#productos", 1, 0),
                ("MacBook Air M4", "Potencia portatil. Desde $4.999.990.", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&h=600&fit=crop", "", "#productos", 1, 1),
                ("Apple Watch Ultra 3", "Aventura sin limites.", "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=1200&h=600&fit=crop", "", "#productos", 1, 2),
                ("AirPods Pro 3", "Sonido inmersivo. Cancelacion total.", "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=1200&h=600&fit=crop", "", "#productos", 1, 3),
            ]
            for s in default_slides:
                await db.execute("INSERT INTO hero_slides (title, subtitle, image, video_url, link, active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)", s)
        await db.commit()

    # Seed marquee texts if empty
    cursor = await db.execute("SELECT COUNT(*) as cnt FROM marquee_texts")
    row = await cursor.fetchone()
    marquee_count = row[0]

    if marquee_count == 0:
        if seed and seed.get("marquee_texts"):
            for m in seed["marquee_texts"]:
                await db.execute(
                    "INSERT INTO marquee_texts (text, active, sort_order) VALUES (?, ?, ?)",
                    (m.get("text", ""), 1 if m.get("active", True) else 0, m.get("sort_order", 0))
                )
        else:
            default_marquees = [
                ("Gordotech - Tu destino Apple en Boyaca", 1, 0),
                ("Garantia en todos nuestros productos", 1, 1),
                ("Envios a toda Colombia", 1, 2),
                ("iPhone nuevos y semi-usados al mejor precio", 1, 3),
            ]
            for m in default_marquees:
                await db.execute("INSERT INTO marquee_texts (text, active, sort_order) VALUES (?, ?, ?)", m)
        await db.commit()

    if cat_count == 0:
        default_categories = [
            ("iphones", "iPhones", "https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=300&h=300&fit=crop", 0),
            ("ipads", "iPads", "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&h=300&fit=crop", 1),
            ("macbook", "MacBook", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop", 2),
            ("airpods", "AirPods", "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=300&h=300&fit=crop", 3),
            ("apple-watch", "Apple Watch", "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=300&h=300&fit=crop", 4),
            ("accesorios", "Accesorios", "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=300&h=300&fit=crop", 5),
        ]
        for c in default_categories:
            await db.execute("INSERT INTO categories (slug, name, image, sort_order) VALUES (?, ?, ?, ?)", c)
        await db.commit()
    
    if product_count == 0:
        if seed and seed.get("products"):
            # Load real products from seed_data.json (with permanent Fly.io image URLs)
            for p in seed["products"]:
                colors = json.dumps(p.get("colors", []))
                storage = json.dumps(p.get("storage_options", []))
                available = json.dumps(p.get("available", ["duitama"]))
                images = json.dumps(p.get("images", []))
                color_images = json.dumps(p.get("color_images", {}))
                await db.execute(
                    """INSERT INTO products (name, category, condition, image, images, colors, storage_options, badge, available, price, old_price, description, featured_recommended, featured_trending, sort_order, model_3d, color_images)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        p.get("name", ""),
                        p.get("category", ""),
                        p.get("condition", "Semi-usado"),
                        p.get("image", ""),
                        images,
                        colors,
                        storage,
                        p.get("badge"),
                        available,
                        p.get("price", ""),
                        p.get("old_price", ""),
                        p.get("description", ""),
                        1 if p.get("featured_recommended") else 0,
                        1 if p.get("featured_trending") else 0,
                        p.get("sort_order", 0),
                        p.get("model_3d", ""),
                        color_images,
                    )
                )
        else:
            # Fallback: minimal placeholder products if seed_data.json not found
            fallback_products = [
                ("iPhone 17 Pro Max", "iphones", "Nuevo", "", '[]', '[]', '[]', "Nuevo", '["duitama"]', "", "", 1, 0, 100),
            ]
            for p in fallback_products:
                await db.execute(
                    """INSERT INTO products (name, category, condition, image, images, colors, storage_options, badge, available, price, description, featured_recommended, featured_trending, sort_order)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    p
                )
    
    # Check if bubbles exist
    cursor = await db.execute("SELECT COUNT(*) as cnt FROM model_bubbles")
    row = await cursor.fetchone()
    bubble_count = row[0]
    
    if bubble_count == 0:
        if seed and seed.get("bubbles"):
            for b in seed["bubbles"]:
                await db.execute(
                    "INSERT INTO model_bubbles (model_id, label, image, sort_order) VALUES (?, ?, ?, ?)",
                    (b.get("model_id", ""), b.get("label", ""), b.get("image", ""), b.get("sort_order", 0))
                )
        else:
            bubbles = [
                ("todos", "Todos", "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&h=300&fit=crop", 0),
                ("iphones", "iPhones", "https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=300&h=300&fit=crop", 1),
                ("ipads", "iPads", "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&h=300&fit=crop", 2),
                ("macbook", "MacBook", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop", 3),
                ("airpods", "AirPods", "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=300&h=300&fit=crop", 4),
                ("apple watch", "Apple Watch", "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=300&h=300&fit=crop", 5),
                ("accesorios", "Accesorios", "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=300&h=300&fit=crop", 6),
            ]
            for b in bubbles:
                await db.execute(
                    "INSERT INTO model_bubbles (model_id, label, image, sort_order) VALUES (?, ?, ?, ?)", b
                )
    
    # Check if repair services exist
    cursor = await db.execute("SELECT COUNT(*) as cnt FROM repair_services")
    row = await cursor.fetchone()
    if row[0] == 0:
        if seed and seed.get("repair_services"):
            for s in seed["repair_services"]:
                await db.execute(
                    "INSERT INTO repair_services (title, description, price, icon, sort_order) VALUES (?, ?, ?, ?, ?)",
                    (s.get("title", ""), s.get("description", ""), s.get("price", ""), s.get("icon", "Smartphone"), s.get("sort_order", 0))
                )
        else:
            services = [
                ("Cambio de Pantalla", "Pantallas originales y compatibles para todos los modelos de iPhone", "Desde $150.000", "Smartphone", 0),
                ("Cambio de Bateria", "Baterias de alta calidad con garantia de 6 meses", "Desde $120.000", "Zap", 1),
                ("Reparacion de Placa", "Microelectronica avanzada para solucionar problemas de placa", "Consultar", "Shield", 2),
                ("Diagnostico Gratis", "Te decimos exactamente que tiene tu equipo sin costo alguno", "Gratis", "Award", 3),
            ]
            for s in services:
                await db.execute(
                    "INSERT INTO repair_services (title, description, price, icon, sort_order) VALUES (?, ?, ?, ?, ?)", s
                )
    
    # Seed sucursales if empty
    cursor = await db.execute("SELECT COUNT(*) as cnt FROM sucursales")
    row = await cursor.fetchone()
    if row[0] == 0:
        if seed and seed.get("sucursales"):
            for s in seed["sucursales"]:
                await db.execute(
                    "INSERT INTO sucursales (name, slug, address, city, image, whatsapp, instagram, tiktok, phone, description, sort_order, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (s.get("name", ""), s.get("slug", ""), s.get("address", ""), s.get("city", ""), s.get("image", ""), s.get("whatsapp", ""), s.get("instagram", ""), s.get("tiktok", ""), s.get("phone", ""), s.get("description", ""), s.get("sort_order", 0), 1 if s.get("active", True) else 0)
                )
        else:
            default_sucursales = [
                ("Gordotech Duitama", "duitama", "Pasaje Comercial Solano, Local 102", "Duitama", "", "573144810431", "https://www.instagram.com/gordotechduitama", "https://www.tiktok.com/@gordotech1", "+57 314 481 0431", "Tu destino Apple en Duitama", 0, 1),
                ("Gordotech Tunja", "tunja", "CC. Unicentro, Entrada 1, Isla Comercial", "Tunja", "", "573219863883", "https://www.instagram.com/gordotechtunja", "https://www.tiktok.com/@gordotech1", "+57 321 986 3883", "Tu destino Apple en Tunja", 1, 1),
                ("Clinica de Celulares", "clinica", "San Andresito de la 18, Local 11", "Duitama", "", "573213815465", "", "", "+57 321 381 5465", "Reparacion profesional de iPhones - Diagnostico Gratis", 2, 1),
            ]
            for s in default_sucursales:
                await db.execute(
                    "INSERT INTO sucursales (name, slug, address, city, image, whatsapp, instagram, tiktok, phone, description, sort_order, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", s
                )
        await db.commit()

    # Seed resenas if empty
    cursor = await db.execute("SELECT COUNT(*) as cnt FROM resenas")
    row = await cursor.fetchone()
    if row[0] == 0:
        if seed and seed.get("resenas"):
            for r in seed["resenas"]:
                await db.execute(
                    "INSERT INTO resenas (sucursal_slug, customer_name, rating, text, sort_order, active) VALUES (?, ?, ?, ?, ?, ?)",
                    (r.get("sucursal_slug", ""), r.get("customer_name", ""), r.get("rating", 5), r.get("text", ""), r.get("sort_order", 0), 1 if r.get("active", True) else 0)
                )
        else:
            default_resenas = [
                ("duitama", "Sara Corredor", 5, "Excelente servicio, los equipos en muy buen estado, siempre te reciben con la mejor actitud.", 0, 1),
                ("duitama", "Juan Morales", 5, "Excelente atencion, los dispositivos son muy confiables y muy accesibles.", 1, 1),
                ("duitama", "Erik Hernandez", 5, "Excelente servicio muy serios y buena atencion.", 2, 1),
                ("duitama", "Andres Salcedo", 5, "Excelente, equipos en buen estado, con sus garantias respectivas y en excelentes condiciones de funcionamiento.", 3, 1),
                ("duitama", "Sergio Salcedo", 5, "Excelente servicio y muy amable la muchacha que me atendio Daniela 10/10.", 4, 1),
                ("duitama", "Deisy Diaz", 5, "Tuve una experiencia muy bonita, los vendedores son muy amables y le recomiendo, los felicito.", 5, 1),
                ("duitama", "Lucyca", 5, "Excelente servicio, me senti comoda, voy a volver y a recomendar a mis amigos y conocidos.", 6, 1),
                ("tunja", "Juan Fernando G.", 5, "Hoy compre un iPhone 17 pro, excelente atencion de las chicas y productos totalmente originales 10/10.", 0, 1),
                ("tunja", "Sol Jacome", 5, "Los visite en Unicentro Tunja y muy buenos los precios, adquiri con ellos mi 17 pro.", 1, 1),
                ("tunja", "Juanita Sosa", 5, "Super recomendado, tienen todos los productos de Apple con excelentes precios y una buena atencion.", 2, 1),
                ("tunja", "Valentina Rodriguez", 5, "Visite la tienda en Unicentro Tunja para ver algunas MacBook y me gusto mucho la experiencia. La atencion fue buena y me explicaron sobre los equipos. Recomendado.", 3, 1),
                ("tunja", "Luis A. Rodriguez", 5, "La atencion, los precios y los equipos son los mejores. Gran experiencia.", 4, 1),
                ("clinica", "Sergio Melendez", 5, "Buena experiencia arreglando mi S24, rapido y buen servicio.", 0, 1),
                ("clinica", "Sarai Daniela S.", 4, "Buen servicio tecnico, atencion rapida y profesional.", 1, 1),
            ]
            for r in default_resenas:
                await db.execute(
                    "INSERT INTO resenas (sucursal_slug, customer_name, rating, text, sort_order, active) VALUES (?, ?, ?, ?, ?, ?)", r
                )
        await db.commit()

    # Check if admin exists
    cursor = await db.execute("SELECT COUNT(*) as cnt FROM admin_users")
    row = await cursor.fetchone()
    if row[0] == 0:
        import bcrypt as bcrypt_lib
        password_hash = bcrypt_lib.hashpw("gordotech2024".encode('utf-8'), bcrypt_lib.gensalt()).decode('utf-8')
        await db.execute(
            "INSERT INTO admin_users (username, password_hash) VALUES (?, ?)",
            ("admin", password_hash)
        )
    
    await db.commit()
    await db.close()
