const BASE = import.meta.env.VITE_API_URL || 'http://localhost:10000'

const get = url => fetch(`${BASE}${url}`).then(r => r.json())
const post = (url, body) => fetch(`${BASE}${url}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
}).then(r => r.json())
const put = (url, body) => fetch(`${BASE}${url}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
}).then(r => r.json())
const del = url => fetch(`${BASE}${url}`, { method: 'DELETE' }).then(r => r.json())

export const api = {
  getMembers: () => get('/api/members'),
  getMember: id => get(`/api/members/${id}`),

  getTasks: id => get(`/api/members/${id}/tasks`),
  addTask: (id, task) => post(`/api/members/${id}/tasks`, task),
  updateTask: (id, taskId, data) => put(`/api/members/${id}/tasks/${taskId}`, data),
  deleteTask: (id, taskId) => del(`/api/members/${id}/tasks/${taskId}`),
  batchUpdateTasks: (id, tasks) => post(`/api/members/${id}/tasks/batch`, { tasks }),
  resetTasks: id => post(`/api/members/${id}/tasks/reset`, {}),

  getCalendar: (memberId) => get(`/api/calendar${memberId ? `?memberId=${memberId}` : ''}`),
  addCalEvent: ev => post('/api/calendar', ev),
  deleteCalEvent: id => del(`/api/calendar/${id}`),

  getMeals: id => get(`/api/members/${id}/meals`),
  getWeekly: id => get(`/api/members/${id}/weekly`),
  getMantras: (id, type) => get(`/api/members/${id}/mantras${type ? `?type=${type}` : ''}`),
  getDayColors: () => get('/api/daycolors'),
  getOutfitTips: id => get(`/api/members/${id}/outfit-tips`),
  getExtras: (id, type) => get(`/api/members/${id}/extras/${type}`),
}
