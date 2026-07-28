# Generador de Fichas Técnicas - Cubo Makers

Aplicación web estática para completar una ficha técnica controlada y descargarla en **PDF** y **PowerPoint**. Funciona completamente en el navegador y puede publicarse gratis mediante GitHub Pages.

## Estado de esta versión

- Formulario lateral conservado.
- Vista previa fija de dos páginas A4.
- Recursos gráficos originales de Cubo Makers.
- Descarga en PDF.
- Descarga en PPTX (cada página queda como una imagen completa para evitar movimientos accidentales).
- Imágenes `IMG_01.png` e `IMG_02.png` fijas temporalmente.
- La carga de imágenes queda pendiente para una siguiente versión.

## Instalación local

1. Copia **todo el contenido** de esta carpeta dentro de la raíz de tu repositorio clonado. El archivo `package.json` debe quedar al lado de `index.html`.
2. Abre esa carpeta en Visual Studio Code.
3. En la terminal ejecuta:

```powershell
npm.cmd install
npm.cmd run dev
```

4. Abre la dirección que muestra Vite, normalmente `http://localhost:5173/`.

## Publicar en GitHub Pages

1. Prueba primero la página localmente.
2. En GitHub Desktop realiza `Commit to main` y luego `Push origin`.
3. En GitHub abre `Settings > Pages`.
4. En **Source**, selecciona **GitHub Actions**.
5. El workflow `.github/workflows/deploy.yml` construirá y publicará automáticamente la carpeta `dist`.

La configuración de Vite utiliza rutas relativas, por lo que no es necesario editar el nombre del repositorio en `vite.config.ts`.

## Comandos

```powershell
npm.cmd run dev      # Desarrollo local
npm.cmd run build    # Verifica y genera dist/
npm.cmd run preview  # Revisa la compilación final
```

## Archivos principales

- `index.html`: formulario y estructura de las dos páginas.
- `src/styles.css`: panel y composición A4.
- `src/main.ts`: actualización del formulario y eventos.
- `src/export/export-pdf.ts`: generación del PDF.
- `src/export/export-pptx.ts`: generación del PowerPoint.
- `public/assets/`: fondo, logotipo e imágenes de ejemplo.
