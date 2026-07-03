# Estrutura da planilha Google Sheets

Execute `setup()` no Apps Script para criar automaticamente estas abas.

## USUARIOS
| Campo | Uso |
|---|---|
| nome | Nome do usuário |
| cpf | CPF usado no login |
| email | E-mail usado no login alternativo |
| senha | Senha temporária/simples |
| perfil | Administrador, Secretaria, Vendedor, Gerente etc. |
| empresa | Empresa liberada para acesso |
| ativo | SIM ou NÃO |
| criadoEm | Data de criação |
| atualizadoEm | Data da última alteração |

## EMPRESAS
| Campo | Uso |
|---|---|
| id | Identificador da empresa |
| descricao | Nome da empresa |
| ativo | SIM ou NÃO |

## SALAS
| Campo | Uso |
|---|---|
| id | Identificador da sala |
| empresa | Empresa vinculada |
| descricao | Nome da sala |
| centroDeCusto | Sigla ou centro de custo |
| ativo | SIM ou NÃO |

## PROPOSTAS
Armazena o fluxo da venda direta: atendimento, cliente, produto, negociação, documentos e status.

## CONTRATOS
Armazena contratos gerados a partir de propostas concluídas.

## DOCUMENTOS
Controla documentos pendentes, anexados, em análise e enviados para assinatura.

## BRINDES
Controla os brindes entregues ou pendentes por cliente/sala.

## LOGS
Histórico simples de ações importantes.
