use super::ai::{agent_profile_revoke, agent_profile_save, test_secret_ref_for_profile};

#[test]
fn secret_reference_is_stable_and_does_not_contain_profile_identity() {
    // SPECSFY: US-001 FR-001 FR-003 NFR-001 AC-001 AC-003 AC-015
    let first = test_secret_ref_for_profile("profile-study");
    let second = test_secret_ref_for_profile("profile-study");

    assert_eq!(first, second);
    assert!(first.starts_with("keychain:v1:"));
    assert!(!first.contains("profile-study"));
}

#[test]
fn save_rejects_an_empty_secret_before_touching_the_store() {
    // SPECSFY: US-001 FR-001 FR-002 NFR-001 AC-001
    let error = agent_profile_save(
        "profile-study".into(),
        "openai".into(),
        "gpt-5".into(),
        None,
        "  ".into(),
    )
    .expect_err("an empty credential must be rejected");

    assert_eq!(error.code, "agent_secret_required");
    assert!(!error.message.contains("sk-"));
}

#[test]
fn revoke_rejects_a_reference_from_another_profile() {
    // SPECSFY: US-001 FR-003 NFR-001 AC-003
    let error = agent_profile_revoke(
        "profile-study".into(),
        test_secret_ref_for_profile("profile-other"),
    )
    .expect_err("a profile cannot revoke another profile's credential");

    assert_eq!(error.code, "agent_secret_ref_mismatch");
}

#[test]
fn redacted_command_results_do_not_include_a_secret_field() {
    // SPECSFY: US-001 FR-002 FR-003 NFR-001 AC-002 AC-015
    let revoked = agent_profile_revoke("profile-study".into(), "invalid".into())
        .expect_err("invalid references must be rejected");
    let encoded = serde_json::to_string(&revoked).expect("command error serializes");

    assert!(!encoded.contains("\"secret\""));
    assert!(!encoded.contains("sk-test-secret"));
}
