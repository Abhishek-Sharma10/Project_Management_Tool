import api from './api';

export async function register(payload) {
  const { data } = await api.post('/auth/register', payload);
  return data.data;
}

export async function login(payload) {
  const { data } = await api.post('/auth/login', payload);
  return data.data;
}

export async function logout(refreshToken) {
  const { data } = await api.post('/auth/logout', { refreshToken });
  return data.data;
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data.data.user;
}

export async function updateProfile(payload) {
  const { data } = await api.patch('/auth/profile', payload);
  return data.data.user;
}

export async function changePassword(payload) {
  const { data } = await api.patch('/auth/password', payload);
  return data.data;
}

