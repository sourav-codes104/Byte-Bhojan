# ================= FOOD CATEGORIES =================
FOOD_CATEGORIES = {
    "produce": ["banana", "apple", "tomato", "potato", "onion", "carrot", "spinach", "corn"],
    "meats":   ["chicken", "beef", "fish", "tuna", "eggs"],
    "dairy":   ["milk", "cheese", "butter", "yogurt"],
    "grains":  ["rice", "bread", "flour", "oats", "pasta", "lentils"],
    "processed": ["sugar", "oil", "salt"],
}

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
        name = r["item"]
        cal  = r["calories"]
        placed = False

        for cat, items in FOOD_CATEGORIES.items():
            if name in items:
                key = cat.capitalize()
                categories[key]["calories"] += cal
                categories[key]["items"].append(name)
                placed = True
                break

        if not placed:
            categories["Other"]["calories"] += cal
            categories["Other"]["items"].append(name)

    # round karo
    for cat in categories:
        categories[cat]["calories"] = round(categories[cat]["calories"], 1)

    # empty categories hata do
    categories = {k: v for k, v in categories.items() if v["calories"] > 0}

    return categories