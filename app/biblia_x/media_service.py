"""Public-domain/licensed visual discovery for Mapas X and Midia X.

The service keeps the browser UI independent from Wikimedia's response format and
returns attribution fields together with every image.  Local media remains fully
offline; this module is only used when the user asks for public online imagery.
"""

from __future__ import annotations

import html
import json
import os
import re
import unicodedata
from functools import lru_cache
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


COMMONS_API = "https://commons.wikimedia.org/w/api.php"
PEXELS_API = "https://api.pexels.com/v1/search"
USER_AGENT = "LOGOS-MASTER-X/5.2 (+local Bible study media browser)"
_ALLOWED_KINDS = {"image", "panorama"}
_ALLOWED_PROVIDERS = {"all", "commons", "pexels"}
_REFERENCE_ONLY_RE = re.compile(
    r"^(?:[123]\s*)?[A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+){0,3}\s+\d{1,3}"
    r"(?:(?:[:.]\s*\d{1,3}(?:\s*-\s*\d{1,3})?)|(?:\s*[-–]\s*\d{1,3}))?\s*$",
    re.IGNORECASE,
)


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


def _is_reference_only(query: str) -> bool:
    cleaned = re.sub(r"\s+", " ", str(query or "")).strip()
    return bool(cleaned and re.search(r"\d", cleaned) and _REFERENCE_ONLY_RE.fullmatch(cleaned))


def _visual_search_seed(query: str, kind: str) -> str:
    """Prevent a Bible citation from becoming a people/name search in Commons."""
    cleaned = re.sub(r"\s+", " ", str(query or "")).strip()
    if not _is_reference_only(cleaned):
        return cleaned
    normalized = unicodedata.normalize("NFD", cleaned).encode("ascii", "ignore").decode("ascii").lower()
    if re.search(r"\bjoao\s+4(?:[:\s]|$)", normalized):
        return "Jacob's Well Nablus Samaria archaeological site"
    if re.search(r"\b(?:joao|mateus|marcos|lucas)\b", normalized):
        return "Jerusalem biblical archaeological ruins"
    if re.search(r"\b(?:atos|romanos|corintios|galatas|efesios|filipenses)\b", normalized):
        return "Ephesus biblical archaeological ruins"
    if re.search(r"\b(?:exodo|levitico|numeros|deuteronomio|isaias|jeremias|ezequiel)\b", normalized):
        return "ancient Israel biblical archaeological sites"
    return "biblical cities archaeological ruins ancient Israel"


def _search_expression(query: str, kind: str) -> str:
    cleaned = _visual_search_seed(query, kind)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def _query_variants(query: str, kind: str) -> tuple[str, ...]:
    """Return Commons-friendly alternatives without making the UI guess English names."""
    cleaned = _search_expression(query, kind)
    normalized = unicodedata.normalize("NFD", cleaned).encode("ascii", "ignore").decode("ascii").lower()
    variants: list[str] = []

    def add(value: str) -> None:
        value = re.sub(r"\s+", " ", str(value or "")).strip()
        if value and value.casefold() not in {item.casefold() for item in variants}:
            variants.append(value)

    add(cleaned)
    rules = (
        (r"sicar|siquem|shechem|sychar", ("Jacob's Well Nablus current", "Shechem Nablus archaeological site", "Sebastia Samaria ruins")),
        (r"jerusalem", ("Jerusalem Old City Israel", "Jerusalem archaeological ruins", "Temple Mount Jerusalem current")),
        (r"jerico|jericho", ("Tell es-Sultan Jericho ruins", "Jericho Jordan Valley current", "Jericho archaeological site")),
        (r"samaria", ("Sebastia Samaria archaeological site", "Samaria ancient city ruins", "Samarian landscape Israel")),
        (r"mar\s+da\s+galileia|sea\s+of\s+galilee|galileia|galilee", ("Capernaum ruins Israel", "Nazareth Old City Israel", "Sea of Galilee current landscape")),
        (r"judeia|judea", ("Judean hills Israel", "Bethlehem Old City current", "Hebron Old City archaeological")),
        (r"jordao|jordan", ("Jordan River current site", "Bethany beyond Jordan archaeological site", "Jordan Valley landscape")),
        (r"sinai|horebe|horeb", ("Mount Sinai Egypt current", "Saint Catherine Sinai monastery", "Sinai desert landscape")),
        (r"damasco|damascus", ("Damascus Old City Syria", "Damascus current city ruins", "Damascus archaeological site")),
        (r"canaa|cana", ("Kafr Kanna Cana Galilee", "Cana Galilee archaeological site", "Cana Israel current")),
        (r"exodo|exodus", ("Exodus desert", "Sinai desert")),
        (r"babilonia|babylon", ("Babylon archaeological site Iraq", "Babylon ruins current Iraq", "Babylon ancient city")),
        (r"ninive|nineveh", ("Nineveh ruins Mosul Iraq", "Nineveh archaeological site", "Mosul current city")),
        (r"templo|temple", ("Temple Mount Jerusalem current", "Jerusalem archaeological site", "Western Wall Jerusalem")),
        (r"ruinas|ruins|ancient\s+israel|cidades\s+e\s+ruinas|biblical\s+archaeological", ("Jerusalem Old City Israel", "Capernaum ruins Israel", "ancient Israel archaeological site")),
    )
    for pattern, alternatives in rules:
        if re.search(pattern, normalized):
            for alternative in alternatives:
                add(alternative)
    if kind == "panorama":
        add(re.sub(r"\b(?:panorama|equirectangular|spherical|360(?:°|º)?)\b", " ", cleaned, flags=re.I))
    return tuple(variants[:4])


