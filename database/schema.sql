CREATE DATABASE IF NOT EXISTS inventory_supplier_system;
USE inventory_supplier_system;

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'staff', 'member') NOT NULL DEFAULT 'member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(100) NOT NULL,
  address TEXT,
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
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
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stock_quantity INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE supplier_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  supplier_id INT NOT NULL,
  item_id INT NOT NULL,
  supplier_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  lead_time_days INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_supplier_item (supplier_id, item_id),
  CONSTRAINT fk_supplier_items_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
  CONSTRAINT fk_supplier_items_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE purchase_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  supplier_id INT NOT NULL,
  status ENUM('Pending', 'Approved', 'Received') NOT NULL DEFAULT 'Pending',
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_purchase_orders_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE purchase_order_details (
  id INT PRIMARY KEY AUTO_INCREMENT,
  purchase_order_id INT NOT NULL,
  item_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  line_total DECIMAL(12, 2) NOT NULL,
  CONSTRAINT fk_purchase_order_details_order FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_purchase_order_details_item FOREIGN KEY (item_id) REFERENCES items(id)
);

CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  purchase_order_id INT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash',
  notes TEXT,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_order FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
);

CREATE TABLE stock_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  item_id INT NOT NULL,
  member_id INT NULL,
  transaction_type ENUM('PURCHASE_IN', 'ISSUE_TO_MEMBER', 'ADJUSTMENT') NOT NULL,
  quantity INT NOT NULL,
  reference_type VARCHAR(50),
  reference_id INT NULL,
  notes TEXT,
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_stock_transactions_item FOREIGN KEY (item_id) REFERENCES items(id),
  CONSTRAINT fk_stock_transactions_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
);

INSERT INTO users (username, password_hash, full_name, role) VALUES
('admin', '$2a$10$GP7MFImzhcrZgI97OAMxqecErjP2F1eiXi7ln//7mSbxs7bLOr3Ui', 'System Administrator', 'admin'),
('staff', '$2a$10$GP7MFImzhcrZgI97OAMxqecErjP2F1eiXi7ln//7mSbxs7bLOr3Ui', 'Inventory Staff', 'staff'),
('member', '$2a$10$GP7MFImzhcrZgI97OAMxqecErjP2F1eiXi7ln//7mSbxs7bLOr3Ui', 'Sample Member', 'member');

INSERT INTO members (name, phone, email, address, status) VALUES
('Alice Tan', '0901111111', 'alice@example.com', '12 Garden Street', 'Active'),
('Ben Wong', '0902222222', 'ben@example.com', '78 River Road', 'Active');

INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES
('BlueLine Supply', 'Nina Park', '021234567', 'sales@blueline.test', '45 Industrial Ave'),
('Metro Traders', 'Omar Diaz', '028765432', 'contact@metro.test', '91 Warehouse Lane');

INSERT INTO items (name, category, price, stock_quantity, reorder_level) VALUES
('A4 Paper Box', 'Office', 12.50, 80, 20),
('Blue Pen Pack', 'Stationery', 5.75, 15, 20),
('Label Sticker Set', 'Office', 7.20, 25, 10);

INSERT INTO supplier_items (supplier_id, item_id, supplier_price, lead_time_days) VALUES
(1, 1, 10.50, 5),
(1, 2, 4.20, 3),
(2, 3, 5.90, 7);
