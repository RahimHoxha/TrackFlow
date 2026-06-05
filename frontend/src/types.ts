export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export type IssueStatus = 'open' | 'in_progress' | 'resolved';

export interface Issue {
  id: string;
  title: string;
  description: string | null;
  status: IssueStatus;
  projectId: string;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  issueId: string;
  authorId: string;
  author: Pick<User, 'id' | 'name' | 'email'>;
  createdAt: string;
  updatedAt: string;
}
