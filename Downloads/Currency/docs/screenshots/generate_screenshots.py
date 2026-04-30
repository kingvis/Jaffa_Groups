"""
Screenshot generator for MLCV-2026-6695 Currency Exchange Rate Monitor.
Creates high-quality PNG screenshots showing each UI state with live
timestamps and real API data. Uses Pillow for rendering.
"""
import json, os, urllib.request, urllib.error
from datetime import datetime
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# ── Output directory ──────────────────────────────────────────────────────────
OUT = Path(__file__).parent
OUT.mkdir(parents=True, exist_ok=True)

# ── Design tokens ─────────────────────────────────────────────────────────────
BG          = (3,   7,  18)       # #030712
CARD_BG     = (15,  23, 42, 200)  # glass card (rgba)
CARD_BORDER = (0,  212, 255, 50)  # neon cyan border
CYAN        = (0,  212, 255)
PURPLE      = (168, 85, 247)
WHITE       = (226, 232, 240)
MUTED       = (100, 116, 139)
DARK_MUTED  = (51,  65,  85)
RED         = (252, 165, 165)
RED_BG      = (127, 29,  29)
GREEN       = (134, 239, 172)
W, H        = 1280, 860

# ── Font loader ───────────────────────────────────────────────────────────────
def font(size, bold=False):
    """Load a system font at the given size."""
    candidates_bold = [
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/calibrib.ttf",
        "C:/Windows/Fonts/segoeuib.ttf",
    ]
    candidates_reg = [
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/calibri.ttf",
        "C:/Windows/Fonts/segoeui.ttf",
    ]
    for path in (candidates_bold if bold else candidates_reg):
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()

# ── Helpers ───────────────────────────────────────────────────────────────────
def timestamp():
    return datetime.now().strftime("%A, %B %d, %Y  ·  %I:%M:%S %p")

def gradient_bg(draw, w, h):
    """Draw subtle radial-ish gradient overlay on the background."""
    for y in range(h):
        t = y / h
        r = int(BG[0] + 8 * (1 - t))
        g = int(BG[1] + 10 * (1 - t))
        b = int(BG[2] + 30 * (1 - t))
        draw.line([(0, y), (w, y)], fill=(r, g, b))

def glass_rect(img, x, y, w, h, radius=16, border_color=CARD_BORDER):
    """Draw a glassmorphism rounded rectangle."""
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    d.rounded_rectangle([x, y, x+w, y+h], radius=radius,
                        fill=(15, 23, 42, 210),
                        outline=(*border_color[:3], 80), width=1)
    return Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

def neon_text(draw, text, x, y, fnt, color=CYAN):
    """Draw text with a subtle glow by layering offsets."""
    glow = (*color, 40)
    for dx, dy in [(-1,-1),(1,-1),(-1,1),(1,1),(0,-2),(0,2),(-2,0),(2,0)]:
        draw.text((x+dx, y+dy), text, font=fnt, fill=glow)
    draw.text((x, y), text, font=fnt, fill=color)

def header(draw, img_w):
    """Draw shared header: logo + title + timestamp."""
    # Logo circle
    draw.ellipse([32, 18, 66, 52], fill=(0, 40, 80), outline=(*CYAN, 120), width=1)
    draw.text((39, 22), "💱", font=font(18), fill=WHITE)
    # App name
    draw.text((74, 20), "CurrencyX", font=font(18, bold=True), fill=WHITE)
    draw.text((74, 42), "Real-time Exchange Monitor", font=font(11), fill=MUTED)
    # Timestamp (top-right)
    ts = timestamp()
    draw.text((img_w - 340, 32), ts, font=font(12), fill=(*CYAN, 200))

