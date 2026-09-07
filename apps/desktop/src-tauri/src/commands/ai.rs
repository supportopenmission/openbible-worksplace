use super::workspace::CommandError;
use keyring::Entry;
use serde::Serialize;
use sha2::{Digest, Sha256};

const KEYRING_SERVICE: &str = "com.openbible.desktop.agent";
const SECRET_REF_PREFIX: &str = "keychain:v1:";

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AgentProfileBinding {
    pub profile_id: String,
    pub provider: String,
    pub model: String,
    pub endpoint: Option<String>,
    pub secret_ref: String,
    pub state: &'static str,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AgentProfileRevoked {
    pub profile_id: String,
    pub state: &'static str,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AgentCredentialCapability {
    pub available: bool,
    pub backend: &'static str,
}

fn required_component(value: String, code: &'static str) -> Result<String, CommandError> {
    let normalized = value.trim().to_string();
    if normalized.is_empty()
        || normalized.contains('/')
        || normalized.contains('\\')
        || normalized.contains('\n')
        || normalized.contains('\r')
    {
        return Err(CommandError::new(code, false));
    }
    Ok(normalized)
}

fn secret_ref_for_profile(profile_id: &str) -> String {
    let mut digest = Sha256::new();
    digest.update(b"openbible-agent-secret-ref:v1:");
    digest.update(profile_id.as_bytes());
    let digest = digest.finalize();
    let encoded = digest
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect::<String>();
    format!("{SECRET_REF_PREFIX}{encoded}")
}

fn validate_secret_ref(secret_ref: String) -> Result<String, CommandError> {
    let normalized = secret_ref.trim().to_string();
    if normalized.len() != SECRET_REF_PREFIX.len() + 64
        || !normalized.starts_with(SECRET_REF_PREFIX)
        || !normalized[SECRET_REF_PREFIX.len()..]
            .chars()
            .all(|character| character.is_ascii_hexdigit())
    {
        return Err(CommandError::new("agent_secret_ref_invalid", false));
    }
    Ok(normalized)
}

fn keyring_entry(secret_ref: &str) -> Result<Entry, CommandError> {
    Entry::new(KEYRING_SERVICE, secret_ref)
        .map_err(|_| CommandError::new("credential_store_unavailable", true))
}

fn map_store_error(code: &'static str) -> CommandError {
    CommandError::new(code, true)
}

/// Saves a provider secret directly in the operating system credential store.
/// The secret is never serialized, returned through IPC, or written to the workspace.
#[tauri::command]
pub fn agent_profile_save(
    profile_id: String,
    provider: String,
    model: String,
    endpoint: Option<String>,
    secret: String,
) -> Result<AgentProfileBinding, CommandError> {
    let profile_id = required_component(profile_id, "agent_profile_id_required")?;
    let provider = required_component(provider, "agent_provider_required")?;
    let model = required_component(model, "agent_model_required")?;
    let endpoint = endpoint
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());
    if secret.trim().is_empty() {
        return Err(CommandError::new("agent_secret_required", false));
    }

    let secret_ref = secret_ref_for_profile(&profile_id);
    let entry = keyring_entry(&secret_ref)?;
    entry
        .set_password(&secret)
        .map_err(|_| map_store_error("credential_store_write_failed"))?;

    Ok(AgentProfileBinding {
        profile_id,
        provider,
        model,
        endpoint,
        secret_ref,
        state: "ready",
    })
}

/// Revokes a credential without returning or logging its value.
#[tauri::command]
pub fn agent_profile_revoke(
    profile_id: String,
    secret_ref: String,
) -> Result<AgentProfileRevoked, CommandError> {
    let profile_id = required_component(profile_id, "agent_profile_id_required")?;
    let secret_ref = validate_secret_ref(secret_ref)?;
    let expected_ref = secret_ref_for_profile(&profile_id);
    if secret_ref != expected_ref {
        return Err(CommandError::new("agent_secret_ref_mismatch", false));
    }

    let entry = keyring_entry(&secret_ref)?;
    match entry.delete_credential() {
        Ok(()) => Ok(AgentProfileRevoked {
            profile_id,
            state: "revoked",
        }),
        Err(_) => Err(map_store_error("credential_store_delete_failed")),
    }
}

/// Exposes only whether the native credential store is available.
#[tauri::command]
pub fn agent_profile_capability() -> AgentCredentialCapability {
    AgentCredentialCapability {
        available: Entry::store_status().is_ok(),
        backend: "native-os-credential-store",
    }
}

/// Internal-only secret retrieval for a future Rust provider adapter.
/// It is deliberately not a Tauri command and never crosses into the webview.
#[allow(dead_code)]
pub(crate) fn load_agent_secret(secret_ref: &str) -> Result<String, CommandError> {
    let secret_ref = validate_secret_ref(secret_ref.to_string())?;
    let entry = keyring_entry(&secret_ref)?;
    entry
        .get_password()
        .map_err(|_| map_store_error("credential_store_read_failed"))
}

#[cfg(test)]
pub(crate) fn test_secret_ref_for_profile(profile_id: &str) -> String {
    secret_ref_for_profile(profile_id)
}
