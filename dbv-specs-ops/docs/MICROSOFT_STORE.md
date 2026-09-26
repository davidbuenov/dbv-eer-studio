# 🏬 Publicación en Microsoft Store: dbv-eer-studio

> **Estado:** 🟢 v1.5.0 publicada en Microsoft Store · 🟡 v1.6.0.0 generada y documentada, pendiente de enviar como actualización (`docs/store/SUBMISSION_GUIDE_v1.6.0.md`).
> **Última revisión:** 2026-09-26

Documento operativo (no una especificación de producto): checklist accionable para publicar `dbv-eer-studio` en la Microsoft Store, y registro de las decisiones técnicas que llevan hasta aquí. Complementa al instalador NSIS/MSI ya existente (GitHub Releases) sin sustituirlo — ambos canales de distribución coexisten.

---

## 1. Vía elegida: MSIX subido directamente a Partner Center

Misma decisión ya validada en `dbv-md-reader` (publicado y en vivo en la Store): la Store firma el paquete automáticamente con su propio certificado tras la certificación — no hace falta comprar un certificado Authenticode propio (vía "EXE o MSI" descartada por el mismo motivo).

Los dos canales de distribución coexisten sin conflicto: el instalador NSIS/MSI sigue publicándose en GitHub Releases con su propio mecanismo de actualización (`tauri-plugin-updater`); el MSIX es una identidad de paquete distinta, exclusiva de la Store, cuyas actualizaciones gestiona la propia Store — el botón "Buscar actualizaciones" de Créditos se oculta automáticamente ahí (`is_packaged_app()` en `src-tauri/src/lib.rs`).

## 2. Empaquetado MSIX con `@choochmeque/tauri-windows-bundle`

Misma herramienta de terceros ya auditada y validada en `dbv-md-reader` (MIT, publicada vía CI con npm trusted publishing, sin issues de seguridad abiertos).

```bash
npx @choochmeque/tauri-windows-bundle init                  # genera gen/windows/
npx @choochmeque/tauri-windows-bundle build --runner npm    # genera el .msix
```

**`--runner npm` es obligatorio**: el runner por defecto (`cargo`) asume la extensión `cargo-tauri`, que este proyecto no usa (invoca Tauri vía `@tauri-apps/cli`/npm).

### Archivos generados — SÍ se commitean (a diferencia de lo que su propio `.gitignore` sugiere)

El `.gitignore` que la propia herramienta genera en `src-tauri/gen/windows/.gitignore` no contiene ningún patrón real (solo comentarios) — confirmado también en `dbv-md-reader`, donde `bundle.config.json`, `AppxManifest.xml.template` y `Assets/*.png` están efectivamente trackeados en git. Se sigue el mismo criterio aquí: se commitea todo `src-tauri/gen/windows/`, precisamente porque los assets pueden necesitar corrección manual (ver §3) y no deben perderse ni regenerarse en silencio.

### Identidad Real de Microsoft Partner Center (Reservada 2026-08-24)

```json
"identifier": "davidbuenov.dbv-eer-studio",
"displayName": "dbv-eer-studio",
"publisher": "CN=13EE2A5D-F49E-48C9-8873-941069B15D63",
"publisherDisplayName": "davidbuenov"
```

- **Package/Identity/Name:** `davidbuenov.dbv-eer-studio`
- **Package/Identity/Publisher:** `CN=13EE2A5D-F49E-48C9-8873-941069B15D63`
- **Package/Properties/PublisherDisplayName:** `davidbuenov`
- **Package Family Name (PFN):** `davidbuenov.dbv-eer-studio_ze9zfmg3hs4tt`
- **Package SID:** `S-1-15-2-3921497017-4095285941-1727763197-4168665259-2363448539-3522398026-1231967314`
- **Id. de Store:** `9NFHVXW7ZRJC`

`displayName` fijado explícitamente a `"dbv-eer-studio"` (coincide con el binario compilado real) — lección de `dbv-md-reader`: si no coincide con el nombre del `.exe`, el build falla con `Executable not found`.

`capabilities.general` dejado en `[]` (a diferencia de `dbv-md-reader`, que necesita `internetClient` porque descarga `.md` remotos): `dbv-eer-studio` no hace ninguna llamada de red cuando está empaquetado — el único uso de red de la app (`updater.check()`) ya está deshabilitado en el canal Store.

## 3. Incidente encontrado y corregido — `Wide310x150Logo.png` como placeholder sólido

**Mismo bug ya documentado en `dbv-md-reader` (causó un rechazo real allí, política 10.1.1.11 "On Device Tiles"), reproducido aquí de nuevo:** el mosaico ancho generado automáticamente por `init` salió como un rectángulo negro sólido (`RGBA(0,0,0,255)`), mientras que `Square150x150Logo.png`/`Square44x44Logo.png`/`StoreLogo.png` sí llevaban el icono real. Causa: la propia herramienta falla en silencio al componer el mosaico ancho y cae a un PNG de repuesto.

**Fix aplicado (antes de generar ningún `.msix`, no después de un rechazo):** regenerado `Wide310x150Logo.png` con Pillow replicando el algoritmo real de la herramienta — `Square150x150Logo.png` redimensionado a 150×150, centrado horizontalmente sobre un lienzo `310×150` **transparente** (coherente con `BackgroundColor="transparent"` de `AppxManifest.xml.template`). Verificado visualmente.

