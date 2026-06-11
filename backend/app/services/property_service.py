from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.property import PropertyProject
from app.models.amenity import Amenity
from geoalchemy2.functions import ST_DWithin, ST_AsText, ST_X, ST_Y

def get_properties(db: Session, skip: int = 0, limit: int = 50, district: str = None):
    query = db.query(PropertyProject)
    if district:
        query = query.filter(PropertyProject.district == district)
    
    properties = query.offset(skip).limit(limit).all()
    
    # Manually extract longitude and latitude from PostGIS geometry
    result = []
    for prop in properties:
        # We need to query the DB to extract X and Y if we didn't use ST_X/ST_Y in the query.
        # A more efficient way is to do it in the query, but for simplicity:
        lon, lat = db.query(ST_X(prop.location), ST_Y(prop.location)).first()
        prop_dict = {c.name: getattr(prop, c.name) for c.table.columns}
        prop_dict["longitude"] = lon
        prop_dict["latitude"] = lat
        result.append(prop_dict)
        
    return result

def get_property_with_amenities(db: Session, property_id: int, radius_meters: float = 1000):
    prop = db.query(PropertyProject).filter(PropertyProject.id == property_id).first()
    if not prop:
        return None
        
    # Get Lon/Lat
    lon, lat = db.query(ST_X(prop.location), ST_Y(prop.location)).first()
    prop_dict = {c.name: getattr(prop, c.name) for c.table.columns}
    prop_dict["longitude"] = lon
    prop_dict["latitude"] = lat
    
    # Use PostGIS ST_DWithin to find amenities within radius (using geography for meters)
    # Cast to geography for accurate meter-based distance calculation
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
        amenity_dict = {c.name: getattr(amenity, c.name) for c.table.columns}
        amenity_dict["longitude"] = a_lon
        amenity_dict["latitude"] = a_lat
        amenity_dict["distance_meters"] = float(distance)
        nearby_amenities.append(amenity_dict)
        
    prop_dict["nearby_amenities"] = nearby_amenities
    return prop_dict
