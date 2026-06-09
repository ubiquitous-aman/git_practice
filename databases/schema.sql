CREATE TABLE Investors (
    investor_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT
);

CREATE TABLE Assets (
    asset_id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT UNIQUE NOT NULL,
    company_name TEXT,
    sector TEXT
);

CREATE TABLE Holdings (
    holding_id INTEGER PRIMARY KEY AUTOINCREMENT,
    investor_id INTEGER NOT NULL,
    asset_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    buy_price REAL NOT NULL CHECK (buy_price > 0),
    FOREIGN KEY (investor_id) REFERENCES Investors (investor_id),
    FOREIGN KEY (asset_id) REFERENCES Assets (asset_id)
);

CREATE TABLE PriceHistory (
    price_id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,
    price_date DATE NOT NULL,
    close_price REAL NOT NULL,
    FOREIGN KEY (asset_id) REFERENCES Assets (asset_id),
    UNIQUE (asset_id, price_date)
);

-- Insert a default investor so we can start straight away
INSERT INTO
    Investors (investor_id, name, email)
VALUES (
        1,
        'Default Investor',
        'investor@example.com'
    );