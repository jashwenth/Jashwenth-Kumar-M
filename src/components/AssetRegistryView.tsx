import React, { useState, useEffect, useMemo } from 'react';
import {
  QrCode,
  Search,
  Wrench,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Plus,
  Printer,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { campusStore } from '../lib/store';
import { ASSET_TYPE_ICONS } from '../types/asset';
import type { Asset, AssetType } from '../types/asset';

interface AssetRegistryViewProps {
  onReportForAsset: (asset: Asset) => void;
}

export default function AssetRegistryView({ onReportForAsset }: AssetRegistryViewProps) {
  const [assets, setAssets] = useState<Asset[]>(() => campusStore.getAssets());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | AssetType>('All');
  const [locationFilter, setLocationFilter] = useState<string>('All');
  const [selectedAssetForQR, setSelectedAssetForQR] = useState<Asset | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = campusStore.subscribe(() => {
      setAssets(campusStore.getAssets());
    });
    return unsub;
  }, []);

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (typeFilter !== 'All' && a.asset_type !== typeFilter) return false;
      if (locationFilter !== 'All' && a.location !== locationFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          a.id.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          (a.model && a.model.toLowerCase().includes(q)) ||
          a.location.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [assets, search, typeFilter, locationFilter]);

  const handleCopyUrl = (assetId: string) => {
    const url = `${window.location.origin}/report?asset=${assetId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(assetId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white border-4 border-black rounded-3xl p-6 brutal-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <QrCode className="w-4 h-4 text-black" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Campus Asset Registry • QR Code Sticker System
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-black" style={{ fontFamily: 'Lexend' }}>
            Equipment & QR Code Hub
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Scan any physical asset QR code to pre-populate maintenance requests with serial number, location, and warranty data.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#DCE8D4] border-2 border-black rounded-2xl px-4 py-2 text-xs font-bold">
            Total Tracked: <span className="font-mono text-base">{assets.length} Assets</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border-4 border-black rounded-3xl p-6 brutal-shadow space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets by ID, name, manufacturer, or model..."
              className="w-full pl-11 pr-4 py-3 border-2 border-black rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C8E64D] bg-[#F7F6F2]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="text-xs font-bold border-2 border-black rounded-xl px-3 py-2.5 bg-white focus:outline-none"
            >
              <option value="All">All Asset Types</option>
              {Object.keys(ASSET_TYPE_ICONS).map((t) => (
                <option key={t} value={t}>
                  {ASSET_TYPE_ICONS[t as AssetType]} {t}
                </option>
              ))}
            </select>

            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="text-xs font-bold border-2 border-black rounded-xl px-3 py-2.5 bg-white focus:outline-none"
            >
              <option value="All">All Locations</option>
              {['Block A', 'Block B', 'Library', 'Cafeteria', 'Hostel 1', 'Hostel 2', 'Sports Complex'].map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Asset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssets.map((asset) => {
          const isUnderRepair = asset.status === 'Under Repair';
          const icon = ASSET_TYPE_ICONS[asset.asset_type] || '📦';
          const qrUrl = `${window.location.origin}/report?asset=${asset.id}`;

          return (
            <div
              key={asset.id}
              className="bg-white border-3 border-black rounded-3xl p-6 brutal-shadow flex flex-col justify-between hover:-translate-y-1 transition-all group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl p-2 bg-[#F7F6F2] rounded-xl border border-black/10">
                      {icon}
                    </span>
                    <div>
                      <span className="font-mono text-xs font-bold bg-black text-[#C8E64D] px-2 py-0.5 rounded">
                        {asset.id}
                      </span>
                      <h3 className="font-bold text-base text-black mt-1 leading-snug">{asset.name}</h3>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border border-black ${
                      isUnderRepair
                        ? 'bg-amber-300 text-black'
                        : 'bg-green-300 text-black'
                    }`}
                  >
                    {asset.status}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-gray-600 bg-[#F7F6F2] p-3 rounded-xl border border-black/10 my-3">
                  <p>
                    <strong>Location:</strong> {asset.location} • {asset.floor || 'Ground'} {asset.room ? `(${asset.room})` : ''}
                  </p>
                  <p>
                    <strong>Model:</strong> {asset.model || 'Standard'} ({asset.manufacturer || 'OEM'})
                  </p>
                  <p>
                    <strong>Serial No:</strong> <span className="font-mono">{asset.serial_number || 'N/A'}</span>
                  </p>
                  <p>
                    <strong>Warranty:</strong> {asset.warranty_expiry ? `Exp: ${asset.warranty_expiry}` : 'Standard'}
                  </p>
                </div>
              </div>

              {/* QR Code & Actions */}
              <div className="pt-3 border-t border-black/10 flex items-center justify-between gap-3">
                <div
                  onClick={() => setSelectedAssetForQR(asset)}
                  title="Click to expand QR Code"
                  className="p-1.5 bg-white border border-black rounded-xl cursor-pointer hover:scale-105 transition-transform"
                >
                  <QRCodeSVG value={qrUrl} size={48} />
                </div>

                <div className="flex items-center gap-2 flex-1 justify-end">
                  <button
                    onClick={() => handleCopyUrl(asset.id)}
                    title="Copy QR link URL"
                    className="p-2 rounded-xl border border-black bg-white hover:bg-gray-100 text-xs font-bold transition-colors"
                  >
                    {copiedId === asset.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => onReportForAsset(asset)}
                    className="bg-black hover:bg-[#C8E64D] hover:text-black text-white text-xs font-bold px-3 py-2 rounded-xl border-2 border-black flex items-center gap-1.5 transition-colors"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Scan & Report</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* QR Code Expand / Print Modal */}
      {selectedAssetForQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border-4 border-black rounded-3xl p-8 brutal-shadow max-w-sm w-full text-center space-y-4 animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-black" style={{ fontFamily: 'Lexend' }}>
              Campus Equipment Sticker
            </h3>
            <span className="font-mono text-sm font-bold bg-black text-[#C8E64D] px-3 py-1 rounded-md inline-block">
              {selectedAssetForQR.id}
            </span>
            <p className="text-xs text-gray-600 font-medium">{selectedAssetForQR.name}</p>

            <div className="p-4 bg-[#F7F6F2] border-2 border-black rounded-2xl inline-block mx-auto">
              <QRCodeSVG
                value={`${window.location.origin}/report?asset=${selectedAssetForQR.id}`}
                size={180}
              />
            </div>

            <p className="text-[11px] text-gray-500 font-medium">
              Location: {selectedAssetForQR.location} • {selectedAssetForQR.floor}
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelectedAssetForQR(null)}
                className="flex-1 py-2.5 rounded-xl border-2 border-black font-bold text-xs hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 rounded-xl bg-black text-white font-bold text-xs hover:bg-[#C8E64D] hover:text-black border-2 border-black transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Sticker</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
