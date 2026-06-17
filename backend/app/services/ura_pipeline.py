import math
import sys
import datetime
import os
import requests
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.property import PropertyProject, PropertyTransaction

# -----------------------------------------------------------------------------
# SVY21 Coordinate Conversion Math
# -----------------------------------------------------------------------------
class SVY21Converter:
    # WGS84 Datum
    a = 6378137.0
    f = 1.0 / 298.257223563

    # SVY21 Projection Reference Values (Singapore Central Origin)
    oLat = 1.366666  # Origin's lat in degrees
    oLon = 103.833333  # Origin's lon in degrees
    oN = 38744.572  # False Northing
    oE = 28001.642  # False Easting
    k = 1.0  # Scale factor

    def __init__(self):
        self.b = self.a * (1.0 - self.f)
        self.e2 = (2.0 * self.f) - (self.f * self.f)
        self.e4 = self.e2 * self.e2
        self.e6 = self.e4 * self.e2
        self.A0 = 1.0 - (self.e2 / 4.0) - (3.0 * self.e4 / 64.0) - (5.0 * self.e6 / 256.0)
        self.A2 = (3.0 / 8.0) * (self.e2 + (self.e4 / 4.0) + (15.0 * self.e6 / 128.0))
        self.A4 = (15.0 / 256.0) * (self.e4 + (3.0 * self.e6 / 4.0))
        self.A6 = 35.0 * self.e6 / 3072.0

    def calcM(self, lat: float) -> float:
        latR = lat * math.pi / 180.0
        return self.a * ((self.A0 * latR) - (self.A2 * math.sin(2.0 * latR)) + (self.A4 * math.sin(4.0 * latR)) - (self.A6 * math.sin(6.0 * latR)))

    def calcRho(self, sin2Lat: float) -> float:
        num = self.a * (1.0 - self.e2)
        denom = math.pow(1.0 - self.e2 * sin2Lat, 1.5)
        return num / denom

    def calcV(self, sin2Lat: float) -> float:
        poly = 1.0 - self.e2 * sin2Lat
        return self.a / math.sqrt(poly)

    def computeLatLon(self, N: float, E: float) -> Tuple[float, float]:
        Nprime = N - self.oN
        Mo = self.calcM(self.oLat)
        Mprime = Mo + (Nprime / self.k)
        n = (self.a - self.b) / (self.a + self.b)
        n2 = n * n
        n3 = n2 * n
        n4 = n2 * n2
        G = self.a * (1.0 - n) * (1.0 - n2) * (1.0 + (9.0 * n2 / 4.0) + (225.0 * n4 / 64.0)) * (math.pi / 180.0)
        sigma = (Mprime * math.pi) / (180.0 * G)

        latPrimeT1 = ((3.0 * n / 2.0) - (27.0 * n3 / 32.0)) * math.sin(2.0 * sigma)
        latPrimeT2 = ((21.0 * n2 / 16.0) - (55.0 * n4 / 32.0)) * math.sin(4.0 * sigma)
        latPrimeT3 = (151.0 * n3 / 96.0) * math.sin(6.0 * sigma)
        latPrimeT4 = (1097.0 * n4 / 512.0) * math.sin(8.0 * sigma)
        latPrime = sigma + latPrimeT1 + latPrimeT2 + latPrimeT3 + latPrimeT4

        sinLatPrime = math.sin(latPrime)
        sin2LatPrime = sinLatPrime * sinLatPrime

        rhoPrime = self.calcRho(sin2LatPrime)
        vPrime = self.calcV(sin2LatPrime)
        psiPrime = vPrime / rhoPrime
        psiPrime2 = psiPrime * psiPrime
        psiPrime3 = psiPrime2 * psiPrime
        psiPrime4 = psiPrime3 * psiPrime
        tPrime = math.tan(latPrime)
        tPrime2 = tPrime * tPrime
        tPrime4 = tPrime2 * tPrime2
        tPrime6 = tPrime4 * tPrime2
        Eprime = E - self.oE
        x = Eprime / (self.k * vPrime)
        x2 = x * x
        x3 = x2 * x
        x5 = x3 * x2
        x7 = x5 * x2

        # Compute Latitude
        latFactor = tPrime / (self.k * rhoPrime)
        latTerm1 = latFactor * ((Eprime * x) / 2.0)
        latTerm2 = latFactor * ((Eprime * x3) / 24.0) * ((-4.0 * psiPrime2) + (9.0 * psiPrime) * (1.0 - tPrime2) + (12.0 * tPrime2))
        latTerm3 = latFactor * ((Eprime * x5) / 720.0) * ((8.0 * psiPrime4) * (11.0 - 24.0 * tPrime2) - (12.0 * psiPrime3) * (21.0 - 71.0 * tPrime2) + (15.0 * psiPrime2) * (15.0 - 98.0 * tPrime2 + 15.0 * tPrime4) + (180.0 * psiPrime) * (5.0 * tPrime2 - 3.0 * tPrime4) + 360.0 * tPrime4)
        latTerm4 = latFactor * ((Eprime * x7) / 40320.0) * (1385.0 - 3633.0 * tPrime2 + 4095.0 * tPrime4 + 1575.0 * tPrime6)
        lat = latPrime - latTerm1 + latTerm2 - latTerm3 + latTerm4

        # Compute Longitude
        secLatPrime = 1.0 / math.cos(lat)
        lonTerm1 = x * secLatPrime
        lonTerm2 = ((x3 * secLatPrime) / 6.0) * (psiPrime + 2.0 * tPrime2)
        lonTerm3 = ((x5 * secLatPrime) / 120.0) * ((-4.0 * psiPrime3) * (1.0 - 6.0 * tPrime2) + psiPrime2 * (9.0 - 68.0 * tPrime2) + 72.0 * psiPrime * tPrime2 + 24.0 * tPrime4)
        lonTerm4 = ((x7 * secLatPrime) / 5040.0) * (61.0 + 662.0 * tPrime2 + 1320.0 * tPrime4 + 720.0 * tPrime6)
        lon = (self.oLon * math.pi / 180.0) + lonTerm1 - lonTerm2 + lonTerm3 - lonTerm4

        return (lat / (math.pi / 180.0), lon / (math.pi / 180.0))

