"""Browser smoke checks; pip install playwright, then python3 tests/browser_check.py."""
import base64
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import urlparse

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / 'build'
ARTIFACTS.mkdir(exist_ok=True)


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/'


def settled(page):
    page.wait_for_function("['ready','fallback'].includes(document.body.dataset.scene)")
    page.evaluate('document.fonts.ready')


def canvas_image(page):
    return page.locator('#lab-scene canvas').evaluate('(c) => c.toDataURL("image/png")')


try:
    with sync_playwright() as p:
        launch = {'headless': True, 'args': ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']}
        chrome = os.environ.get('CHROME_BIN', '/opt/google/chrome/chrome')
        if Path(chrome).is_file():
            launch['executable_path'] = chrome
        browser = p.chromium.launch(**launch)
        context = browser.new_context(viewport={'width':1440, 'height':1100}, reduced_motion='reduce')
        page = context.new_page()
        errors, requests, failures = [], [], []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('request', lambda r: requests.append(r.url))
        page.on('response', lambda r: failures.append((r.url,r.status)) if r.status >= 400 else None)
        page.goto(url, wait_until='networkidle')
        settled(page)
        expect(page.locator('body')).to_have_attribute('data-scene','ready')
        expect(page.locator('#motion-toggle')).to_have_attribute('aria-pressed','true')
        expect(page.locator('#scene-loading')).to_be_hidden()
        expect(page.locator('.learning-card:not(.data-card)')).to_have_attribute('href','https://jamlabq.github.io/LearnEverything/')
        expect(page.locator('.data-card')).to_have_attribute('href','https://jamlabq.github.io/data-lab/')
        expect(page.locator('.github-link')).to_have_attribute('href','https://github.com/jamlabq')
        for target in ['projects','about','laboratory']:
            assert page.locator('#'+target).count() == 1
        base = canvas_image(page)
        (ARTIFACTS / 'scene.png').write_bytes(base64.b64decode(base.split(',')[1]))
        page.screenshot(path=str(ARTIFACTS / 'desktop.png'))
        page.screenshot(path=str(ARTIFACTS / 'full.png'), full_page=True)

        for object_id in ['robot','signal','rover','core']:
            hot = page.locator(f'[data-object="{object_id}"]')
            hot.click()
            expect(page.locator('#object-dialog')).to_be_visible()
            assert page.locator('#object-title').inner_text().strip()
            page.keyboard.press('Escape')
            expect(page.locator('#object-dialog')).to_be_hidden()
            expect(hot).to_be_focused()
        for object_id in ['robot','signal','rover']:
            before = canvas_image(page)
            page.locator(f'[data-object="{object_id}"]').click()
            page.locator('#object-action').click()
            expect(page.locator('#object-dialog')).to_be_hidden()
            assert before != canvas_image(page), f'{object_id} did not respond'
        print('PASS: four keyboard-accessible dialogs; three devices respond while motion is reduced')

        page.reload(wait_until='networkidle')
        settled(page)
        page.locator('#night-toggle').click()
        page.locator('#core-trigger').click()
        expect(page.locator('#night-toggle')).to_have_attribute('aria-pressed','true')
        expect(page.locator('#core-trigger')).to_have_attribute('aria-pressed','true')
        expect(page.locator('#core-response')).to_contain_text('已唤醒')
        activated = canvas_image(page)
        assert activated != base
        page.screenshot(path=str(ARTIFACTS / 'night.png'))
        page.locator('[data-object="core"]').click()
        expect(page.locator('#object-action')).to_contain_text('回到待机')
        page.locator('#object-action').click()
        expect(page.locator('#core-trigger')).to_have_attribute('aria-pressed','false')
        page.locator('#motion-toggle').click()
        expect(page.locator('#motion-toggle')).to_have_attribute('aria-pressed','false')
        page.locator('#motion-toggle').click()
        expect(page.locator('#motion-toggle')).to_have_attribute('aria-pressed','true')
        print('PASS: night, core activation and pause controls')

        page.reload(wait_until='networkidle')
        settled(page)
        for width in [320,360,390,540,541,560,600,768,850,851,1024,1440]:
            page.set_viewport_size({'width':width,'height':900})
            # Chromium can acknowledge a viewport resize before media queries and
            # ResizeObserver have caught up, especially with software WebGL.
            page.wait_for_function('document.documentElement.scrollWidth <= innerWidth', timeout=5000)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Horizontal overflow at {width}'
            if width == 390:
                page.screenshot(path=str(ARTIFACTS / 'mobile.png'))
                page.screenshot(path=str(ARTIFACTS / 'mobile-full.png'), full_page=True)
        print('PASS: 12 viewport widths, 320–1440 px; no horizontal overflow')

        # Interaction while the large scene module is still downloading must be replayed.
        delayed = context.new_page()
        held = []
        delayed.route('**/lab-scene.mjs', lambda route: held.append(route))
        delayed.goto(url, wait_until='commit')
        delayed.locator('#night-toggle').click()
        delayed.locator('#core-trigger').click()
        assert held
        held[0].continue_()
        settled(delayed)
        assert canvas_image(delayed) == activated, 'Scene lost state chosen during loading'
        delayed.close()
        print('PASS: controls selected during scene loading match the final render')

        fallback = context.new_page()
        fallback.route('**/lab-scene.mjs', lambda route: route.abort())
        fallback.goto(url, wait_until='networkidle')
        settled(fallback)
        expect(fallback.locator('body')).to_have_attribute('data-scene','fallback')
        expect(fallback.locator('#night-toggle')).to_be_disabled()
        expect(fallback.locator('#motion-toggle')).to_be_disabled()
        assert fallback.locator('.scene-fallback').evaluate('(img)=>img.complete && img.naturalWidth>0')
        fallback.locator('[data-object="core"]').click()
        expect(fallback.locator('#object-dialog')).to_be_visible()
        fallback.keyboard.press('Escape')
        fallback.screenshot(path=str(ARTIFACTS / 'fallback.png'))
        fallback.close()
        print('PASS: failed 3D module keeps static scene, descriptions and links available')

        nojs = browser.new_context(java_script_enabled=False, viewport={'width':390,'height':900})
        static = nojs.new_page()
        static.goto(url, wait_until='networkidle')
        expect(static.locator('#scene-loading')).to_be_hidden()
        expect(static.locator('#scene-hotspots')).to_be_hidden()
        expect(static.locator('#core-trigger')).to_be_hidden()
        expect(static.locator('.learning-card:not(.data-card)')).to_be_visible()
        expect(static.locator('.data-card')).to_be_visible()
        assert static.locator('.scene-fallback').evaluate('(img)=>img.complete && img.naturalWidth>0')
        static.screenshot(path=str(ARTIFACTS / 'nojs.png'))
        nojs.close()
        print('PASS: without JavaScript, static scene and project link remain usable')

        assert not errors, errors
        assert not failures, failures
        assert all(urlparse(r).hostname == '127.0.0.1' for r in requests), requests
        print('PASS: no page errors, failed assets or external runtime requests')
        browser.close()
finally:
    server.shutdown()
    server.server_close()
