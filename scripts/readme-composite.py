"""Frame the README screenshots: browser chrome for desktop, phone bezels for mobile."""
import sys

from PIL import Image, ImageDraw

TMP, OUT = sys.argv[1], sys.argv[2]
CREAM, LINE, INK = (244, 235, 221), (214, 202, 182), (48, 40, 33)


def browser(path, w=1440):
    shot = Image.open(path).convert('RGB')
    bar = 44
    frame = Image.new('RGB', (shot.width, shot.height + bar), (232, 224, 210))
    d = ImageDraw.Draw(frame)
    for i, c in enumerate([(236, 106, 94), (244, 191, 79), (98, 197, 84)]):
        d.ellipse((18 + i * 22, 15, 32 + i * 22, 29), fill=c)
    d.rounded_rectangle((shot.width // 2 - 260, 10, shot.width // 2 + 260, 34), 8, fill=(246, 240, 230))
    d.text((shot.width // 2 - 92, 15), 'russell-street-bakery-dublin.vercel.app', fill=(110, 100, 90))
    frame.paste(shot, (0, bar))
    return frame


def phone(path, w=390 * 2):
    shot = Image.open(path).convert('RGB')
    pad, r = 22, 70
    frame = Image.new('RGBA', (shot.width + pad * 2, shot.height + pad * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(frame)
    d.rounded_rectangle((0, 0, frame.width - 1, frame.height - 1), r, fill=(28, 24, 21))
    mask = Image.new('L', shot.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, shot.width - 1, shot.height - 1), r - pad, fill=255)
    frame.paste(shot, (pad, pad), mask)
    d.rounded_rectangle((frame.width // 2 - 70, pad + 14, frame.width // 2 + 70, pad + 50), 18, fill=(28, 24, 21))
    return frame


desk = [browser(f'{TMP}desk-{n}.png') for n in ('counter', 'craft', 'story', 'visit')]
g = 36
W = desk[0].width * 2 + g * 3
H = desk[0].height * 2 + g * 3
sheet = Image.new('RGB', (W, H), CREAM)
for i, im in enumerate(desk):
    sheet.paste(im, (g + (i % 2) * (im.width + g), g + (i // 2) * (im.height + g)))
sheet = sheet.resize((W // 2, H // 2), Image.LANCZOS)
sheet.save(f'{OUT}desktop-sections.jpg', quality=84, optimize=True, progressive=True)

mob = [phone(f'{TMP}mob-{n}.png') for n in ('hero', 'layers', 'counter', 'visit')]
g = 60
W = sum(m.width for m in mob) + g * (len(mob) + 1)
H = mob[0].height + g * 2
sheet = Image.new('RGB', (W, H), CREAM)
x = g
for m in mob:
    sheet.paste(m, (x, g), m)
    x += m.width + g
sheet = sheet.resize((W * 2 // 5, H * 2 // 5), Image.LANCZOS)
sheet.save(f'{OUT}mobile-screens.jpg', quality=84, optimize=True, progressive=True)
print('composites:', f'{OUT}desktop-sections.jpg', f'{OUT}mobile-screens.jpg')
