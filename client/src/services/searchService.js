import api from './api';

export async function search(query) {
  if (!query || !query.trim()) {
    return { projects: [], tasks: [], members: [] };
  }
  const { data } = await api.get('/search', { params: { q: query.trim() } });
  return data.data;
}
