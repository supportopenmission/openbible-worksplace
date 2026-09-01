import { describe, expect, it } from 'vitest';
import {
	queryLocalHandlePermission,
	requestLocalHandlePermission,
	type DirectoryPermissionHandle
} from './local-storage';

describe('local folder permission', () => {
	it('reports prompt without requesting a new permission', async () => {
		const handle = {
			queryPermission: async () => 'prompt' as const,
			requestPermission: async () => 'granted' as const
		};

		expect(await queryLocalHandlePermission(handle)).toBe('prompt');
	});

	it('requests write permission on a user gesture', async () => {
		const handle = {
			queryPermission: async () => 'prompt' as const,
			requestPermission: async () => 'granted' as const
		};

		expect(await requestLocalHandlePermission(handle)).toBe('granted');
	});

	it('treats missing permission methods as unsupported', async () => {
		const handle = {} as DirectoryPermissionHandle;

		expect(await queryLocalHandlePermission(handle)).toBe('unsupported');
	});
});
