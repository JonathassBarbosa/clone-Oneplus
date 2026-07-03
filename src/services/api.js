const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '';

const localState = {
  USUARIOS: [
    { nome: 'Usuário Teste', cpf: '00000000000', email: 'teste@oneplus.local', senha: '123456', perfil: 'Administrador', empresa: 'GAV Resorts', ativo: 'SIM' }
  ],
  PROPOSTAS: [],
  CONTRATOS: [],
  DOCUMENTOS: [],
  BRINDES: [],
  LOGS: []
};

function readLocal() {
  return JSON.parse(localStorage.getItem('oneplus_db') || JSON.stringify(localState));
}
function writeLocal(db) { localStorage.setItem('oneplus_db', JSON.stringify(db)); }
function nextNumber(prefix, list) { return `${prefix}-${String((list?.length || 0) + 1).padStart(5, '0')}`; }

async function localApi(action, payload = {}) {
  const db = readLocal();
  switch (action) {
    case 'login': {
      const id = String(payload.identificador || '').replace(/\D/g, '');
      const user = db.USUARIOS.find((u) => {
        if (String(u.ativo).toUpperCase() !== 'SIM') return false;
        const sameCompany = !payload.empresa || u.empresa === payload.empresa;
        if (payload.modo === 'email') return sameCompany && String(u.email).toLowerCase() === String(payload.identificador).toLowerCase() && u.senha === payload.senha;
        return sameCompany && String(u.cpf).replace(/\D/g, '') === id && u.senha === payload.senha;
      });
      if (!user) return { ok: false, message: 'Login ou senha incorretos, ou usuário sem permissão para esta empresa.' };
      return { ok: true, user: { nome: user.nome, perfil: user.perfil, empresa: user.empresa, email: user.email, token: 'local-demo' } };
    }
    case 'listRecords': return { ok: true, rows: db[payload.sheet] || [] };
    case 'saveProposal': {
      const numero = payload.numero || nextNumber('PV', db.PROPOSTAS);
      const row = { ...payload, numero, atualizadoEm: new Date().toISOString() };
      const idx = db.PROPOSTAS.findIndex((p) => p.numero === numero);
      if (idx >= 0) db.PROPOSTAS[idx] = row; else db.PROPOSTAS.push(row);
      writeLocal(db);
      return { ok: true, numero };
    }
    case 'updateProposalStatus': {
      db.PROPOSTAS = db.PROPOSTAS.map((p) => p.numero === payload.numero ? { ...p, status: payload.status, atualizadoEm: new Date().toISOString() } : p);
      if (payload.status === 'Em assinatura') {
        db.DOCUMENTOS.push({ numeroProposta: payload.numero, clienteNome: db.PROPOSTAS.find((p) => p.numero === payload.numero)?.clienteNome || '', tipoDocumento: 'Contrato de compra e venda', status: 'Aguardando assinatura', observacao: 'Submetido pelo painel' });
      }
      if (payload.status === 'Concluída') {
        const prop = db.PROPOSTAS.find((p) => p.numero === payload.numero);
        db.CONTRATOS.push({ numeroContrato: nextNumber('CT', db.CONTRATOS), numeroProposta: payload.numero, clienteNome: prop?.clienteNome || '', status: 'Gerado', data: new Date().toLocaleDateString('pt-BR') });
      }
      writeLocal(db);
      return { ok: true };
    }
    case 'saveGift': db.BRINDES.push({ ...payload, id: nextNumber('BR', db.BRINDES) }); writeLocal(db); return { ok: true };
    case 'dashboardStats': return { ok: true, stats: { propostas: db.PROPOSTAS.length, assinatura: db.PROPOSTAS.filter((p) => p.status === 'Em assinatura').length, contratos: db.CONTRATOS.length, brindes: db.BRINDES.length } };
    default: return { ok: false, message: `Ação não implementada no modo local: ${action}` };
  }
}

export const api = {
  async post(action, payload = {}) {
    if (!API_URL || API_URL.includes('SEU_DEPLOYMENT_ID')) {
      return localApi(action, payload);
    }
    const response = await fetch(API_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload })
    });
    const text = await response.text();
    try { return JSON.parse(text); } catch { return { ok: false, message: text || 'Resposta inválida do Apps Script.' }; }
  }
};
