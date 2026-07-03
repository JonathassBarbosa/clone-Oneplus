# One+ Sheets System

Sistema comercial inspirado no fluxo operacional do One+, criado em código original para hospedar no GitHub e usar Google Sheets + Apps Script como memória/banco de dados.

> Importante: este projeto não copia o código minificado original. Ele recria uma versão funcional e adaptável com frontend próprio, Google Sheets como base de dados e Apps Script como API.

## Módulos incluídos

- Login por CPF ou e-mail, senha e empresa
- Dashboard operacional
- Venda Direta em 9 etapas
- Gestão de Propostas
- Meus Contratos
- Secretaria de Vendas
- Acompanhamento de Sala
- Gestão de Brindes
- Usuários e memória do sistema

## Estrutura do projeto

```txt
oneplus-sheets-system/
├─ apps-script/
│  ├─ Code.gs              # Backend para Google Apps Script
│  └─ appsscript.json      # Manifesto do Apps Script
├─ src/
│  ├─ main.jsx             # Aplicação React
│  ├─ styles.css           # Layout e identidade visual
│  ├─ services/api.js      # Comunicação com Apps Script ou modo local
│  └─ utils/format.js      # Funções auxiliares
├─ public/logo.svg
├─ .env.example
├─ package.json
└─ vite.config.js
```

## Como rodar localmente

1. Instale o Node.js.
2. Na pasta do projeto, rode:

```bash
npm install
npm run dev
```

3. Abra o endereço exibido no terminal.
4. Sem configurar Apps Script, o sistema funciona em **modo demonstração** usando `localStorage`.

Usuário de teste:

```txt
CPF: 00000000000
Senha: 123456
Empresa: GAV Resorts
```

## Como configurar o Google Sheets como memória

1. Crie uma nova planilha no Google Sheets.
2. Acesse **Extensões > Apps Script**.
3. Apague o conteúdo inicial e cole o arquivo `apps-script/Code.gs`.
4. Salve o projeto.
5. Execute a função `setup()` manualmente uma vez.
6. Autorize os acessos solicitados.
7. Confira se as abas foram criadas:
   - USUARIOS
   - EMPRESAS
   - SALAS
   - PROPOSTAS
   - CONTRATOS
   - DOCUMENTOS
   - BRINDES
   - LOGS

## Como publicar o Apps Script como API

1. No Apps Script, clique em **Implantar > Nova implantação**.
2. Tipo: **App da Web**.
3. Executar como: **Você**.
4. Quem pode acessar: **Qualquer pessoa com o link**.
5. Clique em **Implantar**.
6. Copie a URL terminada em `/exec`.
7. No projeto React, crie um arquivo `.env` com:

```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/SEU_DEPLOYMENT_ID/exec
VITE_BASE_PATH=/oneplus-sheets-system/
```

## Como hospedar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie todos os arquivos deste projeto.
3. Garanta que o arquivo `.env` com a URL do Apps Script esteja configurado localmente antes do build.
4. Rode:

```bash
npm run build
```

5. Publique a pasta `dist` no GitHub Pages ou use o workflow em `.github/workflows/deploy.yml`.

### Deploy automático via GitHub Actions

O arquivo de workflow já está incluído. Para usar:

1. Crie no GitHub o secret `VITE_APPS_SCRIPT_URL` com a URL `/exec` do Apps Script.
2. Em **Settings > Pages**, selecione **GitHub Actions** como fonte.
3. Faça push na branch `main`.

## Abas da planilha

### USUARIOS
Campos principais: `nome`, `cpf`, `email`, `senha`, `perfil`, `empresa`, `ativo`.

### PROPOSTAS
Guarda todo o fluxo da Venda Direta: atendimento, cliente, produto, pagamento, documentos, status e observações.

### CONTRATOS
Registra contratos gerados a partir de propostas concluídas.

### DOCUMENTOS
Controla documentos submetidos, pendentes e em assinatura.

### BRINDES
Controla entrega de brindes por cliente, sala e responsável.

### LOGS
Registra ações principais do sistema.

## Ajustes recomendados para produção

- Trocar senha simples por hash.
- Criar níveis de permissão por perfil.
- Proteger a URL do Apps Script com token por usuário.
- Integrar assinatura digital real, como ZapSign ou D4Sign.
- Adicionar upload de arquivos para Google Drive.
- Criar validações específicas de regra comercial por empreendimento.

## Observação sobre CORS no Apps Script

O frontend envia `Content-Type: text/plain` para evitar preflight CORS. O Apps Script recebe o JSON normalmente por `e.postData.contents`.
