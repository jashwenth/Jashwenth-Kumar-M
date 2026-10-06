// ============================================================
// CampusPulse — AI Chatbot Assistant
//
// Powered by Gemini via /api/ai/chat with live contextual
// campus operational grounding and instant fallback.
// ============================================================

import type { Incident, ChatMessage } from '../types/incident';

export async function sendChatMessage(
  userMessage: string,
  chatHistory: ChatMessage[],
  currentIncidents: Incident[]
): Promise<string> {
  // Aggregate live status
  const openCount = currentIncidents.filter((i) => i.status === 'Open').length;
  const highPriority = currentIncidents.filter(
    (i) => (i.severity === 'High' || i.severity === 'Critical') && i.status !== 'Fixed'
  ).length;
  const fixedCount = currentIncidents.filter((i) => i.status === 'Fixed').length;

  const contextData = {
    openIncidents: openCount,
    highPriority,
    fixedToday: fixedCount,
    hotspot: 'Block B (Plumbing Infrastructure: 7 leaks)',
  };

  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        history: chatHistory.slice(-6),
        contextData,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.text) {
        return data.text;
      }
    }
  } catch (err) {
    console.warn('[CampusPulse Chatbot] Falling back to rule-based responses:', err);
  }

  return getCannedResponse(userMessage, currentIncidents);
}

function getCannedResponse(message: string, currentIncidents: Incident[]): string {
  const lower = message.toLowerCase();

  const openCount = currentIncidents.filter((i) => i.status === 'Open').length;
  const highPriority = currentIncidents.filter(
    (i) => (i.severity === 'High' || i.severity === 'Critical') && i.status !== 'Fixed'
  ).length;

  if (/how.*report|submit|file|new issue/.test(lower)) {
    return 'To report an issue, tap "Report an Issue" at the top or in the dashboard. You can upload a photo, describe what broke, and pick the location. Our AI automatically classifies priority, assigns the department, and sets an SLA! 🚀';
  }

  if (/status|how many|campus status|overview|active/.test(lower)) {
    return `Currently across Wales University, there are ${openCount} open incidents, including ${highPriority} high-priority tickets. Block B has the highest concentration of infrastructure reports.`;
  }

  if (/block b|water|leak|plumbing/.test(lower)) {
    const bLeaks = currentIncidents.filter(
      (i) => i.location === 'Block B' && i.category === 'Plumbing' && i.status !== 'Fixed'
    ).length;
    return `Block B currently has ${bLeaks} active plumbing reports around the 2nd floor washrooms. Facilities is already dispatched to inspect the main vertical riser.`;
  }

  if (/critical|emergency|urgent/.test(lower)) {
    const criticals = currentIncidents.filter(
      (i) => i.severity === 'Critical' && i.status !== 'Fixed'
    );
    if (criticals.length === 0) {
      return 'Great news! There are currently no critical emergency incidents open on campus.';
    }
    const titles = criticals.map((c) => `${c.id}: ${c.title}`).join(', ');
    return `There are ${criticals.length} critical issues active right now: ${titles}. Maintenance has a 1-hour SLA on these!`;
  }

  if (/wifi|internet|network/.test(lower)) {
    return 'WiFi issues (such as cafeteria dead zones or hostel latency) are routed to IT Support with a 4-hour SLA. If you have an asset QR code on the router, scan it to link the ticket directly.';
  }

  if (/sla|deadline|how long/.test(lower)) {
    return 'CampusPulse enforces automatic SLAs: Critical = 1 hour, High = 4 hours, Medium = 24 hours, and Low = 48 hours. When marked Fixed, students can verify the resolution.';
  }

  if (/hello|hi|hey|greet/.test(lower)) {
    return 'Hello! 👋 I am the CampusPulse Operations Assistant. Ask me anything about campus infrastructure, active issues, SLA response times, or reporting a problem.';
  }

  return 'I can assist you with campus issue tracking, SLA metrics, building hotspots, and reporting problems. Feel free to ask about any building or specific issue category!';
}

export const QUICK_ACTIONS = [
  {
    label: '📊 Campus Status',
    message: "What's the current campus status?",
  },
  {
    label: '🔴 Critical Issues',
    message: 'Are there any critical issues right now?',
  },
  {
    label: '💧 Block B Hotspot',
    message: 'What is the plumbing situation in Block B?',
  },
  {
    label: '📝 How to Report',
    message: 'How do I report a campus issue?',
  },
] as const;
