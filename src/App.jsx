import React, { useState, useEffect } from "react";
import { 
  Activity, LayoutDashboard, ShoppingCart, Package, 
  Database, Users, History, FileText, Sliders, LogOut, 
  Menu, X, Sparkles, AlertCircle, BellRing, Sparkle
} from "lucide-react";

// Import custom app sections
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Medicines from "./components/Medicines";
import MedicineForm from "./components/MedicineForm";
import MedicineAPISearch from "./components/MedicineAPISearch";
import POS from "./components/POS";
import Customers from "./components/Customers";
import StockLogs from "./components/StockLogs";
import Reports from "./components/Reports";
import Settings from "./components/Settings";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("admin_token") || "");
  const [username, setUsername] = useState(localStorage.getItem("admin_user") || "");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Database lists
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [stockLogs, setStockLogs] = useState([]);

  // Navigation and UI state
  const [currentView, setCurrentView] = useState("dashboard"); // dashboard, medicines, pos, customers, logs, reports, settings, add_medicine, edit_medicine, api_search
  const [editingMedicine, setEditingMedicine] = useState(null); // stores active medicine for edits
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]); // Global toast notification list

  // Verify auth session on startup
  useEffect(() => {
    const verifySession = async () => {
      if (!token) {
        setIsAuthenticated(false);
        setAuthLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        });
        const data = await response.json();
        
        if (response.ok && data.valid) {
          setIsAuthenticated(true);
          setUsername(data.username);
        } else {
          // Token expired, cleanup
          handleLogout();
        }
      } catch (err) {
        console.error("Auth verify error, falling back", err);
        // If server is starting up or disconnected, allow persistence but flag warning
        setIsAuthenticated(!!token);
        setIsOffline(true);
      } finally {
        setAuthLoading(false);
      }
    };

    verifySession();
  }, [token]);

  // Fetch all database records when authenticated
  const fetchAllData = async () => {
    if (!isAuthenticated) return;
    try {
      const [medsRes, catsRes, custsRes, salesRes, logsRes] = await Promise.all([
        fetch("/api/medicines"),
        fetch("/api/categories"),
        fetch("/api/customers"),
        fetch("/api/sales"),
        fetch("/api/stock-logs", {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ]);

      const [meds, cats, custs, salesData, logs] = await Promise.all([
        medsRes.json(),
        catsRes.json(),
        custsRes.json(),
        salesRes.json(),
        logsRes.json()
      ]);

      setMedicines(meds);
      setCategories(cats);
      setCustomers(custs);
      setSales(salesData);
      setStockLogs(logs);

      if (window.isOfflineMode) {
        setIsOffline(true);
      }

      // Inspect low stock issues to push live notifications
      const lowStockItems = meds.filter(m => m.stock_quantity > 0 && m.stock_quantity < 15);
      if (lowStockItems.length > 0) {
        addToast("warning", `${lowStockItems.length} essential medicines running critically low on stock!`);
      }
    } catch (err) {
      console.error("Data synchronization error:", err);
      addToast("error", "Data synchronization breakdown. Re-connecting...");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

  // Auth helper methods
  const handleLoginSuccess = (newToken, userVal) => {
    localStorage.setItem("admin_token", newToken);
    localStorage.setItem("admin_user", userVal);
    setToken(newToken);
    setUsername(userVal);
    setIsAuthenticated(true);
    if (window.isOfflineMode) {
      setIsOffline(true);
    }
    addToast("success", `Authenticated successfully! Welcome, ${userVal}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setToken("");
    setUsername("");
    setIsAuthenticated(false);
    setCurrentView("dashboard");
    setMobileMenuOpen(false);
  };

  // Custom visual Toast Alert triggers
  const addToast = (type, message) => {
    const id = Date.now() + Math.random().toString();
    setNotifications((prev) => [...prev, { id, type, message }]);
    
    // Auto-wipe toasts after 4.5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((toast) => toast.id !== id));
    }, 4500);
  };

  // CRUD operation callbacks
  const saveMedicineCallback = async (medicinePayload) => {
    try {
      const url = editingMedicine ? `/api/medicines/${editingMedicine.id}` : "/api/medicines";
      const method = editingMedicine ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(medicinePayload)
      });

      if (response.ok) {
        addToast("success", editingMedicine ? "Drug inventory profile revised successfully!" : "Manual drug registered in warehouse!");
        fetchAllData();
        setCurrentView("medicines");
        setEditingMedicine(null);
      } else {
        const err = await response.json();
        addToast("error", err.error || "Failed to commit record updates");
      }
    } catch (err) {
      console.error(err);
      addToast("error", "Wired connection failure committing updates");
    }
  };

  const deleteMedicineCallback = async (medId) => {
    try {
      const response = await fetch(`/api/medicines/${medId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        addToast("success", "Medicine removed from catalogue");
        fetchAllData();
      } else {
        addToast("error", "Cannot drop drug. Dependency logs exist");
      }
    } catch (err) {
      console.error(err);
      addToast("error", "Failed to reach database catalog");
    }
  };

  const addCategoryCallback = (newCat) => {
    setCategories((prev) => [...prev, newCat]);
    addToast("success", `Custom tag category registered: "${newCat}"`);
  };

  // POS Sales Invoice Callback
  const checkoutCallback = async (salesPayload) => {
    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(salesPayload)
      });

      if (response.ok) {
        const completedInvoice = await response.json();
        addToast("success", `POS billing complete. Slip: ${completedInvoice.id}`);
        fetchAllData();
        return completedInvoice;
      } else {
        const err = await response.json();
        addToast("error", err.error || "Checkout card declined");
        return null;
      }
    } catch (err) {
      console.error(err);
      addToast("error", "POS cashout pipe disruption");
      return null;
    }
  };

  // Live importer importer Callback (Saves imported medicine into store)
  const importMedicineCallback = async (medicinePayload) => {
    try {
      const response = await fetch("/api/medicines", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(medicinePayload)
      });

      if (response.ok) {
        addToast("success", `DGDA Catalog item: "${medicinePayload.name}" imported into store stock!`);
        fetchAllData();
        // Redirect immediately back to view warehouse inventory list
        setCurrentView("medicines");
      } else {
        const err = await response.json();
        addToast("error", err.error || "Declined catalog import duplicate");
      }
    } catch (err) {
      console.error(err);
      addToast("error", "Importer connection disruption saving manual profile");
    }
  };

  // Unified controller to handle screen transitions
  const handleTransition = (viewName) => {
    setCurrentView(viewName);
    setMobileMenuOpen(false);
  };

  const handleEditClick = (med) => {
    setEditingMedicine(med);
    setCurrentView("edit_medicine");
  };

  const handleAddNewManualBtn = () => {
    setEditingMedicine(null);
    setCurrentView("add_medicine");
  };

  // Sidebar Menu mapping
  const menuItems = [
    { view: "dashboard", label: "Dashboard Hub", icon: LayoutDashboard },
    { view: "pos", label: "POS Billing Desk", icon: ShoppingCart },
    { view: "medicines", label: "Stocks Catalog", icon: Package },
    { view: "api_search", label: "DGDA Importer", icon: Database },
    { view: "customers", label: "CRM Patients", icon: Users },
    { view: "logs", label: "Warehouse Logs", icon: History },
    { view: "reports", label: "Business Audit", icon: FileText },
    { view: "settings", label: "System Config", icon: Sliders },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-mono text-slate-400">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs">Initializing Bangladesh Pharmacy POS Ledger...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* GLOBAL NOTIFICATION TOAST OVERLAYS */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none max-w-sm">
        {notifications.map((toast) => (
          <div
            key={toast.id}
            className={`p-3.5 rounded-xl border font-sans text-xs flex gap-3 pointer-events-auto shadow-2xl animate-fade-in ${
              toast.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : toast.type === "warning"
                ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                : "bg-rose-500/10 border-rose-500/20 text-rose-450"
            }`}
          >
            <BellRing className="w-4.5 h-4.5 shrink-0 mt-0.5 animate-bounce" />
            <span className="font-semibold leading-normal text-left">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* MOBILE HEADER RESPONSIVENESS PANEL */}
      <header className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
          <span className="font-bold text-sm text-white tracking-tight">Mirpur POS Hub</span>
          {isOffline && (
            <span className="text-[9px] bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono px-1.5 py-0.5 rounded uppercase tracking-wider">
              Demo
            </span>
          )}
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* SIDEBAR NAVIGATION SCREEN DESIGNS */}
      <aside className={`w-64 bg-slate-900 border-r border-slate-850 shrink-0 flex flex-col justify-between fixed inset-y-0 left-0 z-40 transform transition-transform md:translate-x-0 md:static ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {/* Branding header */}
        <div className="p-6 border-b border-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center animate-pulse">
              <Activity className="w-5 h-5" />
            </div>
            <div className="text-left leading-none">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-white tracking-tight block">Mirpur POS</span>
                {isOffline && (
                  <span className="text-[8px] bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono px-1.5 py-0.2 rounded uppercase tracking-wider shrink-0">
                    Demo
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 font-mono tracking-widest block uppercase mt-0.5">Dhaka, BD</span>
            </div>
          </div>
        </div>

        {/* Menu list */}
        <nav className="p-4 space-y-1 overflow-y-auto flex-1 text-left">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view || 
              (item.view === "medicines" && (currentView === "add_medicine" || currentView === "edit_medicine"));
            
            return (
              <button
                key={item.view}
                onClick={() => handleTransition(item.view)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive 
                    ? "bg-slate-800 text-emerald-400 font-bold shadow-sm" 
                    : "text-slate-450 hover:bg-slate-850 hover:text-slate-200"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald-400" : "text-slate-500"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User administrative profile / logout stamp */}
        <div className="p-4 border-t border-slate-850 bg-slate-950/20">
          <div className="flex items-center justify-between gap-3 p-2 bg-slate-950/40 rounded-xl border border-slate-850">
            <div className="text-left">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Logged as</span>
              <span className="text-xs font-semibold text-slate-300 block truncate max-w-[110px]">{username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 bg-slate-900 border border-slate-800 hover:border-rose-500 hover:text-rose-400 text-slate-400 rounded-lg transition-colors cursor-pointer"
              title="Logout session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN SCREEN WORKSPACE LAYOUT ACTIONS */}
      <main className="flex-1 p-6 overflow-y-auto w-full">
        <div className="max-w-7xl mx-auto">
          {(() => {
            switch (currentView) {
              case "dashboard":
                return (
                  <Dashboard 
                    medicines={medicines} 
                    sales={sales} 
                    customers={customers} 
                    onViewChange={handleTransition}
                    onRefetch={fetchAllData}
                  />
                );
              case "medicines":
                return (
                  <Medicines 
                    medicines={medicines} 
                    categories={categories} 
                    onAddMedicine={handleAddNewManualBtn}
                    onEditMedicine={handleEditClick}
                    onDeleteMedicine={deleteMedicineCallback}
                    onAddCategory={addCategoryCallback}
                    onOpenAPISearch={() => handleTransition("api_search")}
                    token={token}
                  />
                );
              case "add_medicine":
              case "edit_medicine":
                return (
                  <MedicineForm 
                    medicine={editingMedicine}
                    categories={categories}
                    onSave={saveMedicineCallback}
                    onCancel={() => handleTransition("medicines")}
                  />
                );
              case "api_search":
                return (
                  <MedicineAPISearch 
                    onImportMedicine={importMedicineCallback}
                    medicines={medicines}
                    categories={categories}
                    onCancel={() => handleTransition("medicines")}
                  />
                );
              case "pos":
                return (
                  <POS 
                    medicines={medicines}
                    onCheckout={checkoutCallback}
                    customers={customers}
                  />
                );
              case "customers":
                return (
                  <Customers 
                    customers={customers} 
                    sales={sales}
                  />
                );
              case "logs":
                return (
                  <StockLogs 
                    logs={stockLogs} 
                  />
                );
              case "reports":
                return (
                  <Reports 
                    sales={sales} 
                    medicines={medicines} 
                    customers={customers}
                  />
                );
              case "settings":
                return (
                  <Settings />
                );
              default:
                return (
                  <div className="py-20 text-center font-mono">
                    <AlertCircle className="w-8 h-8 mx-auto text-rose-500 pb-2" />
                    Oops! Active workspace rendering division invalid.
                  </div>
                );
            }
          })()}
        </div>
      </main>

    </div>
  );
}
