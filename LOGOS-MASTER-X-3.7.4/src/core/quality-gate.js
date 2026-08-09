export function qualityGate(material) {
  const text = String(material||"");
  const rules = [
    ["conteúdo presente", text.trim().length > 80],
    ["sem glossolalia", !/(sharab|labax|rêbia|kantara|alabass)/i.test(text)],
    ["estrutura mínima", /(texto|tema|introdu|context|aplica|conclus|apelo)/i.test(text)],
    ["sem marcador de conteúdo vazio", !/\bTODO\b|\bLorem ipsum\b/i.test(text)]
  ];
  const passed = rules.filter(([,ok])=>ok).length;
  return { passed, total:rules.length, status: passed===rules.length ? "PASS" : "REVIEW", rules };
}
