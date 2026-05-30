import React, { useState, useMemo } from "react";
import { Search, Loader, Filter, History, Eye, ArrowDown, ArrowUp, CalendarRange } from "lucide-react";

export default function StockLogs({ logs }) {
  const [search, setSearch] = useState("");
  const [logFilter, setLogFilter] = useState("all"); // all, stock_in, stock_out

  // Search filter
  const filteredLogs = useMemo(() => {
    let result = [...logs].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

    // 1. Filter by term
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      result = result.filter(
        (log) =>
          (log.medicine_name && log.medicine_name.toLowerCase().includes(q)) ||
          (log.remarks && log.remarks.toLowerCase().includes(q)) ||
          (log.medicine_id && log.medicine_id.includes(q))
      );
    }

    // 2. Filter by transactional type
    if (logFilter !== "all") {
      if (logFilter === "stock_in") {
        result = result.filter(log => log.type === "Stock In");
      } else if (logFilter === "stock_out") {
        result = result.filter(log => log.type === "Stock Out");
      }
    }

    return result;
  }, [logs, search, logFilter]);

  return (
    <div id="stock_logs_view" className="space-y-6 text-left">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Stock Audit Logs</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Review dynamic warehouse logs documenting manual adjustments and POS sale deductions
        </p>
      </div>

      {/* Controller actions */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        
        {/* Lookup query */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 inset-y-0 my-auto text-slate-500 w-4.5 h-4.5" />
          <input
            id="logs_search_bar"
            type="text"
            placeholder="Search logs by drug brand name, invoice ID or log identifiers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl text-xs placeholder-slate-650 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Transaction filter */}
        <div>
          <select
            id="logs_filter"
            value={logFilter}
            onChange={(e) => setLogFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-xs focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
          >
            <option value="all">📊 All Transaction Types</option>
            <option value="stock_in">➕ Stock In Records (Procurement)</option>
            <option value="stock_out">➖ Stock Out Records (POS Sales)</option>
          </select>
        </div>

      </div>

      {/* Main Table Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg shadow-slate-950/20 animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-slate-800">
            <thead>
              <tr className="bg-slate-950/50 text-slate-400 font-mono text-[10px] uppercase tracking-wider border-b border-slate-800">
                <th className="py-3.5 px-5">LOG ID NO</th>
                <th className="py-3.5 px-5">Medicine ID / Name</th>
                <th className="py-3.5 px-5">Transaction Type</th>
                <th className="py-3.5 px-5 text-right">Adjustment Size</th>
                <th className="py-3.5 px-5 text-right">Level Delta (Prev &rarr; New)</th>
                <th className="py-3.5 px-5">Operational Remarks</th>
                <th className="py-3.5 px-5">Audit Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-[11.5px] text-slate-350 font-mono">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const isIn = log.type === "Stock In";
                  return (
                    <tr key={log.id} className="hover:bg-slate-950/15 transition-colors">
                      <td className="py-2.5 px-5 font-bold text-slate-450">{log.id}</td>
                      <td className="py-2.5 px-5 font-sans">
                        <div className="space-y-0.5 text-left">
                          <span className="font-semibold text-slate-200 block">{log.medicine_name}</span>
                          <span className="text-[10px] text-slate-500 block font-mono">{log.medicine_id}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-5 font-sans">
                        {isIn ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 flex items-center gap-1 w-fit">
                            <ArrowUp className="w-3.5 h-3.5" /> Stock In
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/10 flex items-center gap-1 w-fit">
                            <ArrowDown className="w-3.5 h-3.5" /> Stock Out
                          </span>
                        )}
                      </td>
                      <td className={`py-2.5 px-5 text-right font-bold ${isIn ? "text-emerald-400" : "text-rose-450"}`}>
                        {isIn ? `+${log.quantity}` : `-${log.quantity}`}
                      </td>
                      <td className="py-2.5 px-5 text-right text-slate-400 text-[11px]">
                        {log.previous_stock} &rarr; <span className="font-bold text-slate-200">{log.new_stock}</span>
                      </td>
                      <td className="py-2.5 px-5 font-sans italic text-slate-400 text-[11px] truncate max-w-[200px]" title={log.remarks}>
                        {log.remarks}
                      </td>
                      <td className="py-2.5 px-5 text-slate-450 text-[10px]" title={log.timestamp}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-500 font-mono text-xs uppercase">
                    <History className="w-8 h-8 mx-auto text-slate-750 stroke-1 animate-pulse" />
                    <span>No historical ledger logs returned from query</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
