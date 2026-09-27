import api from './api';

export async function listTasks(projectId, params = {}) {
  const { data } = await api.get(`/projects/${projectId}/tasks`, { params });
  return data.data.tasks;
}

export async function getTask(taskId) {
  const { data } = await api.get(`/tasks/${taskId}`);
  return data.data.task;
}

export async function createTask(projectId, payload) {
  const { data } = await api.post(`/projects/${projectId}/tasks`, payload);
  return data.data.task;
}

export async function updateTask(taskId, payload) {
  const { data } = await api.patch(`/tasks/${taskId}`, payload);
  return data.data.task;
}

export async function deleteTask(taskId) {
  const { data } = await api.delete(`/tasks/${taskId}`);
  return data.data;
}

export async function assignTask(taskId, assignedTo) {
  const { data } = await api.patch(`/tasks/${taskId}/assign`, { assignedTo });
  return data.data.task;
}

export async function changeTaskStatus(taskId, status) {
  const { data } = await api.patch(`/tasks/${taskId}/status`, { status });
  return data.data.task;
}

export async function changeTaskPosition(taskId, { status, position }) {
  const { data } = await api.patch(`/tasks/${taskId}/position`, {
    status,
    position,
  });
  return data.data.task;
}

export async function listComments(taskId) {
  const { data } = await api.get(`/tasks/${taskId}/comments`);
  return data.data.comments;
}

export async function createComment(taskId, content) {
  const { data } = await api.post(`/tasks/${taskId}/comments`, { content });
  return data.data.comment;
}

export async function updateComment(commentId, content) {
  const { data } = await api.patch(`/comments/${commentId}`, { content });
  return data.data.comment;
}

export async function deleteComment(commentId) {
  const { data } = await api.delete(`/comments/${commentId}`);
  return data.data;
}

export async function getDashboard() {
  const { data } = await api.get('/dashboard');
  return data.data.stats;
}

export async function listMyTasks(params = {}) {
  const { data } = await api.get('/tasks/my-tasks', { params });
  return data.data.tasks;
}

export async function listCalendarTasks(params = {}) {
  const { data } = await api.get('/tasks/calendar', { params });
  return data.data.tasks;
}

