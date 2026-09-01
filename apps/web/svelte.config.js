import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// See https://svelte.dev/docs/kit/integrations#Preprocessors for more information about preprocessors.
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter()
	}
};

export default config;
