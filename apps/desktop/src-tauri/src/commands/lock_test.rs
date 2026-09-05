#[test]
fn second_instance_cannot_acquire_the_same_workspace() {
    // SPECSFY: US-003 FR-004 NFR-001 AC-009
    let workspace = std::env::temp_dir().join(format!("openbible-lock-test-{}", std::process::id()));
    std::fs::create_dir_all(workspace.join(".openbible")).expect("workspace fixture");
    let first = crate::commands::lock::acquire(&workspace).expect("first lock");

    let second = crate::commands::lock::acquire(&workspace);

    assert_eq!(second.expect_err("second lock must fail").code(), "workspace_locked");
    crate::commands::lock::release(first).expect("release lock");
	let _ = std::fs::remove_dir_all(workspace);
}

#[test]
fn initialize_is_idempotent_for_the_active_workspace() {
	// SPECSFY: US-003 FR-004 NFR-001 AC-009
	let workspace = std::env::temp_dir().join(format!("openbible-initialize-test-{}", std::process::id()));
	let mut context = crate::commands::workspace::WorkspaceContext::default();
	let first = crate::commands::workspace::initialize(&mut context, Some(workspace.to_string_lossy().into_owned())).expect("first initialization");
	let second = crate::commands::workspace::initialize(&mut context, Some(workspace.to_string_lossy().into_owned())).expect("repeated initialization");

	assert_eq!(first, second);
	if let Some(lock) = context.lock.take() {
		crate::commands::lock::release(lock).expect("release lock");
	}
	let _ = std::fs::remove_dir_all(workspace);
}

#[test]
fn initialize_requires_an_explicit_workspace_path() {
	// SPECSFY: US-001 FR-001 NFR-002 AC-002
	let mut context = crate::commands::workspace::WorkspaceContext::default();
	let error = crate::commands::workspace::initialize(&mut context, None)
		.expect_err("native initialization must require the selected folder");

	assert_eq!(error.code, "workspace_path_required");
}

#[test]
fn delete_file_removes_a_workspace_relative_file() {
	// SPECSFY: US-001 FR-002 NFR-003 AC-004
	let workspace = std::env::temp_dir().join(format!("openbible-delete-test-{}", std::process::id()));
	let mut context = crate::commands::workspace::WorkspaceContext::default();
	crate::commands::workspace::initialize(&mut context, Some(workspace.to_string_lossy().into_owned()))
		.expect("initialize workspace");
	std::fs::write(workspace.join("notes/example.md"), "note").expect("create note fixture");

	crate::commands::workspace::delete_file(&context, "notes/example.md".into()).expect("delete note");

	assert!(!workspace.join("notes/example.md").exists());
	if let Some(lock) = context.lock.take() {
		crate::commands::lock::release(lock).expect("release lock");
	}
	let _ = std::fs::remove_dir_all(workspace);
}

#[test]
fn inspect_bible_accepts_openlp_schema_without_abbreviation() {
	// SPECSFY: US-001 FR-002 NFR-003 AC-004
	let workspace = std::env::temp_dir().join(format!("openbible-bible-test-{}", std::process::id()));
	let mut context = crate::commands::workspace::WorkspaceContext::default();
	crate::commands::workspace::initialize(&mut context, Some(workspace.to_string_lossy().into_owned())).expect("initialize workspace");

	let database_path = workspace.join("bibles/bibles_ACF.sqlite");
	let connection = rusqlite::Connection::open(&database_path).expect("create bible fixture");
	connection
		.execute_batch(
			"CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT);
			 CREATE TABLE book (id INTEGER PRIMARY KEY, book_reference_id INTEGER, testament_reference_id INTEGER, name TEXT NOT NULL);
			 CREATE TABLE verse (id INTEGER PRIMARY KEY, book_id INTEGER, chapter INTEGER, verse INTEGER, text TEXT);
			 INSERT INTO metadata (key, value) VALUES ('name', 'Almeida Corrigida e Fiel');
			 INSERT INTO book (id, book_reference_id, testament_reference_id, name) VALUES (1, 1, 1, 'Gênesis');
			 INSERT INTO verse (id, book_id, chapter, verse, text) VALUES (1, 1, 1, 1, 'No princípio criou Deus os céus e a terra.');",
		)
		.expect("populate bible fixture");
	drop(connection);

	let info = crate::commands::workspace::inspect_bible_impl(&context, "bibles_ACF.sqlite".into()).expect("inspect bible");
	assert_eq!(info.name, "Almeida Corrigida e Fiel");
	assert_eq!(info.books[0].abbreviation, "");
	assert_eq!(info.books[0].chapters, vec![1]);

	if let Some(lock) = context.lock.take() {
		crate::commands::lock::release(lock).expect("release lock");
	}
	let _ = std::fs::remove_dir_all(workspace);
}

#[test]
fn inspect_bible_accepts_null_book_abbreviation() {
	// SPECSFY: US-001 FR-002 NFR-003 AC-004
	let workspace = std::env::temp_dir().join(format!("openbible-null-abbr-test-{}", std::process::id()));
	let mut context = crate::commands::workspace::WorkspaceContext::default();
	crate::commands::workspace::initialize(&mut context, Some(workspace.to_string_lossy().into_owned())).expect("initialize workspace");

	let database_path = workspace.join("bibles/bibles_ARA.sqlite");
	let connection = rusqlite::Connection::open(&database_path).expect("create bible fixture");
	connection
		.execute_batch(
			"CREATE TABLE book (id INTEGER PRIMARY KEY, name TEXT NOT NULL, abbreviation TEXT);
			 CREATE TABLE verse (id INTEGER PRIMARY KEY, book_id INTEGER, chapter INTEGER, verse INTEGER, text TEXT);
			 INSERT INTO book (id, name, abbreviation) VALUES (1, 'Gênesis', NULL);
			 INSERT INTO verse (id, book_id, chapter, verse, text) VALUES (1, 1, 1, 1, 'No princípio criou Deus os céus e a terra.');",
		)
		.expect("populate bible fixture");
	drop(connection);

	let info = crate::commands::workspace::inspect_bible_impl(&context, "bibles_ARA.sqlite".into()).expect("inspect bible");
	assert_eq!(info.books[0].abbreviation, "");

	if let Some(lock) = context.lock.take() {
		crate::commands::lock::release(lock).expect("release lock");
	}
	let _ = std::fs::remove_dir_all(workspace);
}
