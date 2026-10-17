
import * as esbuild from "esbuild";
import { cp, mkdir } from "node:fs/promises";

const production = process.argv.includes("--production");

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
    sourcemap: production ? false : "inline",
    logLevel: "info",
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
