import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BarChart3,
  ClipboardCheck,
  FileSignature,
  Gift,
  Home,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  ShoppingCart,
  Users,
  X
} from 'lucide-react';
import './styles.css';
import { api } from './services/api.js';
import { currency, todayISO } from './utils/format.js';

const LOGO_SRC = `${import.meta.env.BASE_URL || '/'}logo.svg`;

const MENU = [
  { id: 'dashboard', label: 'Início', icon: Home },
  { id: 'venda-direta', label: 'Venda Direta', icon: ShoppingCart },
  { id: 'propostas', label: 'Gestão de Propostas', icon: ClipboardCheck },
  { id: 'contratos', label: 'Meus Contratos', icon: FileSignature },
  { id: 'secretaria', label: 'Secretaria de Vendas', icon: ShieldCheck },
  { id: 'sala', label: 'Acompanhamento de Sala', icon: BarChart3 },
  { id: 'brindes', label: 'Gestão de Brindes', icon: Gift },
  { id: 'usuarios', label: 'Usuários e Memória', icon: Users }
];

function App() {
  const [session, setSession] = useState(() => JSON.parse(localStorage.getItem('oneplus_session') || 'null'));
  const [active, setActive] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogin(user) {
    localStorage.setItem('oneplus_session', JSON.stringify(user));
    setSession(user);
  }

  function logout() {
    localStorage.removeItem('oneplus_session');
    setSession(null);
    setActive('dashboard');
  }

  if (!session) return <LoginPage onLogin={handleLogin} />;

  const ActiveIcon = MENU.find((m) => m.id === active)?.icon || Home;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="brand">
          <img src={LOGO_SRC} alt="One+" />
          <button className="icon-button mobile-only" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
        </div>
        <nav>
          {MENU.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={active === item.id ? 'nav-item active' : 'nav-item'} onClick={() => { setActive(item.id); setSidebarOpen(false); }}>
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="user-card">
            <strong>{session.nome}</strong>
            <small>{session.perfil} • {session.empresa}</small>
          </div>
          <button className="button ghost" onClick={logout}><LogOut size={16} /> Sair</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setSidebarOpen(true)}><Menu /></button>
          <div>
            <p className="eyebrow">One+ Sheets</p>
            <h1><ActiveIcon size={26} /> {MENU.find((m) => m.id === active)?.label}</h1>
          </div>
        </header>
        <PageRouter active={active} session={session} />
      </main>
    </div>
  );
}

function PageRouter({ active, session }) {
  const pages = {
    dashboard: <Dashboard session={session} />,
    'venda-direta': <VendaDireta session={session} />,
    propostas: <GestaoPropostas session={session} />,
    contratos: <MeusContratos session={session} />,
    secretaria: <Secretaria session={session} />,
    sala: <AcompanhamentoSala session={session} />,
    brindes: <GestaoBrindes session={session} />,
    usuarios: <UsuariosMemoria session={session} />
  };
  return pages[active] || pages.dashboard;
}

