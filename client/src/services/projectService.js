import api from './api';

export async function listProjects() {
  const { data } = await api.get('/projects');
  return data.data.projects;
}

export async function getProject(projectId) {
  const { data } = await api.get(`/projects/${projectId}`);
  return data.data.project;
}

export async function createProject(payload) {
  const { data } = await api.post('/projects', payload);
  return data.data.project;
}

export async function updateProject(projectId, payload) {
  const { data } = await api.patch(`/projects/${projectId}`, payload);
  return data.data.project;
}

export async function deleteProject(projectId) {
  const { data } = await api.delete(`/projects/${projectId}`);
  return data.data;
}

export async function listMembers(projectId) {
  const { data } = await api.get(`/projects/${projectId}/members`);
  return data.data.members;
}

export async function addMember(projectId, payload) {
  const { data } = await api.post(`/projects/${projectId}/members`, payload);
  return data.data.member;
}

export async function updateMemberRole(projectId, userId, role) {
  const { data } = await api.patch(
    `/projects/${projectId}/members/${userId}`,
    { role }
  );
  return data.data.member;
}

export async function removeMember(projectId, userId) {
  const { data } = await api.delete(
    `/projects/${projectId}/members/${userId}`
  );
  return data.data;
}
