# ONYX System

Sistema de Gestão Pessoal Tático - Operação Bruce Wayne.

## Setup Local

1. Instalar dependências:
   ```bash
   npm install
   ```

2. Rodar servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Build de Produção (Teste antes de deploy):
   ```bash
   npm run build
   npm run preview
   ```

## Deploy na Vercel

Este projeto está configurado para deploy zero-config na Vercel, mas garanta que as configurações do projeto na dashboard da Vercel sejam:

- **Framework Preset:** Vite
- **Root Directory:** `./`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

O arquivo `vercel.json` na raiz garante que o roteamento SPA funcione corretamente (sem erro 404 ao recarregar páginas internas).
