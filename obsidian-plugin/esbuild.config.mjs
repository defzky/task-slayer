import esbuild from 'esbuild';

const production = process.argv.includes('production');

esbuild.build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  format: 'cjs',
  target: 'es2020',
  platform: 'node',
  outfile: 'main.js',
  external: ['obsidian'],
  sourcemap: !production,
  minify: production,
  banner: {
    js: '/* Task Slayer Obsidian Plugin */'
  }
}).catch(() => process.exit(1));
