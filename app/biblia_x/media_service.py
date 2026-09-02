"""Public-domain/licensed visual discovery for Mapas X and Midia X.

The service keeps the browser UI independent from Wikimedia's response format and
returns attribution fields together with every image.  Local media remains fully
offline; this module is only used when the user asks for public online imagery.
"""

from __future__ import annotations

import html
import json
import re
from functools import lru_cache
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


COMMONS_API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "LOGOS-MASTER-X/5.2 (+local Bible study media browser)"
_ALLOWED_KINDS = {"image", "panorama"}


def _plain(value: object) -> str:
    """Turn Commons extmetadata HTML into safe plain text."""
    if isinstance(value, dict):
        value = value.get("value", "")
    text = str(value or "")
    text = re.sub(r"<br\s*/?>", " | ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def _meta(ext: dict, *names: str) -> str:
    for name in names:
        value = _plain(ext.get(name, ""))
        if value:
            return value
    return ""


def _is_panorama(width: int, height: int) -> bool:
    if width < 1200 or height < 500:
        return False
    ratio = width / max(1, height)
    return 1.75 <= ratio <= 2.25


def _search_expression(query: str, kind: str) -> str:
    cleaned = re.sub(r"\s+", " ", query).strip()
    if kind == "panorama":
        return f"{cleaned} panorama"
    return cleaned


@lru_cache(maxsize=192)
def _search_cached(query: str, kind: str, limit: int, offset: int) -> tuple[dict, ...]:
    # Panoramic searches request a few extra candidates, then validate dimensions.
    request_limit = min(24, max(limit, limit * 2 if kind == "panorama" else limit))
    params = {
        "action": "query",
        "generator": "search",
        "gsrsearch": _search_expression(query, kind),
        "gsrnamespace": "6",
        "gsrlimit": str(request_limit),
        "gsroffset": str(offset),
        "prop": "imageinfo",
        "iiprop": "url|mime|size|extmetadata",
        "iiurlwidth": "1100",
        "iiextmetadatalanguage": "pt",
        "iiextmetadatafilter": (
            "Artist|Credit|LicenseShortName|UsageTerms|LicenseUrl|"
            "ImageDescription|AttributionRequired"
        ),
        "format": "json",
        "formatversion": "2",
    }
    request = Request(
        f"{COMMONS_API}?{urlencode(params)}",
        headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
    )
    try:
        with urlopen(request, timeout=14) as response:
            payload = json.load(response)
    except (HTTPError, URLError, TimeoutError, OSError, ValueError) as exc:
        raise RuntimeError("Wikimedia Commons temporariamente indisponivel") from exc

    items: list[dict] = []
    for page in payload.get("query", {}).get("pages", []):
        info_rows = page.get("imageinfo") or []
        if not info_rows:
            continue
        info = info_rows[0]
        mime = str(info.get("mime") or "")
        if not mime.startswith("image/"):
            continue
        original_url = str(info.get("url") or "")
        thumb_url = str(info.get("thumburl") or original_url)
        if not original_url or not thumb_url:
            continue
        width = int(info.get("width") or 0)
        height = int(info.get("height") or 0)
        panorama = _is_panorama(width, height)
        if kind == "panorama" and not panorama:
            continue
        ext = info.get("extmetadata") or {}
        title = re.sub(r"^File:", "", str(page.get("title") or ""), flags=re.I)
        license_name = _meta(ext, "LicenseShortName", "UsageTerms") or "Licenca informada na pagina do arquivo"
        page_url = str(info.get("descriptionurl") or "")
        items.append(
            {
                "id": f"commons-{page.get('pageid', len(items))}",
                "title": title or "Imagem do Wikimedia Commons",
                "thumb_url": thumb_url,
                "original_url": original_url,
                "page_url": page_url,
                "mime": mime,
                "width": width,
                "height": height,
                "description": _meta(ext, "ImageDescription"),
                "artist": _meta(ext, "Artist"),
                "credit": _meta(ext, "Credit", "Artist"),
                "license": license_name,
                "license_url": _meta(ext, "LicenseUrl"),
                "attribution_required": _meta(ext, "AttributionRequired").lower() in {"true", "yes", "1"},
                "panorama_candidate": panorama,
                "source": "Wikimedia Commons",
            }
        )
        if len(items) >= limit:
            break
    return tuple(items)


def search_public_media(query: str, kind: str = "image", limit: int = 8, offset: int = 0) -> dict:
    query = re.sub(r"\s+", " ", str(query or "")).strip()
    kind = str(kind or "image").strip().lower()
    if not query:
        raise ValueError("Informe um lugar ou tema para pesquisar")
    if kind not in _ALLOWED_KINDS:
        raise ValueError("Tipo de midia invalido")
    limit = max(1, min(16, int(limit)))
    offset = max(0, min(100000, int(offset)))
    items = [dict(item) for item in _search_cached(query, kind, limit, offset)]
    return {
        "query": query,
        "kind": kind,
        "offset": offset,
        "limit": limit,
        "items": items,
        "total": len(items),
        "next_offset": offset + len(items) if len(items) == limit else None,
        "has_more": len(items) == limit,
        "source": "Wikimedia Commons",
        "source_url": "https://commons.wikimedia.org/",
        "license_notice": "Cada arquivo possui credito e licenca proprios; confira a pagina da fonte antes de reutilizar.",
    }
