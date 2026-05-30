import React, { useState, useEffect } from "react";
import { Plus, Check, ArrowLeft, Database, AlertCircle } from "lucide-react";

export default function MedicineForm({ medicine, categories, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    generic_name: "",
    brand: "",
    manufacturer: "",
    category: "",
    dosage_form: "Tablet",
    strength: "",
    price: "",
    stock_quantity: "",
    expiry_date: "",
    batch_number: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!medicine;

  // Sync state if form receives editing medicine parameters
  useEffect(() => {
    if (medicine) {
      setFormData({
        name: medicine.name || "",
        generic_name: medicine.generic_name || "",
        brand: medicine.brand || "",
        manufacturer: medicine.manufacturer || "",
        category: medicine.category || "",
        dosage_form: medicine.dosage_form || "Tablet",
        strength: medicine.strength || "",
        price: medicine.price !== undefined ? String(medicine.price) : "",
        stock_quantity: medicine.stock_quantity !== undefined ? String(medicine.stock_quantity) : "",
        expiry_date: medicine.expiry_date || "",
        batch_number: medicine.batch_number || "",
        description: medicine.description || "",
      });
    }
  }, [medicine]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price || !formData.expiry_date) {
      setError("Medicine Name, Price, and Expiration Date are mandatory fields");
      return;
    }

    setLoading(true);
    setError("");

    // Prepare clean numeric representations
    const cleanPayload = {
      ...formData,
      price: parseFloat(formData.price) || 0,
      stock_quantity: parseInt(formData.stock_quantity) || 0,
    };

    try {
      await onSave(cleanPayload);
    } catch (err) {
      console.error(err);
      setError("Failed to persist drug information to database");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto text-left">
      
      {/* Header Panel */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="p-2 border border-slate-800 bg-slate-900 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            {isEdit ? `Edit Drug Entry: ${medicine.name}` : "Add Manual Drug to Stocks"}
          </h1>
          <p className="text-slate-400 text-xs">
            Enter standard pharmaceuticals registry details manually. No duplicate checks enforced.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Entry fields */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
        
        {/* Core details */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800 pb-1.5">
            Core Pharmaceutical Meta
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Brand/Retail Name */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Medicine Name / Brand <span className="text-rose-500">*</span></label>
              <input
                id="med_form_name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Napa Extend, Sergel 20"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Generic Formula */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Generic Drug Name / Formulation</label>
              <input
                id="med_form_generic"
                type="text"
                name="generic_name"
                value={formData.generic_name}
                onChange={handleChange}
                placeholder="e.g. Paracetamol, Esomeprazole"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Brand Core */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Brand Name</label>
              <input
                id="med_form_brand"
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="e.g. Napa, Sergel, Maxpro"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Manufacturer */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Manufacturer / Pharma Company</label>
              <input
                id="med_form_manufacturer"
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
                placeholder="e.g. Square Pharmaceuticals Ltd."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

          </div>
        </div>

        {/* Specifications & Categorization */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800 pb-1.5">
            Specifications & Categorization
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Category */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Inventory Category</label>
              <select
                id="med_form_category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">-- Select Category --</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Dosage form */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Dosage Form</label>
              <select
                id="med_form_dosage"
                name="dosage_form"
                value={formData.dosage_form}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup</option>
                <option value="Suspension">Suspension</option>
                <option value="Injection">Injection/Infusion</option>
                <option value="Drop">Drop (Eye/Ear)</option>
                <option value="Ointment">Cream & Cream</option>
                <option value="Inhaler">Inhaler</option>
              </select>
            </div>

            {/* Strength */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Strength</label>
              <input
                id="med_form_strength"
                type="text"
                name="strength"
                value={formData.strength}
                onChange={handleChange}
                placeholder="e.g. 500 mg, 20 mg, 100 ml"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

          </div>
        </div>

        {/* Quantities & Expirations */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800 pb-1.5">
            Pricing, Stock & Compliance
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            
            {/* Unit Retail Price */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Unit Price (৳ BDT) <span className="text-rose-500">*</span></label>
              <input
                id="med_form_price"
                type="number"
                step="0.01"
                min="0.1"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="1.50"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Total Stock Quantity */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Stock Quantity</label>
              <input
                id="med_form_stock"
                type="number"
                min="0"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleChange}
                placeholder="500"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Expiry date */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Expiration Date <span className="text-rose-500">*</span></label>
              <input
                id="med_form_expiry"
                type="date"
                name="expiry_date"
                value={formData.expiry_date}
                onChange={handleChange}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono cursor-pointer"
              />
            </div>

            {/* Batch number */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Batch Number / Lot</label>
              <input
                id="med_form_batch"
                type="text"
                name="batch_number"
                value={formData.batch_number}
                onChange={handleChange}
                placeholder="e.g. NP-992A"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-400 font-mono">Indications & Remarks (Description)</label>
          <textarea
            id="med_form_description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            placeholder="Specify indications, instructions, side effects warnings..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Action Controls */}
        <div className="flex justify-end gap-2 pt-2 text-xs border-t border-slate-800/60">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-750 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-500 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Check className="w-4 h-4" />
            )}
            {isEdit ? "Update Inventory Record" : "Save to Shop Inventory"}
          </button>
        </div>

      </form>

    </div>
  );
}
