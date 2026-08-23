# 🏬 Publicación en Microsoft Store: dbv-eer-studio

> **Estado:** 🔴 No iniciado en Partner Center — empaquetado local (MSIX) preparado, identidad pendiente de reserva.
> **Última revisión:** 2026-08-23

Documento operativo (no una especificación de producto): checklist accionable para publicar `dbv-eer-studio` en la Microsoft Store, y registro de las decisiones técnicas que llevan hasta aquí. Complementa al instalador NSIS/MSI ya existente (GitHub Releases) sin sustituirlo — ambos canales de distribución coexisten.

---

## 1. Vía elegida: MSIX subido directamente a Partner Center

Misma decisión ya validada en `dbv-md-reader` (publicado y en vivo en la Store): la Store firma el paquete automáticamente con su propio certificado tras la certificación — no hace falta comprar un certificado Authenticode propio (vía "EXE o MSI" descartada por el mismo motivo).

Los dos canales de distribución coexisten sin conflicto: el instalador NSIS/MSI sigue publicándose en GitHub Releases con su propio mecanismo de actualización (`tauri-plugin-updater`); el MSIX es una identidad de paquete distinta, exclusiva de la Store, cuyas actualizaciones gestiona la propia Store — el botón "Buscar actualizaciones" de Créditos se oculta automáticamente ahí (`is_packaged_app()` en `src-tauri/src/lib.rs`).

## 2. Empaquetado MSIX con `@choochmeque/tauri-windows-bundle`

Misma herramienta de terceros ya auditada y validada en `dbv-md-reader` (MIT, publicada vía CI con npm trusted publishing, sin issues de seguridad abiertos).

```bash
npx @choochmeque/tauri-windows-bundle init                  # ya ejecutado — genera gen/windows/
npx @choochmeque/tauri-windows-bundle build --runner npm    # genera el .msix
```

**`--runner npm` es obligatorio**: el runner por defecto (`cargo`) asume la extensión `cargo-tauri`, que este proyecto no usa (invoca Tauri vía `@tauri-apps/cli`/npm).

### Archivos generados — SÍ se commitean (a diferencia de lo que su propio `.gitignore` sugiere)

El `.gitignore` que la propia herramienta genera en `src-tauri/gen/windows/.gitignore` no contiene ningún patrón real (solo comentarios) — confirmado también en `dbv-md-reader`, donde `bundle.config.json`, `AppxManifest.xml.template` y `Assets/*.png` están efectivamente trackeados en git. Se sigue el mismo criterio aquí: se commitea todo `src-tauri/gen/windows/`, precisamente porque los assets pueden necesitar corrección manual (ver §3) y no deben perderse ni regenerarse en silencio.

### Identidad — placeholder, pendiente de Partner Center

```json
"identifier": "davidbuenov.DBVEERStudio",
"displayName": "dbv-eer-studio",
"publisher": "CN=TBD-PARTNER-CENTER-GUID",
"publisherDisplayName": "davidbuenov"
```

`identifier` y `publisher` son propuestas, no reservas reales — hay que sustituirlos por los valores exactos de "Ver identidad del producto" en Partner Center una vez reservado el nombre (§4). `displayName` fijado explícitamente a `"dbv-eer-studio"` (coincide con el binario compilado real) — lección de `dbv-md-reader`: si no coincide con el nombre del `.exe`, el build falla con `Executable not found`, no con un error de identidad obvio.

`capabilities.general` dejado en `[]` (a diferencia de `dbv-md-reader`, que necesita `internetClient` porque descarga `.md` remotos): `dbv-eer-studio` no hace ninguna llamada de red cuando está empaquetado — el único uso de red de la app (`updater.check()`) ya está deshabilitado en el canal Store.

## 3. Incidente encontrado y corregido en esta misma sesión — `Wide310x150Logo.png` como placeholder sólido

**Mismo bug ya documentado en `dbv-md-reader` (causó un rechazo real allí, política 10.1.1.11 "On Device Tiles"), reproducido aquí de nuevo:** el mosaico ancho generado automáticamente por `init` salió como un rectángulo negro sólido (`RGBA(0,0,0,255)`), mientras que `Square150x150Logo.png`/`Square44x44Logo.png`/`StoreLogo.png` sí llevaban el icono real. Causa: la propia herramienta falla en silencio al componer el mosaico ancho y cae a un PNG de repuesto.

**Fix aplicado (antes de generar ningún `.msix`, no después de un rechazo):** regenerado `Wide310x150Logo.png` con Pillow replicando el algoritmo real de la herramienta — `Square150x150Logo.png` redimensionado a 150×150, centrado horizontalmente sobre un lienzo `310×150` **transparente** (coherente con `BackgroundColor="transparent"` de `AppxManifest.xml.template`). Verificado visualmente.

**Checklist obligatorio antes de cada envío/reenvío:** abrir visualmente los 4 PNG de `src-tauri/gen/windows/Assets/` (no solo el icono principal) — o `python3 -c "from PIL import Image; print(Image.open(f).getcolors(100000))"`, un único color casi seguro indica un placeholder.

## 4. Estado de Partner Center — 🔴 pendiente, acción del usuario

- [ ] Crear/usar cuenta de desarrollador en Partner Center.
- [ ] Reservar el nombre → `MSIX or PWA app` (propuesta: "dbv-eer-studio" o un nombre comercial más descriptivo — decisión del usuario, ver nota en `dbv-md-reader/MICROSOFT_STORE.md` §4 sobre esa misma disyuntiva).
- [ ] Copiar el Publisher CN / Package Identity Name reales a `bundle.config.json` (§2), sustituyendo los placeholders.
- [ ] Política de privacidad — la app es 100% local/offline (no hay telemetría ni red saliente salvo el updater, ya deshabilitado en Store); probablemente basta una política mínima "no se recopilan datos", pero publicarla donde la Store pueda enlazarla (p. ej. una página en `davidbuenov.github.io` o en la propia demo de GitHub Pages).
- [ ] Capturas de pantalla para la ficha (reutilizables de la demo en vivo).
- [ ] `descripcionStore_es.md`/`descripcionStore_en.md` en la raíz del proyecto (borrador pendiente, se puede partir de la estructura de `dbv-md-reader` adaptada a EER/relacional/SQL).

## 5. Checklist de envío (para cuando el nombre esté reservado)

1. Reservar nombre → `MSIX or PWA app`.
2. Copiar Publisher CN / Package Identity Name reales a `bundle.config.json`.
3. Regenerar el `.msix` final con esa identidad.
4. Publicar política de privacidad.
5. Propiedades del producto: categoría, URL de política de privacidad.
6. Ficha de la Store: descripción, capturas, edad recomendada.
7. Subir el `.msix`/`.msixupload` generado.
8. (Recomendado) Pasar el Windows App Certification Kit (WACK) local antes de enviar.
9. **Verificar que ningún asset de `Assets/*.png` sea un placeholder** (§3) antes de cada envío/reenvío.
10. Enviar a certificación.

## 6. Fuera de alcance de esta fase

- Crear la cuenta de Partner Center y reservar el nombre — acción del usuario, no automatizable.
- Enviar la submission real a certificación.
- Publicación en Uptodown (macOS) — canal independiente, ver `release-macos.yml` y `MARKETPLACE_PUBLISHING.md`.
- Internacionalización ES/EN de la propia app — tarea aparte registrada en `task.md`, no bloquea el envío a la Store pero sí sería deseable antes de una ficha en inglés.
