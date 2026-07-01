import * as XLSX from 'xlsx';

// Normaliza cabeçalhos (minúsculo, sem acento) para casar colunas da planilha.
export const norm = (s) =>
  String(s).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Lê uma célula por chave normalizada (ex.: cell(row, 'razao social')).
export const cell = (row, key) => {
  for (const k of Object.keys(row)) if (norm(k) === key) return String(row[k] ?? '').trim();
  return '';
};

// Lê a primeira aba de um .csv/.xlsx e devolve as linhas como objetos.
export async function readSheetRows(file) {
  const wb = XLSX.read(await file.arrayBuffer());
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

// Baixa uma planilha modelo só com os cabeçalhos.
export function downloadTemplate(headers, filename, sheetName = 'Dados') {
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}
