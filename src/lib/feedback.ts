// ============================================================
// CampusPulse — Resolution Feedback Module
//
// After an issue is marked Fixed and the student is emailed,
// they can rate the resolution (1-5 stars + comment).
// If they say the issue ISN'T actually fixed, the incident
// can be re-opened. This is real accountability.
// ============================================================

import { supabase } from './supabase';
import type { ResolutionFeedback, SubmitFeedbackData } from '../types/asset';
import type { Incident } from '../types/incident';

// ---------- Submit Feedback ----------

/**
 * Submit resolution feedback for an incident.
 * Only one feedback is allowed per incident (DB constraint).
 *
 * If is_issue_actually_fixed is false, the incident can be
 * re-opened automatically.
 */
export async function submitFeedback(
  data: SubmitFeedbackData,
  reporterId?: string,
): Promise<{ feedback: ResolutionFeedback | null; error: string | null }> {
  // Validate rating
  if (data.rating < 1 || data.rating > 5) {
    return { feedback: null, error: 'Rating must be between 1 and 5' };
  }

  const insertData: Record<string, unknown> = {
    incident_id: data.incident_id,
    rating: data.rating,
    comment: data.comment || null,
    is_issue_actually_fixed: data.is_issue_actually_fixed,
  };

  if (reporterId) {
    insertData.reporter_id = reporterId;
  }

  const { data: feedback, error } = await supabase
    .from('resolution_feedback')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    // Handle unique constraint violation (already submitted feedback)
    if (error.code === '23505') {
      return { feedback: null, error: 'You have already submitted feedback for this issue.' };
    }
    console.error('[Feedback] Error submitting feedback:', error);
    return { feedback: null, error: error.message };
  }

  const typedFeedback = feedback as ResolutionFeedback;

  // If student says issue is NOT actually fixed, log it
  if (!data.is_issue_actually_fixed) {
    await supabase.from('activity_logs').insert({
      incident_id: data.incident_id,
      action: 'Resolution Disputed',
      details: `Student reported the issue is not actually fixed. Rating: ${data.rating}/5${data.comment ? `. Comment: ${data.comment}` : ''}`,
      actor: 'Student',
    });

    // Optionally re-open the incident
    await supabase
      .from('incidents')
      .update({ status: 'Open', resolved_at: null })
      .eq('id', data.incident_id);

    await supabase.from('activity_logs').insert({
      incident_id: data.incident_id,
      action: 'Incident Re-opened',
      details: 'Automatically re-opened because student confirmed the issue persists',
      actor: 'System',
    });
  } else {
    // Log positive feedback
    await supabase.from('activity_logs').insert({
      incident_id: data.incident_id,
      action: 'Resolution Feedback Received',
      details: `Student rated the resolution ${data.rating}/5${data.comment ? `. Comment: ${data.comment}` : ''}`,
      actor: 'Student',
    });
  }

  return { feedback: typedFeedback, error: null };
}

// ---------- Fetch Feedback ----------

/**
 * Get feedback for a specific incident.
 */
export async function getFeedbackForIncident(
  incidentId: string,
): Promise<ResolutionFeedback | null> {
  const { data, error } = await supabase
    .from('resolution_feedback')
    .select('*')
    .eq('incident_id', incidentId)
    .single();

  if (error) {
    // Not found is expected (no feedback yet)
    if (error.code === 'PGRST116') return null;
    console.error('[Feedback] Error fetching feedback:', error);
    return null;
  }

  return data as ResolutionFeedback;
}

/**
 * Check if feedback has been submitted for an incident.
 */
export async function hasFeedback(incidentId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('resolution_feedback')
    .select('id', { count: 'exact', head: true })
    .eq('incident_id', incidentId);

  if (error) return false;
  return (count ?? 0) > 0;
}

// ---------- Feedback Analytics ----------

/**
 * Get average rating across all resolved incidents.
 */
export async function getOverallFeedbackStats(): Promise<{
  totalFeedback: number;
  avgRating: number;
  satisfiedPercentage: number;
  notActuallyFixed: number;
}> {
  const { data, error } = await supabase
    .from('resolution_feedback')
    .select('rating, is_issue_actually_fixed');

  if (error || !data || data.length === 0) {
    return { totalFeedback: 0, avgRating: 0, satisfiedPercentage: 0, notActuallyFixed: 0 };
  }

  const total = (data as any[]).length;
  const avgRating = (data as any[]).reduce((sum: number, f: any) => sum + (f.rating as number), 0) / total;
  const satisfied = (data as any[]).filter((f: any) => (f.rating as number) >= 4).length;
  const notFixed = (data as any[]).filter((f: any) => !(f.is_issue_actually_fixed as boolean)).length;

  return {
    totalFeedback: total,
    avgRating: Math.round(avgRating * 10) / 10,
    satisfiedPercentage: Math.round((satisfied / total) * 100),
    notActuallyFixed: notFixed,
  };
}

/**
 * Get feedback stats per department.
 * Uses the SQL view we created in migration 007.
 */
export async function getDepartmentFeedbackStats(): Promise<
  Array<{
    department: string;
    total_feedback: number;
    avg_rating: number;
    satisfied_count: number;
    unsatisfied_count: number;
    not_actually_fixed: number;
  }>
> {
  const { data, error } = await supabase
    .from('department_feedback_stats')
    .select('*');

  if (error) {
    console.error('[Feedback] Error fetching department stats:', error);
    return [];
  }

  return ((data as any[]) || []).map((row: any) => ({
    department: row.department as string,
    total_feedback: row.total_feedback as number,
    avg_rating: row.avg_rating as number,
    satisfied_count: row.satisfied_count as number,
    unsatisfied_count: row.unsatisfied_count as number,
    not_actually_fixed: row.not_actually_fixed as number,
  }));
}

/**
 * Get all feedback with incident details (for admin analytics).
 */
export async function fetchAllFeedbackWithIncidents(): Promise<
  Array<ResolutionFeedback & { incident: Pick<Incident, 'id' | 'title' | 'location' | 'department' | 'category'> }>
> {
  const { data, error } = await supabase
    .from('resolution_feedback')
    .select(`
      *,
      incidents!inner (id, title, location, department, category)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Feedback] Error fetching all feedback:', error);
    return [];
  }

  // Flatten the joined data
  return ((data as any[]) || []).map((row: any) => {
    const { incidents: incident, ...feedback } = row as Record<string, unknown>;
    return {
      ...feedback,
      incident: incident as Pick<Incident, 'id' | 'title' | 'location' | 'department' | 'category'>,
    };
  }) as Array<ResolutionFeedback & { incident: Pick<Incident, 'id' | 'title' | 'location' | 'department' | 'category'> }>;
}
