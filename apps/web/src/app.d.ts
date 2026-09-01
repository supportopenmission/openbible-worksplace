// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	interface FileSystemDirectoryHandle {
		queryPermission?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>;
		requestPermission?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>;
	}

	interface Window {
		showDirectoryPicker?: (options?: {
			mode?: 'read' | 'readwrite';
		}) => Promise<FileSystemDirectoryHandle>;
	}

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
