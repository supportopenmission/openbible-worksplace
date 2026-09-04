import adapter from '@sveltejs/adapter-cloudflare';
import adapterStatic from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// See https://svelte.dev/docs/kit/integrations#Preprocessors for more information about preprocessors.
	preprocess: vitePreprocess(),
	kit: {
		adapter: process.env.TAURI_BUILD
			? adapterStatic({ pages: '.svelte-kit/tauri', assets: '.svelte-kit/tauri', fallback: 'index.html' })
			: adapter()
	}
};

export default config;
