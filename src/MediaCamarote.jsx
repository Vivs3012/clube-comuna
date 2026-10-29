import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Clapperboard, Film, Search, Sparkles, Trash2, Tv, X } from 'lucide-react';
import { supabase } from './supabase';

const kinds = [
  { value: 'all', label: 'Tudo', icon: Sparkles },
  { value: 'film', label: 'Filmes', icon: Film },
  { value: 'series', label: 'Séries', icon: Tv },
];

export default function MediaCamarote({ recommendations = [], members = [], currentUser, isAdmin, onLogin, onAdded }) {
  const [kindFilter, setKindFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('film');
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [genre, setGenre] = useState('');
  const [description, setDescription] = useState('');
  const [poster, setPoster] = useState('');
  const [source, setSource] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
    return recommendations.filter((item) => {
      const text = [item.title, item.genre, item.description, item.release_year].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
      return (kindFilter === 'all' || item.kind === kindFilter) && (!normalizedQuery || text.includes(normalizedQuery));
    });
  }, [recommendations, kindFilter, query]);

  async function addRecommendation(event) {
    event.preventDefault();
    setMessage('');
    if (!currentUser) {
      setMessage('Entre no perfil do clube para deixar sua indicação.');
      onLogin();
      return;
    }
    if (!supabase) {
      setMessage('O envio de indicações precisa da conexão com o Supabase.');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        title: title.trim(),
        kind,
        release_year: year ? Number(year) : null,
        genre: genre.trim(),
        description: description.trim(),
        poster_url: poster.trim() || null,
        source_url: source.trim() || null,
        recommended_by: currentUser.id,
      };
      const { data, error } = await supabase.from('club_media_recommendations').insert(payload).select('*').single();
      if (error) throw error;
      onAdded(data);
      setTitle('');
      setYear('');
      setGenre('');
      setDescription('');
      setPoster('');
      setSource('');
      setKindFilter('all');
      setQuery('');
      setMessage('Sua história entrou em cartaz!');
    } catch (error) {
      setMessage(error.message || 'Não foi possível salvar a indicação. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  async function removeRecommendation(item) {
    if (!supabase || !window.confirm(`Remover a indicação “${item.title}”?`)) return;
    setMessage('');
    try {
      const { error } = await supabase.from('club_media_recommendations').delete().eq('id', item.id);
      if (error) throw error;
    } catch (error) {
      setMessage(error.message || 'Não foi possível remover a indicação.');
    }
  }

  function recommenderName(item) {
    return members.find((member) => member.id === item.recommended_by)?.name || 'Integrante do clube';
  }

  return (
    <main className="cc-section cc-media-page">
      <section className="cc-media-stage">
        <div className="cc-media-stage-copy">
          <p className="cc-media-kicker"><Sparkles size={13} /> CLUBE COMUNA APRESENTA</p>
          <h1>CAMAROTE<br /><em>DAS HISTÓRIAS</em></h1>
          <p>Filmes e séries para abrir as cortinas de outros mundos — e continuar a conversa depois que as luzes se acendem.</p>
          <a href="#cc-media-list">Explorar indicações <ArrowUpRight size={15} /></a>
        </div>
        <div className="cc-media-stage-note"><span>PROGRAMAÇÃO COLETIVA</span><b>LUZES<br />· CÂMERA ·<br />CONVERSA</b></div>
      </section>

      <section className="cc-media-catalog" id="cc-media-list">
        <div className="cc-media-heading">
          <div><p className="cc-kicker">NA TELA DO CLUBE</p><h2>PRÓXIMAS<br /><em>SESSÕES.</em></h2></div>
          <p>Uma coleção aberta de histórias indicadas pelo grupo: cinema, séries e ideias para trocar depois dos créditos.</p>
        </div>
        <div className="cc-media-tools">
          <div className="cc-media-tabs" aria-label="Filtrar por formato">
            {kinds.map(({ value, label, icon: Icon }) => (
              <button key={value} className={kindFilter === value ? 'is-active' : ''} onClick={() => setKindFilter(value)} aria-pressed={kindFilter === value}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
          <label className="cc-media-search"><Search size={16} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar título, tema ou sinopse" aria-label="Buscar indicações de filmes e séries" /></label>
        </div>

        {filtered.length ? (
          <div className="cc-media-grid">
            {filtered.map((item) => (
              <article className="cc-media-card" key={item.id}>
                <div className="cc-media-poster">
                  <div className="cc-media-poster-fallback"><Clapperboard size={30} /><span>PRÓXIMA SESSÃO</span></div>
                  {item.poster_url && <img src={item.poster_url} alt={`Cartaz de ${item.title}`} onError={(event) => event.currentTarget.remove()} />}
                  <span className="cc-media-type">{item.kind === 'series' ? 'SÉRIE' : 'FILME'}</span>
                </div>
                <div className="cc-media-card-body">
                  <div className="cc-media-card-meta"><span>{item.genre || 'Indicação do grupo'}</span>{item.release_year && <span>{item.release_year}</span>}</div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <div className="cc-media-card-footer"><span>Indicado por {recommenderName(item)}</span>
                    {item.source_url && <a href={item.source_url} target="_blank" rel="noreferrer">Onde assistir <ArrowUpRight size={13} /></a>}
                    {(isAdmin || item.recommended_by === currentUser?.id) && <button className="cc-media-remove" onClick={() => removeRecommendation(item)} aria-label={`Remover ${item.title}`}><Trash2 size={14} /></button>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="cc-media-empty"><span className="cc-media-empty-star">✦</span><h3>{query || kindFilter !== 'all' ? 'Nenhuma história encontrada' : 'O palco espera a primeira história'}</h3><p>{query || kindFilter !== 'all' ? 'Mude o filtro ou a busca para encontrar outras indicações.' : 'Indique um filme ou uma série e abra a primeira sessão do Camarote.'}</p></div>
        )}
      </section>

      <section className="cc-media-submit" id="cc-media-submit">
        <div className="cc-media-submit-copy"><p className="cc-media-kicker"><Sparkles size={13} /> LUGAR RESERVADO PARA VOCÊ</p><h2>ABRA AS<br /><em>CORTINAS.</em></h2><p>Indique uma história que mereça entrar em cartaz no clube. Sua sugestão aparece para todo mundo.</p><div className="cc-media-ticket"><span>CAMAROTE DAS HISTÓRIAS</span><b>UMA BOA HISTÓRIA<br />MERECE SER CONTADA.</b></div></div>
        <form className="cc-media-form" onSubmit={addRecommendation}>
          <div className="cc-media-form-head"><Clapperboard size={21} /><div><span>NOVA INDICAÇÃO</span><h3>O que vamos assistir?</h3></div></div>
          <div className="cc-media-form-grid">
            <label>Formato<select value={kind} onChange={(event) => setKind(event.target.value)}><option value="film">Filme</option><option value="series">Série</option></select></label>
            <label>Título<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} required placeholder="Nome do filme ou da série" /></label>
            <label>Ano<input type="number" value={year} onChange={(event) => setYear(event.target.value)} min="1888" max="2100" placeholder="Opcional" /></label>
            <label>Gênero ou tema<input value={genre} onChange={(event) => setGenre(event.target.value)} maxLength={120} placeholder="Drama, fantasia, política…" /></label>
            <label className="cc-media-form-wide">Por que você indica?<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1200} required placeholder="Conte um pouco sobre a história e o que ela pode render na conversa." /></label>
            <label className="cc-media-form-wide">Link do cartaz (opcional)<input type="url" value={poster} onChange={(event) => setPoster(event.target.value)} placeholder="https://…" /></label>
            <label className="cc-media-form-wide">Onde assistir (opcional)<input type="url" value={source} onChange={(event) => setSource(event.target.value)} placeholder="https://…" /></label>
          </div>
          <div className="cc-media-form-actions"><span>As indicações ficam visíveis para o grupo.</span><button type="submit" disabled={busy}>{busy ? 'Colocando em cartaz…' : 'Enviar indicação'} <ArrowUpRight size={14} /></button></div>
          {message && <p className="cc-media-message" role="status"><X size={13} onClick={() => setMessage('')} />{message}</p>}
        </form>
      </section>
    </main>
  );
}
