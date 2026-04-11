import requests
from config import USDA_API_KEY

USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1"


# ================= SEARCH FOOD =================
def search_food(query):
    url = f"{USDA_BASE_URL}/foods/search"
    params = {
        "query": query,
        "api_key": USDA_API_KEY,
        "pageSize": 1,
        "dataType": "Foundation,SR Legacy"
    }

    response = requests.get(url, params=params)

    if response.status_code != 200:
        return None

    data = response.json()
    foods = data.get("foods", [])

    if not foods:
        return None

    return foods[0]  # best match


# ================= GET NUTRIENTS =================
def get_nutrients(food):
    if not food:
        return None

    nutrients = {}
    for n in food.get("foodNutrients", []):
        name = n.get("nutrientName", "").lower()
        value = n.get("value", 0)

        if "energy" in name:
            nutrients["calories"] = round(value, 1)
        elif "protein" in name:
            nutrients["protein"] = round(value, 1)
        elif "total lipid" in name or "fat" in name:
            nutrients["fat"] = round(value, 1)
        elif "carbohydrate" in name:
            nutrients["carbs"] = round(value, 1)

    # defaults agar koi nutrient missing ho
    nutrients.setdefault("calories", 0)
    nutrients.setdefault("protein", 0)
    nutrients.setdefault("fat", 0)
    nutrients.setdefault("carbs", 0)

    return nutrients


# ================= FETCH NUTRITION FOR ITEM =================
def fetch_usda_nutrition(item_name):
    food = search_food(item_name)
    nutrients = get_nutrients(food)
    return nutrients