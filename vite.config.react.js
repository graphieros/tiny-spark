import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        outDir: 'dist/react',
        lib: {
            entry: 'src/react/TinySparkChart.tsx',
            name: 'TinySparkChart',
            fileName: () => 'TinySparkChart.js',
            formats: ['es']
        },
        rollupOptions: {
            external: ['react'],
            output: {
                globals: {
                    react: 'React'
                }
            }
        }
    }
});
