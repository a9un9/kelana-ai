from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from services.trip_services import (
    calculate_daily_budget,
    get_trip_category,
    get_transportation
)
from database import init_db, SessionLocal
from models.trip import Trip

init_db()

app = FastAPI()

class TripRequest(BaseModel):
    destination: str
    days: int
    budget: float
    travel_style: str


# 1. GET /
@app.get("/")
def home():
    return {
        "message": "Welcome to KelanaAI"
    }


# 2. GET /health
@app.get("/health")
def health():
    return {
        "status": "ok"
    }



# 3. POST /api/v1/trips
@app.post("/api/v1/trips")
def create_trip(request: TripRequest):
    daily_budget = calculate_daily_budget(
        request.budget,
        request.days
    )

    category = get_trip_category(
        request.budget
    )

    recommendation_transport = "train"

    # save to PostgreSQL
    trip = Trip(
        destination              = request.destination,
        days                     = request.days,
        budget                   = request.budget,
        category                 = category,
        daily_budget             = daily_budget,
    )

    db = SessionLocal()
    db.add(trip)
    db.commit()
    db.refresh(trip)
    db.close()

    return {
        "destination": request.destination,
        "days": request.days,
        "budget": request.budget,
        "travel_style": request.travel_style,
        "daily_budget": daily_budget,
        "category": category,
        "recommendation_transport": recommendation_transport
    }

# GET /api/v1/trips
# Returns every saved trip.
@app.get("/api/v1/trips")
def list_trips():
    db = SessionLocal()
    trips = db.query(Trip).all()
    db.close()
    return trips

# GET /api/v1/trips/{trip_id}
# Returns a single trip by ID. Return 404 if not found.
@app.get("/api/v1/trips/{trip_id}")
def get_trip(trip_id: int):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    db.close()

    if trip is None:
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")

    return trip

# DELETE /api/v1/trips/{trip_id}
@app.delete("/api/v1/trips/{trip_id}")
def delete_trip(trip_id: int):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id).first()

    if trip is None:
        db.close()
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")

    db.delete(trip)
    db.commit()
    db.close()

    return {"message": f"Trip with id {trip_id} deleted"}

# PUT /api/v1/trips/{trip_id}
@app.put("/api/v1/trips/{trip_id}")
def update_trip(trip_id: int, request: TripRequest):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id).first()

    if trip is None:
        db.close()
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")

    trip.destination  = request.destination
    trip.budget       = request.budget
    trip.days         = request.days
    trip.daily_budget = calculate_daily_budget(request.budget, request.days)
    trip.category     = get_trip_category(request.budget)

    db.commit()
    db.refresh(trip)
    db.close()

    return trip



# 4. GET /api/v1/trip-categories
@app.get("/api/v1/trip-categories")
def get_trip_categories():
    return [
        "Backpacker",
        "Standard",
        "Luxury"
    ]

@app.get("/api/v1/recommendations")
def get_recommendations():
    return [
        "Tokyo Tower",
        "Mount Fuji",
        "Shibuya"
    ]

@app.get("/api/v1/transportations")
def get_transportations():
    return [
        "Bus",
        "Train",
        "Flight"
    ]