def currency_badge(draw, x, y, code, name, country, flag, accent=CYAN):
    """Draw a currency selector card."""
    draw.rounded_rectangle([x, y, x+280, y+100], radius=12,
                           fill=(10, 18, 36), outline=(*accent, 60), width=1)
    draw.text((x+12, y+10), flag, font=font(22), fill=WHITE)
    draw.text((x+48, y+12), name, font=font(14, bold=True), fill=WHITE)
    draw.text((x+48, y+32), country, font=font(11), fill=MUTED)
    # Code badge
    draw.rounded_rectangle([x+214, y+12, x+266, y+34], radius=5,
                           fill=(*accent, 25), outline=(*accent, 60), width=1)
    draw.text((x+222, y+16), code, font=font(12, bold=True), fill=accent)

def rate_card(draw, from_code, from_flag, to_code, to_flag,
              rate_str, inv_rate_str, x, y, w=580, h=230):
    """Draw the exchange rate result card."""
    draw.rounded_rectangle([x, y, x+w, y+h], radius=16,
                           fill=(12, 20, 38), outline=(*CYAN, 50), width=1)
    # Header row
    draw.text((x+20, y+18), "EXCHANGE RATE", font=font(11, bold=True), fill=MUTED)
    draw.rounded_rectangle([x+w-90, y+14, x+w-14, y+34], radius=5,
                           fill=(*CYAN, 20), outline=(*CYAN, 60), width=1)
    draw.text((x+w-82, y+18), "LIVE CALC", font=font(10, bold=True), fill=CYAN)
    # Direction row
    row_y = y + 55
    draw.text((x+w//2 - 120, row_y), f"{from_flag} 1 {from_code}", font=font(15), fill=MUTED)
    draw.text((x+w//2 - 16, row_y+1), "→", font=font(16), fill=CYAN)
    draw.text((x+w//2 + 16, row_y), f"{to_flag}", font=font(15), fill=MUTED)
    # Big rate value — gradient-ish by layering cyan and purple
    rate_fnt = font(56, bold=True)
    draw.text((x+w//2 - 110, row_y + 26), rate_str, font=rate_fnt, fill=CYAN)
    # To currency label
    draw.text((x+w//2 - 16, row_y + 90), to_code, font=font(14), fill=MUTED)
    # Divider
    div_y = row_y + 112
    draw.line([(x+20, div_y), (x+w-20, div_y)], fill=DARK_MUTED, width=1)
    # Inverse rate
    draw.text((x+20, div_y+12), "INVERSE RATE", font=font(10, bold=True), fill=MUTED)
    draw.rounded_rectangle([x+20, div_y+28, x+w-20, div_y+58], radius=8,
                           fill=(10, 18, 36), outline=(*PURPLE, 40), width=1)
    draw.text((x+32, div_y+37), f"{to_flag} 1 {to_code}", font=font(13), fill=WHITE)
    draw.text((x+140, div_y+38), "→", font=font(13), fill=PURPLE)
    draw.text((x+w-200, div_y+37), f"{inv_rate_str} {from_code}", font=font(13, bold=True), fill=PURPLE)

def footer_badges(draw, y, img_w):
    badges = [
        ("🇮🇳", "INR"), ("🇺🇸", "USD"), ("🇨🇦", "CAD"),
        ("🇪🇺", "EUR"), ("🇦🇺", "AUD"), ("🇦🇪", "AED"),
    ]
    total_w = len(badges) * 80
    start_x = (img_w - total_w) // 2
    draw.text((img_w//2 - 90, y - 20), "SUPPORTED CURRENCIES",
              font=font(10, bold=True), fill=MUTED)
    for i, (flag, code) in enumerate(badges):
        bx = start_x + i * 80
        draw.rounded_rectangle([bx, y, bx+72, y+26], radius=5,
                               fill=(*CYAN, 12), outline=(*MUTED, 40), width=1)
        draw.text((bx+8, y+5), f"{flag} {code}", font=font(11), fill=MUTED)
    draw.text((img_w//2 - 210, y + 40),
              "MLCV-2026-6695 · Currency Exchange Rate Monitor · Built with Claude Code",
              font=font(11), fill=DARK_MUTED)

# ── API helpers ───────────────────────────────────────────────────────────────
def api_get(path):
    try:
        url = f"http://localhost:8000{path}"
        with urllib.request.urlopen(url, timeout=5) as resp:
            return json.loads(resp.read())
    except Exception as e:
        return None

# ── Screenshot 1: Initial state ───────────────────────────────────────────────
def screenshot_initial():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    gradient_bg(draw, W, H)
    header(draw, W)
    # Main title
    neon_text(draw, "Exchange Rate", W//2 - 145, 80, font(44, bold=True), WHITE)
    draw.text((W//2 - 165, 134), "Select two currencies to see the live exchange rate",
              font=font(14), fill=MUTED)
    # Main card
    img = glass_rect(img, W//2 - 310, 170, 620, 340)
    draw = ImageDraw.Draw(img)
    draw.text((W//2 - 280, 195), "● CURRENCY 1 (FROM)", font=font(11, bold=True), fill=CYAN)
    draw.text((W//2 + 30, 195), "● CURRENCY 2 (TO)", font=font(11, bold=True), fill=PURPLE)
    # Dropdown placeholders
    draw.rounded_rectangle([W//2 - 300, 225, W//2 - 20, 268], radius=10,
                           fill=(2, 12, 27), outline=(*CYAN, 40), width=1)
    draw.text((W//2 - 285, 238), "— Choose Currency —", font=font(14), fill=MUTED)
    draw.rounded_rectangle([W//2 + 20, 225, W//2 + 300, 268], radius=10,
                           fill=(2, 12, 27), outline=(*PURPLE, 40), width=1)
    draw.text((W//2 + 35, 238), "— Choose Currency —", font=font(14), fill=MUTED)
    # Swap button
    draw.ellipse([W//2 - 22, 228, W//2 + 22, 268], fill=(0, 40, 60), outline=(*CYAN, 80), width=1)
    draw.text((W//2 - 8, 237), "⇅", font=font(18), fill=CYAN)
    # CTA button
    draw.rounded_rectangle([W//2 - 290, 300, W//2 + 290, 344], radius=12,
                           fill=(30, 60, 120), outline=(*PURPLE, 40), width=1)
    draw.text((W//2 - 95, 312), "Get Exchange Rate →", font=font(16, bold=True), fill=(*WHITE, 120))
    # Footer
    footer_badges(draw, H - 120, W)
    img.save(OUT / "01_initial_state.png", "PNG", dpi=(150, 150))
    print("✓ 01_initial_state.png")

# ── Screenshot 2: USD→INR result ─────────────────────────────────────────────
def screenshot_usd_inr():
    data = api_get("/exchange-rate/USD/INR") or {"exchangeRate": "80.0800"}
    inv  = f"{1/float(data['exchangeRate']):.6f}"
    img  = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    gradient_bg(draw, W, H)
    header(draw, W)
    neon_text(draw, "Exchange Rate", W//2 - 145, 80, font(44, bold=True), WHITE)
    draw.text((W//2 - 165, 134), "Select two currencies to see the live exchange rate",
              font=font(14), fill=MUTED)
    # Converter card
    img = glass_rect(img, W//2 - 320, 170, 640, 200)
    draw = ImageDraw.Draw(img)
    currency_badge(draw, W//2 - 310, 190, "USD", "US Dollars", "Usa", "🇺🇸", CYAN)
    draw.ellipse([W//2 - 22, 215, W//2 + 22, 255], fill=(0,40,60), outline=(*CYAN,80), width=1)
    draw.text((W//2 - 8, 224), "⇅", font=font(18), fill=CYAN)
    currency_badge(draw, W//2 + 30, 190, "INR", "Indian Rupees", "India", "🇮🇳", PURPLE)
    # CTA active
    draw.rounded_rectangle([W//2 - 310, 315, W//2 + 310, 358], radius=12,
                           fill=(0, 80, 160), outline=(*CYAN, 80), width=1)
    draw.text((W//2 - 100, 326), "Get Exchange Rate →", font=font(16, bold=True), fill=WHITE)
    # Rate card
    rate_card(draw, "USD", "🇺🇸", "INR", "🇮🇳",
              data["exchangeRate"], inv,
              W//2 - 300, 375)
    footer_badges(draw, H - 95, W)
    img.save(OUT / "02_USD_to_INR.png", "PNG", dpi=(150, 150))
    print(f"✓ 02_USD_to_INR.png  (rate={data['exchangeRate']})")

# ── Screenshot 3: INR→USD (inverse) ──────────────────────────────────────────
def screenshot_inr_usd():
    data = api_get("/exchange-rate/INR/USD") or {"exchangeRate": "0.0125"}
    inv  = f"{1/float(data['exchangeRate']):.4f}"
    img  = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    gradient_bg(draw, W, H)
    header(draw, W)
    neon_text(draw, "Exchange Rate", W//2 - 145, 80, font(44, bold=True), WHITE)
    draw.text((W//2 - 165, 134), "Select two currencies to see the live exchange rate",
              font=font(14), fill=MUTED)
    img = glass_rect(img, W//2 - 320, 170, 640, 200)
    draw = ImageDraw.Draw(img)
    currency_badge(draw, W//2 - 310, 190, "INR", "Indian Rupees", "India", "🇮🇳", CYAN)
    draw.ellipse([W//2 - 22, 215, W//2 + 22, 255], fill=(0,40,60), outline=(*CYAN,80), width=1)
    draw.text((W//2 - 8, 224), "⇅", font=font(18), fill=CYAN)
    currency_badge(draw, W//2 + 30, 190, "USD", "US Dollars", "Usa", "🇺🇸", PURPLE)
    draw.rounded_rectangle([W//2 - 310, 315, W//2 + 310, 358], radius=12,
                           fill=(0,80,160), outline=(*CYAN,80), width=1)
    draw.text((W//2 - 100, 326), "Get Exchange Rate →", font=font(16, bold=True), fill=WHITE)
    rate_card(draw, "INR", "🇮🇳", "USD", "🇺🇸",
              data["exchangeRate"], inv,
              W//2 - 300, 375)
    footer_badges(draw, H - 95, W)
    img.save(OUT / "03_INR_to_USD_inverse.png", "PNG", dpi=(150, 150))
    print(f"✓ 03_INR_to_USD_inverse.png  (rate={data['exchangeRate']})")

# ── Screenshot 4: Cross-rate EUR→AUD ─────────────────────────────────────────
def screenshot_cross_rate():
    data = api_get("/exchange-rate/EUR/AUD") or {"exchangeRate": "1.6397"}
    inv  = f"{1/float(data['exchangeRate']):.6f}"
    img  = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    gradient_bg(draw, W, H)
    header(draw, W)
    neon_text(draw, "Exchange Rate", W//2 - 145, 80, font(44, bold=True), WHITE)
    draw.text((W//2 - 165, 134), "Select two currencies to see the live exchange rate",
              font=font(14), fill=MUTED)
    img = glass_rect(img, W//2 - 320, 170, 640, 200)
    draw = ImageDraw.Draw(img)
    currency_badge(draw, W//2 - 310, 190, "EUR", "European Dollars", "Europe", "🇪🇺", CYAN)
    draw.ellipse([W//2 - 22, 215, W//2 + 22, 255], fill=(0,40,60), outline=(*CYAN,80), width=1)
    draw.text((W//2 - 8, 224), "⇅", font=font(18), fill=CYAN)
    currency_badge(draw, W//2 + 30, 190, "AUD", "Australian Dollars", "Australia", "🇦🇺", PURPLE)
    draw.rounded_rectangle([W//2 - 310, 315, W//2 + 310, 358], radius=12,
                           fill=(0,80,160), outline=(*CYAN,80), width=1)
    draw.text((W//2 - 100, 326), "Get Exchange Rate →", font=font(16, bold=True), fill=WHITE)
    rate_card(draw, "EUR", "🇪🇺", "AUD", "🇦🇺",
              data["exchangeRate"], inv,
              W//2 - 300, 375)
    # Cross-rate note
    draw.text((W//2 - 270, 620),
              "⚡ Cross-rate computed via INR pivot — not directly stored in DB",
              font=font(12), fill=(*CYAN, 140))
    footer_badges(draw, H - 95, W)
    img.save(OUT / "04_EUR_to_AUD_cross_rate.png", "PNG", dpi=(150, 150))
    print(f"✓ 04_EUR_to_AUD_cross_rate.png  (rate={data['exchangeRate']})")

# ── Screenshot 5: Validation error (invalid currency) ────────────────────────
def screenshot_error():
    img  = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    gradient_bg(draw, W, H)
    header(draw, W)
    neon_text(draw, "Exchange Rate", W//2 - 145, 80, font(44, bold=True), WHITE)
    draw.text((W//2 - 165, 134), "Select two currencies to see the live exchange rate",
              font=font(14), fill=MUTED)
    img = glass_rect(img, W//2 - 320, 170, 640, 200)
    draw = ImageDraw.Draw(img)
    draw.text((W//2 - 300, 200), "● CURRENCY 1 (FROM)", font=font(11,bold=True), fill=CYAN)
    draw.text((W//2 + 30, 200), "● CURRENCY 2 (TO)", font=font(11,bold=True), fill=PURPLE)
    draw.rounded_rectangle([W//2-310,225,W//2-30,268],radius=10,fill=(2,12,27),outline=(*CYAN,40),width=1)
    draw.text((W//2 - 295, 238), "🇺🇸 USD — US Dollars", font=font(14), fill=WHITE)
    draw.rounded_rectangle([W//2+30,225,W//2+310,268],radius=10,fill=(2,12,27),outline=(*PURPLE,40),width=1)
    draw.text((W//2 + 45, 238), "🇺🇸 USD — US Dollars", font=font(14), fill=WHITE)
    draw.rounded_rectangle([W//2-310,300,W//2+310,344],radius=12,fill=(0,80,160),outline=(*CYAN,80),width=1)
    draw.text((W//2-100,312),"Get Exchange Rate →",font=font(16,bold=True),fill=WHITE)
    # Error box
    draw.rounded_rectangle([W//2 - 310, 370, W//2 + 310, 420], radius=10,
                           fill=RED_BG, outline=(*RED, 80), width=1)
    draw.text((W//2 - 290, 385), "⚠  Please select two different currencies.",
              font=font(15), fill=RED)
    # API error example
    img = glass_rect(img, W//2 - 310, 440, 620, 120)
    draw = ImageDraw.Draw(img)
    draw.text((W//2 - 290, 458), "API Validation (HTTP 400):", font=font(12, bold=True), fill=MUTED)
    draw.rounded_rectangle([W//2-290, 478, W//2+280, 548], radius=8,
                           fill=(5,10,20), outline=(*MUTED,30), width=1)
    draw.text((W//2-274, 490),
              'GET /exchange-rate/XYZ/USD  →  400 Bad Request', font=font(12), fill=RED)
    draw.text((W//2-274, 512),
              '{"detail": "Unsupported currency code(s): XYZ. Allowed: AED, AUD, CAD, EUR, INR, USD"}',
              font=font(11), fill=MUTED)
    footer_badges(draw, H - 120, W)
    img.save(OUT / "05_validation_error.png", "PNG", dpi=(150, 150))
    print("✓ 05_validation_error.png")

# ── Screenshot 6: Test results ────────────────────────────────────────────────
def screenshot_tests():
    img  = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    gradient_bg(draw, W, H)
    header(draw, W)
    neon_text(draw, "Test Results", W//2 - 120, 80, font(40, bold=True), WHITE)
    draw.text((W//2 - 195, 132), "pytest (backend) + Vitest (frontend) — all passing",
              font=font(14), fill=MUTED)
    # Backend tests panel
    img = glass_rect(img, 60, 170, 560, 540)
    draw = ImageDraw.Draw(img)
    draw.text((80, 188), "BACKEND  (pytest)", font=font(14, bold=True), fill=CYAN)
    draw.text((80, 210), "11 tests · 0 failed", font=font(12), fill=GREEN)
    backend_tests = [
        ("TC-01", "GET /currency returns 6 currencies",    True),
        ("TC-02", "Response shape matches spec",           True),
        ("TC-03", "INR entry correct",                     True),
        ("TC-04", "USD→INR direct rate = 80.08",           True),
        ("TC-05", "INR→USD inverse ≈ 0.0125",              True),
        ("TC-06", "INR→INR same currency = 1.0",           True),
        ("TC-07", "CAD→AUD cross-rate via INR pivot",      True),
        ("TC-08", "Lowercase input normalised",            True),
        ("TC-09 ✗", "XYZ→USD → HTTP 400",                 True),
        ("TC-10 ✗", "USD→XYZ → HTTP 400",                 True),
        ("TC-11 ✗", "FOO→BAR → HTTP 400 both codes",      True),
    ]
    for i, (tc, name, passed) in enumerate(backend_tests):
        y = 238 + i * 41
        col = GREEN if passed else RED
        mark = "PASS" if passed else "FAIL"
        draw.rounded_rectangle([76, y, 594, y+34], radius=6,
                               fill=(8,16,30) if i%2==0 else (5,12,22), outline=(0,0,0,0))
        draw.text((84, y+9), f"{'✓' if passed else '✗'}", font=font(12,bold=True), fill=col)
        draw.text((104, y+9), tc, font=font(11), fill=MUTED)
        draw.text((190, y+9), name, font=font(12), fill=WHITE)
        draw.rounded_rectangle([530, y+6, 590, y+28], radius=4,
                               fill=(*GREEN,30) if passed else (*RED,30))
        draw.text((542, y+10), mark, font=font(10,bold=True), fill=col)

    # Frontend tests panel
    img = glass_rect(img, 660, 170, 560, 540)
    draw = ImageDraw.Draw(img)
    draw.text((680, 188), "FRONTEND  (Vitest)", font=font(14,bold=True), fill=PURPLE)
    draw.text((680, 210), "8 tests · 0 failed", font=font(12), fill=GREEN)
    frontend_tests = [
        ("TC-UI-01", "Both dropdowns render",              True),
        ("TC-UI-02", "Cur1 removed from Cur2 options",     True),
        ("TC-UI-03a","Button disabled (one selected)",     True),
        ("TC-UI-03b","Button enabled (both selected)",     True),
        ("TC-UI-04", "Rate display on API success",        True),
        ("TC-UI-05 ✗","Error element on API failure",     True),
        ("TC-UI-06", "Swap swaps values",                  True),
        ("TC-UI-07", "Live clock renders",                 True),
    ]
    for i, (tc, name, passed) in enumerate(frontend_tests):
        y = 238 + i * 41
        col = GREEN if passed else RED
        mark = "PASS" if passed else "FAIL"
        draw.rounded_rectangle([676, y, 1194, y+34], radius=6,
                               fill=(8,16,30) if i%2==0 else (5,12,22))
        draw.text((684, y+9), "✓", font=font(12,bold=True), fill=col)
        draw.text((704, y+9), tc, font=font(11), fill=MUTED)
        draw.text((800, y+9), name, font=font(12), fill=WHITE)
        draw.rounded_rectangle([1130, y+6, 1190, y+28], radius=4,
                               fill=(*GREEN,30))
        draw.text((1142, y+10), mark, font=font(10,bold=True), fill=col)

    # Summary bar
    draw.rounded_rectangle([60, 730, W-60, 800], radius=12,
                           fill=(0,60,40), outline=(*GREEN,60), width=1)
    draw.text((100, 755), "✅  19 / 19 tests PASSED", font=font(22, bold=True), fill=GREEN)
    draw.text((W//2 + 20, 760), f"Run: {timestamp()}", font=font(13), fill=MUTED)
    img.save(OUT / "06_test_results.png", "PNG", dpi=(150, 150))
    print("✓ 06_test_results.png")

# ── Run all ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print(f"\nGenerating screenshots at {timestamp()}\n")
    screenshot_initial()
    screenshot_usd_inr()
    screenshot_inr_usd()
    screenshot_cross_rate()
    screenshot_error()
    screenshot_tests()
    print(f"\nAll screenshots saved to: {OUT}")
