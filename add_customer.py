#!/usr/bin/env python3
"""
AK Netcafe - Customer Registration Script
Stores customer name and contact number into the SQLite database.

Usage:
  python3 add_customer.py                    # Interactive mode
  python3 add_customer.py "Name" "Number"    # Direct mode
  python3 add_customer.py --list             # List all customers
"""

import sqlite3
import sys
import os
from datetime import datetime

# Database path (same database used by the Node.js backend)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(SCRIPT_DIR, "backend", "database", "database.db")


def ensure_table(conn):
    """Create customers table if it doesn't exist."""
    conn.execute("""
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            contact_number TEXT NOT NULL,
            registered_at TEXT NOT NULL
        )
    """)
    conn.commit()


def add_customer(name, number):
    """Add a customer to the database."""
    conn = sqlite3.connect(DB_PATH)
    ensure_table(conn)

    registered_at = datetime.now().isoformat()
    conn.execute(
        "INSERT INTO customers (customer_name, contact_number, registered_at) VALUES (?, ?, ?)",
        (name, number, registered_at)
    )
    conn.commit()

    # Fetch the newly added customer
    cursor = conn.execute(
        "SELECT * FROM customers ORDER BY id DESC LIMIT 1"
    )
    customer = cursor.fetchone()
    conn.close()

    return customer


def list_customers():
    """List all registered customers."""
    conn = sqlite3.connect(DB_PATH)
    ensure_table(conn)

    cursor = conn.execute(
        "SELECT id, customer_name, contact_number, registered_at FROM customers ORDER BY registered_at DESC"
    )
    customers = cursor.fetchall()
    conn.close()

    return customers


def print_header():
    """Print script header."""
    print()
    print("=" * 50)
    print("   🏛️  AK Netcafe - Customer Registration")
    print("=" * 50)
    print()


def print_customer_table(customers):
    """Print customers in a formatted table."""
    if not customers:
        print("  No customers registered yet.\n")
        return

    print(f"  {'ID':<5} {'Name':<25} {'Contact':<15} {'Registered'}")
    print("  " + "-" * 70)
    for c in customers:
        reg_time = c[3][:19].replace("T", " ")
        print(f"  {c[0]:<5} {c[1]:<25} {c[2]:<15} {reg_time}")
    print(f"\n  Total: {len(customers)} customer(s)\n")


def interactive_mode():
    """Run in interactive mode - ask for name and number."""
    print_header()

    name = input("  👤 Customer Name    : ").strip()
    if not name:
        print("  ❌ Name cannot be empty.\n")
        return

    number = input("  📱 Contact Number   : ").strip()
    if not number:
        print("  ❌ Contact number cannot be empty.\n")
        return

    customer = add_customer(name, number)
    print()
    print(f"  ✅ Customer registered successfully!")
    print(f"     ID: {customer[0]}")
    print(f"     Name: {customer[1]}")
    print(f"     Contact: {customer[2]}")
    print()


def main():
    # Check if database directory exists
    db_dir = os.path.dirname(DB_PATH)
    if not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)

    if len(sys.argv) == 1:
        # Interactive mode
        interactive_mode()

    elif sys.argv[1] == "--list":
        # List all customers
        print_header()
        customers = list_customers()
        print_customer_table(customers)

    elif len(sys.argv) == 3:
        # Direct mode: python3 add_customer.py "Name" "Number"
        name = sys.argv[1].strip()
        number = sys.argv[2].strip()

        if not name or not number:
            print("  ❌ Name and contact number are required.\n")
            sys.exit(1)

        customer = add_customer(name, number)
        print_header()
        print(f"  ✅ Customer registered successfully!")
        print(f"     ID: {customer[0]}")
        print(f"     Name: {customer[1]}")
        print(f"     Contact: {customer[2]}")
        print()

    else:
        print("Usage:")
        print('  python3 add_customer.py                    # Interactive mode')
        print('  python3 add_customer.py "Name" "Number"    # Direct mode')
        print('  python3 add_customer.py --list             # List all customers')
        sys.exit(1)


if __name__ == "__main__":
    main()
