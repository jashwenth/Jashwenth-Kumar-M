import type {
  User,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  ComplaintWithDetails,
} from '../../backend/types/fixit';

export interface CreateComplaintInput {
  category: ComplaintCategory;
  description: string;
  building: string;
  floor: string;
  roomNumber: string;
  priority: ComplaintPriority;
  photoUrl?: string | null;
}

export interface ComplaintFilterParams {
  search?: string;
  category?: string;
  status?: string;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: 'newest' | 'oldest' | 'highestPriority';
  page?: number;
  limit?: number;
}

export interface ComplaintListResponse {
  success: boolean;
  complaints: ComplaintWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StatisticsResponse {
  success: boolean;
  stats?: any;
  statistics: {
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    resolutionRate: number;
    averageResolutionTime: {
      hours: number;
      formatted: string;
    };
    complaintsByCategory: Array<{ category: ComplaintCategory; count: number; percentage: number }>;
    complaintsByStatus: Array<{ status: ComplaintStatus; count: number; percentage: number }>;
    complaintsByPriority: Array<{ priority: ComplaintPriority; count: number; percentage: number }>;
    recentComplaints?: ComplaintWithDetails[];
    trend: Array<{ date: string; reported: number; resolved: number }>;
  };
}

const TOKEN_KEY = 'fixit_auth_token';
const USER_KEY = 'fixit_auth_user';

class FixitApiService {
  private token: string | null = null;
  private currentUser: User | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY);
      try {
        const u = localStorage.getItem(USER_KEY);
        if (u) this.currentUser = JSON.parse(u);
      } catch {
        this.currentUser = null;
      }
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public getToken(): string | null {
    return this.token;
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public setSession(user: User | null, token: string | null) {
    this.currentUser = user;
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token && user) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    this.notify();
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = data?.error?.message || `Request failed with status ${res.status}`;
      const err = new Error(errMsg) as Error & { code?: string; field?: string };
      err.code = data?.error?.code;
      err.field = data?.error?.field;
      throw err;
    }

    return data as T;
  }

  // --- Auth API ---

  public async login(emailOrRole: { email?: string; password?: string; role?: string }): Promise<User> {
    const res = await this.request<{ success: boolean; user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(emailOrRole),
    });
    this.setSession(res.user, res.token);
    return res.user;
  }

  public async register(data: {
    name: string;
    email: string;
    password?: string;
    role?: string;
    department?: string;
  }): Promise<User> {
    const res = await this.request<{ success: boolean; user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setSession(res.user, res.token);
    return res.user;
  }

  public async getMe(): Promise<User | null> {
    if (!this.token) return null;
    try {
      const res = await this.request<{ success: boolean; user: User }>('/api/auth/me');
      this.setSession(res.user, this.token);
      return res.user;
    } catch {
      this.setSession(null, null);
      return null;
    }
  }

  public async logout(): Promise<void> {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } finally {
      this.setSession(null, null);
    }
  }

  // --- Complaints API ---

  public async getComplaints(params: ComplaintFilterParams = {}): Promise<ComplaintListResponse> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category && params.category !== 'ALL') query.set('category', params.category);
    if (params.status && params.status !== 'ALL') query.set('status', params.status);
    if (params.priority && params.priority !== 'ALL') query.set('priority', params.priority);
    if (params.dateFrom) query.set('dateFrom', params.dateFrom);
    if (params.dateTo) query.set('dateTo', params.dateTo);
    if (params.sort) query.set('sort', params.sort);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    const endpoint = `/api/fixit/complaints${qs ? `?${qs}` : ''}`;
    return this.request<ComplaintListResponse>(endpoint);
  }

  public async getComplaint(complaintId: string): Promise<ComplaintWithDetails> {
    const res = await this.request<{ success: boolean; complaint: ComplaintWithDetails }>(
      `/api/fixit/complaints/${encodeURIComponent(complaintId)}`
    );
    return res.complaint;
  }

  public async createComplaint(data: CreateComplaintInput): Promise<ComplaintWithDetails> {
    const res = await this.request<{ success: boolean; complaint: ComplaintWithDetails }>(
      '/api/fixit/complaints',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return res.complaint;
  }

  public async uploadPhoto(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('photo', file);

    const res = await this.request<{ success: boolean; url: string }>('/api/fixit/complaints/upload', {
      method: 'POST',
      body: formData,
    });
    return res.url;
  }

  public async uploadPhotoBase64(base64: string, mimeType: string): Promise<string> {
    const res = await this.request<{ success: boolean; url: string }>('/api/fixit/complaints/upload', {
      method: 'POST',
      body: JSON.stringify({ data: base64, mimeType }),
    });
    return res.url;
  }

  public async updateStatus(
    complaintId: string,
    status: ComplaintStatus,
    remarks?: string
  ): Promise<ComplaintWithDetails> {
    const res = await this.request<{ success: boolean; complaint: ComplaintWithDetails }>(
      `/api/fixit/complaints/${encodeURIComponent(complaintId)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, remarks }),
      }
    );
    return res.complaint;
  }

  public async updatePriority(
    complaintId: string,
    priority: ComplaintPriority
  ): Promise<ComplaintWithDetails> {
    const res = await this.request<{ success: boolean; complaint: ComplaintWithDetails }>(
      `/api/fixit/complaints/${encodeURIComponent(complaintId)}/priority`,
      {
        method: 'PATCH',
        body: JSON.stringify({ priority }),
      }
    );
    return res.complaint;
  }

  public async assignComplaint(
    complaintId: string,
    assignedStaffId: string
  ): Promise<ComplaintWithDetails> {
    const res = await this.request<{ success: boolean; complaint: ComplaintWithDetails }>(
      `/api/fixit/complaints/${encodeURIComponent(complaintId)}/assign`,
      {
        method: 'PATCH',
        body: JSON.stringify({ assignedStaffId }),
      }
    );
    return res.complaint;
  }

  public async addRemark(complaintId: string, remark: string): Promise<ComplaintWithDetails> {
    const res = await this.request<{ success: boolean; complaint: ComplaintWithDetails }>(
      `/api/fixit/complaints/${encodeURIComponent(complaintId)}/remarks`,
      {
        method: 'POST',
        body: JSON.stringify({ remark }),
      }
    );
    return res.complaint;
  }

  // --- Statistics ---

  public async getStatistics(range: 'today' | '7d' | '30d' = '30d'): Promise<StatisticsResponse['statistics']> {
    const res = await this.request<StatisticsResponse>(`/api/fixit/statistics?range=${range}`);
    return res.statistics;
  }

  // --- Staff list ---

  public async getMaintenanceStaff(): Promise<User[]> {
    const res = await this.request<{ success: boolean; staff: User[] }>('/api/fixit/staff');
    return res.staff;
  }

  // --- Notifications ---

  public async getNotifications(): Promise<any[]> {
    const res = await this.request<{ success: boolean; notifications: any[] }>('/api/fixit/notifications');
    return res.notifications;
  }

  public async markNotificationRead(id: string): Promise<boolean> {
    const res = await this.request<{ success: boolean }>(`/api/fixit/notifications/${id}/read`, {
      method: 'PATCH',
    });
    return res.success;
  }
}

export const fixitApi = new FixitApiService();
