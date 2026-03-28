export type UserRole = "ADMIN" | "STUDENT";

export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string;
};

export type AssignmentStatus =
  | "PENDING"
  | "COMPLETED"
  | "OVERDUE"
  | "ARCHIVED";

export type AssignmentPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type Subject = {
  id: string;
  name: string;
  description?: string | null;
};

export type Group = {
  id: string;
  name: string;
};

export type Assignment = {
  id: string;
  title: string;
  description?: string | null;
  dueDay: string;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  userId: string;
  subjectId: string;
  groupId?: string | null;
  subject?: Subject;
  group?: Group | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Paginated<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
  };
};

export type DashboardStats = {
  workload: unknown;
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  urgent: number;
};

export type GroupMemberRow = {
  userId: string;
  groupId: string;
  role: "OWNER" | "MEMBER";
  user: { id: string; name: string; email: string };
};

export type InvitePayload = {
  email?: string;
  groupId?: string;
  invitedById?: string;
  type?: string;
};
