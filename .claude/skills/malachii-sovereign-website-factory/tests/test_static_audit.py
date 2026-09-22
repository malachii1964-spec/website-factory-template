import importlib.util, pathlib, tempfile, unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("audit",ROOT/"scripts"/"audit_static_site.py")
mod=importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)

class StaticAuditTests(unittest.TestCase):
    def test_reference_site_passes(self):
        self.assertEqual(mod.audit(ROOT/"assets"/"reference-site")["status"],"PASS")
    def test_missing_lang_fails(self):
        with tempfile.TemporaryDirectory() as td:
            p=pathlib.Path(td); (p/"index.html").write_text('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>x</title></head><body><main><h1>x</h1></main></body></html>')
            self.assertEqual(mod.audit(p)["status"],"FAIL")
    def test_image_without_alt_fails(self):
        with tempfile.TemporaryDirectory() as td:
            p=pathlib.Path(td); (p/"index.html").write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>x</title></head><body><main id="main"><h1>x</h1><img src="x.png"></main></body></html>')
            self.assertEqual(mod.audit(p)["status"],"FAIL")
    def test_zoom_block_fails(self):
        with tempfile.TemporaryDirectory() as td:
            p=pathlib.Path(td); (p/"index.html").write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,user-scalable=no"><title>x</title></head><body><main><h1>x</h1></main></body></html>')
            self.assertEqual(mod.audit(p)["status"],"FAIL")
    def test_unlabelled_input_fails(self):
        with tempfile.TemporaryDirectory() as td:
            p=pathlib.Path(td); (p/"index.html").write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>x</title></head><body><main><h1>x</h1><input id="x"></main></body></html>')
            self.assertEqual(mod.audit(p)["status"],"FAIL")

if __name__=="__main__": unittest.main()
