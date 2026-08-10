from databases import db_manager
from gui.dashboard import build_dashboard

# ---------- Step 1: Make sure the database and table exist ----------
db_manager.create_table()

# ---------- Step 2: Launch the Tkinter window ----------
app = build_dashboard()
app.mainloop()
