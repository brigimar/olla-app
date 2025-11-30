import math
from app.db.supabase_client import supabase

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def producers_within_radius(lat, lon, radius_km=10.0):
    # fetch producers with lat/lon columns populated
    resp = supabase.table("profiles").select("id,display_name,lat,lon,rating").eq("role","productor").execute()
    if resp.error:
        raise Exception("Supabase error: " + str(resp.error))
    producers = resp.data or []
    out = []
    for p in producers:
        if p.get("lat") is None or p.get("lon") is None:
            continue
        dist = haversine_km(lat, lon, float(p["lat"]), float(p["lon"]))
        if dist <= radius_km:
            p_copy = dict(p)
            p_copy["distance_km"] = round(dist, 2)
            out.append(p_copy)
    # sort by distance
    out.sort(key=lambda x: x["distance_km"])
    return out
