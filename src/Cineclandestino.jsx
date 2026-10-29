import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Clapperboard, Film, ImagePlus, Pencil, Search, Sparkles, Trash2, Tv, X, Check } from 'lucide-react';
import { supabase } from './supabase';

const kinds = [
  { value: 'all', label: 'Tudo', icon: Sparkles },
  { value: 'film', label: 'Filmes', icon: Film },
  { value: 'series', label: 'Séries', icon: Tv },
];
const emptyDraft = { title: '', kind: 'film', release_year: '', genre: '', description: '', poster_url: '', source_url: '' };

export default function Cineclandestino({ recommendations = [], members = [], currentUser, isAdmin, onLogin, onAdded, onUpdated }) {
  const [kindFilter, setKindFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState(emptyDraft);
  const [posterFile, setPosterFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [editPosterFile, setEditPosterFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
    return recommendations.filter((item) => {
      const text = [item.title, item.genre, item.description, item.release_year].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
      return (kindFilter === 'all' || item.kind === kindFilter) && (!normalizedQuery || text.includes(normalizedQuery));
    });
  }, [recommendations, kindFilter, query]);

  async function uploadPoster(file) {
    if (!file) return '';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('A capa precisa estar em JPG, PNG ou WebP.');
    if (file.size > 5 * 1024 * 1024) throw new Error('A capa pode ter até 5 MB.');
    const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `${currentUser.id}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from('club-media-posters').upload(path, file, { contentType: file.type, upsert: false, cacheControl: '3600' });
    if (error) throw error;
    return supabase.storage.from('club-media-posters').getPublicUrl(path).data.publicUrl;
  }

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
      const posterUrl = posterFile ? await uploadPoster(posterFile) : draft.poster_url.trim() || null;
      const payload = {
        title: draft.title.trim(),
        kind: draft.kind,
        release_year: draft.release_year ? Number(draft.release_year) : null,
        genre: draft.genre.trim(),
        description: draft.description.trim(),
        poster_url: posterUrl,
        source_url: draft.source_url.trim() || null,
        recommended_by: currentUser.id,
      };
      const { data, error } = await supabase.from('club_media_recommendations').insert(payload).select('*').single();
      if (error) throw error;
      onAdded(data);
      setDraft(emptyDraft);
      setPosterFile(null);
      setKindFilter('all');
      setQuery('');
      setMessage('Sua história entrou em cartaz! Você poderá editar sua indicação no cartão.');
    } catch (error) {
      setMessage(error.message || 'Não foi possível salvar a indicação. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditDraft({ ...emptyDraft, title: item.title || '', kind: item.kind, release_year: item.release_year || '', genre: item.genre || '', description: item.description || '', poster_url: item.poster_url || '', source_url: item.source_url || '' });
    setEditPosterFile(null);
    setMessage('');
  }

  async function saveEdit(item) {
    if (!supabase || !editDraft || (!isAdmin && item.recommended_by !== currentUser?.id)) return;
    setBusy(true);
    setMessage('');
    try {
      const posterUrl = editPosterFile ? await uploadPoster(editPosterFile) : editDraft.poster_url.trim() || null;
      const changes = {
        title: editDraft.title.trim(),
        kind: editDraft.kind,
        release_year: editDraft.release_year ? Number(editDraft.release_year) : null,
        genre: editDraft.genre.trim(),
        description: editDraft.description.trim(),
        poster_url: posterUrl,
        source_url: editDraft.source_url.trim() || null,
      };
      const { data, error } = await supabase.from('club_media_recommendations').update(changes).eq('id', item.id).select('*').single();
      if (error) throw error;
      onUpdated(data);
      setEditingId(null);
      setEditDraft(null);
      setEditPosterFile(null);
      setMessage('Indicação atualizada.');
    } catch (error) {
      setMessage(error.message || 'Não foi possível atualizar a indicação.');
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
      setMessage('Indicação removida.');
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
          <h1>CINE<br /><em>CLANDESTINO</em></h1>
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
              <button key={value} className={kindFilter === value ? 'is-active' : ''} onClick={() => setKindFilter(value)} aria-pressed={kindFilter === value}><Icon size={15} /> {label}</button>
            ))}
          </div>
          <label className="cc-media-search"><Search size={16} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar título, tema ou sinopse" aria-label="Buscar indicações de filmes e séries" /></label>
        </div>

        {filtered.length ? (
          <div className="cc-media-grid">
            {filtered.map((item) => {
              const canEdit = isAdmin || item.recommended_by === currentUser?.id;
              return <article className="cc-media-card" key={item.id}>
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
                    {canEdit && <button className="cc-media-edit" onClick={() => editingId === item.id ? (setEditingId(null), setEditDraft(null)) : startEdit(item)} aria-label={`Editar ${item.title}`}><Pencil size={14} /> Editar</button>}
                    {canEdit && <button className="cc-media-remove" onClick={() => removeRecommendation(item)} aria-label={`Remover ${item.title}`}><Trash2 size={14} /></button>}
                  </div>
                  {editingId === item.id && editDraft && <div className="cc-media-edit-panel">
                    <label>Formato<select value={editDraft.kind} onChange={(event) => setEditDraft({ ...editDraft, kind: event.target.value })}><option value="film">Filme</option><option value="series">Série</option></select></label>
                    <label>Título<input value={editDraft.title} onChange={(event) => setEditDraft({ ...editDraft, title: event.target.value })} maxLength={160} /></label>
                    <label>Ano<input type="number" value={editDraft.release_year} onChange={(event) => setEditDraft({ ...editDraft, release_year: event.target.value })} min="1888" max="2100" /></label>
                    <label>Gênero ou tema<input value={editDraft.genre} onChange={(event) => setEditDraft({ ...editDraft, genre: event.target.value })} maxLength={120} /></label>
                    <label className="cc-media-edit-wide">Sinopse<textarea value={editDraft.description} onChange={(event) => setEditDraft({ ...editDraft, description: event.target.value })} maxLength={1200} /></label>
                    <label className="cc-media-edit-wide">Enviar capa<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setEditPosterFile(event.target.files?.[0] || null)} /><small>JPG, PNG ou WebP · até 5 MB</small></label>
                    <label className="cc-media-edit-wide">Ou informar URL da capa<input type="url" value={editDraft.poster_url} onChange={(event) => setEditDraft({ ...editDraft, poster_url: event.target.value })} placeholder="https://…" /></label>
                    <label className="cc-media-edit-wide">Onde assistir<input type="url" value={editDraft.source_url} onChange={(event) => setEditDraft({ ...editDraft, source_url: event.target.value })} placeholder="https://…" /></label>
                    <div className="cc-media-edit-actions"><button disabled={busy} onClick={() => saveEdit(item)}><Check size={14} /> Salvar</button><button disabled={busy} onClick={() => { setEditingId(null); setEditDraft(null); setEditPosterFile(null); }}>Cancelar</button></div>
                  </div>}
                </div>
              </article>;
            })}
          </div>
        ) : (
          <div className="cc-media-empty"><span className="cc-media-empty-star">✦</span><h3>{query || kindFilter !== 'all' ? 'Nenhuma história encontrada' : 'A tela espera a primeira história'}</h3><p>{query || kindFilter !== 'all' ? 'Mude o filtro ou a busca para encontrar outras indicações.' : 'Indique um filme ou uma série para a próxima sessão do Cineclandestino.'}</p></div>
        )}
      </section>

      <section className="cc-media-submit" id="cc-media-submit">
        <div className="cc-media-submit-copy"><p className="cc-media-kicker"><Sparkles size={13} /> LUGAR RESERVADO PARA VOCÊ</p><h2>ACENDA A<br /><em>SESSÃO.</em></h2><p>Indique uma história que mereça entrar em cartaz no clube. Sua sugestão aparece para todo mundo e poderá ser editada depois.</p><div className="cc-media-ticket"><span>CINECLANDESTINO</span><b>UMA BOA HISTÓRIA<br />MERECE SER CONTADA.</b></div></div>
        <form className="cc-media-form" onSubmit={addRecommendation}>
          <div className="cc-media-form-head"><Clapperboard size={21} /><div><span>NOVA INDICAÇÃO</span><h3>O que vamos assistir?</h3></div></div>
          <div className="cc-media-form-grid">
            <label>Formato<select value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value })}><option value="film">Filme</option><option value="series">Série</option></select></label>
            <label>Título<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} maxLength={160} required placeholder="Nome do filme ou da série" /></label>
            <label>Ano<input type="number" value={draft.release_year} onChange={(event) => setDraft({ ...draft, release_year: event.target.value })} min="1888" max="2100" placeholder="Opcional" /></label>
            <label>Gênero ou tema<input value={draft.genre} onChange={(event) => setDraft({ ...draft, genre: event.target.value })} maxLength={120} placeholder="Drama, fantasia, política…" /></label>
            <label className="cc-media-form-wide">Por que você indica?<textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} maxLength={1200} required placeholder="Conte um pouco sobre a história e o que ela pode render na conversa." /></label>
            <label className="cc-media-form-wide">Enviar capa ou cartaz<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setPosterFile(event.target.files?.[0] || null)} /><small>Opcional · JPG, PNG ou WebP · até 5 MB</small></label>
            <label className="cc-media-form-wide">Ou informar URL da capa<input type="url" value={draft.poster_url} onChange={(event) => setDraft({ ...draft, poster_url: event.target.value })} placeholder="https://…" /></label>
            <label className="cc-media-form-wide">Onde assistir (opcional)<input type="url" value={draft.source_url} onChange={(event) => setDraft({ ...draft, source_url: event.target.value })} placeholder="https://…" /></label>
          </div>
          <div className="cc-media-form-actions"><span>As indicações ficam visíveis para o grupo.</span><button type="submit" disabled={busy}>{busy ? 'Colocando em cartaz…' : 'Enviar indicação'} <ArrowUpRight size={14} /></button></div>
          {message && <p className="cc-media-message" role="status"><button type="button" aria-label="Fechar mensagem" onClick={() => setMessage('')}><X size={13} /></button>{message}</p>}
        </form>
      </section>
    </main>
  );
}
