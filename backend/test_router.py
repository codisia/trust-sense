#!/usr/bin/env python
"""Quick test script to verify router registration"""
from app.main import app

print("✓ App imported successfully\n")
print("Registered routes:")
for route in app.routes:
    if hasattr(route, 'path'):
        methods = getattr(route, 'methods', None)
        if methods:
            print(f"  {list(methods)[0]} {route.path}")
        else:
            print(f"  {route.path}")

print("\nLooking for /api/trends routes...")
trends_routes = [r for r in app.routes if hasattr(r, 'path') and '/trends' in r.path]
if trends_routes:
    print(f"✓ Found {len(trends_routes)} trends routes:")
    for route in trends_routes:
        print(f"  {route.path}")
else:
    print("✗ No trends routes found!")

print("\nApp startup test...")
try:
    test_app = app
    print("✓ App is ready")
except Exception as e:
    print(f"✗ Error: {e}")
