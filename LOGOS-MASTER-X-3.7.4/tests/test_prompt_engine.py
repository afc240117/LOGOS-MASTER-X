from app.prompt_engine import PromptEngine, PromptRequest


def test_prompt_contains_k7_and_user_fields():
    engine = PromptEngine()
    prompt = engine.build(
        PromptRequest(
            mode="SERMÃO",
            text="Isaías 6",
            duration=40,
            cult="Missões",
            audience="Igreja local",
            intensity=4,
            objective="Chamado à obra missionária",
        )
    )
    assert "Isaías 6" in prompt
    assert "40 minutos" in prompt
    assert "Missões" in prompt
    assert "4/5" in prompt
    assert "QUALITY" in prompt.upper()


def test_limits_are_sanitized():
    engine = PromptEngine()
    assert engine.normalize_duration(5) == 20
    assert engine.normalize_duration(999) == 70
    assert engine.normalize_intensity(0) == 1
    assert engine.normalize_intensity(99) == 5
