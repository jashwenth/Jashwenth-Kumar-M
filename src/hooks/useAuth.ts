// ============================================================
// CampusPulse — Auth State Hook
//
// Manages authentication state across the entire app.
// Listens to Supabase Auth state changes and fetches
// the user's profile (with role) on login.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getProfile } from '../lib/auth';
import type { UserProfile } from '../types/auth';

interface UseAuthReturn {
  /** Current user profile (null if not logged in) */
  user: UserProfile | null;
  /** Whether auth state is still loading */
  loading: boolean;
  /** Whether the user is logged in */
  isAuthenticated: boolean;
  /** Whether the user is an admin */
  isAdmin: boolean;
  /** Whether the user is a student */
  isStudent: boolean;
  /** Whether the user is maintenance staff */
  isMaintenance: boolean;
  /** Refresh the user profile */
  refreshProfile: () => Promise<void>;
}

/**
 * Hook that tracks the current user's auth state.
 * Automatically updates when the user logs in or out.
 *
 * Usage:
 *   const { user, isAdmin, isAuthenticated, loading } = useAuth();
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const profile = await getProfile(userId);
    setUser(profile);
    setLoading(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  }, [fetchProfile]);

  useEffect(() => {
    // 1. Check existing session on mount
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    };

    initAuth();

    // 2. Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  return {
    user,
    loading,
    isAuthenticated: user !== null,
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student',
    isMaintenance: user?.role === 'maintenance',
    refreshProfile,
  };
}
