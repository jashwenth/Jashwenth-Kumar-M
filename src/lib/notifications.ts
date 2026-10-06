// ============================================================
// CampusPulse — Email Notifications (Brevo Integration)
//
// Sends transactional emails via Brevo (formerly Sendinblue)
// when incidents are resolved.
//
// Flow: Admin marks Fixed → sendResolutionEmail() → student
//       gets email with incident details + "Rate This Fix" button
//
// SECURITY NOTE: For a hackathon, calling Brevo from the client
// is acceptable. In production, move this to a Supabase Edge
// Function or server-side endpoint.
// ============================================================

import { supabase } from './supabase';
import type { Incident } from '../types/incident';
import type { NotificationRecord } from '../types/asset';

// ---------- Configuration ----------

const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY as string;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const SENDER = {
  name: 'CampusPulse - Wales University',
  email: import.meta.env.VITE_SENDER_EMAIL as string || 'noreply@campuspulse.app',
};

function getAppUrl(): string {
  return import.meta.env.VITE_APP_URL || window.location.origin;
}

// ---------- Send Resolution Email ----------

/**
 * Send an email to the student when their reported issue is resolved.
 *
 * @param incident - The resolved incident
 * @returns true if email was sent successfully
 */
export async function sendResolutionEmail(incident: Incident): Promise<boolean> {
  if (!BREVO_API_KEY) {
    console.warn('[Notifications] No Brevo API key configured. Skipping email.');
    return false;
  }

  if (!incident.reporter_email) {
    console.warn('[Notifications] No reporter email for incident:', incident.id);
    return false;
  }

  const feedbackUrl = `${getAppUrl()}/feedback/${incident.id}`;
  const detailUrl = `${getAppUrl()}/report/${incident.id}`;

  const htmlContent = buildResolutionEmailHTML(incident, feedbackUrl, detailUrl);

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: SENDER,
        to: [
          {
            email: incident.reporter_email,
            name: incident.reporter_name || incident.reporter_email,
          },
        ],
        subject: `✅ Your Campus Issue Has Been Resolved — ${incident.id}`,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[Notifications] Brevo API error:', response.status, errorBody);

      // Log failed notification
      await logNotification(incident, 'resolution', 'failed', null, errorBody);
      return false;
    }

    const result = await response.json();
    const messageId = result.messageId || null;

    // Log successful notification
    await logNotification(incident, 'resolution', 'sent', messageId, null);

    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Notifications] Failed to send email:', errorMsg);
    await logNotification(incident, 'resolution', 'failed', null, errorMsg);
    return false;
  }
}

// ---------- Send Status Update Email ----------

/**
 * Send an email when an incident status changes to "In Progress".
 */
export async function sendStatusUpdateEmail(incident: Incident): Promise<boolean> {
  if (!BREVO_API_KEY || !incident.reporter_email) return false;

  const detailUrl = `${getAppUrl()}/report/${incident.id}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9; padding: 40px 0;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
    <div style="background: #2563eb; padding: 24px 32px;">
      <h1 style="color: white; margin: 0; font-size: 20px;">🔧 Issue Update</h1>
    </div>
    <div style="padding: 32px;">
      <p style="color: #334155; font-size: 16px; margin-top: 0;">Hi ${incident.reporter_name || 'there'},</p>
      <p style="color: #334155; font-size: 16px;">Your reported issue is now being worked on by our maintenance team.</p>
      <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #eab308;">
        <p style="margin: 0 0 4px; font-weight: 600; color: #0f172a;">${incident.id} — ${incident.title}</p>
        <p style="margin: 0; color: #64748b; font-size: 14px;">📍 ${incident.location}${incident.floor ? `, ${incident.floor}` : ''}</p>
        <p style="margin: 8px 0 0; color: #ca8a04; font-weight: 600;">Status: In Progress</p>
      </div>
      <a href="${detailUrl}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 8px;">View Details</a>
    </div>
  </div>
</body>
</html>`;

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: SENDER,
        to: [{ email: incident.reporter_email, name: incident.reporter_name || '' }],
        subject: `🔧 Update: Your Issue ${incident.id} Is Being Worked On`,
        htmlContent,
      }),
    });

    const success = response.ok;
    const result = success ? await response.json() : null;
    await logNotification(
      incident,
      'status_update',
      success ? 'sent' : 'failed',
      result?.messageId || null,
      success ? null : await response.text(),
    );
    return success;
  } catch {
    return false;
  }
}

// ---------- Email Template ----------

function buildResolutionEmailHTML(
  incident: Incident,
  feedbackUrl: string,
  detailUrl: string,
): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9; padding: 40px 0;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background: #059669; padding: 24px 32px;">
      <h1 style="color: white; margin: 0; font-size: 20px;">✅ Issue Resolved</h1>
    </div>

    <!-- Body -->
    <div style="padding: 32px;">
      <p style="color: #334155; font-size: 16px; margin-top: 0;">
        Hi ${incident.reporter_name || 'there'},
      </p>
      <p style="color: #334155; font-size: 16px;">
        Great news! The issue you reported has been resolved by our maintenance team.
      </p>

      <!-- Incident Card -->
      <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #22c55e;">
        <p style="margin: 0 0 4px; font-weight: 600; color: #0f172a;">
          ${incident.id} — ${incident.title}
        </p>
        <p style="margin: 0 0 4px; color: #64748b; font-size: 14px;">
          📍 ${incident.location}${incident.floor ? `, ${incident.floor}` : ''}
        </p>
        <p style="margin: 0 0 4px; color: #64748b; font-size: 14px;">
          🏷️ ${incident.category}${incident.subcategory ? ` — ${incident.subcategory}` : ''}
        </p>
        <p style="margin: 0; color: #64748b; font-size: 14px;">
          🔧 Handled by: ${incident.department}
        </p>
      </div>

      <!-- Status Badge -->
      <div style="text-align: center; margin: 24px 0;">
        <span style="display: inline-block; background: #dcfce7; color: #166534; padding: 8px 20px; border-radius: 20px; font-weight: 600; font-size: 14px;">
          ✅ FIXED
        </span>
      </div>

      <p style="color: #334155; font-size: 16px;">
        Was the issue actually resolved to your satisfaction? Your feedback helps us improve.
      </p>

      <!-- CTA Buttons -->
      <div style="text-align: center; margin: 24px 0;">
        <a href="${feedbackUrl}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-right: 8px;">
          ⭐ Rate This Fix
        </a>
        <a href="${detailUrl}" style="display: inline-block; background: #e2e8f0; color: #334155; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          View Details
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">
        CampusPulse — Wales University Campus Operations
      </p>
    </div>

  </div>
</body>
</html>`;
}

// ---------- Notification Logging ----------

async function logNotification(
  incident: Incident,
  type: NotificationRecord['notification_type'],
  status: NotificationRecord['delivery_status'],
  messageId: string | null,
  errorMessage: string | null,
): Promise<void> {
  if (!incident.reporter_email) return;

  const { error } = await supabase.from('notifications').insert({
    incident_id: incident.id,
    recipient_email: incident.reporter_email,
    recipient_name: incident.reporter_name,
    notification_type: type,
    subject: type === 'resolution'
      ? `Issue ${incident.id} Resolved`
      : `Issue ${incident.id} Update`,
    delivery_status: status,
    brevo_message_id: messageId,
    error_message: errorMessage,
  });

  if (error) {
    console.error('[Notifications] Error logging notification:', error);
  }
}
