export enum Role {
  ADMIN    = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

export enum EntryType {
  CLOCK_IN    = 'CLOCK_IN',
  BREAK_START = 'BREAK_START',
  BREAK_END   = 'BREAK_END',
  CLOCK_OUT   = 'CLOCK_OUT',
}

export interface Employee {
  id: string; name: string; email: string;
  role: Role; active: boolean;
  createdAt: string; updatedAt: string;
}

export interface TimeEntry {
  id: string; employeeId: string; employee?: Employee;
  type: EntryType; timestamp: string; timezone: string;
  deviceId?: string; manualEdit: boolean;
  createdAt: string; updatedAt: string;
}

export interface Adjustment {
  id: string; timeEntryId: string;
  oldValue: string; newValue: string;
  reason: string; approvedBy: string; approver?: Employee;
  createdAt: string;
}

export interface WorkSchedule {
  id: string; employeeId: string;
  expectedStart: string; expectedEnd: string;
  breakMinutes: number; weekdays: number[]; active: boolean;
}

export interface AuditLog {
  id: string; entity: string; entityId: string; action: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  performedBy: string; performer?: Employee; createdAt: string;
}

export interface AuthTokens {
  accessToken: string; refreshToken: string; expiresIn: number;
}

export interface JwtPayload {
  sub: string; email: string; role: Role; iat?: number; exp?: number;
}

export interface DayReport {
  date: string; entries: TimeEntry[];
  workedMinutes: number; overtimeMinutes: number;
  lateMinutes: number; isAbsent: boolean;
}

export interface MonthReport {
  employee: Employee; month: number; year: number;
  days: DayReport[];
  totalWorkedMinutes: number; totalOvertimeMinutes: number;
  totalLateMinutes: number; totalAbsences: number; bankMinutes: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
