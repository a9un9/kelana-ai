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
from models.conversation import Conversation
from models.message import Message
from services.bedrock_service import (
    get_ai_recommendation,
    generate_conversation_reply,
)
from services.kb_service import ask_knowledge_base

from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse

load_dotenv()

init_db()

app = FastAPI(
    title="KelanaAI API",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

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

class CreateConversationRequest(BaseModel):
    title: str | None = None

class SendMessageRequest(BaseModel):
    content: str

class RenameConversationRequest(BaseModel):
    title: str

from services.auth_service import register, login, get_current_user, hash_password
from datetime import datetime

# Swagger UI & OpenAPI schema (support both /docs and /api/docs on Vercel)
@app.get("/docs", include_in_schema=False)
@app.get("/api/docs", include_in_schema=False)
@app.get("/api/py/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title=app.title + " - Swagger UI",
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
    )

@app.get("/openapi.json", include_in_schema=False)
@app.get("/api/openapi.json", include_in_schema=False)
@app.get("/api/py/openapi.json", include_in_schema=False)
async def custom_openapi():
    return JSONResponse(get_openapi(title=app.title, version=app.version, routes=app.routes))

# 1. GET / and /api
@app.get("/")
@app.get("/api")
def home():
    return {
        "message": "Welcome to KelanaAI"
    }


# 2. GET /health and /api/health
@app.get("/health")
@app.get("/api/health")
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


# ---------------------------------------------------------------------------
# Part 3 — Conversation APIs
# ---------------------------------------------------------------------------

# POST /api/v1/conversations
# Create a new conversation row and return its identifier.
@app.post("/api/v1/conversations", status_code=201)
def create_conversation(
    request: CreateConversationRequest | None = None,
    user: User = Depends(get_current_user),
):
    db = SessionLocal()
    try:
        title = request.title if (request and request.title) else None
        conversation = Conversation(
            user_id=user.id,
            title=title,
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

        return {
            "conversation_id": conversation.id
        }
    finally:
        db.close()


# GET /api/v1/conversations
# List previous conversations for the authenticated user.
@app.get("/api/v1/conversations")
def list_conversations(
    user: User = Depends(get_current_user),
):
    db = SessionLocal()
    try:
        conversations = (
            db.query(Conversation)
            .filter(Conversation.user_id == user.id)
            .order_by(Conversation.created_at.desc())
            .all()
        )
        return [
            {
                "id": c.id,
                "title": c.title,
                "created_at": c.created_at,
            }
            for c in conversations
        ]
    finally:
        db.close()


# PATCH /api/v1/conversations/{conversation_id}
# Rename a conversation
@app.patch("/api/v1/conversations/{conversation_id}")
def rename_conversation(
    conversation_id: int,
    request: RenameConversationRequest,
    user: User = Depends(get_current_user),
):
    if not request.title or not request.title.strip():
        raise HTTPException(status_code=400, detail="Conversation title cannot be empty")

    db = SessionLocal()
    try:
        conversation = (
            db.query(Conversation)
            .filter(Conversation.id == conversation_id)
            .first()
        )
        if conversation is None:
            raise HTTPException(
                status_code=404,
                detail=f"Conversation with id {conversation_id} not found",
            )

        if conversation.user_id != user.id:
            raise HTTPException(
                status_code=403,
                detail="Forbidden: You do not own this conversation",
            )

        conversation.title = request.title.strip()
        db.commit()
        db.refresh(conversation)

        return {
            "id": conversation.id,
            "title": conversation.title,
            "created_at": conversation.created_at,
        }
    finally:
        db.close()


# DELETE /api/v1/conversations/{conversation_id}
# Delete a conversation
@app.delete("/api/v1/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: int,
    user: User = Depends(get_current_user),
):
    db = SessionLocal()
    try:
        conversation = (
            db.query(Conversation)
            .filter(Conversation.id == conversation_id)
            .first()
        )
        if conversation is None:
            raise HTTPException(
                status_code=404,
                detail=f"Conversation with id {conversation_id} not found",
            )

        if conversation.user_id != user.id:
            raise HTTPException(
                status_code=403,
                detail="Forbidden: You do not own this conversation",
            )

        db.delete(conversation)
        db.commit()

        return {"message": f"Conversation with id {conversation_id} deleted"}
    finally:
        db.close()



# ---------------------------------------------------------------------------
# Part 4 — Send Message API
# ---------------------------------------------------------------------------

# POST /api/v1/conversations/{conversation_id}/messages
# Orchestration flow:
# 01 Receive user message
# 02 Save user message to database
# 03 Load previous messages from database
# 04 Build prompt/messages payload
# 05 Call Amazon Bedrock
# 06 Save AI response to database
# 07 Return response
@app.post("/api/v1/conversations/{conversation_id}/messages")
def send_conversation_message(
    conversation_id: int,
    request: SendMessageRequest,
    user: User = Depends(get_current_user),
):
    if not request.content or not request.content.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    db = SessionLocal()
    try:
        # Step 01: Verify conversation and ownership
        conversation = (
            db.query(Conversation)
            .filter(Conversation.id == conversation_id)
            .first()
        )
        if conversation is None:
            raise HTTPException(
                status_code=404,
                detail=f"Conversation with id {conversation_id} not found",
            )

        if conversation.user_id != user.id:
            raise HTTPException(
                status_code=403,
                detail="Forbidden: You do not own this conversation",
            )

        # Update conversation title if not set yet
        if not conversation.title:
            cleaned_title = request.content.strip()
            conversation.title = (
                cleaned_title[:47] + "..." if len(cleaned_title) > 50 else cleaned_title
            )

        # Step 02: Save user message
        user_message = Message(
            conversation_id=conversation.id,
            role="user",
            content=request.content.strip(),
        )
        db.add(user_message)
        db.commit()
        db.refresh(user_message)

        # Step 03: Load previous messages (ordered chronologically)
        all_messages = (
            db.query(Message)
            .filter(Message.conversation_id == conversation.id)
            .order_by(Message.created_at.asc())
            .all()
        )

        # Step 04: Build prompt
        formatted_messages = [
            {
                "role": m.role if m.role in ["user", "assistant"] else "user",
                "content": [{"text": m.content}],
            }
            for m in all_messages
        ]

        # Step 05: Call Amazon Bedrock
        try:
            ai_reply_text = generate_conversation_reply(formatted_messages)
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate AI response: {str(exc)}",
            )

        # Step 06: Save AI response
        ai_message = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=ai_reply_text,
        )
        db.add(ai_message)
        db.commit()
        db.refresh(ai_message)

        # Step 07: Return response
        return {
            "conversation_id": conversation.id,
            "role": ai_message.role,
            "content": ai_message.content,
            "created_at": ai_message.created_at,
        }
    finally:
        db.close()


# GET /api/v1/conversations/{conversation_id}/messages
# List all messages in a conversation
@app.get("/api/v1/conversations/{conversation_id}/messages")
def list_conversation_messages(
    conversation_id: int,
    user: User = Depends(get_current_user),
):
    db = SessionLocal()
    try:
        conversation = (
            db.query(Conversation)
            .filter(Conversation.id == conversation_id)
            .first()
        )
        if conversation is None:
            raise HTTPException(
                status_code=404,
                detail=f"Conversation with id {conversation_id} not found",
            )

        if conversation.user_id != user.id:
            raise HTTPException(
                status_code=403,
                detail="Forbidden: You do not own this conversation",
            )

        messages = (
            db.query(Message)
            .filter(Message.conversation_id == conversation.id)
            .order_by(Message.created_at.asc())
            .all()
        )

        return [
            {
                "id": m.id,
                "conversation_id": m.conversation_id,
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at,
            }
            for m in messages
        ]
    finally:
        db.close()


