-- Medical Shop Management SQL Schema (Supabase PostgreSQL Compatible)
-- This schema represents the full physical database for the application.
-- You can run this directly in the Supabase SQL Editor.

-- Disable RLS initially or enable it as per your security guidelines.
-- We are using custom simple admin validation on application levels.

-- 1. Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial categories
INSERT INTO categories (name) VALUES 
('Pain Relief'),
('Gastric & Acidity'),
('Antibiotics'),
('Asthma & Allergy'),
('Cardiovascular'),
('Diabetes Care'),
('Ophthalmology'),
('Cough & Cold'),
('Vitamins & Supplements'),
('Others')
ON CONFLICT (name) DO NOTHING;

-- 2. Create medicines table
CREATE TABLE IF NOT EXISTS medicines (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    generic_name VARCHAR(150),
    brand VARCHAR(150),
    manufacturer VARCHAR(150),
    category VARCHAR(100) REFERENCES categories(name) ON UPDATE CASCADE,
    dosage_form VARCHAR(100),
    strength VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    expiry_date DATE NOT NULL,
    batch_number VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(50) UNIQUE,
    total_spending DECIMAL(12, 2) DEFAULT 0.00,
    purchase_count INTEGER DEFAULT 0,
    last_purchase_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create sales table
CREATE TABLE IF NOT EXISTS sales (
    id VARCHAR(100) PRIMARY KEY,
    customer_id VARCHAR(100) REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(150),
    customer_phone VARCHAR(50),
    subtotal DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'Cash', 'bKash', 'Nagad', 'Card'
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create sale_items table
CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id VARCHAR(100) REFERENCES sales(id) ON DELETE CASCADE,
    medicine_id VARCHAR(100) REFERENCES medicines(id),
    name VARCHAR(150) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    item_total DECIMAL(10, 2) NOT NULL
);

-- 6. Create stock_logs table
CREATE TABLE IF NOT EXISTS stock_logs (
    id VARCHAR(100) PRIMARY KEY,
    medicine_id VARCHAR(100) REFERENCES medicines(id) ON DELETE CASCADE,
    medicine_name VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'Stock In', 'Stock Out'
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    remarks TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Setup index scans for high performance search
CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_medicines_generic ON medicines(generic_name);
CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category);
CREATE INDEX IF NOT EXISTS idx_medicines_expiry ON medicines(expiry_date);
CREATE INDEX IF NOT EXISTS idx_sales_timestamp ON sales(timestamp);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
