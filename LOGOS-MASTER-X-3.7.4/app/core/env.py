from __future__ import annotations

import os
from pathlib import Path


def load_project_env(env_path: Path | None = None, *, override: bool = False) -> Path | None:
    """Load KEY=VALUE pairs from the project's .env without extra dependencies.

    Existing environment variables are preserved unless override=True.
    Supports blank lines, comments, optional `export ` prefix, quoted values,
    UTF-8 BOM, and inline comments after unquoted values.
    """
    if env_path is None:
        env_path = Path(__file__).resolve().parents[2] / ".env"

    if not env_path.exists() or not env_path.is_file():
        return None

    text = env_path.read_text(encoding="utf-8-sig")
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.lower().startswith("export "):
            line = line[7:].lstrip()
        if "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip().lstrip("\ufeff")
        value = value.strip()
        if not key:
            continue

        if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]
        else:
            # Allow comments like KEY=value  # note, while preserving # inside tokens.
            marker = " #"
            if marker in value:
                value = value.split(marker, 1)[0].rstrip()

        if override or key not in os.environ:
            os.environ[key] = value

    return env_path
