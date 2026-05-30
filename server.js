import express from "express";
import path from "path";
import fs from "fs/promises";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "database.json");

app.use(express.json());

// Simple custom auth configuration
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123456";

// Keep active sessions in-memory for validation
const activeSessions = new Set();

// Helper to read database.json
async function readDB() {
  try {
    const data = await fs.readFile(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database.json, initializing empty db shell", error);
    return { medicines: [], categories: [], customers: [], sales: [], stock_logs: [] };
  }
}

// Helper to write database.json
async function writeDB(data) {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing to database.json:", error);
    return false;
  }
}

// API Routes
// ----------------------------------------------------

// 1. Auth Login
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = `session_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
    activeSessions.add(token);
    return res.json({ success: true, token, username: ADMIN_USERNAME });
  }
  return res.status(401).json({ success: false, error: "Invalid credentials" });
});

// 2. Auth Verify
app.post("/api/auth/verify", (req, res) => {
  const { token } = req.body;
  if (token && activeSessions.has(token)) {
    return res.json({ valid: true, username: ADMIN_USERNAME });
  }
  return res.status(401).json({ valid: false, error: "Session expired or invalid" });
});

// Middleware to check authentication (Admin routes)
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No credentials provided" });
  }
  const token = authHeader.split(" ")[1];
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ error: "Session invalid or expired" });
  }
  next();
}

// 3. Medicine Management (CRUD)
app.get("/api/medicines", async (req, res) => {
  const db = await readDB();
  res.json(db.medicines || []);
});

app.post("/api/medicines", requireAuth, async (req, res) => {
  const db = await readDB();
  const newMedicine = req.body;
  
  if (!newMedicine.name || !newMedicine.price) {
    return res.status(400).json({ error: "Medicine name and price are required" });
  }

  // Create clean ID
  const newId = `med_${Date.now()}`;
  const medicineToSave = {
    id: newId,
    ...newMedicine,
    price: parseFloat(newMedicine.price) || 0,
    stock_quantity: parseInt(newMedicine.stock_quantity) || 0
  };

  db.medicines = db.medicines || [];
  db.medicines.push(medicineToSave);

  // Log stock transaction if stock initial > 0
  if (medicineToSave.stock_quantity > 0) {
    db.stock_logs = db.stock_logs || [];
    db.stock_logs.push({
      id: `log_${Date.now()}`,
      medicine_id: newId,
      medicine_name: medicineToSave.name,
      type: "Stock In",
      quantity: medicineToSave.stock_quantity,
      previous_stock: 0,
      new_stock: medicineToSave.stock_quantity,
      remarks: "Initial procurement",
      timestamp: new Date().toISOString()
    });
  }

  await writeDB(db);
  res.status(201).json(medicineToSave);
});

// Update medicine
app.put("/api/medicines/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const db = await readDB();
  const medicineIndex = db.medicines.findIndex((m) => m.id === id);

  if (medicineIndex === -1) {
    return res.status(404).json({ error: "Medicine not found" });
  }

  const existingMed = db.medicines[medicineIndex];
  const updateData = req.body;

  const previousStock = existingMed.stock_quantity;
  const newStock = parseInt(updateData.stock_quantity) || 0;

  // Compile revised object
  const updatedMed = {
    ...existingMed,
    ...updateData,
    price: parseFloat(updateData.price) || 0,
    stock_quantity: newStock
  };

  db.medicines[medicineIndex] = updatedMed;

  // Log stock discrepancies
  if (newStock !== previousStock) {
    const diff = newStock - previousStock;
    db.stock_logs = db.stock_logs || [];
    db.stock_logs.push({
      id: `log_${Date.now()}`,
      medicine_id: id,
      medicine_name: updatedMed.name,
      type: diff > 0 ? "Stock In" : "Stock Out",
      quantity: Math.abs(diff),
      previous_stock: previousStock,
      new_stock: newStock,
      remarks: `Manual adjustment from admin panel`,
      timestamp: new Date().toISOString()
    });
  }

  await writeDB(db);
  res.json(updatedMed);
});

// Delete medicine
app.delete("/api/medicines/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const db = await readDB();
  const len = db.medicines.length;
  db.medicines = db.medicines.filter((m) => m.id !== id);

  if (db.medicines.length === len) {
    return res.status(404).json({ error: "Medicine not found" });
  }

  await writeDB(db);
  res.json({ success: true, message: "Medicine removed successfully" });
});

// 4. POS Checkout / Sales Routing
app.post("/api/sales", requireAuth, async (req, res) => {
  const db = await readDB();
  const { items, customer_id, customer_name, customer_phone, discount, payment_method } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "Cannot process sale with an empty cart" });
  }

  // Calculate totals
  let subtotal = 0;
  const updatedItems = [];

  db.medicines = db.medicines || [];
  db.stock_logs = db.stock_logs || [];

  for (const item of items) {
    const medIndex = db.medicines.findIndex((m) => m.id === item.medicine_id);
    if (medIndex === -1) {
      return res.status(400).json({ error: `Medicine with ID ${item.medicine_id} not found` });
    }

    const med = db.medicines[medIndex];
    if (med.stock_quantity < item.quantity) {
      return res.status(400).json({ error: `Insufficient stock for ${med.name}. Available: ${med.stock_quantity}, requested: ${item.quantity}` });
    }

    // Deduct stock
    const prevStock = med.stock_quantity;
    med.stock_quantity -= item.quantity;

    // Log stock reduction
    db.stock_logs.push({
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
  db.customers = db.customers || [];

  if (customer_phone) {
    let customer = db.customers.find((c) => c.phone === customer_phone);
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
      db.customers.push(customer);
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

  db.sales = db.sales || [];
  db.sales.push(newSale);

  await writeDB(db);
  res.status(201).json(newSale);
});

// GET Sales Registry for reports & dashboard syncing
app.get("/api/sales", async (req, res) => {
  const db = await readDB();
  res.json(db.sales || []);
});

// 5. Customer Registry
app.get("/api/customers", async (req, res) => {
  const db = await readDB();
  res.json(db.customers || []);
});

// 6. Categories Registry
app.get("/api/categories", async (req, res) => {
  const db = await readDB();
  res.json(db.categories || []);
});

app.post("/api/categories", requireAuth, async (req, res) => {
  const db = await readDB();
  const { name } = req.body;
  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Category name is required" });
  }
  
  db.categories = db.categories || [];
  if (db.categories.includes(name.trim())) {
    return res.status(400).json({ error: "Category already exists" });
  }

  db.categories.push(name.trim());
  await writeDB(db);
  res.status(201).json(name.trim());
});

// 7. Stock Logs
app.get("/api/stock-logs", requireAuth, async (req, res) => {
  const db = await readDB();
  res.json(db.stock_logs || []);
});

// 8. Bangladesh Medicine API Integrated Hub (Gemini Powered AI Registry)
app.get("/api/medicine-api/search", async (req, res) => {
  const { query } = req.query;
  if (!query || String(query).trim() === "") {
    return res.json([]);
  }

  console.log(`Searching Bangladesh Medicine API for brand/generic: "${query}"`);

  // Direct mock database matching
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

  // Try to use Gemini model for live lookup if apiKey is provided
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Provide standard drug registry records for Bangladesh matches matching brand or generic query: "${query}".`,
        config: {
          systemInstruction: `You are the Official Directorate General of Drug Administration (DGDA) Bangladesh Medicine Registry Search Engine.
Return standard medicine information matching the user query in Bangladesh.
Only recommend actual registered pharmaceutical products manufactured in Bangladesh (companies like Square, Incepta, Beximco, Healthcare, Renata, ACI, Eskayef, Opsonin etc.).
You MUST return the output strictly in valid JSON as an Array of objects.
Do not wrap it in markdown block. Return raw string starting with [ and ending with ].

JSON items must strictly adhere to this schema:
{
  "name": "Standard retail name (e.g. Napa 500, Sergel 20)",
  "generic_name": "Generic medical name (e.g. Paracetamol, Esomeprazole)",
  "brand": "Product brand core name (e.g. Napa, Sergel)",
  "manufacturer": "Company Name in full (e.g. Square Pharmaceuticals Ltd.)",
  "category": "Pain Relief, Gastric & Acidity, Antibiotics, Asthma & Allergy, Cardiovascular, Diabetes Care, Ophthalmology, Cough & Cold, Vitamins & Supplements, or Others",
  "dosage_form": "Tablet, Capsule, Liquid, Infusion, Syrup, Drop, or Suspension",
  "strength": "Standard size strength (e.g. 500 mg, 20 mg, 10 mg, 120 ml)",
  "price": number (estimate real average price in BDT, e.g. 1.5, 7.0, 35.0, 16.0),
  "description": "Short summary of its medical indication"
}`,
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                generic_name: { type: Type.STRING },
                brand: { type: Type.STRING },
                manufacturer: { type: Type.STRING },
                category: { type: Type.STRING },
                dosage_form: { type: Type.STRING },
                strength: { type: Type.STRING },
                price: { type: Type.NUMBER },
                description: { type: Type.STRING }
              },
              required: ["name", "generic_name", "brand", "manufacturer", "category", "price", "strength", "dosage_form"]
            }
          }
        },
      });

      const text = response.text ? response.text.trim() : "";
      if (text) {
        const results = JSON.parse(text);
        if (Array.isArray(results) && results.length > 0) {
          console.log(`Successfully fetched ${results.length} records dynamically matching query via DGDA Search Engine`);
          return res.json(results);
        }
      }
    } catch (err) {
      console.error("Gemini DGDA lookup request failed, reverting to local matching system", err);
    }
  }

  // Fallback Matching Algorithm
  const filterQuery = String(query).toLowerCase();
  const matched = LOCAL_MOCK_REGISTRY.filter(
    (item) =>
      item.name.toLowerCase().includes(filterQuery) ||
      item.generic_name.toLowerCase().includes(filterQuery) ||
      item.brand.toLowerCase().includes(filterQuery)
  );

  res.json(matched);
});

// ----------------------------------------------------
// Setup Vite Static Assets Handler and HTML SPA Routing
// Serves front-end app

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server launched successfully. URL: http://localhost:${PORT}`);
  });
}

startServer();
