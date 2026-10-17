
import * as esbuild from "esbuild";
import { cp, mkdir } from "node:fs/promises";
import * as fs from "node:fs/promises";

const production = process.argv.includes("--production");
const debug_build = process.argv.includes("--debug");

let JS_BANNER = `/**\n * EYang! Chrome Extension\n * Extension licensed under AGPL-3.19 license\n * (c) Copyright bogdan-glitchm (github) 2026\n${
    debug_build ? " *\n *\n * Debug Build\n *\n" :
    production ? "" : " *\n *\n * Standard Build\n *\n"
} */`;

const _license_text = (await fs.readFile("LICENSE", {encoding: 'utf8'}));
if (!production) {
    JS_BANNER += "\n/**\n * " + _license_text.replaceAll("\n", "\n * ") + "\n/**";
} else {
    JS_BANNER += "\n/**\n * SPDX-License-Identifier: AGPL-3.0-or-later\n * Full license text: see LICENSE\n*/"
}

/**
 * @type {esbuild.SameShape<esbuild.BuildOptions, esbuild.BuildOptions>}
 */
const options = {
    entryPoints: {
        "background/background": "src/background/background.ts",
        "content/content": "src/content/content.ts",
    },
    outdir: "dist",
    bundle: true,
    platform: "browser",
    format: "iife",
    target: ["chrome120"],
    minify: production,
    sourcemap: production ? false : debug_build ? "both" : "inline",
    logLevel: debug_build ? "debug" : "info",
    banner: {
        js: JS_BANNER
    }
};

async function build() {
    await mkdir("dist", { recursive: true });

    await esbuild.build(options);

    await cp("manifest.json", "dist/manifest.json");
    await cp("README.md", "dist/README.md");
    await cp("LICENSE", "dist/LICENSE");
    //await cp("public", "dist", { recursive: true });
}

await build();
