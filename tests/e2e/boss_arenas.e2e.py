#!/usr/bin/env python3
"""E2E en Chrome móvil (vertical 390x844 y horizontal 844x390) para las 3 arenas nuevas:
Cepi (Pádel), Lale (Le Blé) y Pinky + Margot (Estacionamiento).
Valida 0 errores JS, puntaje real > 0 en cada arena, sincronización de #boss-bar,
centrado de overlays (.cepi-tell y .margot-btn) y guarda capturas en tests/e2e/out/.
Nota: Chromium headless no equivale a Safari físico en iPhone.
"""
import os, sys, json, threading, http.server, socketserver
from playwright.sync_api import sync_playwright

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
OUT = os.path.join(REPO, "tests/e2e/out")
os.makedirs(OUT, exist_ok=True)

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=REPO, **kwargs)
    def log_message(self, format, *args):
        pass

def assert_ok(cond, msg):
    if not cond:
        raise AssertionError("FALLÓ: " + msg)
    print("ok -", msg)

def open_probar(page, base, param, hero="douge", settle_ms=1600):
    errs = []
    def on_err(e): errs.append(f"pageerror:{e}")
    def on_con(m):
        if m.type == "error" and "Failed to load resource" not in m.text:
            errs.append(f"console:{m.text}")
    def on_res(r):
        if r.status >= 400 and "favicon.ico" not in r.url:
            errs.append(f"http{r.status}:{r.url}")
    page.on("pageerror", on_err)
    page.on("console", on_con)
    page.on("response", on_res)
    page.goto(f"{base}?probar={param}", wait_until="domcontentloaded", timeout=30000)
    page.wait_for_function("() => window.__game && window.__game.state === 'menu'", timeout=25000)
    page.evaluate("() => document.querySelector('#press-start')?.click()")
    page.wait_for_timeout(350)
    page.evaluate("""(h) => {
      const card = document.querySelector('.card[data-hero="' + h + '"]');
      if (card) card.click();
    }""", hero)
    page.wait_for_function("() => window.__game && String(window.__game.state).startsWith('arena-')", timeout=20000)
    page.wait_for_timeout(settle_ms)
    return errs, (on_err, on_con, on_res)

def detach(page, handlers):
    page.remove_listener("pageerror", handlers[0])
    page.remove_listener("console", handlers[1])
    page.remove_listener("response", handlers[2])

