// ============================================================
// CampusPulse — Auth Types
// ============================================================

export type UserRole = 'student' | 'admin' | 'maintenance';

export interface UserProfile {
  id: string;              // UUID from Supabase Auth
  email: string;
  full_name: string;
  role: UserRole;
  department: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  role?: UserRole;         // Defaults to 'student'
  department?: string;     // Only for maintenance staff
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthState {
  user: UserProfile | null;
  session: { access_token: string } | null;
  loading: boolean;
  error: string | null;
}
