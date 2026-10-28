# Clube Comuna

Portal do Clube Comuna com autenticação por link de e-mail, perfis compartilhados, fotos no Supabase Storage, catálogo e votações sincronizados entre participantes.

## Configurar o Supabase

1. Crie um projeto no [Supabase](https://supabase.com/dashboard).
2. No **SQL Editor** do projeto, execute todo o arquivo [`supabase/migrations/20261028000000_clube_comuna.sql`](supabase/migrations/20261028000000_clube_comuna.sql). Ele cria as tabelas, regras RLS, funções de votação, o bucket público de avatares e o catálogo inicial.
3. Em **Project Settings → API**, copie o **Project URL** e a **Publishable key** (ou a chave `anon` legada). Nunca use `service_role` ou uma Secret key no navegador.
4. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
5. Em **Authentication → URL Configuration**, inclua `http://localhost:5173/clube` e o endereço público da Vercel como URLs permitidas de redirecionamento.
6. Em **Authentication → Email Templates**, mantenha um link de confirmação que use `{{ .ConfirmationURL }}`. O portal envia um link por e-mail; a pessoa precisa abri-lo para concluir o login.
7. Inicie localmente com `npm install` e `npm run dev`. Para publicar, adicione as mesmas duas variáveis no projeto Vercel, em **Settings → Environment Variables**, e publique um novo deployment.

O painel administrativo é autorizado no banco para o e-mail `vivian3012@gmail.com`. Entre com esse e-mail e confirme o link recebido. Na primeira entrada da administração, o catálogo inicial também é conferido e carregado caso ainda esteja vazio.

## Segurança e dados

- O cliente usa somente a Publishable/anon key. A segurança vem das políticas de Row Level Security e das funções SQL; nenhuma `service_role` fica no frontend.
- Os votos são associados ao ID autenticado e exibem o nome do perfil, sem expor o e-mail aos demais integrantes.
- Cada pessoa altera somente o próprio perfil e só pode enviar fotos para a própria pasta no bucket `club-avatars`.
- O painel de Vivian pode administrar catálogo, configurações, integrantes, resultados e encerramento da votação.
- O e-mail de login é confirmado por link mágico. Para desenvolvimento, o URL local precisa estar na lista de redirecionamento do Supabase.

## Desenvolvimento

```sh
npm install
npm run dev
npm run build
```
