import re

line = 'rice 1kg'
kg_match = re.search(r'(\d+\.?\d*)\s*kg', line, re.IGNORECASE)
print('match:', kg_match)
if kg_match:
    print('group 1:', kg_match.group(1))
    print('quantity:', float(kg_match.group(1)) * 1000)