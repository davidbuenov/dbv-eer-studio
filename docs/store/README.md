# 🏬 Kit de Publicación en Marketplace — dbv-eer-studio

Este directorio contiene todos los metadatos, textos promocionales, política de privacidad y capturas de pantalla de alta resolución requeridas para publicar `dbv-eer-studio` en los catálogos de **Microsoft Store** y **Uptodown**.

---

## 📂 Estructura de Documentos

| Fichero / Recurso | Descripción |
| --- | --- |
| [`MICROSOFT_STORE_METADATA_ES.md`](file:///d:/Programacion/github-davidbuenov/eer-studio/docs/store/MICROSOFT_STORE_METADATA_ES.md) | Título, descripción corta/larga, características y keywords para Microsoft Store (Español). |
| [`MICROSOFT_STORE_METADATA_EN.md`](file:///d:/Programacion/github-davidbuenov/eer-studio/docs/store/MICROSOFT_STORE_METADATA_EN.md) | Listing title, short/full description, features and keywords for Microsoft Store (English). |
| [`UPTODOWN_METADATA_ES.md`](file:///d:/Programacion/github-davidbuenov/eer-studio/docs/store/UPTODOWN_METADATA_ES.md) | Eslogan, descripción detallada, tags y novedades para Uptodown (Español). |
| [`UPTODOWN_METADATA_EN.md`](file:///d:/Programacion/github-davidbuenov/eer-studio/docs/store/UPTODOWN_METADATA_EN.md) | Tagline, detailed description, tags and release notes for Uptodown (English). |
| [`SUBMISSION_GUIDE_v1.6.0.md`](SUBMISSION_GUIDE_v1.6.0.md) | Guía paso a paso para enviar la actualización v1.6.0 en Partner Center. |
| [`PRIVACY_POLICY.md`](file:///d:/Programacion/github-davidbuenov/eer-studio/docs/store/PRIVACY_POLICY.md) | Política de Privacidad bilingüe (ES/EN) 100% offline y privada requerida para certificación. |

---

## 🖼️ Capturas de Pantalla y Banners Promocionales

Ubicados en [`docs/store/screenshots/`](file:///d:/Programacion/github-davidbuenov/eer-studio/docs/store/screenshots/):

Se regeneran en cada entrega con `node scripts/capture-store-screenshots.mjs` (requiere `npm run build` y `npx vite preview --port 4173`). El orden de subida y los pies de foto están en `MICROSOFT_STORE_METADATA_ES.md` / `_EN.md`.

### Capturas 1920x1080 (sufijo `_es` / `_en`):
- `screenshot_01_eer_diagram`: Editor EER con elementos seleccionados y sus líneas resaltadas en el código.
- `screenshot_05_edit_element`: Edición visual de una relación con doble clic.
- `screenshot_02_relational_model`: Modelo Relacional con tarjetas de tabla y trazado FK.
- `screenshot_04_step_inspector`: Guía de 9 Pasos abierta desde una tabla (Centro de Ayuda).
- `screenshot_03_sql_ddl_export`: Exportación y vista previa del script Oracle SQL DDL.
- `screenshot_06_help_center`: Centro de Ayuda — uso del editor, gestos y atajos.

### Banner Promocional / Featured Artwork (1360x768 16:9):
- `featured_banner_1360x768_es.png`: Banner promocional en **Español** para Microsoft Store.
- `featured_banner_1360x768_en.png`: Banner promocional en **Inglés** para Microsoft Store.

### Banner Promocional Uptodown (1024x500 PNG):
- `uptodown_featured_1024x500_es.png`: Featured Image en **Español** (1024x500 PNG) para la cabecera de la ficha en Uptodown.
- `uptodown_featured_1024x500_en.png`: Featured Image en **Inglés** (1024x500 PNG) para la cabecera de la ficha en Uptodown.
