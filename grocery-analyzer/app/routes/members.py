from flask import Blueprint, request, jsonify
from app.database import get_connection
from app.utils.auth_utils import verify_token
import json

members = Blueprint("members", __name__)

@members.route("/add-member", methods=["POST"])
def add_member():
    data = request.get_json()
    required_fields = ["user_id", "name"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"{field} is required"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO members 
        (user_id, name, age, weight, height, gender, diseases, food_pref)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data.get("user_id"),
        data.get("name"),
        data.get("age"),
        data.get("weight"),
        data.get("height"),
        data.get("gender"),
        json.dumps(data.get("diseases", [])),
        data.get("food_pref")
    ))
    conn.commit()
    conn.close()
    return jsonify({"message": "Member added successfully"})

@members.route("/get-members/<int:user_id>", methods=["GET"])
def get_members(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM members WHERE user_id = ?", (user_id,))
    rows = cursor.fetchall()
    members_list = []
    for row in rows:
        members_list.append({
            "id": row[0],
            "user_id": row[1],
            "name": row[2],
            "age": row[3],
            "weight": row[4],
            "height": row[5],
            "gender": row[6],
            "diseases": json.loads(row[7]) if row[7] else [],
            "food_pref": row[8]
        })
    conn.close()
    return jsonify(members_list)

@members.route("/my-members", methods=["GET"])
def get_my_members():
    auth_header = request.headers.get('Authorization', '')
    decoded = verify_token(auth_header)
    user_email = decoded.get("email") if decoded else None
    if not user_email:
        return jsonify({"error": "Invalid token"}), 401

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (user_email,))
    user_row = cursor.fetchone()
    if not user_row:
        conn.close()
        return jsonify({"error": "User not found"}), 401

    user_id = user_row[0]
    cursor.execute("SELECT * FROM members WHERE user_id = ?", (user_id,))
    rows = cursor.fetchall()
    conn.close()

    members_list = []
    for row in rows:
        members_list.append({
            "id": row[0],
            "user_id": row[1],
            "name": row[2],
            "age": row[3],
            "weight": row[4],
            "height": row[5],
            "gender": row[6],
            "diseases": json.loads(row[7]) if row[7] else [],
            "food_pref": row[8]
        })
    return jsonify(members_list), 200
