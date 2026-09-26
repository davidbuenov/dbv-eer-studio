# 🚀 Guía de Envío — Actualización v1.6.0 en Microsoft Store

> **App:** dbv-eer-studio · **Id. de Store:** `9NFHVXW7ZRJC` · **PFN:** `davidbuenov.dbv-eer-studio_ze9zfmg3hs4tt`
> **Versión publicada actualmente:** v1.5.0 · **Versión a enviar:** v1.6.0 (paquete `1.6.0.0`)
> **Preparada:** 2026-09-26

Es una **actualización**, no una app nueva: en Partner Center se crea una *nueva submission* sobre la app existente y solo se cambian el paquete, las novedades, las características y las capturas. Precio, propiedades, clasificación de edad y política de privacidad se mantienen.

---

## 0. Artefactos listos

| Artefacto | Ubicación | Verificado |
| --- | --- | --- |
| Paquete | `src-tauri/target/msix/dbv-eer-studio_1.6.0.0.msixbundle` (5,6 MB) | Identity `davidbuenov.dbv-eer-studio`, Publisher `CN=13EE2A5D-F49E-48C9-8873-941069B15D63`, Version `1.6.0.0`, x64, Windows 10 17763+, capacidad `runFullTrust` |
| Assets del paquete | `src-tauri/gen/windows/Assets/*.png` | Los 4 PNG tienen miles de colores: ninguno es un placeholder (política 10.1.1.11) |
| Ficha ES / EN | `MICROSOFT_STORE_METADATA_ES.md` / `_EN.md` | Textos dentro de los límites de Partner Center |
| Capturas ES / EN (1920×1080) | `screenshots/screenshot_0[1-6]_*_{es,en}.png` | Regeneradas con la interfaz v1.6.0 (`scripts/capture-store-screenshots.mjs`) |
| Política de privacidad | `PRIVACY_POLICY.md` (sin cambios: la app sigue sin conexiones de red en el canal Store) | — |

---

## 1. Crear la submission

1. Partner Center → **Apps y juegos** → `dbv-eer-studio` → **Iniciar actualización** (*Update*).
2. Se clona la submission publicada (v1.5.0); solo hay que tocar las secciones siguientes.

## 2. Paquetes (*Packages*)

1. Arrastra `dbv-eer-studio_1.6.0.0.msixbundle`.
2. **Elimina** el paquete `1.5.0.0` de la lista (o déjalo solo si Partner Center lo exige para usuarios en versiones antiguas de Windows; no es el caso: ambos requieren Windows 10 17763+).
3. Comprueba que la validación muestra `Version 1.6.0.0` y la arquitectura `x64` sin avisos.

## 3. Descripciones de la tienda (*Store listings*) — Español e Inglés

Para **cada idioma** (Español (España) y English (United States)), copia desde el fichero de metadatos correspondiente:

| Campo de Partner Center | Sección del fichero |
| --- | --- |
| Description | *Descripción Completa* / *Full Description* (actualizada: edición visual, política ON DELETE, Centro de Ayuda) |
| What's new in this version | *Novedades de la Versión v1.6.0* / *Version v1.6.0 Release Notes* |
| Product features | *Características Clave* / *Product Features* (11 líneas, una por campo) |
| Short title | *Título corto* / *Short Title* |
| Screenshots | Borra las 4 capturas antiguas y sube las 6 nuevas **en el orden de la tabla** de la sección *Capturas*, pegando su pie de foto |
| Search terms | Sin cambios |
| Additional system requirements | Añade la línea *Entrada* / *Input* (ratón/teclado o touchpad; táctil en v1.7.0) |

> Las capturas antiguas mostraban la cabecera y los modales anteriores a la v1.6.0 (cuatro botones informativos y el inspector en tema oscuro): conviene sustituirlas todas para que la ficha coincida con la app.

## 4. Notas para la certificación (*Notes for certification*)

Pega este texto (opcional, pero agiliza la revisión):

```
dbv-eer-studio is a fully offline educational database design tool (EER diagrams -> Relational Model -> SQL DDL).
It does not require an account, does not use the network in the Store build (the self-updater is disabled when packaged)
and stores no personal data. To test: the app opens with a sample diagram; press F1 to open the built-in Help Center,
double-click any element to edit it, and use the "Export SQL" button to generate the DDL script.
```

## 5. Antes de enviar

- [ ] (Recomendado) Pasar el **Windows App Certification Kit** en local sobre `dbv-eer-studio_1.6.0.0_x64.msix` (requiere administrador; se hizo con la v1.5.0 sin incidencias).
- [ ] Instalar el `.msixbundle` en local (doble clic → Instalar) y comprobar: arranque, F1, Ctrl + rueda sobre el diagrama y **Ayuda → Acerca de** mostrando *Versión 1.6.0* sin botón "Buscar actualizaciones" (canal Store).
- [ ] Revisar que las 6 capturas y la imagen destacada están asignadas en **ambos** idiomas.

## 6. Enviar

**Enviar a la Store** (*Submit to the Store*). La certificación suele tardar 24-72 h. Al publicarse:

- Actualizar `dbv-specs-ops/docs/MICROSOFT_STORE.md` (§4 estado y §5) marcando la v1.6.0 como publicada.
- Si Microsoft rechaza el envío, registrar el motivo y la corrección en `MICROSOFT_STORE.md` (como la lección del mosaico ancho en §3).
