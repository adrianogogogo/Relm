// Registry compartilhado de segmentação de banners (público + página).
// Usado pela BannersPage (admin) para montar os seletores e pelos layouts
// para derivar { audience, page } a partir da rota atual.

export const BANNER_AUDIENCES = [
  { value: 'PUBLIC', label: 'Site público' },
  { value: 'CLIENTE', label: 'Portal do Cliente' },
  { value: 'LOJA', label: 'Portal da Loja' },
  { value: 'ADMIN', label: 'Painel Admin' },
];

// Mapa audience -> páginas. A opção vazia ('') = "Todas as páginas" daquele público.
export const BANNER_PAGES = {
  PUBLIC: [
    { value: '', label: 'Todas as páginas' },
    { value: 'home', label: 'Início' },
  ],
  CLIENTE: [
    { value: '', label: 'Todas as páginas' },
    { value: 'dashboard', label: 'Início' },
    { value: 'garantias', label: 'Garantias' },
    { value: 'eventos', label: 'Eventos' },
    { value: 'vantagens', label: 'Vantagens' },
    { value: 'seguros', label: 'Seguros' },
    { value: 'perfil', label: 'Perfil' },
  ],
  LOJA: [
    { value: '', label: 'Todas as páginas' },
    { value: 'dashboard', label: 'Início' },
    { value: 'clientes', label: 'Clientes' },
    { value: 'garantias', label: 'Garantias' },
    { value: 'seguros', label: 'Seguros' },
    { value: 'produtos', label: 'Produtos' },
  ],
  ADMIN: [
    { value: '', label: 'Todas as páginas' },
    { value: 'dashboard', label: 'Início' },
  ],
};

// Labels legíveis para listagem (ex.: chip "Portal do Cliente · Garantias").
export function getAudienceLabel(audience) {
  return BANNER_AUDIENCES.find((a) => a.value === audience)?.label || audience || '—';
}

export function getPageLabel(audience, page) {
  if (!page) return 'Todas';
  const pages = BANNER_PAGES[audience] || [];
  return pages.find((p) => p.value === page)?.label || page;
}

/**
 * Deriva { audience, page } a partir do location.pathname.
 * Ex.: /cliente/garantias -> { audience: 'CLIENTE', page: 'garantias' }
 *      /cliente/dashboard -> { audience: 'CLIENTE', page: 'dashboard' }
 *      /loja/produtos      -> { audience: 'LOJA', page: 'produtos' }
 *      /admin              -> { audience: 'ADMIN', page: 'dashboard' }
 *      /                   -> { audience: 'PUBLIC', page: 'home' }
 */
export function getBannerTargetForPath(pathname) {
  const path = (pathname || '/').replace(/\/+$/, '') || '/';
  const segments = path.split('/').filter(Boolean); // ['cliente','garantias']

  if (segments[0] === 'cliente') {
    return { audience: 'CLIENTE', page: segments[1] || 'dashboard' };
  }
  if (segments[0] === 'loja') {
    return { audience: 'LOJA', page: segments[1] || 'dashboard' };
  }
  if (segments[0] === 'admin') {
    // /admin (index) = dashboard; demais subrotas usam o primeiro segmento.
    return { audience: 'ADMIN', page: segments[1] || 'dashboard' };
  }
  // Site público (qualquer rota pública) -> home.
  return { audience: 'PUBLIC', page: 'home' };
}
