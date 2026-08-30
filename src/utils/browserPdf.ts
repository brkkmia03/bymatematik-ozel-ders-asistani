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

const normalizeText = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();

const canvasToJpegBytes = async (canvas: HTMLCanvasElement): Promise<Uint8Array> => {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  if (blob) return new Uint8Array(await blob.arrayBuffer());

  // Eski Safari sürümleri için güvenli geri dönüş.
  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  const base64 = dataUrl.split(',')[1] || '';
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
};

/**
 * Raporu SVG/foreignObject kullanmadan doğrudan sayfa sayfa canvas'a çizer.
 * Bu yaklaşım iOS Safari / ana ekrana eklenen PWA'da foreignObject kaynaklı
 * "PDF oluşturulamadı" hatasını önler ve uzun raporlarda dev canvas üretmez.
 */
const renderDocumentToPdfPages = async (doc: Document): Promise<PdfImagePage[]> => {
  if (doc.fonts?.ready) await doc.fonts.ready.catch(() => undefined);

  const PAGE_W = 1240;
  const PAGE_H = 1754;
  const MARGIN_X = 72;
  const TOP = 68;
  const CONTENT_BOTTOM = 1620;
  const FOOTER_Y = 1682;
  const contentWidth = PAGE_W - (MARGIN_X * 2);

  const canvases: HTMLCanvasElement[] = [];
  let canvas!: HTMLCanvasElement;
  let ctx!: CanvasRenderingContext2D;
  let y = TOP;

  const startPage = () => {
    canvas = document.createElement('canvas');
    canvas.width = PAGE_W;
    canvas.height = PAGE_H;
    const nextCtx = canvas.getContext('2d');
    if (!nextCtx) throw new Error('PDF çizim alanı oluşturulamadı.');
    ctx = nextCtx;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);
    ctx.textBaseline = 'top';
    canvases.push(canvas);
    y = TOP;
  };

  startPage();

  const setFont = (size: number, weight: 400 | 600 | 700 | 800 = 400) => {
    ctx.font = `${weight} ${size}px Arial, Helvetica, sans-serif`;
  };

  const wrapText = (text: string, maxWidth: number) => {
    const words = normalizeText(text).split(' ').filter(Boolean);
    if (!words.length) return [''];
    const lines: string[] = [];
    let line = words[0];
    for (let i = 1; i < words.length; i += 1) {
      const test = `${line} ${words[i]}`;
      if (ctx.measureText(test).width <= maxWidth) line = test;
      else {
        lines.push(line);
        line = words[i];
      }
    }
    lines.push(line);
    return lines;
  };

  const ensureSpace = (height: number) => {
    if (y + height <= CONTENT_BOTTOM) return;
    startPage();
  };

  const drawWrapped = (
    text: string,
    x: number,
    maxWidth: number,
    options: { size?: number; weight?: 400 | 600 | 700 | 800; color?: string; lineHeight?: number; maxLines?: number } = {},
  ) => {
    const size = options.size ?? 19;
    const weight = options.weight ?? 400;
    const color = options.color ?? '#172033';
    const lineHeight = options.lineHeight ?? Math.round(size * 1.35);
    setFont(size, weight);
    const lines = wrapText(text, maxWidth);
    const visibleLines = options.maxLines ? lines.slice(0, options.maxLines) : lines;
    visibleLines.forEach((line) => {
      ctx.fillStyle = color;
      ctx.fillText(line, x, y);
      y += lineHeight;
    });
    return visibleLines.length * lineHeight;
  };

  const drawRule = (color = '#e2e8f0', thickness = 2) => {
    ctx.fillStyle = color;
    ctx.fillRect(MARGIN_X, y, contentWidth, thickness);
    y += thickness;
  };

  const drawHeader = () => {
    const header = doc.querySelector('.header');
    if (!header) return;
    const brand = normalizeText(header.querySelector('.brand')?.textContent) || 'bymatematik';
    const subtitle = normalizeText(header.querySelector('.subtitle')?.textContent);
    const reportTitleEl = header.querySelector('.report-title');
    const reportTitle = normalizeText(reportTitleEl?.childNodes?.[0]?.textContent || reportTitleEl?.textContent);
    const muted = Array.from(header.querySelectorAll('.report-title .muted')).map((el) => normalizeText(el.textContent)).filter(Boolean);
    const teacherLine = Array.from(header.querySelectorAll('div')).map((el) => normalizeText(el.textContent)).find((t) => t.startsWith('Öğretmen:')) || '';

    setFont(38, 800);
    ctx.fillStyle = '#312e81';
    ctx.fillText(brand, MARGIN_X, y);
    y += 46;
    if (subtitle) {
      drawWrapped(subtitle, MARGIN_X, contentWidth, { size: 17, color: '#64748b', lineHeight: 24 });
    }
    if (teacherLine) {
      y += 2;
      drawWrapped(teacherLine, MARGIN_X, contentWidth, { size: 18, weight: 600, lineHeight: 25 });
    }
    y += 14;
    drawRule('#4f46e5', 4);
    y += 16;
    if (reportTitle) drawWrapped(reportTitle, MARGIN_X, contentWidth, { size: 27, weight: 800, lineHeight: 34 });
    muted.forEach((line) => drawWrapped(line, MARGIN_X, contentWidth, { size: 16, color: '#64748b', lineHeight: 22 }));
    y += 18;
  };

  const drawMetrics = (element: Element) => {
    const metrics = Array.from(element.querySelectorAll(':scope > .metric'));
    if (!metrics.length) return;
    const gap = 16;
    const columns = metrics.length >= 4 ? 4 : Math.min(metrics.length, 3);
    const cardW = (contentWidth - gap * (columns - 1)) / columns;
    const cardH = 116;
    const rows = Math.ceil(metrics.length / columns);
    ensureSpace(rows * (cardH + gap) + 8);

    metrics.forEach((metric, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = MARGIN_X + col * (cardW + gap);
      const cardY = y + row * (cardH + gap);
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.fillRect(x, cardY, cardW, cardH);
      ctx.strokeRect(x, cardY, cardW, cardH);
      const label = normalizeText(metric.querySelector('span')?.textContent);
      const value = normalizeText(metric.querySelector('strong')?.textContent);
      const small = normalizeText(metric.querySelector('small')?.textContent);
      setFont(14, 700); ctx.fillStyle = '#64748b'; ctx.fillText(label, x + 14, cardY + 15);
      setFont(24, 800); ctx.fillStyle = '#172033'; ctx.fillText(value, x + 14, cardY + 43);
      if (small) { setFont(13, 400); ctx.fillStyle = '#64748b'; ctx.fillText(small, x + 14, cardY + 82); }
    });
    y += rows * (cardH + gap) + 8;
  };

  const drawTable = (table: HTMLTableElement) => {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (!rows.length) return;
    const colCount = Math.max(...rows.map((row) => row.children.length), 1);
    const colW = contentWidth / colCount;
    const pad = 7;
    const headerBg = '#f1f5f9';

    rows.forEach((row, rowIndex) => {
      const cells = Array.from(row.children) as HTMLElement[];
      setFont(14, rowIndex === 0 ? 700 : 400);
      const wrapped = cells.map((cell) => wrapText(normalizeText(cell.textContent) || '-', Math.max(35, colW - pad * 2)).slice(0, 5));
      const maxLines = Math.max(...wrapped.map((lines) => lines.length), 1);
      const lineHeight = 19;
      const rowH = Math.max(34, maxLines * lineHeight + pad * 2);
      ensureSpace(rowH + 2);

      const rowY = y;
      if (rowIndex === 0) {
        ctx.fillStyle = headerBg;
        ctx.fillRect(MARGIN_X, rowY, contentWidth, rowH);
      }
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.strokeRect(MARGIN_X, rowY, contentWidth, rowH);

      cells.forEach((cell, cellIndex) => {
        const x = MARGIN_X + cellIndex * colW;
        if (cellIndex > 0) {
          ctx.beginPath();
          ctx.moveTo(x, rowY);
          ctx.lineTo(x, rowY + rowH);
          ctx.stroke();
        }
        setFont(14, rowIndex === 0 || cell.querySelector('strong') ? 700 : 400);
        ctx.fillStyle = '#172033';
        wrapped[cellIndex].forEach((line, lineIndex) => {
          ctx.fillText(line, x + pad, rowY + pad + lineIndex * lineHeight);
        });
      });
      y += rowH;
    });
    y += 12;
  };

  const drawElement = (element: Element) => {
    const tag = element.tagName.toUpperCase();

    if (element.classList.contains('metrics')) {
      drawMetrics(element);
      return;
    }
    if (element.classList.contains('confidential')) {
      const text = normalizeText(element.textContent);
      setFont(17, 700);
      const lines = wrapText(text, contentWidth - 30);
      const boxH = lines.length * 24 + 28;
      ensureSpace(boxH + 12);
      ctx.fillStyle = '#fffbeb';
      ctx.fillRect(MARGIN_X, y, contentWidth, boxH);
      ctx.strokeStyle = '#f59e0b';
      ctx.strokeRect(MARGIN_X, y, contentWidth, boxH);
      const textY = y + 14;
      ctx.fillStyle = '#92400e';
      lines.forEach((line, index) => ctx.fillText(line, MARGIN_X + 15, textY + index * 24));
      y += boxH + 14;
      return;
    }
    if (tag === 'H2') {
      ensureSpace(62);
      y += 10;
      drawWrapped(normalizeText(element.textContent), MARGIN_X, contentWidth, { size: 19, weight: 800, lineHeight: 26 });
      y += 5;
      drawRule('#cbd5e1', 2);
      y += 10;
      return;
    }
    if (tag === 'TABLE') {
      drawTable(element as HTMLTableElement);
      return;
    }
    if (tag === 'P') {
      const text = normalizeText(element.textContent);
      if (!text) return;
      setFont(18, element.querySelector('strong') ? 600 : 400);
      const estimatedLines = Math.max(1, wrapText(text, contentWidth).length);
      ensureSpace(estimatedLines * 26 + 12);
      drawWrapped(text, MARGIN_X, contentWidth, { size: 18, weight: element.querySelector('strong') ? 600 : 400, lineHeight: 26 });
      y += 10;
      return;
    }
    if (tag === 'UL' || tag === 'OL') {
      Array.from(element.children).forEach((li, index) => {
        const prefix = tag === 'OL' ? `${index + 1}. ` : '• ';
        const text = `${prefix}${normalizeText(li.textContent)}`;
        setFont(18, 400);
        const lines = wrapText(text, contentWidth - 18);
        ensureSpace(lines.length * 25 + 5);
        drawWrapped(text, MARGIN_X + 10, contentWidth - 10, { size: 18, lineHeight: 25 });
        y += 3;
      });
      y += 8;
      return;
    }
    if (element.classList.contains('empty')) {
      ensureSpace(55);
      drawWrapped(normalizeText(element.textContent), MARGIN_X, contentWidth, { size: 17, color: '#94a3b8', lineHeight: 24 });
      y += 12;
      return;
    }

    Array.from(element.children).forEach((child) => drawElement(child));
  };

  drawHeader();
  const pageRoot = doc.querySelector('.page') || doc.body;
  Array.from(pageRoot.children).forEach((child) => {
    if (child.classList.contains('header') || child.classList.contains('footer')) return;
    drawElement(child);
  });

  const footer = doc.querySelector('.footer');
  const footerParts = footer ? Array.from(footer.children).map((el) => normalizeText(el.textContent)).filter(Boolean) : ['bymatematik • Özel Ders Asistanı', 'Instagram: @bymatematiik'];
  canvases.forEach((pageCanvas, index) => {
    const pageCtx = pageCanvas.getContext('2d');
    if (!pageCtx) return;
    pageCtx.fillStyle = '#e2e8f0';
    pageCtx.fillRect(MARGIN_X, FOOTER_Y - 18, contentWidth, 2);
    pageCtx.font = '600 14px Arial, Helvetica, sans-serif';
    pageCtx.fillStyle = '#64748b';
    pageCtx.textBaseline = 'top';
    pageCtx.fillText(footerParts[0] || 'bymatematik • Özel Ders Asistanı', MARGIN_X, FOOTER_Y);
    const right = `${footerParts[1] || 'Instagram: @bymatematiik'}  •  ${index + 1}/${canvases.length}`;
    const rightWidth = pageCtx.measureText(right).width;
    pageCtx.fillText(right, PAGE_W - MARGIN_X - rightWidth, FOOTER_Y);
  });

  const pages: PdfImagePage[] = [];
  for (const pageCanvas of canvases) {
    pages.push({
      bytes: await canvasToJpegBytes(pageCanvas),
      width: pageCanvas.width,
      height: pageCanvas.height,
    });
    // Uzun öğrenci dosyalarında iOS bellek baskısını azalt.
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
  }
  return pages;
};

export async function openIframeAsPdf(iframe: HTMLIFrameElement, fileName = 'bymatematik-rapor.pdf') {
  // iOS/PWA popup engelleyicisinin asenkron işlem sonrası pencereyi engellememesi için
  // kullanıcı tıklaması sırasında pencereyi hemen açıyoruz.
  const previewWindow = window.open('', '_blank');
  if (previewWindow) {
    previewWindow.document.write('<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>PDF hazırlanıyor</title></head><body style="font-family:Arial,sans-serif;padding:24px;color:#334155">PDF hazırlanıyor…</body></html>');
    previewWindow.document.close();
  }

  try {
    const doc = iframe.contentDocument;
    if (!doc) throw new Error('Rapor önizlemesine erişilemedi.');

    const pages = await renderDocumentToPdfPages(doc);
    if (!pages.length) throw new Error('PDF için rapor içeriği bulunamadı.');

    const pdfBytes = buildImagePdf(pages);
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(pdfBlob);

    if (previewWindow && !previewWindow.closed) {
      previewWindow.location.href = url;
    } else {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      anchor.rel = 'noopener';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    }

    window.setTimeout(() => URL.revokeObjectURL(url), 180000);
  } catch (error) {
    previewWindow?.close();
    throw error;
  }
}
