"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "app/web/static/app-381-v133.js"), "utf8");
const start = source.indexOf("const HOME_ACTION_MODULES=[");
const end = source.indexOf("function themeHomeAsset()", start);
assert(start >= 0 && end > start, "central de ações da Home 5.3.9 não encontrada");

const saved = new Map();
global.Store = {
  get(key, fallback) { return saved.has(key) ? saved.get(key) : fallback; },
  set(key, value) { saved.set(key, value); return value; },
};
global.location = { href: "http://127.0.0.1:8080/" };
global.escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
})[char]);

eval(source.slice(start, end) + `
global.__homeV537 = {
  defaults: homeActionDefaults(),
  actions: homeActions(),
  desktop: homeDesktopControls(homeActions()),
  mobile: homeMobileControls(homeActions()),
  editor: homeActionEditorMarkup(homeActions()),
  safe: safeHomeActionUrl,
};`);

const home = global.__homeV537;
assert.strictEqual(home.defaults.length, 12);
assert.strictEqual(home.actions.length, 12);
assert.strictEqual(new Set(home.actions.map(action => action.id)).size, 12);
assert.match(home.desktop, /data-home-action="bible"/);
assert.match(home.desktop, /home-art-interactions/);
assert.match(home.desktop, /home-art-live-desktop/);
assert.match(home.desktop, /data-home-system-details/);
assert.doesNotMatch(home.desktop, /home-ribbon-real|home-primary-real|home-feature-real/);
assert.match(home.mobile, /home-mobile-edit-help/);
assert.doesNotMatch(home.mobile, /home-mobile-command-center/);
assert.match(home.editor, /Abrir módulo/);
assert.match(home.editor, /Abrir link/);
assert.match(home.editor, /Mostrar popup/);
assert.strictEqual(home.safe("javascript:alert(1)"), "");
assert.strictEqual(home.safe("data:text/html,test"), "");
assert.strictEqual(home.safe("https://example.com/x"), "https://example.com/x");

saved.set("homeActionButtonsV1", [{ id: "bible", label: "Minha leitura", type: "popup", target: "Texto salvo" }]);
eval(source.slice(start, end) + `global.__mergedV537 = homeActions();`);
const merged = global.__mergedV537;
assert.strictEqual(merged.length, 12);
assert.strictEqual(merged.find(action => action.id === "bible").label, "Minha leitura");
assert.strictEqual(merged.find(action => action.id === "bible").zone, "ribbon");

console.log("home actions v5.3.9 runtime: ok");
