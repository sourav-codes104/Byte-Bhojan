def analyze_item(member, item):
    diseases = member["diseases"]

    item_name = item.get("item", "").lower()

    calories = item.get("calories", 0)
    carbs = item.get("carbs", 0)
    protein = item.get("protein", 0)
    fat = item.get("fat", 0)

    status = "GOOD"
    reason = None
    suggestion = None

    # ================= DISEASE RULES =================
    if "diabetes" in diseases and "sugar" in item_name:
        return "BAD", "Avoid sugar (diabetes)", "Replace with fruits or sugar-free alternatives"

    if "bp" in diseases and "salt" in item_name:
        return "BAD", "High salt (BP risk)", "Reduce salt intake, avoid packaged foods"

    if "cholesterol" in diseases and any(x in item_name for x in ["oil", "butter", "fried"]):
        return "BAD", "High fat food", "Switch to boiled or grilled food"

    # ================= NUTRITION LOGIC =================
    if calories > 500:
        status = "BAD"
        reason = "Too many calories"
        suggestion = "Reduce quantity by 30%"

    elif carbs > 100:
        status = "BAD"
        reason = "Too many carbs"
        suggestion = "Reduce carbs, add protein (eggs, paneer, dal)"

    elif fat > 30:
        status = "BAD"
        reason = "High fat"
        suggestion = "Avoid fried food, use less oil"

    elif protein < 5:
        status = "WARNING"
        reason = "Low protein"
        suggestion = "Add protein sources like eggs, dal, milk"

    return status, reason, suggestion