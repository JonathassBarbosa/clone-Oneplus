export function currency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
