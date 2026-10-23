export type EmployeeStatus = "ACTIVE" | "PENDING" | "BLOCKED" | "BANNED" | "INACTIVE" | "UNKNOWN";
export type EmployeeStatusInput = Exclude<EmployeeStatus, "UNKNOWN">;

export type EmployeeListFilters = {
  page: number;
  limit: number;
  search?: string;
  status?: EmployeeStatusInput;
  role?: string;
};

export type EmployeeItem = {
  id: string;
  email: string;
  fullName: string;
  avatar_url?: string | null;
  phone?: string | null;
  status: EmployeeStatus;
  provider?: string;
  accountType?: string;
  lastLoginProvider?: string | null;
  roles: string[];
  isProfileCompleted: boolean;
  last_login_at?: string | null;
  createdAt: string;
  employeeCode?: string | null;
  departmentId?: string | null;
  jobTitle?: string | null;
  employmentType?: string | null;
  scopes?: string[];
  activeDeviceCount?: number;
  activePlatforms?: string[];
  riskCode?: string | null;
  riskSeverity?: string | null;
};

export type PageMeta = { page: number; limit: number; total: number; totalPages: number };
export type EmployeeList = { users: EmployeeItem[]; meta: PageMeta };

export type EmployeeProfile = {
  id: string;
  userId: string;
  tenantId: string;
  employeeCode: string;
  departmentId?: string | null;
  jobTitle?: string | null;
  employmentType?: string | null;
  joinedAt?: string | null;
  terminatedAt?: string | null;
  experienceYears?: number | null;
  experienceSummary?: string | null;
  managerId?: string | null;
  workLocation?: string | null;
  emergencyContact: Record<string, unknown>;
};

export type EmployeeSession = {
  sessionId: string;
  deviceId?: string;
  deviceName?: string;
  portal?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  current: boolean;
  revoked: boolean;
  revokedReason?: string | null;
  expiresAt?: string;
  createdAt?: string;
  lastSeenAt?: string;
};

export type EmployeeDetail = {
  account: { user: EmployeeItem & Record<string, unknown>; sessions: EmployeeSession[] };
  profile?: EmployeeProfile | null;
};

export type UpdateEmployeeRequest = {
  fullName?: string;
  phone?: string;
  profile?: Partial<Omit<EmployeeProfile, "id" | "userId" | "tenantId">>;
};

export type CreateEmployeeRequest = {
  primaryEmail: string;
  fullName: string;
  phone?: string;
  recoveryEmail?: string;
  roleGroupIds: string[];
  policies: Array<{ scopeType: string; scopeId: string; roleGroup: string }>;
  credentialDelivery: "EMAIL_INVITE" | "ONE_TIME_PASSWORD";
  profile: {
    employeeCode: string;
    departmentId?: string;
    jobTitle?: string;
    employmentType?: string;
    joinedAt?: string;
    experienceYears?: number;
    experienceSummary?: string;
    managerId?: string;
    workLocation?: string;
    emergencyContact?: Record<string, unknown>;
  };
};

export type EmployeeCreatedResponse = {
  account: {
    deliveryStatus: string;
    oneTimePassword?: string | null;
    user: { id: string; primaryEmail: string; fullName: string; status: EmployeeStatus };
  };
  profile: EmployeeProfile;
};

export type CredentialDeliveryResponse = {
  deliveryStatus: string;
  oneTimePassword?: string | null;
};

export type SecurityEvent = {
  id: string;
  eventType: string;
  severity: string;
  portal?: string | null;
  platform?: "WEB_DESKTOP" | "WEB_MOBILE" | string | null;
  result?: string | null;
  riskCode?: string | null;
  sessionId?: string | null;
  deviceId?: string | null;
  ipAddress?: string | null;
  reason?: string | null;
  metadata: Record<string, unknown>;
  occurredAt: string;
};

export type SecurityEventPage = { items: SecurityEvent[]; page: number; limit: number; total: number; totalPages: number };
export type ActivityPage = { items: Array<Record<string, unknown>>; meta: PageMeta };

export type SecurityFeedFilters = {
  page: number;
  limit: number;
  userId?: string;
  sourceType?: "SECURITY_EVENT" | "LOGIN_ATTEMPT" | "USER_ACTIVITY" | "SESSION";
};

export type SecurityFeedItem = SecurityEvent & {
  sourceType: SecurityFeedFilters["sourceType"];
  tenantId: string;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
};

export type SecurityFeedPage = { items: SecurityFeedItem[]; page: number; limit: number; total: number; totalPages: number };
