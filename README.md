# Mapa de Oportunidade

## Portal do Clube Comuna

A página editorial do clube foi acrescentada em `/clube`, com a lista de pessoas em `/clube/integrantes`; o dashboard original continua disponível em `/`. Execute `npm install` e `npm run dev` e abra `http://localhost:5173/clube`.

O portal contém manifesto, indicações, três votações, cadastro de perfil, página de integrantes, indicação de livros por consulta a catálogos, e um painel administrativo demonstrativo para o endereço indicado no código. O painel mostra votos e nomes, permite editar integrantes/livros e encerrar a votação. A conclusão registra o livro escolhido no topo da página. Os resumos, temas e páginas são vinculados às edições pesquisadas; a consulta usa Google Books e, quando necessário, Open Library. Os valores do Google Books podem ser de e-book; quando o catálogo não fornece preço em reais, o portal exibe “Consultar preço”. As capas consultadas pelo ISBN ficam em molduras iguais; se uma edição não tiver capa encontrada, a interface mostra um espaço identificado em vez de inventar uma capa. “Livros de Mark Fisher” continua sem obra específica. O menu termina em **Login**; após entrar, o perfil oferece um menu recolhível para escolher foto e descrição. As opções de compra destacam a busca na Estante Virtual para comparar edições usadas e preços.

**Limite de persistência e acesso:** o projeto não inclui serviço de backend nem credenciais de banco. Perfis, fotos comprimidas, descrições, livros indicados e votos ficam em `localStorage` e aparecem apenas neste navegador. O painel verifica o e-mail digitado (`vivian3012@gmail.com`), mas esse formulário não autentica a identidade; qualquer pessoa pode digitar esse endereço. Não use o painel como administração segura nem os dados locais como apuração real. Para compartilhar membros/votos entre dispositivos e proteger o painel, é necessário provisionar backend, autenticação real, armazenamento de imagens, políticas de leitura/escrita e validação no servidor.

As consultas do formulário são feitas diretamente pelo navegador. Google Books fornece ficha bibliográfica e, quando disponível, sinopse, páginas, imagens de capa e preço e-book por região; Open Library é usado como fallback para metadados de edição e capa. A busca não garante resumo ou preço para todo título; a pessoa que indica pode revisar os dados, completar o resumo e informar os valores pendentes. A confirmação de uma edição depende da escolha manual entre os resultados.

Para votação coletiva e perfis compartilhados reais, é necessário provisionar backend (por exemplo, Supabase), autenticação de verdade, armazenamento de imagens, políticas de leitura/escrita e validação no servidor. Nenhuma senha ou credencial administrativa foi adicionada ao frontend. Até essa integração, não há área administrativa segura, sincronização entre dispositivos nem prevenção de duplicidade entre navegadores.

Referências consultadas para confirmar edições e metadados:

