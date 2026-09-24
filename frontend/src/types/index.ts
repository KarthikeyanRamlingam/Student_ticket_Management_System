export type Role = 'STUDENT' | 'STAFF' | 'ADMIN';

export type TicketStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_STUDENT'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type EscalationLevel = 'NONE' | 'LEVEL_1' | 'LEVEL_2';

export type CommentVisibility = 'PUBLIC' | 'INTERNAL';

export type ActivityType =
  | 'CREATED'
  | 'ASSIGNED'
  | 'REASSIGNED'
  | 'STATUS_CHANGED'
  | 'PRIORITY_CHANGED'
  | 'COMMENT_ADDED'
  | 'INFO_REQUESTED'
  | 'STUDENT_REPLIED'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'REOPENED'
  | 'CLOSED';

export type SlaStatus = 'WITHIN_SLA' | 'DUE_SOON' | 'OVERDUE' | 'MET' | 'BREACHED';

export type AgeingBucket = '0_1_DAYS' | '2_3_DAYS' | '4_7_DAYS' | '8_PLUS_DAYS';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  studentIdNumber?: string | null;
  phoneNumber?: string | null;
  departmentId?: string | null;
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
  createdAt?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  categories?: Category[];
  _count?: {
    tickets: number;
    staff: number;
  };
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  departmentId: string;
  department?: {
    id: string;
    name: string;
    code: string;
  };
  defaultPriority: Priority;
  defaultSlaHours: number;
  isActive: boolean;
  _count?: {
    tickets: number;
  };
}

export interface TicketMetrics {
  slaStatus: SlaStatus;
  hoursRemaining: number;
  ageDays: number;
  ageingBucket: AgeingBucket;
  isOverdue: boolean;
  isDueSoon: boolean;
  isBreached: boolean;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedById: string;
  uploadedBy?: {
    name: string;
    role: Role;
  };
  createdAt: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    role: Role;
    email: string;
  };
  message: string;
  visibility: CommentVisibility;
  createdAt: string;
}

export interface TicketActivity {
  id: string;
  ticketId: string;
  actorId?: string | null;
  actor?: {
    id: string;
    name: string;
    role: Role;
  } | null;
  eventType: ActivityType;
  oldValue?: string | null;
  newValue?: string | null;
  metadata?: any;
  createdAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  studentId: string;
  student: {
    id: string;
    name: string;
    email: string;
    studentIdNumber?: string | null;
    phoneNumber?: string | null;
  };
  categoryId: string;
  category: {
    id: string;
    name: string;
    description?: string | null;
  };
  departmentId: string;
  department: {
    id: string;
    name: string;
    code: string;
  };
  assignedStaffId?: string | null;
  assignedStaff?: {
    id: string;
    name: string;
    email: string;
  } | null;
  assignedById?: string | null;
  assignedBy?: {
    id: string;
    name: string;
  } | null;
  assignedAt?: string | null;
  slaDueAt: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
  reopenedAt?: string | null;
  reopenReason?: string | null;
  resolutionNotes?: string | null;
  escalationLevel: EscalationLevel;
  escalatedAt?: string | null;
  escalationReason?: string | null;
  escalatedById?: string | null;
  escalatedBy?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  metrics: TicketMetrics;
  comments?: TicketComment[];
  activities?: TicketActivity[];
  attachments?: Attachment[];
  _count?: {
    comments: number;
    attachments: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  errors?: any;
}
