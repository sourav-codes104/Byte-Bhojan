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

def normalize(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9 ]", " ", text)
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

def parse_items(text):
    items = {}
    lines = [normalize(l) for l in text.split("\n") if len(l.strip()) > 2]

    row_patterns = [
        re.compile(r"^(?P<item>.+?)\s+(?P<qty>\d+(?:\.\d+)?)\s*(?P<unit>kg|g|ml|l|ltr|pcs|pc|piece|pieces)?\s+.*$", re.I),
        re.compile(r"^(?P<item>.+?)\s+(?P<qty>\d+(?:\.\d+)?)(?P<unit>kg|g|ml|l|ltr|pcs|pc|piece|pieces)\s+.*$", re.I),
    ]

    i = 0
    while i < len(lines):
        line = lines[i]

        if any(x in line for x in ["total", "gst", "grand", "subtotal", "bill", "mrp", "cashier", "store", "date", "time"]):
            i += 1
            continue

        combined = line
        for j in range(1, 3):
            if i + j < len(lines):
                combined += " " + lines[i + j]

        matched = None
        for pat in row_patterns:
            matched = pat.search(combined)
            if matched:
                break

        if not matched:
            i += 1
            continue

        item_text = matched.group("item")
        qty = float(matched.group("qty"))
        unit = (matched.group("unit") or "pcs").lower()

        item = match_item(item_text, KNOWN_ITEMS + ["salt", "noodles"])

        if not item:
            i += 1
            continue

        if item in COUNT_BASED_ITEMS:
            final_qty = qty
            final_unit = "pcs"
        else:
            if unit == "kg":
                final_qty, final_unit = qty * 1000, "g"
            elif unit in ["l", "ltr"]:
                final_qty, final_unit = qty * 1000, "ml"
            elif unit in ["g", "ml"]:
                final_qty, final_unit = qty, unit
            else:
                final_qty, final_unit = qty, "pcs"

        if item in items:
            if items[item]["unit"] == final_unit:
                items[item]["quantity"] += final_qty
        else:
            items[item] = {"item": item, "quantity": final_qty, "unit": final_unit}

        i += 1

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