function LoginPage({ onLogin }) {
  const [modo, setModo] = useState('cpf');
  const [empresa, setEmpresa] = useState('GAV Resorts');
  const [identificador, setIdentificador] = useState('00000000000');
  const [senha, setSenha] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function submit(e) {
    e.preventDefault();
    setErro('');
    if (!empresa) return setErro('Empresa não selecionada. Informe a empresa que deseja acessar.');
    if (!identificador) return setErro(modo === 'cpf' ? 'CPF não preenchido.' : 'E-mail não preenchido.');
    if (!senha) return setErro('Senha vazia. É necessário digitar a senha.');
    setLoading(true);
    try {
      const res = await api.post('login', { modo, identificador, senha, empresa });
      if (!res.ok) throw new Error(res.message || 'Login ou senha incorretos.');
      onLogin(res.user);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-layout">
      <section className="login-hero">
        <img src={LOGO_SRC} alt="One+" />
        <h2>Sistema comercial com memória em Google Sheets</h2>
        <p>Controle propostas, contratos, documentos, assinatura, brindes e acompanhamento da sala em uma única rotina operacional.</p>
      </section>
      <section className="login-panel">
        <form className="card login-card" onSubmit={submit}>
          <p className="eyebrow">Acesso ao sistema</p>
          <h1>Entrar</h1>
          <label>Empresa</label>
          <select value={empresa} onChange={(e) => setEmpresa(e.target.value)}>
            <option>GAV Resorts</option>
            <option>Fornecedor</option>
            <option>Treinamento</option>
          </select>

          <div className="toggle-row">
            <button type="button" className={modo === 'cpf' ? 'pill active' : 'pill'} onClick={() => setModo('cpf')}>CPF</button>
            <button type="button" className={modo === 'email' ? 'pill active' : 'pill'} onClick={() => setModo('email')}>E-mail</button>
          </div>

          <label>{modo === 'cpf' ? 'CPF' : 'E-mail'}</label>
          <input value={identificador} onChange={(e) => setIdentificador(e.target.value)} placeholder={modo === 'cpf' ? 'Digite o CPF' : 'Digite o e-mail'} />
          <label>Senha</label>
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Digite a senha" />
          {erro && <div className="alert error">{erro}</div>}
          <button className="button primary" disabled={loading}>{loading ? 'Entrando...' : 'Entrar no One+'}</button>
          <small className="muted">Usuário de teste: CPF 00000000000 / senha 123456. Altere isso na aba USUARIOS.</small>
        </form>
      </section>
    </div>
  );
}

function Dashboard({ session }) {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.post('dashboardStats', { empresa: session.empresa }).then((r) => setStats(r.stats || {})); }, [session.empresa]);
  const cards = [
    ['Propostas', stats?.propostas || 0, 'Total registrado'],
    ['Em assinatura', stats?.assinatura || 0, 'Aguardando documento'],
    ['Contratos', stats?.contratos || 0, 'Contratos gerados'],
    ['Brindes', stats?.brindes || 0, 'Entregas registradas']
  ];
  return (
    <div className="grid two">
      <section className="card span-2">
        <p className="eyebrow">Painel operacional</p>
        <h2>Bem-vindo, {session.nome}</h2>
        <p>Use este painel para acompanhar o andamento comercial, iniciar uma venda, revisar propostas e registrar documentos ou brindes.</p>
      </section>
      {cards.map(([title, value, subtitle]) => <MetricCard key={title} title={title} value={value} subtitle={subtitle} />)}
      <section className="card span-2">
        <h3>Fluxo recomendado</h3>
        <div className="timeline compact">
          {['Iniciar atendimento', 'Cadastrar cliente', 'Montar plano de pagamento', 'Enviar proposta', 'Anexar documentos', 'Submeter assinatura', 'Acompanhar contrato'].map((item, index) => (
            <div className="timeline-step" key={item}><span>{index + 1}</span>{item}</div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ title, value, subtitle }) {
  return <section className="card metric"><small>{title}</small><strong>{value}</strong><span>{subtitle}</span></section>;
}

const STEPS = ['Atendimento', 'Cliente', 'Produto', 'Pagamento', 'Documentos', 'Revisão', 'Envio', 'Assinatura', 'Concluído'];
const initialSale = {
  data: todayISO(), sala: 'Porto de Galinhas - Dia', consultor: '', closer: '', mesa: '', origem: 'Sala de vendas',
  clienteNome: '', clienteCpf: '', clienteEmail: '', clienteTelefone: '', endereco: '', cidade: '', uf: '',
  empreendimento: 'Beach Hotel', produto: 'Cota Multipropriedade', cota: '', semana: '',
  valorTotal: 0, sinal: 0, parcelas: 1, primeiroVencimento: todayISO(), formaPagamento: 'PIX', observacoes: '',
  documentos: '', status: 'Rascunho'
};

function VendaDireta({ session }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialSale);
  const [message, setMessage] = useState('');
  const valorParcela = useMemo(() => {
    const restante = Number(form.valorTotal || 0) - Number(form.sinal || 0);
    return form.parcelas > 0 ? restante / Number(form.parcelas) : 0;
  }, [form.valorTotal, form.sinal, form.parcelas]);

  function set(name, value) { setForm((f) => ({ ...f, [name]: value })); }

  function validateCurrentStep() {
    if (step === 0 && (!form.sala || !form.consultor)) return 'Informe a sala e o consultor.';
    if (step === 1 && (!form.clienteNome || !form.clienteCpf || !form.clienteTelefone)) return 'Informe nome, CPF e telefone do cliente.';
    if (step === 2 && (!form.empreendimento || !form.cota)) return 'Informe empreendimento e cota.';
    if (step === 3 && Number(form.valorTotal) <= 0) return 'Informe o valor total da proposta.';
    return '';
  }

  async function next() {
    const err = validateCurrentStep();
    if (err) return setMessage(err);
    setMessage('');
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function save(status = 'Rascunho') {
    setMessage('Salvando...');
    const payload = {
      ...form,
      status,
      vendedor: session.nome,
      empresa: session.empresa,
      valorParcela: valorParcela.toFixed(2)
    };
    const res = await api.post('saveProposal', payload);
    if (res.ok) {
      setForm((f) => ({ ...f, numero: res.numero, status }));
      setMessage(`Proposta ${res.numero} salva com status: ${status}.`);
      if (status !== 'Rascunho') setStep(7);
    } else setMessage(res.message || 'Falha ao salvar proposta.');
  }

  return (
    <section className="card">
      <div className="wizard-header">
        <div>
          <p className="eyebrow">Fluxo comercial</p>
          <h2>Venda Direta</h2>
        </div>
        <button className="button ghost" onClick={() => save('Rascunho')}>Salvar rascunho</button>
      </div>
      <Stepper steps={STEPS} current={step} />
      {message && <div className="alert info">{message}</div>}

      {step === 0 && <FormGrid title="Dados do atendimento">
        <Input label="Data" type="date" value={form.data} onChange={(v) => set('data', v)} />
        <Input label="Sala de venda" value={form.sala} onChange={(v) => set('sala', v)} />
        <Input label="Consultor" value={form.consultor} onChange={(v) => set('consultor', v)} />
        <Input label="Closer / Gerente" value={form.closer} onChange={(v) => set('closer', v)} />
        <Input label="Mesa" value={form.mesa} onChange={(v) => set('mesa', v)} />
        <Select label="Origem" value={form.origem} onChange={(v) => set('origem', v)} options={['Sala de vendas', 'WhatsApp', 'Indicação', 'Evento', 'Reabertura']} />
      </FormGrid>}

      {step === 1 && <FormGrid title="Dados do cliente titular">
        <Input label="Nome completo" value={form.clienteNome} onChange={(v) => set('clienteNome', v)} />
        <Input label="CPF" value={form.clienteCpf} onChange={(v) => set('clienteCpf', v)} />
        <Input label="E-mail" value={form.clienteEmail} onChange={(v) => set('clienteEmail', v)} />
        <Input label="Telefone" value={form.clienteTelefone} onChange={(v) => set('clienteTelefone', v)} />
        <Input label="Endereço" value={form.endereco} onChange={(v) => set('endereco', v)} />
        <Input label="Cidade/UF" value={`${form.cidade}${form.uf ? '/' + form.uf : ''}`} onChange={(v) => set('cidade', v)} />
      </FormGrid>}

      {step === 2 && <FormGrid title="Produto, empreendimento e cota">
        <Input label="Empreendimento" value={form.empreendimento} onChange={(v) => set('empreendimento', v)} />
        <Input label="Produto" value={form.produto} onChange={(v) => set('produto', v)} />
        <Input label="Cota / unidade" value={form.cota} onChange={(v) => set('cota', v)} />
        <Input label="Semana" value={form.semana} onChange={(v) => set('semana', v)} />
      </FormGrid>}

      {step === 3 && <FormGrid title="Plano de pagamento">
        <Input label="Valor total" type="number" value={form.valorTotal} onChange={(v) => set('valorTotal', v)} />
        <Input label="Sinal / Entrada" type="number" value={form.sinal} onChange={(v) => set('sinal', v)} />
        <Input label="Quantidade de parcelas" type="number" value={form.parcelas} onChange={(v) => set('parcelas', v)} />
        <Input label="Primeiro vencimento" type="date" value={form.primeiroVencimento} onChange={(v) => set('primeiroVencimento', v)} />
        <Select label="Forma de pagamento" value={form.formaPagamento} onChange={(v) => set('formaPagamento', v)} options={['PIX', 'Cartão de crédito', 'Cartão de débito', 'Boleto', 'TED', 'Espécie']} />
        <div className="calc-box"><span>Valor estimado da parcela</span><strong>{currency(valorParcela)}</strong></div>
      </FormGrid>}

      {step === 4 && <FormGrid title="Documentos e anexos">
        <Textarea label="Documentos coletados" value={form.documentos} onChange={(v) => set('documentos', v)} placeholder="Ex.: RG/CPF, comprovante de endereço, checklist, negociação assinada..." />
        <Textarea label="Observações para secretaria" value={form.observacoes} onChange={(v) => set('observacoes', v)} />
      </FormGrid>}

      {step === 5 && <Review form={form} valorParcela={valorParcela} />}
      {step === 6 && <SendProposal onSave={save} form={form} />}
      {step === 7 && <SignaturePanel form={form} onUpdate={save} />}
      {step === 8 && <DonePanel form={form} />}

      <div className="wizard-actions">
        <button className="button ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>Voltar</button>
        {step < 6 && <button className="button primary" onClick={next}>Avançar</button>}
        {step === 7 && <button className="button primary" onClick={() => { save('Concluída'); setStep(8); }}>Concluir venda</button>}
      </div>
    </section>
  );
}

function Stepper({ steps, current }) {
  return <div className="stepper">{steps.map((s, i) => <div key={s} className={i <= current ? 'step active' : 'step'}><span>{i + 1}</span><small>{s}</small></div>)}</div>;
}

function FormGrid({ title, children }) {
  return <div><h3>{title}</h3><div className="form-grid">{children}</div></div>;
}
function Input({ label, value, onChange, type = 'text', placeholder = '' }) { return <label className="field"><span>{label}</span><input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></label>; }
function Select({ label, value, onChange, options }) { return <label className="field"><span>{label}</span><select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o}>{o}</option>)}</select></label>; }
function Textarea({ label, value, onChange, placeholder = '' }) { return <label className="field full"><span>{label}</span><textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></label>; }

