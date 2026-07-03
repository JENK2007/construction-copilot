import pandas as pd
from sqlalchemy import create_engine, text
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.config import settings

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")

print("Reading ConstructionData.csv...")
df_wide = pd.read_csv(os.path.join(DATA_DIR, "ConstructionData.csv"))
print(f"Loaded {len(df_wide)} projects, {len(df_wide.columns)} columns")

print("Reading sampleProject.csv (bid item lookup)...")
df_lookup = pd.read_csv(os.path.join(DATA_DIR, "sampleProject.csv"))
print(f"Loaded {len(df_lookup)} bid item descriptions")

# Identify the known trailing columns vs. bid item code columns
KNOWN_COLS = ["project_number", "bid_total", "engineers_estimate", "bid_days", "start_date"]
bid_item_cols = [c for c in df_wide.columns if c not in KNOWN_COLS]
print(f"Identified {len(bid_item_cols)} bid item code columns")

# --- Table 1: construction_projects ---
projects = df_wide[KNOWN_COLS].copy()
projects["start_date"] = pd.to_datetime(projects["start_date"], format="%Y%m%d", errors="coerce")
print(f"\nSample project row:\n{projects.iloc[0]}")

# --- Table 2: bid_items (deduplicated lookup) ---
bid_items = df_lookup.drop_duplicates(subset=["Bid Item Number"]).copy()
bid_items = bid_items.rename(columns={
    "Bid Item Number": "bid_item_code",
    "Bid Item Category": "category",
    "Bid Item Description": "description",
    "UOM": "unit_of_measure",
})[["bid_item_code", "category", "description", "unit_of_measure"]]
print(f"\nDeduplicated bid items: {len(bid_items)} (from {len(df_lookup)} raw rows)")

# --- Table 3: project_bid_lines (melt wide -> long, drop zeros) ---
print("\nMelting wide format to long format (this may take a moment)...")
long_df = df_wide.melt(
    id_vars=["project_number"],
    value_vars=bid_item_cols,
    var_name="bid_item_code",
    value_name="quantity",
)
before = len(long_df)
long_df = long_df[long_df["quantity"].notna() & (long_df["quantity"] != 0)]
print(f"Long table: {before} cells -> {len(long_df)} non-zero rows")

# Save intermediate CSVs so we can inspect before loading to DB
projects.to_csv(os.path.join(DATA_DIR, "_clean_projects.csv"), index=False)
bid_items.to_csv(os.path.join(DATA_DIR, "_clean_bid_items.csv"), index=False)
long_df.to_csv(os.path.join(DATA_DIR, "_clean_bid_lines.csv"), index=False)

print("\nDone. Clean CSVs written to /data/_clean_*.csv for inspection.")
print(f"projects: {len(projects)} rows")
print(f"bid_items: {len(bid_items)} rows")
print(f"project_bid_lines: {len(long_df)} rows")
