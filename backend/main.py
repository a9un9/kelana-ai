from fastapi import FastAPI
from pydantic import BaseModel
from services.trip_services import (
    calculate_daily_budget,
    get_trip_category,
    get_transportation
)

# print("==============================")
# print("KelanaAI")
# print("==============================")

# destination     = input("Destination : ")
# days            = int(input("Days       : "))
# budget          = float(input("Budget     : "))
# travel_month    = input("Travel Month: ")

# daily = calculate_daily_budget(budget, days)
# category = get_trip_category(budget)
# transportation = get_transportation(category)

# print()
# print(f"Destination : {destination}")
# print(f"Days        : {days}")
# print(f"Budget      : {budget:.0f} USD")
# print(f"Category    : {category}")
# print(f"Daily Budget: {daily:.0f} USD/Day")
# print(f"Travel Month: {travel_month}")

# if travel_month.lower() == "december":
#     season = "Peak Season"
# elif travel_month.lower() == "june":
#     season = "Holiday Season"
# else:
#     season = "Regular Season"

# print(f"Season      : {season}")

# print()
# print("Recommended Transportation")
# print(f"- {transportation}")

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

    return {
        "destination": request.destination,
        "days": request.days,
        "budget": request.budget,
        "travel_style": request.travel_style,
        "daily_budget": daily_budget,
        "category": category,
        "recommendation_transport": recommendation_transport
    }


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