function Review({ form, valorParcela }) {
  const items = [
    ['Cliente', form.clienteNome], ['CPF', form.clienteCpf], ['Sala', form.sala], ['Consultor', form.consultor], ['Empreendimento', form.empreendimento], ['Cota', form.cota], ['Valor total', currency(form.valorTotal)], ['Sinal', currency(form.sinal)], ['Parcelas', `${form.parcelas}x de ${currency(valorParcela)}`], ['Forma', form.formaPagamento]
  ];
  return <div><h3>Revisão antes do envio</h3><div className="review-grid">{items.map(([k, v]) => <div key={k}><small>{k}</small><strong>{v || '-'}</strong></div>)}</div></div>;
}

function SendProposal({ onSave, form }) {
  return <div className="center-card"><h3>{form.numero ? 'Confirmar proposta' : 'Enviar proposta'}</h3><p>Após o envio, a proposta ficará disponível para acompanhamento na Gestão de Propostas e poderá seguir para documentos e assinatura.</p><button className="button primary" onClick={() => onSave('Enviada')}>{form.numero ? 'Confirmar proposta' : 'Enviar proposta'}</button></div>;
}

function SignaturePanel({ form, onUpdate }) {
  return <div className="center-card"><h3>Submissão para assinatura</h3><p>Confira os documentos anexados antes de submeter para assinatura. Nesta versão, o status é registrado na planilha e pode ser integrado depois com ZapSign, D4Sign ou outro provedor.</p><button className="button primary" onClick={() => onUpdate('Em assinatura')}>Submeter documento para assinatura</button></div>;
}
function DonePanel({ form }) { return <div className="center-card success"><h3>Venda concluída</h3><p>Proposta {form.numero || ''} registrada e disponível para acompanhamento.</p></div>; }

