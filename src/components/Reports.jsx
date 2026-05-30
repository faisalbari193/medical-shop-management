import React, { useState, useMemo } from "react";
import { 
  FileText, ArrowDownToLine, ReceiptText, CalendarCheck,
  CheckCircle2, DollarSign, TrendingUp, Sparkles, Filter, 
  BarChart, History, CheckCheck, Loader
} from "lucide-react";

export default function Reports({ sales, medicines, customers }) {
  const [reportType, setReportType] = useState("daily"); // daily, monthly, stock, hierarchy

  // Dates tracking (Standard simulated environment timeline: 2026-05-30)
  const targetDemoDay = "2026-05-30";
  const targetDemoMonth = "2026-05";

  // Filtered/Summarized state metrics
  const reportSummary = useMemo(() => {
    let listSales = [];
    let label = "";

    if (reportType === "daily") {
      listSales = sales.filter(s => s.timestamp && s.timestamp.startsWith(targetDemoDay));
      label = `Daily Performance Ledger (${targetDemoDay})`;
    } else if (reportType === "monthly") {
      listSales = sales.filter(s => s.timestamp && s.timestamp.startsWith(targetDemoMonth));
      label = `Monthly Financial Summary (${targetDemoMonth})`;
    } else {
      listSales = [...sales];
      label = "All Recorded Master Ledger Journals";
    }

    const transactionCount = listSales.length;
    const subtotalAgg = listSales.reduce((sum, s) => sum + s.subtotal, 0);
    const discountAgg = listSales.reduce((sum, s) => sum + s.discount, 0);
    const revenueAgg = listSales.reduce((sum, s) => sum + s.total, 0);

    // Calculate itemized volume
    const itemVolume = {};
    listSales.forEach(s => {
      if (s.items) {
        s.items.forEach(item => {
          itemVolume[item.name] = (itemVolume[item.name] || 0) + item.quantity;
        });
      }
    });

    const topSellingItems = Object.entries(itemVolume)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a,b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      listSales,
      label,
      transactionCount,
      subtotalAgg,
      discountAgg,
      revenueAgg,
      topSellingItems
    };
  }, [sales, reportType]);

  // Handle CSV Export
  const triggerCSVDownload = () => {
    let headers = [];
    let rows = [];
    let fileName = "";

    if (reportType === "stock") {
      headers = ["Medicine ID", "Brand Name", "Generic formulation", "Pharma Company", "Category", "Form", "Strength", "Price (BDT)", "Stock level", "Expiration date", "Batch Lot"];
      rows = medicines.map(m => [
        m.id,
        `"${m.name}"`,
        `"${m.generic_name || ""}"`,
        `"${m.manufacturer || ""}"`,
        `"${m.category || ""}"`,
        m.dosage_form,
        m.strength || "",
        m.price,
        m.stock_quantity,
        m.expiry_date || "",
        m.batch_number || ""
      ]);
      fileName = "InventoryStockReport_Bangladesh.csv";
    } else {
      headers = ["Invoice ID", "Customer Name", "Customer Mobile", "Subtotal", "Deductions", "Net Total Paid", "Payment Mechanism", "Timestamp"];
      rows = reportSummary.listSales.map(s => [
        s.id,
        `"${s.customer_name}"`,
        `"${s.customer_phone || ""}"`,
        s.subtotal,
        s.discount,
        s.total,
        s.payment_method,
        s.timestamp
      ]);
      fileName = `${reportType}_SalesLedgerExport.csv`;
    }

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="reports_view" className="space-y-6 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Business Reports</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Analyze sales metrics, export CSV data spreadsheets, and inspect warehouse performance
          </p>
        </div>

        {/* Dynamic CSV triggers */}
        <button
          id="export_csv_btn"
          onClick={triggerCSVDownload}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 rounded-xl text-xs font-semibold tracking-wide transition-all uppercase cursor-pointer"
        >
          <ArrowDownToLine className="w-4 h-4 text-emerald-400" /> Export CSV Sheet
        </button>
      </div>

      {/* Reports Toggle Tabs */}
      <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl flex flex-wrap gap-2 select-none">
        
        {/* Daily Sales Card */}
        <button
          onClick={() => setReportType("daily")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold font-sans flex items-center gap-2 transition-all cursor-pointer ${
            reportType === "daily" ? "bg-emerald-600 text-white shadow shadow-emerald-900" : "bg-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <CalendarCheck className="w-4 h-4 shrink-0" />
          Daily Sales Summary
        </button>

        {/* Monthly Revenue Section */}
        <button
          onClick={() => setReportType("monthly")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold font-sans flex items-center gap-2 transition-all cursor-pointer ${
            reportType === "monthly" ? "bg-emerald-600 text-white shadow shadow-emerald-900" : "bg-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <TrendingUp className="w-4 h-4 shrink-0" />
          Monthly Business Audit
        </button>

        {/* Stock Ledger metrics */}
        <button
          onClick={() => setReportType("stock")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold font-sans flex items-center gap-2 transition-all cursor-pointer ${
            reportType === "stock" ? "bg-emerald-600 text-white shadow shadow-emerald-900" : "bg-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          Warehouse Inventory Status
        </button>

      </div>

      {reportType !== "stock" ? (
        /* Sales Reports Layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Sales metrics sidebar cards (Bento Style) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block">Net Revenue Amount</span>
              <span className="text-3xl font-black text-emerald-400 mt-1 block">৳{reportSummary.revenueAgg.toLocaleString()}</span>
              <span className="text-xs text-slate-500 font-mono mt-1.5 block">Subtotal: ৳{reportSummary.subtotalAgg.toLocaleString()}</span>
              <span className="text-xs text-rose-450 font-mono block">Aggregate Discounts: -৳{reportSummary.discountAgg.toLocaleString()}</span>
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full filter blur-xl translate-x-12 -translate-y-12"></div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block">Invoices Cleared</span>
              <span className="text-3xl font-black text-slate-100 mt-1 block">{reportSummary.transactionCount} billing slips</span>
              <span className="text-xs text-slate-500 font-mono mt-1.5 block">Standard checkout time: ~1.2 mins</span>
            </div>

            {/* Hot-Selling item lists */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
              <h3 className="text-xs font-semibold text-slate-450 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" /> Top 5 Selling Medicines
              </h3>
              
              <div className="divide-y divide-slate-850 text-xs">
                {reportSummary.topSellingItems.length > 0 ? (
                  reportSummary.topSellingItems.map((item, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{item.name}</span>
                      <span className="font-mono text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                        {item.qty} units sold
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="py-6 text-center text-slate-600 font-mono text-[11px]">No transactions documented in period.</p>
                )}
              </div>
            </div>
          </div>

          {/* Master receipts datagrid ledger */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-slate-950/10">
              
              <div className="p-4 border-b border-slate-800 bg-slate-950/20 font-sans font-bold text-sm text-slate-200">
                {reportSummary.label}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border-slate-800">
                  <thead>
                    <tr className="bg-slate-950/50 text-slate-400 font-mono text-[10px] uppercase tracking-wider border-b border-slate-800">
                      <th className="py-3 px-4">Invoice ID</th>
                      <th className="py-3 px-4">Customer Base</th>
                      <th className="py-3 px-4 text-right">Subtotal</th>
                      <th className="py-3 px-4 text-right">Discount</th>
                      <th className="py-3 px-4 text-right">Net Bill</th>
                      <th className="py-3 px-4">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-xs text-slate-350 font-mono">
                    {reportSummary.listSales.length > 0 ? (
                      reportSummary.listSales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-slate-950/15">
                          <td className="py-3 px-4 font-bold text-slate-100">{sale.id}</td>
                          <td className="py-3 px-4 font-sans text-left">
                            <div className="space-y-0.5">
                              <span className="font-medium text-slate-200 block">{sale.customer_name}</span>
                              <span className="text-[10px] text-slate-500 block font-mono">{sale.customer_phone || "Walk-in"}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">৳{parseFloat(sale.subtotal).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right text-rose-400">-৳{parseFloat(sale.discount).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-400">৳{parseFloat(sale.total).toFixed(2)}</td>
                          <td className="py-3 px-4 font-sans font-medium text-slate-300">{sale.payment_method}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-16 text-center text-slate-655 font-mono text-[11px] uppercase">
                          No accounting ledger records in selected dates range.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>

        </div>
      ) : (
        /* Whse Inventory Stock Status Reports Layout */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-slate-950/10">
          
          <div className="p-4 border-b border-slate-800 bg-slate-950/20 font-sans font-bold text-sm text-emerald-400 flex items-center justify-between">
            <span>Critical Warehouse Stock Valuation Metric Matrix</span>
            <span className="font-sans font-medium text-xs text-slate-400">Total Valuation BDT Agg.: ৳{medicines.reduce((sum, item) => sum + (parseFloat(item.price) * item.stock_quantity), 0).toLocaleString()}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border-slate-800">
              <thead>
                <tr className="bg-slate-950/50 text-slate-400 font-mono text-[10px] uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3 px-4">Warehouse Code ID</th>
                  <th className="py-3 px-4 text-left">Drug Generic & company</th>
                  <th className="py-3 px-4 text-right">Unit BDT Price</th>
                  <th className="py-3 px-4 text-right">Units In Warehouse</th>
                  <th className="py-3 px-4 text-right">Stock Valuation (৳)</th>
                  <th className="py-3 px-4">Life cycle Expiration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-xs text-slate-350 font-mono">
                {medicines.map((med) => {
                  const val = parseFloat(med.price) * med.stock_quantity;
                  return (
                    <tr key={med.id} className="hover:bg-slate-950/15">
                      <td className="py-2.5 px-4 font-bold text-slate-100">{med.id}</td>
                      <td className="py-2.5 px-4 font-sans text-left">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-200 block">{med.name}</span>
                          <span className="text-[10px] text-slate-500 block font-mono">{med.generic_name} • {med.manufacturer}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right">৳{parseFloat(med.price).toFixed(2)}</td>
                      <td className={`py-2.5 px-4 text-right font-bold ${med.stock_quantity === 0 ? "text-rose-500" : med.stock_quantity < 15 ? "text-amber-500" : "text-slate-100"}`}>{med.stock_quantity} unidades</td>
                      <td className="py-2.5 px-4 text-right text-emerald-400 font-bold">৳{val.toFixed(2)}</td>
                      <td className="py-2.5 px-4 font-sans text-slate-400">{med.expiry_date || "Lifetime Registry"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
}
