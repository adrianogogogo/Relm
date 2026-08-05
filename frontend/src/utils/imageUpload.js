// Converte um arquivo de imagem escolhido pelo usuário em um data URI base64
// pronto para salvar no banco (campo logoUrl). Raster (PNG/JPG/WebP) é
// redimensionado e comprimido via canvas para não estourar o banco nem o
// limite de body da API. SVG é lido direto (vetor, já é pequeno).
//
// Uso:
//   const dataUrl = await fileToLogoDataUrl(file);
//   setLogoUrl(dataUrl);

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const MAX_INPUT_BYTES = 5 * 1024 * 1024; // 5MB de arquivo bruto
const MAX_DIMENSION = 400; // logo é exibido em ~64px; 400px cobre telas retina

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

export async function fileToLogoDataUrl(file) {
  if (!file) throw new Error('Nenhum arquivo selecionado.');
  if (!ACCEPTED.includes(file.type)) {
    throw new Error('Formato inválido. Use PNG, JPG, WebP ou SVG.');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('Imagem muito grande (máx. 5MB).');
  }

  // SVG: mantém o vetor, sem rasterizar.
  if (file.type === 'image/svg+xml') {
    return readAsDataUrl(file);
  }

  const dataUrl = await readAsDataUrl(file);
  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Não foi possível carregar a imagem.'));
    el.src = dataUrl;
  });

  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);

  // PNG preserva transparência (logos); JPG/WebP comprime como JPEG.
  const isPng = file.type === 'image/png';
  return canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.85);
}