**Checklist obligatorio antes de cada envío/reenvío:** abrir visualmente los 4 PNG de `src-tauri/gen/windows/Assets/` (no solo el icono principal) — o `python3 -c "from PIL import Image; print(Image.open(f).getcolors(100000))"`, un único color casi seguro indica un placeholder.

## 4. Estado de Partner Center — 🟢 Nombre e Identidad Reservados

- [x] Crear/usar cuenta de desarrollador en Partner Center.
- [x] Reservar el nombre → `davidbuenov.dbv-eer-studio` (Id de Store: `9NFHVXW7ZRJC`).
- [x] Copiar Publisher CN (`CN=13EE2A5D-F49E-48C9-8873-941069B15D63`) a `bundle.config.json` (§2).
- [x] Generar el paquete MSIX bundle `dbv-eer-studio_1.5.0.0.msixbundle`.
- [x] v1.5.0 publicada en la Store (confirmado por el autor, 2026-09-26).
- [x] Generar `dbv-eer-studio_1.6.0.0.msixbundle` (2026-09-26) — identidad, versión y assets verificados.
- [x] Documentación de la actualización v1.6.0: fichas ES/EN, 6 capturas nuevas y `docs/store/SUBMISSION_GUIDE_v1.6.0.md`.
- [ ] Enviar la actualización v1.6.0 en Partner Center (acción del autor).
- [x] Política de privacidad creada en [`docs/store/PRIVACY_POLICY.md`](file:///d:/Programacion/github-davidbuenov/eer-studio/docs/store/PRIVACY_POLICY.md).
- [x] Capturas de pantalla para la ficha en [`docs/store/screenshots/`](file:///d:/Programacion/github-davidbuenov/eer-studio/docs/store/screenshots/).
- [x] Metadatos de Store creados en [`docs/store/MICROSOFT_STORE_METADATA_ES.md`](file:///d:/Programacion/github-davidbuenov/eer-studio/docs/store/MICROSOFT_STORE_METADATA_ES.md) y `_EN.md`.

## 5. Checklist de envío a certificación

1. Reservar nombre → `davidbuenov.dbv-eer-studio` (Completado ✅).
2. Configurar `bundle.config.json` con la identidad del Partner Center (Completado ✅).
3. Generar el `.msixbundle` final con esa identidad (Completado ✅ — `src-tauri/target/msix/dbv-eer-studio_1.5.0.0.msixbundle`).
4. Publicar política de privacidad (Completado ✅ — `docs/store/PRIVACY_POLICY.md`).
5. Propiedades del producto: Categoría `Developer tools` / Subcategoría `Database tools` (Completado ✅).
6. Ficha de la Store: Descripción, capturas, edad recomendada y novedades v1.5.0 (Completado ✅).
7. Subir el paquete `dbv-eer-studio_1.5.0.0.msixbundle` a la submission en Partner Center (Completado ✅).
8. (Recomendado) Pasar el Windows App Certification Kit (WACK) local antes de enviar (Completado ✅).
9. **Verificar que ningún asset de `Assets/*.png` sea un placeholder** (§3) (Completado ✅).
10. Enviar a certificación (Completado ✅ — 2026-09-23).

## 7. Procedimiento obligatorio en cada `/ship` (decidido por el autor, 2026-09-26)

La entrega de una versión **no termina en el commit + tag**. Cada `/ship` incluye además:

1. **Publicar en GitHub:** `git push origin main --tags` (dispara GitHub Pages y los workflows de release de Windows/Linux/macOS).
2. **Generar el MSIX:**
   - Cerrar cualquier instancia de `dbv-eer-studio.exe` (Windows bloquea el binario y el build falla con "Acceso denegado").
   - Comprobar que `src-tauri/gen/windows/Assets/*.png` no son placeholders (§3).
   - `npm run tauri:windows:build` → `src-tauri/target/msix/dbv-eer-studio_X.Y.Z.0.msixbundle`.
   - Verificar en el `AppxManifest.xml` del `.msix`: Identity, Publisher y `Version="X.Y.Z.0"`.
3. **Documentación completa para Microsoft Store** en `docs/store/`:
   - Fichas `MICROSOFT_STORE_METADATA_ES.md` / `_EN.md` (descripción, características, novedades, pies de captura) dentro de los límites de Partner Center.
   - Capturas regeneradas con `node scripts/capture-store-screenshots.mjs`.
   - Novedades de Uptodown (`UPTODOWN_METADATA_*.md`).
   - `SUBMISSION_GUIDE_vX.Y.Z.md` con los pasos exactos de la actualización en Partner Center.
4. Actualizar este documento (§4) con el estado del envío.

## 6. Fuera de alcance de esta fase

- Crear la cuenta de Partner Center y reservar el nombre — acción del usuario, no automatizable.
- Enviar la submission real a certificación.
- Publicación en Uptodown (macOS) — canal independiente, ver `release-macos.yml` y `MARKETPLACE_PUBLISHING.md`.
- Internacionalización ES/EN de la propia app — tarea aparte registrada en `task.md`, no bloquea el envío a la Store pero sí sería deseable antes de una ficha en inglés.
