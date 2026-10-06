import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Building,
  Layers,
  Wrench,
  ThumbsUp,
  Image as ImageIcon,
  Loader2,
  Tag,
} from 'lucide-react';
import { campusStore } from '../lib/store';
import { analyzeIncident, fileToBase64 } from '../lib/ai';
import { findSimilarIncidents } from '../lib/duplicates';
import { LOCATIONS, FLOORS, CATEGORIES } from '../types/incident';
import type { Incident, AIAnalysisResult } from '../types/incident';
import type { Asset } from '../types/asset';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledAsset?: Asset | null;
  onSuccess?: (incident: Incident) => void;
}

const SAMPLE_PROMPTS = [
  {
    title: 'Water pipe leaking under washroom sink',
    location: 'Block B',
    floor: '2nd Floor',
    category: 'Plumbing',
  },
  {
    title: 'Ceiling tube light sparking and flickering',
    location: 'Block A',
    floor: '1st Floor',
    category: 'Electrical',
  },
  {
    title: 'AC unit blowing hot air and rattling loudly',
    location: 'Library',
    floor: '1st Floor',
    category: 'Facilities',
  },
  {
    title: 'No Wi-Fi connectivity in study area',
    location: 'Cafeteria',
    floor: 'Ground Floor',
    category: 'WiFi',
  },
  {
    title: 'Washroom floor drain blocked and backing up',
    location: 'Block B',
    floor: 'Ground Floor',
    category: 'Plumbing',
  },
];

