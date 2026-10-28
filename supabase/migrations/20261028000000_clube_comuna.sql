-- Clube Comuna: shared authentication, profiles, books, ballots, and avatar storage.
-- Run this migration in the Supabase SQL Editor or with `supabase db push`.

create or replace function public.is_club_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select lower(coalesce((select auth.jwt()) ->> 'email', '')) = 'vivian3012@gmail.com';
$$;

revoke all on function public.is_club_admin() from public;
grant execute on function public.is_club_admin() to anon, authenticated;

create table if not exists public.club_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  bio text not null default '' check (char_length(bio) <= 500),
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.club_books (
  id text primary key,
  details jsonb not null check (jsonb_typeof(details) = 'object'),
  sort_order integer not null default 10000,
  suggested_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.club_books (id, details, sort_order) values
  ('ruptura', '{"id":"ruptura","title":"Ruptura","author":"Manuel Castells","isbn":"9788537817643","cover":"https://i.zst.com.br/thumbs/12/3c/36/1458413839.jpg","tag":"Democracia","tags":["Crise de representação","Instituições","Movimentos sociais"],"description":"Castells parte da perda de confiança nas instituições e da distância entre governantes e governados para examinar a crise da democracia liberal. Com exemplos de diferentes países, relaciona transformações econômicas, protestos e novas formas de participação política, perguntando que modelos podem suceder a representação em crise.","pages":"152","price":"R$ 72,90*","href":"https://www.travessa.com.br/ruptura-a-crise-da-democracia/artigo/22c05820-8cb6-4b21-99fc-c0d7f1a87dbd","stamp":"01","verify":"Edição identificada: “Ruptura: a crise da democracia”, Zahar, 2018.","color":"red"}'::jsonb, 1),
  ('controle', '{"id":"controle","title":"A sociedade de controle","author":"Joyce Souza Maldonado, Rodolfo Avelino e Sérgio Amadeu da Silveira","isbn":"9786589705192","cover":"https://www.hedra.com.br/cdn/shop/files/Joyce-Souza-Rodolfo-Avelino-Sergio-Amadeu_A-sociedade-do-controle_capa.jpg?v=1762892807&width=1200","tag":"Tecnologia & poder","tags":["Vigilância","Algoritmos","Sociedade digital"],"description":"A coletânea investiga como plataformas digitais e sistemas algorítmicos modulam comportamentos, opiniões e escolhas. Em diálogo com Deleuze, Foucault e outros pensadores, os textos discutem a passagem de formas disciplinares de poder para mecanismos contínuos de controle nas redes. A indicação parece corresponder a esta coletânea da Hedra; vale confirmar com quem a sugeriu.","pages":"160","price":"Consultar preço","href":"https://www.hedra.com.br/collections/que-horas-sao/products/a-sociedade-de-controle","stamp":"02","verify":"Edição provável: “A sociedade de controle: manipulação e modulação nas redes digitais”, Hedra, 2ª edição, 2021.","color":"cream"}'::jsonb, 2),
  ('democracias', '{"id":"democracias","title":"Como as democracias morrem","author":"Steven Levitsky e Daniel Ziblatt","isbn":"9788537818008","cover":"https://ciadasletras.vtexassets.com/arquivos/ids/217779/capa-recolor2-9788537818008.jpg?v=639238600717330000","tag":"Democracia","tags":["Autoritarismo","Instituições","Polarização"],"description":"Os cientistas políticos comparam experiências históricas para explicar como líderes eleitos podem enfraquecer democracias por dentro. O livro acompanha sinais de alerta, como ataques às regras do jogo, à legitimidade dos adversários e às liberdades civis, e discute o papel das instituições e das normas informais na contenção do autoritarismo.","pages":"272","price":"R$ 79,90*","href":"https://www.companhiadasletras.com.br/livro/9788537818008/","stamp":"03","color":"dark"}'::jsonb, 3),
  ('brasil', '{"id":"brasil","title":"A história do Brasil para quem tem pressa","author":"Marcos Costa","isbn":"9788558890144","cover":"https://editoravalentina.com.br/assets/img/livro/imagem-livro-brasil-1480513402.png","tag":"História do Brasil","tags":["Colonização","Formação do Estado","História política"],"description":"Um panorama conciso e ilustrado acompanha processos que formaram o Brasil, dos bastidores da colonização à crise política de 2015. Marcos Costa aborda temas como capitanias hereditárias, escravidão, fragilidade política e a relação entre riqueza natural e bem-estar social. É uma introdução panorâmica, não um estudo aprofundado de cada período.","pages":"200","price":"R$ 54,90*","href":"https://editoravalentina.com.br/livro/265/a-historia-do-brasil-para-quem-tem-pressa","stamp":"04","color":"green"}'::jsonb, 4),
  ('pobre', '{"id":"pobre","title":"O pobre de direita","author":"Jessé Souza","isbn":"9786558021551","cover":"/capas/o-pobre-de-direita.png","tag":"Sociedade brasileira","tags":["Classe social","Racismo","Conservadorismo"],"description":"Jessé Souza propõe uma interpretação da adesão popular à extrema direita no Brasil, examinando classe, raça, religião, ressentimento e diferenças regionais. A obra questiona explicações limitadas à renda ou aos costumes e discute como grupos empobrecidos podem apoiar projetos políticos que, segundo o autor, restringem direitos e reproduzem hierarquias sociais.","pages":"224","price":"Consultar preço","href":"https://www.record.com.br/products/o-pobre-de-direita","stamp":"05","color":"cream"}'::jsonb, 5),
  ('fisher', '{"id":"fisher","title":"Livros de Mark Fisher","author":"Mark Fisher","tag":"Cultura & política","tags":["Capitalismo","Cultura pop","Saúde mental"],"description":"Indicação coletiva ainda sem obra definida. Mark Fisher escreveu sobre realismo capitalista, cultura popular, trabalho, desejo e saúde mental sob o capitalismo tardio. “Realismo capitalista” é uma possibilidade conhecida para o grupo considerar, mas não é tratado aqui como o livro originalmente indicado.","pages":"A definir","price":"Consultar preço","href":"","stamp":"06","verify":"O grupo precisa escolher uma obra específica antes de votar ou consultar páginas e preços.","color":"red"}'::jsonb, 6),
  ('necro', '{"id":"necro","title":"Necropolítica","author":"Achille Mbembe","isbn":"9788566943504","cover":"https://n-1edicoes.org/wp-content/uploads/2023/08/necropolitica0.jpg","tag":"Poder & vida","tags":["Colonialismo","Soberania","Violência de Estado"],"description":"Neste ensaio, Mbembe desenvolve os conceitos de necropolítica e necropoder para analisar como formas contemporâneas de soberania decidem quais populações podem viver e quais são expostas à morte. Em diálogo crítico com a noção de biopoder, percorre relações entre colonialismo, violência, resistência, sacrifício e terror.","pages":"80","price":"R$ 54,60*","href":"https://n-1edicoes.org/publicacoes/necropolitica/","stamp":"07","color":"dark"}'::jsonb, 7),
  ('imperio', '{"id":"imperio","title":"A linguagem do império","author":"Domenico Losurdo","isbn":"9788575591628","cover":"https://boitempoeditorial.fbitsstatic.net/img/p/a-linguagem-do-imperio-152411/338062.jpg?h=420&v=202608041103&w=290","tag":"Geopolítica","tags":["Imperialismo","Ideologia","Política externa"],"description":"Losurdo analisa a linguagem política usada para apresentar a hegemonia dos Estados Unidos como universal e legítima. Examina termos como “terrorismo”, “fundamentalismo” e “antiamericanismo” como categorias mobilizadas para nomear adversários e justificar intervenções. A obra relaciona escolhas de vocabulário a disputas históricas e à política externa.","pages":"304","price":"R$ 77,00*","href":"https://www.boitempoeditorial.com.br/produto/a-linguagem-do-imperio-152411","stamp":"08","verify":"Título completo: “A linguagem do império: léxico da ideologia estadunidense”.","color":"green"}'::jsonb, 8),
  ('malcolm', '{"id":"malcolm","title":"Custe o que custar","author":"Malcolm X","isbn":"9788571262188","cover":"https://19930cd4.rocketcdn.me/wp-content/uploads/2025/05/capa-custe-o-que-custar.jpg","tag":"Luta antirracista","tags":["Autodefesa","Anticolonialismo","Internacionalismo"],"description":"Coletânea de discursos, entrevistas e declarações do último ano de vida de Malcolm X, após sua ruptura com a Nação do Islã. Os textos mostram a transformação de sua visão política e articulam luta negra nos Estados Unidos, autodefesa, solidariedade entre povos oprimidos, anticolonialismo e denúncia internacional das violações de direitos humanos.","pages":"256","price":"R$ 79,90*","href":"https://www.ubueditora.com.br/custe-o-que-custar.html","stamp":"09","verify":"Organização de George Breitman; tradução de Rogério Galindo. Edição Ubu, 2025.","color":"red"}'::jsonb, 9),
  ('fanon', '{"id":"fanon","title":"Pele negra, máscaras brancas","author":"Frantz Fanon","isbn":"9786586497205","cover":"https://www.ubueditora.com.br/pub/media/catalog/product/cache/23ace5a67f8fffaa1ceb5cc9180b26d7/u/b/ubu0003_1.jpg","tag":"Pensamento anticolonial","tags":["Racismo","Psicanálise","Colonialismo","Identidade"],"description":"Fanon examina como o racismo colonial atravessa a linguagem, o desejo, a vida cotidiana e a formação da subjetividade. A análise combina filosofia, psicanálise, literatura e experiência histórica para discutir a interiorização da inferioridade racial e as relações entre pessoas negras e brancas. A edição da Ubu acrescenta textos de apoio que ampliam a conversa contemporânea sobre a obra.","pages":"320","price":"R$ 79,90*","href":"https://www.ubueditora.com.br/pele-negra-mascaras-brancas.html","stamp":"10","verify":"Edição Ubu de 2020, com prefácio, posfácio e textos complementares; outras edições têm paginação diferente.","color":"dark"}'::jsonb, 10),
  ('1984', '{"id":"1984","title":"1984","author":"George Orwell","isbn":"9788535914849","cover":"https://ciadasletras.vtexassets.com/arquivos/ids/185860/cdl-9788535914849.jpg?v=639192109808600000","tag":"Distopia política","tags":["Totalitarismo","Vigilância","Propaganda","Linguagem"],"description":"Na Oceânia, Winston Smith trabalha reescrevendo documentos para um regime que controla informação, memória e vida privada. Sua busca por verdade e autonomia entra em choque com a vigilância do Grande Irmão, a manipulação da linguagem e a repressão política. A distopia pergunta como o poder pode deformar a realidade e tornar a resistência quase impossível.","pages":"416","price":"R$ 47,90*","href":"https://www.companhiadasletras.com.br/livro/9788535914849/1984","stamp":"11","verify":"Edição Companhia das Letras, tradução de Heloisa Jahn e Alexandre Hubner; outras edições variam.","color":"cream"}'::jsonb, 11)
on conflict (id) do nothing;

create table if not exists public.club_votes (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('book', 'place')),
  value text not null check (char_length(value) between 1 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, kind)
);

