import "./styles.css";
import { exportPdf } from "./export/export-pdf";
import { exportPptx } from "./export/export-pptx";

type ToggleType = "b" | "m";

let batteryValue: boolean | null = null;
let motorValue: boolean | null = null;

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`No se encontró el elemento #${id}`);
  return element as T;
}

function inputValue(id: string): string {
  return byId<HTMLInputElement>(id).value.trim();
}

function getCheckedValues(containerId: string): string[] {
  return Array.from(document.querySelectorAll<HTMLInputElement>(`#${containerId} input[type="checkbox"]:checked`))
    .filter((element) => element.id !== "oc" && element.id !== "oa" && element.id !== "om")
    .map((element) => element.value);
}

const supportedImageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const supportedImageExtensions = new Set(["png", "jpg", "jpeg", "webp"]);

function isSupportedImage(file: File): boolean {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return supportedImageTypes.has(file.type.toLowerCase()) || supportedImageExtensions.has(extension);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("No se pudo leer la imagen seleccionada."));
    }, { once: true });
    reader.addEventListener("error", () => reject(new Error("No se pudo leer la imagen seleccionada.")), { once: true });
    reader.readAsDataURL(file);
  });
}

function waitForImageLoad(image: HTMLImageElement, source: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const handleLoad = (): void => {
      cleanup();
      resolve();
    };
    const handleError = (): void => {
      cleanup();
      reject(new Error("La imagen seleccionada no es válida o está dañada."));
    };
    const cleanup = (): void => {
      image.removeEventListener("load", handleLoad);
      image.removeEventListener("error", handleError);
    };

    image.addEventListener("load", handleLoad, { once: true });
    image.addEventListener("error", handleError, { once: true });
    image.src = source;
  });
}

const IMAGE_SIZE_MIN = 25;
const IMAGE_SIZE_MAX = 100;

type ImageSizeControl = {
  sliderId: string;
  numberId: string;
  imageId: string;
};

function clampImageSize(value: number): number {
  if (!Number.isFinite(value)) return 100;
  return Math.min(IMAGE_SIZE_MAX, Math.max(IMAGE_SIZE_MIN, Math.round(value)));
}

function rangeProgress(value: number): string {
  const progress = ((value - IMAGE_SIZE_MIN) / (IMAGE_SIZE_MAX - IMAGE_SIZE_MIN)) * 100;
  return `${progress}%`;
}

function applyImageSize(control: ImageSizeControl, rawValue: number, syncNumber = true): void {
  const value = clampImageSize(rawValue);
  const slider = byId<HTMLInputElement>(control.sliderId);
  const number = byId<HTMLInputElement>(control.numberId);
  const image = byId<HTMLImageElement>(control.imageId);

  slider.value = String(value);
  slider.style.setProperty("--range-progress", rangeProgress(value));
  if (syncNumber) number.value = String(value);
  image.style.setProperty("--user-image-scale", String(value / 100));
}

function setupImageSizeControl(control: ImageSizeControl): void {
  const slider = byId<HTMLInputElement>(control.sliderId);
  const number = byId<HTMLInputElement>(control.numberId);

  slider.addEventListener("input", () => {
    applyImageSize(control, Number.parseFloat(slider.value));
  });

  number.addEventListener("input", () => {
    const value = Number.parseFloat(number.value);
    if (Number.isFinite(value) && value >= IMAGE_SIZE_MIN && value <= IMAGE_SIZE_MAX) {
      applyImageSize(control, value, false);
    }
  });

  const normalizeNumber = (): void => {
    applyImageSize(control, Number.parseFloat(number.value));
  };
  number.addEventListener("change", normalizeNumber);
  number.addEventListener("blur", normalizeNumber);

  applyImageSize(control, Number.parseFloat(number.value));
}

async function loadUserImage(inputId: string, previewImageId: string, fileNameId: string): Promise<void> {
  const input = byId<HTMLInputElement>(inputId);
  const status = byId<HTMLElement>(fileNameId);
  const file = input.files?.[0];
  if (!file) return;

  status.classList.remove("file-error");

  if (!isSupportedImage(file)) {
    input.value = "";
    status.textContent = "Formato no admitido. Usa PNG, JPG/JPEG o WEBP.";
    status.classList.add("file-error");
    return;
  }

  try {
    status.textContent = "Cargando imagen…";
    const source = await readFileAsDataUrl(file);
    await waitForImageLoad(byId<HTMLImageElement>(previewImageId), source);
    status.textContent = file.name;
  } catch (error) {
    input.value = "";
    status.textContent = error instanceof Error ? error.message : "No se pudo cargar la imagen.";
    status.classList.add("file-error");
  }
}

