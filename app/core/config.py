from dataclasses import dataclass
import os

@dataclass
class Settings:
    name: str = "LOGOS MASTER"
    version: str = "7.0-completo"
    openai_model: str = os.getenv("OPENAI_MODEL","gpt-5-mini")
    ai_enabled: bool = bool(os.getenv("OPENAI_API_KEY"))

settings=Settings()
