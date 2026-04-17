import requests
from rapidfuzz import process, fuzz
import re
from config import USDA_API_KEY

API_KEY = USDA_API_KEY

FOOD_CATEGORIES = {
    "produce": ["banana", "apple", "tomato", "potato", "onion", "carrot", "spinach", "corn"],
    "meats": ["chicken", "beef", "fish", "tuna", "eggs"],
    "dairy": ["milk", "cheese", "butter", "yogurt"],
    "grains": ["rice", "bread", "flour", "oats", "pasta", "lentils", "noodles"],
    "processed": ["sugar", "oil", "salt", "maggi"],
}

ITEM_TO_CATEGORY = {
    item: cat.capitalize()
    for cat, items in FOOD_CATEGORIES.items()
    for item in items
}

ALL_ITEMS = list(ITEM_TO_CATEGORY.keys())
CACHE = {}

def normalize(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9 ]", " ", text)
    return re.sub(r"\s+", " ", text).strip()

def fuzzy_match_item(name):
    name = normalize(name)

    for item in ALL_ITEMS:
        if item in name:
            return item

    words = name.split()
    for w in words:
        if w in ALL_ITEMS:
            return w

    match = process.extractOne(name, ALL_ITEMS, scorer=fuzz.token_sort_ratio)
    if match and match[1] >= 75:
        return match[0]

    return None

def fetch_nutrition(item):
    url = "https://api.nal.usda.gov/fdc/v1/foods/search"
    params = {"query": item, "api_key": API_KEY, "pageSize": 1}

    try:
        res = requests.get(url, params=params, timeout=8)
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
            elif "total lipid" in name or "fat" == name or "lipid" in name:
                result["fat"] = value

        return result
    except Exception:
        return None

def get_nutrition_cached(item):
    if item in CACHE:
        return CACHE[item]
    data = fetch_nutrition(item)
    CACHE[item] = data
    return data

def categorize_items(results):
    categories = {
        "Produce": {"calories": 0, "items": []},
        "Meats": {"calories": 0, "items": []},
        "Dairy": {"calories": 0, "items": []},
        "Grains": {"calories": 0, "items": []},
        "Processed": {"calories": 0, "items": []},
        "Other": {"calories": 0, "items": []},
    }

    for r in results:
        # Extract item name safely
        if isinstance(r, dict):
            item_name = r.get("item", "")
            if isinstance(item_name, dict):
                item_name = str(item_name)
        else:
            item_name = str(r)
        if not item_name:
            continue

        # Get total calories from the result (already multiplied by quantity)
        total_calories = r.get("calories", 0)
        if not isinstance(total_calories, (int, float)):
            total_calories = 0

        # Match item to category
        name = item_name.strip().lower()
        matched = fuzzy_match_item(name)
        final_name = matched if matched else name
        category = ITEM_TO_CATEGORY.get(final_name, "Other")

        # Add total calories (not per 100g)
        categories[category]["calories"] += total_calories
        if final_name not in categories[category]["items"]:
            categories[category]["items"].append(final_name)

    for cat in categories:
        categories[cat]["calories"] = round(categories[cat]["calories"], 1)

    return {k: v for k, v in categories.items() if v["calories"] > 0 or v["items"]}