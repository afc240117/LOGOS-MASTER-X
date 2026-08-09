from pathlib import Path

class KnowledgeRepository:
    def __init__(self, root=None):
        project_root = Path(__file__).resolve().parents[2]
        self.root = Path(root) if root else project_root / "knowledge"

    def search(self, query, limit=8):
        hits=[]
        if not self.root.exists(): return hits
        words=[w for w in query.lower().split() if len(w)>2]
        for p in self.root.rglob("*.md"):
            text=p.read_text(encoding="utf-8",errors="ignore")
            low=text.lower()
            score=sum(1 for w in words if w in low)
            if score:
                hits.append({"path":str(p.relative_to(self.root)),"score":score,"excerpt":text[:900]})
        hits.sort(key=lambda x:x["score"],reverse=True)
        return hits[:limit]