# -----------------------------------------------------------------------------
# URA Real Ingestion or Mock Data Generator
# -----------------------------------------------------------------------------
MOCK_URA_PROJECTS = [
    {
        "project": "MARINA ONE RESIDENCES",
        "street": "MARINA WAY",
        "y": "28011.26",  # Northing
        "x": "29910.15",  # Easting
        "marketSegment": "CCR",
        "transactions": [
            {"area": "68", "price": "1650000", "contractDate": "1225", "propertyType": "Condominium", "tenure": "99 Yrs From 2011", "floorRange": "16-20", "typeOfSale": "Resale", "noOfUnits": "1", "district": "01", "typeOfArea": "Strata"},
            {"area": "104", "price": "2580000", "contractDate": "0126", "propertyType": "Condominium", "tenure": "99 Yrs From 2011", "floorRange": "21-25", "typeOfSale": "Resale", "noOfUnits": "1", "district": "01", "typeOfArea": "Strata"},
            {"area": "140", "price": "3450000", "contractDate": "0326", "propertyType": "Condominium", "tenure": "99 Yrs From 2011", "floorRange": "31-35", "typeOfSale": "Resale", "noOfUnits": "1", "district": "01", "typeOfArea": "Strata"},
            {"area": "70", "price": "1720000", "contractDate": "0526", "propertyType": "Condominium", "tenure": "99 Yrs From 2011", "floorRange": "11-15", "typeOfSale": "Resale", "noOfUnits": "1", "district": "01", "typeOfArea": "Strata"}
        ]
    },
    {
        "project": "THE SAIL @ MARINA BAY",
        "street": "MARINA BOULEVARD",
        "y": "28389.05",
        "x": "29790.35",
        "marketSegment": "CCR",
        "transactions": [
            {"area": "62", "price": "1200000", "contractDate": "1125", "propertyType": "Apartment", "tenure": "99 Yrs From 2002", "floorRange": "26-30", "typeOfSale": "Resale", "noOfUnits": "1", "district": "01", "typeOfArea": "Strata"},
            {"area": "87", "price": "1750000", "contractDate": "0226", "propertyType": "Apartment", "tenure": "99 Yrs From 2002", "floorRange": "36-40", "typeOfSale": "Resale", "noOfUnits": "1", "district": "01", "typeOfArea": "Strata"},
            {"area": "118", "price": "2300000", "contractDate": "0426", "propertyType": "Apartment", "tenure": "99 Yrs From 2002", "floorRange": "16-20", "typeOfSale": "Resale", "noOfUnits": "1", "district": "01", "typeOfArea": "Strata"}
        ]
    },
    {
        "project": "REFLECTIONS AT KEPPEL BAY",
        "street": "KEPPEL BAY VIEW",
        "y": "26573.12",
        "x": "24950.40",
        "marketSegment": "RCR",
        "transactions": [
            {"area": "78", "price": "1380000", "contractDate": "1225", "propertyType": "Condominium", "tenure": "99 Yrs From 2006", "floorRange": "06-10", "typeOfSale": "Resale", "noOfUnits": "1", "district": "04", "typeOfArea": "Strata"},
            {"area": "124", "price": "2150000", "contractDate": "0326", "propertyType": "Condominium", "tenure": "99 Yrs From 2006", "floorRange": "11-15", "typeOfSale": "Resale", "noOfUnits": "1", "district": "04", "typeOfArea": "Strata"},
            {"area": "150", "price": "2650000", "contractDate": "0526", "propertyType": "Condominium", "tenure": "99 Yrs From 2006", "floorRange": "21-25", "typeOfSale": "Resale", "noOfUnits": "1", "district": "04", "typeOfArea": "Strata"}
        ]
    },
    {
        "project": "PARC CLEMATIS",
        "street": "JALAN LEMPENG",
        "y": "32145.60",
        "x": "16245.90",
        "marketSegment": "OCR",
        "transactions": [
            {"area": "69", "price": "1150000", "contractDate": "0126", "propertyType": "Condominium", "tenure": "99 Yrs From 2019", "floorRange": "06-10", "typeOfSale": "New Sale", "noOfUnits": "1", "district": "05", "typeOfArea": "Strata"},
            {"area": "97", "price": "1680000", "contractDate": "0326", "propertyType": "Condominium", "tenure": "99 Yrs From 2019", "floorRange": "16-20", "typeOfSale": "New Sale", "noOfUnits": "1", "district": "05", "typeOfArea": "Strata"},
            {"area": "125", "price": "2100000", "contractDate": "0526", "propertyType": "Condominium", "tenure": "99 Yrs From 2019", "floorRange": "11-15", "typeOfSale": "New Sale", "noOfUnits": "1", "district": "05", "typeOfArea": "Strata"}
        ]
    }
]

