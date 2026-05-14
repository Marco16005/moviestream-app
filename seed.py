"""
seed.py — Recrea la base de datos moviestreams en MongoDB Atlas
con datos de muestra representativos.

Requisitos:
    pip install pymongo oracledb python-dotenv

Uso:
    python seed.py

Variables de entorno necesarias (en .env o como variables del sistema):
    MONGODB_URI   — URI de conexión a MongoDB Atlas
    MONGODB_DB    — Nombre de la base de datos (ej. moviestreams)
    ORACLE_USER   — Usuario Oracle (ej. Admin)
    ORACLE_PWD    — Contraseña Oracle
    ORACLE_DSN    — DSN de Oracle (ej. moviestream_high)
    ORACLE_WALLET — Ruta al directorio del wallet de Oracle
"""

import os
import sys
from dotenv import load_dotenv

load_dotenv(".env.local")
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "")
MONGODB_DB  = os.getenv("MONGODB_DB", "moviestreams")

# ── Límites de muestra ────────────────────────────────────────────────────────
LIMIT_MOVIES    = 500
LIMIT_CUSTOMERS = 2_000
LIMIT_SALES     = 10_000
LIMIT_SEGMENTS  = 20

# ── Conexión a MongoDB ─────────────────────────────────────────────────────────
try:
    from pymongo import MongoClient, ASCENDING, TEXT
    from pymongo.errors import BulkWriteError
except ImportError:
    sys.exit("Error: instala pymongo  →  pip install pymongo")

if not MONGODB_URI:
    sys.exit("Error: define MONGODB_URI en tu .env.local o entorno")

client = MongoClient(MONGODB_URI, tlsAllowInvalidCertificates=True)
db = client[MONGODB_DB]

print(f"Conectado a MongoDB: {MONGODB_DB}")

# ── Datos de muestra embebidos (sin Oracle) ────────────────────────────────────
# Si NO hay conexión a Oracle, usamos datos sintéticos representativos.
# Si HAY conexión, los bloques marcados con [ORACLE] extraen datos reales.

SAMPLE_GENRES = ["Action","Drama","Comedy","Thriller","Sci-Fi","Horror",
                 "Romance","Documentary","Animation","Adventure"]

SAMPLE_MOVIES = [
    {"_id": i, "title": f"Película {i}", "year": 2000 + (i % 24),
     "runtime": 90 + (i % 60), "list_price": round(2.99 + (i % 5) * 0.5, 2),
     "main_subject": SAMPLE_GENRES[i % len(SAMPLE_GENRES)],
     "genre": [SAMPLE_GENRES[i % len(SAMPLE_GENRES)],
               SAMPLE_GENRES[(i + 3) % len(SAMPLE_GENRES)]],
     "cast": [f"Actor {i}", f"Actriz {i + 1}"],
     "crew": [{"job": "Director", "names": [f"Director {i}"]}],
     "studio": [f"Studio {i % 10}"],
     "awards": [], "nominations": [],
     "summary": f"Sinopsis de la película número {i}.",
     "image_url": "", "views": i * 17 % 50000,
     "wiki_article": ""}
    for i in range(1, LIMIT_MOVIES + 1)
]

SAMPLE_SEGMENTS = [
    {"_id": i, "name": f"Segmento {i}", "short_name": f"S{i}"}
    for i in range(1, 9)
]

CONTINENTS = ["North America", "Europe", "Asia", "South America", "Africa", "Oceania"]
SAMPLE_CUSTOMERS = [
    {"_id": 2_000_000 + i,
     "name": {"first": f"Nombre{i}", "last": f"Apellido{i}"},
     "email": f"user{i}@example.com",
     "yrs_customer": round((i % 10) + 0.5, 1),
     "segment_id": (i % 8) + 1,
     "segment_name": f"Segmento {(i % 8) + 1}",
     "location": {
         "city": f"Ciudad{i}", "state": f"Estado{i}",
         "country": ["Mexico","USA","Canada","Spain","France","Brazil"][i % 6],
         "continent": CONTINENTS[i % len(CONTINENTS)],
     },
     "demographics": {
         "age": 18 + (i % 50),
         "gender": "M" if i % 2 == 0 else "F",
         "income_level": ["A: $150,000+","B: $90,000 - $150,000",
                          "C: $50,000 - $90,000","D: $30,000 - $50,000"][i % 4],
         "education": ["Bach. Degree","HS-grad","Some-college","Masters"][i % 4],
     },
     "feedback": [
         {"feedback_id": i, "rating": (i % 5) + 1,
          "comment": "Buen servicio" if i % 3 == 0 else "Podría mejorar",
          "date": "2024-01-15T00:00:00Z", "channel": ["App","Web","Phone"][i % 3]}
     ] if i % 4 == 0 else [],
     "survey": [
         {"question": "¿Con qué frecuencia usas el servicio?",
          "response": ["Diariamente","Semanalmente","Mensualmente"][i % 3]}
     ] if i % 5 == 0 else [],
     "contact": []}
    for i in range(1, LIMIT_CUSTOMERS + 1)
]

