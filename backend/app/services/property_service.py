import math
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.property import PropertyProject
from app.models.amenity import Amenity

# geoalchemy2 spatial functions — optional; not installed = offline/mock mode
try:
    from geoalchemy2.functions import ST_DWithin, ST_AsText, ST_X, ST_Y
    _geo_available = True
except ImportError:
    _geo_available = False
    ST_DWithin = ST_AsText = ST_X = ST_Y = None

# --- Haversine Distance helper for mock spatial queries ---
def calculate_distance_meters(lon1, lat1, lon2, lat2):
    R = 6371000  # radius of Earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# --- High quality mock data fallback ---
MOCK_PROPERTIES = [
    {
        "id": 1,
        "name": "Marina One Residences",
        "project_type": "Condo",
        "district": "D01",
        "tenure": "99-year Leasehold",
        "completion_year": 2017,
        "developer": "M+S Pte Ltd",
        "total_units": 1042,
        "block_number": None,
        "fair_value_psf": 2450.0,
        "rental_yield_estimate": 4.8,
        "longitude": 103.8541,
        "latitude": 1.2771
    },
    {
        "id": 2,
        "name": "The Sail @ Marina Bay",
        "project_type": "Condo",
        "district": "D01",
        "tenure": "99-year Leasehold",
        "completion_year": 2008,
        "developer": "Glengary Pte Ltd",
        "total_units": 1111,
        "block_number": None,
        "fair_value_psf": 1950.0,
        "rental_yield_estimate": 4.2,
        "longitude": 103.8530,
        "latitude": 1.2805
    },
    {
        "id": 3,
        "name": "Reflections at Keppel Bay",
        "project_type": "Condo",
        "district": "D04",
        "tenure": "99-year Leasehold",
        "completion_year": 2011,
        "developer": "Keppel Land",
        "total_units": 1129,
        "block_number": None,
        "fair_value_psf": 1750.0,
        "rental_yield_estimate": 3.5,
        "longitude": 103.8090,
        "latitude": 1.2642
    }
]

MOCK_AMENITIES = [
    {
        "id": 1,
        "name": "Downtown MRT Station",
        "category": "MRT",
        "longitude": 103.8528,
        "latitude": 1.2783
    },
    {
        "id": 2,
        "name": "Marina Bay MRT Station",
        "category": "MRT",
        "longitude": 103.8545,
        "latitude": 1.2764
    },
    {
        "id": 3,
        "name": "Cantonment Primary School",
        "category": "Primary School",
        "longitude": 103.8402,
        "latitude": 1.2735
    },
    {
        "id": 4,
        "name": "Marina One The Heart",
        "category": "Mall",
        "longitude": 103.8541,
        "latitude": 1.2771
    }
]

def get_properties(db: Session, skip: int = 0, limit: int = 50, district: str = None):
    try:
        query = db.query(PropertyProject)
        if district:
            query = query.filter(PropertyProject.district == district)
        
        properties = query.offset(skip).limit(limit).all()
        
        # Manually extract longitude and latitude from PostGIS geometry
        result = []
        for prop in properties:
            lon, lat = db.query(ST_X(prop.location), ST_Y(prop.location)).first()
            prop_dict = {c.name: getattr(prop, c.name) for c in prop.__table__.columns}
            prop_dict["longitude"] = lon
            prop_dict["latitude"] = lat
            result.append(prop_dict)
            
        # If DB is empty, fall back to mock data
        if not result:
            raise Exception("Empty database")
        return result
    except Exception as e:
        print(f"get_properties database fallback triggered: {e}")
        # Apply filtering for mock data
        filtered = MOCK_PROPERTIES
        if district:
            filtered = [p for p in filtered if p["district"] == district]
        return filtered[skip : skip + limit]

def get_property_with_amenities(db: Session, property_id: int, radius_meters: float = 1000):
    try:
        prop = db.query(PropertyProject).filter(PropertyProject.id == property_id).first()
        if not prop:
            return None
            
        # Get Lon/Lat
        lon, lat = db.query(ST_X(prop.location), ST_Y(prop.location)).first()
        prop_dict = {c.name: getattr(prop, c.name) for c in prop.__table__.columns}
        prop_dict["longitude"] = lon
        prop_dict["latitude"] = lat
        
        # Use PostGIS ST_DWithin to find amenities within radius (using geography for meters)
        amenities_query = db.query(
            Amenity,
            func.ST_Distance(
                func.ST_GeographyFromText(func.ST_AsText(Amenity.location)),
                func.ST_GeographyFromText(func.ST_AsText(prop.location))
            ).label("distance_meters"),
            ST_X(Amenity.location).label("lon"),
            ST_Y(Amenity.location).label("lat")
        ).filter(
            ST_DWithin(
                func.ST_GeographyFromText(func.ST_AsText(Amenity.location)),
                func.ST_GeographyFromText(func.ST_AsText(prop.location)),
                radius_meters
            )
        ).all()
        
        nearby_amenities = []
        for amenity, distance, a_lon, a_lat in amenities_query:
            amenity_dict = {c.name: getattr(amenity, c.name) for c in amenity.__table__.columns}
            amenity_dict["longitude"] = a_lon
            amenity_dict["latitude"] = a_lat
            amenity_dict["distance_meters"] = float(distance)
            nearby_amenities.append(amenity_dict)
            
        prop_dict["nearby_amenities"] = nearby_amenities
        return prop_dict
    except Exception as e:
        print(f"get_property_with_amenities database fallback triggered: {e}")
        # Fallback to mock logic
        prop = next((p for p in MOCK_PROPERTIES if p["id"] == property_id), None)
        if not prop:
            return None
        
        # Copy to avoid mutation
        prop_dict = dict(prop)
        
        nearby_amenities = []
        for amenity in MOCK_AMENITIES:
            dist = calculate_distance_meters(
                prop_dict["longitude"], prop_dict["latitude"],
                amenity["longitude"], amenity["latitude"]
            )
            if dist <= radius_meters:
                amenity_copy = dict(amenity)
                amenity_copy["distance_meters"] = round(dist, 2)
                nearby_amenities.append(amenity_copy)
        
        # Sort by distance
        nearby_amenities.sort(key=lambda x: x["distance_meters"])
        prop_dict["nearby_amenities"] = nearby_amenities
        return prop_dict
