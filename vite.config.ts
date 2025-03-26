import { defineConfig } from 'vite'
import { copyFileSync } from 'node:fs'
import { resolve } from "path";

export default defineConfig({
  // plugins: [
  //   {
  //     name: "copy-readme",
  //     apply: "build",
  //     closeBundle() {
  //       const source = resolve(__dirname, "README.md");
  //       const destination = resolve(__dirname, "dist/README.md");
  //       copyFileSync(source, destination);
  //       console.log("README.md copied to dist/");
  //     },
  //   },
  // ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'tiny-spark',
      fileName: (format) => `tiny-spark.${format}.js`,
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    }
  }
})
