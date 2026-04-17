import os
import json
from flask import Blueprint, request, jsonify
from app.database import get_connection
from app.services.ai_engine import analyze_item

from app.utils.ocr_utils import (
    extract_text, parse_items, calculate_nutrition,
    calculate_totals, divide_per_person, generate_warnings
)
from app.utils.category_utils import categorize_items

upload_bp = Blueprint("upload", __name__)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ================= HELPER =================
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ================= MAIN ROUTE =================
@upload_bp.route("/upload", methods=["POST"])
def upload():

    # -------- FILE VALIDATION --------
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type"}), 400

    # -------- INPUT --------
    try:
        family_members = max(1, int(request.form.get("family_members", 1)))
        days = max(1, int(float(request.form.get("days", 1))))
    except:
        family_members, days = 1, 1

    members_json = request.form.get("members")
    members_data = []

    if members_json:
        member_ids = json.loads(members_json)

        conn = get_connection()
        cursor = conn.cursor()

        for mid in member_ids:
            cursor.execute(
                "SELECT name, diseases, weight, height, age, gender FROM members WHERE id = ?",
                (mid,)
            )
            row = cursor.fetchone()

            if row:
                members_data.append({
                    "name": row[0],
                    "diseases": json.loads(row[1]) if row[1] else [],
                    "weight": row[2] or 50,
                    "height": row[3] or 160,
                    "age": row[4] or 25,
                    "gender": row[5] or "male"
                })

        conn.close()

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    try:
        # -------- OCR + PARSE --------
        text = extract_text(filepath)

        items = parse_items(text)
        results = calculate_nutrition(items)

        totals = calculate_totals(results)

        daily_totals = {
            k: round(v / days, 1)
            for k, v in totals.items()
        }

        # ================= BMR + PERSONALIZATION =================
        per_member = []

        if members_data:
            total_bmr = 0

            for m in members_data:
                if m["gender"].lower() == "female":
                    bmr = 10*m["weight"] + 6.25*m["height"] - 5*m["age"] - 161
                else:
                    bmr = 10*m["weight"] + 6.25*m["height"] - 5*m["age"] + 5

                m["bmr"] = bmr
                total_bmr += bmr

            for m in members_data:
                ratio = m["bmr"] / total_bmr if total_bmr else 1/len(members_data)

                intake = round(daily_totals["calories"] * ratio)
                required = round(m["bmr"] * 1.2)
                diff = intake - required

                status = "OK"
                if diff > 300:
                    status = "OVER"
                elif diff < -300:
                    status = "UNDER"

                per_member.append({
                    "name": m["name"],
                    "calories": intake,
                    "required_calories": required,
                    "extra": diff,
                    "status": status,
                    "carbs": round(daily_totals["carbs"] * ratio),
                    "protein": round(daily_totals["protein"] * ratio),
                    "fat": round(daily_totals["fat"] * ratio),
                })

        # ================= AI RECOMMENDATIONS =================
        recommendations = []

        if members_data:
            for member in members_data:
                name = member["name"]

                for r in results:
                    item_name = r.get("item", "").strip()

                    # 🔥 UPDATED AI CALL (returns 3 values)
                    status, reason, suggestion = analyze_item(member, r)

                    recommendations.append({
                        "member": name,
                        "item": item_name,
                        "status": status,
                        "reason": reason,
                        "suggestion": suggestion
                    })

        # ================= OTHER =================
        per_person = divide_per_person(
            daily_totals,
            len(members_data) if members_data else family_members
        )

        warnings = generate_warnings(per_person)
        categories = categorize_items(results)

        return jsonify({
            "results": results,
            "totals": totals,
            "daily_totals": daily_totals,
            "per_person": per_person,
            "per_member": per_member,
            "recommendations": recommendations,
            "warnings": warnings,
            "categories": categories
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if os.path.exists(filepath):
            os.remove(filepath)