function GestaoPropostas({ session }) {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('Todos');
  const [selected, setSelected] = useState(null);
  useEffect(() => { load(); }, []);
  async function load() { const res = await api.post('listRecords', { sheet: 'PROPOSTAS' }); setRows(res.rows || []); }
  async function updateStatus(row, newStatus) { await api.post('updateProposalStatus', { numero: row.numero, status: newStatus }); await load(); }
  const filtered = rows.filter((r) => [r.numero, r.clienteNome, r.sala, r.consultor].join(' ').toLowerCase().includes(q.toLowerCase()) && (status === 'Todos' || r.status === status));
  return <RecordsPage title="Gestão de Propostas" q={q} setQ={setQ} status={status} setStatus={setStatus} rows={filtered} columns={['numero','clienteNome','sala','valorTotal','status']} onSelect={setSelected} actions={(row) => <StatusActions row={row} onUpdate={updateStatus} />} selected={selected} onClose={() => setSelected(null)} />;
}

function StatusActions({ row, onUpdate }) {
  return <div className="row-actions"><button onClick={() => onUpdate(row, 'Em análise')}>Analisar</button><button onClick={() => onUpdate(row, 'Em assinatura')}>Assinatura</button><button onClick={() => onUpdate(row, 'Concluída')}>Concluir</button></div>;
}

