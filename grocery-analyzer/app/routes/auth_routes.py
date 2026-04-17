from flask import Blueprint, request, jsonify
import bcrypt
import json
from app.database import get_connection
from app.utils.auth_utils import create_token

auth = Blueprint("auth", __name__)


# ================= SIGNUP =================
@auth.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()

    if not data or "name" not in data or "email" not in data or "password" not in data:
        return jsonify({"error": "Missing name, email or password"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE email = ?", (data["email"],))
    existing_user = cursor.fetchone()

    if existing_user:
        conn.close()
        return jsonify({"error": "User already exists"}), 400

    hashed = bcrypt.hashpw(data["password"].encode(), bcrypt.gensalt()).decode()

    cursor.execute(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        (data["name"], data["email"], hashed)
    )
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()
    token = create_token(data["email"])

    return jsonify({
        "message": "User created",
        "user_id": user_id,
        "token": token
    }), 201


# ================= LOGIN (UPDATED) =================
@auth.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data or "email" not in data or "password" not in data:
        return jsonify({"error": "Missing email or password"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (data["email"],))
    user = cursor.fetchone()
    conn.close()

    if user:
        stored_password = user[3]  # password column index
        if bcrypt.checkpw(data["password"].encode(), stored_password.encode()):
            token = create_token(data["email"])   # token contains email
            user_id = user[0]                     # first column is id
            return jsonify({
                "token": token,
                "user_id": user_id
            }), 200

    return jsonify({"error": "Invalid credentials"}), 401
