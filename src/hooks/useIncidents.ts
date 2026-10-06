// ============================================================
// CampusPulse — Real-time Incidents Hook
//
// Subscribes to Supabase Realtime so the dashboard and
// student app update LIVE without page refresh.
// This is what makes the demo feel magical.
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Incident, Status, Severity } from '../types/incident';

// ---------- useIncidents ----------

interface UseIncidentsOptions {
  /** Filter by status */
  status?: Status;
  /** Filter by location */
  location?: string;
  /** Filter by severity */
  severity?: Severity;
  /** Filter by category */
  category?: string;
}

interface UseIncidentsReturn {
  incidents: Incident[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook that fetches incidents and subscribes to real-time updates.
 * 
 * Usage:
 *   const { incidents, loading } = useIncidents();
 *   const { incidents: openIncidents } = useIncidents({ status: 'Open' });
 */
export function useIncidents(options?: UseIncidentsOptions): UseIncidentsReturn {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to track options to avoid re-subscribing on every render
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Fetch function
  const fetchIncidents = useCallback(async () => {
    try {
      let query = supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (optionsRef.current?.status) {
        query = query.eq('status', optionsRef.current.status);
      }
      if (optionsRef.current?.location) {
        query = query.eq('location', optionsRef.current.location);
      }
      if (optionsRef.current?.severity) {
        query = query.eq('severity', optionsRef.current.severity);
      }
      if (optionsRef.current?.category) {
        query = query.eq('category', optionsRef.current.category);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setIncidents((data as Incident[]) || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch incidents');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + realtime subscription
  useEffect(() => {
    fetchIncidents();

    // Subscribe to ALL changes on the incidents table
    // We filter client-side because Supabase Realtime filters are limited
    const channel = supabase
      .channel('incidents-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'incidents',
        },
        (payload: any) => {
          const opts = optionsRef.current;

          if (payload.eventType === 'INSERT') {
            const newIncident = payload.new as Incident;
            
            // Check if new incident matches our filters
            if (matchesFilters(newIncident, opts)) {
              setIncidents((prev) => [newIncident, ...prev]);
            }
          }

          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Incident;
            
            setIncidents((prev) => {
              // If it matches filters, update or add it
              if (matchesFilters(updated, opts)) {
                const exists = prev.some((i) => i.id === updated.id);
                if (exists) {
                  return prev.map((i) => (i.id === updated.id ? updated : i));
                }
                return [updated, ...prev];
              }
              // If it no longer matches filters, remove it
              return prev.filter((i) => i.id !== updated.id);
            });
          }

          if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setIncidents((prev) => prev.filter((i) => i.id !== deletedId));
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchIncidents]);

  return { incidents, loading, error, refetch: fetchIncidents };
}

// ---------- useSingleIncident ----------

/**
 * Hook for watching a single incident with real-time updates.
 * Used on the incident detail page.
 */
export function useSingleIncident(incidentId: string | null) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!incidentId) {
      setLoading(false);
      return;
    }

    // Fetch initial data
    const fetchOne = async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .eq('id', incidentId)
        .single();

      if (!error && data) {
        setIncident(data as Incident);
      }
      setLoading(false);
    };

    fetchOne();

    // Subscribe to updates on this specific incident
    const channel = supabase
      .channel(`incident-${incidentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'incidents',
          filter: `id=eq.${incidentId}`,
        },
        (payload: any) => {
          setIncident(payload.new as Incident);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [incidentId]);

  return { incident, loading };
}

// ---------- Helper ----------

function matchesFilters(
  incident: Incident,
  options?: UseIncidentsOptions,
): boolean {
  if (!options) return true;
  if (options.status && incident.status !== options.status) return false;
  if (options.location && incident.location !== options.location) return false;
  if (options.severity && incident.severity !== options.severity) return false;
  if (options.category && incident.category !== options.category) return false;
  return true;
}
