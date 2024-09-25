import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import commonjs from "@rollup/plugin-commonjs";
import esbuild from "esbuild";
import ChromeExtension from "crx";
import * as fs from "fs";
import archiver from "archiver";

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
          bundle: true,
        });
        if (process.env.CRX_PRIVATE_KEY) {
          fs.mkdirSync(resolve(__dirname, "crx"));
          // 打包crx
          const crx = new ChromeExtension({
            privateKey: process.env.CRX_PRIVATE_KEY,
          });
          crx.load(resolve(__dirname, "dist")).then(() => {
            console.log("Packaging extension...");
            crx
              .pack()
              .then((crxBuffer: Buffer) => {
                fs.writeFileSync(
                  resolve(__dirname, "crx/chrome-dynamic-scripts-plugin.crx"),
                  crxBuffer,
                  {
                    flag: "w",
                  }
                );
              })
              .catch(console.error);
          });
          // 压缩dist目录为zip
          const output = fs.createWriteStream(
            resolve(__dirname, "crx/chrome-dynamic-scripts-plugin.zip")
          );
          const archive = archiver("zip", {
            zlib: { level: 9 }, // 设置压缩级别
          });

          output.on("close", function () {
            console.log(archive.pointer() + " 总字节数");
            console.log("archiver已完成文件的归档，文件输出流已关闭。");
          });

          archive.on("error", function (err) {
            throw err;
          });

          archive.pipe(output);
          archive.directory("dist/", false);
          archive.finalize();
        }
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
