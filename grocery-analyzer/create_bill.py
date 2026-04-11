from PIL import Image, ImageDraw, ImageFont

img = Image.new('RGB', (600, 500), color='white')
draw = ImageDraw.Draw(img)

try:
    font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 28)
except:
    font = ImageFont.load_default()

lines = [
    'GROCERY BILL',
    'Milk 500ml',
    'Eggs 12',
    'Rice 1kg',
    'Bread 200g',
    'Chicken 500g',
    'Banana 300g',
    'Oil 100ml',
    'Sugar 200g',
]

y = 30
for line in lines:
    draw.text((40, y), line, fill='black', font=font)
    y += 35

img.save('test_bill.png')
print('Done! test_bill.png created')