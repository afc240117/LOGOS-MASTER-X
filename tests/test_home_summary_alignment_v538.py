from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CSS = (ROOT / "app/web/static/style-v133.css").read_text(encoding="utf-8")
APP = (ROOT / "app/web/static/app-381-v133.js").read_text(encoding="utf-8")
INDEX = (ROOT / "app/web/static/index.html").read_text(encoding="utf-8")


def test_live_values_reuse_the_art_capsules_without_a_second_border():
    assert ".home-art-live-values>span{" in CSS
    assert "border:0!important" in CSS
    assert "box-shadow:none!important" in CSS
    assert "width:5.000%!important;height:1.903%!important" in CSS
    assert "background:var(--home-summary-mask,#02060a)!important" in CSS
    for palette in (
        "aqua", "bluegold", "copperblue", "cyan", "cyangold",
        "electricblue", "goldblue", "greenblue", "greengold", "iceblue",
        "orangepink", "pinkcyan", "purplecyan", "purplegold", "redsilver",
        "royalblue", "silver",
    ):
        assert f'html[data-palette="{palette}"]' in CSS
    assert CSS.count("--hs-xd:") == 17
    assert CSS.count("--hs-xm:") == 17
    assert CSS.count("--hs-yd:") == 17
    assert CSS.count("--hs-ym:") == 17


def test_desktop_positions_match_the_original_1313_by_946_art():
    assert "left:calc(var(--hs-xd,93.983%) - 2.500%)!important" in CSS
    assert "left:92.765%!important;top:45.243%!important" in CSS
    assert "top:var(--hs-yd,49.683%)!important" in CSS
    for offset in ("3.700", "7.400", "11.100", "14.800"):
        assert f"+ {offset}%" in CSS
    assert '--home-summary-mask:#01060b;--hs-xd:93.450%' in CSS  # Dourado + Azul


def test_mobile_positions_are_calibrated_independently():
    assert "left:calc(var(--hs-xm,74.679%) - 10.250%)!important" in CSS
    assert "width:20.500%!important;height:2.528%!important" in CSS
    assert "left:69.551%!important;top:60.112%!important" in CSS
    assert "width:23.077%!important;height:3.230%!important" in CSS
    for offset in ("4.916", "9.831", "14.747", "19.663"):
        assert f"+ {offset}%" in CSS


def test_invisible_hotspots_do_not_generate_native_browser_tooltips():
    hotspot = APP[APP.index("function homeArtHotspot") : APP.index("function homeArtLiveValues")]
    desktop = APP[APP.index("function homeDesktopControls") : APP.index("function homeMobileControls")]
    assert 'title="' not in hotspot
    assert 'title="' not in desktop
    assert 'aria-label="${escapeHtml(hint)}"' in hotspot
    assert 'aria-label="Abrir detalhes em tempo real do sistema"' in desktop


def test_release_and_cache_are_5_3_10():
    assert 'APP_BUILD_VERSION="5.3.10"' in APP
    assert ">5.3.10</span>" in APP
    assert "home-summary-pill-fit-v5.3.10" in INDEX
    assert (ROOT / "VERSION.txt").read_text(encoding="utf-8").startswith("5.3.10")
    assert (ROOT / "HOME-RESUMO-ALINHADO-v5.3.8.txt").exists()
    assert (ROOT / "HOME-RESUMO-ALINHADO-v5.3.8-QUALITY-GATE.json").exists()
    assert (ROOT / "HOME-RESUMO-17-TEMAS-SEM-TOOLTIP-v5.3.9.txt").exists()
    assert (ROOT / "HOME-RESUMO-17-TEMAS-SEM-TOOLTIP-v5.3.9-QUALITY-GATE.json").exists()
    assert (ROOT / "HOME-RESUMO-CAPSULAS-CENTRALIZADAS-v5.3.10.txt").exists()
    assert (ROOT / "HOME-RESUMO-CAPSULAS-CENTRALIZADAS-v5.3.10-QUALITY-GATE.json").exists()


def test_value_masks_cover_the_old_text_but_preserve_the_original_capsules():
    assert "display:flex!important" in CSS
    assert "align-items:center!important" in CSS
    assert "justify-content:center!important" in CSS
    assert "font-variant-numeric:tabular-nums!important" in CSS
    assert "width:7.250%!important;color:var(--theme-secondary)!important" in CSS
    assert "width:29.500%!important;color:var(--theme-secondary)!important" in CSS
    assert ".home-art-value-mode::before{" in CSS
    assert "border:1.4px solid currentColor!important" in CSS
