// ============================================================
// CampusPulse — Authentication Module
//
// Wraps Supabase Auth with role-based profile management.
// Handles signup, login, logout, and profile fetching.
// ============================================================

import { supabase } from './supabase';
import type { UserProfile, SignUpData, LoginData, UserRole } from '../types/auth';

// ---------- Sign Up ----------

/**
 * Register a new user. Creates both an auth.users entry
 * and a public.profiles entry (via DB trigger).
 *
 * Role defaults to 'student'. To create admin or maintenance
 * accounts, update the profile role manually after signup.
 */
export async function signUp(data: SignUpData): Promise<{
  profile: UserProfile | null;
  error: string | null;
}> {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.full_name,
        role: data.role || 'student',
      },
    },
  });

  if (authError) {
    return { profile: null, error: authError.message };
  }

  if (!authData.user) {
    return { profile: null, error: 'Signup succeeded but no user returned' };
  }

  // The DB trigger creates the profile, but it might take a moment.
  // Fetch the profile to return it.
  // Small delay to allow trigger execution
  await new Promise((resolve) => setTimeout(resolve, 500));

  const profile = await getProfile(authData.user.id);
  return { profile, error: null };
}

// ---------- Login ----------

/**
 * Log in with email and password.
 * Returns the user profile with role information.
 */
export async function login(data: LoginData): Promise<{
  profile: UserProfile | null;
  error: string | null;
}> {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (authError) {
    return { profile: null, error: authError.message };
  }

  if (!authData.user) {
    return { profile: null, error: 'Login succeeded but no user returned' };
  }

  const profile = await getProfile(authData.user.id);
  return { profile, error: null };
}

// ---------- Logout ----------

/**
 * Sign out the current user.
 */
export async function logout(): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signOut();
  return { error: error?.message || null };
}

// ---------- Get Current Session ----------

/**
 * Get the current auth session (if any).
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('[Auth] Error getting session:', error);
    return null;
  }
  return session;
}

// ---------- Get Profile ----------

/**
 * Fetch a user's profile by their auth user ID.
 */
export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[Auth] Error fetching profile:', error);
    return null;
  }

  return data as UserProfile;
}

/**
 * Get the current logged-in user's profile.
 */
export async function getCurrentProfile(): Promise<UserProfile | null> {
  const session = await getSession();
  if (!session?.user) return null;
  return getProfile(session.user.id);
}

// ---------- Update Profile ----------

/**
 * Update the current user's profile.
 * Students can only update name, phone, and avatar.
 */
export async function updateProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'full_name' | 'phone' | 'avatar_url'>>,
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('[Auth] Error updating profile:', error);
    return null;
  }

  return data as UserProfile;
}

// ---------- Role Checking ----------

/**
 * Check if a user has a specific role.
 * Use this for route protection and conditional rendering.
 */
export function hasRole(profile: UserProfile | null, role: UserRole): boolean {
  return profile?.role === role;
}

/**
 * Check if a user is an admin.
 */
export function isAdmin(profile: UserProfile | null): boolean {
  return hasRole(profile, 'admin');
}

/**
 * Check if a user is a student.
 */
export function isStudent(profile: UserProfile | null): boolean {
  return hasRole(profile, 'student');
}

/**
 * Check if a user is maintenance staff.
 */
export function isMaintenance(profile: UserProfile | null): boolean {
  return hasRole(profile, 'maintenance');
}

// ---------- Admin: Fetch All Users ----------

/**
 * Admin-only: fetch all user profiles.
 */
export async function fetchAllProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Auth] Error fetching all profiles:', error);
    return [];
  }

  return (data as UserProfile[]) || [];
}

/**
 * Admin-only: update a user's role.
 */
export async function updateUserRole(
  userId: string,
  role: UserRole,
  department?: string,
): Promise<boolean> {
  const updates: Record<string, unknown> = { role };
  if (department !== undefined) {
    updates.department = department;
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) {
    console.error('[Auth] Error updating user role:', error);
    return false;
  }

  return true;
}
