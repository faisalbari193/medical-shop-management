import React, { useMemo } from "react";
import { 
  Package, DollarSign, BrainCircuit, AlertTriangle, 
  Calendar, ShoppingBag, ArrowUpRight, TrendingUp,
  FileMinus2, CheckCircle2, ShoppingCart
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar,
  Legend, Cell
} from "recharts";

export default function Dashboard({ medicines, sales, customers, onViewChange, onRefetch }) {
  
  // Calculate summary statistics
  const stats = useMemo(() => {
    // 1. Total Medicines
    const totalMeds = medicines.length;

    // 2. Low Stock Count
    const lowStockMeds = medicines.filter(m => m.stock_quantity > 0 && m.stock_quantity < 15);
    const lowStockCount = lowStockMeds.length;

    // 3. Out of stock & Expired info
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const outOfStockMeds = medicines.filter(m => m.stock_quantity === 0);
    const outOfStockCount = outOfStockMeds.length;

    const expiredMeds = medicines.filter(m => {
      if (!m.expiry_date) return false;
      const expDate = new Date(m.expiry_date);
      return expDate < today;
    });

    const nearExpiryMeds = medicines.filter(m => {
      if (!m.expiry_date) return false;
      const expDate = new Date(m.expiry_date);
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 60; // next 2 months
    });

    // 4. Sales metrics
    // Calculate total sales for today (2026-05-30 or current local system date, let's look for matching dates in sales)
    const todayStr = "2026-05-30"; // standard demo system date to fit simulated timeline of May 30, 2026
    
    const salesToday = sales.filter(s => {
      if (!s.timestamp) return false;
      return s.timestamp.startsWith(todayStr);
    });

    const salesTodayCount = salesToday.length;
    const revenueToday = salesToday.reduce((sum, s) => sum + s.total, 0);

    // Total aggregate revenue
    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);

    return {
      totalMeds,
      lowStockCount,
      outOfStockCount,
      expiredCount: expiredMeds.length,
      nearExpiryCount: nearExpiryMeds.length,
      salesTodayCount,
      revenueToday,
      totalRevenue,
      lowStockMeds,
      nearExpiryMeds,
      expiredMeds,
      outOfStockMeds
    };
  }, [medicines, sales]);

  // Aggregate daily sales chart data for the past 7 days (including demo dates leading up to 2026-05-30)
  const chartData = useMemo(() => {
    const days = ["2026-05-24", "2026-05-25", "2026-05-26", "2026-05-27", "2026-05-28", "2026-05-29", "2026-05-30"];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat (Today)"];

    return days.map((dateStr, index) => {
      const matchSales = sales.filter(s => s.timestamp && s.timestamp.startsWith(dateStr));
      const revenue = matchSales.reduce((sum, s) => sum + s.total, 0);
      const transactions = matchSales.length;

      return {
        day: dayNames[index],
        revenue,
        transactions,
        date: dateStr
      };
    });
  }, [sales]);

  // Category composition data
  const categoryChartData = useMemo(() => {
    const counts = {};
    medicines.forEach(m => {
      const cat = m.category || "Others";
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const colors = [
      "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
      "#ec4899", "#14b8a6", "#64748b", "#a855f7", "#06b6d4"
    ];

    return Object.entries(counts).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length]
    })).sort((a,b) => b.value - a.value).slice(0, 5);
  }, [medicines]);

  return (
    <div id="dashboard_view" className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans sm:text-3xl">
            Pharmacy Control Dashboard
          </h1>
          <p className="text-slate-400 text-sm font-mono mt-1">
            Standard DGDA API Synchronization Live | Dhaka, Bangladesh
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            id="pos_nav_btn"
            onClick={() => onViewChange("pos")}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-100 rounded-xl text-sm font-medium transition-colors cursor-pointer shadow-lg shadow-emerald-950"
          >
            <ShoppingCart className="w-4 h-4" />
            Open Billing POS
          </button>
        </div>
      </div>

      {/* Stats Cards Grid - Bento Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Medicines Card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between gap-4 relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Total Medicines</span>
            <span className="text-3xl font-extrabold text-white block font-sans">
              {stats.totalMeds}
            </span>
            <button 
              onClick={() => onViewChange("medicines")}
              className="text-xs text-emerald-400 font-medium flex items-center gap-1 hover:underline mt-1 cursor-pointer"
            >
              Manage Inventory <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full filter blur-xl translate-x-12 -translate-y-12"></div>
        </div>

        {/* Sales Recorded Today */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between gap-4 relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Today's Transactions</span>
            <span className="text-3xl font-extrabold text-white block font-sans">
              {stats.salesTodayCount}
            </span>
            <span className="text-xs text-emerald-400 mt-1 font-mono block">
              +100% since yesterday
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full filter blur-xl translate-x-12 -translate-y-12"></div>
        </div>

        {/* Revenue Overview */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between gap-4 relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Revenue Today</span>
            <span className="text-3xl font-extrabold text-emerald-400 block font-sans">
              ৳{stats.revenueToday.toLocaleString()}
            </span>
            <button 
              onClick={() => onViewChange("reports")}
              className="text-xs text-slate-400 font-medium flex items-center gap-1 hover:underline mt-1 cursor-pointer"
            >
              Total ৳{stats.totalRevenue.toLocaleString()} <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-xl translate-x-12 -translate-y-12"></div>
        </div>

        {/* Low Stock & Expiry Alerts */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between gap-4 relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Stock Alerts</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-extrabold text-amber-500 block font-sans">
                {stats.lowStockCount}
              </span>
              <span className="text-xs text-slate-400 font-medium">Low</span>
              <span className="text-xl font-bold text-rose-500 ml-1 block font-sans">
                {stats.expiredCount + stats.outOfStockCount}
              </span>
              <span className="text-xs text-slate-400 font-medium">Exp/Empty</span>
            </div>
            <button 
              onClick={() => onViewChange("logs")}
              className="text-xs text-amber-400 font-medium flex items-center gap-1 hover:underline mt-1 cursor-pointer"
            >
              Audit Inventory Logs <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 animate-bounce" />
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full filter blur-xl translate-x-12 -translate-y-12"></div>
        </div>

      </div>

      {/* Main Charts & Analytics Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Revenue Plot */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white font-sans flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" /> Weekly Sales Performance
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Aggregate daily pharmacy receipts in Bangladesh Taka (৳)
              </p>
            </div>
            <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400">
              Live POS Sync
            </span>
          </div>

          <div className="w-full">
            <ResponsiveContainer width="100%" height={252}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `৳${v}`} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "12px", fontSize: "12px", color: "#fff" }}
                  labelStyle={{ fontWeight: "bold", color: "#10b981" }}
                  formatter={(val) => [`৳${val.toLocaleString()}`, "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* High Volume Drug Categories */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white font-sans flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-emerald-400" /> Key Stock Categories
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Breakdown of registered medicines count
            </p>
          </div>

          {categoryChartData.length > 0 ? (
            <div className="space-y-4">
              <div className="w-full">
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={categoryChartData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} width={80} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "10px", fontSize: "11px" }}
                      formatter={(val) => [val, "Count"]}
                    />
                    <Bar dataKey="value" radius={4} barSize={12}>
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Legend Summary */}
              <div className="space-y-1.5 pt-1">
                {categoryChartData.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="truncate max-w-[140px] font-medium">{cat.name}</span>
                    </div>
                    <span className="font-mono text-slate-400 font-semibold">{cat.value} items</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-xs">
              No categories populated yet.
            </div>
          )}
        </div>

      </div>

      {/* Critical Stock Alerts list & Realtime Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Low Stock Actions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-800 bg-slate-950/20 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white font-sans flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-500" /> Critical Low Stock (Under 15 Units)
            </h3>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-400">
              {stats.lowStockMeds.length} Items Warning
            </span>
          </div>

          <div className="p-3 divide-y divide-slate-800/60 overflow-y-auto max-h-[280px] flex-1">
            {stats.lowStockMeds.length > 0 ? (
              stats.lowStockMeds.map((med) => (
                <div key={med.id} className="py-2.5 px-2 flex items-center justify-between text-xs transition-colors hover:bg-slate-800/20">
                  <div className="space-y-0.5 text-left">
                    <span className="font-semibold text-slate-200 block">{med.name}</span>
                    <span className="text-slate-500 text-[10px] block font-mono">
                      {med.generic_name} • {med.manufacturer}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-semibold">
                      {med.stock_quantity} left
                    </span>
                    <button
                      onClick={() => onViewChange("medicines")}
                      className="px-3 py-1 border border-slate-700 hover:border-emerald-600 bg-slate-950 text-slate-300 font-mono text-[10px] rounded hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      Restock
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs text-slate-400 font-mono">All stocks are currently above caution thresholds.</p>
              </div>
            )}
          </div>
        </div>

        {/* Expiry Tracking Warning */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-800 bg-slate-950/20 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white font-sans flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-rose-500" /> Expired or Near-Expiry Alerts (Next 60 Days)
            </h3>
            <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-xs font-mono text-rose-400">
              {stats.nearExpiryCount + stats.expiredCount} Alerts
            </span>
          </div>

          <div className="p-3 divide-y divide-slate-800/60 overflow-y-auto max-h-[280px] flex-1">
            {stats.nearExpiryMeds.length > 0 || stats.expiredMeds.length > 0 ? (
              <>
                {/* Expired Section */}
                {stats.expiredMeds.map((med) => (
                  <div key={`exp-${med.id}`} className="py-2.5 px-2 flex items-center justify-between text-xs hover:bg-slate-800/20">
                    <div className="space-y-0.5 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-200">{med.name}</span>
                        <span className="px-1.5 py-0.2 bg-rose-500/10 text-rose-500 font-mono font-semibold rounded text-[8px] uppercase">Expired</span>
                      </div>
                      <span className="text-slate-500 text-[10px] block font-mono">
                        Generic: {med.generic_name} • Batch: {med.batch_number || "N/A"}
                      </span>
                    </div>
                    <span className="font-mono text-rose-500 font-semibold">
                      {med.expiry_date}
                    </span>
                  </div>
                ))}
                
                {/* Near Expiry Section */}
                {stats.nearExpiryMeds.map((med) => (
                  <div key={`near-${med.id}`} className="py-2.5 px-2 flex items-center justify-between text-xs hover:bg-slate-800/20">
                    <div className="space-y-0.5 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-200">{med.name}</span>
                        <span className="px-1.5 py-0.2 bg-amber-500/10 text-amber-500 font-mono font-semibold rounded text-[8px] uppercase">Near Expiry</span>
                      </div>
                      <span className="text-slate-500 text-[10px] block font-mono">
                        Generic: {med.generic_name} • Batch: {med.batch_number || "N/A"}
                      </span>
                    </div>
                    <span className="font-mono text-amber-400 font-semibold">
                      {med.expiry_date}
                    </span>
                  </div>
                ))}
              </>
            ) : (
              <div className="py-12 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs text-slate-400 font-mono">All registered inventory resides safely in valid life dates.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
