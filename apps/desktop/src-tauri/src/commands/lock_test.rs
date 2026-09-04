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
