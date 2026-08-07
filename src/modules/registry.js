import { Router } from "../core/router.js";
import { SermonsModule } from "./sermons/index.js";
import { StudiesModule } from "./studies/index.js";
import { EbdModule } from "./ebd/index.js";
import { K7Module } from "./k7/index.js";
import { LibraryModule } from "./library/index.js";
import { ThemesModule } from "./themes/index.js";
import { FavoritesModule } from "./favorites/index.js";
import { TagsModule } from "./tags/index.js";
import { BackupModule } from "./backup/index.js";
import { PulpitModule } from "./pulpit/index.js";
import { ConcordanceModule } from "./concordance/index.js";
import { BibleModule } from "./bible/index.js";
import { CrossRefsModule } from "./crossrefs/index.js";
import { StudioModule } from "./studio/index.js";

export const modules = [
 BibleModule, ConcordanceModule, CrossRefsModule, SermonsModule, StudiesModule,
 EbdModule, K7Module, LibraryModule, ThemesModule, FavoritesModule, TagsModule,
 BackupModule, PulpitModule
];
modules.forEach(m=>Router.register(m));
