CREATE DATABASE IF NOT EXISTS inventory_supplier_system;
USE inventory_supplier_system;

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE departments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE units_of_measure (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  symbol VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recipients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NULL,
  department_id INT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(100) NOT NULL,
  address TEXT,
  recipient_type ENUM('person', 'department', 'organization') NOT NULL DEFAULT 'person',
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_recipients_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_recipients_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

CREATE TABLE suppliers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(100) NOT NULL,
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(80) NOT NULL,
  category_id INT NULL,
  unit_id INT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stock_quantity INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_items_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_items_unit FOREIGN KEY (unit_id) REFERENCES units_of_measure(id) ON DELETE SET NULL
);

CREATE TABLE supplier_catalog_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  supplier_id INT NOT NULL,
  item_id INT NOT NULL,
  supplier_sku VARCHAR(60),
  is_preferred BOOLEAN NOT NULL DEFAULT FALSE,
  supplier_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  lead_time_days INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_supplier_item (supplier_id, item_id),
  CONSTRAINT fk_supplier_catalog_items_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
  CONSTRAINT fk_supplier_catalog_items_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE purchase_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  supplier_id INT NOT NULL,
  created_by INT NULL,
  approved_by INT NULL,
  status ENUM('Pending', 'Approved', 'Received') NOT NULL DEFAULT 'Pending',
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  expected_delivery_date DATE NULL,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP NULL,
  received_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_purchase_orders_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  CONSTRAINT fk_purchase_orders_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_purchase_orders_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE purchase_order_lines (
  id INT PRIMARY KEY AUTO_INCREMENT,
  purchase_order_id INT NOT NULL,
  item_id INT NOT NULL,
  quantity INT NOT NULL,
  received_quantity INT NOT NULL DEFAULT 0,
  unit_price DECIMAL(10, 2) NOT NULL,
  line_total DECIMAL(12, 2) NOT NULL,
  remarks VARCHAR(255),
  CONSTRAINT fk_purchase_order_lines_order FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_purchase_order_lines_item FOREIGN KEY (item_id) REFERENCES items(id)
);

CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  purchase_order_id INT NOT NULL,
  paid_by INT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash',
  notes TEXT,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_order FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_payments_paid_by FOREIGN KEY (paid_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE stock_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  item_id INT NOT NULL,
  recipient_id INT NULL,
  created_by INT NULL,
  transaction_type ENUM('STOCK_RECEIPT', 'STOCK_ISSUE', 'ADJUSTMENT') NOT NULL,
  quantity INT NOT NULL,
  balance_after INT NULL,
  reference_type VARCHAR(50),
  reference_id INT NULL,
  notes TEXT,
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_stock_transactions_item FOREIGN KEY (item_id) REFERENCES items(id),
  CONSTRAINT fk_stock_transactions_recipient FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE SET NULL,
  CONSTRAINT fk_stock_transactions_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_recipients_department_id ON recipients(department_id);
CREATE INDEX idx_items_category_id ON items(category_id);
CREATE INDEX idx_items_unit_id ON items(unit_id);
CREATE INDEX idx_purchase_orders_supplier_status ON purchase_orders(supplier_id, status);
CREATE INDEX idx_purchase_orders_order_date ON purchase_orders(order_date);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_stock_transactions_item_date ON stock_transactions(item_id, transaction_date);
CREATE INDEX idx_stock_transactions_recipient_date ON stock_transactions(recipient_id, transaction_date);
CREATE INDEX idx_stock_transactions_type_date ON stock_transactions(transaction_type, transaction_date);

INSERT INTO users (username, password_hash, full_name, role) VALUES
('admin', '$2a$10$GP7MFImzhcrZgI97OAMxqecErjP2F1eiXi7ln//7mSbxs7bLOr3Ui', 'System Administrator', 'admin'),
('staff', '$2a$10$GP7MFImzhcrZgI97OAMxqecErjP2F1eiXi7ln//7mSbxs7bLOr3Ui', 'Inventory Staff', 'staff');

INSERT INTO departments (code, name) VALUES
('ADMIN', 'Administration'),
('LIB', 'Library'),
('IT', 'Information Technology');

INSERT INTO categories (code, name) VALUES
('OFF', 'Office Supplies'),
('STAT', 'Stationery'),
('ELEC', 'Electronics');

INSERT INTO units_of_measure (name, symbol) VALUES
('Piece', 'pc'),
('Box', 'box'),
('Pack', 'pack'),
('Ream', 'ream');

INSERT INTO recipients (department_id, name, phone, email, address, recipient_type, status) VALUES
(1, 'Alice Tan', '0901111111', 'alice@example.com', '12 Garden Street', 'person', 'Active'),
(2, 'Ben Wong', '0902222222', 'ben@example.com', '78 River Road', 'person', 'Active');

INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES
('BlueLine Supply', 'Nina Park', '021234567', 'sales@blueline.test', '45 Industrial Ave'),
('Metro Traders', 'Omar Diaz', '028765432', 'contact@metro.test', '91 Warehouse Lane');

INSERT INTO items (name, category, category_id, unit_id, price, stock_quantity, reorder_level) VALUES
('A4 Paper Box', 'Office Supplies', 1, 2, 12.50, 80, 20),
('Blue Pen Pack', 'Stationery', 2, 3, 5.75, 15, 20),
('Label Sticker Set', 'Office Supplies', 1, 3, 7.20, 25, 10);

INSERT INTO supplier_catalog_items (supplier_id, item_id, supplier_sku, is_preferred, supplier_price, lead_time_days) VALUES
(1, 1, 'BL-A4-001', TRUE, 10.50, 5),
(1, 2, 'BL-PEN-210', TRUE, 4.20, 3),
(2, 3, 'MT-LABEL-050', TRUE, 5.90, 7);
