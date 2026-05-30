import React, { useState, useMemo } from "react";
import { 
  Plus, Edit2, Trash2, Search, Filter, RefreshCw, 
  AlertTriangle, Check, Calendar, ChevronLeft, ChevronRight,
  Database, Tag, Layers, ArrowUpDown
} from "lucide-react";

export default function Medicines({ 
  medicines, 
  categories, 
  onAddMedicine, 
  onEditMedicine, 
  onDeleteMedicine, 
  onAddCategory,
  onOpenAPISearch, // Trigger to open the Bangladesh Medicine API lookup importer!
  token 
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStockStatus, setSelectedStockStatus] = useState("all");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // New Category creation state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryError, setCategoryError] = useState("");

  // Search, filter & sorting pipeline
  const filteredMeds = useMemo(() => {
    let result = [...medicines];

    // 1. Filter by search query (brand, name, generic name, dosage form)
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      result = result.filter(
        m =>
          (m.name && m.name.toLowerCase().includes(q)) ||
          (m.generic_name && m.generic_name.toLowerCase().includes(q)) ||
          (m.brand && m.brand.toLowerCase().includes(q)) ||
          (m.manufacturer && m.manufacturer.toLowerCase().includes(q))
      );
    }

    // 2. Filter by Category
    if (selectedCategory !== "all") {
      result = result.filter(m => m.category === selectedCategory);
    }

    // 3. Filter by stock status
    if (selectedStockStatus !== "all") {
      if (selectedStockStatus === "low") {
        result = result.filter(m => m.stock_quantity > 0 && m.stock_quantity < 15);
      } else if (selectedStockStatus === "out") {
        result = result.filter(m => m.stock_quantity === 0);
      } else if (selectedStockStatus === "sufficient") {
        result = result.filter(m => m.stock_quantity >= 15);
      } else if (selectedStockStatus === "expired") {
        const today = new Date();
        today.setHours(0,0,0,0);
        result = result.filter(m => m.expiry_date && new Date(m.expiry_date) < today);
      }
    }

    // 4. Sort results
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle nulls and numeric string comparisons
      if (valA === undefined || valA === null) valA = "";
      if (valB === undefined || valB === null) valB = "";

      if (typeof valA === "string" && typeof valB === "string") {
        return sortDirection === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
    });

    return result;
  }, [medicines, search, selectedCategory, selectedStockStatus, sortField, sortDirection]);

  // Paginated items
  const paginatedMeds = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMeds.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMeds, currentPage]);

  const totalPages = Math.ceil(filteredMeds.length / itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const submitCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setCategoryError("Please specify category label");
      return;
    }
    setCategoryError("");
    
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCategoryName.trim() })
      });
      if (response.ok) {
        const addedCat = await response.json();
        onAddCategory(addedCat);
        setNewCategoryName("");
        setCategoryModalOpen(false);
      } else {
        const err = await response.json();
        setCategoryError(err.error || "Failed to register category");
      }
    } catch (err) {
      console.error(err);
      setCategoryError("Connection disruption registering category");
    }
  };

  const getExpiryLabel = (dateStr) => {
    if (!dateStr) return <span className="text-slate-500 font-mono">N/A</span>;
    const today = new Date();
    today.setHours(0,0,0,0);
    const exp = new Date(dateStr);
    
    if (exp < today) {
      return <span className="text-rose-500 font-mono font-semibold">Expired ({dateStr})</span>;
    }
    
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 60) {
      return <span className="text-amber-500 font-mono font-semibold">Soon ({dateStr})</span>;
    }

    return <span className="text-slate-400 font-mono">{dateStr}</span>;
  };

  return (
    <div id="medicines_view" className="space-y-6 text-left">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Medicine Inventory
          </h1>
          <p className="text-slate-400 text-sm">
            Configure catalogs, adjust stocks, and import drug records
          </p>
        </div>
        
        {/* Action Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* API Sync */}
          <button
            id="api_search_hub_btn"
            onClick={onOpenAPISearch}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold tracking-wide shadow-lg shadow-emerald-950 transition-all cursor-pointer"
          >
            <Database className="w-4 h-4 shrink-0" />
            DGDA Medicine Importer
          </button>

          {/* Create Category */}
          <button
            id="new_category_btn"
            onClick={() => setCategoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors cursor-pointer"
          >
            <Tag className="w-4 h-4 shrink-0" />
            Add Category
          </button>

          {/* Add Medicine Manually */}
          <button
            id="manual_add_med_btn"
            onClick={() => onAddMedicine()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            Add Manual Drug
          </button>
        </div>
      </div>

      {/* Categories modal popup */}
      {categoryModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="text-emerald-400 w-5 h-5" /> Add Custom Category
            </h3>
            
            {categoryError && (
              <p className="text-rose-400 text-xs font-mono bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/10">
                {categoryError}
              </p>
            )}

            <form onSubmit={submitCategory} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 uppercase font-mono tracking-wider">Category Label</label>
                <input
                  id="category_name_input"
                  type="text"
                  placeholder="e.g. Gastric & Acidity"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-3 py-2 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-750 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-500 transition-colors cursor-pointer"
                >
                  Register Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search & Interactive Filter Board */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Text Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 inset-y-0 my-auto text-slate-500 w-4 h-4" />
          <input
            id="med_search_bar"
            type="text"
            placeholder="Search by brand name, generic formulation, manufacturer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl text-xs placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Category selector */}
        <div>
          <select
            id="category_select_filter"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-xs focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
          >
            <option value="all">📁 All Categories</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Alert filter */}
        <div>
          <select
            id="stock_status_filter"
            value={selectedStockStatus}
            onChange={(e) => {
              setSelectedStockStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-xs focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
          >
            <option value="all">📦 All Stock States</option>
            <option value="sufficient">Sufficient (Stock &ge; 15)</option>
            <option value="low">⚠️ Low Stock (Under 15)</option>
            <option value="out">🛑 Out of Stock (0 units)</option>
            <option value="expired">⏳ Expired Products</option>
          </select>
        </div>
      </div>

      {/* Main Stock Inventory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg shadow-slate-950/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 text-slate-400 font-mono text-[10px] uppercase tracking-wider border-b border-slate-800">
                <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort("name")}>
                  Medicine Brand {sortField === "name" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort("generic_name")}>
                  Generic Name {sortField === "generic_name" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th className="py-3 px-4">Manufacturer</th>
                <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort("category")}>
                  Category {sortField === "category" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort("price")}>
                  Price (BDT) {sortField === "price" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort("stock_quantity")}>
                  Stock {sortField === "stock_quantity" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th className="py-3 px-4">Expiration</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-350">
              {paginatedMeds.length > 0 ? (
                paginatedMeds.map((med) => {
                  const isLow = med.stock_quantity > 0 && med.stock_quantity < 15;
                  const isOut = med.stock_quantity === 0;

                  return (
                    <tr key={med.id} className="hover:bg-slate-950/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="space-y-0.5 text-left">
                          <span className="font-semibold text-slate-100 block">{med.name}</span>
                          <span className="text-[10px] text-slate-500 block font-mono">
                            {med.strength || ""} • {med.dosage_form || ""}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium truncate max-w-[200px]" title={med.generic_name}>
                        {med.generic_name || <span className="text-slate-600">-</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-400 truncate max-w-[150px]" title={med.manufacturer}>
                        {med.manufacturer || <span className="text-slate-600">-</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-350 text-[10px]">
                          {med.category || "Others"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400">
                        ৳{parseFloat(med.price).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isOut ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 font-mono font-semibold">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono font-semibold" title="Restock recommended soon">
                            Low ({med.stock_quantity})
                          </span>
                        ) : (
                          <span className="font-mono font-semibold text-slate-200">
                            {med.stock_quantity}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-[150px]">
                        {getExpiryLabel(med.expiry_date)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            title="Edit details"
                            onClick={() => onEditMedicine(med)}
                            className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500 hover:text-emerald-400 rounded-lg transition-colors cursor-pointer text-slate-400"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Delete drug"
                            onClick={() => {
                              if (confirm(`Remove ${med.name} from inventory?`)) {
                                onDeleteMedicine(med.id);
                              }
                            }}
                            className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-rose-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer text-slate-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="py-16 text-center space-y-2 text-slate-500 font-mono uppercase tracking-wider text-xs">
                    <Database className="w-8 h-8 mx-auto stroke-1.5 text-slate-750 animate-pulse" />
                    <span>No medicines found matching selected filters</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/20 flex items-center justify-between font-mono text-xs text-slate-400 select-none">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredMeds.length)} of {filteredMeds.length} items
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 font-semibold font-sans">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
