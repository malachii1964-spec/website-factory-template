import copy, importlib.util, json, pathlib, unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("validator",ROOT/"scripts"/"validate_website_packet.py")
mod=importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
BASE=json.loads((ROOT/"assets"/"example-website-build-packet.json").read_text())

class WebsitePacketTests(unittest.TestCase):
    def test_example_valid(self): self.assertEqual(mod.validate(copy.deepcopy(BASE)),[])
    def test_floor_must_be_minimum(self):
        d=copy.deepcopy(BASE); d["quality"]["floor"]=10
        self.assertTrue(mod.validate(d))
    def test_promoted_requires_quality_nine(self):
        d=copy.deepcopy(BASE); d["quality"]["edgeCases"]=8; d["quality"]["floor"]=8
        self.assertTrue(mod.validate(d))
    def test_fresh_research_requires_packet(self):
        d=copy.deepcopy(BASE); d["research"]["freshEvidenceRequired"]=True; d["research"]["packetRefs"]=[]
        self.assertTrue(mod.validate(d))
    def test_build_artifact_requires_source(self):
        d=copy.deepcopy(BASE); d["executionState"]="spec_only"
        self.assertTrue(mod.validate(d))
    def test_launch_candidate_requires_lab_performance(self):
        d=copy.deepcopy(BASE); d["releaseStage"]="LAUNCH_CANDIDATE"; d["executionState"]="preview_verified"
        self.assertTrue(mod.validate(d))
        d["verification"]["performance"]["evidenceLevel"]="lab_measured"
        self.assertEqual(mod.validate(d),[])
    def test_production_cannot_be_claimed_from_source(self):
        d=copy.deepcopy(BASE); d["releaseStage"]="PRODUCTION_VERIFIED"
        self.assertTrue(mod.validate(d))
    def test_cwv_targets_cannot_be_weakened(self):
        for key,value in [("lcpSeconds",3),("inpMilliseconds",300),("cls",0.2)]:
            d=copy.deepcopy(BASE); d["verification"]["performance"]["targets"][key]=value
            self.assertTrue(mod.validate(d),key)
    def test_accessibility_target(self):
        d=copy.deepcopy(BASE); d["verification"]["accessibility"]["target"]="WCAG_2.1_AA"
        self.assertTrue(mod.validate(d))
    def test_security_baseline(self):
        d=copy.deepcopy(BASE); d["verification"]["security"]["baseline"]="OWASP_TOP_10"
        self.assertTrue(mod.validate(d))

if __name__=="__main__": unittest.main()