function toInches(value: string): string | null {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) && number > 0 ? (number / 2.54).toFixed(1) : null;
}

function toPounds(value: string): string | null {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) && number > 0 ? (number * 2.20462).toFixed(1) : null;
}

function formatDimension(value: string): string {
  const inches = toInches(value);
  return inches ? `${Number.parseFloat(value)} cm / ${inches}”` : "-";
}

function formatWeight(value: string): string {
  const pounds = toPounds(value);
  return pounds ? `${Number.parseFloat(value)} kg / ${pounds} lb` : "-";
}

function fitElement(element: HTMLElement): void {
  const maxFont = Number(element.dataset.maxFont ?? 12);
  const minFont = Number(element.dataset.minFont ?? 9);
  let font = maxFont;
  element.style.fontSize = `${font}px`;

  while (font > minFont && (element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1)) {
    font -= 0.25;
    element.style.fontSize = `${font}px`;
  }
}

function fitAllText(): void {
  document.querySelectorAll<HTMLElement>(".fit-text").forEach(fitElement);
}

function syncManufacturingTable(): void {
  const table = byId<HTMLElement>("page-two").querySelector<HTMLElement>(".manufacturing-table");
  if (!table) return;

  const rows = [
    { selector: ".mfg-row-tech", minHeight: 26 },
    { selector: ".mfg-row-materials", minHeight: 29 },
    { selector: ".mfg-row-color", minHeight: 58 },
    { selector: ".mfg-row-assembly", minHeight: 28 }
  ];

  rows.forEach(({ selector, minHeight }) => {
    const row = table.querySelector<HTMLElement>(selector);
    if (!row) return;
    row.classList.remove("is-expanded");
    row.style.height = "auto";
    const measuredHeight = Math.ceil(row.getBoundingClientRect().height);
    const finalHeight = Math.max(minHeight, measuredHeight);
    row.style.height = `${finalHeight}px`;
    row.classList.toggle("is-expanded", finalHeight > minHeight + 1);
  });
}

function updatePreview(): void {
  const productName = inputValue("fn");
  const scaleB = inputValue("fsb");
  // La escala de estas fichas siempre parte de 1. Aunque el usuario deje
  // vacío el primer campo, al ingresar el denominador se muestra 1:N.
  const scaleA = inputValue("fsa") || (scaleB ? "1" : "");

  byId("pn").textContent = productName || "Nombre del equipo";
  byId("ps").textContent = motorValue === true ? "Powered 3D Printed Scale Model" : "Stationary 3D Printed Scale Model";
  byId("pbm").textContent = productName || "-";
  byId("psc").textContent = scaleB ? `${scaleA}:${scaleB}` : "-";

  byId("pov").textContent = productName
    ? `This 3D-printed scale model of ${productName} is designed for display, showcasing industrial equipment in a compact, detailed format. Made with FDM technology, it uses eco-friendly PLA filaments in various colors.`
    : "This 3D-printed scale model is designed for display, showcasing industrial equipment in a compact, detailed format. Made with FDM technology, it uses eco-friendly PLA filaments in various colors.";

  byId("fb").textContent = batteryValue === true ? "Batteries required." : batteryValue === false ? "No batteries needed." : "-";
  byId("fm").textContent = motorValue === true ? "Motors included." : motorValue === false ? "No motors included." : "-";

  const groups = [
    { fields: ["sl", "sw", "sh", "sk"], conversions: ["sl-i", "sw-i", "sh-i", "sk-l"], preview: ["dsl", "dsw", "dsh", "dsk"] },
    { fields: ["pl", "pw", "pxh", "pk"], conversions: ["pl-i", "pw-i", "ph-i", "pk-l"], preview: ["dpl", "dpw", "dph", "dpk"] }
  ];

  groups.forEach((group) => {
    const values = group.fields.map(inputValue);
    group.conversions.forEach((id, index) => {
      const result = index < 3 ? toInches(values[index]) : toPounds(values[index]);
      byId(id).textContent = result ? `${result}${index < 3 ? '"' : " lb"}` : index < 3 ? '-"' : "- lb";
    });
    group.preview.forEach((id, index) => {
      byId(id).textContent = index < 3 ? formatDimension(values[index]) : formatWeight(values[index]);
    });
  });

  const materials = getCheckedValues("mat");
  const otherMaterial = inputValue("omi");
  if (byId<HTMLInputElement>("om").checked && otherMaterial) materials.push(otherMaterial);
  byId("pmat").textContent = materials.length ? `${materials.join(", ")}.` : "-";

  const colors = getCheckedValues("col");
  const otherColor = inputValue("oi");
  if (byId<HTMLInputElement>("oc").checked && otherColor) colors.push(otherColor);
  byId("pcol").textContent = colors.length ? `${colors.join(", ")}.` : "-";

  const assembly = getCheckedValues("asm");
  const otherAssembly = inputValue("oai");
  if (byId<HTMLInputElement>("oa").checked && otherAssembly) assembly.push(otherAssembly);
  byId("pasm").textContent = assembly.length ? `${assembly.join(", ")}.` : "-";

  requestAnimationFrame(() => {
    fitAllText();
    syncManufacturingTable();
  });
}

