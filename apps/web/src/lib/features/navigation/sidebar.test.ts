import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const sourcePath = resolve(
	process.cwd(),
	'src/lib/components/ui/sidebar/sidebar-menu-button.svelte'
);

describe('Sidebar navigation surface', () => {
	it('keeps menu items transparent and interactive on hover', () => {
		const source = readFileSync(sourcePath, 'utf8');

		expect(source).toContain('bg-transparent');
		expect(source).toContain('hover:bg-sidebar-accent');
		expect(source).toContain('data-[active=true]:bg-transparent');
	});
});
