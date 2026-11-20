"""Run against a local static server. Requires Playwright and Chromium."""
from datetime import datetime, timezone
import os
import sys
from urllib.parse import urlparse
from playwright.sync_api import expect, sync_playwright

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
        page.clock.set_fixed_time(datetime(2026, 11, 21, 3, 5, tzinfo=timezone.utc))
        page.goto(base)
        page.wait_for_selector("#screen h1")
        page.evaluate("navigator.serviceWorker.ready")
        page.wait_for_function("() => !!navigator.serviceWorker.controller")
        cdp = ctx.new_cdp_session(page)
        assert not cdp.send("Page.getAppManifest")["errors"]
        assert not cdp.send("Page.getInstallabilityErrors")["installabilityErrors"]
        for lang in ("ru", "az", "en"):
            page.locator("#language").select_option(lang)
            page.wait_for_function("lang => document.documentElement.lang === lang", arg=lang)
            for route in ("today", "practices", "academy", "path", "journal", "profile", "schedule", "mentor"):
                page.evaluate("r => location.hash=r", route)
                page.wait_for_function("r => location.hash === '#'+r", arg=route)
                page.wait_for_timeout(40)
                assert page.locator("#screen h1").inner_text().strip()
                assert page.evaluate("document.documentElement.scrollWidth<=innerWidth"), (width, lang, route)
        page.goto(base + "#week")
        expect(page.locator(".week-day")).to_have_count(7)
        expect(page.locator(".week-day a[href^='#practice/']")).to_have_count(6)
        tabs = page.locator("#tabs a")
        assert tabs.count() == 5
        tabs.filter(has_text="Academy").click()
        expect(page.locator("#tabs a[aria-current]")).to_have_text("Academy")
        expect(page.locator("main h1")).to_have_text("Academy")
        tabs.filter(has_text="Practices").click()
        expect(page.locator(".practice-card")).to_have_count(6)
        page.locator('[data-practice-choice="duration"]').select_option("short")
        expect(page.locator(".practice-card")).to_have_count(2)
        page.locator('[data-practice-choice="level"]').select_option("familiar")
        expect(page.locator(".practice-card")).to_have_count(0)
        page.locator('[data-action="clear-practice-filters"]').click()
        expect(page.locator(".practice-card")).to_have_count(6)
        page.locator('[data-practice-choice="goal"]').select_option("rest")
        expect(page.locator(".practice-card")).to_have_count(1)
        tabs.filter(has_text="Profile").click()
        plan = page.locator("#notification-plan-form")
        plan.locator('[name="enabled"]').check()
        plan.locator('[name="morning"]').fill("07:05")
        plan.locator('[name="quietStart"]').fill("22:00")
        plan.locator('[name="quietEnd"]').fill("06:00")
        plan.get_by_role("button", name="Save").click()
        expect(page.locator("#reminder")).to_contain_text("Morning: Practices")
        expect(page.locator("#notification-plan-status")).to_have_text("Reminder schedule saved.")
        page.locator("#restart-theme").select_option("light")
        expect(page.locator("html")).to_have_attribute("data-theme", "light")
        page.reload()
        expect(page.locator("#restart-theme")).to_have_value("light")
        expect(plan.locator('[name="morning"]')).to_have_value("07:05")
        expect(plan.locator('[name="quietEnd"]')).to_have_value("06:00")
        expect(page.locator("#reminder")).not_to_contain_text("Morning: Practices")
        ctx.set_offline(True)
        page.goto(base + "#week")
        page.reload()
        expect(page.locator(".week-day")).to_have_count(7)
        expect(page.locator(".week-day a[href^='#practice/']")).to_have_count(6)
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
