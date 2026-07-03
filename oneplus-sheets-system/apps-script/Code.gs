/**
 * One+ Sheets Backend
 * Google Apps Script + Google Sheets como memória do sistema.
 *
 * Como usar:
 * 1. Crie uma planilha Google.
 * 2. Abra Extensões > Apps Script.
 * 3. Cole este arquivo Code.gs.
 * 4. Execute manualmente setup() uma vez e autorize.
 * 5. Publique como Web App: Executar como você, acesso "Qualquer pessoa com o link".
 * 6. Copie a URL /exec para VITE_APPS_SCRIPT_URL no frontend.
 */

const SHEETS = {
  USUARIOS: ['nome','cpf','email','senha','perfil','empresa','ativo','criadoEm','atualizadoEm'],
  EMPRESAS: ['id','descricao','ativo'],
  SALAS: ['id','empresa','descricao','centroDeCusto','ativo'],
  PROPOSTAS: ['numero','data','empresa','sala','vendedor','consultor','closer','mesa','origem','clienteNome','clienteCpf','clienteEmail','clienteTelefone','endereco','cidade','uf','empreendimento','produto','cota','semana','valorTotal','sinal','parcelas','valorParcela','primeiroVencimento','formaPagamento','documentos','observacoes','status','criadoEm','atualizadoEm'],
  CONTRATOS: ['numeroContrato','numeroProposta','clienteNome','empresa','sala','status','data','observacao','criadoEm','atualizadoEm'],
  DOCUMENTOS: ['id','numeroProposta','clienteNome','tipoDocumento','status','observacao','criadoEm','atualizadoEm'],
  BRINDES: ['id','data','clienteNome','brinde','sala','responsavel','status','criadoEm','atualizadoEm'],
  LOGS: ['dataHora','usuario','acao','detalhes']
};

function doGet() {
  return json({ ok: true, message: 'One+ Sheets Backend ativo', version: '1.0.0' });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData && e.postData.contents ? e.postData.contents : '{}');
    const action = body.action;
    const payload = body.payload || {};

    const actions = {
      setup,
      login,
      listRecords,
      saveProposal,
      updateProposalStatus,
      saveContract,
      saveDocument,
      saveGift,
      dashboardStats,
      health: () => ({ ok: true })
    };

    if (!actions[action]) return json({ ok: false, message: 'Ação inválida: ' + action });
    const result = actions[action](payload);
    return json(result);
  } catch (err) {
    return json({ ok: false, message: err.message, stack: String(err.stack || '') });
  }
}

function setup() {
  Object.keys(SHEETS).forEach(name => {
    const sh = getOrCreateSheet(name);
    const headers = SHEETS[name];
    const current = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0].filter(String);
    if (current.length === 0 || current[0] !== headers[0]) {
      sh.clear();
      sh.getRange(1, 1, 1, headers.length).setValues([headers]);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#26A77C').setFontColor('#ffffff');
    }
  });

  seedIfEmpty('USUARIOS', {
    nome: 'Usuário Teste', cpf: '00000000000', email: 'teste@oneplus.local', senha: '123456', perfil: 'Administrador', empresa: 'GAV Resorts', ativo: 'SIM'
  });
  seedIfEmpty('EMPRESAS', { id: '1', descricao: 'GAV Resorts', ativo: 'SIM' });
  seedIfEmpty('SALAS', { id: '1', empresa: 'GAV Resorts', descricao: 'Porto de Galinhas - Dia', centroDeCusto: 'PGD', ativo: 'SIM' });

  return { ok: true, message: 'Estrutura criada/validada com sucesso.' };
}

function login(payload) {
  const modo = payload.modo || 'cpf';
  const identificador = String(payload.identificador || '').trim();
  const senha = String(payload.senha || '');
  const empresa = String(payload.empresa || '').trim();

  if (!empresa) return { ok: false, message: 'Empresa não selecionada.' };
  if (!identificador) return { ok: false, message: modo === 'email' ? 'E-mail não preenchido.' : 'CPF não preenchido.' };
  if (!senha) return { ok: false, message: 'Senha vazia.' };

  const users = rowsAsObjects('USUARIOS');
  const cleanCpf = onlyDigits(identificador);
  const user = users.find(u => {
    if (String(u.ativo).toUpperCase() !== 'SIM') return false;
    if (String(u.empresa) !== empresa) return false;
    if (String(u.senha) !== senha) return false;
    if (modo === 'email') return String(u.email).toLowerCase() === identificador.toLowerCase();
    return onlyDigits(u.cpf) === cleanCpf;
  });

  if (!user) return { ok: false, message: 'Login ou senha incorretos, ou usuário sem permissão para esta empresa.' };
  logAction(user.nome, 'login', empresa);
  return {
    ok: true,
    user: {
      nome: user.nome,
      cpf: user.cpf,
      email: user.email,
      perfil: user.perfil,
      empresa: user.empresa,
      token: Utilities.getUuid()
    }
  };
}

function listRecords(payload) {
  const sheet = String(payload.sheet || '').toUpperCase();
  if (!SHEETS[sheet]) return { ok: false, message: 'Aba não permitida: ' + sheet };
  let rows = rowsAsObjects(sheet);
  if (payload.empresa) rows = rows.filter(r => !r.empresa || r.empresa === payload.empresa);
  return { ok: true, rows };
}

