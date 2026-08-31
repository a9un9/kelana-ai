from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
import os
from pydantic import BaseModel
from services.trip_services import (
    calculate_daily_budget,
    get_trip_category,
    get_transportation
)
from database import init_db, SessionLocal
from models.trip import Trip
from models.user import User
from services.bedrock_service import get_ai_recommendation
from services.kb_service import ask_knowledge_base

load_dotenv()

init_db()

app = FastAPI()

# Register Bearer token security scheme so Swagger UI shows the Authorize button
security = HTTPBearer()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TripRequest(BaseModel):
    destination: str
    days: int
    budget: float
    travel_style: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UpdateProfileRequest(BaseModel):
    name: str
    email: str
    password: str | None = None

class KnowledgeQueryRequest(BaseModel):
    question: str

from services.auth_service import register, login, get_current_user, hash_password
from datetime import datetime

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


# POST /api/v1/auth/register
@app.post("/api/v1/auth/register")
def register_user(request: RegisterRequest):
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == request.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        user = register(db, request.name, request.email, request.password)
        return {
            "message": "User registered successfully",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email
            }
        }
    finally:
        db.close()


# POST /api/v1/auth/login
@app.post("/api/v1/auth/login")
def login_user(request: LoginRequest):
    db = SessionLocal()
    try:
        return login(db, request.email, request.password)
    finally:
        db.close()


# GET /api/v1/auth/me
@app.get("/api/v1/auth/me")
def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "created_at": user.created_at,
        "updated_at": user.updated_at
    }


# PUT /api/v1/auth/me
@app.put("/api/v1/auth/me")
def update_me(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_user)
):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == current_user.id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Check if email is already used by another user
        if request.email != user.email:
            existing = db.query(User).filter(User.email == request.email, User.id != user.id).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email is already in use by another account")
            user.email = request.email

        user.name = request.name
        if request.password and request.password.strip():
            user.password_hash = hash_password(request.password)

        user.updated_at = datetime.utcnow()
        user.updated_by = user.name

        db.commit()
        db.refresh(user)

        return {
            "message": "Profile updated successfully",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "created_at": user.created_at,
                "updated_at": user.updated_at
            }
        }
    finally:
        db.close()


# 3. POST /api/v1/trips
@app.post("/api/v1/trips")
def create_trip(
    request: TripRequest,
    user: User = Depends(get_current_user)
):
    daily_budget = calculate_daily_budget(
        request.budget,
        request.days
    )

    category = get_trip_category(
        request.budget
    )

    recommendation_transport = get_transportation(category)

    # save to PostgreSQL (AI recommendation generated separately via /generate)
    # ownership - backend sets this
    trip = Trip(
        user_id                  = user.id,
        destination              = request.destination,
        days                     = request.days,
        budget                   = request.budget,
        category                 = category,
        daily_budget             = daily_budget,
        travel_style             = request.travel_style,
        ai_recommendation        = None
    )

    db = SessionLocal()
    try:
        db.add(trip)
        db.commit()
        db.refresh(trip)
    finally:
        db.close()

    return {
        "id":                     trip.id,
        "destination":            request.destination,
        "days":                   request.days,
        "budget":                 request.budget,
        "travel_style":           request.travel_style,
        "daily_budget":           daily_budget,
        "category":               category,
        "recommendation_transport": recommendation_transport
    }

# GET /api/v1/trips
# Returns every saved trip.
@app.get("/api/v1/trips")
def list_trips(user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        trips = db.query(Trip).filter(Trip.user_id == user.id).all()
        return trips
    finally:
        db.close()


# GET /api/v1/trips/{trip_id}
# Returns a single trip by ID. Return 404 if not found, 403 if forbidden.
@app.get("/api/v1/trips/{trip_id}")
def get_trip(
    trip_id: int,
    user: User = Depends(get_current_user)
):
    db = SessionLocal()
    try:
        trip = db.query(Trip).filter(Trip.id == trip_id).first()

        if trip is None:
            raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")

        if trip.user_id != user.id:
            raise HTTPException(status_code=403, detail="Forbidden: You do not own this trip")

        return trip
    finally:
        db.close()

# DELETE /api/v1/trips/{trip_id}
@app.delete("/api/v1/trips/{trip_id}")
def delete_trip(
    trip_id: int,
    user: User = Depends(get_current_user)
):
    db = SessionLocal()
    try:
        trip = db.query(Trip).filter(Trip.id == trip_id).first()

        if trip is None:
            raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")

        if trip.user_id != user.id:
            raise HTTPException(status_code=403, detail="Forbidden: You do not own this trip")

        db.delete(trip)
        db.commit()

        return {"message": f"Trip with id {trip_id} deleted"}
    finally:
        db.close()

# POST /api/v1/trips/{trip_id}/generate
# Retrieve an existing trip, generate AI recommendation, save, and return it.
@app.post("/api/v1/trips/{trip_id}/generate")
def generate_trip_recommendation(
    trip_id: int,
    user: User = Depends(get_current_user)
):
    db = SessionLocal()
    try:
        trip = db.query(Trip).filter(Trip.id == trip_id).first()

        if trip is None:
            raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")

        if trip.user_id != user.id:
            raise HTTPException(status_code=403, detail="Forbidden: You do not own this trip")

        # Generate AI recommendation via Amazon Bedrock
        recommendation = get_ai_recommendation(
            destination=trip.destination,
            days=trip.days,
            budget=trip.budget,
            travel_style=trip.category,
        )

        # Save recommendation to PostgreSQL
        trip.ai_recommendation = recommendation
        db.commit()
        db.refresh(trip)

        return {
            "trip_id": trip.id,
            "destination": trip.destination,
            "recommendation": recommendation,
        }
    finally:
        db.close()


# PUT /api/v1/trips/{trip_id}
@app.put("/api/v1/trips/{trip_id}")
def update_trip(
    trip_id: int,
    request: TripRequest,
    user: User = Depends(get_current_user)
):
    db = SessionLocal()
    try:
        trip = db.query(Trip).filter(Trip.id == trip_id).first()

        if trip is None:
            raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")

        if trip.user_id != user.id:
            raise HTTPException(status_code=403, detail="Forbidden: You do not own this trip")

        trip.destination  = request.destination
        trip.budget       = request.budget
        trip.days         = request.days
        trip.daily_budget = calculate_daily_budget(request.budget, request.days)
        trip.category     = get_trip_category(request.budget)
        trip.travel_style = request.travel_style

        db.commit()
        db.refresh(trip)

        return trip
    finally:
        db.close()



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
    ]@app.get("/api/v1/transportations")
def get_transportations():
    return [
        "Bus",
        "Train",
        "Flight"
    ]


# ---------------------------------------------------------------------------
# Part 5 — Query the Knowledge Base
# ---------------------------------------------------------------------------

# POST /api/v1/knowledge/ask
# Uses RetrieveAndGenerate — Bedrock handles retrieval + generation in one call.
# Unlike InvokeModel (LLM only), this is RAG: documents are searched automatically.
@app.post("/api/v1/knowledge/ask")
def ask_knowledge(
    request: KnowledgeQueryRequest,
    user: User = Depends(get_current_user),
):
    try:
        result = ask_knowledge_base(request.question)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return {
        "question": request.question,
        "answer": result["answer"],
        "sources": result["sources"],
    }
