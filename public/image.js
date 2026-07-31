export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 1600;

export function calculateScaledSize(width, height, maxDimension = MAX_IMAGE_DIMENSION) {
  const safeWidth = Math.max(1, Number(width) || 1);
  const safeHeight = Math.max(1, Number(height) || 1);
  const limit = Math.max(1, Number(maxDimension) || MAX_IMAGE_DIMENSION);
  const scale = Math.min(1, limit / Math.max(safeWidth, safeHeight));
  return {
    width: Math.max(1, Math.round(safeWidth * scale)),
    height: Math.max(1, Math.round(safeHeight * scale)),
  };
}

export function formatBytes(bytes) {
  const value = Math.max(0, Number(bytes) || 0);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function decodeFile(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, cleanup: () => bitmap.close?.() };
    } catch {
      try {
        const bitmap = await createImageBitmap(file);
        return { source: bitmap, width: bitmap.width, height: bitmap.height, cleanup: () => bitmap.close?.() };
      } catch {
      }
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = objectUrl;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('Não foi possível abrir esta imagem.'));
    });
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      cleanup: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

function drawToCanvas(source, width, height, background = null) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { alpha: background === null });
  if (!context) throw new Error('O navegador não conseguiu preparar a imagem.');
  if (background) {
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
  }
  context.drawImage(source, 0, 0, width, height);
  return canvas;
}

export async function compressImageFile(file, options = {}) {
  if (!(file instanceof Blob) || !file.size) throw new Error('Selecione uma imagem válida.');
  if (!String(file.type || '').startsWith('image/')) throw new Error('O arquivo selecionado não é uma imagem.');

  const maxBytes = Math.min(MAX_IMAGE_BYTES, Math.max(128 * 1024, Number(options.maxBytes) || MAX_IMAGE_BYTES));
  const maxDimension = Math.max(640, Number(options.maxDimension) || MAX_IMAGE_DIMENSION);
  const decoded = await decodeFile(file);

  try {
    if (!decoded.width || !decoded.height) throw new Error('A imagem não possui dimensões válidas.');
    let dimensions = calculateScaledSize(decoded.width, decoded.height, maxDimension);
    const qualities = [0.84, 0.76, 0.68, 0.58, 0.48];

    for (let resizeAttempt = 0; resizeAttempt < 4; resizeAttempt += 1) {
      const webpCanvas = drawToCanvas(decoded.source, dimensions.width, dimensions.height);
      for (const quality of qualities) {
        const webp = await canvasToBlob(webpCanvas, 'image/webp', quality);
        if (webp && webp.type === 'image/webp' && webp.size <= maxBytes) {
          return {
            blob: webp,
            width: dimensions.width,
            height: dimensions.height,
            originalBytes: file.size,
            mimeType: webp.type,
          };
        }
      }

      const jpegCanvas = drawToCanvas(decoded.source, dimensions.width, dimensions.height, '#ffffff');
      for (const quality of qualities) {
        const jpeg = await canvasToBlob(jpegCanvas, 'image/jpeg', quality);
        if (jpeg && jpeg.size <= maxBytes) {
          return {
            blob: jpeg,
            width: dimensions.width,
            height: dimensions.height,
            originalBytes: file.size,
            mimeType: 'image/jpeg',
          };
        }
      }

      dimensions = {
        width: Math.max(480, Math.round(dimensions.width * 0.8)),
        height: Math.max(320, Math.round(dimensions.height * 0.8)),
      };
    }

    throw new Error('Não foi possível reduzir a imagem para menos de 2 MB. Escolha outra imagem.');
  } finally {
    decoded.cleanup();
  }
}