function MeusContratos() {
  return <GenericSheetPage title="Meus Contratos" sheet="CONTRATOS" columns={['numeroContrato','numeroProposta','clienteNome','status','data']} emptyText="Nenhum contrato gerado ainda." />;
}
function Secretaria() {
  return <GenericSheetPage title="Secretaria de Vendas" sheet="DOCUMENTOS" columns={['numeroProposta','clienteNome','tipoDocumento','status','observacao']} emptyText="Nenhum documento pendente." />;
}
function AcompanhamentoSala() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.post('dashboardStats', {}).then((r) => setStats(r.stats || {})); }, []);
  return <div className="grid two"><MetricCard title="Propostas" value={stats?.propostas || 0} subtitle="Total geral" /><MetricCard title="Em assinatura" value={stats?.assinatura || 0} subtitle="Aguardando assinatura" /><MetricCard title="Contratos" value={stats?.contratos || 0} subtitle="Gerados" /><MetricCard title="Brindes" value={stats?.brindes || 0} subtitle="Entregues" /><section className="card span-2"><h3>Leitura operacional</h3><p>Use este painel para acompanhar volume, gargalos de documento e propostas que precisam de ação da secretaria ou da liderança da sala.</p></section></div>;
}
function GestaoBrindes() {
  return <GenericSheetPage title="Gestão de Brindes" sheet="BRINDES" columns={['data','clienteNome','brinde','sala','responsavel','status']} emptyText="Nenhum brinde registrado." allowCreate />;
}
function UsuariosMemoria() {
  return <GenericSheetPage title="Usuários e Memória" sheet="USUARIOS" columns={['nome','cpf','email','perfil','empresa','ativo']} emptyText="Nenhum usuário encontrado." />;
}

function GenericSheetPage({ title, sheet, columns, emptyText, allowCreate = false }) {
  const [rows, setRows] = useState([]); const [q, setQ] = useState(''); const [selected, setSelected] = useState(null);
  useEffect(() => { api.post('listRecords', { sheet }).then((r) => setRows(r.rows || [])); }, [sheet]);
  const filtered = rows.filter((r) => columns.map((c) => r[c]).join(' ').toLowerCase().includes(q.toLowerCase()));
  return <RecordsPage title={title} q={q} setQ={setQ} rows={filtered} columns={columns} selected={selected} onSelect={setSelected} onClose={() => setSelected(null)} emptyText={emptyText} extra={allowCreate ? <QuickGiftForm onSaved={() => api.post('listRecords', { sheet }).then((r) => setRows(r.rows || []))} /> : null} />;
}

function QuickGiftForm({ onSaved }) {
  const [form, setForm] = useState({ data: todayISO(), clienteNome: '', brinde: '', sala: '', responsavel: '', status: 'Entregue' });
  async function save(e) { e.preventDefault(); await api.post('saveGift', form); setForm({ data: todayISO(), clienteNome: '', brinde: '', sala: '', responsavel: '', status: 'Entregue' }); onSaved(); }
  return <form className="inline-form" onSubmit={save}><input placeholder="Cliente" value={form.clienteNome} onChange={(e) => setForm({...form, clienteNome: e.target.value})}/><input placeholder="Brinde" value={form.brinde} onChange={(e) => setForm({...form, brinde: e.target.value})}/><input placeholder="Sala" value={form.sala} onChange={(e) => setForm({...form, sala: e.target.value})}/><button className="button primary">Registrar</button></form>;
}

function RecordsPage({ title, q, setQ, status, setStatus, rows, columns, onSelect, actions, selected, onClose, emptyText = 'Nenhum registro encontrado.', extra }) {
  return <section className="card"><div className="list-header"><div><p className="eyebrow">Consulta e acompanhamento</p><h2>{title}</h2></div><div className="search-box"><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar registro" /></div>{setStatus && <select value={status} onChange={(e) => setStatus(e.target.value)}><option>Todos</option><option>Rascunho</option><option>Enviada</option><option>Em análise</option><option>Em assinatura</option><option>Concluída</option></select>}</div>{extra}<div className="table-wrap"><table><thead><tr>{columns.map((c) => <th key={c}>{label(c)}</th>)}<th>Ações</th></tr></thead><tbody>{rows.length === 0 ? <tr><td colSpan={columns.length + 1}>{emptyText}</td></tr> : rows.map((row, idx) => <tr key={row.id || idx}>{columns.map((c) => <td key={c}>{formatCell(c, row[c])}</td>)}<td><button className="link" onClick={() => onSelect(row)}>Ver</button>{actions?.(row)}</td></tr>)}</tbody></table></div>{selected && <Drawer record={selected} onClose={onClose} />}</section>;
}

function Drawer({ record, onClose }) {
  return <div className="drawer-backdrop" onClick={onClose}><aside className="drawer" onClick={(e) => e.stopPropagation()}><button className="icon-button" onClick={onClose}><X size={18}/></button><h3>Detalhes do registro</h3>{Object.entries(record).map(([k, v]) => <div className="detail-row" key={k}><small>{label(k)}</small><span>{String(v ?? '')}</span></div>)}</aside></div>;
}

function label(key) { return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).replace('Cpf', 'CPF'); }
function formatCell(key, value) { if (key.toLowerCase().includes('valor')) return currency(value || 0); return String(value ?? ''); }

createRoot(document.getElementById('root')).render(<App />);
