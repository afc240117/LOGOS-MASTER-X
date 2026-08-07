import { Bus } from "./bus.js";
export const Router = {
  modules: new Map(),
  register(module) {
    if (!module?.id || typeof module.render !== "function") throw new Error("Módulo inválido");
    this.modules.set(module.id, module);
  },
  open(id, ctx={}) {
    const mod = this.modules.get(id);
    if (!mod) throw new Error(`Módulo não encontrado: ${id}`);
    Bus.emit("module:before-open",{id,ctx});
    const html = mod.render(ctx);
    Bus.emit("module:open",{id,ctx});
    return html;
  },
  manifest() {
    return [...this.modules.values()].map(m => ({
      id:m.id, title:m.title, version:m.version||"1.0", capabilities:m.capabilities||[]
    }));
  }
};
