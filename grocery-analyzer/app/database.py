import sqlite3

DB_NAME = "database.db"


# ================= CONNECTION =================
def get_connection():
    return sqlite3.connect(DB_NAME)


# ================= INIT DATABASE =================
def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # USERS TABLE
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
    """)

    # MEMBERS TABLE
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT NOT NULL,
        age INTEGER,
        weight REAL,
        height REAL,
        gender TEXT,
        diseases TEXT,
        food_pref TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)

    conn.commit()
    conn.close()