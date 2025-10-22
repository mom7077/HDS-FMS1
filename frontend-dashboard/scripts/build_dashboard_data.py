#!/usr/bin/env python3
"""
Generate the dashboard data bundle from the NHS COPD datasets.

Usage:
    python scripts/build_dashboard_data.py

This reads `../Full_Data.csv` next to the project root and writes
`data/dashboard-data.js` with a `window.DASHBOARD_DATA` payload.
"""

from __future__ import annotations

import json
import math
import statistics
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parent.parent
SOURCE_CSV = ROOT.parent / "Full_Data.csv"
OUTPUT_PATH = ROOT / "data" / "dashboard-data.js"
WEATHER_LOOKUP_PATH = ROOT / "data" / "weather_lookup.json"


def safe_float(value: Any) -> Optional[float]:
  try:
    if value is None or (isinstance(value, float) and math.isnan(value)):
      return None
    return float(value)
  except (TypeError, ValueError):
    return None


def safe_int(value: Any) -> Optional[int]:
  try:
    if value is None or (isinstance(value, float) and math.isnan(value)):
      return None
    return int(float(value))
  except (TypeError, ValueError):
    return None


def format_postcode(postcode: Any) -> Optional[str]:
  if not isinstance(postcode, str):
    return None
  cleaned = postcode.strip().replace(" ", "").upper()
  if len(cleaned) < 4:
    return cleaned or None
  return f"{cleaned[:-3]} {cleaned[-3:]}"


def make_address(row: Dict[str, Any]) -> str:
  parts: List[str] = []
  for column in ["Address1", "Address2", "Address3", "Address4", "Address5"]:
    value = row.get(column)
    if isinstance(value, str):
      value = value.strip()
      if value and value.upper() != "NA":
        parts.append(value.title())
  return ", ".join(parts)


def load_weather_lookup() -> Dict[str, Any]:
  if not WEATHER_LOOKUP_PATH.exists():
    return {}
  try:
    data = json.loads(WEATHER_LOOKUP_PATH.read_text(encoding="utf-8"))
  except json.JSONDecodeError as exc:
    raise ValueError(f"Failed to parse weather lookup file: {WEATHER_LOOKUP_PATH}") from exc

  normalised: Dict[str, Any] = {}
  for key, value in data.items():
    if not isinstance(value, dict):
      continue
    normalised[key.upper()] = value
  return normalised


def build_gp_records(df: pd.DataFrame) -> List[Dict[str, Any]]:
  records: List[Dict[str, Any]] = []
  for row in df.to_dict("records"):
    lat = safe_float(row.get("Y"))
    lng = safe_float(row.get("X"))
    if lat is None or lng is None:
      continue

    achievement_pct = safe_float(row.get("Achievement_2021_22"))
    intervention_pct = safe_float(row.get("COPD008_Patients_receiving_Intervention_percentage"))
    review_pct = safe_float(row.get("COPD010_Patients_receiving_Intervention_percentage"))
    prevalence_pct = safe_float(row.get("Prevalence_2021_22"))
    register = safe_int(row.get("Register_2021_22"))
    list_size = safe_int(row.get("List_size_2021_22"))
    pca_rate = safe_float(row.get("PCA_Rate_2021_22"))

    rating = None
    if achievement_pct is not None:
      rating = max(0.0, min(5.0, achievement_pct / 20.0))

    record = {
      "id": row.get("Practice_code"),
      "name": row.get("Practice_name").title() if isinstance(row.get("Practice_name"), str) else row.get("Practice_name"),
      "practiceCode": row.get("Practice_code"),
      "postcode": format_postcode(row.get("Postcode")),
      "coordinates": {"lat": round(lat, 6), "lng": round(lng, 6)},
      "rating": rating,
      "achievementPercent": achievement_pct,
      "achievementScore": safe_float(row.get("Achievement_Score_2021_22")),
      "interventionPercent": intervention_pct,
      "reviewPercent": review_pct,
      "prevalencePercent": prevalence_pct,
      "register": register,
      "listSize": list_size,
      "pcaRate": pca_rate,
      "isNhs": True,
      "phone": row.get("TelNum").strip() if isinstance(row.get("TelNum"), str) else None,
      "address": make_address(row),
      "icbName": row.get("Integrated Care Board Name") or row.get("Sub_ICB_Loc_name"),
      "ccgName": row.get("CCG Name"),
      "regionName": row.get("NHSE Region Name") or row.get("Region Name"),
    }
    records.append(record)
  return records


