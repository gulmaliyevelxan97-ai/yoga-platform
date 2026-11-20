"""Exercise real worker upgrades using a disposable copy and a loopback server."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path
import re
from shutil import copytree
from tempfile import TemporaryDirectory
from threading import Thread

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
CACHE_PREFIX = "restart-app:/app/:"


class FixtureHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def copyfile(self, source, outputfile):
        try:
            super().copyfile(source, outputfile)
        except (BrokenPipeError, ConnectionResetError):
            # A rejected worker installation may cancel its other asset requests.
            pass

    def log_message(self, *_):
        pass


def check_update(base, app):
    worker = app / "sw.js"
    html = app / "index.html"
    initial = worker.read_text()
    version = re.search(r"const VERSION = '([^']+)';", initial)[1]
    old_cache = CACHE_PREFIX + version
    new_cache = CACHE_PREFIX + "fixture-current"

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            executable_path=os.environ.get("CHROMIUM", "/usr/bin/chromium"), args=["--no-sandbox"]
        )
        context = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
        page = context.new_page()
        page.goto(base + "#journal")
        expect(page.locator("main h1")).to_be_visible()
        page.evaluate("""() => {
          if (navigator.serviceWorker.controller) return;
          return new Promise((resolve,reject) => {
            const timeout = setTimeout(() => reject(Error('App worker did not take control')), 10000);
            navigator.serviceWorker.addEventListener('controllerchange', () => {
              clearTimeout(timeout);
              resolve();
            }, {once:true});
          });
        }""")
        notes = page.locator('textarea[name="notes"]')
        notes.fill("QA saved journal entry")
        page.locator("#journal-form button[type=submit], #journal-form .cta").first.click()
        expect(page.locator(".entry").first).to_contain_text("QA saved journal entry")
        notes.fill("QA unsaved journal draft")
        assert page.evaluate("async key => (await caches.keys()).includes(key)", old_cache)
        page.evaluate("caches.open('restart-shell:/fixture:public')")

        # An interrupted deployment serves a worker that requires a missing file.
        broken = initial.replace(version, "fixture-broken").replace(
            "'./premium.css'", "'./missing-update-fixture.css'"
        )
        worker.write_text(broken)
        state = page.evaluate("""async () => {
          const registration = await navigator.serviceWorker.ready;
          const state = new Promise((resolve,reject) => {
            const timeout = setTimeout(() => reject(Error('No candidate worker result')), 10000);
            registration.addEventListener('updatefound', () => {
              const candidate = registration.installing;
              candidate.addEventListener('statechange', () => {
                if (candidate.state === 'redundant' || candidate.state === 'installed') {
                  clearTimeout(timeout);
                  resolve(candidate.state);
                }
              });
            }, {once:true});
          });
          await registration.update();
          return state;
        }""")
        assert state == "redundant", state
        assert page.evaluate("async key => (await caches.keys()).includes(key)", old_cache)
        expect(notes).to_have_value("QA unsaved journal draft")

        # A complete update waits until the user explicitly accepts.
        html.write_text(html.read_text().replace("<body>", '<body data-release="fixture-current">', 1))
        worker.write_text(initial.replace(version, "fixture-current"))
        page.evaluate("async () => (await navigator.serviceWorker.ready).update()")
        update = page.locator('[data-action="update"]')
        expect(update).to_be_visible()
        expect(page.locator("body")).not_to_have_attribute("data-release", "fixture-current")
        page.once("dialog", lambda dialog: dialog.dismiss())
        update.click()
        expect(notes).to_have_value("QA unsaved journal draft")
        expect(update).to_be_visible()

        page.once("dialog", lambda dialog: dialog.accept())
        update.click()
        expect(page.locator("body")).to_have_attribute("data-release", "fixture-current")
        assert page.evaluate(
            "async prefix => (await caches.keys()).filter(key => key.startsWith(prefix))", CACHE_PREFIX
        ) == [new_cache]
        assert page.evaluate("(async () => (await caches.keys()).includes('restart-shell:/fixture:public'))()")

        # Offline launch uses the new shell and the saved entry remains available.
        context.set_offline(True)
        page.reload()
        expect(page.locator("body")).to_have_attribute("data-release", "fixture-current")
        expect(page.locator(".entry").first).to_contain_text("QA saved journal entry")
        expect(notes).not_to_have_value("QA unsaved journal draft")
        browser.close()


if __name__ == "__main__":
    with TemporaryDirectory(prefix="restart-pwa-fixture-") as directory:
        fixture = Path(directory)
        for folder in ("app", "assets"):
            copytree(ROOT / folder, fixture / folder)
        with ThreadingHTTPServer(("127.0.0.1", 0), partial(FixtureHandler, directory=fixture)) as server:
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                check_update(f"http://127.0.0.1:{server.server_port}/app/", fixture / "app")
            finally:
                server.shutdown()
                thread.join()
    print("Failed install, deferred activation, cancellation, accepted update, cache isolation and offline journal passed.")