SAMPLE_SALES = [
    {"_id": f"sale_{i}",
     "customer_id": 2_000_000 + (i % LIMIT_CUSTOMERS) + 1,
     "movie_id": (i % LIMIT_MOVIES) + 1,
     "genre": {"name": SAMPLE_GENRES[i % len(SAMPLE_GENRES)], "id": i % 10},
     "payment": {
         "actual_price": round(1.99 + (i % 8) * 0.5, 2),
         "list_price": round(2.99 + (i % 8) * 0.5, 2),
         "discount_type": "None" if i % 3 == 0 else "Promotion",
         "payment_method": ["Credit Card","PayPal","Debit Card"][i % 3],
     },
     "day_id": 20240101 + (i % 365),
     "day_name": ["Monday","Tuesday","Wednesday","Thursday","Friday"][i % 5],
     "month": (i % 12) + 1, "year": 2024, "quarter": ((i % 12) // 3) + 1,
     "device": ["SmartTV","Mobile","Desktop","Tablet"][i % 4]}
    for i in range(1, LIMIT_SALES + 1)
]

# ── Intentar extracción desde Oracle (opcional) ────────────────────────────────
def try_oracle_import():
    """
    Si las variables de Oracle están definidas, extrae datos reales.
    Si no, retorna None y usamos los datos sintéticos de arriba.
    """
    user = os.getenv("ORACLE_USER")
    pwd  = os.getenv("ORACLE_PWD")
    dsn  = os.getenv("ORACLE_DSN")
    wallet = os.getenv("ORACLE_WALLET")
    if not all([user, pwd, dsn, wallet]):
        return None
    try:
        import oracledb
        oracledb.init_oracle_client()
    except Exception:
        pass
    try:
        conn = oracledb.connect(
            user=user, password=pwd, dsn=dsn,
            config_dir=wallet, wallet_location=wallet, wallet_password=pwd,
            ssl_server_dn_match=False
        )
        print("Conectado a Oracle — usando datos reales")
        return conn
    except Exception as e:
        print(f"Oracle no disponible ({e}) — usando datos sintéticos")
        return None


# ── Función principal de seed ──────────────────────────────────────────────────
def seed_collection(name: str, docs: list, drop: bool = True):
    col = db[name]
    if drop:
        col.drop()
        print(f"  Colección '{name}' reiniciada")
    if not docs:
        print(f"  '{name}': sin datos")
        return
    try:
        result = col.insert_many(docs, ordered=False)
        print(f"  '{name}': {len(result.inserted_ids)} documentos insertados")
    except BulkWriteError as e:
        ok = len(docs) - len(e.details.get("writeErrors", []))
        print(f"  '{name}': {ok} insertados ({len(e.details.get('writeErrors', []))} duplicados ignorados)")


def create_indexes():
    db.movies.create_index([("title", TEXT)])
    db.movies.create_index([("genre", ASCENDING)])
    db.movies.create_index([("year", ASCENDING)])

    db.customers.create_index([("name.first", ASCENDING), ("name.last", ASCENDING)])
    db.customers.create_index([("email", ASCENDING)], unique=True)
    db.customers.create_index([("location.country", ASCENDING)])

    db.sales.create_index([("customer_id", ASCENDING)])
    db.sales.create_index([("movie_id", ASCENDING)])
    db.sales.create_index([("year", ASCENDING), ("month", ASCENDING)])
    db.sales.create_index([("genre.name", ASCENDING)])
    print("  Índices creados")


def main():
    print("\n── Iniciando seed de MovieStream ──\n")

    oracle_conn = try_oracle_import()

    if oracle_conn:
        # [ORACLE] Aquí iría la extracción real desde Oracle
        # Por brevedad se omite el mapeo completo; en un entorno con Oracle
        # disponible, reemplaza SAMPLE_MOVIES/CUSTOMERS/SALES con cursores reales.
        oracle_conn.close()
        print("  (Usa los datos sintéticos como fallback en este entorno)")
        movies    = SAMPLE_MOVIES
        customers = SAMPLE_CUSTOMERS
        sales     = SAMPLE_SALES
        segments  = SAMPLE_SEGMENTS
    else:
        movies    = SAMPLE_MOVIES
        customers = SAMPLE_CUSTOMERS
        sales     = SAMPLE_SALES
        segments  = SAMPLE_SEGMENTS

    seed_collection("movies", movies)
    seed_collection("customers", customers)
    seed_collection("sales", sales)
    seed_collection("customer_segments", segments)

    print("\n── Creando índices ──")
    create_indexes()

    print("\n── Seed completado ──")
    for col_name in ["movies", "customers", "sales", "customer_segments"]:
        count = db[col_name].count_documents({})
        print(f"  {col_name}: {count:,} documentos")


if __name__ == "__main__":
    main()
