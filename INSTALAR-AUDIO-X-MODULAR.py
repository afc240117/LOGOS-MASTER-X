from pathlib import Path
import shutil, re, sys

ROOT=Path(__file__).resolve().parent.parent
SOURCE=Path(__file__).resolve().parent/"MODULO-AUDIO-X"
if not (ROOT/"app/main.py").exists():
    print("ERRO: execute este instalador dentro da pasta raiz do LOGOS MASTER X.");sys.exit(1)

def backup(p):
    b=p.with_suffix(p.suffix+".PRE-AUDIO-X-MODULAR.bak")
    if p.exists() and not b.exists(): shutil.copy2(p,b)

# Copy ONLY isolated folders
dst_backend=ROOT/"app/audio_x"
dst_static=ROOT/"app/web/static/audio_x"
shutil.copytree(SOURCE/"app/audio_x",dst_backend,dirs_exist_ok=True)
shutil.copytree(SOURCE/"app/web/static/audio_x",dst_static,dirs_exist_ok=True)

# main.py: 1 import + 1 include
mainp=ROOT/"app/main.py";backup(mainp);main=mainp.read_text(encoding="utf-8")
if "from app.audio_x.router import router as audio_x_router" not in main:
    anchor="from app.biblia_x.router import router as biblia_x_router"
    if anchor in main:
        main=main.replace(anchor,anchor+"\\nfrom app.audio_x.router import router as audio_x_router",1)
    else:
        main="from app.audio_x.router import router as audio_x_router\\n"+main
if "app.include_router(audio_x_router)" not in main:
    anchor="app.include_router(biblia_x_router)"
    if anchor in main:
        main=main.replace(anchor,anchor+"\\napp.include_router(audio_x_router)",1)
    else:
        pos=main.find("class Generate")
        main=main[:pos]+"app.include_router(audio_x_router)\\n"+main[pos:]
mainp.write_text(main,encoding="utf-8")

# index.html: only load plugin JS; no menu HTML rewrite and no app.js rewrite
idxp=ROOT/"app/web/static/index.html";backup(idxp);idx=idxp.read_text(encoding="utf-8")
tag='<script src="/static/audio_x/audio-x-menu-plugin.js?v=modular-1"></script>'
if tag not in idx:
    idx=idx.replace("</body>",tag+"</body>")
idxp.write_text(idx,encoding="utf-8")

# requirements: additive only
req=ROOT/"requirements.txt";backup(req)
txt=req.read_text(encoding="utf-8") if req.exists() else ""
for dep in ("httpx>=0.27","python-multipart>=0.0.9"):
    pkg=dep.split(">=")[0]
    if not re.search(rf"(?m)^{re.escape(pkg)}\\b",txt):
        txt+=("" if not txt or txt.endswith("\\n") else "\\n")+dep+"\\n"
req.write_text(txt,encoding="utf-8")

print("OK — Áudio X modular instalado.")
print("Arquivos compartilhados alterados: app/main.py, app/web/static/index.html, requirements.txt")
print("app-381-v133.js, style-v133.css, sw.js e todo app/biblia_x NÃO foram alterados.")
