import { supabase } from './supabase';

function unwrap(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

export async function loadClubState(defaultBooks, isAdmin = false) {
  const client = supabase;
  const [bookResult, profileResult, voteResult, availabilityResult, configResult, mediaResult] = await Promise.all([
    client.from('club_books').select('id,details,sort_order,suggested_by').order('sort_order').order('created_at'),
    client.from('club_profiles').select('id,display_name,bio,avatar_url,created_at').eq('is_active', true).order('created_at'),
    client.from('club_votes').select('user_id,kind,value'),
    client.from('club_date_availability').select('user_id,option_value'),
    client.from('club_config').select('status,deadlines,results,date_options,history,finalized_book_id,date_voting_opened_at').eq('id', 1).maybeSingle(),
    client.from('club_media_recommendations').select('*').order('created_at', { ascending: false }),
  ]);

  let bookRows = unwrap(bookResult, 'Não foi possível carregar o catálogo');
  const config = unwrap(configResult, 'Não foi possível carregar as configurações');

  if (!bookRows.length && isAdmin) {
    unwrap(await client.rpc('seed_club_books', { p_books: defaultBooks }), 'Não foi possível inicializar o catálogo');
    bookRows = unwrap(await client.from('club_books').select('id,details,sort_order,suggested_by').order('sort_order').order('created_at'), 'Não foi possível carregar o catálogo');
  }

  const profileRows = unwrap(profileResult, 'Não foi possível carregar integrantes');
  const voteRows = unwrap(voteResult, 'Não foi possível carregar os votos');
  const availabilityRows = unwrap(availabilityResult, 'Não foi possível carregar disponibilidades');
  const mediaRecommendations = unwrap(mediaResult, 'Não foi possível carregar indicações de mídia');

  const votes = {};
  for (const row of voteRows) votes[row.user_id] = { ...(votes[row.user_id] || {}), [row.kind]: row.value };

  const dateAvailability = {};
  for (const row of availabilityRows) dateAvailability[row.user_id] = [...(dateAvailability[row.user_id] || []), row.option_value];

  const members = profileRows.map((profile) => ({
    id: profile.id,
    name: profile.display_name,
    bio: profile.bio || '',
    photo: profile.avatar_url || '',
    createdAt: profile.created_at,
  }));

  let adminMembers = [];
  if (isAdmin) {
    const rows = unwrap(await client.rpc('admin_list_members'), 'Não foi possível carregar os e-mails dos integrantes');
    adminMembers = rows.map((member) => ({
      id: member.id,
      email: member.email,
      name: member.display_name,
      bio: member.bio || '',
      photo: member.avatar_url || '',
      isActive: member.is_active,
      createdAt: member.created_at,
    }));
  }

  return {
    books: bookRows.length ? bookRows.map((row) => ({ ...row.details, id: row.id, suggestedById: row.suggested_by })) : defaultBooks,
    votes,
    dateOptions: config?.date_options || [],
    dateVotingOpenedAt: config?.date_voting_opened_at || '2026-10-29',
    dateAvailability,
    status: config?.status || { book: 'open', place: 'open', date: 'open' },
    deadlines: config?.deadlines || { book: 'A definir', place: 'A definir', date: 'A definir' },
    results: config?.results || { book: false, place: false, date: false },
    history: config?.history || [],
    members,
    adminMembers,
    finalizedBookId: config?.finalized_book_id || null,
    mediaRecommendations,
  };
}

export function throwSupabaseError(result, label) {
  return unwrap(result, label);
}
