class BibleEngine:
    def parse(self, reference: str):
        return {"normalized": reference.strip(), "status": "parsed"}