create table if not exists public.club_date_availability (
  user_id uuid not null references auth.users (id) on delete cascade,
  option_value text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, option_value)
);

create table if not exists public.club_config (
  id smallint primary key default 1 check (id = 1),
  status jsonb not null default '{"book":"open","place":"open","date":"open"}'::jsonb,
  deadlines jsonb not null default '{"book":"A definir","place":"A definir","date":"A definir"}'::jsonb,
  results jsonb not null default '{"book":false,"place":false,"date":false}'::jsonb,
  date_options text[] not null default '{}',
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  finalized_book_id text,
  updated_at timestamptz not null default now()
);

insert into public.club_config (id) values (1) on conflict (id) do nothing;

create or replace function public.touch_club_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists club_profiles_touch_updated_at on public.club_profiles;
create trigger club_profiles_touch_updated_at before update on public.club_profiles
for each row execute function public.touch_club_updated_at();

drop trigger if exists club_books_touch_updated_at on public.club_books;
create trigger club_books_touch_updated_at before update on public.club_books
for each row execute function public.touch_club_updated_at();

drop trigger if exists club_votes_touch_updated_at on public.club_votes;
create trigger club_votes_touch_updated_at before update on public.club_votes
for each row execute function public.touch_club_updated_at();

create or replace function public.create_club_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.club_profiles (id, display_name)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(coalesce(new.email, 'integrante'), '@', 1)), 80)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_club_profile on auth.users;
create trigger on_auth_user_created_club_profile
after insert on auth.users
for each row execute function public.create_club_profile_for_new_user();

