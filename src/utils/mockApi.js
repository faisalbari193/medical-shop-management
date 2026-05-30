import initialDatabase from "../../database.json";

const DB_KEYS = {
  medicines: "db_medicines",
  categories: "db_categories",
  customers: "db_customers",
  sales: "db_sales",
  stockLogs: "db_stock_logs",
};

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "123456";

// Global flag to track offline state
window.isOfflineMode = false;

// Helper to get data from local storage, initialized with seeds from database.json
function getLocalData(key) {
  const data = localStorage.getItem(key);
  if (!data) {
    let initData = [];
    if (key === DB_KEYS.medicines) initData = initialDatabase.medicines;
    else if (key === DB_KEYS.categories) initData = initialDatabase.categories;
    else if (key === DB_KEYS.customers) initData = initialDatabase.customers;
    else if (key === DB_KEYS.sales) initData = initialDatabase.sales;
    else if (key === DB_KEYS.stockLogs) initData = initialDatabase.stock_logs;

    localStorage.setItem(key, JSON.stringify(initData || []));
    return initData || [];
  }
  return JSON.parse(data);
}

function saveLocalData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Simple token validator
function verifyToken(token) {
  return token && token.startsWith("session_");
}

// Intercept window.fetch
const originalFetch = window.fetch;

window.fetch = async function (input, init) {
  let url = typeof input === "string" ? input : input.url;

  if (url.includes("/api/")) {
    try {
      const response = await originalFetch(input, init);
      const contentType = response.headers.get("content-type") || "";

      // If it returns HTML (Netlify SPA routing 404 fallback) or 404 status
      if (contentType.includes("text/html") || response.status === 404) {
        window.isOfflineMode = true;
        return handleMockRequest(url, init);
      }
      return response;
    } catch (error) {
      console.warn("Express backend unreachable, switching to Local Demo Mode:", error);
      window.isOfflineMode = true;
      return handleMockRequest(url, init);
    }
  }

  return originalFetch(input, init);
};

