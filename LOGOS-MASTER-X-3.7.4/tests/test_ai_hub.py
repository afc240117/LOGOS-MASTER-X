from app.ai.hub import AIHub
def test_orders():
 h=AIHub();assert h.order("economico")[0]=="gemini";assert "openai" in h.order("qualidade")
