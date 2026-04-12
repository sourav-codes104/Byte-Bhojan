import pytesseract
from PIL import Image, ImageFilter, ImageEnhance
from rapidfuzz import process, fuzz
import re

# ================= CONFIG =================
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# ================= NUTRITION DB =================
NUTRITION_DB = {
    "milk": {"calories": 42, "protein": 3.4, "fat": 1.0, "carbs": 4.8},
    "bread": {"calories": 265, "protein": 9.0, "fat": 3.2, "carbs": 49.0},
    "eggs": {"calories": 70, "protein": 6.0, "fat": 5.0, "carbs": 0.6},
    "rice": {"calories": 130, "protein": 2.7, "fat": 0.3, "carbs": 28.0},
    "chicken": {"calories": 239, "protein": 27.0, "fat": 14.0, "carbs": 0.0},
    "banana": {"calories": 89, "protein": 1.1, "fat": 0.3, "carbs": 23.0},
    "apple": {"calories": 52, "protein": 0.3, "fat": 0.2, "carbs": 14.0},
    "sugar": {"calories": 387, "protein": 0.0, "fat": 0.0, "carbs": 100.0},
    "oil": {"calories": 884, "protein": 0.0, "fat": 100.0, "carbs": 0.0},
}

COUNT_BASED_ITEMS = {"eggs", "banana", "apple"}

# ================= OCR =================
def extract_text(path):
    img = Image.open(path).convert("L")
    w, h = img.size
    img = img.resize((w * 2, h * 2), Image.LANCZOS)
    img = ImageEnhance.Contrast(img).enhance(2.5)
    img = img.filter(ImageFilter.SHARPEN)
    img = img.point(lambda x: 0 if x < 140 else 255, '1')
    return pytesseract.image_to_string(img, config="--psm 6").lower()

# ================= PARSER (FIXED) =================
def parse_items(text):
    items = {}
    known_items = list(NUTRITION_DB.keys())

    for raw_line in text.split("\n"):
        line = raw_line.strip().lower()
        if len(line) < 2:
            continue

        # OCR fixes
        line = line.replace("k9", "kg").replace("m1", "ml")
        line = re.sub(r"\s+", " ", line)

        # Extract raw quantity and raw unit first
        raw_quantity = None
        raw_unit = None
        unit_match = re.search(r"\b(\d+\.?\d*)\s*(kg|g|ml|l|pcs|pieces)\b", line)

        if unit_match:
            raw_quantity = float(unit_match.group(1))
            raw_unit = unit_match.group(2)
        else:
            num_match = re.search(r"\b(\d+\.?\d*)\b", line)
            if num_match:
                raw_quantity = float(num_match.group(1))
                raw_unit = "count"   # default if no unit

        if raw_quantity is None:
            continue

        # Clean item name
        clean = re.sub(r"\d+\.?\d*\s*(kg|g|ml|l|pcs|pieces)?", "", line)
        clean = re.sub(r"[^a-z ]", "", clean).strip()
        if not clean:
            continue

        # Fuzzy match
        match = process.extractOne(clean, known_items, scorer=fuzz.WRatio, score_cutoff=60)
        if not match:
            continue

        item = match[0]

        # ✅ FIX: Count-based items always use raw quantity as count, no conversion
        if item in COUNT_BASED_ITEMS:
            quantity = raw_quantity
            unit = "count"
        else:
            # Normal items: convert kg→g, l→ml
            if raw_unit == "kg":
                quantity, unit = raw_quantity * 1000, "g"
            elif raw_unit == "l":
                quantity, unit = raw_quantity * 1000, "ml"
            elif raw_unit in ["g", "ml", "pcs", "pieces"]:
                quantity, unit = raw_quantity, raw_unit
            else:
                quantity, unit = raw_quantity, "count"

        # Merge duplicates
        if item in items:
            items[item]["quantity"] += quantity
        else:
            items[item] = {"item": item, "quantity": quantity, "unit": unit}

    return list(items.values())

# ================= NUTRITION =================
def calculate_nutrition(items):
    results = []

    for e in items:
        name, qty, unit = e["item"], e["quantity"], e["unit"]

        if name not in NUTRITION_DB:
            continue

        n = NUTRITION_DB[name]
        scale = qty if unit == "count" else qty / 100.0

        results.append({
            "item": name,
            "quantity": qty,
            "unit": unit,
            "calories": round(n["calories"] * scale, 1),
            "protein": round(n["protein"] * scale, 1),
            "fat": round(n["fat"] * scale, 1),
            "carbs": round(n["carbs"] * scale, 1),
        })

    return results

# ================= TOTAL =================
def calculate_totals(results):
    return {
        k: round(sum(r[k] for r in results), 1)
        for k in ["calories", "protein", "fat", "carbs"]
    }

# ================= PER PERSON =================
def divide_per_person(totals, n):
    n = max(1, n)
    return {k: round(v / n, 1) for k, v in totals.items()}

# ================= WARNINGS =================
def generate_warnings(data):
    warnings = []
    if data["calories"] > 2000:
        warnings.append("⚠️ High calorie")
    if data["protein"] < 50:
        warnings.append("⚠️ Low protein")
    if data["fat"] > 70:
        warnings.append("⚠️ High fat")
    if data["carbs"] > 300:
        warnings.append("⚠️ High carbs")
    return warnings

# ================= MAIN =================
if __name__ == "__main__":
    text = extract_text("bill.jpg")
    print("\nOCR:\n", text)

    items = parse_items(text)
    print("\nITEMS:\n", items)

    res = calculate_nutrition(items)
    print("\nNUTRITION:\n", res)

    tot = calculate_totals(res)
    print("\nTOTAL:\n", tot)

    per = divide_per_person(tot, 3)
    print("\nPER PERSON:\n", per)

    warn = generate_warnings(per)
    print("\nWARNINGS:\n", warn)