# Simple pipeline metadata store (simulates DB config / sync auditing)
PIPELINE_METADATA = {
    "last_sync_timestamp": None,
    "status": "Healthy"
}

def sync_ura_data(db: Session, use_mock: bool = False) -> Dict[str, Any]:
    converter = SVY21Converter()
    new_projects_count = 0
    new_transactions_count = 0
    duplicates_count = 0
    errors = []

    # Decide if we connect to real API or fall back to mock data
    access_key = os.environ.get("URA_ACCESS_KEY")
    token = os.environ.get("URA_TOKEN")
    
    results = []
    if access_key and token and not use_mock:
        # Real API Sync logic
        try:
            # We would typically call the batch service: PMI_Resi_Transaction
            url = "https://www.ura.gov.sg/uraDataService/invokeUraDS?service=PMI_Resi_Transaction&batch=1"
            res = requests.post(url, headers={"AccessKey": access_key, "Token": token}, timeout=15)
            if res.ok:
                resp_json = res.json()
                if "Result" in resp_json:
                    results = resp_json["Result"]
                else:
                    errors.append(f"URA API error or empty result: {resp_json.get('Message', 'Unknown')}")
            else:
                errors.append(f"HTTP error connecting to URA: {res.status_code}")
        except Exception as e:
            errors.append(f"Failed to fetch URA API: {str(e)}")
            results = []
            
    # If API not configured or failed/requested mock: load mock data
    if not results:
        results = MOCK_URA_PROJECTS

    # Check database geoalchemy2 capabilities
    try:
        from geoalchemy2.elements import WKTElement
        # Verify if geoalchemy2 is mocked/disabled (like in unit tests with SQLite)
        if sys.modules.get('geoalchemy2') is None:
            has_geo = False
        else:
            has_geo = True
    except ImportError:
        has_geo = False

    # Process results
    for proj_data in results:
        try:
            raw_name = proj_data["project"]
            # Convert SVY21 coordinates to Lat/Lon
            x = float(proj_data["x"])
            y = float(proj_data["y"])
            lat, lon = converter.computeLatLon(y, x)

            # Look up or create Project
            proj_name = raw_name.strip().upper()
            project = db.query(PropertyProject).filter(func.lower(PropertyProject.name) == proj_name.lower()).first()

            if not project:
                # Format location column based on whether geoalchemy2 is actively running
                if has_geo:
                    location_geom = WKTElement(f"POINT({lon} {lat})", srid=4326)
                else:
                    location_geom = f"POINT({lon} {lat})"
                
                # Format district "01" -> "D01"
                tx_district = proj_data.get("transactions", [{}])[0].get("district", "01")
                if not tx_district.startswith("D"):
                    tx_district = f"D{tx_district.zfill(2)}"

                project = PropertyProject(
                    name=proj_name,
                    project_type="Condo",
                    district=tx_district,
                    tenure=proj_data.get("transactions", [{}])[0].get("tenure", "99-year Leasehold"),
                    completion_year=2020,
                    location=location_geom,
                    fair_value_psf=None,
                    rental_yield_estimate=None
                )
                db.add(project)
                db.flush()  # Populate project.id
                new_projects_count += 1

            # Ingest transactions
            transactions_list = proj_data.get("transactions", proj_data.get("transaction", []))
            for tx in transactions_list:
                area_sqm = float(tx["area"])
                price = float(tx["price"])
                contract_date = str(tx["contractDate"])
                floor_range = tx["floorRange"]
                prop_type = tx["propertyType"]
                tenure = tx["tenure"]
                type_of_sale = tx["typeOfSale"]
                no_of_units = int(tx.get("noOfUnits", 1))
                type_of_area = tx["typeOfArea"]
                nett_price = float(tx["nettPrice"]) if "nettPrice" in tx else None

                # Calculated fields
                area_sqft = area_sqm * 10.7639
                psf = price / area_sqft

                # Deduplication check: project_id, contract_date, price, area, floor_range
                existing_tx = db.query(PropertyTransaction).filter(
                    PropertyTransaction.project_id == project.id,
                    PropertyTransaction.contract_date == contract_date,
                    PropertyTransaction.price == price,
                    PropertyTransaction.area_sqm == area_sqm,
                    PropertyTransaction.floor_range == floor_range
                ).first()

                if existing_tx:
                    duplicates_count += 1
                    continue

                new_tx = PropertyTransaction(
                    project_id=project.id,
                    contract_date=contract_date,
                    price=price,
                    area_sqm=area_sqm,
                    area_sqft=area_sqft,
                    psf=psf,
                    property_type=prop_type,
                    tenure=tenure,
                    floor_range=floor_range,
                    type_of_sale=type_of_sale,
                    no_of_units=no_of_units,
                    type_of_area=type_of_area,
                    nett_price=nett_price
                )
                db.add(new_tx)
                new_transactions_count += 1

            db.flush()

            # Recalculate derived intelligence (Fair Value PSF as average of transactions)
            txs = db.query(PropertyTransaction.psf).filter(PropertyTransaction.project_id == project.id).all()
            if txs:
                avg_psf = sum(t[0] for t in txs) / len(txs)
                project.fair_value_psf = round(avg_psf, 2)
                
                # Estimate rental yield based on district segment (Mock ranges)
                segment = proj_data.get("marketSegment", "OCR")
                if segment == "CCR":
                    project.rental_yield_estimate = 3.5
                elif segment == "RCR":
                    project.rental_yield_estimate = 4.1
                else:
                    project.rental_yield_estimate = 4.6

        except Exception as e:
            errors.append(f"Error parsing project {proj_data.get('project', 'Unknown')}: {str(e)}")

    db.commit()

    PIPELINE_METADATA["last_sync_timestamp"] = datetime.datetime.utcnow().isoformat()
    return {
        "status": "Success" if not errors else "Partial Success",
        "new_projects_created": new_projects_count,
        "new_transactions_ingested": new_transactions_count,
        "duplicates_skipped": duplicates_count,
        "errors": errors
    }

