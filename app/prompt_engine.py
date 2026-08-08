from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
PROMPTS_DIR = PROJECT_ROOT / "prompts"


def _read(name: str, fallback: str = "") -> str:
    path = PROMPTS_DIR / name
    if not path.exists():
        return fallback
    return path.read_text(encoding="utf-8", errors="ignore").strip()


@dataclass(frozen=True)
class PromptRequest:
    mode: str
    text: str
    theme: str = ""
    duration: int = 40
    cult: str = "Avivamento"
    audience: str = "Igreja local"
    intensity: int = 3
    objective: str = ""
    notes: str = ""


class PromptEngine:
    """Monta o contexto homilético do LOGOS no servidor.

    O frontend envia apenas os dados do projeto. O backend injeta o Prompt
    Mestre e o DNA K7 a partir dos arquivos versionados no repositório.
    """

    MODE_FILES = {
        "sermão": "sermao-PROFUNDO.txt",
        "sermao": "sermao-PROFUNDO.txt",
        "estudar": "estudo-PROFUNDO.txt",
        "estudo": "estudo-PROFUNDO.txt",
        "aula": "ebd-PROFUNDA.txt",
        "ebd": "ebd-PROFUNDA.txt",
        "esboço": "esboco-PROFUNDO.txt",
        "esboco": "esboco-PROFUNDO.txt",
        "pesquisa": "pesquisa-biblica-PROFUNDA.txt",
        "revisar": "ia-pregador-MENTOR.txt",
        "aplicar": "ia-pregador-MENTOR.txt",
        "ilustrar": "ia-pregador-MENTOR.txt",
        "concluir": "ia-pregador-MENTOR.txt",
        "oração": "ia-pregador-MENTOR.txt",
        "oracao": "ia-pregador-MENTOR.txt",
        "série": "ia-pregador-MENTOR.txt",
        "serie": "ia-pregador-MENTOR.txt",
        "devocional": "ia-pregador-MENTOR.txt",
        "contexto": "pesquisa-biblica-PROFUNDA.txt",
        "exegese": "pesquisa-biblica-PROFUNDA.txt",
        "hermenêutica": "pesquisa-biblica-PROFUNDA.txt",
        "hermeneutica": "pesquisa-biblica-PROFUNDA.txt",
    }

    def __init__(self) -> None:
        self.master = _read("prompt-mestre-INTEGRAL.txt")
        self.dna = _read("dna-k7-MASTER.txt")
        self.duration_profiles = _read("perfis-duracao.txt")
        self.cult_profiles = _read("perfis-cultos.txt")

    @staticmethod
    def normalize_duration(value: int) -> int:
        try:
            value = int(value)
        except (TypeError, ValueError):
            return 40
        return min(70, max(20, value))

    @staticmethod
    def normalize_intensity(value: int) -> int:
        try:
            value = int(value)
        except (TypeError, ValueError):
            return 3
        return min(5, max(1, value))

    def module_prompt(self, mode: str) -> str:
        key = (mode or "sermão").strip().lower()
        filename = self.MODE_FILES.get(key, "ia-pregador-MENTOR.txt")
        return _read(filename)

    def system_instructions(self) -> str:
        return (
            "Você é o motor do LOGOS MASTER X. Responda em português do Brasil.\n"
            "A Bíblia e o contexto da passagem governam a mensagem. Não invente "
            "versículos, citações, etimologias, dados históricos, profecias ou "
            "testemunhos. Diferencie texto, interpretação e aplicação. Não use "
            "glossolalia. Não imite a identidade vocal de pregador específico.\n\n"
            + self.master
            + "\n\n================ DNA K7 ================\n"
            + self.dna
        ).strip()

    def build(self, req: PromptRequest) -> str:
        duration = self.normalize_duration(req.duration)
        intensity = self.normalize_intensity(req.intensity)
        module = self.module_prompt(req.mode)
        return f"""LOGOS MASTER X — EXECUÇÃO DE MÓDULO

COMANDO: LOGOS {req.mode.upper()}
TEXTO/TEMA: {req.text.strip()}
TEMA COMPLEMENTAR: {req.theme.strip() or 'Não informado'}
DURAÇÃO: {duration} minutos
CULTO: {req.cult.strip() or 'Não informado'}
PÚBLICO: {req.audience.strip() or 'Igreja local'}
INTENSIDADE K7: {intensity}/5
OBJETIVO: {req.objective.strip() or 'Definir a partir do texto e do pedido'}
OBSERVAÇÕES: {req.notes.strip() or 'Nenhuma'}

================ INSTRUÇÕES DO MÓDULO ================
{module}

================ PERFIS DE DURAÇÃO ================
{self.duration_profiles}

================ PERFIS DE CULTO ================
{self.cult_profiles}

================ INSTRUÇÃO FINAL ================
Execute o fluxo completo do LOGOS MASTER para este módulo. Desenvolva o
material de modo proporcional ao tempo. Quando for sermão, faça a exposição
bíblica antes do aumento de intensidade, aplique o DNA K7 somente onde for
coerente com o texto e finalize com versão de púlpito e Quality Gate.
""".strip()
