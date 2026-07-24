// Fotos reais de ciclismo (licenca livre — Wikimedia Commons) servidas de /public/bg.
// Usadas como fundo translucido atras do conteudo das paginas dos portais.
const CYCLING_BGS = [
  '/bg/cycling-road.jpg',    // ciclismo de estrada profissional
  '/bg/cycling-mtb.jpg',     // mountain bike (UCI MTB World Cup)
  '/bg/cycling-peloton.jpg', // peloton
];

// Escolha deterministica por rota, para variar a foto entre paginas sem estado.
// ponytail: hash simples pelo tamanho do path; nao precisa ser uniforme, so variar.
export function bgForPath(pathname = '') {
  return CYCLING_BGS[pathname.length % CYCLING_BGS.length];
}
