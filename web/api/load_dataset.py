import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# ── 1. Load both CSVs ──────────────────────────────────────────────────────────
print("Loading CSVs...")
wide_df = pd.read_csv("../data/ConstructionData.csv", low_memory=False)
lookup_df = pd.read_csv("../data/sampleProject.csv", low_memory=False)

print(f"Wide matrix shape: {wide_df.shape}")
print(f"Lookup rows: {len(lookup_df)}")

# ── 2. Identify the 4 metadata columns at the end ─────────────────────────────
META_COLS = ["bid_total", "engineers_estimate", "bid_days", "start_date"]

# The last 4 columns of the wide file are the project-level metadata
all_cols = list(wide_df.columns)
project_id_col = all_cols[0]           # first col = project_number
bid_item_cols = all_cols[1:-4]         # middle cols = bid item codes
meta_actual = all_cols[-4:]            # last 4 = metadata

print(f"Project ID column: {project_id_col}")
print(f"Metadata columns found: {meta_actual}")
print(f"Bid item columns: {len(bid_item_cols)}")

# Rename metadata columns to clean names
wide_df = wide_df.rename(columns={
    meta_actual[0]: "bid_total",
    meta_actual[1]: "engineers_estimate",
    meta_actual[2]: "bid_days",
    meta_actual[3]: "start_date_raw",
})

# ── 3. Extract project-level table ────────────────────────────────────────────
print("\nBuilding projects table...")
projects_df = wide_df[[project_id_col, "bid_total", "engineers_estimate",
                         "bid_days", "start_date_raw"]].copy()
projects_df = projects_df.rename(columns={project_id_col: "project_number"})

# Parse start_date from YYYYMMDD float
def parse_date(val):
    try:
        s = str(int(val))
        if len(s) == 8:
            return f"{s[:4]}-{s[4:6]}-{s[6:8]}"
        return None
    except:
        return None

projects_df["start_date"] = projects_df["start_date_raw"].apply(parse_date)
projects_df = projects_df.drop(columns=["start_date_raw"])
projects_df["bid_total"] = pd.to_numeric(projects_df["bid_total"], errors="coerce")
projects_df["engineers_estimate"] = pd.to_numeric(projects_df["engineers_estimate"], errors="coerce")
projects_df["bid_days"] = pd.to_numeric(projects_df["bid_days"], errors="coerce")

print(f"Projects: {len(projects_df)} rows")
print(projects_df.head(3))

# ── 4. Melt wide → long (drop zero-quantity rows) ─────────────────────────────
print("\nReshaping wide → long (this takes ~30 seconds)...")
long_df = wide_df[[project_id_col] + bid_item_cols].melt(
    id_vars=[project_id_col],
    var_name="bid_item_number",
    value_name="quantity"
)
long_df = long_df.rename(columns={project_id_col: "project_number"})
long_df["quantity"] = pd.to_numeric(long_df["quantity"], errors="coerce").fillna(0)

# Drop zero rows — keeps only actual line items used in each project
long_df = long_df[long_df["quantity"] > 0].copy()
print(f"Non-zero line items: {len(long_df)} rows (from {wide_df.shape[0] * len(bid_item_cols):,} total cells)")

# ── 5. Join with lookup for descriptions ──────────────────────────────────────
print("\nJoining with bid item descriptions...")
lookup_clean = lookup_df[["Bid Item Number", "Bid Item Description", "UOM"]].copy()
lookup_clean = lookup_clean.rename(columns={
    "Bid Item Number": "bid_item_number",
    "Bid Item Description": "bid_item_description",
    "UOM": "unit_of_measure"
})
lookup_clean["bid_item_number"] = lookup_clean["bid_item_number"].astype(str)
long_df["bid_item_number"] = long_df["bid_item_number"].astype(str)

long_df = long_df.merge(lookup_clean, on="bid_item_number", how="left")
print(f"Final long table: {len(long_df)} rows")
print(long_df.head(3))

# ── 6. Load into Postgres ──────────────────────────────────────────────────────
print("\nConnecting to Supabase Postgres...")
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Create tables
cur.execute("""
CREATE TABLE IF NOT EXISTS construction_projects (
    project_number      TEXT PRIMARY KEY,
    bid_total           NUMERIC,
    engineers_estimate  NUMERIC,
    bid_days            NUMERIC,
    start_date          DATE
);
""")

cur.execute("""
CREATE TABLE IF NOT EXISTS construction_line_items (
    id                  SERIAL PRIMARY KEY,
    project_number      TEXT REFERENCES construction_projects(project_number),
    bid_item_number     TEXT,
    bid_item_description TEXT,
    unit_of_measure     TEXT,
    quantity            NUMERIC
);
""")
conn.commit()
print("Tables created.")

# Insert projects
print("Inserting projects...")
project_rows = [
    (
        str(row.project_number),
        float(row.bid_total) if pd.notna(row.bid_total) else None,
        float(row.engineers_estimate) if pd.notna(row.engineers_estimate) else None,
        float(row.bid_days) if pd.notna(row.bid_days) else None,
        row.start_date if (row.start_date and str(row.start_date) != 'nan') else None,
    )
    for row in projects_df.itertuples()
]
execute_values(cur, """
    INSERT INTO construction_projects
        (project_number, bid_total, engineers_estimate, bid_days, start_date)
    VALUES %s
    ON CONFLICT (project_number) DO NOTHING
""", project_rows)
conn.commit()
print(f"Inserted {len(project_rows)} projects.")

# Insert line items in batches
print("Inserting line items (may take 1-2 minutes)...")
BATCH = 1000
line_rows = [
    (
        str(row.project_number),
        str(row.bid_item_number),
        str(row.bid_item_description) if pd.notna(row.bid_item_description) else None,
        str(row.unit_of_measure) if pd.notna(row.unit_of_measure) else None,
        float(row.quantity),
    )
    for row in long_df.itertuples()
]
for i in range(0, len(line_rows), BATCH):
    execute_values(cur, """
        INSERT INTO construction_line_items
            (project_number, bid_item_number, bid_item_description, unit_of_measure, quantity)
        VALUES %s
    """, line_rows[i:i+BATCH])
    conn.commit()
    if i % 10000 == 0:
        print(f"  ...{i:,} / {len(line_rows):,} rows inserted")

print(f"\nDone. {len(line_rows):,} line items loaded into Supabase.")
cur.close()
conn.close()