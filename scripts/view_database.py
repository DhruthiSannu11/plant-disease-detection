"""
Helper script to inspect local database contents (Users, Scan Records, Crop Locations).
Run: python scripts/view_database.py
"""

import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "plant_disease.db")

def inspect_db():
    if not os.path.exists(DB_PATH):
        print(f"[!] Database file not found at: {DB_PATH}")
        return

    print("=" * 85)
    print(f"[*] PLANT HEALTH AI - LOCAL DATABASE VIEWER ({DB_PATH})")
    print("=" * 85)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Inspect Users Table
    print("\n[1] REGISTERED USERS (Table: users)")
    print("-" * 85)
    try:
        users = cursor.execute("SELECT id, email, full_name, is_active, is_superuser, created_at FROM users").fetchall()
        if users:
            print(f"{'ID':<4} | {'Email':<25} | {'Full Name':<20} | {'Active':<6} | {'Created At'}")
            print("-" * 85)
            for u in users:
                print(f"{u[0]:<4} | {u[1]:<25} | {str(u[2] or 'N/A'):<20} | {str(bool(u[3])):<6} | {u[5]}")
        else:
            print("  (No users registered yet. Sign in via the frontend to create one!)")
    except Exception as e:
        print(f"  Error reading users: {e}")

    # 2. Inspect Scan Records Table
    print("\n[2] DIAGNOSTIC SCAN HISTORY (Table: scan_records)")
    print("-" * 85)
    try:
        scans = cursor.execute(
            "SELECT id, user_id, crop, disease_name, confidence, severity, created_at FROM scan_records ORDER BY id DESC LIMIT 10"
        ).fetchall()
        if scans:
            print(f"{'ID':<4} | {'User ID':<8} | {'Crop':<12} | {'Disease Name':<25} | {'Confidence':<10} | {'Severity':<10} | {'Date'}")
            print("-" * 85)
            for s in scans:
                conf_str = f"{(s[4] * 100):.1f}%" if s[4] else "N/A"
                print(f"{s[0]:<4} | {str(s[1] or 'Guest'):<8} | {s[2]:<12} | {s[3]:<25} | {conf_str:<10} | {s[5]:<10} | {s[6]}")
        else:
            print("  (No scan records logged yet.)")
    except Exception as e:
        print(f"  Error reading scans: {e}")

    # 3. Inspect Crop Locations
    print("\n[3] OUTBREAK GEOLOCATIONS (Table: crop_locations)")
    print("-" * 85)
    try:
        locs = cursor.execute("SELECT id, scan_id, crop, disease_name, latitude, longitude FROM crop_locations LIMIT 10").fetchall()
        if locs:
            print(f"{'ID':<4} | {'Scan ID':<8} | {'Crop':<12} | {'Disease':<25} | {'Coordinates'}")
            print("-" * 85)
            for l in locs:
                print(f"{l[0]:<4} | {str(l[1]):<8} | {l[2]:<12} | {l[3]:<25} | [{l[4]}, {l[5]}]")
        else:
            print("  (No outbreak GPS coordinates logged yet.)")
    except Exception as e:
        print(f"  Error reading locations: {e}")

    print("\n" + "=" * 85)
    conn.close()

if __name__ == "__main__":
    inspect_db()
