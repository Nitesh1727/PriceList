CREATE TABLE IF NOT EXISTS pricelist (
    id SERIAL PRIMARY KEY,
    article_no VARCHAR(50) NOT NULL,
    product_service VARCHAR(255) NOT NULL,
    in_price DECIMAL(10,2) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50),
    in_stock INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
