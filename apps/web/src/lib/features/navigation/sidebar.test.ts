import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isTextEditingTarget } from '$lib/components/ui/sidebar/context.svelte';

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

	it('does not steal text-editing shortcuts from focused controls', () => {
		const editableTarget = {
			closest: (selector: string) =>
				selector.includes('[contenteditable]') ? ({} as Element) : null
		} as unknown as EventTarget;
		const navigationTarget = {
			closest: () => null
		} as unknown as EventTarget;

		expect(isTextEditingTarget(editableTarget)).toBe(true);
		expect(isTextEditingTarget(navigationTarget)).toBe(false);
	});

	it('hides the update badge when the sidebar is collapsed to icons', () => {
		const source = readFileSync(
			resolve(process.cwd(), 'src/lib/features/navigation/AppSidebar.svelte'),
			'utf8'
		);

		expect(source).toContain("[data-collapsible='icon'] .update-badge");
		expect(source).toContain('\n\t\tdisplay: none;\n\t}\n\n\t:global(.group[data-collapsible=');
	});
});