alter table public.club_profiles enable row level security;
alter table public.club_books enable row level security;
alter table public.club_votes enable row level security;
alter table public.club_date_availability enable row level security;
alter table public.club_config enable row level security;

revoke all on table public.club_profiles, public.club_books, public.club_votes,
  public.club_date_availability, public.club_config from public, anon, authenticated;

grant select on table public.club_profiles, public.club_books, public.club_votes,
  public.club_date_availability, public.club_config to anon, authenticated;
grant insert (id, display_name, bio, avatar_url) on public.club_profiles to authenticated;
grant update (display_name, bio, avatar_url) on public.club_profiles to authenticated;
grant insert (id, details, sort_order, suggested_by) on public.club_books to authenticated;
grant update (details, sort_order) on public.club_books to authenticated;
grant delete on public.club_books to authenticated;

drop policy if exists "Public can view active club profiles" on public.club_profiles;
create policy "Public can view active club profiles"
on public.club_profiles for select to anon, authenticated
using (is_active or (select public.is_club_admin()));

drop policy if exists "Users can create their own club profile" on public.club_profiles;
create policy "Users can create their own club profile"
on public.club_profiles for insert to authenticated
with check ((select auth.uid()) = id and is_active);

drop policy if exists "Users and admin can update club profiles" on public.club_profiles;
create policy "Users and admin can update club profiles"
on public.club_profiles for update to authenticated
using ((select auth.uid()) = id or (select public.is_club_admin()))
with check ((select auth.uid()) = id or (select public.is_club_admin()));

