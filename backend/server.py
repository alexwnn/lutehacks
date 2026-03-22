from flask import Flask, jsonify
import os
from dotenv import load_dotenv
import requests

load_dotenv()

api_key = os.getenv("GOOGLE_MAPS_API_KEY")
api_url = "https://places.googleapis.com/v1/places:searchNearby"

METERS_PER_MILE = 1609.344
MIN_DISTANCE_MILES = 0.15
MAX_RESULTS = 20

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
        "includedTypes": [
            # Campus & landmarks
            "university",
            "library",
            "museum",
            "art_gallery",
            "performing_arts_theater",
            "stadium",
            "cultural_landmark",
            "historical_landmark",
            "monument",
            "visitor_center",
            "community_center",
            "park",
            "botanical_garden",
            "plaza",
            # Campus facilities
            "gym",
            "fitness_center",
            "swimming_pool",
            "sports_complex",
            # Food spots worth the walk
            "restaurant",
            "cafe",
            "bakery",
            "coffee_shop",
        ],
        "maxResultCount": 20,
        "locationRestriction": {
            "circle": {
                "center": {
                    "latitude": lat_f,
                    "longitude": lng_f,
                },
                "radius": 2414.0,  # 3 miles
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
            continue

        dist_m = el["distance"]["value"]
        dur_s = el["duration"]["value"]
        dist_miles = round(dist_m / METERS_PER_MILE, 2)

        if dist_miles < MIN_DISTANCE_MILES:
            continue

        ret.append(
            {
                "name": name,
                "latitude": plat,
                "longitude": plng,
                "distanceMiles": dist_miles,
                "durationText": el["duration"]["text"],
                "durationSeconds": dur_s,
            }
        )

    ret.sort(key=lambda p: p["distanceMiles"])
    ret = ret[:MAX_RESULTS]

    return jsonify(ret)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)