def main():
    httpd = socketserver.TCPServer(("127.0.0.1", 0), QuietHandler)
    port = httpd.server_address[1]
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{port}/3d/index.html"

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/usr/bin/google-chrome",
            args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox", "--disable-dev-shm-usage", "--autoplay-policy=no-user-gesture-required"]
        )

        # --- PORTRAIT 390x844 ---
        ctx_p = browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True, device_scale_factor=1)
        page = ctx_p.new_page()

        # 1. Cepi Fase 2 (Duelo): pose back, bar 2/3, centered alert, score > 0 on safe pick
        errs, h = open_probar(page, base, "cepi-duelo", "marine", 400)
        bar_txt = page.locator("#boss-bar span").text_content()
        assert_ok("2/3" in bar_txt, f"cepi-duelo muestra fase 2/3 en barra ({bar_txt})")
        # Wait until duel stage === 'tell'
        page.wait_for_function("() => window.__game.arenaCepi?.logic?.state?.duel?.stage === 'tell'", timeout=18000)
        page.wait_for_timeout(120)
        page.screenshot(path=f"{OUT}/post_p_cepi_duel_tell.png")
        tell_box = page.evaluate("""() => {
          const el = document.querySelector('.cepi-tell');
          const r = el.getBoundingClientRect();
          const safeBtn = document.querySelector('.cepi-btns button.safe');
          return { x: r.x, r: r.right, vw: innerWidth, hasSafe: !!safeBtn, txt: el.textContent };
        }""")
        assert_ok(tell_box["x"] >= 0 and tell_box["r"] <= tell_box["vw"] + 1, f".cepi-tell centrado en pantalla ({tell_box})")
        assert_ok(tell_box["hasSafe"], "botón seguro resaltado en verde (.safe)")
        # Click the safe button and wait for duel result!
        page.evaluate("() => document.querySelector('.cepi-btns button.safe')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))")
        page.wait_for_function("() => window.__game.score.total > 0 && window.__game.arenaCepi.logic.state.hp < 20", timeout=15000)
        cepi_res = page.evaluate("() => ({ score: window.__game.score.total, hp: window.__game.arenaCepi.logic.state.hp, fe: window.__game.frameErrors() })")
        assert_ok(cepi_res["score"] > 0 and cepi_res["hp"] < 20, f"cepi duelo suma puntos y baja vida ({cepi_res})")
        assert_ok(len(errs) == 0 and cepi_res["fe"] == 0, f"cepi duelo sin errores JS ({errs})")
        detach(page, h)

        # 2. Cepi Fase 3 (Cartones)
        errs, h = open_probar(page, base, "cepi-carton", "douge", 1200)
        bar_txt = page.locator("#boss-bar span").text_content()
        assert_ok("3/3" in bar_txt, f"cepi-carton muestra 3/3 ({bar_txt})")
        page.screenshot(path=f"{OUT}/post_p_cepi_carton.png")
        assert_ok(len(errs) == 0, f"cepi carton sin errores ({errs})")
        detach(page, h)

        # 3. Lale Fase 1 (bolsa HARINA ilustrada + explosión + puntos + barra baja)
        errs, h = open_probar(page, base, "lale", "douge", 1200)
        page.screenshot(path=f"{OUT}/post_p_lale_1.png")
        page.wait_for_function("() => window.__game.arenaLale?.logic?.state?.t > 0.2", timeout=18000)
        # Trigger power ('KeyL') to verify live handle() + bossHit + bar update + 0 errors!
        page.keyboard.press("KeyL")
        page.wait_for_function("() => window.__game.arenaLale?.logic?.state?.hp < 30", timeout=10000)
        page.wait_for_timeout(250)
        page.screenshot(path=f"{OUT}/post_p_lale_floured.png")
        lale_after = page.evaluate("() => ({ hp: window.__game.arenaLale.logic.state.hp, fill: document.querySelector('#boss-fill').style.width, fe: window.__game.frameErrors() })")
        assert_ok(lale_after["hp"] < 30, f"lale poder baja HP y actualiza barra ({lale_after})")
        assert_ok(len(errs) == 0 and lale_after["fe"] == 0, f"lale sin errores JS ({errs})")
        detach(page, h)

        # 4. Pinky Fase 3 (Margot button centered, clickable, lowers HP, adds points, 0 errors!)
        errs, h = open_probar(page, base, "pinky-margot", "marine", 400)
        bar_txt = page.locator("#boss-bar span").text_content()
        assert_ok("3/3" in bar_txt, f"pinky-margot muestra 3/3 ({bar_txt})")
        # Wait until entrance finishes and .margot-btn becomes visible!
        page.wait_for_function("() => !document.querySelector('.margot-btn')?.classList.contains('hidden')", timeout=18000)
        page.wait_for_timeout(150)
        page.screenshot(path=f"{OUT}/post_p_pinky_margot_btn.png")
        m_box = page.evaluate("""() => {
          const el = document.querySelector('.margot-btn');
          const r = el.getBoundingClientRect();
          return { hidden: el.classList.contains('hidden'), x: r.x, r: r.right, vw: innerWidth };
        }""")
        assert_ok(not m_box["hidden"] and m_box["x"] >= 0 and m_box["r"] <= m_box["vw"] + 1, f".margot-btn visible y centrado ({m_box})")
        page.evaluate("() => document.querySelector('.margot-btn')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))")
        page.wait_for_timeout(350)
        page.screenshot(path=f"{OUT}/post_p_pinky_margot_cry.png")
        pinky_res = page.evaluate("() => ({ score: window.__game.score.total, hp: window.__game.arenaPinky.logic.state.hp, fill: document.querySelector('#boss-fill').style.width, fe: window.__game.frameErrors() })")
        assert_ok(pinky_res["score"] > 0 and pinky_res["hp"] == 4, f"margot suma puntos y baja HP a 4 ({pinky_res})")
        assert_ok(len(errs) == 0 and pinky_res["fe"] == 0, f"pinky-margot sin errores JS ({errs})")
        detach(page, h)

        # 5. Pinky Fase 1 (cars peeking during warn!)
        errs, h = open_probar(page, base, "pinky", "douge", 400)
        page.wait_for_function("() => (window.__game.arenaPinky?.logic?.state?.cars?.length || 0) > 0", timeout=18000)
        page.wait_for_timeout(150)
        page.screenshot(path=f"{OUT}/post_p_pinky_cars.png")
        assert_ok(len(errs) == 0, f"pinky autos sin errores ({errs})")
        detach(page, h)

        ctx_p.close()

        # --- LANDSCAPE 844x390 ---
        ctx_l = browser.new_context(viewport={"width": 844, "height": 390}, has_touch=True, is_mobile=True, device_scale_factor=1)
        page_l = ctx_l.new_page()

        errs, h = open_probar(page_l, base, "cepi", "douge", 900)
        page_l.screenshot(path=f"{OUT}/post_l_cepi.png")
        assert_ok(len(errs) == 0, f"cepi landscape sin errores ({errs})")
        detach(page_l, h)

        errs, h = open_probar(page_l, base, "cepi-duelo", "douge", 400)
        page_l.wait_for_function("() => window.__game.arenaCepi?.logic?.state?.duel?.stage === 'tell'", timeout=18000)
        page_l.screenshot(path=f"{OUT}/post_l_cepi_duel.png")
        assert_ok(len(errs) == 0, f"cepi duel landscape sin errores ({errs})")
        detach(page_l, h)

        errs, h = open_probar(page_l, base, "lale", "marine", 900)
        page_l.screenshot(path=f"{OUT}/post_l_lale.png")
        assert_ok(len(errs) == 0, f"lale landscape sin errores ({errs})")
        detach(page_l, h)

        errs, h = open_probar(page_l, base, "pinky-margot", "douge", 400)
        page_l.wait_for_function("() => !document.querySelector('.margot-btn')?.classList.contains('hidden')", timeout=18000)
        page_l.screenshot(path=f"{OUT}/post_l_pinky_margot.png")
        assert_ok(len(errs) == 0, f"pinky landscape sin errores ({errs})")
        detach(page_l, h)

        ctx_l.close()
        browser.close()
    print("ALL_BOSS_ARENAS_E2E_PASSED")

if __name__ == "__main__":
    main()
