from flask import Blueprint, request, jsonify
import bcrypt
import json
from app.database import get_connection

# 🔗 import token function
from app.utils.auth_utils import create_token

auth = Blueprint("auth", __name__)


# ================= SIGNUP =================
@auth.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()

    # validation
    if not data or "name" not in data or "email" not in data or "password" not in data:
        return jsonify({"error": "Missing name, email or password"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    # check duplicate
    cursor.execute("SELECT * FROM users WHERE email = ?", (data["email"],))
    existing_user = cursor.fetchone()

    if existing_user:
        conn.close()
        return jsonify({"error": "User already exists"}), 400

    # hash password
    hashed = bcrypt.hashpw(
        data["password"].encode(),
        bcrypt.gensalt()
    ).decode()

    # insert user ✅ now includes name
    cursor.execute(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        (data["name"], data["email"], hashed)
    )

    conn.commit()
    conn.close()

    return jsonify({"message": "User created"})


# ================= LOGIN =================
@auth.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    # validation
    if not data or "email" not in data or "password" not in data:
        return jsonify({"error": "Missing email or password"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    # fetch user from DB
    cursor.execute("SELECT * FROM users WHERE email = ?", (data["email"],))
    user = cursor.fetchone()

    conn.close()

    if user:
        stored_password = user[3]  

        if bcrypt.checkpw(
            data["password"].encode(),
            stored_password.encode()
        ):
            token = create_token(data["email"])
            return jsonify({"token": token})

    return jsonify({"error": "Invalid credentials"}), 401