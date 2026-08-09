import json,re
from app.quality.gate import evaluate

REVIEW_SYSTEM = """Você é o REVISOR INDEPENDENTE do LOGOS MASTER X. Você NÃO escreveu o material. Avalie com rigor bíblico e homilético. Não reescreva o sermão. Não dê 100 automaticamente. Quando houver um erro factual/referencial inequívoco que possa ser corrigido por substituição exata, forneça original e substituicao. Não proponha autocorreção para questões interpretativas, teológicas discutíveis, estilo, aplicações ou trechos cuja correção exija reescrita ampla. Responda SOMENTE JSON válido."""

REVIEW_PRIORITY = ["gemini","groq","openai","openrouter","huggingface","9router"]

def _extract_json(text):
    t=(text or '').strip()
    t=re.sub(r'^```(?:json)?\s*|\s*```$','',t,flags=re.I|re.S).strip()
    try:return json.loads(t)
    except Exception:
        m=re.search(r'\{.*\}',t,re.S)
        if not m: raise ValueError('revisor não retornou JSON')
        return json.loads(m.group(0))

def review_prompt(material,mode):
    return f'''Revise independentemente este material do LOGOS MASTER X.
Modo: {mode}

Avalie 5 critérios, cada um de 0 a 20:
1. fidelidade_textual — afirmações realmente sustentadas pelo texto bíblico;
2. contexto_interpretacao — contexto e interpretação sem transformar hipótese em certeza;
3. aplicacoes — aplicações derivadas do texto e claramente distintas da exegese;
4. estrutura — progressão, numeração, coerência, tempo e clímax;
5. prudencia — fatos históricos, etimologias, línguas bíblicas e referências tratados com cautela.

Classifique observações relevantes usando exatamente um destes rótulos:
TEXTO_BIBLICO, INTERPRETACAO, APLICACAO_HOMILETICA, VERIFICAR.

AUTOCORREÇÃO SEGURA:
- Se houver erro objetivo e inequívoco (por exemplo referência bíblica digitada errada, nome/número claramente incorreto), inclua "original" com o trecho EXATO presente no material e "substituicao" com a correção mínima.
- Só faça isso se tiver alta confiança e a troca não alterar uma interpretação debatida.
- Para interpretação, aplicação, prudência teológica ou sugestão de estilo, deixe original/substituicao vazios e apenas sinalize em observacoes.
- Nunca encurte o material para corrigir.

Retorne SOMENTE JSON neste formato:
{{"scores":{{"fidelidade_textual":0,"contexto_interpretacao":0,"aplicacoes":0,"estrutura":0,"prudencia":0}},"observacoes":[{{"tipo":"VERIFICAR","trecho":"...","motivo":"...","original":"","substituicao":""}}],"resumo":"..."}}

MATERIAL:
{material[:24000]}'''

def _review_candidates(ai,generation_provider):
    cfg=ai.configured(); used=(generation_provider or '').strip().lower()
    return [p for p in REVIEW_PRIORITY if p != used and cfg.get(p)]

def _safe_corrections(material,observacoes):
    corrected=material; applied=[]; skipped=[]
    for item in observacoes:
        old=str(item.get('original','') or '').strip(); new=str(item.get('substituicao','') or '').strip()
        if not old or not new or old==new: continue
        # Segurança: substituição pequena, exata e única. Nada de reescrita ampla.
        count=corrected.count(old)
        if count!=1 or len(old)>500 or len(new)>500:
            skipped.append({'original':old[:240],'substituicao':new[:240],'motivo':'substituição não é única ou é ampla demais'})
            continue
        delta=abs(len(new)-len(old))
        if delta>180:
            skipped.append({'original':old[:240],'substituicao':new[:240],'motivo':'alteração extensa; exige revisão humana'})
            continue
        corrected=corrected.replace(old,new,1)
        applied.append({'original':old[:240],'substituicao':new[:240],'tipo':item.get('tipo','VERIFICAR'),'motivo':str(item.get('motivo',''))[:400]})
    return corrected,applied,skipped

def independent_review(ai,material,mode,generation_provider=None):
    base=evaluate(material,mode); errors=[]; candidates=_review_candidates(ai,generation_provider)
    if not candidates:
        return {**base,'source':'gate-local-fallback','review_error':'Nenhum provedor independente configurado','corrected_text':material,'autocorrections':[]}
    for reviewer in candidates:
        try:
            out=ai.generate(review_prompt(material,mode),REVIEW_SYSTEM,provider=reviewer,mode='manual',model=None,max_tokens=1800)
            data=_extract_json(out['text']); scores=data.get('scores') or {}
            keys=['fidelidade_textual','contexto_interpretacao','aplicacoes','estrutura','prudencia']
            vals=[max(0,min(20,int(scores.get(k,0)))) for k in keys]
            ai_score=sum(vals); score=round(ai_score*0.8 + base['score']*0.2); obs=[]
            for item in (data.get('observacoes') or [])[:10]:
                typ=str(item.get('tipo','VERIFICAR')).upper()
                if typ not in {'TEXTO_BIBLICO','INTERPRETACAO','APLICACAO_HOMILETICA','VERIFICAR'}: typ='VERIFICAR'
                obs.append({'tipo':typ,'trecho':str(item.get('trecho',''))[:240],'motivo':str(item.get('motivo',''))[:500],'original':str(item.get('original',''))[:500],'substituicao':str(item.get('substituicao',''))[:500]})
            corrected,applied,skipped=_safe_corrections(material,obs)
            return {'score':score,'passed':score>=80,'source':'revisor-ia-independente','scores':dict(zip(keys,vals)),'observacoes':obs,'resumo':str(data.get('resumo',''))[:1000],'structural':base,'review_provider':out.get('provider'),'review_model':out.get('model'),'review_seconds':out.get('seconds'),'generation_provider':generation_provider,'review_fallback_errors':errors,'corrected_text':corrected,'autocorrections':applied,'autocorrection_skipped':skipped,'autocorrection_count':len(applied)}
        except Exception as e:
            errors.append(f'{reviewer}: {type(e).__name__}: {str(e)[:220]}')
    return {**base,'source':'gate-local-fallback','review_error':'Todos os revisores independentes falharam. '+' | '.join(errors[:5]),'generation_provider':generation_provider,'corrected_text':material,'autocorrections':[]}