export default function ReportIssueModal({
  isOpen,
  onClose,
  prefilledAsset,
  onSuccess,
}: ReportIssueModalProps) {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(prefilledAsset?.location || 'Block B');
  const [floor, setFloor] = useState(prefilledAsset?.floor || '2nd Floor');
  const [selectedAssetId, setSelectedAssetId] = useState(prefilledAsset?.id || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [similarIncidents, setSimilarIncidents] = useState<Incident[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'input' | 'ai_preview'>('input');
  const [allAssets, setAllAssets] = useState<Asset[]>([]);

  useEffect(() => {
    setAllAssets(campusStore.getAssets());
    const unsub = campusStore.subscribe(() => {
      setAllAssets(campusStore.getAssets());
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (prefilledAsset) {
      setLocation(prefilledAsset.location);
      if (prefilledAsset.floor) setFloor(prefilledAsset.floor);
      setSelectedAssetId(prefilledAsset.id);
      setDescription(`Issue with ${prefilledAsset.name} (${prefilledAsset.model || prefilledAsset.id}): `);
    }
  }, [prefilledAsset]);

  if (!isOpen) return null;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      const b64 = await fileToBase64(file);
      if (b64) {
        setImageBase64(b64.base64);
        setImageMime(b64.mimeType);
      }
    }
  };

  const handleRunAIAnalysis = async () => {
    if (!description.trim()) return;
    setAnalyzing(true);
    try {
      const result = await analyzeIncident(
        description,
        imageBase64,
        imageMime,
        location,
        floor
      );
      setAiResult(result);

      // Duplicate detection
      const allIncidents = campusStore.getIncidents();
      const matched = allIncidents.filter(
        (inc) =>
          inc.location === location &&
          inc.category === result.category &&
          inc.status !== 'Fixed'
      );
      setSimilarIncidents(matched);
      setStep('ai_preview');
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmitNewReport = () => {
    if (!aiResult) return;
    setSubmitting(true);
    try {
      const created = campusStore.createIncident(
        {
          description,
          image: imageFile,
          location,
          floor,
          reporter_name: 'Alex Chen',
          reporter_email: 'alex.chen@wales.edu',
          asset_id: selectedAssetId || undefined,
        },
        aiResult,
        imagePreview
      );

      onSuccess?.(created);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvoteDuplicate = (incidentId: string) => {
    const updated = campusStore.upvoteIncident(incidentId, 'Alex Chen');
    if (updated) {
      onSuccess?.(updated);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border-4 border-black rounded-3xl brutal-shadow overflow-hidden my-8 animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="bg-[#DCE8D4] border-b-4 border-black p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-[#C8E64D] flex items-center justify-center font-bold text-xl">
              CP
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-black" style={{ fontFamily: 'Lexend' }}>
                Report Campus Issue
              </h2>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Instant AI Triage • SLA Dispatch • Wales University
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border-2 border-black bg-white flex items-center justify-center hover:bg-black hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {step === 'input' ? (
            <>
              {/* Sample Quick Fillers */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">
                  Quick Examples
                </label>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_PROMPTS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setDescription(p.title);
                        setLocation(p.location);
                        setFloor(p.floor);
                      }}
                      className="text-xs font-medium bg-[#F7F6F2] hover:bg-[#C8E64D] border border-black/20 hover:border-black rounded-lg px-3 py-1.5 transition-all text-left"
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description Input */}
              <div>
                <label className="text-sm font-bold uppercase tracking-wider text-black block mb-2">
                  Problem Description *
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what is broken, leaking, sparking, or malfunctioning..."
                  className="w-full border-2 border-black rounded-xl p-4 text-base focus:outline-none focus:ring-2 focus:ring-[#C8E64D] bg-[#F7F6F2]"
                />
              </div>

              {/* Photo Upload & Preview */}
              <div>
                <label className="text-sm font-bold uppercase tracking-wider text-black block mb-2">
                  Photo Attachment (Optional)
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-black/40 hover:border-black rounded-xl p-4 cursor-pointer bg-gray-50 hover:bg-[#F7F6F2] transition-colors">
                    <Upload className="w-6 h-6 text-gray-600 mb-1" />
                    <span className="text-xs font-bold text-gray-800">Choose photo or drag file</span>
                    <span className="text-[10px] text-gray-500">JPG, PNG, WebP up to 10MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  {imagePreview && (
                    <div className="relative w-24 h-24 border-2 border-black rounded-xl overflow-hidden group">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                          setImageBase64(null);
                        }}
                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Location & Floor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold uppercase tracking-wider text-black block mb-2">
                    Campus Location *
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full border-2 border-black rounded-xl p-3 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#C8E64D]"
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold uppercase tracking-wider text-black block mb-2">
                    Floor Level
                  </label>
                  <select
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full border-2 border-black rounded-xl p-3 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#C8E64D]"
                  >
                    {FLOORS.map((fl) => (
                      <option key={fl} value={fl}>
                        {fl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Linked Campus Asset (QR code or select) */}
              <div>
                <label className="text-sm font-bold uppercase tracking-wider text-black block mb-2">
                  Linked Physical Asset (Optional)
                </label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full border-2 border-black rounded-xl p-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8E64D]"
                >
                  <option value="">None / General Building Infrastructure</option>
                  {allAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.id} — {asset.name} ({asset.location}, {asset.floor})
                    </option>
                  ))}
                </select>
                {selectedAssetId && (
                  <p className="text-xs text-green-700 font-semibold mt-1">
                    ✓ Linked to asset QR code: {selectedAssetId}
                  </p>
                )}
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={!description.trim() || analyzing}
                onClick={handleRunAIAnalysis}
                className="w-full bg-black text-white hover:bg-[#C8E64D] hover:text-black transition-all py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 brutal-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing with Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-[#C8E64D] group-hover:text-black" />
                    <span>Analyze with AI Triage & Preview</span>
                  </>
                )}
              </button>
            </>
          ) : (
            /* STEP 2: AI Triage Result & Duplicate Warning */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Duplicate Warning if similar issues found */}
              {similarIncidents.length > 0 && (
                <div className="bg-amber-50 border-3 border-amber-500 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-3 text-amber-900 font-bold text-base mb-2">
                    <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                    <span>
                      Potential Duplicate Detected ({similarIncidents.length} similar active issue{similarIncidents.length > 1 ? 's' : ''})
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 mb-4">
                    Other students have already reported similar problems in {location}. You can confirm an existing report to escalate its priority instead of creating a duplicate ticket!
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {similarIncidents.map((sim) => (
                      <div
                        key={sim.id}
                        className="bg-white border-2 border-black/20 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-bold bg-black text-white px-2 py-0.5 rounded text-[10px]">
                              {sim.id}
                            </span>
                            <span className="font-semibold text-gray-900 truncate">{sim.title}</span>
                          </div>
                          <p className="text-gray-500 line-clamp-1">{sim.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUpvoteDuplicate(sim.id)}
                          className="bg-black hover:bg-[#C8E64D] hover:text-black text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 flex-shrink-0 transition-colors"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>Confirm (+1)</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Classification Summary Card */}
              <div className="bg-[#DCE8D4] border-3 border-black rounded-2xl p-6 brutal-shadow relative">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-black" />
                  <span className="text-xs font-bold uppercase tracking-wider text-black">
                    CampusPulse AI Triage Output
                  </span>
                </div>

                <h3 className="text-xl font-bold text-black mb-1" style={{ fontFamily: 'Lexend' }}>
                  {aiResult?.subcategory || 'Infrastructure Incident'}
                </h3>
                <p className="text-sm text-gray-800 font-medium mb-4">
                  "{aiResult?.summary}"
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white/80 border border-black/20 rounded-xl p-3">
                    <span className="text-gray-500 block uppercase font-bold text-[10px]">Category</span>
                    <span className="font-bold text-black text-sm">{aiResult?.category}</span>
                  </div>
                  <div className="bg-white/80 border border-black/20 rounded-xl p-3">
                    <span className="text-gray-500 block uppercase font-bold text-[10px]">Severity</span>
                    <span
                      className={`font-bold text-sm ${
                        aiResult?.severity === 'Critical'
                          ? 'text-red-600'
                          : aiResult?.severity === 'High'
                          ? 'text-orange-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {aiResult?.severity} Priority
                    </span>
                  </div>
                  <div className="bg-white/80 border border-black/20 rounded-xl p-3">
                    <span className="text-gray-500 block uppercase font-bold text-[10px]">Target SLA</span>
                    <span className="font-bold text-black text-sm">{aiResult?.suggested_sla_hours} Hours</span>
                  </div>
                  <div className="bg-white/80 border border-black/20 rounded-xl p-3">
                    <span className="text-gray-500 block uppercase font-bold text-[10px]">Routed To</span>
                    <span className="font-bold text-black text-sm truncate block" title={aiResult?.department}>
                      {aiResult?.department}
                    </span>
                  </div>
                </div>

                {aiResult?.keywords && aiResult.keywords.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5 items-center">
                    <Tag className="w-3.5 h-3.5 text-gray-600" />
                    {aiResult.keywords.map((kw, i) => (
                      <span key={i} className="bg-white/90 border border-black/10 text-[11px] font-mono px-2 py-0.5 rounded">
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="flex-1 border-2 border-black rounded-xl py-3 text-sm font-bold hover:bg-gray-100 transition-colors"
                >
                  ← Edit Report
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmitNewReport}
                  className="flex-2 bg-black text-white hover:bg-[#C8E64D] hover:text-black font-bold py-3.5 rounded-xl text-base transition-colors flex items-center justify-center gap-2 brutal-shadow"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-[#C8E64D]" />
                      <span>Confirm & File Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
