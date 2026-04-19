import pytesseract
from PIL import Image, ImageFilter, ImageEnhance, ImageOps
from rapidfuzz import process, fuzz
import re

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

KNOWN_ITEMS = [
    "milk", "atta", "butter", "sugar", "salt", "haldi",
    "eggs", "rice", "bread", "chicken", "banana", "apple",
    "oil", "noodles", "chana", "moong", "rajma", "dal",
    "besan", "jaggery", "poha", "paneer", "tomato", "jeera",
    "black salt", "raw rice", "broken rice"
]

NUTRITION_DB = {
    "milk": {"calories": 42, "protein": 3.4, "fat": 1.0, "carbs": 4.8},
    "bread": {"calories": 265, "protein": 9.0, "fat": 3.2, "carbs": 49.0},
    "eggs": {"calories": 70, "protein": 6.0, "fat": 5.0, "carbs": 0.6},
    "rice": {"calories": 130, "protein": 2.7, "fat": 0.3, "carbs": 28.0},
    "chicken": {"calories": 239, "protein": 27.0, "fat": 14.0, "carbs": 0.0},
    "banana": {"calories": 89, "protein": 1.1, "fat": 0.3, "carbs": 23.0},
}

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
    text = pytesseract.image_to_string(img, config="--psm 6")
    return text.lower()

def parse_quantity_unit(qty_str):
    qty_str = qty_str.lower().strip()
    match = re.match(r"(\d+(?:\.\d+)?)\s*(ml|kg|g|ltr|l|pcs|pc|piece|pieces)", qty_str)
    if match:
        qty = float(match.group(1))
        unit = match.group(2)
        if unit in ["pc", "piece", "pieces"]:
            unit = "pcs"
        return qty, unit
    if qty_str.isdigit():
        return float(qty_str), "pcs"
    return None, None

def match_item_name(raw_name, known_items):
    raw_name = re.sub(r"[^\w\s]", " ", raw_name).lower()
    for item in known_items:
        if item in raw_name:
            return item
    match = process.extractOne(raw_name, known_items, scorer=fuzz.partial_ratio)
    if match and match[1] >= 70:
        return match[0]
    return None

def parse_items_from_bill(text):
    items = []
    lines = text.split("\n")
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if any(kw in line.lower() for kw in ["total", "gst", "saved", "payment", "thank you", "dmart"]):
            continue
        qty_match = re.search(r"(\d+(?:\.\d+)?\s*(ml|kg|g|ltr|pcs|pc))", line.lower())
        if not qty_match:
            continue
        qty_str = qty_match.group(1)
        qty, unit = parse_quantity_unit(qty_str)
        if qty is None:
            continue
        name_part = line[:line.lower().find(qty_str)].strip()
        if not name_part:
            continue
        name_part = re.sub(r"\d+\.?\d*", "", name_part)
        name_part = re.sub(r"[^\w\s]", "", name_part)
        name_part = re.sub(r"\b(premium|fresh|sliced|robusta|breast|taaza)\b", "", name_part, flags=re.I)
        name_part = name_part.strip()
        if len(name_part) < 3:
            continue
        matched_item = match_item_name(name_part, KNOWN_ITEMS)
        if not matched_item:
            continue
        items.append({
            "item": matched_item,
            "quantity": qty,
            "unit": unit,
            "raw_name": name_part
        })
    return items

def parse_items(text):
    return parse_items_from_bill(text)

def calculate_nutrition(items):
    results = []
    for e in items:
        name = e["item"]
        qty = e["quantity"]
        unit = e["unit"]
        nut = NUTRITION_DB.get(name, {"calories": 0, "protein": 0, "fat": 0, "carbs": 0})
        if unit in ["ml", "g"]:
            scale = qty / 100.0
        elif unit in ["kg", "ltr"]:
            scale = qty * 10
        else:
            scale = qty
        results.append({
            "item": name,
            "quantity": qty,
            "unit": unit,
            "calories": round(nut["calories"] * scale, 1),
            "protein": round(nut["protein"] * scale, 1),
            "fat": round(nut["fat"] * scale, 1),
            "carbs": round(nut["carbs"] * scale, 1),
        })
    return results

def calculate_totals(results):
    return {
        "calories": sum(r["calories"] for r in results),
        "protein": sum(r["protein"] for r in results),
        "fat": sum(r["fat"] for r in results),
        "carbs": sum(r["carbs"] for r in results),
    }

def divide_per_person(totals, n):
    n = max(1, n)
    return {
        "calories": round(totals.get("calories", 0) / n, 1),
        "protein": round(totals.get("protein", 0) / n, 1),
        "fat": round(totals.get("fat", 0) / n, 1),
        "carbs": round(totals.get("carbs", 0) / n, 1),
    }

def generate_warnings(data):
    warnings = []
    if data.get("calories", 0) > 2000:
        warnings.append("⚠️ High calorie intake")
    elif data.get("calories", 0) > 800:
        warnings.append("📊 Moderate calorie intake")
    if data.get("protein", 0) < 20:
        warnings.append("⚠️ Low protein")
    elif data.get("protein", 0) > 50:
        warnings.append("💪 High protein")
    if data.get("fat", 0) > 30:
        warnings.append("⚠️ High fat")
    if data.get("carbs", 0) > 100:
        warnings.append("⚠️ High carbs")
    if not warnings:
        warnings.append("✅ Well-balanced meal")
    return warnings