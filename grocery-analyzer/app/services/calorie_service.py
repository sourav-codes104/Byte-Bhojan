# services/calorie_service.py

def calculate_bmr(weight_kg, height_cm, age, gender):
    """Mifflin-St Jeor Basal Metabolic Rate"""
    if gender.lower() == 'male':
        return 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        return 10 * weight_kg + 6.25 * height_cm - 5 * age - 161

def get_daily_calorie_need(member):
    """
    member: dict with keys: weight, height, age, gender, diseases (list)
    Returns: estimated daily calorie need (int)
    """
    bmr = calculate_bmr(member['weight'], member['height'], member['age'], member['gender'])
    # Assume sedentary (1.2)
    calories = bmr * 1.2

    # Adjust for diseases
    diseases = member.get('diseases', []) or []
    if 'diabetes' in diseases:
        calories *= 0.95
    if 'obesity' in diseases:
        calories *= 0.90
    # Add more adjustments if needed

    return round(calories)