function toggle(type: ToggleType, value: boolean): void {
  if (type === "b") {
    batteryValue = value;
    byId("by").className = `tb${value ? " ay" : ""}`;
    byId("bn").className = `tb${!value ? " an" : ""}`;
  } else {
    motorValue = value;
    byId("my").className = `tb${value ? " ay" : ""}`;
    byId("mn").className = `tb${!value ? " an" : ""}`;
  }
  updatePreview();
}

function toggleOtherColor(): void {
  const checkbox = byId<HTMLInputElement>("oc");
  const input = byId<HTMLInputElement>("oi");
  input.style.display = checkbox.checked ? "block" : "none";
  if (!checkbox.checked) input.value = "";
}

function toggleOtherMaterial(): void {
  const checkbox = byId<HTMLInputElement>("om");
  const input = byId<HTMLInputElement>("omi");
  input.style.display = checkbox.checked ? "block" : "none";
  if (!checkbox.checked) input.value = "";
}

function toggleOtherAssembly(): void {
  const checkbox = byId<HTMLInputElement>("oa");
  const input = byId<HTMLInputElement>("oai");
  input.style.display = checkbox.checked ? "block" : "none";
  if (!checkbox.checked) input.value = "";
}

function safeFileName(): string {
  const name = inputValue("fn") || "PRODUCT_DATA_SHEET";
  const normalizedName = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase()
    .slice(0, 81) || "PRODUCT_DATA_SHEET";

  return `PR000000_${normalizedName}`;
}

function setExportState(message: string, busy: boolean): void {
  byId("export-status").textContent = message;
  document.querySelectorAll<HTMLButtonElement>(".export-button").forEach((button) => {
    button.disabled = busy;
  });
}

async function runExport(kind: "pdf" | "pptx"): Promise<void> {
  setExportState(`Generando ${kind === "pdf" ? "PDF" : "PowerPoint"}...`, true);
  try {
    updatePreview();
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const fileName = safeFileName();
    if (kind === "pdf") await exportPdf(fileName);
    else await exportPptx(fileName);
    setExportState("Archivo generado correctamente.", false);
  } catch (error) {
    console.error(error);
    setExportState(error instanceof Error ? error.message : "No se pudo generar el archivo.", false);
  }
}

function updatePreviewScale(): void {
  const preview = byId<HTMLElement>("preview");
  const available = Math.max(280, preview.clientWidth - 32);
  const scale = Math.min(0.86, available / 794);
  document.querySelectorAll<HTMLElement>(".page-shell").forEach((shell) => {
    shell.style.width = `${794 * scale}px`;
    shell.style.height = `${1123 * scale}px`;
    const scaler = shell.querySelector<HTMLElement>(".page-scale");
    if (scaler) scaler.style.transform = `scale(${scale})`;
  });
}

// Compatibilidad con los atributos inline del formulario original.
declare global {
  interface Window {
    u: () => void;
    tog: (type: ToggleType, value: boolean) => void;
    tO: () => void;
    tM: () => void;
    tA: () => void;
  }
}
window.u = updatePreview;
window.tog = toggle;
window.tO = () => {
  toggleOtherColor();
  updatePreview();
};
window.tM = () => {
  toggleOtherMaterial();
  updatePreview();
};
window.tA = () => {
  toggleOtherAssembly();
  updatePreview();
};

setupImageSizeControl({
  sliderId: "image-page-one-size",
  numberId: "image-page-one-size-number",
  imageId: "page-one-image"
});
setupImageSizeControl({
  sliderId: "image-page-two-size",
  numberId: "image-page-two-size-number",
  imageId: "page-two-image"
});

byId<HTMLInputElement>("image-page-one").addEventListener("change", () => {
  void loadUserImage("image-page-one", "page-one-image", "image-page-one-name");
});
byId<HTMLInputElement>("image-page-two").addEventListener("change", () => {
  void loadUserImage("image-page-two", "page-two-image", "image-page-two-name");
});
byId("download-pdf").addEventListener("click", () => void runExport("pdf"));
byId("download-pptx").addEventListener("click", () => void runExport("pptx"));
window.addEventListener("resize", updatePreviewScale);
window.addEventListener("load", () => {
  updatePreview();
  updatePreviewScale();
});

updatePreview();
updatePreviewScale();