drop policy if exists "Anyone can read the book catalog" on public.club_books;
create policy "Anyone can read the book catalog"
on public.club_books for select to anon, authenticated using (true);

drop policy if exists "Members can suggest books for themselves" on public.club_books;
create policy "Members can suggest books for themselves"
on public.club_books for insert to authenticated
with check (
  (select auth.uid()) = suggested_by
  and exists (select 1 from public.club_profiles p where p.id = (select auth.uid()) and p.is_active)
);

drop policy if exists "Admin can edit books" on public.club_books;
create policy "Admin can edit books"
on public.club_books for update to authenticated
using ((select public.is_club_admin()))
with check ((select public.is_club_admin()));

drop policy if exists "Admin can remove books" on public.club_books;
create policy "Admin can remove books"
on public.club_books for delete to authenticated
using ((select public.is_club_admin()));

drop policy if exists "Anyone can read named vote records" on public.club_votes;
create policy "Anyone can read named vote records"
on public.club_votes for select to anon, authenticated using (true);

drop policy if exists "Anyone can read date availability" on public.club_date_availability;
create policy "Anyone can read date availability"
on public.club_date_availability for select to anon, authenticated using (true);

drop policy if exists "Anyone can read club settings" on public.club_config;
create policy "Anyone can read club settings"
on public.club_config for select to anon, authenticated using (true);