// Mock requests handler to replicate server.js endpoints on client
function handleMockRequest(url, init) {
  const urlObj = new URL(url, window.location.origin);
  const pathname = urlObj.pathname;
  const method = (init && init.method || "GET").toUpperCase();
  const headers = init && init.headers || {};
  
  let body = null;
  if (init && init.body) {
    try {
      body = typeof init.body === "string" ? JSON.parse(init.body) : init.body;
    } catch (e) {
      console.error("Failed to parse request body in mock fetch", e);
    }
  }

  // Get token from Authorization header if present
  let authHeader = headers["Authorization"] || headers["authorization"];
  let token = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }

  const jsonResponse = (data, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" }
    });
  };

  // Route matches
  // 1. Auth Login
  if (pathname === "/api/auth/login" && method === "POST") {
    const { username, password } = body || {};
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = `session_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
      return jsonResponse({ success: true, token, username: ADMIN_USERNAME });
    }
    return jsonResponse({ success: false, error: "Invalid credentials" }, 401);
  }

  // 2. Auth Verify
  if (pathname === "/api/auth/verify" && method === "POST") {
    const { token: bodyToken } = body || {};
    if (bodyToken && verifyToken(bodyToken)) {
      return jsonResponse({ valid: true, username: ADMIN_USERNAME });
    }
    return jsonResponse({ valid: false, error: "Session expired or invalid" }, 401);
  }

  const isAuth = verifyToken(token);

  // 3. Medicines CRUD
  if (pathname === "/api/medicines") {
    if (method === "GET") {
      const medicines = getLocalData(DB_KEYS.medicines);
      return jsonResponse(medicines);
    }
    if (method === "POST") {
      if (!isAuth) return jsonResponse({ error: "Session invalid or expired" }, 401);
      const medicines = getLocalData(DB_KEYS.medicines);
      const newMed = {
        id: `med_${Date.now()}`,
        ...body,
        price: parseFloat(body.price) || 0,
        stock_quantity: parseInt(body.stock_quantity) || 0
      };
      medicines.push(newMed);
      saveLocalData(DB_KEYS.medicines, medicines);

      // Stock Log
      if (newMed.stock_quantity > 0) {
        const logs = getLocalData(DB_KEYS.stockLogs);
        logs.push({
          id: `log_${Date.now()}`,
          medicine_id: newMed.id,
          medicine_name: newMed.name,
          type: "Stock In",
          quantity: newMed.stock_quantity,
          previous_stock: 0,
          new_stock: newMed.stock_quantity,
          remarks: "Initial procurement",
          timestamp: new Date().toISOString()
        });
        saveLocalData(DB_KEYS.stockLogs, logs);
      }

      return jsonResponse(newMed, 201);
    }
  }

  // Medicines PUT/DELETE by ID
  const medIdMatch = pathname.match(/^\/api\/medicines\/([^/]+)$/);
  if (medIdMatch) {
    const medId = medIdMatch[1];
    if (method === "PUT") {
      if (!isAuth) return jsonResponse({ error: "Session invalid or expired" }, 401);
      const medicines = getLocalData(DB_KEYS.medicines);
      const idx = medicines.findIndex(m => m.id === medId);
      if (idx === -1) return jsonResponse({ error: "Medicine not found" }, 404);

      const existingMed = medicines[idx];
      const previousStock = existingMed.stock_quantity;
      const newStock = parseInt(body.stock_quantity) || 0;

      const updatedMed = {
        ...existingMed,
        ...body,
        price: parseFloat(body.price) || 0,
        stock_quantity: newStock
      };
      medicines[idx] = updatedMed;
      saveLocalData(DB_KEYS.medicines, medicines);

      // Log stock adjustment
      if (newStock !== previousStock) {
        const diff = newStock - previousStock;
        const logs = getLocalData(DB_KEYS.stockLogs);
        logs.push({
          id: `log_${Date.now()}`,
          medicine_id: medId,
          medicine_name: updatedMed.name,
          type: diff > 0 ? "Stock In" : "Stock Out",
          quantity: Math.abs(diff),
          previous_stock: previousStock,
          new_stock: newStock,
          remarks: `Manual adjustment from admin panel`,
          timestamp: new Date().toISOString()
        });
        saveLocalData(DB_KEYS.stockLogs, logs);
      }

      return jsonResponse(updatedMed);
    }

    if (method === "DELETE") {
      if (!isAuth) return jsonResponse({ error: "Session invalid or expired" }, 401);
      const medicines = getLocalData(DB_KEYS.medicines);
      const filtered = medicines.filter(m => m.id !== medId);
      if (filtered.length === medicines.length) {
        return jsonResponse({ error: "Medicine not found" }, 404);
      }
      saveLocalData(DB_KEYS.medicines, filtered);
      return jsonResponse({ success: true, message: "Medicine removed successfully" });
    }
  }

  // 4. POS Checkout / Sales
  if (pathname === "/api/sales") {
    if (method === "POST") {
      if (!isAuth) return jsonResponse({ error: "Session invalid or expired" }, 401);
      const { items, customer_id, customer_name, customer_phone, discount, payment_method } = body || {};
      if (!items || items.length === 0) {
        return jsonResponse({ error: "Cannot process sale with an empty cart" }, 400);
      }

      const medicines = getLocalData(DB_KEYS.medicines);
      const logs = getLocalData(DB_KEYS.stockLogs);
      const customers = getLocalData(DB_KEYS.customers);
      const sales = getLocalData(DB_KEYS.sales);

      let subtotal = 0;
      const updatedItems = [];

      for (const item of items) {
        const medIndex = medicines.findIndex(m => m.id === item.medicine_id);
        if (medIndex === -1) {
          return jsonResponse({ error: `Medicine with ID ${item.medicine_id} not found` }, 400);
        }

        const med = medicines[medIndex];
        if (med.stock_quantity < item.quantity) {
          return jsonResponse({ error: `Insufficient stock for ${med.name}. Available: ${med.stock_quantity}, requested: ${item.quantity}` }, 400);
        }

        const prevStock = med.stock_quantity;
        med.stock_quantity -= item.quantity;

        // Stock log reduction
        logs.push({
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          medicine_id: med.id,
          medicine_name: med.name,
          type: "Stock Out",
          quantity: item.quantity,
          previous_stock: prevStock,
          new_stock: med.stock_quantity,
          remarks: "POS Customer Billing Sale",
          timestamp: new Date().toISOString()
        });

        const itemTotal = med.price * item.quantity;
        subtotal += itemTotal;

        updatedItems.push({
          medicine_id: med.id,
          name: med.name,
          price: med.price,
          quantity: item.quantity,
          item_total: itemTotal
        });
      }

      const discountAmount = parseFloat(discount) || 0;
      const total = Math.max(0, subtotal - discountAmount);
      const saleId = `sale_${Date.now()}`;

      // Customer loyalty update
      let targetCustomerId = customer_id;
      if (customer_phone) {
        let customer = customers.find(c => c.phone === customer_phone);
        if (!customer) {
          targetCustomerId = `cust_${Date.now()}`;
          customer = {
            id: targetCustomerId,
            name: customer_name || "Walk-in Customer",
            phone: customer_phone,
            total_spending: total,
            purchase_count: 1,
            last_purchase_date: new Date().toISOString().split("T")[0]
          };
          customers.push(customer);
        } else {
          customer.total_spending = (customer.total_spending || 0) + total;
          customer.purchase_count = (customer.purchase_count || 0) + 1;
          customer.last_purchase_date = new Date().toISOString().split("T")[0];
          if (customer_name) customer.name = customer_name;
          targetCustomerId = customer.id;
        }
      }

      const newSale = {
        id: saleId,
        customer_name: customer_name || "Walk-in Customer",
        customer_phone: customer_phone || "",
        customer_id: targetCustomerId || null,
        subtotal: subtotal,
        discount: discountAmount,
        total: total,
        payment_method: payment_method || "Cash",
        timestamp: new Date().toISOString(),
        items: updatedItems
      };

      sales.push(newSale);

      saveLocalData(DB_KEYS.medicines, medicines);
      saveLocalData(DB_KEYS.stockLogs, logs);
      saveLocalData(DB_KEYS.customers, customers);
      saveLocalData(DB_KEYS.sales, sales);

      return jsonResponse(newSale, 201);
    }
    if (method === "GET") {
      const sales = getLocalData(DB_KEYS.sales);
      return jsonResponse(sales);
    }
  }

  // 5. Customers
  if (pathname === "/api/customers" && method === "GET") {
    const customers = getLocalData(DB_KEYS.customers);
    return jsonResponse(customers);
  }

  // 6. Categories
  if (pathname === "/api/categories") {
    if (method === "GET") {
      const categories = getLocalData(DB_KEYS.categories);
      return jsonResponse(categories);
    }
    if (method === "POST") {
      if (!isAuth) return jsonResponse({ error: "Session invalid or expired" }, 401);
      const { name } = body || {};
      if (!name || name.trim() === "") {
        return jsonResponse({ error: "Category name is required" }, 400);
      }
      const categories = getLocalData(DB_KEYS.categories);
      if (categories.includes(name.trim())) {
        return jsonResponse({ error: "Category already exists" }, 400);
      }
      categories.push(name.trim());
      saveLocalData(DB_KEYS.categories, categories);
      return jsonResponse(name.trim(), 201);
    }
  }

  // 7. Stock Logs
  if (pathname === "/api/stock-logs" && method === "GET") {
    if (!isAuth) return jsonResponse({ error: "Session invalid or expired" }, 401);
    const logs = getLocalData(DB_KEYS.stockLogs);
    return jsonResponse(logs);
  }

  // 8. DGDA Medicine Search Hub (using local mock matching algorithm)
  if (pathname === "/api/medicine-api/search" && method === "GET") {
    const queryParam = urlObj.searchParams.get("query") || "";
    if (queryParam.trim() === "") {
      return jsonResponse([]);
    }

    const filterQuery = queryParam.toLowerCase();
    const LOCAL_MOCK_REGISTRY = [
      {
        name: "Napa 500",
        generic_name: "Paracetamol",
        brand: "Napa",
        manufacturer: "Square Pharmaceuticals Ltd.",
        category: "Pain Relief",
        dosage_form: "Tablet",
        strength: "500 mg",
        price: 1.20,
        description: "Analgesic and antipyretic for quick pain and fever relief."
      },
      {
        name: "Sergel 20 Capsule",
        generic_name: "Esomeprazole",
        brand: "Sergel",
        manufacturer: "Healthcare Pharmaceuticals Ltd.",
        category: "Gastric & Acidity",
        dosage_form: "Capsule",
        strength: "20 mg",
        price: 7.00,
        description: "Proton Pump Inhibitor for hyperacidity, GERD, and healing erosive esophagitis."
      },
      {
        name: "Maxpro 20 Tablet",
        generic_name: "Esomeprazole",
        brand: "Maxpro",
        manufacturer: "Incepta Pharmaceuticals Ltd.",
        category: "Gastric & Acidity",
        dosage_form: "Tablet",
        strength: "20 mg",
        price: 8.00,
        description: "Gastric ulcers, acid reflux medication."
      },
      {
        name: "Ace Plus Tablet",
        generic_name: "Paracetamol + Caffeine",
        brand: "Ace",
        manufacturer: "Square Pharmaceuticals Ltd.",
        category: "Pain Relief",
        dosage_form: "Tablet",
        strength: "500 mg + 65 mg",
        price: 3.00,
        description: "Combines fever reducer with caffeine for expedited headache release."
      },
      {
        name: "Fexo 120",
        generic_name: "Fexofenadine Hydrochloride",
        brand: "Fexo",
        manufacturer: "Square Pharmaceuticals Ltd.",
        category: "Asthma & Allergy",
        dosage_form: "Tablet",
        strength: "120 mg",
        price: 9.00,
        description: "Non-sedating antihistamine for seasonal allergic rhinitis sufferers."
      },
      {
        name: "Seclo 20 Capsule",
        generic_name: "Omeprazole",
        brand: "Seclo",
        manufacturer: "Square Pharmaceuticals Ltd.",
        category: "Gastric & Acidity",
        dosage_form: "Capsule",
        strength: "20 mg",
        price: 6.00,
        description: "Effective antacid capsule for general acidity."
      },
      {
        name: "Osartil 50",
        generic_name: "Losartan Potassium",
        brand: "Osartil",
        manufacturer: "Incepta Pharmaceuticals Ltd.",
        category: "Cardiovascular",
        dosage_form: "Tablet",
        strength: "50 mg",
        price: 10.00,
        description: "Antihypertensive prescription for blood pressure control."
      },
      {
        name: "Secrin 2 Tablet",
        generic_name: "Glimepiride",
        brand: "Secrin",
        manufacturer: "Incepta Pharmaceuticals Ltd.",
        category: "Diabetes Care",
        dosage_form: "Tablet",
        strength: "2 mg",
        price: 12.00,
        description: "Type-2 diabetic glycemic control support."
      },
      {
        name: "Azithrocin 500 Tablet",
        generic_name: "Azithromycin",
        brand: "Azithrocin",
        manufacturer: "Beximco Pharmaceuticals Ltd.",
        category: "Antibiotics",
        dosage_form: "Tablet",
        strength: "500 mg",
        price: 35.00,
        description: "Broad spectrum bacterial infection controller."
      },
      {
        name: "Monas 10 Tablet",
        generic_name: "Montelukast",
        brand: "Monas",
        manufacturer: "ACI Limited",
        category: "Asthma & Allergy",
        dosage_form: "Tablet",
        strength: "10 mg",
        price: 16.00,
        description: "Asthma prevention and allergen prevention tablets."
      },
      {
        name: "Alatrol 10",
        generic_name: "Cetirizine Hydrochloride",
        brand: "Alatrol",
        manufacturer: "Square Pharmaceuticals Ltd.",
        category: "Asthma & Allergy",
        dosage_form: "Tablet",
        strength: "10 mg",
        price: 3.50,
        description: "Antihistamine for general allergies and cold relief."
      },
      {
        name: "Tufnil 200",
        generic_name: "Tolfenamic Acid",
        brand: "Tufnil",
        manufacturer: "Eskayef Pharmaceuticals Ltd.",
        category: "Pain Relief",
        dosage_form: "Tablet",
        strength: "200 mg",
        price: 12.00,
        description: "Prescribed for relief during migraines and severe chronic pain."
      }
    ];

    const matched = LOCAL_MOCK_REGISTRY.filter(
      item =>
        item.name.toLowerCase().includes(filterQuery) ||
        item.generic_name.toLowerCase().includes(filterQuery) ||
        item.brand.toLowerCase().includes(filterQuery)
    );
    return jsonResponse(matched);
  }

  return new Response(JSON.stringify({ error: "Endpoint not simulated" }), {
    status: 404,
    headers: { "Content-Type": "application/json" }
  });
}
