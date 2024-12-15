import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			$components: path.resolve(__dirname, 'src/lib/components'),
			$system: path.resolve(__dirname, 'src/lib/components/system')
		}
	},
	server: {
		fs: {
			allow: ['../../common']
		}
	}
});
