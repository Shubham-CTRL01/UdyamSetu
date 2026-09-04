import { useState } from "react";
import {
  MapPin, Calendar, IndianRupee, List, CheckCircle,
  Users, Clipboard, AlertCircle, Save, Loader2
} from "lucide-react";

const inputCls =
  "w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 placeholder-slate-400 outline-none focus:border-[#0B192C] focus:ring-2 focus:ring-[#0B192C]/10 transition-all";
const textareaCls = inputCls + " resize-none min-h-[80px]";
const selectCls = inputCls + " cursor-pointer";

export default function PilotOfferForm({ challenge, application, existingOffer, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(() => ({
    objective: existingOffer?.objective || `Pilot ${challenge?.title || ""}`,
    location: existingOffer?.location || challenge?.location || "",
    duration: existingOffer?.duration || 90,
    proposed_budget: existingOffer?.proposed_budget || "",
    start_date: existingOffer?.start_date || "",
    deliverables: existingOffer?.deliverables || "",
    success_criteria: existingOffer?.success_criteria || "",
    beneficiaries: existingOffer?.beneficiaries || "",
    special_conditions: existingOffer?.special_conditions || "",
    additional_notes: existingOffer?.additional_notes || "",
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="space-y-5">
      <div className="pb-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-900 text-base" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          {existingOffer ? "Edit Pilot Offer" : "Create New Pilot Offer"}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Challenge: {challenge?.title} · Department: {challenge?.department}
        </p>
      </div>

      {form.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{form.error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Pilot Objective <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.objective}
            onChange={(e) => setForm({ ...form, objective: e.target.value })}
            placeholder="Describe what this pilot aims to test and validate..."
            required
            className={textareaCls}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              <MapPin className="w-3.5 h-3.5 inline mr-1" /> Pilot Location
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Delhi NCR, Campus zones"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              <Calendar className="w-3.5 h-3.5 inline mr-1" /> Duration (days)
            </label>
            <input
              type="number"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 0 })}
              min="1"
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              <IndianRupee className="w-3.5 h-3.5 inline mr-1" /> Proposed Budget
            </label>
            <input
              type="number"
              value={form.proposed_budget}
              onChange={(e) => {
                const val = e.target.value;
                setForm({ ...form, proposed_budget: val ? parseFloat(val) : "" });
              }}
              placeholder="e.g. 800000"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            <List className="w-3.5 h-3.5 inline mr-1" /> Expected Deliverables
          </label>
          <textarea
            value={form.deliverables}
            onChange={(e) => setForm({ ...form, deliverables: e.target.value })}
            placeholder="List the key deliverables expected from the pilot..."
            className={textareaCls}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            <CheckCircle className="w-3.5 h-3.5 inline mr-1" /> Success Criteria
          </label>
          <textarea
            value={form.success_criteria}
            onChange={(e) => setForm({ ...form, success_criteria: e.target.value })}
            placeholder="Define measurable success criteria for the pilot..."
            className={textareaCls}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            <Users className="w-3.5 h-3.5 inline mr-1" /> Number of Users / Beneficiaries
          </label>
          <input
            type="number"
            value={form.beneficiaries}
            onChange={(e) => {
              const val = e.target.value;
              setForm({ ...form, beneficiaries: val ? parseInt(val) : "" });
            }}
            placeholder="e.g. 5000"
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            <Clipboard className="w-3.5 h-3.5 inline mr-1" /> Special Requirements / Conditions
          </label>
          <textarea
            value={form.special_conditions}
            onChange={(e) => setForm({ ...form, special_conditions: e.target.value })}
            placeholder="Any special conditions, compliance requirements, or restrictions..."
            className={textareaCls}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Additional Notes
          </label>
          <textarea
            value={form.additional_notes}
            onChange={(e) => setForm({ ...form, additional_notes: e.target.value })}
            placeholder="Any additional context or remarks..."
            className={textareaCls}
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !form.objective || !form.proposed_budget}
            className="px-6 py-2.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white font-bold text-xs rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? "Saving..." : existingOffer ? "Update Pilot Offer" : "Create Pilot Offer"}
          </button>
        </div>
      </form>
    </div>
  );
}