def get_pipeline_status(db: Session) -> Dict[str, Any]:
    total_projects = db.query(PropertyProject).count()
    total_transactions = db.query(PropertyTransaction).count()
    return {
        "total_projects": total_projects,
        "total_transactions": total_transactions,
        "last_sync_timestamp": PIPELINE_METADATA["last_sync_timestamp"],
        "status": PIPELINE_METADATA["status"]
    }

def get_transactions(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    district: str = None,
    project_name: str = None,
    type_of_sale: str = None
) -> List[Dict[str, Any]]:
    query = db.query(
        PropertyTransaction,
        PropertyProject.name.label("project_name"),
        PropertyProject.district.label("district")
    ).join(PropertyProject, PropertyTransaction.project_id == PropertyProject.id)

    if district:
        query = query.filter(PropertyProject.district == district)
    if project_name:
        query = query.filter(PropertyProject.name.ilike(f"%{project_name}%"))
    if type_of_sale:
        query = query.filter(PropertyTransaction.type_of_sale == type_of_sale)

    results = query.order_by(PropertyTransaction.id.desc()).offset(skip).limit(limit).all()

    formatted_txs = []
    for tx, name, dist in results:
        formatted_txs.append({
            "id": tx.id,
            "project_id": tx.project_id,
            "project_name": name,
            "district": dist,
            "contract_date": tx.contract_date,
            "price": tx.price,
            "area_sqm": tx.area_sqm,
            "area_sqft": tx.area_sqft,
            "psf": tx.psf,
            "property_type": tx.property_type,
            "tenure": tx.tenure,
            "floor_range": tx.floor_range,
            "type_of_sale": tx.type_of_sale,
            "no_of_units": tx.no_of_units,
            "type_of_area": tx.type_of_area,
            "nett_price": tx.nett_price
        })
    return formatted_txs
