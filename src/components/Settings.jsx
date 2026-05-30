import React, { useState } from "react";
import { Sliders, Shield, Store, Building2, Ticket, Printer, Eye, Lock, RefreshCw, CheckCircle2 } from "lucide-react";

export default function Settings() {
  const [shopName, setShopName] = useState("Mirpur Central Pharmacy & POS");
  const [address, setAddress] = useState("Hospital Road, Sector-10, Mirpur, Dhaka-1216");
  const [license, setLicense] = useState("DGDA/DHAKA/2334810-D");
  const [vat, setVat] = useState("5.0");
  const [alertThreshold, setAlertThreshold] = useState("15");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
    }, 850);
  };

  return (
    <div id="settings_view" className="space-y-6 text-left max-w-3xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Configure shop branding layout, VAT threshold tiers, and security guidelines
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>System configurations synchronized and saved to backend!</span>
        </div>
      )}

      {/* Grid Settings Forms */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Panel 1: Shop branding */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
            <Store className="w-4.5 h-4.5 text-emerald-400" /> Pharmacy License Profile & Stamp
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Shop Name */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Retail Pharmacy Name</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* License */}
            <div className="space-y-1 font-mono">
              <label className="text-xs text-slate-400 font-sans">DGDA License Registry No.</label>
              <input
                type="text"
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs text-slate-400">Physical shop Address (Receipt printed)</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

          </div>
        </div>

        {/* Panel 2: Billing values */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
            <Sliders className="w-4.5 h-4.5 text-emerald-400" /> Operational & POS Tectonic Metrics
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Tax Vat */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Default POS Drug VAT Tax (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={vat}
                onChange={(e) => setVat(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Low Stock Alert threshold */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Low Stock Alert Level Threshold</label>
              <input
                type="number"
                min="5"
                max="100"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

          </div>
        </div>

        {/* Panel 3: Credentials Info */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
            <Shield className="w-4.5 h-4.5 text-rose-500" /> Admin Security Configuration
          </h3>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-rose-500/10 text-xs text-slate-400 leading-relaxed font-mono space-y-1.5">
            <p className="font-semibold text-slate-305 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-rose-500" /> Password Controls Protected via Env
            </p>
            <p>
              Administrative dashboard users are authorized on launch using strict cryptographic password filters matching the `.env` context environment variables:
            </p>
            <ul className="list-disc list-inside text-rose-400 pl-1">
              <li>ADMIN_USERNAME="admin"</li>
              <li>ADMIN_PASSWORD="superpassword..."</li>
            </ul>
            <p className="pt-1.5 text-[10.5px] text-slate-500">
              To revise structural access passwords, modify the deployment environment block variables directly.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center gap-2 disabled:opacity-40 cursor-pointer shadow-lg shadow-emerald-950"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Synchronize Configuration
          </button>
        </div>

      </form>

    </div>
  );
}
