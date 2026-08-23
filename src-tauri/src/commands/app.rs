use crate::error::AppResult;
use tauri::AppHandle;

#[tauri::command]
pub async fn reveal_item(app: AppHandle, path: String) -> AppResult<()> {
	use tauri_plugin_opener::OpenerExt;
	app.opener()
		.open_path(path, None::<&str>)
		.map_err(|e| crate::error::AppError::Other(e.to_string()))?;
	Ok(())
}

#[tauri::command]
pub async fn ping() -> AppResult<String> {
	Ok("ok".into())
}

#[tauri::command]
pub fn install_kind() -> &'static str {
	install_kind_from(
		cfg!(target_os = "linux"),
		std::env::var_os("APPIMAGE").is_some(),
	)
}

pub(crate) fn install_kind_from(linux: bool, appimage: bool) -> &'static str {
	match (linux, appimage) {
		(true, true) => "appimage",
		(true, false) => "linux-pkg",
		_ => "native",
	}
}

#[cfg(test)]
mod tests {
	use super::install_kind_from;

	#[test]
	fn classifies_linux_installers() {
		assert_eq!(install_kind_from(true, true), "appimage");
		assert_eq!(install_kind_from(true, false), "linux-pkg");
		assert_eq!(install_kind_from(false, true), "native");
		assert_eq!(install_kind_from(false, false), "native");
	}
}