create or replace function public.seed_club_books(p_books jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  item record;
  inserted_count integer := 0;
begin
  if not public.is_club_admin() then raise exception 'Somente a administração pode inicializar o catálogo.' using errcode = '42501'; end if;
  if jsonb_typeof(p_books) <> 'array' then raise exception 'O catálogo inicial precisa ser uma lista.'; end if;
  if exists (select 1 from public.club_books) then return 0; end if;

  for item in select value, ordinality from jsonb_array_elements(p_books) with ordinality as source(value, ordinality)
  loop
    if nullif(item.value ->> 'id', '') is not null then
      insert into public.club_books (id, details, sort_order)
      values (item.value ->> 'id', item.value, item.ordinality::integer)
      on conflict (id) do nothing;
      if found then inserted_count := inserted_count + 1; end if;
    end if;
  end loop;
  return inserted_count;
end;
$$;

create or replace function public.cast_club_vote(p_kind text, p_value text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  poll_status text;
begin
  if auth.uid() is null then raise exception 'Entre no clube para votar.' using errcode = '42501'; end if;
  if p_kind not in ('book', 'place') then raise exception 'Tipo de votação inválido.'; end if;
  if not exists (select 1 from public.club_profiles where id = auth.uid() and is_active) then
    raise exception 'Este perfil não está ativo no clube.' using errcode = '42501';
  end if;
  select status ->> p_kind into poll_status from public.club_config where id = 1;
  if poll_status is distinct from 'open' then raise exception 'Esta votação está encerrada.'; end if;
  if p_kind = 'book' and not exists (select 1 from public.club_books where id = p_value) then
    raise exception 'Este livro não está mais no catálogo.';
  end if;
  if nullif(trim(p_value), '') is null then raise exception 'Escolha uma opção para votar.'; end if;

  insert into public.club_votes (user_id, kind, value)
  values (auth.uid(), p_kind, trim(p_value))
  on conflict (user_id, kind) do update set value = excluded.value, updated_at = now();
end;
$$;

create or replace function public.set_club_date_availability(p_options text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  available_options text[];
  poll_status text;
begin
  if auth.uid() is null then raise exception 'Entre no clube para registrar disponibilidade.' using errcode = '42501'; end if;
  if not exists (select 1 from public.club_profiles where id = auth.uid() and is_active) then
    raise exception 'Este perfil não está ativo no clube.' using errcode = '42501';
  end if;
  select date_options, status ->> 'date' into available_options, poll_status from public.club_config where id = 1;
  if poll_status is distinct from 'open' then raise exception 'A votação de datas está encerrada.'; end if;
  if exists (select 1 from unnest(coalesce(p_options, '{}')) requested(value) where not (requested.value = any(coalesce(available_options, '{}')))) then
    raise exception 'Uma das opções de data não está disponível.';
  end if;
  delete from public.club_date_availability where user_id = auth.uid();
  insert into public.club_date_availability (user_id, option_value)
  select auth.uid(), distinct_options.value
  from (select distinct value from unnest(coalesce(p_options, '{}')) as options(value)) distinct_options;
end;
$$;

create or replace function public.admin_save_club_config(
  p_status jsonb,
  p_deadlines jsonb,
  p_results jsonb,
  p_date_options text[],
  p_history jsonb,
  p_finalized_book_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_club_admin() then raise exception 'Acesso restrito à administração.' using errcode = '42501'; end if;
  if jsonb_typeof(p_status) <> 'object' or jsonb_typeof(p_deadlines) <> 'object'
     or jsonb_typeof(p_results) <> 'object' or jsonb_typeof(p_history) <> 'array' then
    raise exception 'Configuração inválida.';
  end if;
  if exists (select 1 from jsonb_each_text(p_status) where key in ('book', 'place', 'date') and value not in ('open', 'closed')) then
    raise exception 'Status de votação inválido.';
  end if;
  update public.club_config
  set status = p_status,
      deadlines = p_deadlines,
      results = p_results,
      date_options = coalesce(p_date_options, '{}'),
      history = p_history,
      finalized_book_id = p_finalized_book_id,
      updated_at = now()
  where id = 1;
end;
$$;

create or replace function public.admin_finalize_book_vote(p_selected_book_id text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  max_votes bigint := 0;
  leader_count bigint := 0;
  unique_leader text;
  chosen_id text;
  chosen_title text;
  new_history jsonb;
begin
  if not public.is_club_admin() then raise exception 'Acesso restrito à administração.' using errcode = '42501'; end if;
  if not exists (select 1 from public.club_books where id = p_selected_book_id) then raise exception 'Livro escolhido não encontrado.'; end if;

  select coalesce(max(tally.n), 0) into max_votes
  from (select count(*) as n from public.club_votes where kind = 'book' group by value) tally;

  if max_votes > 0 then
    select count(*) into leader_count from (
      select value from public.club_votes where kind = 'book' group by value having count(*) = max_votes
    ) leaders;
    if leader_count = 1 then
      select value into unique_leader from public.club_votes where kind = 'book' group by value having count(*) = max_votes;
      chosen_id := unique_leader;
    else
      if not exists (select 1 from public.club_votes where kind = 'book' and value = p_selected_book_id group by value having count(*) = max_votes) then
        raise exception 'No empate, selecione um dos livros mais votados.';
      end if;
      chosen_id := p_selected_book_id;
    end if;
  else
    chosen_id := p_selected_book_id;
  end if;

  select details ->> 'title' into chosen_title from public.club_books where id = chosen_id;
  select jsonb_build_array(jsonb_build_object(
    'title', chosen_title,
    'date', to_char(current_date, 'DD/MM/YYYY'),
    'notes', 'Livro escolhido do mês após encerramento da votação.'
  )) || coalesce(jsonb_agg(history_rows.item), '[]'::jsonb)
  into new_history
  from public.club_config config,
       lateral jsonb_array_elements(config.history) as history_rows(item)
  where config.id = 1 and history_rows.item ->> 'title' <> chosen_title;

  if new_history is null then
    new_history := jsonb_build_array(jsonb_build_object(
      'title', chosen_title,
      'date', to_char(current_date, 'DD/MM/YYYY'),
      'notes', 'Livro escolhido do mês após encerramento da votação.'
    ));
  end if;

  update public.club_config
  set finalized_book_id = chosen_id,
      status = jsonb_set(status, '{book}', '"closed"'::jsonb, true),
      results = jsonb_set(results, '{book}', 'true'::jsonb, true),
      history = new_history,
      updated_at = now()
  where id = 1;
  return chosen_id;
end;
$$;

create or replace function public.admin_list_members()
returns table (
  id uuid,
  email text,
  display_name text,
  bio text,
  avatar_url text,
  is_active boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_club_admin() then raise exception 'Acesso restrito à administração.' using errcode = '42501'; end if;
  return query
  select p.id, u.email::text, p.display_name, p.bio, p.avatar_url, p.is_active, p.created_at
  from public.club_profiles p
  join auth.users u on u.id = p.id
  order by p.created_at desc;
end;
$$;

create or replace function public.admin_set_member_active(p_member_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_club_admin() then raise exception 'Acesso restrito à administração.' using errcode = '42501'; end if;
  if p_member_id = auth.uid() and not p_active then raise exception 'Não é possível remover o próprio perfil de administração.'; end if;
  update public.club_profiles set is_active = p_active where id = p_member_id;
  if not found then raise exception 'Integrante não encontrado.'; end if;
  if not p_active then
    delete from public.club_votes where user_id = p_member_id;
    delete from public.club_date_availability where user_id = p_member_id;
  end if;
end;
$$;

create or replace function public.admin_reset_ballots()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_club_admin() then raise exception 'Acesso restrito à administração.' using errcode = '42501'; end if;
  delete from public.club_votes;
  delete from public.club_date_availability;
  update public.club_config
  set results = '{"book":false,"place":false,"date":false}'::jsonb,
      history = '[]'::jsonb,
      finalized_book_id = null,
      updated_at = now()
  where id = 1;
end;
$$;

create or replace function public.remove_book_vote_records()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.club_votes where kind = 'book' and value = old.id;
  update public.club_config set finalized_book_id = null, updated_at = now() where id = 1 and finalized_book_id = old.id;
  return old;
end;
$$;

drop trigger if exists club_books_remove_vote_records on public.club_books;
create trigger club_books_remove_vote_records after delete on public.club_books
for each row execute function public.remove_book_vote_records();

revoke all on function public.seed_club_books(jsonb), public.cast_club_vote(text, text),
  public.set_club_date_availability(text[]), public.admin_save_club_config(jsonb, jsonb, jsonb, text[], jsonb, text),
  public.admin_finalize_book_vote(text), public.admin_list_members(),
  public.admin_set_member_active(uuid, boolean), public.admin_reset_ballots() from public, anon;
grant execute on function public.seed_club_books(jsonb), public.cast_club_vote(text, text),
  public.set_club_date_availability(text[]) to authenticated;
grant execute on function public.admin_save_club_config(jsonb, jsonb, jsonb, text[], jsonb, text),
  public.admin_finalize_book_vote(text), public.admin_list_members(),
  public.admin_set_member_active(uuid, boolean), public.admin_reset_ballots() to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('club-avatars', 'club-avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "Public can view club avatars" on storage.objects;
create policy "Public can view club avatars"
on storage.objects for select to anon, authenticated using (bucket_id = 'club-avatars');

drop policy if exists "Members can upload their own club avatar" on storage.objects;
create policy "Members can upload their own club avatar"
on storage.objects for insert to authenticated
with check (bucket_id = 'club-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Members can replace their own club avatar" on storage.objects;
create policy "Members can replace their own club avatar"
on storage.objects for update to authenticated
using (bucket_id = 'club-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'club-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Members can delete their own club avatar" on storage.objects;
create policy "Members can delete their own club avatar"
on storage.objects for delete to authenticated
using (bucket_id = 'club-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'club_profiles') then
      alter publication supabase_realtime add table public.club_profiles;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'club_books') then
      alter publication supabase_realtime add table public.club_books;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'club_votes') then
      alter publication supabase_realtime add table public.club_votes;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'club_date_availability') then
      alter publication supabase_realtime add table public.club_date_availability;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'club_config') then
      alter publication supabase_realtime add table public.club_config;
    end if;
  end if;
end;
$$;
