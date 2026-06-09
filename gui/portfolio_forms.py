import tkinter as tk
from tkinter import messagebox
from databases import db_manager


def open_add_holding_dialog(parent, refresh_callback):
    """Open a new window where the user can enter a new holding."""

    # Create a new top-level window
    dialog = tk.Toplevel(parent)
    dialog.title("Add Holding")
    dialog.geometry("250x180")

    # ---- Labels and Entry fields ----
    tk.Label(dialog, text="Ticker:").pack(pady=(10, 0))
    ticker_entry = tk.Entry(dialog)
    ticker_entry.pack()

    tk.Label(dialog, text="Quantity:").pack(pady=(5, 0))
    qty_entry = tk.Entry(dialog)
    qty_entry.pack()

    tk.Label(dialog, text="Buy Price (₹):").pack(pady=(5, 0))
    price_entry = tk.Entry(dialog)
    price_entry.pack()

    # ---- What happens when the user clicks "Add" ----
    def add_button_clicked():
        ticker = ticker_entry.get().strip()
        qty_str = qty_entry.get().strip()
        price_str = price_entry.get().strip()

        # Basic validation – try to convert to numbers
        if ticker == "":
            messagebox.showerror("Error", "Please enter a ticker.")
            return
        try:
            quantity = int(qty_str)
            buy_price = float(price_str)
        except ValueError:
            messagebox.showerror("Error", "Quantity and price must be numbers.")
            return

        if quantity <= 0 or buy_price <= 0:
            messagebox.showerror("Error", "Quantity and price must be positive.")
            return

        # Save to database
        db_manager.add_holding(ticker, quantity, buy_price)
        messagebox.showinfo("Success", "Holding added!")
        refresh_callback()  # Update the main table
        dialog.destroy()  # Close the pop-up

    # ---- Buttons ----
    btn_frame = tk.Frame(dialog)
    btn_frame.pack(pady=10)

    tk.Button(btn_frame, text="Add", command=add_button_clicked).pack(
        side=tk.LEFT, padx=5
    )
    tk.Button(btn_frame, text="Cancel", command=dialog.destroy).pack(
        side=tk.LEFT, padx=5
    )
