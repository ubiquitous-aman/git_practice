import tkinter as tk
from tkinter import ttk, messagebox
from databases import db_manager
from gui.portfolio_forms import open_add_holding_dialog


def build_dashboard():
    """Create the main Tkinter window and return it."""

    root = tk.Tk()
    root.title("Investment Portfolio Analyzer – Phase 1")
    root.geometry("650x400")

    # ----- Holdings Table -----
    # Define the columns we want to show
    columns = ("id", "ticker", "quantity", "buy_price", "investment")
    tree = ttk.Treeview(root, columns=columns, show="headings")

    # Set column headings and widths
    tree.heading("id", text="ID")
    tree.column("id", width=40, anchor="center")

    tree.heading("ticker", text="Ticker")
    tree.column("ticker", width=100, anchor="center")

    tree.heading("quantity", text="Qty")
    tree.column("quantity", width=60, anchor="center")

    tree.heading("buy_price", text="Buy Price (₹)")
    tree.column("buy_price", width=100, anchor="center")

    tree.heading("investment", text="Investment (₹)")
    tree.column("investment", width=120, anchor="center")

    # Add a vertical scrollbar
    scrollbar = ttk.Scrollbar(root, orient=tk.VERTICAL, command=tree.yview)
    tree.configure(yscrollcommand=scrollbar.set)

    tree.pack(side=tk.TOP, fill=tk.BOTH, expand=True)
    scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

    # ----- Function to refresh the table -----
    def refresh_table():
        # Clear everything currently in the tree
        for row in tree.get_children():
            tree.delete(row)

        # Fetch all holdings from the database
        holdings = db_manager.get_all_holdings()

        # Insert each row
        for h in holdings:
            holding_id, ticker, quantity, buy_price = h
            investment = quantity * buy_price
            tree.insert(
                "",
                tk.END,
                values=(
                    holding_id,
                    ticker,
                    quantity,
                    f"{buy_price:.2f}",
                    f"{investment:.2f}",
                ),
            )

    # ----- Button actions -----
    def delete_selected():
        """Delete the holding that is currently selected."""
        selected = tree.selection()
        if not selected:
            messagebox.showwarning("No selection", "Please select a holding to delete.")
            return

        # Get the ID of the selected holding (first column value)
        item = tree.item(selected[0])
        holding_id = item["values"][0]

        # Confirm with the user
        confirm = messagebox.askyesno("Delete?", f"Delete holding #{holding_id}?")
        if confirm:
            db_manager.delete_holding(holding_id)
            refresh_table()

    # ----- Button panel at the bottom -----
    btn_frame = tk.Frame(root)
    btn_frame.pack(side=tk.BOTTOM, fill=tk.X, pady=5)

    tk.Button(
        btn_frame,
        text="Add Holding",
        command=lambda: open_add_holding_dialog(root, refresh_table),
    ).pack(side=tk.LEFT, padx=5)

    tk.Button(btn_frame, text="Delete Selected", command=delete_selected).pack(
        side=tk.LEFT, padx=5
    )

    tk.Button(btn_frame, text="Refresh", command=refresh_table).pack(
        side=tk.LEFT, padx=5
    )

    # Show the data when the app starts
    refresh_table()

    return root
