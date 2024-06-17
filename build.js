import path from "node:path";
import fs from "node:fs";
import { build, defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import sveltePreprocess from "svelte-preprocess";
import wasm from "vite-plugin-wasm";
import { fileURLToPath } from 'url';
import { nodePolyfills } from 'vite-plugin-node-polyfills'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const prod = process.argv.find((s) => s.includes("--prod"));
  const watch = process.argv.find((s) => s.includes("--watch="));
  const target = path.resolve(process.env.PREFIX);

  if (!target) {
    console.log("Did not receive the build target path as an argument!");
    process.exit(1);
  }

  if (!watch) {
    await build(
      defineConfig({
        root: path.resolve("./src"),
        mode: prod ? "production" : "development",
        base: "./",
        plugins: [
          svelte({
            preprocess: sveltePreprocess(),
          }),
          wasm(),
          nodePolyfills({
            // Adding Buffer polyfill
            buffer: true,
          }),
        ],
        resolve: {
          alias: {
            $lib: path.resolve(__dirname, "src/lib"),
          },
        },
        build: {
          outDir: target,
          emptyOutDir: false,
          sourcemap: !prod,
          minify: prod ? "esbuild" : false,
          rollupOptions: {
            external: [/socket:.*/],
          },
          target: "esnext", // Ensure this is included for wasm support
        },
        optimizeDeps: {
          include: ["ergo-lib-wasm-browser", "buffer"],
        },
      })
    );
  }

  await fs.promises.writeFile(
    path.join(target, "package.json"),
    JSON.stringify({ type: "module", private: true })
  );
}

main();
