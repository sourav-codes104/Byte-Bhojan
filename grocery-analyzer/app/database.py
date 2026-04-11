import sqlite3

DB_NAME = "database.db"


# ================= CONNECTION =================
def get_connection():
    return sqlite3.connect(DB_NAME)


# ================= INIT DATABASE =================
def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
    """)

    conn.commit()
    conn.close()