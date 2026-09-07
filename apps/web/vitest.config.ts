import { defineConfig } from 'vite';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
	optimizeDeps: {
		include: ['@milkdown/kit/plugin/slash']
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.js',
					test: {
						name: 'client',
						maxWorkers: 1,
						browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}', 'src/lib/features/ai/ai-interface.test.ts']
				}
			},
			{
				extends: './vite.config.js',
					test: {
						name: 'server',
						maxWorkers: 2,
						environment: 'node',
					include: ['src/lib/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}', 'src/lib/features/ai/ai-interface.test.ts']
				}
			}
		]
	}
});
