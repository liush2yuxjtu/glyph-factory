"""Real review/player iframe contracts; run against review-dist, never a mock UI.

GLYPH_BROWSER selects chromium or webkit. Fixtures provide boundary states;
F01/F02/F03 checks then operate the actual production UI and persisted save.
"""
from datetime import datetime, timedelta, timezone
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
import os
import re
import unittest
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[2]
SAVE = 'glyph-factory-save-v3'
REVEALS = 'glyph-factory-ui-reveals-v3'
FIXED = datetime(2026, 9, 18, 12, 0, tzinfo=timezone.utc)
META = re.compile(r'\bA(?:0[1-9]|1\d|2[0-8])\b|\bAHA\b|\bACT\s+[IVX\d]|Director Mode|导演模式', re.I)

class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *args): pass
    def list_directory(self, path): self.send_error(404)
    def do_GET(self):
        if self.path == '/favicon.ico':
            self.send_response(204); self.end_headers(); return
        super().do_GET()
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store'); super().end_headers()

class AhaReview(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not (ROOT / 'review-dist/aha.html').is_file():
            raise RuntimeError('Build review-dist with node scripts/build-aha-review.mjs first.')
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(ROOT/'review-dist')))
        cls.thread = Thread(target=cls.server.serve_forever, daemon=True); cls.thread.start()
        cls.origin = f'http://127.0.0.1:{cls.server.server_port}'
        cls.pw = sync_playwright().start()
        cls.name = os.environ.get('GLYPH_BROWSER', 'chromium')
        if cls.name not in ('chromium', 'webkit'): raise ValueError(cls.name)
        cls.browser = getattr(cls.pw, cls.name).launch(headless=True)
        cls.artifacts = ROOT / 'test-results' / ('aha-' + cls.name)
        cls.artifacts.mkdir(parents=True, exist_ok=True)
    @classmethod
    def tearDownClass(cls):
        cls.browser.close(); cls.pw.stop()
        cls.server.shutdown(); cls.server.server_close(); cls.thread.join(timeout=5)
    def setUp(self):
        self.context = self.browser.new_context(locale='zh-CN', viewport={'width':1280,'height':900}, reduced_motion='reduce')
        self.context.tracing.start(screenshots=True, snapshots=True, sources=True)
        self.page = self.context.new_page(); self.page.set_default_timeout(6000)
        self.errors=[]
        self.page.on('pageerror',lambda err:self.errors.append(str(err)))
        self.page.on('console',lambda msg:self.errors.append(msg.text) if msg.type=='error' else None)
        self.page.on('requestfailed',lambda req:self.errors.append(str(req.failure)))
        self.page.clock.install(time=FIXED)
        self.page.clock.pause_at(FIXED+timedelta(seconds=1))
    def tearDown(self):
        try:
            self.page.clock.run_for(1500)
            self.assertEqual(self.errors,[], 'Uncaught browser/console/network error')
        finally:
            self.page.screenshot(path=str(self.artifacts/(self._testMethodName+'.png')),full_page=True)
            self.context.tracing.stop(path=str(self.artifacts/(self._testMethodName+'.zip')))
            self.context.close()
    def open(self, path='/aha.html'):
        self.assertEqual(self.page.goto(self.origin+path, wait_until='networkidle').status,200)
        expect(self.page.locator('#verify-all')).to_be_enabled()
        self.assertEqual(self.page.locator('#aha-catalog button').count(),28)
    def review_frame(self): return self.page.frame_locator('#review-frame')
    def real_frame(self): return self.page.frame_locator('#player-frame')
    def button(self, label): return self.real_frame().get_by_role('button',name=re.compile(re.escape(label)))
    def saved(self): return self.page.evaluate(f"JSON.parse(localStorage.getItem('{SAVE}'))")
    def assert_player(self):
        frame=self.real_frame()
        self.assertNotRegex(frame.locator('body').inner_text(), META)
        self.assertNotRegex(frame.locator('body').aria_snapshot(), META)
    def seed(self, state):
        self.context.add_init_script('''(() => {
          if(sessionStorage.getItem('intent-seeded')) return;
          sessionStorage.setItem('intent-seeded','1');
          const state=STATE; state.updatedAt=Date.now(); state.startedAt=Date.now();
          localStorage.setItem('glyph-factory-save-v3',JSON.stringify(state));
        })();'''.replace('STATE',json.dumps(state)))
    def run_all(self):
        self.page.locator('#verify-all').click()
        self.page.clock.run_for(2000)
        self.page.wait_for_function("['pass','fail'].includes(document.querySelector('#audit-status').dataset.result)")
        return self.page.locator('#audit-status').get_attribute('data-result')

    def test_all_28_verification_is_repeatable_and_preserves_real_save(self):
        self.open()
        self.button('印字').click(); self.button('出售全部库存').click()
        before=self.saved(); before.pop('updatedAt'); before.pop('startedAt')
        reveals=self.page.evaluate(f"localStorage.getItem('{REVEALS}')")
        for attempt in range(2):
            self.assertEqual(self.run_all(),'pass',self.page.locator('#audit-status').inner_text())
            evidence=json.loads(self.page.locator('#audit-evidence').text_content())
            self.assertEqual(len(evidence),28)
            self.assertTrue(all(item['pass'] for item in evidence))
        after=self.saved(); after.pop('updatedAt'); after.pop('startedAt')
        self.assertEqual(after,before)
        self.assertEqual(self.page.evaluate(f"localStorage.getItem('{REVEALS}')"),reveals)
        self.assert_player()

    def test_F01_real_print_sale_automation_and_reload(self):
        self.open()
        for _ in range(10): self.button('印字').click()
        self.button('出售全部库存').click()
        machine=self.real_frame().locator('.machine').filter(has_text='机械键盘')
        machine.get_by_role('button',name='购买').click()
        expect(machine.get_by_role('button',name='购买')).to_be_disabled()
        self.assertEqual(self.saved()['credits'],0)
        self.page.clock.run_for(3000)
        self.assertGreater(float(self.real_frame().locator('#glyphs').inner_text()),0)
        self.page.reload(wait_until='networkidle')
        expect(machine).to_be_visible()
        self.assertEqual(self.saved()['keyboards'],1)
        self.assert_player()

    def test_F02_city_and_world_require_real_actions(self):
        self.seed({'version':3,'act':2,'published':True,'paperCrisis':True,'composed':10,'meaning':400,'deletedNoise':1,
                   'readers':5000,'credits':5000})
        self.open()
        expect(self.real_frame().locator('#world-card')).to_be_hidden()
        # 进城和地图是两件事：读完第二章就进城（读者、意义、删除三样都到位），
        # 地图要城里真的有了两种以上街区才画得出来。
        self.page.clock.run_for(2500)   # 存档有 1.8 秒节流，城市是在刻度里自己开出来的
        expect(self.real_frame().locator('#world-card')).to_be_visible()
        self.assertEqual(self.saved()['act'],3)
        self.assertEqual(self.saved()['worldScale'],0)
        self.button('观察一个新方言').click()
        self.button('创造一个概念').click()
        self.button('展开城市地图').click()
        self.assertEqual(self.saved()['worldScale'],1)
        # A dialect is grown by a population rather than minted by a button: each observation
        # needs more readers than the last (`readers >= 600 x (districts + 1)`). Zooming out
        # takes the city to three districts and two concepts — one click per insight is exactly
        # the collapse this replaced.
        for _ in range(2):
            self.button('观察一个新方言').click()
        for _ in range(1):
            self.button('创造一个概念').click()
        self.button('把地图缩到世界').click()
        self.assertEqual(self.saved()['worldScale'],2)
        expect(self.real_frame().locator('#world-scale')).to_have_text('传播网络')
        self.page.reload(wait_until='networkidle')
        expect(self.real_frame().locator('#world-card')).to_be_visible()
        self.assert_player()

    def test_F03_real_deletion_unlocks_final_stop(self):
        self.seed({'version':3,'act':6,'published':True,'infrastructure':True,'compressedMeaning':50000,'deletedNoise':0,'noise':1500,'ambiguity':100,'presses':1})
        self.open()
        expect(self.button('停止印刷')).to_have_count(0)
        # 歧义没消解之前删不动：分不清哪句是噪音。这条门槛同时把 A27 排在 A26 后面，
        # 否则「目标从生产变成删除」会抢在「新资源：歧义」前面发生。
        expect(self.button('删除噪音')).to_be_disabled()
        self.button('消解 25').click()   # 灰掉的删除按钮上写着「还差 已消解歧义」，只匹配「消解」会撞上它
        # 一次删 250、消解本身送 250，所以到 1000 要按三下；停机还要等歧义被清掉。
        for _ in range(2):
            self.button('删除噪音').click()
            expect(self.button('停止印刷')).to_have_count(0)
        self.button('删除噪音').click()
        self.button('停止印刷').click()
        expect(self.real_frame().locator('#ending')).to_be_visible()
        expect(self.real_frame().locator('#rate')).to_have_text('0')
        self.assertEqual(self.real_frame().locator('#primary-actions button:enabled').count(),0)
        before=self.saved()['glyphs']; self.page.clock.run_for(6000)
        self.assertEqual(self.saved()['glyphs'],before)
        self.page.reload(wait_until='networkidle'); self.assertTrue(self.saved()['stopped'])
        self.assert_player()

    def test_wrong_state_is_rejected_even_when_requested_select_value_matches(self):
        self.open()
        result=self.page.evaluate('''() => {
          const doc=document.getElementById('review-frame').contentDocument;
          doc.getElementById('director-select').value='A22';
          return GlyphAhaAudit.inspect(doc,'A22');
        }''')
        self.assertTrue(result['errors'])
        self.assertIn('actual preview does not match requested ID',result['errors'])

    def test_noop_click_cannot_report_success(self):
        self.open()
        result=self.page.evaluate('''() => {
          const doc=document.getElementById('review-frame').contentDocument;
          const b=doc.querySelector('#primary-actions button[data-command="print"]');
          b.addEventListener('click',e=>{e.stopImmediatePropagation();e.preventDefault();},{capture:true});
          return GlyphAhaAudit.exercise(doc,'A01');
        }''')
        self.assertFalse(result['pass'])
        self.assertIn('print did not produce its required state transition',result['errors'])

    def test_full_verifier_rejects_a_broken_action_not_just_unit_detector(self):
        self.open()
        self.page.evaluate('''() => {
          const doc=document.getElementById('review-frame').contentDocument;
          doc.addEventListener('click',e=>{
            if(e.target.closest('#primary-actions button[data-command="print"]')) {
              e.stopImmediatePropagation();e.preventDefault();
            }
          },true);
        }''')
        self.assertEqual(self.run_all(),'fail')
        evidence=json.loads(self.page.locator('#audit-evidence').text_content())
        self.assertTrue(any(not r['pass'] for r in evidence))
        self.assertIn('A01',self.page.locator('#audit-status').inner_text())

    def test_missing_runtime_is_fail_closed(self):
        # Controlled blank iframe is intentional: other browser errors are still fatal.
        self.context.route('**/review/play.html?director=1', lambda route:route.fulfill(status=200,content_type='text/html',body='<h1>Runtime unavailable</h1>'))
        self.page.goto(self.origin+'/aha.html',wait_until='networkidle')
        expect(self.page.locator('#verify-all')).to_be_disabled()
        expect(self.page.locator('#audit-status')).to_have_attribute('data-result','fail')
        self.assertNotIn('28 / 28 PASS',self.page.locator('#audit-status').inner_text())

    def test_document_links_preview_route_keyboard_and_responsive_layout(self):
        for width in (320,390,1280):
            self.page.set_viewport_size({'width':width,'height':900})
            self.open('/aha-lab/')
            self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth-innerWidth'),1)
            self.page.locator('[data-aha="A22"]').press('Enter')
            expect(self.page.locator('[data-aha="A22"]')).to_have_attribute('aria-current','true')
            self.assert_player()
        response=self.context.request.get(self.origin+'/aha.md')
        self.assertEqual(response.status,200)
        self.assertIn('Hidden means absent',response.text())
        for path in ['/aha.html','/intent.html']:
            self.assertEqual(self.context.request.get(self.origin+path).status,200)


def aha_case(id):
    def case(self):
        self.open()
        self.page.locator(f'[data-aha="{id}"]').click()
        result=self.page.evaluate('''id=>GlyphAhaAudit.exercise(document.getElementById('review-frame').contentDocument,id)''',id)
        self.assertTrue(result['pass'],json.dumps(result,ensure_ascii=False))
        if id=='A28':
            expect(self.review_frame().locator('#ending')).to_be_visible()
            self.assertEqual(self.review_frame().locator('#primary-actions button:enabled').count(),0)
        self.assert_player()
    return case
for number in range(1,29):
    id=f'A{number:02}'
    setattr(AhaReview,f'test_state_{id}_real_invariant_and_action',aha_case(id))

if __name__=='__main__': unittest.main(verbosity=2)
