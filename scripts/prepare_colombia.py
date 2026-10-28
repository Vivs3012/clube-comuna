#!/usr/bin/env python3
"""Normalize the three downloaded Databricks Genie CSV exports for the dashboard."""
import csv
import json
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "data" / "colombia"


def read(name):
    with (INPUT / name).open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def number(value, integer=False):
    if value in (None, "", "NULL", "null"):
        return None
    result = float(value)
    return int(result) if integer else result


daily = read("daily-store-location-metrics.csv")
store_rows = read("stores-coverage.csv")
reason_rows = read("cancellations-by-reason.csv")
assert daily and store_rows and reason_rows, "All three Genie exports must contain rows."

daily = [r for r in daily if r.get("country", "").strip().casefold() == "colombia"]
dates = sorted({r["order_date"] for r in daily})
city_by_location = {}
for r in daily:
    city_by_location.setdefault(r["store_location_id"], r["city"].strip())

# Prefer active store coordinates; use the most common point when a location has
# multiple store rows. Coordinates are already supplied by the corporate export.
coord_counts = defaultdict(Counter)
active_store_counts = Counter()
coverage = []
for r in store_rows:
    if r.get("COUNTRY", "").strip().casefold() != "colombia":
        continue
    location_id = r.get("LOCATION_ID", "").strip()
    if not location_id or location_id not in city_by_location:
        continue
    city = city_by_location[location_id]
    lat = number(r.get("location_store_0"))
    lon = number(r.get("location_store_1"))
    active = r.get("store_status", "").strip().upper() == "ACTIVE"
    if lat is not None and lon is not None and -5.0 <= lat <= 14.0 and -82.0 <= lon <= -65.0:
        coord_counts[location_id][(lat, lon, active)] += 1
    if active:
        active_store_counts[location_id] += 1
    if active and r.get("coverage_area_type") == "MultiPolygon":
        try:
            geometry = json.loads(r["coverage_area_geojson"])
            if geometry.get("type") in ("Polygon", "MultiPolygon"):
                coverage.append({
                    "type": "Feature",
                    "properties": {"locationId": location_id, "city": city},
                    "geometry": geometry,
                })
        except (ValueError, TypeError):
            pass

location_meta = {}
for location_id, counts in coord_counts.items():
    # Active locations' coordinates are preferred over inactive duplicate rows.
    point = max(counts.items(), key=lambda item: (item[0][2], item[1]))[0]
    location_meta[location_id] = {
        "locationId": location_id,
        "city": city_by_location[location_id],
        "lat": point[0],
        "lon": point[1],
        "activeStores": active_store_counts[location_id],
        "label": f"{city_by_location[location_id]} · {location_id.split(';')[-2].replace('_', ' ').title()}",
    }

normalized_daily = []
for r in daily:
    location_id = r["store_location_id"]
    normalized_daily.append({
        "date": r["order_date"],
        "city": r["city"].strip(),
        "state": r.get("state", "").strip(),
        "locationId": location_id,
        "totalOrders": number(r.get("total_orders"), True) or 0,
        "validOrders": number(r.get("valid_orders"), True) or 0,
        "cancelledOrders": (number(r.get("status_cancelled_orders"), True) or 0) + (number(r.get("status_expired_orders"), True) or 0),
        "deliveredOrders": number(r.get("delivered_orders"), True) or 0,
        "inProgressOrders": number(r.get("in_progress_orders"), True) or 0,
        "lateOrders": number(r.get("late_orders_sla_35"), True) or 0,
        "deliveryCount": number(r.get("valid_orders_with_delivery_time"), True) or 0,
        "meanDelivery": number(r.get("avg_delivery_minutes")),
        # Retain row P90 for a one-day, one-location detail only. It is never
        # averaged across locations or dates by the client.
        "p90": number(r.get("p90_delivery_minutes")),
        "slaMinutes": number(r.get("sla_minutes")),
        "activeStoresWithOrders": number(r.get("active_stores_with_orders"), True),
        "location": location_meta.get(location_id),
    })

# Cancellation reason export exactly reconciles to the daily status counts in
# aggregate; keep reason rows separate so the client can filter by period/location.
reasons = []
for r in reason_rows:
    if r.get("order_status", "").upper() != "CANCELLED":
        continue
    location_id = r.get("store_location_id", "").strip()
    if location_id not in city_by_location:
        continue
    reasons.append({
        "date": r["ORDER_DATE"],
        "city": city_by_location[location_id],
        "locationId": location_id,
        "reason": r.get("CANCELLATION_REASON", "").strip() or "Sem motivo informado",
        "count": number(r.get("cancelled_orders"), True) or 0,
    })

output = {
    "source": "Databricks Genie CSV exports supplied by the user",
    "startDate": dates[0],
    "endDate": dates[-1],
    "cities": sorted({r["city"] for r in normalized_daily}),
    "daily": normalized_daily,
    "locations": list(location_meta.values()),
    "coverage": coverage,
    "cancellationReasons": reasons,
}
target = ROOT / "src" / "colombiaData.json"
target.write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"Wrote {target.relative_to(ROOT)}: {len(normalized_daily)} daily rows, {len(location_meta)} locations, {len(active_store_counts)} active-store location counts, {len(coverage)} coverage features, {len(reasons)} reason rows ({dates[0]} to {dates[-1]}).")
