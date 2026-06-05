import type { AuthResponse, Comment, Issue, IssueStatus, Project, User, UserRole } from './types';

export const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3001';

export class ApiRequestError extends Error {
  statusCode: number;
  errors?: string[];

  constructor(message: string, statusCode: number, errors?: string[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem('trackflow_token');
  const headers = new Headers(options.headers ?? {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('trackflow_token');
      localStorage.removeItem('trackflow_user');
    }

    throw new ApiRequestError(
      data.message || 'Request failed',
      response.status,
      data.errors,
    );
  }

  return data as T;
}

export const api = {
  register: (body: { email: string; password: string; name: string }) =>
    apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getMe: () => apiFetch<User>('/users/me'),

  updateProfile: (body: Partial<{ name: string; email: string; password: string }>) =>
    apiFetch<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  getAssignableUsers: () =>
    apiFetch<Pick<User, 'id' | 'name' | 'email'>[]>('/users/assignable'),

  getAllUsers: () => apiFetch<User[]>('/users'),

  updateUserRole: (id: string, role: UserRole) =>
    apiFetch<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),

  deleteUser: (id: string) =>
    apiFetch<{ message: string }>(`/users/${id}`, { method: 'DELETE' }),

  getProjects: () => apiFetch<Project[]>('/projects'),

  createProject: (body: { name: string; description?: string }) =>
    apiFetch<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateProject: (id: string, body: Partial<{ name: string; description: string }>) =>
    apiFetch<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  deleteProject: (id: string) =>
    apiFetch<{ message: string }>(`/projects/${id}`, { method: 'DELETE' }),

  getIssues: (params?: {
    projectId?: string;
    status?: IssueStatus;
    assigneeId?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.projectId) query.set('projectId', params.projectId);
    if (params?.status) query.set('status', params.status);
    if (params?.assigneeId) query.set('assigneeId', params.assigneeId);
    const qs = query.toString();
    return apiFetch<Issue[]>(`/issues${qs ? `?${qs}` : ''}`);
  },

  createIssue: (body: {
    title: string;
    description?: string;
    projectId: string;
    status?: IssueStatus;
    assigneeId?: string;
  }) =>
    apiFetch<Issue>('/issues', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateIssue: (
    id: string,
    body: Partial<{
      title: string;
      description: string;
      status: IssueStatus;
      assigneeId: string;
    }>,
  ) =>
    apiFetch<Issue>(`/issues/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  deleteIssue: (id: string) =>
    apiFetch<{ message: string }>(`/issues/${id}`, { method: 'DELETE' }),

  getComments: (issueId: string) =>
    apiFetch<Comment[]>(`/issues/${issueId}/comments`),

  createComment: (issueId: string, content: string) =>
    apiFetch<Comment>(`/issues/${issueId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  deleteComment: (id: string) =>
    apiFetch<{ message: string }>(`/comments/${id}`, { method: 'DELETE' }),
};
