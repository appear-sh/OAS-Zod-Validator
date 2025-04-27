import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['esm', 'cjs'], // Output both ESM and CJS formats
  dts: true, // Generate .d.ts files
  splitting: false, // Keep things simple, avoid code splitting for now
  sourcemap: true,
  clean: true, // Clean dist directory before build
  bundle: true, // Bundle dependencies
  treeshake: true,
  minify: false, // Keep builds readable for now
}); 