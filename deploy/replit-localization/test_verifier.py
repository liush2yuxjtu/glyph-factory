"""Offline verifier tests. Navigation/storage are simulated, not production evidence."""
import json
import os
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

from playwright.sync_api import sync_playwright
from verify_live import verify

FIXTURE = r'''<!doctype html><html lang="zh-CN"><title>Verifier fixture, not production</title>
<style>body{margin:12px;font-family:system-ui}button{min-height:44px;margin:4px}header{display:flex}#panel{padding:10px}</style>
<header><button id="zh">简体中文</button><button id="en">English</button></header>
<div id="resource"><span id="resource-label"></span><b id="count"></b></div><main id="panel"></main>
<nav><button id="forge-tab"></button><button id="system-tab"></button></nav>
<script>
const mode=window.fixtureMode; let lang=localStorage.getItem('locale')||'zh-CN';
let count=Number(localStorage.getItem('game')||0), panel='forge';
function render(){
 const zh=lang==='zh-CN'; document.documentElement.lang=lang;
 document.querySelector('#resource-label').textContent=zh?'资源':'Resources';
 document.querySelector('#count').textContent=count;
 document.querySelector('#forge-tab').textContent=zh?'铸造':'FORGE';
 document.querySelector('#system-tab').textContent=zh?'系统':'SYSTEM';
 document.querySelector('#panel').innerHTML=panel==='forge'?'<button id="action">'+(zh?'铸造字符':'FORGE GLYPH')+'</button>':
 '<h2>'+(zh?'统计':'Statistics')+'</h2><h3>'+(zh?'危险操作':'Danger Zone')+'</h3><p>'+(zh?'清除核心记忆将永久删除所有进度。':'Wiping the core permanently deletes all progress.')+'</p><button id="wipe">'+(zh?'清除全部进度':'Initiate Core Wipe')+'</button>';
 if(panel==='forge') document.querySelector('#action').onclick=()=>{count++;localStorage.setItem('game',count);render()};
 if(panel==='system') document.querySelector('#wipe').onclick=()=>{throw new Error('Verifier must never reset')};
}
function change(v){
 if(mode==='/no-op') return;
 lang=v; localStorage.setItem('locale',v);
 if(mode==='/loses-progress'){count=0;localStorage.setItem('game','0')}
 render();
}
document.querySelector('#zh').onclick=()=>change('zh-CN');document.querySelector('#en').onclick=()=>change('en');
document.querySelector('#forge-tab').onclick=()=>{panel='forge';render()};
document.querySelector('#system-tab').onclick=()=>{panel='system';render()};
render();
if(mode==='/offscreen') document.querySelector('header').style.transform='translateX(-10000px)';
</script></html>'''


class OfflinePage:
    """Use Chromium DOM/actions without network access. Simulate fixture reloads."""
    def __init__(self, page, mode):
        self.page, self.mode, self.storage = page, mode, {}

    def __getattr__(self, name):
        return getattr(self.page, name)

    def goto(self, url, **kwargs):
        self.page.goto('about:blank')
        setup = """<script>
          window.fixtureMode = MODE;
          window.fixtureStorage = STORAGE;
          Object.defineProperty(window, 'localStorage', {configurable: true, value: {
            getItem: k => window.fixtureStorage[k] ?? null,
            setItem: (k, v) => {window.fixtureStorage[k] = String(v)}
          }});
        </script>""".replace('MODE', json.dumps('/' + self.mode)).replace('STORAGE', json.dumps(self.storage))
        self.page.set_content(FIXTURE.replace('<script>', setup + '<script>', 1))
        return SimpleNamespace(ok=True)

    def reload(self, **kwargs):
        self.storage = self.page.evaluate('window.fixtureStorage')
        return self.goto('about:blank')


class VerifierTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch(executable_path=os.getenv('CHROMIUM_EXECUTABLE'))
        cls.tmp = tempfile.TemporaryDirectory()

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()
        cls.tmp.cleanup()

    def run_fixture(self, mode, width=390):
        context = self.browser.new_context(viewport={'width': width, 'height': 900})
        try:
            return verify(OfflinePage(context.new_page(), mode), 'https://fixture.invalid/' + mode, width, Path(self.tmp.name), 0)
        finally:
            context.close()

    def test_complete_flow_on_mobile(self):
        result = self.run_fixture('good')
        self.assertTrue(result['passed'], result)
        self.assertEqual(len(result['checks']), 6)

    def test_complete_flow_on_desktop(self):
        result = self.run_fixture('good', 1280)
        self.assertTrue(result['passed'], result)

    def test_rejects_decorative_switch(self):
        self.assertFalse(self.run_fixture('no-op')['passed'])

    def test_rejects_progress_loss(self):
        result = self.run_fixture('loses-progress')
        self.assertFalse(result['passed'])
        self.assertIn('changed resource total', result['error'])

    def test_rejects_offscreen_switch(self):
        result = self.run_fixture('offscreen')
        self.assertFalse(result['passed'])
        self.assertIn('offscreen', result['error'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