function saveProposal(payload) {
  const numero = payload.numero || nextNumber('PROPOSTAS', 'PV');
  const now = new Date().toISOString();
  const row = Object.assign({}, payload, {
    numero,
    criadoEm: payload.criadoEm || now,
    atualizadoEm: now
  });
  upsertByKey('PROPOSTAS', 'numero', numero, row);
  logAction(payload.vendedor || 'sistema', 'saveProposal', numero);
  return { ok: true, numero };
}

function updateProposalStatus(payload) {
  const numero = payload.numero;
  const status = payload.status;
  if (!numero) return { ok: false, message: 'Número da proposta não informado.' };
  const proposta = findByKey('PROPOSTAS', 'numero', numero);
  if (!proposta) return { ok: false, message: 'Proposta não encontrada.' };

  proposta.status = status;
  proposta.atualizadoEm = new Date().toISOString();
  upsertByKey('PROPOSTAS', 'numero', numero, proposta);

  if (status === 'Em assinatura') {
    saveDocument({
      numeroProposta: numero,
      clienteNome: proposta.clienteNome,
      tipoDocumento: 'Contrato de compra e venda',
      status: 'Aguardando assinatura',
      observacao: 'Submetido pelo painel One+ Sheets'
    });
  }

  if (status === 'Concluída') {
    saveContract({
      numeroProposta: numero,
      clienteNome: proposta.clienteNome,
      empresa: proposta.empresa,
      sala: proposta.sala,
      status: 'Gerado',
      data: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy'),
      observacao: 'Contrato gerado a partir da proposta concluída'
    });
  }

  logAction('sistema', 'updateProposalStatus', numero + ' => ' + status);
  return { ok: true };
}

function saveContract(payload) {
  const numeroContrato = payload.numeroContrato || nextNumber('CONTRATOS', 'CT');
  const now = new Date().toISOString();
  const row = Object.assign({}, payload, { numeroContrato, criadoEm: payload.criadoEm || now, atualizadoEm: now });
  upsertByKey('CONTRATOS', 'numeroContrato', numeroContrato, row);
  return { ok: true, numeroContrato };
}

function saveDocument(payload) {
  const id = payload.id || nextNumber('DOCUMENTOS', 'DOC');
  const now = new Date().toISOString();
  const row = Object.assign({}, payload, { id, criadoEm: payload.criadoEm || now, atualizadoEm: now });
  upsertByKey('DOCUMENTOS', 'id', id, row);
  return { ok: true, id };
}

function saveGift(payload) {
  const id = payload.id || nextNumber('BRINDES', 'BR');
  const now = new Date().toISOString();
  const row = Object.assign({}, payload, { id, criadoEm: payload.criadoEm || now, atualizadoEm: now });
  upsertByKey('BRINDES', 'id', id, row);
  return { ok: true, id };
}

function dashboardStats(payload) {
  const empresa = payload && payload.empresa;
  const propostas = filterEmpresa(rowsAsObjects('PROPOSTAS'), empresa);
  const contratos = filterEmpresa(rowsAsObjects('CONTRATOS'), empresa);
  const brindes = rowsAsObjects('BRINDES');
  return {
    ok: true,
    stats: {
      propostas: propostas.length,
      assinatura: propostas.filter(p => p.status === 'Em assinatura').length,
      contratos: contratos.length,
      brindes: brindes.length
    }
  };
}

function filterEmpresa(rows, empresa) {
  return empresa ? rows.filter(r => !r.empresa || r.empresa === empresa) : rows;
}

function getOrCreateSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function headers(sheetName) {
  const sh = getOrCreateSheet(sheetName);
  return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].filter(String);
}

function rowsAsObjects(sheetName) {
  const sh = getOrCreateSheet(sheetName);
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  const h = headers(sheetName);
  return sh.getRange(2, 1, lastRow - 1, h.length).getValues().map(row => {
    const obj = {};
    h.forEach((key, i) => obj[key] = row[i]);
    return obj;
  });
}

function upsertByKey(sheetName, key, value, obj) {
  const sh = getOrCreateSheet(sheetName);
  const h = SHEETS[sheetName];
  const all = rowsAsObjects(sheetName);
  const index = all.findIndex(r => String(r[key]) === String(value));
  const rowValues = h.map(col => obj[col] !== undefined ? obj[col] : '');
  if (index >= 0) {
    sh.getRange(index + 2, 1, 1, h.length).setValues([rowValues]);
  } else {
    sh.appendRow(rowValues);
  }
}

function findByKey(sheetName, key, value) {
  return rowsAsObjects(sheetName).find(r => String(r[key]) === String(value));
}

function nextNumber(sheetName, prefix) {
  const count = rowsAsObjects(sheetName).length + 1;
  return prefix + '-' + String(count).padStart(5, '0');
}

function seedIfEmpty(sheetName, obj) {
  const rows = rowsAsObjects(sheetName);
  if (rows.length === 0) {
    const now = new Date().toISOString();
    upsertByKey(sheetName, SHEETS[sheetName][0], obj[SHEETS[sheetName][0]], Object.assign({ criadoEm: now, atualizadoEm: now }, obj));
  }
}

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function logAction(usuario, acao, detalhes) {
  try {
    const sh = getOrCreateSheet('LOGS');
    sh.appendRow([new Date().toISOString(), usuario, acao, detalhes]);
  } catch (err) {}
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
