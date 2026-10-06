// ============================================================
// CampusPulse — Asset Management & QR Code System
//
// Each physical asset (AC, machine, equipment) gets a row
// in the assets table. A QR code sticker on the physical item
// encodes a URL that pre-fills the report form.
//
// Flow: Student scans QR → URL opens app with asset_id param →
//       App fetches asset details → Form pre-fills location,
//       model, asset type → Student adds description + photo
// ============================================================

import { supabase } from './supabase';
import type { Asset, QRScanData, CreateAssetData } from '../types/asset';

// ---------- Configuration ----------

/**
 * Base URL for QR code links. Update this to your deployed URL.
 * The QR code URL format is: {BASE_URL}/report?asset={asset_id}
 */
function getBaseUrl(): string {
  return import.meta.env.VITE_APP_URL || window.location.origin;
}

// ---------- QR Code URL Generation ----------

/**
 * Generate the URL that a QR code should encode for a given asset.
 *
 * Example: https://campuspulse.azurewebsites.net/report?asset=AST-0005
 *
 * When scanned, the student's browser opens the report form
 * with location, floor, and asset info pre-filled.
 */
export function generateQRCodeURL(assetId: string): string {
  return `${getBaseUrl()}/report?asset=${encodeURIComponent(assetId)}`;
}

/**
 * Generate a batch of QR code URLs for multiple assets.
 * Useful for printing QR sticker sheets.
 */
export function generateBatchQRCodeURLs(
  assets: Asset[],
): Array<{ asset: Asset; qrUrl: string }> {
  return assets.map((asset) => ({
    asset,
    qrUrl: generateQRCodeURL(asset.id),
  }));
}

// ---------- QR Scan Handling ----------

/**
 * When a student scans a QR code, this function fetches the
 * asset details and returns pre-fill data for the report form.
 *
 * Call this when the report page detects an `asset` query parameter.
 */
export async function handleQRScan(assetId: string): Promise<QRScanData | null> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('id', assetId)
    .single();

  if (error || !data) {
    console.error('[Assets] QR scan — asset not found:', assetId, error);
    return null;
  }

  const asset = data as Asset;

  // Determine warranty status
  let warrantyStatus: QRScanData['warranty_status'] = 'Unknown';
  if (asset.warranty_expiry) {
    warrantyStatus = new Date(asset.warranty_expiry) > new Date()
      ? 'Under Warranty'
      : 'Expired';
  }

  return {
    asset_id: asset.id,
    asset_name: asset.name,
    asset_type: asset.asset_type,
    model: asset.model,
    serial_number: asset.serial_number,
    location: asset.location,
    floor: asset.floor,
    room: asset.room,
    warranty_status: warrantyStatus,
  };
}

// ---------- Asset CRUD ----------

/**
 * Fetch all assets, optionally filtered.
 */
export async function fetchAssets(filters?: {
  location?: string;
  asset_type?: string;
  status?: string;
}): Promise<Asset[]> {
  let query = supabase
    .from('assets')
    .select('*')
    .order('location', { ascending: true })
    .order('name', { ascending: true });

  if (filters?.location) query = query.eq('location', filters.location);
  if (filters?.asset_type) query = query.eq('asset_type', filters.asset_type);
  if (filters?.status) query = query.eq('status', filters.status);

  const { data, error } = await query;

  if (error) {
    console.error('[Assets] Error fetching assets:', error);
    return [];
  }

  return (data as Asset[]) || [];
}

/**
 * Fetch a single asset by ID.
 */
export async function fetchAssetById(id: string): Promise<Asset | null> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[Assets] Error fetching asset:', error);
    return null;
  }

  return data as Asset;
}

/**
 * Create a new asset (admin only).
 */
export async function createAsset(assetData: CreateAssetData): Promise<Asset | null> {
  const { data, error } = await supabase
    .from('assets')
    .insert(assetData)
    .select()
    .single();

  if (error) {
    console.error('[Assets] Error creating asset:', error);
    return null;
  }

  return data as Asset;
}

/**
 * Update an asset (admin only).
 */
export async function updateAsset(
  id: string,
  updates: Partial<CreateAssetData & { status: Asset['status']; last_serviced: string }>,
): Promise<Asset | null> {
  const { data, error } = await supabase
    .from('assets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Assets] Error updating asset:', error);
    return null;
  }

  return data as Asset;
}

/**
 * Mark an asset as decommissioned (soft delete).
 */
export async function decommissionAsset(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('assets')
    .update({ status: 'Decommissioned' })
    .eq('id', id);

  if (error) {
    console.error('[Assets] Error decommissioning asset:', error);
    return false;
  }

  return true;
}

// ---------- Asset Analytics ----------

/**
 * Get the number of incidents linked to each asset.
 * Shows which equipment breaks down most often.
 */
export async function getAssetIncidentCounts(): Promise<
  Array<{ asset_id: string; asset_name: string; incident_count: number }>
> {
  const { data, error } = await supabase
    .from('incidents')
    .select('asset_id')
    .not('asset_id', 'is', null);

  if (error || !data) return [];

  // Count incidents per asset
  const counts = new Map<string, number>();
  for (const row of data) {
    const id = row.asset_id as string;
    counts.set(id, (counts.get(id) || 0) + 1);
  }

  // Fetch asset names
  const assetIds = Array.from(counts.keys());
  if (assetIds.length === 0) return [];

  const { data: assets } = await supabase
    .from('assets')
    .select('id, name')
    .in('id', assetIds);

  if (!assets) return [];

  return (assets as any[]).map((a: any) => ({
    asset_id: a.id as string,
    asset_name: a.name as string,
    incident_count: counts.get(a.id as string) || 0,
  })).sort((a: any, b: any) => b.incident_count - a.incident_count);
}

/**
 * Get assets with expired or soon-expiring warranties.
 */
export async function getWarrantyAlerts(daysThreshold: number = 30): Promise<Asset[]> {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .not('warranty_expiry', 'is', null)
    .lte('warranty_expiry', thresholdDate.toISOString())
    .eq('status', 'Active')
    .order('warranty_expiry', { ascending: true });

  if (error) {
    console.error('[Assets] Error fetching warranty alerts:', error);
    return [];
  }

  return (data as Asset[]) || [];
}
