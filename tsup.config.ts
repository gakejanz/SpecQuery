import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
    },
    format: ["esm", "cjs"],
    platform: "node",
    target: "node18",
    sourcemap: true,
    splitting: false,
    clean: true,
    dts: {
      entry: {
        index: "src/index.ts",
      },
    },
  },
  {
    entry: {
      cli: "src/cli.ts",
    },
    format: ["esm"],
    platform: "node",
    target: "node18",
    splitting: false,
    sourcemap: true,
    clean: false,
    dts: false,
    banner: {
      js: "#!/usr/bin/env node",
    },
  },
]);
