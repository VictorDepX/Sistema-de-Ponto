# ⏱ Ponto Eletrônico

Sistema de controle de ponto eletrônico para academias — 100% web, PWA, mobile-first.

Funcionários escaneiam um QR Code na parede, abrem o sistema no celular e registram o ponto em um toque. Sem instalar nada.

---

## Sumário

- [Demo e credenciais](#demo-e-credenciais)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Stack](#stack)
- [Setup local](#setup-local)
- [Deploy gratuito](#deploy-gratuito)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [API](#api)
- [PWA — Instalar no celular](#pwa--instalar-no-celular)
- [Banco de dados](#banco-de-dados)
- [Regras de negócio](#regras-de-negócio)
- [Segurança](#segurança)

---

## Demo e credenciais

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | admin@academia.com | admin123 |
| Funcionário | joao@academia.com | 123456 |
| Funcionário | maria@academia.com | 123456 |

---

## Funcionalidades

### Funcionário (mobile-first)

- Login com sessão persistente (30 dias via refresh token)
- Relógio em tempo real com botão de ponto contextual
- Sequência guiada: Entrada → Intervalo → Retorno → Saída
- Histórico mensal com resumo de horas trabalhadas, extras, atrasos e banco
- Perfil com instruções de instalação PWA
- Funciona offline (service worker cacheia assets e dados)

### Administrador (desktop)

- Dashboard com KPIs do mês e gráfico de horas por funcionário
- CRUD completo de funcionários + definição de escala de trabalho
- Relatórios por funcionário e mês com exportação XLSX
- Ajuste manual de registros com rastreabilidade
- Auditoria paginada com diff antes/depois de cada alteração
- Gerador de QR Code com download PNG e impressão formatada

---

## Arquitetura

```
ponto-web/
├── apps/
│   ├── api/          NestJS + Prisma + PostgreSQL
│   └── web/          React + Vite + PWA
└── packages/
    ├── types/        Tipos TypeScript compartilhados
    └── utils/        Utilitários e cálculos de negócio
```

### Rotas

| Rota | Acesso | Descrição |
|---|---|---|
| `/login` | Todos | Login — detecta role e redireciona |
| `/ponto` | Funcionário | Tela de ponto |
| `/ponto/historico` | Funcionário | Histórico e relatório mensal |
| `/ponto/perfil` | Funcionário | Dados e logout |
| `/admin` | Admin | Dashboard |
| `/admin/funcionarios` | Admin | CRUD de funcionários |
| `/admin/relatorios` | Admin | Relatórios + exportação |
| `/admin/auditoria` | Admin | Logs de auditoria |
| `/admin/qrcode` | Admin | Gerador de QR Code |

### Fluxo do QR Code

```
Admin gera QR em /admin/qrcode → imprime e fixa na academia
         ↓
Funcionário aponta câmera → abre /ponto no browser
         ↓
Faz login → registra ponto com um toque
         ↓
Opcional: salva como app na tela inicial (PWA)
```

---

## Stack

| Camada | Tecnologia | Versão |
|---|---|---|
| Backend | NestJS | ^10 |
| ORM | Prisma | ^5 |
| Banco | PostgreSQL | 16 |
| Auth | JWT + Argon2 | — |
| Frontend | React + Vite | ^18 / ^5 |
| Estado | Zustand | ^4 |
| Cache/Fetch | React Query | ^5 |
| Gráficos | Recharts | ^2 |
| PWA | vite-plugin-pwa | ^0.20 |
| Monorepo | Turborepo | ^1 |
| Infra | Docker + Nginx | — |

---

## Setup local

### Pré-requisitos

- Node.js 18+
- Docker 24+

### Passos

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com seu editor

# 3. Subir o banco de dados
docker-compose up postgres -d

# 4. Rodar migrations e seed
cd apps/api
npm run db:migrate
npm run db:seed
cd ../..

# 5. Iniciar todos os serviços
npm run dev
```

| Serviço | URL |
|---|---|
| API | http://localhost:3000 |
| Swagger | http://localhost:3000/docs |
| Web | http://localhost:5173 |

### Subir tudo com Docker

```bash
cp .env.example .env
docker-compose up -d

# Seed (rodar uma vez após os containers subirem)
docker exec ponto_api sh -c "cd /app && npm run db:seed"
```

### Comandos úteis

```bash
npm run dev           # API + Web em paralelo
npm run api           # Apenas API (watch mode)
npm run web           # Apenas frontend
npm run db:migrate    # Criar nova migration
npm run db:seed       # Popular banco com dados iniciais
npm run db:studio     # Abrir Prisma Studio (GUI)
npm run build         # Build de produção
docker-compose logs -f api   # Acompanhar logs da API
```

---

## Deploy gratuito

A combinação **Neon + Render + Vercel** hospeda o sistema sem custo.

> **Limitação:** Render hiberna a API após 15 min sem requisições. A primeira request após hibernação demora ~30s. Para uso em academia com horários fixos, isso raramente é um problema.

### 1 — Banco (Neon)

1. Criar conta em [neon.tech](https://neon.tech)
2. Criar projeto → copiar `DATABASE_URL`

### 2 — API (Render)

1. [render.com](https://render.com) → New Web Service → conectar repositório
2. Configurar:

```
Root Directory:  apps/api
Build Command:   npm install && npx prisma generate && npm run build
Start Command:   npx prisma migrate deploy && node dist/main
```

3. Adicionar variáveis de ambiente:

```
DATABASE_URL      = (URL do Neon)
JWT_SECRET        = (openssl rand -hex 32)
JWT_EXPIRES_IN    = 15m
NODE_ENV          = production
CORS_ORIGINS      = https://seu-app.vercel.app
```

### 3 — Web (Vercel)

1. [vercel.com](https://vercel.com) → Add New Project → importar repositório
2. Configurar:

```
Root Directory:  apps/web
Build Command:   npm run build
Output:          dist
```

3. Adicionar variável:

```
VITE_API_URL = https://sua-api.onrender.com/api/v1
```

### 4 — Seed

```bash
# Localmente, apontando para o banco remoto
cd apps/api
DATABASE_URL="postgresql://..." npm run db:seed
```

---

## Variáveis de ambiente

Copie `.env.example` e preencha:

```bash
cp .env.example .env
```

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | Sim | Connection string PostgreSQL |
| `JWT_SECRET` | Sim | Mínimo 32 chars aleatórios (`openssl rand -hex 32`) |
| `JWT_EXPIRES_IN` | Não | Padrão: `15m` |
| `POSTGRES_PASSWORD` | Sim* | Apenas no docker-compose |
| `CORS_ORIGINS` | Sim | Domínio do frontend (produção) |
| `NODE_ENV` | Não | `production` desativa logs de query |
| `VITE_API_URL` | Sim | URL da API para o frontend |

> Nunca commitar o arquivo `.env`. O `.gitignore` já o exclui.

---

## API

Base URL: `/api/v1`  
Autenticação: `Authorization: Bearer <accessToken>`  
Documentação interativa: `/docs` (Swagger UI)

### Autenticação

```
POST /auth/login      { email, password } → { accessToken, refreshToken }
POST /auth/refresh    { refreshToken }    → { accessToken, refreshToken }
POST /auth/logout     { refreshToken }
```

### Ponto

```
POST /time-entries/punch            Registrar ponto
GET  /time-entries/status           Status do dia (próximo tipo + registros)
GET  /time-entries/my               Meus registros
GET  /time-entries/employee/:id     [Admin] Registros de um funcionário
```

### Relatórios

```
GET /reports/my/:year/:month                   Meu relatório mensal
GET /reports/employee/:id/:year/:month         [Admin] Por funcionário
GET /reports/all/:year/:month                  [Admin] Todos os funcionários
GET /reports/export/xlsx/:id/:year/:month      [Admin] Exportar XLSX
```

### Funcionários

```
GET    /employees           [Admin] Listar
POST   /employees           [Admin] Criar
GET    /employees/:id       [Admin] Detalhe
PATCH  /employees/:id       [Admin] Atualizar
DELETE /employees/:id       [Admin] Desativar (soft delete)
```

### Demais

```
POST /adjustments           [Admin] Ajustar registro de ponto
GET  /adjustments/entry/:id [Admin] Histórico de ajustes
POST /schedules             [Admin] Definir escala de trabalho
GET  /schedules/:employeeId [Admin] Escala ativa
GET  /audit                 [Admin] Logs de auditoria paginados
```

---

## PWA — Instalar no celular

### iPhone / Safari

1. Abrir o link no Safari
2. Tocar em **Compartilhar** (ícone de seta)
3. Tocar em **Adicionar à Tela de Início**
4. Confirmar

### Android / Chrome

1. Abrir o link no Chrome
2. Tocar em **⋮** → **Instalar app**

Após instalado, o sistema aparece como app nativo na tela inicial, sem barra do browser, em tela cheia.

---

## Banco de dados

### Tabelas

| Tabela | Descrição |
|---|---|
| `employees` | Usuários do sistema (admins e funcionários) |
| `refresh_tokens` | Sessões ativas com rotação automática |
| `time_entries` | Registros de ponto (entrada, intervalo, saída) |
| `adjustments` | Correções manuais com rastreabilidade |
| `work_schedules` | Escala de trabalho por funcionário |
| `audit_logs` | Log imutável de todas as alterações |

### Migrations

```bash
# Desenvolvimento
cd apps/api
npm run db:migrate      # Cria e aplica migration
npm run db:studio       # Abre GUI do banco

# Produção
npm run db:deploy       # Aplica migrations sem criar novas
```

---

## Regras de negócio

### Sequência de registros

Os tipos de ponto seguem ordem obrigatória. A API rejeita qualquer registro fora de sequência.

```
CLOCK_IN → BREAK_START → BREAK_END → CLOCK_OUT
```

### Cálculos (todos no backend)

```
Horas trabalhadas = (BREAK_START − CLOCK_IN) + (CLOCK_OUT − BREAK_END)
Horas extras      = max(0, trabalhado − esperado_pela_escala)
Atraso            = max(0, CLOCK_IN − expected_start)
Banco de horas    = Σ(trabalhado − esperado) no mês
Falta             = dia útil sem nenhum CLOCK_IN
```

> O frontend nunca calcula horas. Apenas exibe o que a API retorna.

---

## Segurança

| Controle | Implementação |
|---|---|
| Hash de senhas | Argon2id |
| Access token | JWT, expira em 15 min |
| Refresh token | UUID opaco, rotativo, expira em 30 dias |
| Autorização | RBAC por guards NestJS (ADMIN / EMPLOYEE) |
| Rate limiting | 100 req/min por IP |
| Validação | class-validator com whitelist — campos extras rejeitados |
| CORS | Lista de origens configurável por variável de ambiente |
| Auditoria | Toda escrita gera log com snapshot antes/depois |

---

## Licença

Uso interno. Todos os direitos reservados.
