import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import commonjs from "@rollup/plugin-commonjs";
import esbuild from "esbuild";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    commonjs(),
    {
      name: "esbuild-transform",
      closeBundle() {
        esbuild.buildSync({
          entryPoints: [
            resolve(__dirname, "dist/content.js"),
            resolve(__dirname, "dist/background.js"),
          ],
          format: "iife",
          outdir: resolve(__dirname, "dist"),
          allowOverwrite: true,
          entryNames: "[name].iife",
          bundle: true
        });
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/index.html"),
        options: resolve(__dirname, "src/options/index.html"), // 更改这一行
        background: resolve(__dirname, "src/background/index.ts"),
        content: resolve(__dirname, "src/content/index.ts"),
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
