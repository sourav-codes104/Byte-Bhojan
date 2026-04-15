import os
from flask import Blueprint, request, jsonify
from app.utils.ocr_utils import (
    extract_text, parse_items, calculate_nutrition,
    calculate_totals, divide_per_person, generate_warnings
)
from app.utils.category_utils import categorize_items

upload_bp = Blueprint("upload", __name__)
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@upload_bp.route("/upload", methods=["POST"])
def upload():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Use PNG, JPG, JPEG or WEBP"}), 400

    family_members = int(request.form.get("family_members", 1))
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    try:
        text = extract_text(filepath)

        print("=== OCR TEXT ===")
        print(text)
        print("================")

        if not text.strip():
            return jsonify({"error": "Could not extract text from image"}), 422

        items = parse_items(text)

        print("=== ITEMS FOUND ===")
        print(items)
        print("==================")

        if not items:
            return jsonify({
                "error": "No recognizable grocery items found",
                "raw_text": text
            }), 422

        results    = calculate_nutrition(items)
        totals     = calculate_totals(results)
        per_person = divide_per_person(totals, family_members)
        warnings   = generate_warnings(per_person)
        categories = categorize_items(results)  # ✅ new

        return jsonify({
            "raw_text":   text,
            "results":    results,
            "totals":     totals,
            "per_person": per_person,
            "warnings":   warnings,
            "categories": categories  # ✅ new
        }), 200

    except Exception as e:
        print("=== ERROR ===")
        print(str(e))
        print("=============")
        return jsonify({"error": str(e)}), 500

    finally:
        if os.path.exists(filepath):
            os.remove(filepath)