# Generador de Fichas Técnicas - Cubo Makers

Aplicación web estática para completar una ficha técnica controlada y descargarla en **PDF** y **PowerPoint**. Funciona completamente en el navegador y puede publicarse gratis mediante GitHub Pages.

## Estado de esta versión

- Formulario lateral conservado.
- Vista previa fija de dos páginas A4.
- Recursos gráficos originales de Cubo Makers.
- Descarga en PDF.
- Descarga en PPTX (cada página queda como una imagen completa para evitar movimientos accidentales).
- Carga de una imagen del equipo para la página 1.
- Carga de una imagen del plano técnico para la página 2.
- Compatibilidad con PNG, JPG/JPEG y WEBP.
- Las imágenes se centran, conservan su proporción y se incluyen en PDF y PPTX.

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


## Corrección v2

Se retiraron las propiedades `lang` incompatibles con los tipos TypeScript de PptxGenJS 4.0.1.


## Corrección v3

- La escala usa `1` como numerador predeterminado.
- Al escribir el denominador, la vista previa, el PDF y el PPT muestran automáticamente `1:N`.


## Versión 1.1.0

- Añade en la primera página el aviso fijo de temperatura y exposición solar, en la misma posición del PDF de plantilla.
- El aviso no forma parte del formulario y no puede editarse.


## Versión 2.1.0

- Añade carga local de la imagen del equipo y del plano técnico.
- Valida los formatos PNG, JPG/JPEG y WEBP.
- Las imágenes no se deforman ni se recortan automáticamente: se escalan proporcionalmente para caber centradas en sus áreas de la plantilla.
- Se recomienda recortar cada archivo hasta el borde del equipo o plano antes de cargarlo.
- Las imágenes cargadas se incorporan automáticamente a las exportaciones PDF y PPTX.
