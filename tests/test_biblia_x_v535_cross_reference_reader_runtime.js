const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

class FakeStyle {
  constructor() { this.values = {}; }
  setProperty(name, value) { this.values[name] = String(value); }
}

class FakeControl {
  constructor() {
    this.listeners = {};
    this.disabled = false;
    this.textContent = "";
    this.focusCalls = 0;
  }
  addEventListener(type, handler) { this.listeners[type] = handler; }
  click() {
    const handler = this.listeners.click;
    return handler && handler({ currentTarget: this, target: this, preventDefault() {} });
  }
  focus() { this.focusCalls += 1; }
}

class FakeModal {
  constructor() {
    this.id = "";
    this.className = "";
    this.hidden = true;
    this.dataset = {};
    this.style = new FakeStyle();
    this.parentNode = null;
    this.controls = {};
    this._innerHTML = "";
  }
  set innerHTML(value) {
    this._innerHTML = String(value);
    this.controls = {};
    for (const name of [
      "close", "original", "back-list", "prev", "next", "open", "copy",
    ]) this.controls[`[data-cross-reader-${name}]`] = new FakeControl();
    this.controls[".bx-cross-reader-stage"] = new FakeControl();
  }
  get innerHTML() { return this._innerHTML; }
  querySelector(selector) { return this.controls[selector] || null; }
}

const elements = new Map();
const keyListeners = [];
const row = new FakeControl();
const bibleRefInput = { value: "João 3:16" };
const bibleOutput = { scrollCalls: 0, scrollIntoView() { this.scrollCalls += 1; } };
const body = {
  appendChild(element) {
    element.parentNode = this;
    if (element.id) elements.set(element.id, element);
    return element;
  },
};

global.document = {
  body,
  getElementById(id) { return elements.get(id) || null; },
  createElement() { return new FakeModal(); },
  querySelector(selector) {
    if (selector === '[data-bible-panel="reader"]') return { dataset: { bxPageZoom: "150" } };
    if (selector.startsWith('[data-cross-index="')) return row;
    return null;
  },
  addEventListener(type, handler) { if (type === "keydown") keyListeners.push(handler); },
  removeEventListener(type, handler) {
    if (type !== "keydown") return;
    const index = keyListeners.indexOf(handler);
    if (index >= 0) keyListeners.splice(index, 1);
  },
};
global.window = { LMXBXControlRepair: { getZoom: () => 150 } };

const references = {
  "Romanos 5:8": [{ ref: "Romanos 5:8", text: "Deus prova o seu amor para conosco." }],
  "1 João 4:9-10": [{ ref: "1 João 4:9", text: "Nisto se manifestou o amor de Deus." }],
};
let current = [{ ref: "João 3:16", text: "Porque Deus amou o mundo." }];
let rendered = [];
let copied = "";
let contextCloseCalls = 0;
let focusedRef = "";
let activated = "";

global.normalizeBibleRef = value => String(value || "").trim();
global.escapeHtml = value => String(value || "").replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
})[character]);
global.bxPortalFullscreenOverlay = element => body.appendChild(element);
global.smartBibleRef = async ref => references[ref] || [];
global.bxCopyText = async value => { copied = value; };
global.formatVerses = rows => rows.map(verse => `${verse.ref} — ${verse.text}`).join("\n");
global.bxCloseVerseContext = () => { contextCloseCalls += 1; };
global.bxFocusVerse = ref => { focusedRef = ref; };
global.activate = id => { activated = id; };
global.renderBibleVerses = rows => { rendered = rows; };
global.$ = selector => selector === "#bRef" ? bibleRefInput : selector === "#bOut" ? bibleOutput : null;
Object.defineProperty(global, "current", { get: () => current, set: value => { current = value; } });

const source = fs.readFileSync(
  path.join(__dirname, "..", "app", "web", "static", "app-381-v133.js"),
  "utf8",
);
const start = source.indexOf("const bxOpenCrossReferenceReader=");
const end = source.indexOf("const bxPreviewReference", start);
assert(start >= 0 && end > start, "leitor de referências 5.3.5 não encontrado");
const readerSource = source.slice(start, end).replace(
  "const bxOpenCrossReferenceReader=",
  "globalThis.bxOpenCrossReferenceReader=",
);
vm.runInThisContext(readerSource, { filename: "bible-x-cross-reference-reader.js" });

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

(async () => {
  const original = { ref: "João 3:16", text: "Porque Deus amou o mundo." };
  const entries = [
    { target: "Romanos 5:8", tsk: true },
    { target: "1 João 4:9-10", seed: true },
  ];

  globalThis.bxOpenCrossReferenceReader(original, entries, 0);
  await wait(0);
  const modal = elements.get("bxCrossReaderModal");
  assert(modal && !modal.hidden);
  assert.strictEqual(modal.dataset.bxSharedZoom, "150");
  assert.strictEqual(modal.style.values["--bx-cross-reader-font-size"], "24.00px");
  assert.strictEqual(current[0].ref, "João 3:16", "a leitura principal não pode mudar no clique normal");
  assert(modal.querySelector(".bx-cross-reader-stage").innerHTML.includes("Romanos 5:8"));

  modal.querySelector("[data-cross-reader-next]").click();
  await wait(0);
  assert(modal.innerHTML.includes("1 João 4:9-10"));
  assert.strictEqual(current[0].ref, "João 3:16");
  await modal.querySelector("[data-cross-reader-copy]").click();
  assert(copied.includes("1 João 4:9"));

  modal.querySelector("[data-cross-reader-back-list]").click();
  await wait(25);
  assert(modal.hidden);
  assert.strictEqual(contextCloseCalls, 0, "voltar à lista deve manter o painel de referências");
  assert.strictEqual(row.focusCalls, 1);

  globalThis.bxOpenCrossReferenceReader(original, entries, 0);
  await wait(0);
  modal.querySelector("[data-cross-reader-original]").click();
  await wait(70);
  assert(modal.hidden);
  assert.strictEqual(contextCloseCalls, 1);
  assert.strictEqual(focusedRef, "João 3:16");
  assert.strictEqual(current[0].ref, "João 3:16");

  globalThis.bxOpenCrossReferenceReader(original, entries, 0);
  await wait(0);
  modal.querySelector("[data-cross-reader-open]").click();
  await wait(0);
  assert.strictEqual(activated, "reader");
  assert.strictEqual(current[0].ref, "Romanos 5:8");
  assert.strictEqual(rendered[0].ref, "Romanos 5:8");
  assert.strictEqual(bibleRefInput.value, "Romanos 5:8");

  console.log("BIBLIA_X_CROSS_REFERENCE_READER_535_RUNTIME_OK");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
