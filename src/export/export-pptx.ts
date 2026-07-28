import PptxGenJS from "pptxgenjs";
import { captureAllPages } from "./capture";

export async function exportPptx(fileName: string): Promise<void> {
  const canvases = await captureAllPages();
  const pptx = new PptxGenJS();

  pptx.defineLayout({ name: "A4_PORTRAIT", width: 8.2677165, height: 11.692913 });
  pptx.layout = "A4_PORTRAIT";
  pptx.author = "Cubo Makers S.A.C.";
  pptx.company = "Cubo Makers S.A.C.";
  pptx.subject = "Product Data Sheet";
  pptx.title = fileName;
  pptx.theme = {
    headFontFace: "Libre Franklin",
    bodyFontFace: "Libre Franklin"
  };

  canvases.forEach((canvas) => {
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };
    slide.addImage({
      data: canvas.toDataURL("image/png"),
      x: 0,
      y: 0,
      w: 8.2677165,
      h: 11.692913
    });
  });

  await pptx.writeFile({ fileName: `${fileName}.pptx` });
}
