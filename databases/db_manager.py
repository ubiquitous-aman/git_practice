import sqlite3

# The database file will be created in the same folder as this script
DB_PATH = "database/portfolio.db"  # You can change this if needed


def connect_db():
    """Connect to the SQLite database (creates the file if missing)."""
    conn = sqlite3.connect(DB_PATH)
    return conn


def create_table():
    """Create the holdings table if it doesn't exist yet."""
    conn = connect_db()
    cursor = conn.cursor()

    # SQL command to create the table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS holdings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticker TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            buy_price REAL NOT NULL
        )
    """)

    conn.commit()
    conn.close()


def add_holding(ticker, quantity, buy_price):
    """Insert a new holding into the database."""
    conn = connect_db()
    cursor = conn.cursor()

    # Use ? placeholders to avoid SQL injection
    cursor.execute(
        "INSERT INTO holdings (ticker, quantity, buy_price) VALUES (?, ?, ?)",
        (ticker.upper(), quantity, buy_price),
    )

    conn.commit()
    conn.close()


def get_all_holdings():
    """Return all rows from the holdings table as a list of tuples."""
    conn = connect_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id, ticker, quantity, buy_price FROM holdings ORDER BY id")
    rows = cursor.fetchall()  # Each row is a tuple: (id, ticker, quantity, buy_price)

    conn.close()
    return rows


def delete_holding(holding_id):
    """Delete a holding by its ID."""
    conn = connect_db()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM holdings WHERE id = ?", (holding_id,))

    conn.commit()
    conn.close()
