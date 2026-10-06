// ============================================================
// CampusPulse — AI Analysis Engine
//
// Calls the backend server proxy (/api/ai/analyze) powered by
// Gemini. Includes an intelligent deterministic fallback
// classifier so triage NEVER fails even if offline.
// ============================================================

import type { AIAnalysisResult, Category } from '../types/incident';

const VALID_CATEGORIES: Category[] = [
  'Electrical', 'Plumbing', 'WiFi', 'Cleanliness',
  'Infrastructure', 'Facilities', 'Safety', 'Other',
];

const VALID_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'] as const;

export async function analyzeIncident(
  description: string,
  imageBase64: string | null = null,
  imageMimeType: string | null = null,
  location: string = 'Campus',
  floor: string = ''
): Promise<AIAnalysisResult> {
  try {
    const res = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description,
        imageBase64,
        imageMimeType,
        location,
        floor,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (!data.useFallback && data.category) {
        return validateAIResponse(data, description);
      }
    }
  } catch (error) {
    console.warn('[CampusPulse AI] Server call failed, using intelligent fallback:', error);
  }

  // Fallback classifier
  return fallbackClassifier(description);
}

function validateAIResponse(parsed: Record<string, unknown>, description: string): AIAnalysisResult {
  const category = VALID_CATEGORIES.includes(parsed.category as Category)
    ? (parsed.category as Category)
    : inferCategoryFromText(description);

  const severity = VALID_SEVERITIES.includes(parsed.severity as typeof VALID_SEVERITIES[number])
    ? (parsed.severity as AIAnalysisResult['severity'])
    : inferSeverityFromText(description);

  const suggestedSla = typeof parsed.suggested_sla_hours === 'number'
    && [1, 4, 8, 24, 48].includes(parsed.suggested_sla_hours)
    ? parsed.suggested_sla_hours
    : getSLAFromSeverity(severity);

  const keywords = Array.isArray(parsed.keywords)
    ? (parsed.keywords as unknown[]).filter((k): k is string => typeof k === 'string').slice(0, 7)
    : extractKeywords(description);

  return {
    category,
    subcategory: typeof parsed.subcategory === 'string' && parsed.subcategory.trim() ? parsed.subcategory : 'General',
    severity,
    summary: typeof parsed.summary === 'string' && parsed.summary.trim()
      ? parsed.summary.slice(0, 150)
      : description.slice(0, 100),
    department: typeof parsed.department === 'string' && parsed.department.trim()
      ? parsed.department
      : getDepartmentFromCategory(category),
    suggested_sla_hours: suggestedSla,
    keywords,
  };
}

export function fallbackClassifier(description: string): AIAnalysisResult {
  const category = inferCategoryFromText(description);
  const severity = inferSeverityFromText(description);

  return {
    category,
    subcategory: inferSubcategory(description, category),
    severity,
    summary: description.length > 80 ? `${description.slice(0, 77)}...` : description || 'Incident reported',
    department: getDepartmentFromCategory(category),
    suggested_sla_hours: getSLAFromSeverity(severity),
    keywords: extractKeywords(description),
  };
}

function inferCategoryFromText(text: string): Category {
  const lower = text.toLowerCase();
  if (/water|leak|tap|pipe|drain|plumb|flush|seep|flood|sink|washroom|toilet/.test(lower)) return 'Plumbing';
  if (/light|power|electric|wire|switch|fan|outlet|volt|fuse|spark|bulb|blackout/.test(lower)) return 'Electrical';
  if (/wifi|wi-fi|internet|network|connect|signal|router|bandwidth|slow speed|latency/.test(lower)) return 'WiFi';
  if (/clean|dirty|wash|garbage|trash|smell|stain|hygien|sweep|mop|spill|odor/.test(lower)) return 'Cleanliness';
  if (/chair|desk|door|window|wall|roof|crack|tile|paint|stair|bench|lock/.test(lower)) return 'Infrastructure';
  if (/fire|hazard|danger|unsafe|exposed|slip|accident|emergency|cctv|smoke|extinguisher/.test(lower)) return 'Safety';
  if (/gym|equipment|machine|locker|room|facility|ac|air condition|cooler|projector|printer/.test(lower)) return 'Facilities';
  return 'Other';
}

function inferSubcategory(text: string, category: Category): string {
  const lower = text.toLowerCase();
  if (category === 'Plumbing') {
    if (lower.includes('flood')) return 'Flooding';
    if (lower.includes('tap') || lower.includes('faucet')) return 'Faucet Leak';
    if (lower.includes('drain')) return 'Drainage Blockage';
    if (lower.includes('toilet') || lower.includes('flush')) return 'Toilet Flush Issue';
    return 'Pipe Leak';
  }
  if (category === 'Electrical') {
    if (lower.includes('spark') || lower.includes('outlet')) return 'Electrical Outlet Spark';
    if (lower.includes('light') || lower.includes('flicker')) return 'Lighting Failure';
    if (lower.includes('fan')) return 'Fan Malfunction';
    return 'Power Failure';
  }
  if (category === 'WiFi') {
    if (lower.includes('dead') || lower.includes('no signal')) return 'WiFi Dead Zone';
    return 'Slow Network Speed';
  }
  if (category === 'Facilities') {
    if (lower.includes('ac') || lower.includes('cooling')) return 'HVAC Cooling Failure';
    if (lower.includes('projector')) return 'AV Projector Issue';
    if (lower.includes('printer')) return 'Printer Jam';
    if (lower.includes('cooler')) return 'Water Cooler Defect';
    return 'Equipment Maintenance';
  }
  if (category === 'Safety') {
    if (lower.includes('fire') || lower.includes('extinguisher')) return 'Fire Safety Violation';
    if (lower.includes('cctv') || lower.includes('camera')) return 'Surveillance Failure';
    return 'Hazard Alert';
  }
  return 'General Maintenance';
}

function inferSeverityFromText(text: string): AIAnalysisResult['severity'] {
  const lower = text.toLowerCase();
  if (/flood|fire|spark|exposed wire|gas leak|emergency|danger|collapse|electr|stuck/.test(lower)) return 'Critical';
  if (/leak|outage|broken|overflow|hazard|slip|unsafe|major|urgent|cracked glass|dead zone/.test(lower)) return 'High';
  if (/minor|small|cosmetic|paint|squeak|stain|faded|scratch|warm water/.test(lower)) return 'Low';
  return 'Medium';
}

function getDepartmentFromCategory(category: Category): string {
  const map: Record<Category, string> = {
    Electrical: 'Electrical Maintenance',
    Plumbing: 'Plumbing Maintenance',
    WiFi: 'IT Support',
    Cleanliness: 'Housekeeping',
    Infrastructure: 'Civil Maintenance',
    Safety: 'Campus Security',
    Facilities: 'Facilities Management',
    Other: 'Facilities Management',
  };
  return map[category] || 'Facilities Management';
}

function getSLAFromSeverity(severity: AIAnalysisResult['severity']): number {
  switch (severity) {
    case 'Critical': return 1;
    case 'High': return 4;
    case 'Medium': return 24;
    case 'Low': return 48;
  }
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'is', 'at', 'in', 'on', 'a', 'an', 'and', 'or', 'but', 'to',
    'of', 'for', 'it', 'not', 'has', 'have', 'had', 'are', 'was', 'were',
    'been', 'be', 'being', 'this', 'that', 'with', 'from', 'very', 'there',
    'can', 'cannot', 'could', 'would', 'should', 'will', 'just', 'also',
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
    .slice(0, 5);
}

export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string } | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      if (base64) {
        resolve({ base64, mimeType: file.type || 'image/jpeg' });
      } else {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}
