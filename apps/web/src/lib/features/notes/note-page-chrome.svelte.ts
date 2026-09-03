import {
	readNoteEditorWidth,
	saveNoteEditorWidth,
	type NoteEditorWidth
} from './note-editor-layout';

class NotePageChromeState {
	active = $state(false);
	title = $state('Nota');
	width = $state<NoteEditorWidth>('default');

	activate(title = 'Nota') {
		this.active = true;
		this.title = title;
		this.width = readNoteEditorWidth();
	}

	updateTitle(title: string) {
		this.title = title;
	}

	deactivate() {
		this.active = false;
		this.title = 'Nota';
	}

	setWidth(width: NoteEditorWidth) {
		this.width = width;
		saveNoteEditorWidth(width);
	}
}

export const notePageChrome = new NotePageChromeState();