def _pexels_key() -> str:
    """Read the optional Pexels key only on the server."""
    return str(os.getenv("PEXELS_API_KEY") or "").strip()


def _search_pexels(query: str, kind: str, limit: int, offset: int) -> tuple[dict, ...]:
    """Return Pexels photos in the same attribution shape as Commons items.

    Pexels requires an API key and does not expose an equirectangular-search
    contract, so panoramas remain a Commons-only search.  The key never leaves
    this process and is never included in the response.
    """
    if kind != "image":
        return tuple()
    key = _pexels_key()
    if not key:
        raise RuntimeError("Pexels não está configurado: adicione PEXELS_API_KEY no ambiente do servidor.")
    page = max(1, (max(0, int(offset)) // max(1, int(limit))) + 1)
    params = {
        "query": _search_expression(query, kind),
        "per_page": str(max(1, min(80, int(limit)))),
        "page": str(page),
    }
    request = Request(
        f"{PEXELS_API}?{urlencode(params)}",
        headers={"Authorization": key, "User-Agent": USER_AGENT, "Accept": "application/json"},
    )
    try:
        with urlopen(request, timeout=14) as response:
            payload = json.load(response)
    except (HTTPError, URLError, TimeoutError, OSError, ValueError) as exc:
        raise RuntimeError("Pexels temporariamente indisponível") from exc

    items: list[dict] = []
    for photo in payload.get("photos", []) if isinstance(payload, dict) else []:
        sources = photo.get("src") or {}
        original_url = str(sources.get("original") or sources.get("large2x") or sources.get("large") or "")
        thumb_url = str(sources.get("large") or sources.get("medium") or sources.get("small") or original_url)
        if not original_url or not thumb_url:
            continue
        photographer = str(photo.get("photographer") or "Pexels")
        photographer_url = str(photo.get("photographer_url") or "https://www.pexels.com/")
        photo_url = str(photo.get("url") or "https://www.pexels.com/")
        photo_id = str(photo.get("id") or len(items))
        items.append(
            {
                "id": f"pexels-{photo_id}",
                "title": str(photo.get("alt") or "Imagem do Pexels"),
                "thumb_url": thumb_url,
                "original_url": original_url,
                "page_url": photo_url,
                "mime": "image/jpeg",
                "width": int(photo.get("width") or 0),
                "height": int(photo.get("height") or 0),
                "description": str(photo.get("alt") or ""),
                "artist": photographer,
                "credit": f"Foto: {photographer} • Pexels",
                "license": "Pexels License",
                "license_url": "https://www.pexels.com/pt-br/licenca/",
                "attribution_required": True,
                "panorama_candidate": False,
                "source": "Pexels",
                "source_provider": "pexels",
                "photographer_url": photographer_url,
            }
        )
    return tuple(items)


@lru_cache(maxsize=192)
def _search_cached(query: str, kind: str, limit: int, offset: int) -> tuple[dict, ...]:
    # Panoramic searches request a few extra candidates, then validate dimensions.
    request_limit = min(24, max(limit, limit * 2 if kind == "panorama" else limit))
    items: list[dict] = []
    seen: set[str] = set()
    for expression in _query_variants(query, kind):
        params = {
            "action": "query",
            "generator": "search",
            "gsrsearch": expression,
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
            identity = str(page.get("pageid") or original_url)
            if identity in seen:
                continue
            seen.add(identity)
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
                return tuple(items)
    return tuple(items)


def search_public_media(
    query: str,
    kind: str = "image",
    limit: int = 8,
    offset: int = 0,
    provider: str = "all",
) -> dict:
    requested_query = re.sub(r"\s+", " ", str(query or "")).strip()
    query = _search_expression(requested_query, kind)
    kind = str(kind or "image").strip().lower()
    if not query:
        raise ValueError("Informe um lugar ou tema para pesquisar")
    if kind not in _ALLOWED_KINDS:
        raise ValueError("Tipo de midia invalido")
    provider = str(provider or "all").strip().lower()
    if provider not in _ALLOWED_PROVIDERS:
        raise ValueError("Fonte pública inválida")
    limit = max(1, min(16, int(limit)))
    offset = max(0, min(100000, int(offset)))
    sources: list[str] = []
    source_errors: list[str] = []
    items: list[dict] = []
    pexels_enabled = bool(_pexels_key()) and kind == "image" and provider in {"all", "pexels"}
    combined_page = max(0, offset // max(1, limit))
    commons_limit = max(1, (limit + 1) // 2) if pexels_enabled and provider == "all" else limit
    commons_offset = combined_page * commons_limit if pexels_enabled and provider == "all" else offset

    if provider in {"all", "commons"}:
        commons_items = [dict(item) for item in _search_cached(query, kind, commons_limit, commons_offset)]
        items.extend(commons_items)
        if commons_items:
            sources.append("Wikimedia Commons")

    if provider in {"all", "pexels"} and kind == "image":
        # In the combined view each source contributes a half page so the
        # gallery remains varied instead of putting one provider below the fold.
        pexels_limit = limit if provider == "pexels" else max(1, (limit + 1) // 2)
        pexels_offset = offset if provider == "pexels" else combined_page * pexels_limit
        try:
            pexels_items = [dict(item) for item in _search_pexels(query, kind, pexels_limit, pexels_offset)]
            items.extend(pexels_items)
            if pexels_items:
                sources.append("Pexels")
        except RuntimeError as exc:
            # The default search must remain useful without a Pexels key. A
            # Pexels-only request, however, should explain exactly what is
            # missing instead of silently showing an empty gallery.
            source_errors.append(str(exc))
            if provider == "pexels":
                raise
            # If an optional provider is unavailable, fill the page from the
            # reliable Commons source so the user never sees a half-empty row.
            if provider == "all" and kind == "image" and len(items) < limit:
                items = [dict(item) for item in _search_cached(query, kind, limit, offset)]

    # Interleave combined results, keeping source variety in the first row.
    if provider == "all" and len(items) >= limit:
        commons = [item for item in items if item.get("source_provider") != "pexels"]
        pexels = [item for item in items if item.get("source_provider") == "pexels"]
        items = []
        while len(items) < limit and (commons or pexels):
            if commons:
                items.append(commons.pop(0))
            if len(items) >= limit:
                break
            if pexels:
                items.append(pexels.pop(0))
    items = items[:limit]
    has_more = len(items) == limit and bool(items)
    source_label = " + ".join(sources) if sources else ("Pexels" if provider == "pexels" else "Wikimedia Commons")
    return {
        "query": query,
        "requested_query": requested_query,
        "kind": kind,
        "provider": provider,
        "offset": offset,
        "limit": limit,
        "items": items,
        "total": len(items),
        "next_offset": offset + len(items) if has_more else None,
        "has_more": has_more,
        "sources": sources,
        "source_errors": source_errors,
        "source": source_label,
        "source_url": "https://commons.wikimedia.org/",
        "license_notice": "Cada arquivo possui credito e licenca proprios; confira a pagina da fonte antes de reutilizar.",
    }
