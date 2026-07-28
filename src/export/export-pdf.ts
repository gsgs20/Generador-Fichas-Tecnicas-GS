import { jsPDF } from "jspdf";
import { captureAllPages } from "./capture";

export async function exportPdf(fileName: string): Promise<void> {
  const canvases = await captureAllPages();
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });

  canvases.forEach((canvas, index) => {
    if (index > 0) pdf.addPage("a4", "portrait");
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297, undefined, "FAST");
  });

  pdf.save(`${fileName}.pdf`);
}
