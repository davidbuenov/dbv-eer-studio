# 🚀 Guía de Envío — Actualización v1.8.0 en Microsoft Store

> **App:** dbv-eer-studio · **Id. de Store:** `9NFHVXW7ZRJC` · **PFN:** `davidbuenov.dbv-eer-studio_ze9zfmg3hs4tt`
> **Versión a enviar:** v1.8.0 (paquete `1.8.0.0`) · **Preparada:** 2026-11-24
> **Versión publicada:** según `dbv-specs-ops/docs/MICROSOFT_STORE.md` §4, la v1.5.0 (la v1.6.0 quedó preparada pero pendiente de envío y la v1.7.0 no se envió). Compruébalo en Partner Center antes de empezar.

Es una **actualización**, no una app nueva: en Partner Center se crea una *nueva submission* sobre la app existente y solo se cambian el paquete, las novedades, la descripción, las características y las capturas. Precio, propiedades, clasificación de edad y política de privacidad se mantienen.

> **Si la v1.6.0 sigue sin publicarse:** no la envíes por separado. La v1.8.0 la sustituye e incluye todo lo de la v1.6.0 y la v1.7.0. Si hay una submission de la v1.6.0 a medias en Partner Center, elimínala o reutilízala para esta.

---

## 0. Artefactos listos

| Artefacto | Ubicación | Verificado |
| --- | --- | --- |
| Paquete | `src-tauri/target/msix/dbv-eer-studio_1.8.0.0.msixbundle` (4,0 MB) | Identity `davidbuenov.dbv-eer-studio`, Publisher `CN=13EE2A5D-F49E-48C9-8873-941069B15D63`, Version `1.8.0.0`, x64, Windows 10 17763+ |
| Assets del paquete | `src-tauri/gen/windows/Assets/*.png` | Los 4 PNG tienen miles de colores: ninguno es un placeholder (política 10.1.1.11) |
| Ficha ES / EN | `MICROSOFT_STORE_METADATA_ES.md` / `_EN.md` | Actualizadas a la v1.8.0, dentro de los límites de Partner Center (novedades ≈ 1 130 caracteres) |
| Capturas ES / EN (1920×1080) | `screenshots/screenshot_0[1-6]_*_{es,en}.png` | Regeneradas con la interfaz v1.8.0 (`scripts/capture-store-screenshots.mjs`) |
| Política de privacidad | `PRIVACY_POLICY.md` | Sin cambios: la app sigue sin conexiones de red |

---

## 1. Crear la submission

1. Partner Center → **Apps y juegos** → `dbv-eer-studio` → **Iniciar actualización** (*Update*).
2. Se clona la última submission; solo hay que tocar las secciones siguientes.

## 2. Paquetes (*Packages*)

1. Arrastra `dbv-eer-studio_1.8.0.0.msixbundle`.
2. **Elimina** los paquetes anteriores de la lista (todos requieren Windows 10 17763+, así que no hace falta conservarlos).
3. Comprueba que la validación muestra `Version 1.8.0.0` y la arquitectura `x64` sin avisos.

## 3. Descripciones de la tienda (*Store listings*): Español e Inglés

Para **cada idioma** (Español (España) y English (United States)), copia desde el fichero de metadatos correspondiente:

| Campo de Partner Center | Sección del fichero |
| --- | --- |
| Description | *Descripción Completa* / *Full Description* (actualizada: notación EER completa, deshacer, pantalla completa, FK compuestas y UNIQUE) |
| What's new in this version | *Novedades de la Versión v1.8.0* / *Version v1.8.0 Release Notes* |
| Product features | *Características Clave* / *Product Features* (13 líneas, una por campo) |
| Screenshots | Sustituye las capturas por las 6 nuevas **en el orden de la tabla** de la sección *Capturas*, pegando su pie de foto |
| Search terms | Sin cambios |
| Additional system requirements | Línea *Entrada* / *Input* (táctil planificado para la v1.9.0) |

## 4. Notas para la certificación (*Notes for certification*)

```text
dbv-eer-studio is a fully offline educational database design tool (EER diagrams -> Relational Model -> SQL DDL).
It does not require an account, does not use the network and stores no personal data.
To test: the app opens with a sample diagram; press F1 to open the built-in Help Center, double-click any element
to edit it, press Ctrl+Z to undo, F11 for full screen, and use the "Export SQL" button to generate the DDL script.
```

## 5. Antes de enviar

- [ ] (Recomendado) Pasar el **Windows App Certification Kit** en local sobre `dbv-eer-studio_1.8.0.0_x64.msix` (requiere administrador).
- [ ] Instalar el `.msixbundle` en local (doble clic → Instalar) y comprobar: arranque, F1, doble clic en una relación, Ctrl + Z / Ctrl + Y, **F11 y Esc** (pantalla completa de la ventana, que necesita el permiso `core:window:allow-set-fullscreen`) y **Ayuda → Acerca de** mostrando *Versión 1.8.0*.
- [ ] Revisar que las 6 capturas y la imagen destacada están asignadas en **ambos** idiomas.

## 6. Enviar

**Enviar a la Store** (*Submit to the Store*). La certificación suele tardar 24-72 h. Al publicarse:

- Actualizar `dbv-specs-ops/docs/MICROSOFT_STORE.md` (§4) marcando la v1.8.0 como publicada.
- Si Microsoft rechaza el envío, registrar el motivo y la corrección en `MICROSOFT_STORE.md`.
