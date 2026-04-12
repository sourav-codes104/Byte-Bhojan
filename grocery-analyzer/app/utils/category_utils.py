import requests
from difflib import get_close_matches
from config import USDA_API_KEY

# ================= API =================
API_KEY = USDA_API_KEY

def fetch_nutrition(item):
    url = "https://api.nal.usda.gov/fdc/v1/foods/search"

    params = {
        "query": item,
        "api_key": API_KEY,
        "pageSize": 1
    }

    try:
        res = requests.get(url, params=params)
        data = res.json()

        foods = data.get("foods")
        if not foods:
            return None

        nutrients = foods[0].get("foodNutrients", [])

        result = {
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0
        }

        for n in nutrients:
            name = n.get("nutrientName", "").lower()

            if "energy" in name:
                result["calories"] = n.get("value", 0)
            elif "protein" in name:
                result["protein"] = n.get("value", 0)
            elif "carbohydrate" in name:
                result["carbs"] = n.get("value", 0)
            elif "fat" in name:
                result["fat"] = n.get("value", 0)

        return result

    except:
        return None


# ================= FOOD CATEGORIES =================
FOOD_CATEGORIES = {
    "produce": ["banana", "apple", "tomato", "potato", "onion", "carrot", "spinach", "corn"],
    "meats":   ["chicken", "beef", "fish", "tuna", "eggs"],
    "dairy":   ["milk", "cheese", "butter", "yogurt"],
    "grains":  ["rice", "bread", "flour", "oats", "pasta", "lentils"],
    "processed": ["sugar", "oil", "salt"],
}

# 🔥 FAST LOOKUP
ITEM_TO_CATEGORY = {
    item: cat.capitalize()
    for cat, items in FOOD_CATEGORIES.items()
    for item in items
}

ALL_ITEMS = list(ITEM_TO_CATEGORY.keys())


# ================= FUZZY MATCH =================
def fuzzy_match_item(name):
    if name in ITEM_TO_CATEGORY:
        return name

    match = get_close_matches(name, ALL_ITEMS, n=1, cutoff=0.65)

    if match:
        return match[0]

    return None


# ================= CACHE (IMPORTANT) =================
CACHE = {}

def get_nutrition_cached(item):
    if item in CACHE:
        return CACHE[item]

    data = fetch_nutrition(item)
    CACHE[item] = data
    return data


# ================= MAIN FUNCTION =================
def categorize_items(results):
    categories = {
        "Produce":   {"calories": 0, "items": []},
        "Meats":     {"calories": 0, "items": []},
        "Dairy":     {"calories": 0, "items": []},
        "Grains":    {"calories": 0, "items": []},
        "Processed": {"calories": 0, "items": []},
        "Other":     {"calories": 0, "items": []},
    }

    for r in results:
        name = r["item"].strip().lower()

        # 🔥 FUZZY MATCH
        matched = fuzzy_match_item(name)
        final_name = matched if matched else name

        # 🔥 CATEGORY
        category = ITEM_TO_CATEGORY.get(final_name, "Other")

        # 🔥 API CALL (with cache)
        nutrition = get_nutrition_cached(final_name)

        if nutrition:
            cal = nutrition["calories"]
        else:
            cal = 0

        # 🔥 STORE
        categories[category]["calories"] += cal

        if final_name not in categories[category]["items"]:
            categories[category]["items"].append(final_name)

    # 🔥 ROUND
    for cat in categories:
        categories[cat]["calories"] = round(categories[cat]["calories"], 1)

    # 🔥 REMOVE EMPTY
    categories = {
        k: v for k, v in categories.items()
        if v["calories"] > 0
    }

    return categories