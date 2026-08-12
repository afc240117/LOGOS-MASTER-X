class QualityGate:
    def decide(self, review):
        return "PASS" if review["approved"] else "FAIL"
