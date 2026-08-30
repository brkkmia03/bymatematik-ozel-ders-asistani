const textEncoder = new TextEncoder();

const stringBytes = (value: string) => textEncoder.encode(value);

const concatBytes = (parts: Uint8Array[]) => {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
};

const dataUrlToBytes = (dataUrl: string) => {
  const base64 = dataUrl.split(',')[1] || '';
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
};

interface PdfImagePage {
  bytes: Uint8Array;
  width: number;
  height: number;
}

const buildImagePdf = (pages: PdfImagePage[]) => {
  const objectParts: Uint8Array[][] = [];
  const pageObjectIds: number[] = [];
  const imageObjectIds: number[] = [];
  const contentObjectIds: number[] = [];

  let nextObjectId = 3;
  pages.forEach(() => {
    pageObjectIds.push(nextObjectId++);
    imageObjectIds.push(nextObjectId++);
    contentObjectIds.push(nextObjectId++);
  });

  objectParts[1] = [stringBytes('<< /Type /Catalog /Pages 2 0 R >>')];
  objectParts[2] = [stringBytes(`<< /Type /Pages /Count ${pages.length} /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] >>`)];

  pages.forEach((page, index) => {
    const pageId = pageObjectIds[index];
    const imageId = imageObjectIds[index];
    const contentId = contentObjectIds[index];
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const drawCommand = `q\n${pageWidth.toFixed(2)} 0 0 ${pageHeight.toFixed(2)} 0 0 cm\n/Im${index + 1} Do\nQ\n`;

    objectParts[pageId] = [stringBytes(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im${index + 1} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`)];
    objectParts[imageId] = [
      stringBytes(`<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.bytes.length} >>\nstream\n`),
      page.bytes,
      stringBytes('\nendstream'),
    ];
    objectParts[contentId] = [stringBytes(`<< /Length ${stringBytes(drawCommand).length} >>\nstream\n${drawCommand}endstream`)];
  });

  const header = stringBytes('%PDF-1.4\n%âãÏÓ\n');
  const output: Uint8Array[] = [header];
  const offsets: number[] = [0];
  let byteOffset = header.length;
  const maxObjectId = nextObjectId - 1;

  for (let id = 1; id <= maxObjectId; id += 1) {
    offsets[id] = byteOffset;
    const prefix = stringBytes(`${id} 0 obj\n`);
    const suffix = stringBytes('\nendobj\n');
    const chunks = [prefix, ...(objectParts[id] || [stringBytes('<<>>')]), suffix];
    output.push(...chunks);
    byteOffset += chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  }

  const xrefOffset = byteOffset;
  let xref = `xref\n0 ${maxObjectId + 1}\n0000000000 65535 f \n`;
  for (let id = 1; id <= maxObjectId; id += 1) {
    xref += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${maxObjectId + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  output.push(stringBytes(xref));
  return concatBytes(output);
};

const renderDocumentToCanvas = async (doc: Document) => {
  if (doc.fonts?.ready) await doc.fonts.ready.catch(() => undefined);
  const root = doc.documentElement;
  const body = doc.body;
  const width = Math.max(794, root.scrollWidth, body.scrollWidth);
  const height = Math.max(1123, root.scrollHeight, body.scrollHeight);
  const clone = root.cloneNode(true) as HTMLElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  const serialized = new XMLSerializer().serializeToString(clone);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><foreignObject width="100%" height="100%">${serialized}</foreignObject></svg>`;
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Rapor görüntüsü PDF için hazırlanamadı.'));
      image.src = objectUrl;
    });

    const scale = Math.min(1.5, 1800 / width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('PDF çizim alanı oluşturulamadı.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.scale(scale, scale);
    context.drawImage(image, 0, 0, width, height);
    return canvas;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

export async function openIframeAsPdf(iframe: HTMLIFrameElement, fileName = 'bymatematik-rapor.pdf') {
  const previewWindow = window.open('', '_blank');
  if (previewWindow) {
    previewWindow.document.write('<!doctype html><title>PDF hazırlanıyor</title><body style="font-family:Arial,sans-serif;padding:24px">PDF hazırlanıyor…</body>');
    previewWindow.document.close();
  }

  try {
    const doc = iframe.contentDocument;
    if (!doc) throw new Error('Rapor önizlemesine erişilemedi.');
    const fullCanvas = await renderDocumentToCanvas(doc);
    const pageRatio = 841.89 / 595.28;
    const pageHeightPx = Math.round(fullCanvas.width * pageRatio);
    const pages: PdfImagePage[] = [];

    for (let y = 0; y < fullCanvas.height; y += pageHeightPx) {
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = fullCanvas.width;
      pageCanvas.height = pageHeightPx;
      const ctx = pageCanvas.getContext('2d');
      if (!ctx) throw new Error('PDF sayfası oluşturulamadı.');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      const sourceHeight = Math.min(pageHeightPx, fullCanvas.height - y);
      ctx.drawImage(fullCanvas, 0, y, fullCanvas.width, sourceHeight, 0, 0, fullCanvas.width, sourceHeight);
      pages.push({ bytes: dataUrlToBytes(pageCanvas.toDataURL('image/jpeg', 0.92)), width: pageCanvas.width, height: pageCanvas.height });
    }

    const pdfBytes = buildImagePdf(pages);
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(pdfBlob);
    if (previewWindow) {
      previewWindow.location.replace(url);
    } else {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.target = '_blank';
      anchor.rel = 'noopener';
      anchor.download = fileName;
      anchor.click();
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 120000);
  } catch (error) {
    previewWindow?.close();
    throw error;
  }
}
