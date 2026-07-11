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

        # 3. Verifica toast "Rascunho enviado para a Central" no simulador.
        body_text = await page.locator("body").inner_text()
        if "Rascunho enviado" not in body_text:
            failures.append("simulador: toast de rascunho ausente")

        # 4. Sidebar tem toggle "Fase futura" (visível no simulador).
        if await page.get_by_test_id("nav-future-toggle").count() == 0:
            failures.append("sidebar: toggle Fase futura ausente")

        # 5. Navega via SPA (Link) para relatórios SDR e valida botão Exportar CSV.
        await page.get_by_test_id("nav-relatorios-sdr").click()
        await page.wait_for_timeout(1000)
        if await page.get_by_test_id("export-csv").count() == 0:
            failures.append("relatorios-sdr: botão Exportar CSV ausente")
        await page.screenshot(path=str(SHOTS / "5_relatorios_sdr.png"))

        # 6. Navega via SPA para empresa-servicos e valida kill-switch.
        await page.get_by_test_id("nav-empresa-servicos").click()
        await page.wait_for_timeout(1000)
        await page.locator("button", has_text="Serviços").first.click()
        await page.wait_for_timeout(400)
        if await page.locator('[data-testid^="sdr-toggle-"]').count() == 0:
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
