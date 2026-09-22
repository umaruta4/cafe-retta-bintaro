"""Run: python3 tests/test_gallery.py (requires Playwright + Chromium)."""
import functools
import http.server
import pathlib
import threading
from playwright.sync_api import sync_playwright, expect

ROOT = pathlib.Path(__file__).resolve().parents[1]
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(f'http://127.0.0.1:{server.server_port}')
    expect(page.locator('.brand img')).to_have_count(2)
    cards = page.locator('.product-card')
    expect(cards).to_have_count(12)
    ids = cards.evaluate_all('(cards) => cards.map(c => Number(c.dataset.id))')
    assert ids[:11] == [14,18,26,28,24,25,10,30,65,69,73]
    assert page.locator('.product-grid').evaluate('(e) => getComputedStyle(e).gridTemplateColumns.split(" ").length') == 4
    opener = cards.first
    opener.click()
    expect(page.get_by_role('dialog')).to_be_visible()
    page.keyboard.press('Escape')
    expect(opener).to_be_focused()
    page.get_by_role('button', name='Makanan', exact=True).click()
    expect(cards).to_have_count(8)
    expect(page.get_by_role('button', name='Makanan', exact=True)).to_have_attribute('aria-pressed', 'true')
    page.get_by_role('button', name='Semua', exact=True).click()
    page.get_by_role('button', name='Lihat foto lainnya').click()
    expect(cards).to_have_count(24)
    page.get_by_role('button', name='Lihat semua foto').click()
    expect(cards).to_have_count(45)
    assert page.locator('.map-card').get_attribute('href').startswith('https://www.google.com/maps/')
    for width in [1440, 390, 320]:
        page.set_viewport_size({'width': width, 'height': 844})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        if width < 600:
            assert page.locator('.product-grid').evaluate('(e) => getComputedStyle(e).gridTemplateColumns.split(" ").length') == 2
        for number in [1, 2]:
            page.get_by_role('button', name=f'Perbesar menu halaman {number}', exact=True).click()
            expect(page.get_by_role('dialog')).to_be_visible()
            page.get_by_role('button', name='Ukuran asli', exact=True).click()
            page.wait_for_function('document.querySelector("#viewer-image").naturalWidth > 0')
            assert page.locator('#viewer-image').evaluate('(e) => e.clientWidth === e.naturalWidth')
            if width < 600:
                assert page.locator('.viewer-pan').evaluate('(e) => e.scrollWidth > e.clientWidth')
                page.locator('.viewer-pan').evaluate('(e) => {e.scrollLeft = 200; e.scrollTop = 100}')
                assert page.locator('.viewer-pan').evaluate('(e) => e.scrollLeft > 0')
            page.get_by_role('button', name='Perbesar', exact=True).click()
            page.get_by_role('button', name='Perkecil', exact=True).click()
            page.get_by_role('button', name='Pas layar', exact=True).click()
            assert page.locator('#viewer-original').get_attribute('href').endswith(f'menu-{number}.jpg')
            page.keyboard.press('Escape')
            expect(page.get_by_role('button', name=f'Perbesar menu halaman {number}', exact=True)).to_be_focused()
    page.set_viewport_size({'width': 390, 'height': 844})
    page.get_by_role('button', name='Semua', exact=True).click()
    page.locator('#menu').scroll_into_view_if_needed()
    page.screenshot(path='/tmp/retta-gallery-mobile.png', full_page=True)
    page.set_viewport_size({'width': 1440, 'height': 1000})
    page.locator('#menu').screenshot(path='/tmp/retta-gallery-desktop.png')
    # Direct original links remain usable without JavaScript.
    fallback = browser.new_page(java_script_enabled=False)
    fallback.goto(f'http://127.0.0.1:{server.server_port}')
    expect(fallback.locator('.menu-page > a')).to_have_count(2)
    fallback.close()
    # A failed catalog must not disable the independent official-menu viewer.
    failed = browser.new_page()
    failed.route('**/catalog.json', lambda route: route.fulfill(status=503, body='unavailable'))
    failed.goto(f'http://127.0.0.1:{server.server_port}')
    expect(failed.locator('#gallery-status')).to_contain_text('Foto belum dapat dimuat')
    failed.get_by_role('button', name='Perbesar menu halaman 1', exact=True).click()
    expect(failed.get_by_role('dialog')).to_be_visible()
    failed.get_by_role('button', name='Tutup ×', exact=True).click()
    expect(failed.get_by_role('dialog')).not_to_be_visible()
    failed.close()
    assert not errors, errors
    print('PASS: logos, curated 12 / all 45, filters, dialog Escape/focus, two original menus, zoom/pan, 1440/390/320 responsive, map link, no JS errors, no-JS links, catalog failure fallback.')
    browser.close()
server.shutdown()
