"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

class ClassList {
  constructor(...names) { this.names = new Set(names.filter(Boolean)); }
  add(...names) { names.forEach(name => this.names.add(name)); }
  remove(...names) { names.forEach(name => this.names.delete(name)); }
  contains(name) { return this.names.has(name); }
  toggle(name, force) {
    const on = force === undefined ? !this.names.has(name) : Boolean(force);
    if (on) this.names.add(name); else this.names.delete(name);
    return on;
  }
}

const style = () => ({
  values: {},
  setProperty(name, value) { this.values[name] = String(value); },
  removeProperty(name) { delete this.values[name]; },
});

const panel = id => ({
  dataset: { biblePanel: id },
  classList: new ClassList(id === "reader" ? "active" : ""),
  hidden: id !== "reader",
  style: style(),
  scrollIntoView() {},
});

const reader = panel("reader");
const maps = panel("maps");
const panels = [reader, maps];
const out = { classList: new ClassList(), style: style(), dataset: {} };

const navButton = (id, icon, title, description) => ({
  dataset: { bibleSection: id },
  clickCalls: 0,
  click() {
    this.clickCalls += 1;
    panels.forEach(item => {
      const active = item.dataset.biblePanel === id;
      item.hidden = !active;
      item.classList.toggle("active", active);
    });
  },
  querySelector(selector) {
    return { textContent: selector === "i" ? icon : selector === "b" ? title : description };
  },
});
const readerNav = navButton("reader", "📖", "Bíblia X", "Leitura principal");
const mapsNav = navButton("maps", "🗺️", "Mapas X", "Atlas visual");
const navButtons = [readerNav, mapsNav];

const selectListeners = {};
const select = {
  dataset: {}, options: [], value: "",
  replaceChildren(...items) { this.options = items; },
  addEventListener(type, handler) { selectListeners[type] = handler; },
  querySelectorAll(selector) { return selector === "option" ? this.options : []; },
};

const topClean = { textContent: "", classList: new ClassList(), setAttribute() {} };
const drawerClean = { textContent: "", classList: new ClassList(), setAttribute() {} };
const zoomReset = { textContent: "", setAttribute() {} };
const dynamicZoom = { textContent: "" };
const fullButton = { hidden: false, setAttribute() {} };
const exitButton = { hidden: true };
const pageTitle = { textContent: "" };
const pageDescription = { textContent: "" };

const shell = {
  dataset: {}, classList: new ClassList(), scrollTop: 0, requestCalls: 0,
  async requestFullscreen() { this.requestCalls += 1; document.fullscreenElement = this; },
};

const listeners = {};
const storage = {};
global.window = global;
global.CSS = { supports: () => true };
window.CSS = global.CSS;
global.localStorage = {
  getItem(key) { return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null; },
  setItem(key, value) { storage[key] = String(value); },
};
global.CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init?.detail; } };
global.MutationObserver = class { observe() {} };
global.document = {
  readyState: "complete",
  hidden: false,
  fullscreenElement: null,
  webkitFullscreenElement: null,
  body: { classList: new ClassList() },
  documentElement: { classList: new ClassList() },
  createElement(tag) { return tag === "option" ? { value: "", textContent: "" } : {}; },
  addEventListener(type, handler) { (listeners[type] ||= []).push(handler); },
  dispatchEvent(event) { (listeners[event.type] || []).forEach(handler => handler(event)); },
  async exitFullscreen() { this.fullscreenElement = null; },
  querySelector(selector) {
    if (selector === ".bible-x-shell") return shell;
    if (selector === ".bible-x-shell [data-bible-panel].active:not([hidden])") return panels.find(item => item.classList.contains("active") && !item.hidden) || null;
    const panelMatch = selector.match(/data-bible-panel="([^"]+)"/);
    if (panelMatch) return panels.find(item => item.dataset.biblePanel === panelMatch[1]) || null;
    const navMatch = selector.match(/data-bible-section="([^"]+)"/);
    if (navMatch) return navButtons.find(item => item.dataset.bibleSection === navMatch[1]) || null;
    return ({
      "#bxPageSelect": select,
      "#bxDynamicTopClean": topClean,
      "#bxDynamicClean": drawerClean,
      "#bxPageZoomReset": zoomReset,
      "#bxDynamicPageZoom": dynamicZoom,
      "#bxPageFullBtn": fullButton,
      "#bxPageExitFullBtn": exitButton,
      "#bxPageTitle": pageTitle,
      "#bxPageDescription": pageDescription,
      "#bOut": out,
    })[selector] || null;
  },
  querySelectorAll(selector) {
    if (selector === ".bible-x-nav [data-bible-section]") return navButtons;
    if (selector === ".bible-x-shell [data-bible-panel]") return panels;
    return [];
  },
};

const source = fs.readFileSync(path.join(__dirname, "..", "app", "web", "static", "bible-x-dynamic-controls.js"), "utf8");
const start = source.indexOf("/* LOGOS MASTER X 5.3.9 — controles resilientes");
const end = source.indexOf("/* LOGOS MASTER X 5.3.9 — painel universal", start);
assert(start >= 0 && end > start, "controlador resiliente 5.3.9 não encontrado");
vm.runInThisContext(source.slice(start, end), { filename: "bible-x-control-repair.js" });

assert.strictEqual(window.LMXBXControlRepair.version, "5.3.9");
assert.strictEqual(select.options.length, 2);
assert.strictEqual(select.value, "reader");
assert(shell.classList.contains("bx-central-nav-ready"));
assert.strictEqual(reader.style.values.zoom, "100%");
assert.strictEqual(topClean.textContent, "✨ Clean: ON");

const clickTarget = (dataset, selector) => ({ dataset, closest(query) { return query === selector ? this : null; } });
const fire = (index, target) => listeners.click[index]({ target, preventDefault() {}, stopImmediatePropagation() {} });

fire(0, clickTarget({ bxPageAction: "larger" }, "[data-bx-page-action]"));
assert.strictEqual(reader.style.values.zoom, "110%");
assert.strictEqual(zoomReset.textContent, "110%");

fire(1, clickTarget({ bxControlAction: "clean" }, "[data-bx-control-action]"));
assert.strictEqual(topClean.textContent, "✨ Clean: OFF");
assert(!out.classList.contains("bx-clean-reading"));

fire(0, clickTarget({ bxPageAction: "fullscreen" }, "[data-bx-page-action]"));
assert(shell.classList.contains("bx-page-full"));
assert.strictEqual(fullButton.hidden, true);
assert.strictEqual(exitButton.hidden, false);
assert.strictEqual(window.LMXBXControlRepair.fullscreenZoom(), 110);

select.value = "maps";
selectListeners.change();
assert.strictEqual(mapsNav.clickCalls, 1);
assert.strictEqual(maps.style.values.zoom, "110%");
assert.strictEqual(window.LMXBXControlRepair.getZoom("maps"), 110);
fire(0, clickTarget({ bxPageAction: "larger" }, "[data-bx-page-action]"));
assert.strictEqual(reader.style.values.zoom, "120%");
assert.strictEqual(maps.style.values.zoom, "120%");
assert.strictEqual(window.LMXBXControlRepair.getZoom("reader"), 120);
assert.strictEqual(window.LMXBXControlRepair.getZoom("maps"), 120);

fire(0, clickTarget({ bxPageAction: "exit" }, "[data-bx-page-action]"));
assert(!shell.classList.contains("bx-page-full"));
assert.strictEqual(window.LMXBXControlRepair.fullscreenZoom(), null);

console.log("BIBLIA_X_CONTROL_REPAIR_535_RUNTIME_OK");
