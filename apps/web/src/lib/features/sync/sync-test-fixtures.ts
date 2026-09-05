import { prepareWorkspace } from '$lib/storage/workspace';
import type { FileContent, WorkspaceStorage } from '$lib/storage/types';
import { expect } from 'vitest';

export type SyncCommand = {
  type: string;
  path?: string;
  content?: string;
  peerId?: string;
  endpoint?: string;
  workspaceId?: string;
  storageKind?: 'native' | 'browser';
  fields?: string[];
};

export type SyncManifest = Record<string, any>;

type SyncWorkspaceModule = typeof import('$lib/storage/workspace') & {
  syncWorkspace?: (storage: WorkspaceStorage, command: SyncCommand) => Promise<SyncManifest>;
};

export async function executeSync(storage: WorkspaceStorage, command: SyncCommand): Promise<SyncManifest> {
  const syncWorkspace = (await import('$lib/storage/workspace')) as SyncWorkspaceModule;
  expect(syncWorkspace.syncWorkspace).toBeTypeOf('function');
  return syncWorkspace.syncWorkspace!(storage, command);
}

export const offlineNote = '---\nid: note-offline-001\ntitle: Estudo offline\ntype: note\nschemaVersion: 1\n---\n\n# Estudo offline\n\nUma anotação real permanece legível fora do aplicativo.\n';
export const concurrentNote = '---\nid: note-concurrent-001\ntitle: Nota concorrente\ntype: note\nschemaVersion: 1\n---\n\n# Nota concorrente\n\nConteúdo inicial para duas réplicas.\n';

export class SyncMemoryStorage implements WorkspaceStorage {
  kind = 'local' as const;
  label = 'Fixture de sincronização';
  readonly files = new Map<string, Uint8Array>();
  failWrites = false;

  async ensureDirectory(_path: string): Promise<void> {}
  async writeFile(path: string, content: FileContent): Promise<void> {
    if (this.failWrites) throw new Error('fixture-write-failed');
    this.files.set(path, typeof content === 'string' ? new TextEncoder().encode(content) : content);
  }
  async readFile(path: string): Promise<Uint8Array | null> { return this.files.get(path) ?? null; }
  async fileExists(path: string): Promise<boolean> { return this.files.has(path); }
  async listFiles(path: string): Promise<string[]> {
    const prefix = path ? `${path.replace(/\/$/, '')}/` : '';
    return [...this.files.keys()].filter((candidate) => candidate.startsWith(prefix)).map((candidate) => candidate.slice(prefix.length)).filter((candidate) => !candidate.includes('/')).sort();
  }
  seed(path: string, content: string | Uint8Array): void { this.files.set(path, typeof content === 'string' ? new TextEncoder().encode(content) : content); }
}

export async function createSyncFixture(): Promise<SyncMemoryStorage> {
  const storage = new SyncMemoryStorage();
  await prepareWorkspace(storage);
  storage.seed('notes/studies/offline.md', offlineNote);
  storage.seed('notes/studies/concurrent.md', concurrentNote);
  storage.seed('highlights/highlight-001.json', JSON.stringify({ id: 'highlight-001', versionId: 'nvi', bookId: 43, chapter: 3, verseStart: 16, verseEnd: 16 }));
  return storage;
}

export async function readText(storage: WorkspaceStorage, path: string): Promise<string> {
  const bytes = await storage.readFile(path);
  if (!bytes) throw new Error(`Missing fixture file: ${path}`);
  return new TextDecoder().decode(bytes);
}

export async function readJson<T>(storage: WorkspaceStorage, path: string): Promise<T> { return JSON.parse(await readText(storage, path)) as T; }