- [Como as democracias morrem — Companhia das Letras](https://www.companhiadasletras.com.br/livro/9788537818008/)
- [O pobre de direita — Editora Record](https://www.record.com.br/products/o-pobre-de-direita)
- [Necropolítica — Livraria Travessa](https://www.travessa.com.br/necropolitica/artigo/d0f6ad04-c238-4f81-a7f4-790fe5a72596)
- [A história do Brasil para quem tem pressa — Editora Valentina](https://editoravalentina.com.br/livro/265/a-historia-do-brasil-para-quem-tem-pressa)
- [Ruptura — Companhia das Letras](https://www.companhiadasletras.com.br/9788537817643-ruptura/p)
- [A sociedade de controle — ficha de edição Hedra](https://orelhadelivro.com.br/a-sociedade-de-controle-manipulacao-e-modulacao-nas-redes-digitais-2-edicao)
- [A linguagem do império — Boitempo](https://www.boitempoeditorial.com.br/produto/a-linguagem-do-imperio-152411)
- [Custe o que custar — Ubu](https://www.ubueditora.com.br/custe-o-que-custar.html)
- [Pele negra, máscaras brancas — Ubu](https://www.ubueditora.com.br/pele-negra-mascaras-brancas.html)
- [1984 — Companhia das Letras](https://www.companhiadasletras.com.br/livro/9788535914849/1984)
- [Google Books API — consulta e ficha de volumes](https://developers.google.com/books/docs/v1/reference/volumes/list)
- [Open Library Search API — resultados e capas](https://openlibrary.org/dev/docs/api/search)

Dashboard de inteligência geográfica para operação de delivery. A aplicação usa React, Vite, Leaflet/OpenStreetMap e Recharts. O projeto original estava vazio. Agora inclui dados agregados de uma exportação Genie da Colômbia, além do modo de demonstração sintético de São Paulo.

## Executar localmente

Requer Node.js 18 ou superior.

```sh
npm install
npm run dev
```

Abra o endereço indicado pelo Vite. Use o filtro de país para alternar entre a demonstração do Brasil e os dados exportados da Colômbia. Para gerar o pacote de produção: `npm run build`. Para os testes unitários: `npm test`.

## O que funciona nesta versão

- Mapa navegável com zoom, círculos agregados clicáveis, tooltip, seleção de região e legenda dependente da camada.
- Camadas alternáveis: demanda, cancelamentos, tempo de entrega, atrasos, cobertura e expansão.
- Busca por região, períodos de hoje/7/30 dias e status sincronizam a lista, KPIs e pontos visíveis. Hoje e 30 dias projetam os volumes sintéticos a partir da amostra de 7 dias; “Personalizado” permanece na janela de 7 dias. A demonstração cobre somente São Paulo.
- KPIs com denominadores explícitos para taxas, histórico ilustrativo e painel detalhado da região.
- Lista de oportunidades com motivo, indicador, referência e prioridade explicáveis. Limiares da demonstração estão descritos em `src/metrics.js`.
- A interface diferencia dados sintéticos e o export Genie fornecido. O modo Colômbia usa coordenadas e polígonos presentes nos CSVs.
- As camadas operacionais usam métricas por local de loja. A camada de cobertura exibe os polígonos de lojas ativas com geometria válida.
- Busca, cidade, período e status sincronizam pontos, KPIs, série temporal e oportunidades. “Hoje” é o último dia do export; os períodos de 7 e 30 dias terminam em 21 out 2026. A Colômbia também permite escolher datas dentro da janela exportada; “Personalizado” inicia nos últimos 7 dias.
- A taxa de cancelamento usa cancelados + expirados sobre `total_orders`, equivalente ao `cancel_rate` exportado. Volume é `valid_orders`. Atrasos usam `late_orders_sla_35 / valid_orders`; o SLA observado é 35 min. Tempo médio é ponderado por `valid_orders_with_delivery_time`.
- O P90 consolidado fica indisponível entre várias datas ou locais, pois não se pode combinar percentis pré-agregados por média. No painel da região, o P90 só aparece para um único dia/local.
- Oportunidades da Colômbia comparam cada local à taxa da cidade. Sinaliza-se valor acima de 1,5× a média ou pelo menos 2 pontos percentuais acima, com no mínimo 100 pedidos válidos; prioridade alta começa em 2×. São regras relativas da interface, não metas corporativas. A próxima ação é investigativa.
- Cobertura disponível não é tratada como prova de demanda não atendida. Não há nos arquivos um sinal de demanda potencial ou efeito estimado para expansão.

## Dados e integração corporativa

`src/data.js` contém a demonstração do Brasil. `src/colombiaData.json` é uma versão normalizada dos CSVs locais e carrega no navegador como um arquivo separado. Os arquivos fornecidos pelo usuário estão preservados em `data/colombia/`. A aplicação não tem credenciais, consultas autenticadas ou conexão ao vivo com Databricks Genie; a interface identifica o conjunto colombiano como export estático e mostra a data final 21 out 2026. Os tiles cartográficos vêm do OpenStreetMap e precisam de acesso à internet no navegador.

`config/genie-field-mapping.example.json` registra o mapeamento aplicado e as limitações. Para ligar a fonte real em atualização futura:

1. Confirmar com a equipe de dados o mecanismo corporativo autorizado para consultar Genie/Databricks, o endpoint/compute permitido e as permissões de leitura. Não presumir que existe endpoint de Genie universal.
2. Obter acesso a agregações por região e período, sem identificadores pessoais ou coordenadas de clientes. Preferir polígonos oficiais ou centroides operacionais autorizados.
3. Atualizar os CSVs em `data/colombia/` e executar `npm run data:colombia` para reconstruir o JSON normalizado. Confirmar definições de denominadores, SLA, fusos, cancelamentos, pedidos em andamento, duplicidades e tempos inválidos com a equipe dona dos dados.
4. Implementar um adaptador no servidor (por exemplo, endpoint da aplicação) para manter credenciais fora do navegador e devolver somente métricas agregadas. Configurar segredos pelo mecanismo aprovado; não os comitar.
5. Executar consulta real de validação antes de alterar o estado visual de demonstração para conectado.

Não há credenciais, permissões ou consultas vivas disponíveis neste projeto. Os nomes de campo e definições acima foram conferidos nos CSVs recebidos; devem ser reconfirmados com a fonte corporativa antes de produção.

## Arquitetura

- `src/data.js`: fixture sintética separada.
- `src/colombia.js`: carregamento e agregação da exportação Genie no navegador.
- `scripts/prepare_colombia.py`: transformação reproduzível dos CSVs para JSON.
- `src/metrics.js`: agregações centrais e regras demonstrativas/relativas.
- `src/App.jsx`: filtros, estado compartilhado, mapa, gráficos, KPIs e detalhes.
- `src/styles.css`: interface responsiva.

Para produção, extraia contratos TypeScript e um `DataProvider` assíncrono, com cache aprovado. Consultas devem retornar agregações por região; não carregar pedidos individuais no navegador. A versão atual já carrega as linhas agregadas de CSV, sem IDs de pedido ou dados pessoais.
