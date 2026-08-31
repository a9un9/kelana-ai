// ─── Trip Types ────────────────────────────────────────────────────────────────

export type TripCategory = "Backpacker" | "Standard" | "Luxury";

/** Shape returned by POST /api/v1/trips */
export type TripResult = {
  id: number;
  destination: string;
  days: number;
  budget: number;
  travel_style: string;
  daily_budget: number;
  category: TripCategory;
  recommendation_transport: string;
};

/** Shape returned by GET /api/v1/trips and GET /api/v1/trips/:id */
export type Trip = {
  id: number;
  destination: string;
  days: number;
  budget: number;
  category: TripCategory;
  daily_budget: number;
  travel_style: string;
  ai_recommendation: string | null;
  created_at: string;
};

/** Shape returned by POST /api/v1/trips/:id/generate */
export type GenerateResult = {
  trip_id: number;
  destination: string;
  recommendation: string;
};

/** Request body for POST /api/v1/trips */
export type TripRequest = {
  destination: string;
  days: number;
  budget: number;
  travel_style: string;
};

/** Request/response for POST /api/v1/knowledge/ask */
export type KnowledgeAskRequest = {
  question: string;
};

export type KnowledgeAskResponse = {
  question: string;
  answer: string;
};
