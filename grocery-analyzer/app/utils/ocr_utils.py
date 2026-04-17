import pytesseract
from PIL import Image, ImageFilter, ImageEnhance, ImageOps
from rapidfuzz import process, fuzz
import re
import requests

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

KNOWN_ITEMS = [
    "milk", "eggs", "rice", "bread", "chicken",
    "banana", "apple", "sugar", "oil", "salt", "noodles"
]

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
    "salt": {"calories": 0, "protein": 0.0, "fat": 0.0, "carbs": 0.0},
    "noodles": {"calories": 138, "protein": 4.5, "fat": 1.5, "carbs": 25.0},
}

COUNT_BASED_ITEMS = {"eggs", "banana", "apple"}
UNIT_PATTERN = r"(kg|g|ml|l|ltr|pcs|pc|piece|pieces)"

def normalize(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9 ]", " ", text)
    return re.sub(r"\s+", " ", text).strip()

def normalize_receipt_line(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9. ]", " ", text)
    text = re.sub(r"(\d+)\s+\.(\d+)", r"\1.\2", text)
    return re.sub(r"\s+", " ", text).strip()

def match_item(clean, known_items):
    clean = normalize(clean)
    words = clean.split()

    for word in words:
        if word in known_items:
            return word

    for item in known_items:
        if item in clean:
            return item

    match = process.extractOne(clean, known_items, scorer=fuzz.token_sort_ratio)
    if match and match[1] >= 75:
        return match[0]

    return None

def preprocess_image(path):
    img = Image.open(path).convert("L")
    img = ImageOps.autocontrast(img)
    img = img.resize((img.width * 2, img.height * 2), Image.LANCZOS)
    img = ImageEnhance.Contrast(img).enhance(2.2)
    img = img.filter(ImageFilter.SHARPEN)
    img = img.point(lambda x: 0 if x < 160 else 255, "1")
    return img

def extract_text(path):
    img = preprocess_image(path)
    configs = ["--psm 6", "--psm 4", "--psm 11", "--psm 3"]
    texts = [pytesseract.image_to_string(img, config=c) for c in configs]
    text = max(texts, key=len).lower()
    text = text.replace("k9", "kg").replace("m1", "ml")
    return text

def parse_quantity_unit(token):
    token = token.lower().strip()

    m = re.match(r"^(\d+(?:\.\d+)?)(kg|g|ml|l|ltr|pcs|pc|piece|pieces)?$", token)
    if m:
        qty = float(m.group(1))
        unit = m.group(2) or "pcs"
        return qty, unit

    m = re.match(r"^(\d+(?:\.\d+)?)\s*(kg|g|ml|l|ltr|pcs|pc|piece|pieces)$", token)
    if m:
        return float(m.group(1)), m.group(2)

    return None, None

def find_quantity_unit(text):
    text = normalize_receipt_line(text)
    match = re.search(rf"\b(\d+(?:\.\d+)?)\s*{UNIT_PATTERN}\b", text)
    if not match:
        return None

    qty = float(match.group(1))
    unit = match.group(2).lower()
    if qty <= 0:
        return None

    return qty, unit

def normalize_item_quantity(item, qty, unit):
    unit = unit.lower()

    if unit == "kg":
        return qty * 1000, "g"

    if unit in ["l", "ltr"]:
        return qty * 1000, "ml"

    if unit in ["g", "ml"]:
        return qty, unit

    if unit in ["pcs", "pc", "piece", "pieces"]:
        if item in COUNT_BASED_ITEMS:
            return qty, "pcs"
        return None, None

    return None, None

def parse_items(text):
    items = {}
    skip_words = [
        "total", "gst", "grand", "subtotal", "bill", "mrp", "cashier",
        "store", "date", "time", "payment", "saving", "paid", "thank",
        "avenue", "item description", "qty unit"
    ]
    lines = [
        normalize_receipt_line(line)
        for line in text.split("\n")
        if len(line.strip()) > 1
    ]

    used_quantity_lines = set()

    for i, line in enumerate(lines):
        if any(word in line for word in skip_words):
            continue

        item = match_item(line, KNOWN_ITEMS + ["salt", "noodles"])

        if not item:
            continue

        quantity = find_quantity_unit(line)

        if not quantity:
            for j in range(i + 1, min(i + 4, len(lines))):
                if j in used_quantity_lines:
                    continue
                quantity = find_quantity_unit(lines[j])
                if quantity:
                    used_quantity_lines.add(j)
                    break

        if not quantity:
            for j in range(i - 1, max(i - 4, -1), -1):
                if j in used_quantity_lines:
                    continue
                quantity = find_quantity_unit(lines[j])
                if quantity:
                    used_quantity_lines.add(j)
                    break

        if not quantity:
            continue

        qty, unit = quantity
        final_qty, final_unit = normalize_item_quantity(item, qty, unit)

        if not final_unit:
            continue

        if item in items:
            if items[item]["unit"] == final_unit:
                items[item]["quantity"] += final_qty
        else:
            items[item] = {"item": item, "quantity": final_qty, "unit": final_unit}

    return list(items.values())

def fetch_nutrition_api(item):
    url = "https://api.nal.usda.gov/fdc/v1/foods/search"
    params = {"query": item, "api_key": "YOUR_API_KEY_HERE", "pageSize": 1}

    try:
        res = requests.get(url, params=params, timeout=5)
        res.raise_for_status()
        data = res.json()

        foods = data.get("foods", [])
        if not foods:
            return None

        nutrients = foods[0].get("foodNutrients", [])
        result = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}

        for n in nutrients:
            name = (n.get("nutrientName") or "").lower()
            value = n.get("value", 0) or 0

            if "energy" in name:
                result["calories"] = value
            elif "protein" in name:
                result["protein"] = value
            elif "carbohydrate" in name:
                result["carbs"] = value
            elif "total lipid" in name or "fat" in name:
                result["fat"] = value

        return result
    except Exception:
        return None

def calculate_nutrition(items):
    results = []

    for e in items:
        name, qty, unit = e["item"], e["quantity"], e["unit"]

        n = fetch_nutrition_api(name)
        if not n:
            n = NUTRITION_DB.get(name)

        if not n:
            continue

        if unit in ["g", "ml"]:
            scale = qty / 100.0
        elif unit in ["kg", "ltr"]:
            scale = qty
        else:
            scale = qty

        if unit in ["kg", "ltr"]:
            scale = qty * 10.0

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

def calculate_totals(results):
    return {k: round(sum(r[k] for r in results), 1) for k in ["calories", "protein", "fat", "carbs"]}

def divide_per_person(totals, n):
    n = max(1, n)
    return {k: round(v / n, 1) for k, v in totals.items()}

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
