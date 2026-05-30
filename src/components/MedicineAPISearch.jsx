import React, { useState } from "react";
import { Search, Database, ArrowLeft, ArrowDown, HelpCircle, Check, Sparkles, Loader, AlertCircle } from "lucide-react";

export default function MedicineAPISearch({ onImportMedicine, medicines, categories, onCancel }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  // Tracking import states for dynamic popups on each search card
  const [activeImportId, setActiveImportId] = useState(null);
  const [importStock, setImportStock] = useState("100");
  const [importExpiry, setImportExpiry] = useState("");
  const [importBatch, setImportBatch] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setResults([]);
    setError("");
    setActiveImportId(null);

    try {
      const response = await fetch(`/api/medicine-api/search?query=${encodeURIComponent(query.trim())}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
        if (data.length === 0) {
          setError(`No match registered in DGDA registry for "${query}"`);
        }
      } else {
        setError("Failed to retrieve registry records");
      }
    } catch (err) {
      console.error(err);
      setError("Connection breakdown querying DGDA Medicine Registry");
    } finally {
      setSearching(false);
    }
  };

  // Check if brand is already registered in local database
  const isAlreadyImported = (brandName, genericName, manufacturer) => {
    return medicines.some(
      m => 
        m.name.toLowerCase() === brandName.toLowerCase() &&
        m.generic_name.toLowerCase() === genericName.toLowerCase() &&
        m.manufacturer.toLowerCase() === manufacturer.toLowerCase()
    );
  };

  const startImportWizard = (index, item) => {
    setActiveImportId(index);
    setImportStock("100");
    setImportBatch(`B-${Math.floor(10000 + Math.random() * 90000)}`);
    
    // Default expiration is exactly 1.5 years from today
    const exp = new Date();
    exp.setMonth(exp.getMonth() + 18);
    setImportExpiry(exp.toISOString().split("T")[0]);
  };

  const confirmImport = (item) => {
    // Validate inputs
    if (!importStock || parseInt(importStock) <= 0) {
      alert("Specify positive stock count to adjust");
      return;
    }
    if (!importExpiry) {
      alert("Expiration date required");
      return;
    }

    const completedRecord = {
      name: item.name,
      generic_name: item.generic_name,
      brand: item.brand || item.name,
      manufacturer: item.manufacturer,
      category: item.category || "Others",
      dosage_form: item.dosage_form || "Tablet",
      strength: item.strength || "500 mg",
      price: parseFloat(item.price) || 2.00,
      stock_quantity: parseInt(importStock),
      expiry_date: importExpiry,
      batch_number: importBatch,
      description: item.description || "Imported registry record."
    };

    onImportMedicine(completedRecord);
    setActiveImportId(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-left">
      
      {/* Navigation and Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="p-2 border border-slate-800 bg-slate-900 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" /> Bangladesh Medicine Registry importer
          </h1>
          <p className="text-slate-400 text-xs">
            Dynamic lookup mapping the officially registered DGDA (Directorate General of Drug Administration) database. Search by Brand or Generic name to auto-fill profiles.
          </p>
        </div>
      </div>

      {/* Lookup Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 inset-y-0 my-auto text-slate-500 w-4 h-4" />
            <input
              id="registry_api_query_input"
              type="text"
              required
              placeholder="e.g. Napa, Sergel, Atorvastatin, Incepta, Square, Fexo..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all"
            />
          </div>
          <button
            id="registry_api_search_btn"
            type="submit"
            disabled={searching}
            className="px-6 py-3 bg-indigo-600 text-slate-100 placeholder-indigo-100 text-sm font-semibold rounded-xl hover:bg-indigo-550 transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-950"
          >
            {searching ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            Search Registry
          </button>
        </form>

        <p className="text-[10px] text-slate-500 font-mono text-center">
          Pro-tip: Looking up by brand offers faster auto-fill indexing (Backed by Gemini AI live search)
        </p>
      </div>

      {/* Main Container - Results list */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4.5 h-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results grid */}
      <div className="space-y-4">
        {results.length > 0 && (
          <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest font-mono">
            Drug Registry Matches ({results.length})
          </h2>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((item, idx) => {
            const alreadyExists = isAlreadyImported(item.name || "", item.generic_name || "", item.manufacturer || "");
            const isImporting = activeImportId === idx;

            return (
              <div 
                key={idx} 
                className={`bg-slate-900 border text-left p-5 rounded-2xl flex flex-col justify-between gap-4 transition-all ${
                  isImporting ? "border-indigo-550 ring-1 ring-indigo-550/20" : alreadyExists ? "border-slate-800 opacity-75" : "border-slate-800 hover:border-slate-700"
                }`}
              >
                
                {/* Product Meta Card */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-100 text-base">{item.name}</span>
                      <span className="text-slate-400 text-xs font-mono block">
                        {item.generic_name} ({item.strength || "Unknown Strength"})
                      </span>
                    </div>
                    {alreadyExists ? (
                      <span className="shrink-0 px-2.5 py-0.5 text-[9px] uppercase font-semibold font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        In Store
                      </span>
                    ) : (
                      <span className="shrink-0 px-2.5 py-0.5 text-[9px] uppercase font-semibold font-mono rounded bg-slate-950/60 text-indigo-400 border border-slate-800">
                        DGDA Verified
                      </span>
                    )}
                  </div>

                  <div className="text-slate-400 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Pharma Company:</span>
                      <span className="font-semibold text-slate-300 truncate max-w-[170px]">{item.manufacturer}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Category:</span>
                      <span className="px-1.5 py-0.2 bg-slate-950 text-slate-300 rounded text-[10px] font-mono">{item.category || "Others"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Form / Medium:</span>
                      <span className="font-semibold text-slate-300">{item.dosage_form || "Tablet"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Benchmark Retail:</span>
                      <span className="font-mono font-bold text-indigo-400">৳{parseFloat(item.price || 0).toFixed(2)} / unit</span>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-800/50 pt-2 italic">
                      &ldquo;{item.description}&rdquo;
                    </p>
                  )}
                </div>

                {/* Import control toggle */}
                <div className="border-t border-slate-800/80 pt-4 mt-1">
                  {alreadyExists ? (
                    <button
                      disabled
                      className="w-full py-2 bg-slate-950 border border-slate-850 text-emerald-500 font-mono text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 opacity-80 cursor-not-allowed"
                    >
                      <Check className="w-4 h-4 shrink-0" /> Checked In Stock
                    </button>
                  ) : isImporting ? (
                    /* The rapid configuration form popup */
                    <div className="bg-slate-950/80 p-3.5 rounded-xl border border-indigo-900/30 text-xs space-y-3">
                      <div className="text-center font-mono text-[10px] text-indigo-400 uppercase font-semibold tracking-wider flex items-center gap-1 justify-center">
                        <ArrowDown className="w-3 h-3" /> Quick Import Settings
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {/* Stock */}
                        <div className="space-y-0.5 text-left">
                          <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Initial Stock</label>
                          <input
                            type="number"
                            min="1"
                            value={importStock}
                            onChange={(e) => setImportStock(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono text-center"
                          />
                        </div>

                        {/* Batch */}
                        <div className="space-y-0.5 text-left">
                          <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Batch No.</label>
                          <input
                            type="text"
                            value={importBatch}
                            onChange={(e) => setImportBatch(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono text-center"
                          />
                        </div>

                        {/* Expiry date */}
                        <div className="col-span-2 space-y-0.5 text-left">
                          <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Expiry Date</label>
                          <input
                            type="date"
                            value={importExpiry}
                            onChange={(e) => setImportExpiry(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Action Triggers */}
                      <div className="flex gap-1.5 text-[11px] pt-1.5">
                        <button
                          type="button"
                          onClick={() => setActiveImportId(null)}
                          className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmImport(item)}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded transition-colors cursor-pointer"
                        >
                          Save Record
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      id={`import_btn_${idx}`}
                      onClick={() => startImportWizard(idx, item)}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow shadow-indigo-950"
                    >
                      <Database className="w-3.5 h-3.5 shrink-0" /> Import Into Stock
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {results.length === 0 && !searching && !error && (
          <div className="py-20 bg-slate-900/40 border border-slate-800 border-dashed rounded-2xl text-center space-y-3">
            <Database className="w-10 h-10 mx-auto stroke-1.5 text-slate-700 animate-pulse" />
            <div className="space-y-1 max-w-sm mx-auto">
              <h4 className="text-sm font-semibold text-slate-400">Ready to Query Bangladesh Registry</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-mono">
                Input any medication brand name like <code className="text-indigo-400">Napa</code> or category query like <code className="text-indigo-400">Esomeprazole</code> above to initiate deep auto-matching.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
