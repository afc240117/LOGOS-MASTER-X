from fastapi.testclient import TestClient
from app.main import app

def test_health():
    r=TestClient(app).get("/api/health")
    assert r.status_code==200
    assert r.json()["status"]=="ok"

def test_generate_fallback():
    r=TestClient(app).post("/api/generate-ai",json={"mode":"sermão","text":"Romanos 8"})
    assert r.status_code==200
    assert "text" in r.json()
