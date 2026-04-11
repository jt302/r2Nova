use std::process::Command;
use tauri::command;
use tauri::{AppHandle, Manager};

#[cfg(target_os = "macos")]
fn detect_macos_theme() -> Option<bool> {
    let output = Command::new("defaults")
        .args(["read", "-g", "AppleInterfaceStyle"])
        .output()
        .ok()?;

    let style = String::from_utf8_lossy(&output.stdout);
    Some(style.trim() == "Dark")
}

#[cfg(target_os = "windows")]
fn detect_windows_theme() -> Option<bool> {
    use std::ptr;
    use windows::core::w;
    use windows::Win32::Foundation::ERROR_SUCCESS;
    use windows::Win32::System::Registry::{
        RegOpenKeyExW, RegQueryValueExW, HKEY_CURRENT_USER, KEY_READ, REG_DWORD,
    };

    unsafe {
        let mut key = ptr::null_mut();
        let path = w!("Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize");

        if RegOpenKeyExW(HKEY_CURRENT_USER, path, None, KEY_READ, &mut key) != ERROR_SUCCESS.0 {
            return None;
        }

        let mut data: u32 = 0;
        let mut data_len: u32 = std::mem::size_of::<u32>() as u32;
        let mut data_type: u32 = 0;
        let value = w!("AppsUseLightTheme");

        let result = RegQueryValueExW(
            key,
            value,
            None,
            Some(&mut data_type),
            Some(&mut data as *mut u32 as *mut u8),
            Some(&mut data_len),
        );

        if result == ERROR_SUCCESS.0 && data_type == REG_DWORD.0 {
            return Some(data == 0);
        }
    }

    None
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
fn detect_linux_theme() -> Option<bool> {
    let output = Command::new("gsettings")
        .args(["get", "org.gnome.desktop.interface", "gtk-theme"])
        .output()
        .ok()?;

    let theme = String::from_utf8_lossy(&output.stdout).to_lowercase();
    Some(theme.contains("dark"))
}

#[command]
pub fn get_system_theme(_app: AppHandle) -> Result<String, String> {
    let is_dark = {
        #[cfg(target_os = "macos")]
        {
            detect_macos_theme()
        }

        #[cfg(target_os = "windows")]
        {
            detect_windows_theme()
        }

        #[cfg(not(any(target_os = "macos", target_os = "windows")))]
        {
            detect_linux_theme()
        }
    };

    match is_dark {
        Some(true) => Ok("dark".to_string()),
        Some(false) => Ok("light".to_string()),
        None => Ok("light".to_string()),
    }
}

#[command]
pub fn set_window_theme(app: AppHandle, is_dark: bool) -> Result<(), String> {
    let theme = if is_dark {
        tauri::Theme::Dark
    } else {
        tauri::Theme::Light
    };

    for (_, window) in app.webview_windows() {
        let _ = window.set_theme(Some(theme));
    }

    Ok(())
}
