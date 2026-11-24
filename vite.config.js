import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "TinySpark",
      fileName: (format) => `tiny-spark.${format}.js`,
      formats: ["es"],
    },
    rolldownOptions: {
      output: {
        minify: true,
      },
    },
  },
});
