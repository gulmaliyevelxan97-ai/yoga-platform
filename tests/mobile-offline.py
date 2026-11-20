"""Run against a local static server. Requires Playwright and Chromium."""
import os
import sys
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

base = sys.argv[1]
assert urlparse(base).hostname in ("localhost", "127.0.0.1")
with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=os.getenv("CHROMIUM", "/usr/bin/chromium"),
                                 args=["--no-sandbox"])
    for width in (360, 375, 390, 430):
        ctx = browser.new_context(viewport={"width": width, "height": 800},
                                  is_mobile=True, has_touch=True, reduced_motion="reduce")
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(base)
        page.wait_for_selector("#screen h1")
        page.evaluate("navigator.serviceWorker.ready")
        page.wait_for_function("!!navigator.serviceWorker.controller")
        cdp = ctx.new_cdp_session(page)
        assert not cdp.send("Page.getAppManifest")["errors"]
        assert not cdp.send("Page.getInstallabilityErrors")["installabilityErrors"]
        for lang in ("ru", "az", "en"):
            page.locator("#language").select_option(lang)
            page.wait_for_function("lang => document.documentElement.lang === lang", arg=lang)
            for route in ("today", "practices", "path", "journal", "profile", "schedule", "mentor"):
                page.evaluate("r => location.hash=r", route)
                page.wait_for_function("r => location.hash === '#'+r", arg=route)
                page.wait_for_timeout(40)
                assert page.locator("#screen h1").inner_text().strip()
                assert page.evaluate("document.documentElement.scrollWidth<=innerWidth"), (width, lang, route)
        ctx.set_offline(True)
        page.goto(base + "#journal")
        page.reload()
        notes = page.locator("textarea[name=notes]")
        notes.fill("QA offline note")
        page.locator("#journal-form .cta").click()
        page.wait_for_selector(".entry")
        page.reload()
        assert "QA offline note" in page.locator(".entry").inner_text()
        page.locator("[data-edit]").click()
        notes.fill("QA edited")
        page.locator("#journal-form .cta").click()
        assert "QA edited" in page.locator(".entry").inner_text()
        page.once("dialog", lambda dialog: dialog.accept())
        page.locator("[data-remove]").click()
        assert not page.locator(".entry").count()
        assert page.locator("#language").input_value() == "en"
        ctx.set_offline(False)
        page.reload()
        assert not page.locator(".entry").count()
        assert not errors, errors
        print(f"{width}px: manifest, installability, navigation, translations, offline journal and reload passed")
        ctx.close()
    browser.close()
