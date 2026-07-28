import html2canvas from "html2canvas";

const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;

async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(images.map((image) => {
    if (image.complete && image.naturalWidth > 0) return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => reject(new Error(`No se pudo cargar ${image.src}`)), { once: true });
    });
  }));
}

export async function capturePage(page: HTMLElement): Promise<HTMLCanvasElement> {
  await document.fonts.ready;
  await waitForImages(page);

  const scaleContainer = page.parentElement;
  if (!scaleContainer) throw new Error("No se encontró el contenedor de escala.");

  const oldTransform = scaleContainer.style.transform;
  const oldWidth = scaleContainer.style.width;
  const oldHeight = scaleContainer.style.height;

  scaleContainer.style.transform = "none";
  scaleContainer.style.width = `${PAGE_WIDTH}px`;
  scaleContainer.style.height = `${PAGE_HEIGHT}px`;
  page.classList.add("export-capture");

  try {
    return await html2canvas(page, {
      backgroundColor: "#ffffff",
      scale: 3,
      useCORS: true,
      allowTaint: false,
      logging: false,
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      windowWidth: PAGE_WIDTH,
      windowHeight: PAGE_HEIGHT,
      scrollX: 0,
      scrollY: 0,
      imageTimeout: 15000
    });
  } finally {
    page.classList.remove("export-capture");
    scaleContainer.style.transform = oldTransform;
    scaleContainer.style.width = oldWidth;
    scaleContainer.style.height = oldHeight;
  }
}

export async function captureAllPages(): Promise<HTMLCanvasElement[]> {
  const pages = Array.from(document.querySelectorAll<HTMLElement>(".a4-page"));
  if (pages.length !== 2) throw new Error("La ficha debe contener exactamente dos páginas.");
  const output: HTMLCanvasElement[] = [];
  for (const page of pages) output.push(await capturePage(page));
  return output;
}
