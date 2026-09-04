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
