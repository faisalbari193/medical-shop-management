# Bangladesh Medical Shop Management Web Application
### Hybrid POS & DGDA Medicine API System (Express + Vite + React + Tailwind v4)

A modern, production-ready pharmacy POS and inventory management system designed for medical shops in Bangladesh. Features an intelligent, Gemini-powered DGDA (Directorate General of Drug Administration) API search engine, stock controls, near-expiry alerts, custom receipt print systems, CRM metrics, and exports.

---

## 🛠 Features

1. **Intelligent DGDA Medicine Importer (Bangladesh Medicine API)**:
   - Uses the server-side **Gemini API** (`gemini-3.5-flash`) to act as a highly accurate lookup of official Bangladesh registered medicines.
   - Searches products by brand name or generic formulations (covering top pharma brands such as Square, Incepta, Beximco, Healthcare, etc.).
   - Returns standard retail prices, generic drug metadata, batch lot formats, and indicators.
   - Restricts duplication by matching brand + generic against existing shop database records.

2. **Full-Featured Pharmacy POS (Billing Desk)**:
   - Real-time search of shop medicines in millisecond lookups.
   - Add items to the cart, check warehouse quantity caps, adjust units, and specify custom discounts.
   - Links loyalty accounts automatically via phone number.
   - Renders a pixel-perfect, thermal paper simulated printable invoice page (`ctrl+p` compatible CSS print rules layout).

3. **Stock Control & Warehouse Logs**:
   - Trace adjustments and POS checkout deductions in real-time.
   - Low Stock Caution alerts (flagging under 15 units) and Empty indicators.
   - Color-coded near-expiration safety indicators (flagging products expiring in the next 60 days).

4. **Category Manager**:
   - Custom create categories (such as Gastric, Acidity, Antibiotics, Asthma) with dynamic validation.

5. **Analytical Reports Dashboard**:
   - Ledger sales overview charts showing 7-day business performance graphs (Recharts).
   - Filter sales summaries by Daily ledger details or Monthly business audit records.
   - Export structured spreadsheets instantly as CSV.

6. **Loyalty CRM Registry**:
   - Map phone contacts with purchase count frequencies and total expenditures.
   - Inspect individual historic sale items, dates, and bills.

---

## 📂 Project Structure

```text
├── database.json          # Pre-seeded local file-system fallback database
├── schema.sql             # Supabase PostgreSQL Database Table schemas
├── server.ts              # Full-stack Express API Backend & Gemini Integrations
├── package.json           # Scripts (Vite build + ESBuild backend bundle)
├── index.html             # Client-side mount index file
├── metadata.json          # Application capabilities settings
├── .env.example           # Configurations blueprint document
├── src/
│   ├── main.jsx           # Main React DOM entry
│   ├── index.css          # Global Tailwind CSS directives + Print Receipt CSS
│   ├── App.jsx            # Dynamic state manager & layout router
│   ├── components/
│   │   ├── Login.jsx            # Admin login authentication screen
│   │   ├── Dashboard.jsx        # Stats, charts, and low-stock list
│   │   ├── Medicines.jsx        # Stocks inventory catalog tables and filters
│   │   ├── MedicineForm.jsx     # Manual add/edit drug forms
│   │   ├── MedicineAPISearch.jsx# Bangladesh Medicine API importer card wizard
│   │   ├── POS.jsx              # Customer sales billing and print invoice modal
│   │   ├── Customers.jsx        # loyalty contacts and historic receipts viewer
│   │   ├── StockLogs.jsx        # Audit trails showing stock fluctuations
│   │   ├── Settings.jsx         # Custom VAT tax parameters and shop header config
```
---
## 🛢 Supabase PostgreSQL Integration Guide

The system uses an **Express JSON database engine** (`database.json`) as a stable local data fallback. To move into a live **Supabase cloud datastore**, run the SQL schema of `schema.sql` inside your Supabase dashboard editor:

1. Create a free database at [Supabase](https://supabase.com).
2. Open the **SQL Editor** tab on the left sidebar.
3. Paste the contents of `schema.sql` and click **Run**.
4. Capture your SQL connection or direct table bindings and link within the Express `.env` file variables.

---

## 🚀 Launching & Local Setup

### 1. Install Workspace Dependencies
```bash
npm install
```

### 2. Configure Environment variables
Create a `.env` file referencing `.env.example`:
```env
GEMINI_API_KEY="your-gemini-key"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="123456"
```

### 3. Launch Development Server
```bash
npm run dev
```
The application will boot a full-stack, hot-reloading dashboard at [http://localhost:3000](http://localhost:3000)!

### 4. Production compiled build
To compile assets and bundle the server into a fast, self-contained CommonJS node deployment script:
```bash
npm run build
npm start
```
This produces clean public static files inside `/dist` and compiles a packaged backend file under `dist/server.cjs` with ESBuild.
