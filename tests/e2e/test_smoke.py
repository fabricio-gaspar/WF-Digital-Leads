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

        # 1. LOGIN
        await page.goto(f"{BASE}/login", wait_until="domcontentloaded")
        await page.fill("#email", "fabricio@wfdigital.com.br")
        await page.fill("#password", "demo123")
        await page.screenshot(path=str(SHOTS / "1_login.png"))
        await page.get_by_role("button", name="Entrar no CRM").click()
        try:
            await page.wait_for_url(f"{BASE}/dashboard", timeout=8000)
        except Exception:
            failures.append(f"login: URL final foi {page.url}")
        await page.screenshot(path=str(SHOTS / "2_dashboard.png"))

        # 2. SIMULADOR — envia mensagem, gera rascunho
        await page.goto(f"{BASE}/simulador", wait_until="domcontentloaded")
        await page.wait_for_timeout(500)
        textarea = page.locator("textarea").first
        await textarea.fill("Olá, gostaria de saber mais sobre os serviços de vocês")
        await page.get_by_role("button", name="Enviar").first.click()
        await page.wait_for_timeout(800)
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
        await page.get_by_role("button", name="Serviços").click()
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
