import React, { useState, useMemo } from "react";
import { Search, User, Phone, ShoppingBag, Clock, ArrowUpDown, ChevronRight, CheckSquare, Layers, Printer, QrCode } from "lucide-react";

export default function Customers({ customers, sales }) {
  const [search, setSearch] = useState("");
  const [activeHistoryCust, setActiveHistoryCust] = useState(null); // holds customer object for history overlay
  const [printTarget, setPrintTarget] = useState(null); // holds receipt or receipt log for printing

  // Search filter
  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
    );
  }, [customers, search]);

  // Lookup purchase invoices matching actively inspected customer phone or ID
  const customerSales = useMemo(() => {
    if (!activeHistoryCust) return [];
    return sales.filter(
      (s) =>
        s.customer_id === activeHistoryCust.id ||
        (s.customer_phone && s.customer_phone === activeHistoryCust.phone)
    ).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [sales, activeHistoryCust]);

  const downloadReceiptFile = (target) => {
    if (!target) return;
    
    let fileName = "receipt.html";
    let htmlContent = "";

    if (target.type === "single") {
      const sale = target.sale;
      fileName = `Receipt_${sale.id}.html`;
      
      htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt - ${sale.id}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #f5f5f5;
      color: #000000;
      padding: 20px;
      display: flex;
      justify-content: center;
    }
    .receipt-box {
      max-width: 380px;
      width: 100%;
      background: #ffffff;
      padding: 25px;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      font-size: 13px;
      line-height: 1.5;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-mono { font-family: Courier, monospace; }
    .font-bold { font-weight: bold; }
    .uppercase { text-transform: uppercase; }
    .border-dashed { border-top: 1px dashed #777; margin: 12px 0; }
    .flex-row { display: flex; justify-content: space-between; }
    .item-table { width: 100%; margin-top: 10px; border-collapse: collapse; }
    .item-table th, .item-table td { font-family: Courier, monospace; font-size: 12px; padding: 6px 0; text-align: left; }
    .item-table th { border-bottom: 1px dashed #777; color: #555; }
    .item-table td.col-qty { text-align: right; width: 15%; }
    .item-table td.col-rate { text-align: right; width: 25%; }
    .item-table td.col-total { text-align: right; width: 25%; font-weight: bold; }
    .item-name { width: 35%; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .total-container { border-top: 1px dashed #777; padding-top: 10px; font-family: Courier, monospace; font-size: 12px; }
    .grand-total { font-size: 14px; font-weight: bold; background: #eee; padding: 8px; border-radius: 4px; border-top: 1px solid #ddd; margin-top: 6px; }
    .header h2 { margin: 0 0 4px 0; font-size: 18px; }
    .header p { margin: 2px 0; color: #555; font-size: 11px; }
    .metadata { text-align: left; font-family: Courier, monospace; font-size: 11px; color: #333; margin: 15px 0; }
    .barcode-placeholder { margin-top: 15px; border-top: 1px dashed #c0c0c0; padding-top: 15px; text-align: center; font-size: 11px; color: #666; font-family: Courier, monospace; }
  </style>
</head>
<body>
  <div class="receipt-box">
    <div class="header text-center">
      <h2>BANGLADESH MEDICAL SHOP</h2>
      <p>Hospital Road, Mirpur-10, Dhaka</p>
      <p>DGDA Drug License: #2334810-DH</p>
    </div>
    
    <div class="border-dashed"></div>
    
    <div class="metadata">
      <div class="flex-row"><span>INVOICE ID:</span><span class="font-bold">${sale.id}</span></div>
      <div class="flex-row"><span>DATE/TIME:</span><span>${new Date(sale.timestamp).toLocaleString()}</span></div>
      <div class="flex-row"><span>CUSTOMER:</span><span>${activeHistoryCust?.name || "Walk-in Customer"}</span></div>
      ${activeHistoryCust?.phone ? `<div class="flex-row"><span>PHONE:</span><span>${activeHistoryCust.phone}</span></div>` : ''}
      <div class="flex-row"><span>PAYMENT METHOD:</span><span class="font-bold">${sale.payment_method}</span></div>
    </div>
    
    <table class="item-table">
      <thead>
        <tr>
          <th>ITEM BRAND</th>
          <th style="text-align: right;">QTY</th>
          <th style="text-align: right;">RATE</th>
          <th style="text-align: right;">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${(sale.items || []).map(item => {
          const rate = parseFloat(item.price || item.item_total / item.quantity || 0);
          return `
            <tr>
              <td class="item-name font-bold">${item.name}</td>
              <td class="col-qty">${item.quantity}</td>
              <td class="col-rate">৳${rate.toFixed(1)}</td>
              <td class="col-total">৳${parseFloat(item.item_total).toFixed(1)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
    
    <div class="total-container">
      <div class="flex-row" style="margin-top: 8px;"><span>SUBTOTAL BILL</span><span>৳${parseFloat(sale.subtotal || 0).toFixed(2)}</span></div>
      <div class="flex-row" style="color: #c0392b;"><span>DISCOUNT</span><span>-৳${parseFloat(sale.discount || 0).toFixed(2)}</span></div>
      <div class="flex-row grand-total"><span>TOTAL BILL (Vat In.)</span><span>৳${parseFloat(sale.total || 0).toFixed(2)}</span></div>
    </div>
    
    <div class="barcode-placeholder">
      <p style="font-weight: bold; color: #2c3e50;">🇧🇩 Prescriptions are required for Antibiotic drugs.</p>
      <p>Thank you for shopping. Stay healthy!</p>
    </div>
  </div>
</body>
</html>`;
    } else {
      const customer = target.customer;
      fileName = `Loyalty_Statement_${customer.name.replace(/\s+/g, '_')}.html`;
      htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Statement - ${customer.name}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #f5f5f5;
      color: #000000;
      padding: 20px;
      display: flex;
      justify-content: center;
    }
    .statement-box {
      max-width: 420px;
      width: 100%;
      background: #ffffff;
      padding: 25px;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      font-size: 13px;
      line-height: 1.5;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-mono { font-family: Courier, monospace; }
    .font-bold { font-weight: bold; }
    .uppercase { text-transform: uppercase; }
    .border-dashed { border-top: 1px dashed #777; margin: 12px 0; }
    .flex-row { display: flex; justify-content: space-between; }
    .metadata { text-align: left; font-family: Courier, monospace; font-size: 11px; color: #333; margin: 15px 0; }
    .invoice-card { padding: 10px 0; font-family: Courier, monospace; font-size: 12px; }
    .invoice-title { font-weight: bold; display: flex; justify-content: space-between; border-bottom: 1px dashed #eee; padding-bottom: 4px; margin-bottom: 4px; }
    .invoice-item { display: flex; justify-content: space-between; color: #555; padding-left: 10px; font-size: 11px; }
    .invoice-summary { display: flex; justify-content: space-between; font-weight: bold; font-size: 11px; padding-top: 4px; margin-top: 4px; border-top: 1px dashed #eee; }
    .header h2 { margin: 0 0 4px 0; font-size: 18px; }
    .header p { margin: 2px 0; color: #555; font-size: 11px; }
  </style>
</head>
<body>
  <div class="statement-box">
    <div class="header text-center">
      <h2>BANGLADESH MEDICAL SHOP</h2>
      <p>Hospital Road, Mirpur-10, Dhaka</p>
      <p style="font-weight: bold; color: #c0392b; text-transform: uppercase; margin-top: 5px;">LOYALTY STATEMENT LOG</p>
    </div>
    
    <div class="border-dashed"></div>
    
    <div class="metadata">
      <div class="flex-row"><span>CUSTOMER:</span><span class="font-bold">${customer.name}</span></div>
      <div class="flex-row"><span>CONTACT:</span><span>${customer.phone || "N/A"}</span></div>
      <div class="flex-row"><span>MEMBERSHIP ID:</span><span>${customer.id}</span></div>
      <div class="flex-row"><span>TOTAL INVOICES:</span><span>${target.sales.length}</span></div>
      <div class="flex-row"><span>TOTAL SPENT:</span><span class="font-bold" style="color: #27ae60;">৳${parseFloat(customer.total_spending || 0).toLocaleString()}</span></div>
      <div class="flex-row"><span>PRINTED ON:</span><span>${new Date().toLocaleString()}</span></div>
    </div>
    
    <div class="border-dashed"></div>
    <h3 style="font-family: Courier, monospace; font-size: 11px; text-align: center; margin: 0; color: #666;">PURCHASE TRANSACTION LIST</h3>
    
    <div style="margin-top: 10px;">
      ${target.sales.map((sale, idx) => `
        <div class="invoice-card" style="margin-bottom: 15px;">
          <div class="invoice-title">
            <span>REF: #${sale.id}</span>
            <span>${new Date(sale.timestamp).toLocaleDateString()}</span>
          </div>
          <div>
            ${(sale.items || []).map(item => `
              <div class="invoice-item">
                <span>• ${item.name} (x${item.quantity})</span>
                <span>৳${parseFloat(item.item_total).toFixed(1)}</span>
              </div>
            `).join('')}
          </div>
          <div class="invoice-summary">
            <span>METHOD: ${sale.payment_method}</span>
            <span>SUBTOTAL: ৳${parseFloat(sale.total || 0).toFixed(1)}</span>
          </div>
        </div>
      `).join('')}
    </div>
    
    <div class="border-dashed"></div>
    <div class="text-center" style="font-family: Courier, monospace; font-size: 11px; color: #777;">
      <p>This is an official system generated loyalty purchase ledger document.</p>
      <p>Thank you for shopping. Stay healthy!</p>
    </div>
  </div>
</body>
</html>`;
    }

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="customers_view" className="space-y-6 text-left">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Customer Database</h1>
        <p className="text-slate-400 text-xs">
          Browse shopper profiles, track phone databases, and analyze loyalty spending metrics
        </p>
      </div>

      {/* Customer Registry Search */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative">
          <Search className="absolute left-3 inset-y-0 my-auto text-slate-500 w-4.5 h-4.5" />
          <input
            id="customer_db_search"
            type="text"
            placeholder="Lookup customer by name or phone digits..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl text-xs placeholder-slate-650 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Main Customers List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg shadow-slate-950/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-slate-800">
            <thead>
              <tr className="bg-slate-950/50 text-slate-400 font-mono text-[10px] uppercase tracking-wider border-b border-slate-800">
                <th className="py-3.5 px-5">Customer Profile</th>
                <th className="py-3.5 px-5">Mobile Contact</th>
                <th className="py-3.5 px-5 text-right">Transactions</th>
                <th className="py-3.5 px-5 text-right">Total Spending</th>
                <th className="py-3.5 px-5">Last Purchase Date</th>
                <th className="py-3.5 px-5 text-center">Receipt Log</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-350">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-950/20 transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                          {cust.name ? cust.name[0] : "W"}
                        </div>
                        <div className="text-left">
                          <span className="font-semibold text-slate-100 block">{cust.name || "Walk-in Customer"}</span>
                          <span className="text-[10px] text-slate-500 font-mono block">Loyalty ID: {cust.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5 font-mono font-medium text-slate-300">
                      {cust.phone ? cust.phone : <span className="text-slate-655 font-normal italic">Unspecified</span>}
                    </td>
                    <td className="py-3 px-5 text-right font-mono font-semibold text-slate-300">
                      {cust.purchase_count || 1} bills
                    </td>
                    <td className="py-3 px-5 text-right font-mono font-bold text-emerald-400">
                      ৳{parseFloat(cust.total_spending || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-5 text-slate-400 font-mono">
                      {cust.last_purchase_date || "Today"}
                    </td>
                    <td className="py-3 px-5 text-center">
                      <button
                        id={`inspect_${cust.id}`}
                        onClick={() => setActiveHistoryCust(cust)}
                        className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500 hover:text-emerald-400 rounded-lg text-[10.5px] font-mono transition-colors text-slate-400 cursor-pointer"
                      >
                        Inspect History &rarr;
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-slate-500 font-mono text-xs space-y-2 uppercase">
                    <User className="w-8 h-8 mx-auto text-slate-750 stroke-1" />
                    <span>No customer records returned from registry search</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial detailed check Dialog / Flyout */}
      {activeHistoryCust && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl relative text-left">
            
            {/* Close */}
            <button
              onClick={() => setActiveHistoryCust(null)}
              className="absolute top-4 right-4 p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 rounded-lg transition-colors cursor-pointer"
            >
              <span className="sr-only">Close</span>
              <XIcon className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest font-bold">Loyalty Dossier</span>
              <h2 className="text-lg font-bold text-slate-100">{activeHistoryCust.name}</h2>
              <p className="text-xs text-slate-400 font-mono">
                Phone Contact: {activeHistoryCust.phone} | Aggregate spending: ৳{activeHistoryCust.total_spending}
              </p>
            </div>

            {/* Invoices match list */}
            <div className="space-y-3.5 mt-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  <span>Historic Receipts ({customerSales.length})</span>
                </h4>
                {customerSales.length > 0 && (
                  <button
                    onClick={() => setPrintTarget({ type: "all", customer: activeHistoryCust, sales: customerSales })}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10.5px] font-semibold transition-colors cursor-pointer shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Receipt Log
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {customerSales.length > 0 ? (
                  customerSales.map((sale) => (
                    <div key={sale.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 text-xs space-y-2 hover:border-slate-800 transition-colors">
                      <div className="flex items-center justify-between font-mono font-semibold">
                        <span className="text-slate-100">{sale.id}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-[10px]">{new Date(sale.timestamp).toLocaleString()}</span>
                          <button
                            onClick={() => setPrintTarget({ type: "single", sale })}
                            title="Print this invoice card"
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer flex items-center justify-center"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-1 pl-2">
                        {sale.items && sale.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-[11px] text-slate-400">
                            <span>{item.name} <span className="font-mono text-[10px] text-slate-550">x{item.quantity}</span></span>
                            <span className="font-mono">৳{parseFloat(item.item_total).toFixed(1)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Summary */}
                      <div className="border-t border-slate-900 pt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>Payment: {sale.payment_method}</span>
                        <span>
                          Subtotal: ৳{sale.subtotal} | Net Bill: <span className="font-bold text-emerald-400">৳{sale.total}</span>
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-600 font-mono text-[11px]">
                    No digital invoices linking to this phone record.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveHistoryCust(null)}
                className="px-4 py-2 bg-slate-800 text-slate-350 rounded-xl hover:bg-slate-750 font-medium text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Printable Receipt/Log Preview Dialog Container */}
      {printTarget && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-sm bg-stone-100 text-slate-900 border border-stone-200 rounded-2xl p-6 space-y-6 shadow-2xl relative">
            
            {/* Modal Exit Cross button */}
            <button
              onClick={() => setPrintTarget(null)}
              className="absolute top-4 right-4 p-1.5 bg-stone-200 hover:bg-stone-300 text-slate-700 rounded-lg transition-colors cursor-pointer print:hidden"
            >
              <XIcon className="w-4 h-4" />
            </button>

            {/* PRINT PORTION TARGET BY PRINT STYLES */}
            <div id="invoice_print_area" className="space-y-4 text-center text-xs">
              {printTarget.type === "single" ? (
                <>
                  {/* Single Receipt Header */}
                  <div className="space-y-1">
                    <h2 className="text-base font-extrabold font-sans uppercase tracking-tight text-slate-900">BANGLADESH MEDICAL SHOP</h2>
                    <p className="text-[10px] text-slate-600 font-mono font-semibold">Hospital Road, Mirpur-10, Dhaka</p>
                    <p className="text-[10px] text-slate-600 font-mono font-medium">DGDA Drug License: #2334810-DH</p>
                  </div>

                  {/* Metadata fields */}
                  <div className="border-t border-b border-dashed border-slate-300 py-2.5 text-left space-y-0.5 font-mono text-[10px] text-slate-750">
                    <div className="flex justify-between">
                      <span>INVOICE ID:</span>
                      <span className="font-bold">{printTarget.sale.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DATE/TIME:</span>
                      <span>{new Date(printTarget.sale.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CUSTOMER NAME:</span>
                      <span>{activeHistoryCust?.name || "Walk-in Customer"}</span>
                    </div>
                    {activeHistoryCust?.phone && (
                      <div className="flex justify-between">
                        <span>PHONE CONTACT:</span>
                        <span>{activeHistoryCust.phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>PAYMENT BY:</span>
                      <span className="font-semibold">{printTarget.sale.payment_method}</span>
                    </div>
                  </div>

                  {/* Items and quantities listing */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between font-mono font-bold text-[9px] text-slate-600 border-b border-dashed border-slate-300 pb-1 uppercase">
                      <span className="w-1/2 text-left">ITEM BRAND</span>
                      <span className="w-1/6 text-right">QTY</span>
                      <span className="w-1/6 text-right">RATE</span>
                      <span className="w-1/6 text-right">TOTAL</span>
                    </div>

                    <div className="divide-y divide-dashed divide-slate-200 font-mono text-[10px]">
                      {printTarget.sale.items && printTarget.sale.items.map((item, idx) => {
                        const rate = parseFloat(item.price || item.item_total / item.quantity || 0);
                        return (
                          <div key={idx} className="py-2 flex items-center justify-between text-slate-800">
                            <span className="w-1/2 text-left font-bold truncate pr-1" title={item.name}>{item.name}</span>
                            <span className="w-1/6 text-right text-slate-650">{item.quantity}</span>
                            <span className="w-1/6 text-right text-slate-650">৳{rate.toFixed(1)}</span>
                            <span className="w-1/6 text-right font-bold text-slate-850">৳{parseFloat(item.item_total).toFixed(1)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bill Summaries calculation */}
                  <div className="border-t border-dashed border-slate-300 pt-2.5 space-y-1 font-mono text-[10px] text-slate-750">
                    <div className="flex justify-between">
                      <span>SUBTOTAL BILL</span>
                      <span>৳{parseFloat(printTarget.sale.subtotal || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-rose-700">
                      <span>DISCOUNT DEDUCTION</span>
                      <span>-৳{parseFloat(printTarget.sale.discount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-xs text-slate-900 border-t border-stone-300 pt-2 bg-stone-200/50 p-1.5 rounded">
                      <span>TOTAL BILL (Vat In.)</span>
                      <span>৳{parseFloat(printTarget.sale.total || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Anti-biotic awareness and system seal */}
                  <div className="space-y-1.5 border-t border-dashed border-slate-300 pt-3 text-[10px] text-slate-500 font-mono text-center">
                    <p className="font-semibold text-slate-700">🇧🇩 Prescriptions are required for Antibiotic drugs.</p>
                    <p>Thank you for shopping. Stay healthy!</p>
                    <div className="flex items-center justify-center pt-2">
                      <QrCode className="w-10 h-10 stroke-1 text-slate-450" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Customer Purchase Statement Log */}
                  <div className="space-y-1">
                    <h2 className="text-base font-extrabold font-sans uppercase tracking-tight text-slate-900">BANGLADESH MEDICAL SHOP</h2>
                    <p className="text-[10px] text-slate-600 font-mono font-semibold">Hospital Road, Mirpur-10, Dhaka</p>
                    <p className="text-[10px] text-rose-700 font-mono font-bold uppercase tracking-wider text-center pt-1">LOYALTY STATEMENT LOG</p>
                  </div>

                  {/* Customer stats details info */}
                  <div className="border-t border-b border-dashed border-slate-300 py-2.5 text-left space-y-0.5 font-mono text-[10px] text-slate-750">
                    <div className="flex justify-between">
                      <span>CUSTOMER PROFILE:</span>
                      <span className="font-bold">{printTarget.customer.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MOBILE CONTACT:</span>
                      <span>{printTarget.customer.phone || "Walk-in"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MEMBERSHIP ID:</span>
                      <span>{printTarget.customer.id}</span>
                    </div>
                    <div className="flex justify-between border-t border-dashed border-slate-200 mt-1 pt-1">
                      <span>TOTAL BILLS count:</span>
                      <span>{printTarget.sales.length} invoices</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AGGREGATE SPENT:</span>
                      <span className="font-bold text-emerald-700">৳{parseFloat(printTarget.customer.total_spending || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>STATEMENT PRINTED:</span>
                      <span>{new Date().toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Historic Transactions List inside invoice log */}
                  <div className="space-y-3 text-left">
                    <h3 className="font-bold font-mono text-[9px] text-slate-600 border-b border-dashed border-slate-300 pb-1 text-center uppercase tracking-wider">PURCHASE STATEMENT DATA</h3>
                    
                    <div className="divide-y divide-dashed divide-slate-200 text-slate-800">
                      {printTarget.sales.map((sale, idx) => (
                        <div key={idx} className="py-2.5 font-mono text-[10px] space-y-1.5">
                          <div className="flex justify-between font-bold text-slate-900">
                            <span>REF: #{sale.id}</span>
                            <span>{new Date(sale.timestamp).toLocaleDateString()}</span>
                          </div>
                          <div className="pl-2 space-y-1 text-[10px] text-slate-705">
                            {sale.items && sale.items.map((item, itemIdx) => (
                              <div key={itemIdx} className="flex justify-between">
                                <span>• {item.name} <span className="text-[9px] text-slate-500">x{item.quantity}</span></span>
                                <span>৳{parseFloat(item.item_total).toFixed(1)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between text-[9px] font-bold text-slate-850 pt-1 border-t border-dashed border-slate-100">
                            <span>METHOD: {sale.payment_method}</span>
                            <span>SUBTOTAL: ৳{parseFloat(sale.total || 0).toFixed(1)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Statement disclaimer */}
                  <div className="space-y-1.5 border-t border-dashed border-slate-300 pt-3 text-[10px] text-slate-500 font-mono text-center">
                    <p>This is an official system generated loyalty purchase ledger document.</p>
                    <p>Thank you for shopping. Stay healthy!</p>
                  </div>
                </>
              )}
            </div>
            {/* PRINT PORTION END */}

            {/* Print Triggers */}
            <div className="flex gap-2 text-xs print:hidden pt-4">
              <button
                onClick={() => setPrintTarget(null)}
                className="flex-1 py-2.5 bg-stone-200 hover:bg-stone-300 text-slate-750 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  downloadReceiptFile(printTarget);
                  window.print();
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print (PDF) & Download
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Quick tiny standard inline functional close vector
function XIcon({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
