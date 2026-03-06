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
    
    await db.commit()
    await db.close()

async def seed_default_data():
    """Seed default data only if tables are empty"""
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    
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
        default_slides = [
            ("iPhone 17 Pro Max", "El mas poderoso. Disponible ahora.", "https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=1200&h=600&fit=crop", "#productos", 1, 0),
            ("MacBook Air M4", "Potencia portatil. Desde $4.999.990.", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&h=600&fit=crop", "#productos", 1, 1),
            ("Apple Watch Ultra 3", "Aventura sin limites.", "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=1200&h=600&fit=crop", "#productos", 1, 2),
            ("AirPods Pro 3", "Sonido inmersivo. Cancelacion total.", "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=1200&h=600&fit=crop", "#productos", 1, 3),
        ]
        for s in default_slides:
            await db.execute("INSERT INTO hero_slides (title, subtitle, image, link, active, sort_order) VALUES (?, ?, ?, ?, ?, ?)", s)
        await db.commit()

    # Seed marquee texts if empty
    cursor = await db.execute("SELECT COUNT(*) as cnt FROM marquee_texts")
    row = await cursor.fetchone()
    marquee_count = row[0]

    if marquee_count == 0:
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
        # Seed semi-usados
        semi_usados = [
            ("iPhone 12", "iphones", "Semi-usado", "https://images.unsplash.com/photo-1611472173362-3f53dbd65d80?w=400&h=500&fit=crop", '["#000000","#FFFFFF","#4169E1"]', '["128GB"]', None, '["duitama","tunja"]', "", "", 0, 0, 100),
            ("iPhone 12 Mini", "iphones", "Semi-usado", "https://images.unsplash.com/photo-1611472173362-3f53dbd65d80?w=400&h=500&fit=crop", '["#000000","#F28B82","#FFFFFF"]', '["128GB"]', None, '["duitama","tunja"]', "", "", 0, 0, 101),
            ("iPhone 12 Pro", "iphones", "Semi-usado", "https://images.unsplash.com/photo-1607936854279-55e8a4c64888?w=400&h=500&fit=crop", '["#4A4A4A","#FFD700","#1C1C1E"]', '["128GB","256GB"]', None, '["duitama","tunja"]', "", "", 0, 0, 102),
            ("iPhone 12 Pro Max", "iphones", "Semi-usado", "https://images.unsplash.com/photo-1607936854279-55e8a4c64888?w=400&h=500&fit=crop", '["#4A4A4A","#FFD700","#1C1C1E"]', '["128GB","256GB"]', None, '["duitama","tunja"]', "", "", 0, 0, 103),
            ("iPhone 13", "iphones", "Semi-usado", "https://images.unsplash.com/photo-1632633173522-47456de71b76?w=400&h=500&fit=crop", '["#1C1C1E","#F28B82","#AECBFA"]', '["128GB"]', None, '["duitama","tunja"]', "", "", 0, 0, 104),
            ("iPhone 13 Mini", "iphones", "Semi-usado", "https://images.unsplash.com/photo-1632633173522-47456de71b76?w=400&h=500&fit=crop", '["#1C1C1E","#F28B82","#FFFFFF"]', '["128GB"]', None, '["duitama","tunja"]', "", "", 0, 0, 105),
            ("iPhone 13 Pro", "iphones", "Semi-usado", "https://images.unsplash.com/photo-1638038772924-ef79cce2426d?w=400&h=500&fit=crop", '["#4A4A4A","#87CEEB","#FFD700"]', '["128GB","256GB"]', None, '["duitama","tunja"]', "", "", 0, 0, 106),
            ("iPhone 13 Pro Max", "iphones", "Semi-usado", "https://images.unsplash.com/photo-1638038772924-ef79cce2426d?w=400&h=500&fit=crop", '["#4A4A4A","#87CEEB","#FFD700"]', '["128GB","256GB"]', None, '["duitama","tunja"]', "", "", 0, 0, 107),
            ("iPhone 14", "iphones", "Semi-usado", "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400&h=500&fit=crop", '["#000000","#E3D0B9","#F28B82"]', '["128GB"]', None, '["duitama","tunja"]', "", "", 0, 0, 108),
            ("iPhone 14 Plus", "iphones", "Semi-usado", "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400&h=500&fit=crop", '["#000000","#E3D0B9","#AECBFA"]', '["128GB"]', None, '["duitama","tunja"]', "", "", 0, 0, 109),
            ("iPhone 14 Pro", "iphones", "Semi-usado", "https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?w=400&h=500&fit=crop", '["#1C1C1E","#6B5B4F","#F5F5DC"]', '["128GB","256GB"]', None, '["duitama","tunja"]', "", "", 0, 0, 110),
            ("iPhone 14 Pro Max", "iphones", "Semi-usado", "https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?w=400&h=500&fit=crop", '["#1C1C1E","#6B5B4F","#F5F5DC"]', '["128GB","256GB","512GB"]', None, '["duitama","tunja"]', "", "", 0, 0, 111),
            ("iPhone 15", "iphones", "Semi-usado", "https://images.unsplash.com/photo-1696446702183-cbd13d78e1e7?w=400&h=500&fit=crop", '["#000000","#F28B82","#AECBFA"]', '["128GB"]', None, '["duitama","tunja"]', "", "", 0, 0, 112),
            ("iPhone 15 Plus", "iphones", "Semi-usado", "https://images.unsplash.com/photo-1696446702183-cbd13d78e1e7?w=400&h=500&fit=crop", '["#000000","#F28B82","#AECBFA"]', '["128GB"]', None, '["duitama","tunja"]', "", "", 0, 0, 113),
            ("iPhone 15 Pro", "iphones", "Semi-usado", "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=500&fit=crop", '["#1C1C1E","#F5F5DC","#4A4A4A"]', '["128GB","256GB"]', None, '["duitama","tunja"]', "", "", 0, 0, 114),
            ("iPhone 15 Pro Max", "iphones", "Semi-usado", "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=500&fit=crop", '["#1C1C1E","#F5F5DC","#4A4A4A"]', '["256GB","512GB","1TB"]', None, '["duitama","tunja"]', "", "", 0, 0, 115),
            ("iPhone 16", "iphones", "Semi-usado", "https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=400&h=500&fit=crop", '["#000000","#AECBFA","#F5F5DC"]', '["128GB"]', None, '["duitama","tunja"]', "", "", 0, 0, 116),
            ("iPhone 16 Plus", "iphones", "Semi-usado", "https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=400&h=500&fit=crop", '["#000000","#AECBFA","#F5F5DC"]', '["128GB"]', None, '["duitama","tunja"]', "", "", 0, 0, 117),
            ("iPhone 16 Pro", "iphones", "Semi-usado", "https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=400&h=500&fit=crop", '["#1C1C1E","#E3D0B9","#F5F5DC"]', '["128GB","256GB","512GB"]', None, '["duitama","tunja"]', "", "", 0, 0, 118),
            ("iPhone 16 Pro Max", "iphones", "Semi-usado", "https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=400&h=500&fit=crop", '["#1C1C1E","#E3D0B9","#F5F5DC"]', '["256GB","512GB","1TB"]', None, '["duitama","tunja"]', "", "", 0, 0, 119),
            ("iPhone 17", "iphones", "Semi-usado", "https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=400&h=500&fit=crop", '["#1C1C1E","#F5F5DC"]', '["256GB"]', None, '["duitama","tunja"]', "", "", 0, 0, 120),
            ("iPhone Air", "iphones", "Semi-usado", "https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=400&h=500&fit=crop", '["#1C1C1E","#F5F5DC","#87CEEB"]', '["256GB"]', None, '["duitama","tunja"]', "", "", 0, 0, 121),
            ("iPhone 17 Pro", "iphones", "Semi-usado", "https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=400&h=500&fit=crop", '["#1C1C1E","#4A4A4A","#F5F5DC"]', '["256GB","512GB","1TB"]', None, '["duitama","tunja"]', "", "", 0, 0, 122),
            ("iPhone 17 Pro Max", "iphones", "Semi-usado", "https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=400&h=500&fit=crop", '["#1C1C1E","#4A4A4A","#F5F5DC"]', '["256GB","512GB","1TB","2TB"]', None, '["duitama","tunja"]', "", "", 0, 0, 123),
        ]
        
        # Seed nuevos iPhones
        nuevos = [
            ("iPhone 14", "iphones", "Nuevo", "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400&h=500&fit=crop", '["#000000","#E3D0B9","#F28B82"]', '["128GB"]', "Nuevo", '["duitama","tunja"]', "", "", 1, 0, 200),
            ("iPhone 15", "iphones", "Nuevo", "https://images.unsplash.com/photo-1696446702183-cbd13d78e1e7?w=400&h=500&fit=crop", '["#000000","#F28B82","#AECBFA"]', '["128GB"]', "Nuevo", '["duitama","tunja"]', "", "", 1, 0, 201),
            ("iPhone 16", "iphones", "Nuevo", "https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=400&h=500&fit=crop", '["#000000","#AECBFA","#F5F5DC"]', '["128GB"]', "Nuevo", '["duitama","tunja"]', "", "", 0, 1, 202),
            ("iPhone 17", "iphones", "Nuevo", "https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=400&h=500&fit=crop", '["#1C1C1E","#F5F5DC"]', '["256GB"]', "Nuevo", '["duitama","tunja"]', "", "", 1, 1, 203),
            ("iPhone Air", "iphones", "Nuevo", "https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=400&h=500&fit=crop", '["#1C1C1E","#F5F5DC","#87CEEB"]', '["256GB"]', "Nuevo", '["duitama","tunja"]', "", "", 1, 0, 204),
            ("iPhone 17 Pro", "iphones", "Nuevo", "https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=400&h=500&fit=crop", '["#1C1C1E","#4A4A4A","#F5F5DC"]', '["256GB","512GB"]', "Nuevo", '["duitama","tunja"]', "", "", 1, 1, 205),
            ("iPhone 17 Pro Max", "iphones", "Nuevo", "https://images.unsplash.com/photo-1710023038956-3dce1ef3ac38?w=400&h=500&fit=crop", '["#1C1C1E","#4A4A4A","#F5F5DC"]', '["256GB","512GB","1TB","2TB"]', "Nuevo", '["duitama","tunja"]', "", "", 1, 0, 206),
        ]
        
        # Seed iPads
        ipads_data = [
            ("iPad A16 128GB", "ipads", "Nuevo", "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=500&fit=crop", '["#C0C0C0","#87CEEB","#FFD700"]', '["128GB"]', "Nuevo", '["duitama","tunja"]', "", "", 0, 0, 300),
            ("iPad A16 256GB", "ipads", "Nuevo", "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=500&fit=crop", '["#C0C0C0","#87CEEB","#FFD700"]', '["256GB"]', "Nuevo", '["duitama","tunja"]', "", "", 0, 0, 301),
            ('iPad Air 11" M3', "ipads", "Nuevo", "https://images.unsplash.com/photo-1587033411391-5d9e51cce126?w=400&h=500&fit=crop", '["#C0C0C0","#4A4A4A","#E8D0AA"]', '["128GB","256GB"]', "Nuevo", '["duitama","tunja"]', "", "", 1, 0, 302),
            ('iPad Air 13" M3', "ipads", "Nuevo", "https://images.unsplash.com/photo-1587033411391-5d9e51cce126?w=400&h=500&fit=crop", '["#C0C0C0","#4A4A4A","#E8D0AA"]', '["128GB","256GB"]', "Nuevo", '["duitama","tunja"]', "", "", 1, 0, 303),
            ('iPad Pro 11"', "ipads", "Nuevo", "https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=400&h=500&fit=crop", '["#C0C0C0","#1C1C1E"]', '["256GB","512GB","1TB"]', "Nuevo", '["duitama","tunja"]', "", "", 1, 1, 304),
            ('iPad Pro 13"', "ipads", "Nuevo", "https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=400&h=500&fit=crop", '["#C0C0C0","#1C1C1E"]', '["256GB","512GB","1TB"]', "Nuevo", '["duitama","tunja"]', "", "", 1, 0, 305),
        ]
        
        # Seed MacBook
        macbooks_data = [
            ('MacBook Air 13" M4', "macbook", "Nuevo", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=500&fit=crop", '["#C0C0C0","#4A4A4A","#E8D0AA","#1C1C1E"]', '["256GB/16GB"]', "Nuevo", '["duitama","tunja"]', "", "", 1, 1, 400),
        ]
        
        # Seed AirPods
        airpods_data = [
            ("AirPods 4", "airpods", "Nuevo", "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&h=500&fit=crop", '["#FFFFFF"]', '[]', "Nuevo", '["duitama","tunja"]', "", "", 0, 0, 500),
            ("AirPods 4 ANC", "airpods", "Nuevo", "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&h=500&fit=crop", '["#FFFFFF"]', '[]', "Nuevo", '["duitama","tunja"]', "", "", 1, 0, 501),
            ("AirPods Pro 2", "airpods", "Nuevo", "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=500&fit=crop", '["#FFFFFF"]', '[]', "Nuevo", '["duitama","tunja"]', "", "", 1, 1, 502),
            ("AirPods Pro 3", "airpods", "Nuevo", "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=500&fit=crop", '["#FFFFFF"]', '[]', "Nuevo", '["duitama","tunja"]', "", "", 1, 0, 503),
        ]
        
        # Seed Apple Watch
        watches_data = [
            ("Apple Watch SE2", "apple-watch", "Nuevo", "https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=400&h=500&fit=crop", '["#C0C0C0","#1C1C1E","#E8D0AA"]', '["42mm","46mm"]', "Nuevo", '["duitama","tunja"]', "", "", 0, 0, 600),
            ("Apple Watch SE3", "apple-watch", "Nuevo", "https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=400&h=500&fit=crop", '["#C0C0C0","#1C1C1E","#E8D0AA"]', '["42mm","46mm"]', "Nuevo", '["duitama","tunja"]', "", "", 0, 0, 601),
            ("Apple Watch Series 10", "apple-watch", "Nuevo", "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&h=500&fit=crop", '["#C0C0C0","#1C1C1E","#E8D0AA"]', '["42mm","46mm"]', "Nuevo", '["duitama","tunja"]', "", "", 0, 1, 602),
            ("Apple Watch Series 11", "apple-watch", "Nuevo", "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&h=500&fit=crop", '["#C0C0C0","#1C1C1E","#4A4A4A"]', '["42mm","46mm"]', "Nuevo", '["duitama","tunja"]', "", "", 1, 1, 603),
            ("Apple Watch Ultra 2", "apple-watch", "Nuevo", "https://images.unsplash.com/photo-1694618432450-44056bd70e87?w=400&h=500&fit=crop", '["#E8D0AA","#1C1C1E"]', '["49mm"]', "Nuevo", '["duitama","tunja"]', "", "", 1, 0, 604),
            ("Apple Watch Ultra 3", "apple-watch", "Nuevo", "https://images.unsplash.com/photo-1694618432450-44056bd70e87?w=400&h=500&fit=crop", '["#E8D0AA","#1C1C1E"]', '["49mm"]', "Nuevo", '["duitama","tunja"]', "", "", 1, 1, 605),
        ]
        
        # Seed Accesorios
        accesorios_data = [
            ("Apple Pencil USB-C", "accesorios", "Nuevo", "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&h=500&fit=crop", '["#FFFFFF"]', '[]', None, '["duitama","tunja"]', "", "Compatible con iPad A16", 0, 0, 700),
            ("Apple Pencil Pro", "accesorios", "Nuevo", "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&h=500&fit=crop", '["#FFFFFF"]', '[]', None, '["duitama","tunja"]', "", "Compatible con iPad Air y iPad Pro", 0, 0, 701),
        ]
        
        for p in semi_usados + nuevos + ipads_data + macbooks_data + airpods_data + watches_data + accesorios_data:
            # p = (name, category, condition, image, colors_json, storage_json, badge, available_json, price, description, featured_recommended, featured_trending, sort_order)
            images_json = json.dumps([p[3]]) if p[3] else '[]'
            await db.execute(
                """INSERT INTO products (name, category, condition, image, images, colors, storage_options, badge, available, price, description, featured_recommended, featured_trending, sort_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                p[:4] + (images_json,) + p[4:]
            )
    
    # Check if bubbles exist
    cursor = await db.execute("SELECT COUNT(*) as cnt FROM model_bubbles")
    row = await cursor.fetchone()
    bubble_count = row[0]
    
    if bubble_count == 0:
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
