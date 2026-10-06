// ============================================================
// CampusPulse — Activity Logs Hook
//
// Fetches and subscribes to activity logs for a specific
// incident. Powers the activity timeline UI.
// ============================================================

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { ActivityLog } from '../types/incident';

/**
 * Hook that fetches activity logs for an incident and
 * subscribes to new log entries in real-time.
 */
export function useActivityLogs(incidentId: string | null) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!incidentId) {
      setLoading(false);
      return;
    }

    // Fetch initial logs
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setLogs(data as ActivityLog[]);
      }
      setLoading(false);
    };

    fetchLogs();

    // Subscribe to new log entries
    const channel = supabase
      .channel(`activity-logs-${incidentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
          filter: `incident_id=eq.${incidentId}`,
        },
        (payload: any) => {
          setLogs((prev) => [...prev, payload.new as ActivityLog]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [incidentId]);

  return { logs, loading };
}
