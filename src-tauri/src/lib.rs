// =============================================================================
// dbv-eer-studio — Editor de Diagramas Entidad-Relación Extendido (EER)
// Copyright (c) 2025-2026 David Bueno Vallejo
// Licensed under the MIT License. See LICENSE for details.
// Built with dbv-specs-ops · https://github.com/davidbuenov/dbv-specs-ops
// =============================================================================

use tauri::{Emitter, Manager};

/// Barra de menú nativa de macOS (App/File/Edit/Window/Help). Tauri v2 no trae
/// menú por defecto ahí — sin esto la app no se siente nativa (Cmd+Q, Cmd+H,
/// Cortar/Copiar/Pegar del sistema, etc.). Windows/Linux ya tienen su propia UI
/// para estas acciones dentro de la ventana, así que se dejan intactos.
#[cfg(target_os = "macos")]
mod macos_menu {
    use tauri::menu::{
        AboutMetadata, Menu, MenuItem, PredefinedMenuItem, Submenu, HELP_SUBMENU_ID,
        WINDOW_SUBMENU_ID,
    };
    use tauri::{AppHandle, Runtime};

    /// Los ítems predefinidos de macOS (Cortar/Copiar/Pegar…) los localiza el
    /// propio sistema — los ítems propios (Abrir, Guardar…) no tienen esa magia
    /// gratis, así que replican el mismo criterio a mano.
    fn is_spanish_system() -> bool {
        sys_locale::get_locale()
            .map(|l| l.to_lowercase().starts_with("es"))
            .unwrap_or(false)
    }

    pub fn build<R: Runtime>(handle: &AppHandle<R>) -> tauri::Result<Menu<R>> {
        let es = is_spanish_system();
        let pkg_info = handle.package_info();
        let config = handle.config();
        let about_metadata = AboutMetadata {
            name: Some(pkg_info.name.clone()),
            version: Some(pkg_info.version.to_string()),
            copyright: config.bundle.copyright.clone(),
            authors: config.bundle.publisher.clone().map(|p| vec![p]),
            ..Default::default()
        };

        let app_menu = Submenu::with_items(
            handle,
            pkg_info.name.clone(),
            true,
            &[
                &PredefinedMenuItem::about(handle, None, Some(about_metadata))?,
                &PredefinedMenuItem::separator(handle)?,
                &PredefinedMenuItem::services(handle, None)?,
                &PredefinedMenuItem::separator(handle)?,
                &PredefinedMenuItem::hide(handle, None)?,
                &PredefinedMenuItem::hide_others(handle, None)?,
                &PredefinedMenuItem::separator(handle)?,
                &PredefinedMenuItem::quit(handle, None)?,
            ],
        )?;

        // Sin "Alternar Modo Edición" ni Deshacer/Rehacer: dbv-eer-studio no
        // tiene esos conceptos (siempre editable, sin historial de undo).
        let open_file_item = MenuItem::with_id(
            handle,
            "open_file",
            if es { "Abrir…" } else { "Open…" },
            true,
            Some("CmdOrCtrl+O"),
        )?;
        let save_item = MenuItem::with_id(
            handle,
            "save",
            if es { "Guardar" } else { "Save" },
            true,
            Some("CmdOrCtrl+S"),
        )?;
        let save_as_item = MenuItem::with_id(
            handle,
            "save_as",
            if es { "Guardar como…" } else { "Save As…" },
            true,
            Some("CmdOrCtrl+Shift+S"),
        )?;
        let file_menu = Submenu::with_items(
            handle,
            "File",
            true,
            &[
                &open_file_item,
                &PredefinedMenuItem::separator(handle)?,
                &save_item,
                &save_as_item,
                &PredefinedMenuItem::separator(handle)?,
                &PredefinedMenuItem::close_window(handle, None)?,
            ],
        )?;

        let edit_menu = Submenu::with_items(
            handle,
            "Edit",
            true,
            &[
                &PredefinedMenuItem::cut(handle, None)?,
                &PredefinedMenuItem::copy(handle, None)?,
                &PredefinedMenuItem::paste(handle, None)?,
                &PredefinedMenuItem::select_all(handle, None)?,
            ],
        )?;

        let window_menu = Submenu::with_id_and_items(
            handle,
            WINDOW_SUBMENU_ID,
            "Window",
            true,
            &[
                &PredefinedMenuItem::minimize(handle, None)?,
                &PredefinedMenuItem::maximize(handle, None)?,
                &PredefinedMenuItem::separator(handle)?,
                &PredefinedMenuItem::close_window(handle, None)?,
            ],
        )?;

        let help_menu = Submenu::with_id_and_items(handle, HELP_SUBMENU_ID, "Help", true, &[])?;

        Menu::with_items(
            handle,
            &[&app_menu, &file_menu, &edit_menu, &window_menu, &help_menu],
        )
    }
}

/// Devuelve `true` si el binario en ejecución está instalado como paquete MSIX
/// de Microsoft Store (detectado por su ruta de instalación bajo `WindowsApps`).
/// Se usa para ocultar el botón "Buscar actualizaciones" propio en ese canal —
/// la Store gestiona sus propias actualizaciones (ver
/// dbv-specs-ops/docs/NATIVE_DESKTOP_APPS.md §4 lección 6).
#[tauri::command]
fn is_packaged_app() -> bool {
    std::env::current_exe()
        .map(|path| {
            path.components().any(|c| {
                c.as_os_str()
                    .to_str()
                    .map(|s| s.eq_ignore_ascii_case("WindowsApps"))
                    .unwrap_or(false)
            })
        })
        .unwrap_or(false)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_process::init())
    .invoke_handler(tauri::generate_handler![is_packaged_app])
    .setup(|_app| {
      #[cfg(target_os = "macos")]
      {
        let menu = macos_menu::build(_app.handle())?;
        _app.handle().set_menu(menu)?;
      }
      Ok(())
    })
    .on_menu_event(|app, event| {
      // "Abrir…"/"Guardar"/"Guardar como…" del menú File (macOS) reusan el
      // flujo que ya tiene el frontend para el menú "File" propio de la
      // toolbar — solo hace falta avisar a la ventana, no reimplementar
      // el diálogo de fichero en Rust.
      let event_name = match event.id().as_ref() {
        "open_file" => Some("menu-open-file"),
        "save" => Some("menu-save"),
        "save_as" => Some("menu-save-as"),
        _ => None,
      };
      if let Some(event_name) = event_name {
        if let Some(window) = app.get_webview_window("main") {
          let _ = window.emit(event_name, ());
        }
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
