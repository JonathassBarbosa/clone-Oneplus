# Observações técnicas

Este projeto usa uma arquitetura simples:

- React/Vite no frontend.
- Google Apps Script como API HTTP.
- Google Sheets como banco/memória.
- LocalStorage como fallback para demonstração local.

## Segurança

A senha simples no Google Sheets é adequada apenas para protótipo e treinamento. Para produção, recomenda-se:

- Hash de senha.
- Token de sessão com expiração.
- Validação de perfil por rota.
- Registro de logs por usuário real.
- Regras de acesso por empresa, sala e centro de custo.

## Integrações futuras

- ZapSign ou D4Sign para assinatura.
- Google Drive para upload real de documentos.
- Looker Studio para dashboard.
- WhatsApp/API para envio de status ao cliente ou gerente.
