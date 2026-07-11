"""
E2E básico: login → simulador → aprovação de rascunho na Central.

Uso:
    python tests/e2e/test_smoke.py

Requer o dev server rodando em http://localhost:8080 (o sandbox Lovable já
provê isso automaticamente). Playwright + Chromium já vêm instalados.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

BASE = "http://localhost:8080"
SHOTS = Path(__file__).parent / "screenshots"
SHOTS.mkdir(parents=True, exist_ok=True)


async def main() -> None:
    failures: list[str] = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await ctx.new_page()
        page.on("pageerror", lambda e: print("PAGEERROR:", e))
        page.on("console", lambda m: (m.type == "error") and print("CONSOLE:", m.text))
        # 1. LOGIN — injeta sessão demo direto no sessionStorage (o AuthProvider
        # carrega a partir dali no mount). Evita flakiness com inputs controlados
        # em ambientes headless.
        await page.goto(f"{BASE}/login", wait_until="domcontentloaded")
        now = int(__import__("time").time() * 1000)
        session_payload = {
            "user": {
                "id": "u-admin",
                "name": "Fabrício Admin",
                "email": "fabricio@wfdigital.com.br",
                "role": "admin",
                "active": True,
                "avatarInitials": "FA",
                "teamId": "t-com",
                "availability": "disponivel",
            },
            "issuedAt": now,
            "expiresAt": now + 8 * 60 * 60 * 1000,
        }
        import json as _json
        await page.evaluate(
            "s => window.sessionStorage.setItem('wf-crm-demo-session', s)",
            _json.dumps(session_payload),
        )
        await page.screenshot(path=str(SHOTS / "1_login.png"))
        await page.goto(f"{BASE}/dashboard", wait_until="domcontentloaded")
        await page.wait_for_timeout(1500)
        if "/login" in page.url:
            failures.append(f"login: sessão não persistiu (url={page.url})")
        await page.screenshot(path=str(SHOTS / "2_dashboard.png"))

        # 2. SIMULADOR — envia mensagem, gera rascunho
        await page.goto(f"{BASE}/simulador", wait_until="domcontentloaded")
        await page.wait_for_timeout(500)
        chat_input = page.get_by_placeholder("Digite como se fosse o lead...")
        await chat_input.fill("Olá, gostaria de saber mais sobre os serviços de vocês")
        await chat_input.press("Enter")
        await page.wait_for_timeout(900)
        await page.screenshot(path=str(SHOTS / "3_simulador.png"))

        # 3. CENTRAL — aprovar rascunho
        await page.goto(f"{BASE}/central", wait_until="domcontentloaded")
        await page.wait_for_timeout(500)
        approve_buttons = page.locator('[data-testid^="approve-"]')
        approve_count = await approve_buttons.count()
        if approve_count == 0:
            failures.append("central: nenhum rascunho na fila do SDR")
        else:
            await approve_buttons.first.click()
            await page.wait_for_timeout(400)
        await page.screenshot(path=str(SHOTS / "4_central.png"))

        # 4. Verifica que sidebar tem toggle "Fase futura"
        toggle = page.get_by_test_id("nav-future-toggle")
        if await toggle.count() == 0:
            failures.append("sidebar: toggle Fase futura ausente")

        # 5. Export CSV disponível
        await page.goto(f"{BASE}/relatorios-sdr", wait_until="domcontentloaded")
        await page.wait_for_timeout(400)
        if await page.get_by_test_id("export-csv").count() == 0:
            failures.append("relatorios-sdr: botão Exportar CSV ausente")
        await page.screenshot(path=str(SHOTS / "5_relatorios_sdr.png"))

        # 6. Kill-switch por serviço presente
        await page.goto(f"{BASE}/empresa-servicos", wait_until="domcontentloaded")
        await page.wait_for_timeout(400)
        await page.locator("button", has_text="Serviços").first.click()
        await page.wait_for_timeout(300)
        toggles = page.locator('[data-testid^="sdr-toggle-"]')
        n = await toggles.count()
        if n == 0:
            failures.append("empresa-servicos: kill-switch por serviço ausente")
        await page.screenshot(path=str(SHOTS / "6_servicos.png"))

        await browser.close()

    if failures:
        print("FAIL")
        for f in failures:
            print(" -", f)
        raise SystemExit(1)
    print("OK — login → simulador → aprovação de rascunho passaram.")


if __name__ == "__main__":
    asyncio.run(main())