def sample_area(records: List[Dict[str, Any]], prefix: str, label: str) -> Optional[Dict[str, Any]]:
  subset = [
    record for record in records
    if isinstance(record.get("postcode"), str)
    and record["postcode"].replace(" ", "").startswith(prefix)
  ]
  if not subset:
    return None
  lat = float(np.mean([rc["coordinates"]["lat"] for rc in subset]))
  lng = float(np.mean([rc["coordinates"]["lng"] for rc in subset]))
  return {
    "label": label,
    "coordinates": {"lat": round(lat, 6), "lng": round(lng, 6)},
  }


def build_patient_summary(records: List[Dict[str, Any]]) -> Dict[str, Any]:
  ec1_records = [
    record for record in records
    if isinstance(record.get("postcode"), str)
    and record["postcode"].replace(" ", "").startswith("EC1")
  ]
  with_achievement = [
    record for record in ec1_records if record.get("achievementPercent") is not None
  ]
  top_for_activity = sorted(
    with_achievement,
    key=lambda record: record["achievementPercent"],
    reverse=True,
  )[:7]

  activity_values = [round(record["achievementPercent"], 1) for record in top_for_activity]
  activity_labels = [record["name"] for record in top_for_activity]

  avg_register = statistics.mean([record["register"] for record in ec1_records if record.get("register")]) if ec1_records else None
  avg_intervention = statistics.mean(
    [record["interventionPercent"] for record in ec1_records if record.get("interventionPercent") is not None]
  ) if ec1_records else None
  avg_review = statistics.mean(
    [record["reviewPercent"] for record in ec1_records if record.get("reviewPercent") is not None]
  ) if ec1_records else None

  top_practice = max(with_achievement, key=lambda record: record["achievementPercent"]) if with_achievement else None

  return {
    "alias": "Central London COPD Cohort",
    "homePostcode": "EC1A 1BB",
    "summaryLabel": "Achievement % (Top EC1 Practices)",
    "activity": activity_values,
    "activityLabels": activity_labels,
    "averages": {
      "register": round(avg_register, 0) if avg_register is not None else None,
      "interventionPercent": round(avg_intervention, 1) if avg_intervention is not None else None,
      "reviewPercent": round(avg_review, 1) if avg_review is not None else None,
    },
    "topPractice": {
      "name": top_practice["name"] if top_practice else None,
      "achievementPercent": round(top_practice["achievementPercent"], 1) if top_practice and top_practice.get("achievementPercent") is not None else None,
      "register": top_practice.get("register") if top_practice else None,
      "prevalencePercent": round(top_practice["prevalencePercent"], 2) if top_practice and top_practice.get("prevalencePercent") is not None else None,
      "address": top_practice.get("address") if top_practice else None,
    },
  }


def build_payload(records: List[Dict[str, Any]]) -> Dict[str, Any]:
  sample_postcodes = {
    key: value
    for key, value in {
      "EC1A 1BB": sample_area(records, "EC1", "Central London (EC1)"),
      "SW1A 0AA": sample_area(records, "SW1", "Westminster (SW1)"),
      "M1 1AE": sample_area(records, "M1", "Manchester (M1)"),
    }.items()
    if value is not None
  }

  patient_summary = build_patient_summary(records)
  weather_today = {
    "temperatureC": 13,
    "humidity": 65,
    "aqi": 38,
    "condition": "Partly cloudy (demo)",
    "icon": "\u26c5",
    "advice": "Replace with local AQI and weather feed when available.",
  }

  demo_profile = {
    "name": "Tung",
    "age": 34,
    "avatarInitials": "TG",
    "location": "Shoreditch, London",
    "tagline": "",
  }

  weather_lookup = load_weather_lookup()

  return {
    "samplePostcodes": sample_postcodes,
    "patientSummary": patient_summary,
    "weatherToday": weather_today,
    "weatherLookup": weather_lookup,
    "gpLocations": records,
    "demoProfile": demo_profile,
  }


def main() -> None:
  if not SOURCE_CSV.exists():
    raise FileNotFoundError(f"Cannot find source CSV at {SOURCE_CSV}")

  df = pd.read_csv(SOURCE_CSV)
  records = build_gp_records(df)
  payload = build_payload(records)

  OUTPUT_PATH.write_text(
    "window.DASHBOARD_DATA = " + json.dumps(payload, indent=2) + "\n",
    encoding="utf-8",
  )
  print(f"Wrote {OUTPUT_PATH} with {len(records)} practices.")


if __name__ == "__main__":
  main()
