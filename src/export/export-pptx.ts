import PptxGenJS from "pptxgenjs";

const SLIDE_WIDTH = 8.263889;
const SLIDE_HEIGHT = 11.701389;
const PX_PER_INCH = 96;

const COLORS = {
  ink: "1A1A24",
  yellow: "FFD200",
  grey: "CBCBCB",
  light: "F4F4F4",
  white: "FFFFFF"
} as const;

function px(value: number): number {
  return value / PX_PER_INCH;
}

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`No se encontró el elemento #${id}`);
  return element as T;
}

function elementText(id: string): string {
  return byId<HTMLElement>(id).textContent?.trim() || "-";
}

function computedFontPt(id: string, fallback: number): number {
  const element = byId<HTMLElement>(id);
  const pixels = Number.parseFloat(window.getComputedStyle(element).fontSize);
  return Number.isFinite(pixels) ? Number((pixels * 0.75).toFixed(2)) : fallback;
}

function imageToPngData(image: HTMLImageElement): string {
  if (!image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) {
    throw new Error(`La imagen ${image.alt || image.id} todavía no está lista.`);
  }

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No se pudo preparar la imagen para PowerPoint.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

function containImage(
  x: number,
  y: number,
  w: number,
  h: number,
  image: HTMLImageElement
): { x: number; y: number; w: number; h: number } {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const boxRatio = w / h;

  if (imageRatio >= boxRatio) {
    const fittedHeight = w / imageRatio;
    return { x, y: y + (h - fittedHeight) / 2, w, h: fittedHeight };
  }

  const fittedWidth = h * imageRatio;
  return { x: x + (w - fittedWidth) / 2, y, w: fittedWidth, h };
}

function buildFixedBackground(pageNumber: 1 | 2): string {
  const page = byId<HTMLElement>(pageNumber === 1 ? "page-one" : "page-two");
  const background = page.querySelector<HTMLImageElement>(".page-background");
  if (!background || !background.complete || background.naturalWidth <= 0) {
    throw new Error("No se pudo cargar el fondo de la plantilla.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = 794;
  canvas.height = 1123;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No se pudo preparar el fondo del PowerPoint.");

  context.drawImage(background, 0, 0, canvas.width, canvas.height);

  // El aviso es fijo y se integra al fondo de la primera diapositiva.
  if (pageNumber === 1) {
    const warning = page.querySelector<HTMLImageElement>(".warning-notice");
    if (!warning || !warning.complete || warning.naturalWidth <= 0) {
      throw new Error("No se pudo cargar el aviso de advertencia.");
    }
    context.drawImage(warning, 417.9, 901.32, 321.46, 61.92);
  }

  return canvas.toDataURL("image/png");
}

function addTextBox(
  slide: PptxGenJS.Slide,
  text: string,
  options: PptxGenJS.TextPropsOptions
): void {
  slide.addText(text, {
    fontFace: "Libre Franklin",
    color: COLORS.ink,
    margin: 0,
    fit: "shrink",
    breakLine: false,
    ...options
  });
}

function addFilledCell(
  slide: PptxGenJS.Slide,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  options: Partial<PptxGenJS.TextPropsOptions> = {}
): void {
  addTextBox(slide, text, {
    x,
    y,
    w,
    h,
    fill: { color: fill },
    fontSize: 10,
    valign: "middle",
    margin: [0, 7.2, 0, 7.2],
    ...options
  });
}

function addFooter(pptx: PptxGenJS, slide: PptxGenJS.Slide, pageNumber: 1 | 2): void {
  const footer = pageNumber === 1
    ? { x: 3.1496, y: 10.8429, w: 4.915, h: 0.6469 }
    : { x: 3.0744, y: 10.8955, w: 4.915, h: 0.5843 };

  // Cubre el pie antiguo que forma parte de la imagen de fondo.
  slide.addShape(pptx.ShapeType.rect, {
    x: footer.x,
    y: footer.y,
    w: footer.w,
    h: footer.h,
    fill: { color: COLORS.white },
    line: { color: COLORS.white, transparency: 100 },
    objectName: "Footer background"
  });

  slide.addText([
    { text: "CUBO MAKERS S.A.C", options: { bold: true, breakLine: true } },
    {
      text: pageNumber === 1
        ? "Calle La Florida Mz. Q Lt. 30-B, Sachaca 04013, Arequipa, Perú."
        : "Calle La Florida Mz. Q Lt. 30-B, Sachaca 04013, Arequipa, Perú",
      options: { breakLine: true }
    },
    { text: "info@cubomakers.pe" }
  ], {
    x: footer.x + 0.095,
    y: footer.y + 0.035,
    w: footer.w - 0.19,
    h: footer.h - 0.07,
    fontFace: "Red Hat Display",
    fontSize: 9,
    color: "000000",
    margin: 0,
    valign: "middle",
    breakLine: false,
    fit: "shrink",
    objectName: "Cubo Makers footer"
  });
}

function addPageOne(pptx: PptxGenJS, backgroundData: string): void {
  const slide = pptx.addSlide();
  slide.background = { data: backgroundData };

  const productImage = byId<HTMLImageElement>("page-one-image");
  const productImageBox = { x: 1.6275, y: 1.1762, w: 5.0017, h: 4.6637 };
  slide.addImage({
    data: imageToPngData(productImage),
    ...containImage(productImageBox.x, productImageBox.y, productImageBox.w, productImageBox.h, productImage),
    altText: "Imagen del equipo",
    objectName: "Imagen editable del equipo"
  });

  addTextBox(slide, elementText("pn"), {
    x: 0.7551,
    y: 6.2047,
    w: 6.761,
    h: 0.4023,
    fontSize: computedFontPt("pn", 18),
    bold: true,
    margin: [3.5, 7.1, 3.5, 7.1],
    valign: "middle",
    objectName: "Nombre del equipo"
  });

  addTextBox(slide, elementText("ps"), {
    x: 0.7319,
    y: 6.6087,
    w: 2.9401,
    h: 0.3013,
    fontSize: computedFontPt("ps", 12),
    bold: true,
    margin: [3.5, 7.1, 3.5, 7.1],
    valign: "middle",
    objectName: "Subtítulo del equipo"
  });

  addTextBox(slide, "Product Overview", {
    x: 0.752,
    y: 7.2681,
    w: 1.6169,
    h: 0.298,
    fontSize: 12,
    bold: true,
    margin: [3.5, 7.1, 3.5, 7.1],
    valign: "middle",
    objectName: "Product Overview title"
  });

  addTextBox(slide, elementText("pov"), {
    x: 0.7551,
    y: 7.5768,
    w: 3.0988,
    h: 0.9409,
    fontSize: computedFontPt("pov", 10),
    margin: [3.5, 7.1, 3.5, 7.1],
    valign: "top",
    breakLine: false,
    objectName: "Product Overview text"
  });

  addTextBox(slide, "Features", {
    x: 0.7724,
    y: 8.7799,
    w: 0.9,
    h: 0.298,
    fontSize: 12,
    bold: true,
    margin: [3.5, 7.1, 3.5, 7.1],
    valign: "middle",
    objectName: "Features title"
  });

  const featureText = Array.from(document.querySelectorAll<HTMLElement>("#page-one .features-list li"))
    .map((item) => `• ${item.textContent?.trim() || "-"}`)
    .join("\n");
  addTextBox(slide, featureText, {
    x: 0.7835,
    y: 9.0831,
    w: 3.3488,
    h: 1.2665,
    fontSize: 10,
    margin: [9.5, 7.1, 3.5, 21],
    valign: "top",
    breakLine: false,
    lineSpacing: 15,
    objectName: "Features list"
  });

  // Tabla Product Information, completamente editable.
  const tableX = px(434.46);
  const tableY = px(697.74);
  const tableW = px(289.29);
  const titleH = px(29.44);
  const leftW = px(108.47);
  const rightW = tableW - leftW;
  const rowHeights = [px(30.58), px(30.58), px(29.6), px(30.58)];

  addFilledCell(slide, "Product Information", tableX, tableY, tableW, titleH, COLORS.yellow, {
    fontSize: 12,
    bold: true,
    margin: [0, 9.4, 0, 9.4],
    objectName: "Product Information title"
  });

  const productRows = [
    ["Base Model", elementText("pbm"), COLORS.grey],
    ["Use", "Trade show / Display", COLORS.light],
    ["Scale", elementText("psc"), COLORS.grey],
    ["HS Code", "9023.00.00.00", COLORS.light]
  ] as const;

  let rowY = tableY + titleH;
  productRows.forEach(([label, value, fill], index) => {
    const h = rowHeights[index];
    addFilledCell(slide, label, tableX, rowY, leftW, h, fill, { objectName: `Product Information ${label}` });
    addFilledCell(slide, value, tableX + leftW, rowY, rightW, h, fill, {
      fontSize: label === "Base Model" ? computedFontPt("pbm", 10) : 10,
      objectName: `Product Information value ${label}`
    });
    rowY += h;
  });

  addFooter(pptx, slide, 1);
}

function addPageTwo(pptx: PptxGenJS, backgroundData: string): void {
  const slide = pptx.addSlide();
  slide.background = { data: backgroundData };

  const technicalImage = byId<HTMLImageElement>("page-two-image");
  const technicalImageBox = { x: 1.1322, y: 1.8199, w: 5.9922, h: 2.2177 };
  slide.addImage({
    data: imageToPngData(technicalImage),
    ...containImage(technicalImageBox.x, technicalImageBox.y, technicalImageBox.w, technicalImageBox.h, technicalImage),
    altText: "Plano técnico del equipo",
    objectName: "Imagen editable del plano"
  });

  // Dimensions: títulos, etiquetas y valores quedan editables.
  const dimX = px(79.1);
  const dimY = px(423.34);
  const dimCols = [px(173.56), px(239.51), px(239.5)];
  const dimRows = [px(39), px(32), px(34), px(41), px(33), px(33)];
  const dimW = dimCols.reduce((sum, value) => sum + value, 0);

  addFilledCell(slide, "Dimensions", dimX, dimY, dimW, dimRows[0], COLORS.yellow, {
    fontSize: 12,
    bold: true,
    align: "center",
    margin: 0,
    objectName: "Dimensions title"
  });

  const dimensionValues = [
    ["", "Scale Model", "Packaging", COLORS.grey],
    ["Length (L)", elementText("dsl"), elementText("dpl"), COLORS.light],
    ["Width (W)", elementText("dsw"), elementText("dpw"), COLORS.grey],
    ["Height (H)", elementText("dsh"), elementText("dph"), COLORS.light],
    ["Weight", elementText("dsk"), elementText("dpk"), COLORS.grey]
  ] as const;

  let dimRowY = dimY + dimRows[0];
  dimensionValues.forEach((row, rowIndex) => {
    let cellX = dimX;
    row.slice(0, 3).forEach((value, columnIndex) => {
      addFilledCell(slide, value, cellX, dimRowY, dimCols[columnIndex], dimRows[rowIndex + 1], row[3], {
        align: "center",
        margin: [0, 4, 0, 4],
        fontSize: 10,
        bold: false,
        objectName: `Dimensions row ${rowIndex + 1} column ${columnIndex + 1}`
      });
      cellX += dimCols[columnIndex];
    });
    dimRowY += dimRows[rowIndex + 1];
  });

  // Manufacturing.
  const mfgX = px(79.1);
  const mfgY = px(671.28);
  const mfgCols = [px(101.82), px(215.7)];
  const mfgRows = [px(33), px(26), px(29), px(58), px(28)];
  const mfgW = mfgCols[0] + mfgCols[1];

  addFilledCell(slide, "Manufacturing", mfgX, mfgY, mfgW, mfgRows[0], COLORS.yellow, {
    fontSize: 12,
    bold: true,
    align: "center",
    margin: 0,
    objectName: "Manufacturing title"
  });

  const manufacturingRows = [
    ["Technology", "3D Printing (FDM).", COLORS.grey],
    ["Materials", elementText("pmat"), COLORS.light],
    ["Color", elementText("pcol"), COLORS.grey],
    ["Assembly", elementText("pasm"), COLORS.light]
  ] as const;

  let mfgRowY = mfgY + mfgRows[0];
  manufacturingRows.forEach(([label, value, fill], index) => {
    const h = mfgRows[index + 1];
    addFilledCell(slide, label, mfgX, mfgRowY, mfgCols[0], h, fill, {
      valign: index === 2 ? "top" : "middle",
      margin: index === 2 ? [5.2, 7.2, 0, 7.2] : [0, 7.2, 0, 7.2],
      objectName: `Manufacturing ${label}`
    });
    addFilledCell(slide, value, mfgX + mfgCols[0], mfgRowY, mfgCols[1], h, fill, {
      fontSize: label === "Color" ? computedFontPt("pcol", 10) : label === "Materials" ? computedFontPt("pmat", 10) : label === "Assembly" ? computedFontPt("pasm", 10) : 10,
      valign: index === 2 ? "top" : "middle",
      margin: index === 2 ? [5.2, 7.2, 0, 7.2] : [0, 7.2, 0, 7.2],
      objectName: `Manufacturing value ${label}`
    });
    mfgRowY += h;
  });

  // Storage.
  const storageX = px(414.2);
  const storageY = px(672.27);
  const storageW = px(318.66);
  const storageTitleH = px(34);
  const storageBodyH = px(118);

  addFilledCell(slide, "Storage", storageX, storageY, storageW, storageTitleH, COLORS.yellow, {
    fontSize: 12,
    bold: true,
    align: "center",
    margin: 0,
    objectName: "Storage title"
  });

  const storageText = Array.from(document.querySelectorAll<HTMLElement>("#page-two .storage-body li"))
    .map((item) => `• ${item.textContent?.trim() || "-"}`)
    .join("\n");
  addFilledCell(slide, storageText, storageX, storageY + storageTitleH, storageW, storageBodyH, COLORS.light, {
    fontSize: 10,
    valign: "top",
    margin: [7.5, 9, 4, 25.5],
    lineSpacing: 14,
    objectName: "Storage instructions"
  });

  addFooter(pptx, slide, 2);
}

export async function exportPptx(fileName: string): Promise<void> {
  await document.fonts.ready;

  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "A4_PORTRAIT_EXACT", width: SLIDE_WIDTH, height: SLIDE_HEIGHT });
  pptx.layout = "A4_PORTRAIT_EXACT";
  pptx.author = "GS";
  pptx.company = "Cubo Makers S.A.C.";
  pptx.subject = "Editable Product Data Sheet";
  pptx.title = fileName;
  pptx.theme = {
    headFontFace: "Libre Franklin",
    bodyFontFace: "Libre Franklin"
  };

  addPageOne(pptx, buildFixedBackground(1));
  addPageTwo(pptx, buildFixedBackground(2));

  await pptx.writeFile({ fileName: `${fileName}.pptx` });
}
