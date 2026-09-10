/**
 * Núcleo do Edra vendorado no OpenBible (fase 1 da migração gradual).
 * Reexporta o wrapper reativo TipTap v3 + Svelte 5 do Edra.
 */
export { Editor } from './tiptap/Editor';
export { useEditor } from './tiptap/hooks/useEditor.svelte.js';
export { getEditor, setEditor } from './tiptap/components/editorContext.js';
export { default as Tiptap } from './tiptap/components/Tiptap.svelte';
export { default as TiptapContent } from './tiptap/components/TiptapContent.svelte';
export { default as EditorContent } from './tiptap/components/EditorContent.svelte';
