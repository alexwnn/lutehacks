from flask import Flask, jsonify
import os
from dotenv import load_dotenv
import requests

load_dotenv()

api_key = os.getenv("GOOGLE_MAPS_API_KEY")
api_url = "https://places.googleapis.com/v1/places:searchNearby"

METERS_PER_MILE = 1609.344

app = Flask(__name__)


@app.route("/get-places/lat/<lat>/lng/<lng>", methods=["GET"])
def get_places(lat, lng):
    lat_f = float(lat)
    lng_f = float(lng)

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location",
    }
    payload = {
        "includedTypes": ["restaurant"],
        "maxResultCount": 10,
        "locationRestriction": {
            "circle": {
                "center": {
                    "latitude": lat_f,
                    "longitude": lng_f,
                },
                "radius": 1610.0,  # 1 mile
            }
        },
    }
    places_resp = requests.post(api_url, headers=headers, json=payload)
    places_data = places_resp.json()
    places = places_data.get("places") or []

    if not places:
        return jsonify([])

    origin = f"{lat_f},{lng_f}"
    destinations = [
        f"{p['location']['latitude']},{p['location']['longitude']}" for p in places
    ]

    matrix_resp = requests.get(
        "https://maps.googleapis.com/maps/api/distancematrix/json",
        params={
            "origins": origin,
            "destinations": "|".join(destinations),
            "key": api_key,
            "mode": "walking",
            "units": "imperial",
        },
    )
    matrix = matrix_resp.json()

    if matrix.get("status") != "OK" or not matrix.get("rows"):
        return jsonify({"error": "Distance Matrix failed", "detail": matrix}), 502

    elements = matrix["rows"][0].get("elements") or []
    ret = []

    for place, el in zip(places, elements):
        name = place.get("displayName", {}).get("text", "")
        loc = place.get("location") or {}
        plat = loc.get("latitude")
        plng = loc.get("longitude")

        if el.get("status") != "OK":
            ret.append(
                {
                    "name": name,
                    "latitude": plat,
                    "longitude": plng,
                    "distanceMiles": None,
                    "durationText": None,
                    "durationSeconds": None,
                    "error": el.get("status"),
                }
            )
            continue

        dist_m = el["distance"]["value"]
        dur_s = el["duration"]["value"]

        ret.append(
            {
                "name": name,
                "latitude": plat,
                "longitude": plng,
                "distanceMiles": round(dist_m / METERS_PER_MILE, 2),
                "durationText": el["duration"]["text"],
                "durationSeconds": dur_s,
            }
        )
    print(ret)
    return jsonify(ret)


if __name__ == "__main__":
    app.run()
