import React, { useState, useMemo, useRef } from "react";
import { 
  Search, ShoppingCart, Plus, Minus, Trash, DollarSign,
  User, Phone, Sparkles, CheckCircle2, Ticket, QrCode,
  Files, RefreshCw, X, ReceiptText, Printer, ArrowRight
} from "lucide-react";

export default function POS({ medicines, onCheckout, customers }) {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [discount, setDiscount] = useState("0"); // in BDT amount
  const [paymentMethod, setPaymentMethod] = useState("Cash"); // Cash, bKash, Card, Nagad
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(null); // stores completed invoice data

  const searchInputRef = useRef(null);

  // Fast search filter list
  const filteredMeds = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return medicines.filter(
      (m) =>
        m.stock_quantity > 0 && (
          m.name.toLowerCase().includes(q) ||
          m.generic_name.toLowerCase().includes(q) ||
          m.brand.toLowerCase().includes(q)
        )
    ).slice(0, 5); // limit search autocomplete to top 5 results for sleek UI
  }, [medicines, search]);

  // Handle linking from customer phone registry lookup
  const handlePhoneLookup = (phoneVal) => {
    setCustomerPhone(phoneVal);
    const matched = customers.find(c => c.phone === phoneVal);
    if (matched) {
      setCustomerName(matched.name);
      setCustomerId(matched.id);
    } else {
      setCustomerId("");
    }
  };

  const addToCart = (med) => {
    const existing = cart.find((item) => item.medicine_id === med.id);
    if (existing) {
      if (existing.quantity >= med.stock_quantity) {
        alert(`Cannot add more. Available stock is only: ${med.stock_quantity}`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.medicine_id === med.id
            ? { ...item, quantity: item.quantity + 1, item_total: (item.quantity + 1) * item.price }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          medicine_id: med.id,
          name: med.name,
          price: med.price,
          quantity: 1,
          item_total: med.price,
          stock: med.stock_quantity,
          generic: med.generic_name
        }
      ]);
    }
    setSearch(""); // clear autocomplete search box
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  const updateQuantity = (medId, change) => {
    setCart(
      cart
        .map((item) => {
          if (item.medicine_id === medId) {
            const newQty = item.quantity + change;
            if (newQty <= 0) return null;
            if (newQty > item.stock) {
              alert(`Insufficient warehouse stock. Max: ${item.stock}`);
              return item;
            }
            return {
              ...item,
              quantity: newQty,
              item_total: newQty * item.price
            };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const clearCart = () => {
    setCart([]);
    setDiscount("0");
    setCustomerName("");
    setCustomerPhone("");
    setCustomerId("");
  };

  // Compute totals
  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.item_total, 0);
    const discountAmount = parseFloat(discount) || 0;
    const netTotal = Math.max(0, subtotal - discountAmount);
    return { subtotal, discountAmount, netTotal };
  }, [cart, discount]);

  // Submit checkout purchase
  const handlePayment = async () => {
    if (cart.length === 0) {
      alert("Billing cart is empty!");
      return;
    }

    setCheckoutLoading(true);
    try {
      const payload = {
        items: cart,
        customer_id: customerId || null,
        customer_name: customerName.trim() || "Walk-in Customer",
        customer_phone: customerPhone.trim() || "",
        discount: totals.discountAmount,
        payment_method: paymentMethod
      };

      const invoice = await onCheckout(payload);
      if (invoice) {
        setCheckoutSuccess(invoice);
        clearCart();
      }
    } catch (err) {
      console.error(err);
      alert("Error finalizing checkout sale. Verify transaction pipeline");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="pos_view" className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
      
      {/* LEFT: Search, Quick items catalog (Col-span: 7) */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-md">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100 font-sans">POS Billing Desk</h2>
          </div>

          <div className="relative">
            <Search className="absolute left-3 inset-y-0 my-auto text-slate-500 w-4.5 h-4.5" />
            <input
              ref={searchInputRef}
              id="pos_search_input"
              type="text"
              autoFocus
              placeholder="Start typing brand name, generic formulation, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-650 rounded-xl focus:outline-none focus:border-emerald-500 font-medium text-sm transition-all"
            />
          </div>

          {/* Search autocomplete flyout panel */}
          {search.trim() !== "" && (
            <div className="relative z-10">
              <div className="absolute top-0 w-full bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-800">
                {filteredMeds.length > 0 ? (
                  filteredMeds.map((med) => (
                    <div
                      key={med.id}
                      onClick={() => addToCart(med)}
                      className="p-3 hover:bg-slate-900 flex items-center justify-between text-xs cursor-pointer select-none transition-colors"
                    >
                      <div className="text-left space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-100 text-sm">{med.name}</span>
                          <span className="px-1.5 py-0.2 bg-slate-900 text-slate-400 rounded text-[9px] font-mono">{med.dosage_form || "Tab"}</span>
                        </div>
                        <span className="text-slate-500 text-[10px] block font-mono">
                          {med.generic_name} • {med.strength} • Stock: {med.stock_quantity}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-emerald-400 font-bold">৳{parseFloat(med.price).toFixed(2)}</span>
                        <span className="text-[10px] font-mono py-0.5 px-2 bg-emerald-500/10 text-emerald-400 rounded font-semibold">+ Add</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-500 font-mono text-xs">
                    No matching stocks found or empty warehouse.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Popular Fast-Selling Binders Grid */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider font-semibold">Fast Sell Panel</span>
            <span className="text-[10px] text-slate-500 font-mono italic">Quick tab checkout additions</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {medicines.slice(0, 6).map((med) => {
              const inStock = med.stock_quantity > 0;
              return (
                <button
                  key={med.id}
                  disabled={!inStock}
                  onClick={() => addToCart(med)}
                  className={`p-3 bg-slate-950 border text-left rounded-xl transition-all flex flex-col justify-between h-24 ${
                    inStock ? "border-slate-850 hover:border-emerald-500 hover:bg-slate-900/60 cursor-pointer" : "border-slate-900 opacity-40 cursor-not-allowed"
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-200 block truncate text-xs">{med.name}</span>
                    <span className="text-[10px] font-mono text-slate-500 block truncate">{med.generic_name}</span>
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] text-slate-400 font-bold">৳{parseFloat(med.price).toFixed(2)}</span>
                    <span className="font-mono text-[9px] text-emerald-400 font-semibold bg-emerald-500/5 px-2 py-0.2 rounded border border-emerald-500/10">In Stock</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT: Selected Cart, Loyalty, Discount & billing Checkout Summary (Col-span: 5) */}
      <div className="lg:col-span-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between overflow-hidden shadow-lg shadow-slate-950/20 max-h-[600px]">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/20 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold text-xs text-slate-200">Billing Cart list ({cart.length})</span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[10px] font-mono text-rose-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear Cart
              </button>
            )}
          </div>

          {/* Cart items list (flexible viewport) */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-850 p-4 max-h-[220px]">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div key={item.medicine_id} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-850/10">
                  <div className="space-y-0.5 max-w-[190px]">
                    <span className="font-semibold text-slate-200 block truncate">{item.name}</span>
                    <span className="text-[10px] text-slate-500 block font-mono">৳{parseFloat(item.price).toFixed(2)} / unit</span>
                  </div>
                  
                  {/* Quantity Increment Actions */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                      <button
                        onClick={() => updateQuantity(item.medicine_id, -1)}
                        className="p-1 hover:text-white text-slate-400 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono text-slate-100 px-2 font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.medicine_id, 1)}
                        className="p-1 hover:text-white text-slate-400 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    
                    {/* Item sum */}
                    <span className="font-mono text-slate-350 font-bold min-w-[50px] text-right">
                      ৳{item.item_total.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-500 font-mono text-xs space-y-1">
                <p>Billing cart is empty.</p>
                <p className="text-[10px] text-slate-650">Select items from the fast sell panel or search box.</p>
              </div>
            )}
          </div>

          {/* Customer CRM info and loyalty linkage */}
          <div className="bg-slate-950/35 border-t border-b border-slate-850 p-4 space-y-3">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold block">Customer Loyalty & Billing Details</span>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Phone */}
              <div className="space-y-0.5 text-left">
                <label className="text-[10.5px] text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" /> Mobile Number</label>
                <input
                  type="text"
                  placeholder="e.g. 01712345678"
                  value={customerPhone}
                  onChange={(e) => handlePhoneLookup(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Name */}
              <div className="space-y-0.5 text-left">
                <label className="text-[10.5px] text-slate-500 flex items-center gap-1"><User className="w-3 h-3" /> Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mr. Alam"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Loyalty indicator status alert */}
            {customerId && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 flex items-center justify-between text-[11px] text-emerald-400 font-mono">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Linked Customer Account</span>
                <span className="font-semibold text-white">SP: ৳{customers.find(c => c.id === customerId)?.total_spending}</span>
              </div>
            )}
          </div>

          {/* Checkout & Bill breakdown */}
          <div className="p-4 bg-slate-950/70 border-t border-slate-800 space-y-4">
            
            {/* Discount and Payment Method Configuration */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1 text-left">
                <label className="text-[10px] text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1">
                  <Ticket className="w-3.5 h-3.5 text-emerald-400" /> Discount (৳ BDT)
                </label>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-stone-100 font-mono"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer text-xs"
                >
                  <option value="Cash">💵 Cash</option>
                  <option value="bKash">📱 bKash</option>
                  <option value="Nagad">📱 Nagad</option>
                  <option value="Card">💳 Credit/Debit Card</option>
                </select>
              </div>
            </div>

            {/* Calculations summaries */}
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between font-mono">
                <span>Cart Subtotal</span>
                <span className="text-slate-100 font-semibold">৳{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-mono text-rose-400">
                <span>Discount / Deductions</span>
                <span>-৳{totals.discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base text-white font-sans font-bold border-t border-slate-800/80 pt-2 pb-1 bg-slate-950 p-2 rounded-lg">
                <span className="text-emerald-400 flex items-center gap-1">Net Bill Total</span>
                <span className="text-emerald-400 font-mono">৳{totals.netTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Pay checkout trigger */}
            <button
              id="checkout_complete_btn"
              onClick={handlePayment}
              disabled={checkoutLoading || cart.length === 0}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl text-xs tracking-wider uppercase transition-colors shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {checkoutLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : "Authorize Checkout & Invoice print"}
            </button>
          </div>

        </div>
      </div>

      {/* Checkout Success Print View Modal */}
      {checkoutSuccess && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-sm bg-stone-100 text-slate-900 border border-stone-200 rounded-2xl p-6 space-y-6 shadow-2xl relative">
            
            {/* Modal Exit Button */}
            <button
              onClick={() => setCheckoutSuccess(null)}
              className="absolute top-4 right-4 p-1.5 bg-stone-200 hover:bg-stone-300 text-slate-700 rounded-lg transition-colors cursor-pointer print:hidden"
            >
              <X className="w-4 h-4" />
            </button>

            {/* PRINT PORTION START */}
            <div id="invoice_print_area" className="space-y-4 text-center text-xs">
              {/* Branding header */}
              <div className="space-y-1">
                <h2 className="text-base font-extrabold font-sans uppercase tracking-tight">BANGLADESH MEDICAL SHOP</h2>
                <p className="text-[10px] text-slate-600 font-mono font-semibold">Hospital Road, Mirpur-10, Dhaka</p>
                <p className="text-[10px] text-slate-600 font-mono font-medium">DGDA Drug License: #2334810-DH</p>
              </div>

              {/* Invoice identifier metadata */}
              <div className="border-t border-b border-dashed border-slate-300 py-2.5 text-left space-y-0.5 font-mono text-[10px] text-slate-750">
                <div className="flex justify-between">
                  <span>INVOICE ID:</span>
                  <span className="font-bold">{checkoutSuccess.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE/TIME:</span>
                  <span>{new Date(checkoutSuccess.timestamp).toLocaleString()}</span>
                </div>
                {checkoutSuccess.customer_phone && (
                  <div className="flex justify-between">
                    <span>CUSTOMER BILL:</span>
                    <span>{checkoutSuccess.customer_name} ({checkoutSuccess.customer_phone})</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>PAYMENT BY:</span>
                  <span className="font-semibold">{checkoutSuccess.payment_method}</span>
                </div>
              </div>

              {/* Items listing table */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between font-mono font-bold text-[9px] text-slate-600 border-b border-dashed border-slate-300 pb-1 uppercase">
                  <span className="w-1/2 text-left">ITEM BRAND</span>
                  <span className="w-1/6 text-right">QTY</span>
                  <span className="w-1/6 text-right">RATE</span>
                  <span className="w-1/6 text-right">TOTAL</span>
                </div>

                <div className="divide-y divide-dashed divide-slate-200 font-mono text-[10px]">
                  {checkoutSuccess.items && checkoutSuccess.items.map((item, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-slate-800">
                      <span className="w-1/2 text-left font-bold truncate pr-1" title={item.name}>{item.name}</span>
                      <span className="w-1/6 text-right text-slate-650">{item.quantity}</span>
                      <span className="w-1/6 text-right text-slate-650">৳{parseFloat(item.price).toFixed(1)}</span>
                      <span className="w-1/6 text-right font-bold text-slate-850">৳{parseFloat(item.item_total).toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total calculations details */}
              <div className="border-t border-dashed border-slate-300 pt-2.5 space-y-1 font-mono text-[10px] text-slate-750">
                <div className="flex justify-between">
                  <span>SUBTOTAL BILL</span>
                  <span>৳{checkoutSuccess.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>DISCOUNT DEDUCTION</span>
                  <span>-৳{checkoutSuccess.discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-xs text-slate-900 border-t border-stone-300 pt-2 bg-stone-200/50 p-1.5 rounded">
                  <span>TOTAL BILL (Vat In.)</span>
                  <span>৳{checkoutSuccess.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Compliance footer stamp */}
              <div className="space-y-1.5 border-t border-dashed border-slate-300 pt-3 text-[10px] text-slate-500 font-mono">
                <p className="font-semibold text-slate-700">🇧🇩 Presistents are required for Antibiotic drugs.</p>
                <p>Thank you for shopping. Stay healthy!</p>
                <div className="flex items-center justify-center pt-2">
                  <QrCode className="w-10 h-10 stroke-1 text-slate-400" />
                </div>
              </div>
            </div>
            {/* PRINT PORTION END */}

            {/* Print trigger actions */}
            <div className="flex gap-2 text-xs print:hidden pt-4">
              <button
                onClick={() => setCheckoutSuccess(null)}
                className="flex-1 py-2.5 bg-stone-200 hover:bg-stone-300 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
              >
                Close Desk
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Receipt (PDF)
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
