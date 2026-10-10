"""Pydantic v1 schemas for request/response validation."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, validator


# ── Auth Schemas ──────────────────────────────────────────────────────────────
class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    role: str = "customer"
    preferred_language: str = "en"

    @validator("role")
    def validate_role(cls, v):
        allowed = ["customer", "worker", "coop_admin", "federation_admin"]
        if v not in allowed:
            raise ValueError(f"Role must be one of {allowed}")
        return v

    @validator("preferred_language")
    def validate_lang(cls, v):
        if v not in ["en", "ta"]:
            raise ValueError("Language must be 'en' or 'ta'")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str]
    role: str
    preferred_language: str
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True


class TokenWithUser(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ── Cooperative Schemas ───────────────────────────────────────────────────────
class CooperativeOut(BaseModel):
    id: int
    name: str
    registration_number: str
    city: str
    state: str
    commission_rate: float
    welfare_rate: float
    is_active: bool

    class Config:
        orm_mode = True


# ── Service Category Schemas ──────────────────────────────────────────────────
class ServiceCategoryOut(BaseModel):
    id: int
    name_en: str
    name_ta: str
    description_en: Optional[str]
    description_ta: Optional[str]
    icon: str
    base_rate: float
    is_active: bool

    class Config:
        orm_mode = True


# ── Worker Schemas ────────────────────────────────────────────────────────────
class WorkerSkillOut(BaseModel):
    id: int
    service_category_id: int
    service_category_name_en: Optional[str]
    service_category_name_ta: Optional[str]
    experience_years: float
    certification_note: Optional[str]

    class Config:
        orm_mode = True


class WorkerProfileCreate(BaseModel):
    cooperative_id: int
    service_radius_km: float = 10.0
    location_city: str
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    certification_notes: Optional[str] = None


class WorkerProfileUpdate(BaseModel):
    service_radius_km: Optional[float] = None
    location_city: Optional[str] = None
    is_available: Optional[bool] = None
    certification_notes: Optional[str] = None


class WorkerProfileOut(BaseModel):
    id: int
    user_id: int
    cooperative_id: int
    cooperative_name: Optional[str]
    full_name: Optional[str]
    phone: Optional[str]
    service_radius_km: float
    location_city: str
    location_lat: Optional[float]
    location_lng: Optional[float]
    verification_status: str
    is_available: bool
    rating_avg: float
    rating_count: int
    completed_jobs: int
    current_jobs: int
    preferred_language: Optional[str]
    skills: List[WorkerSkillOut] = []

    class Config:
        orm_mode = True


class WorkerSkillCreate(BaseModel):
    service_category_id: int
    experience_years: float = 1.0
    certification_note: Optional[str] = None


# ── Booking Schemas ───────────────────────────────────────────────────────────
class BookingCreate(BaseModel):
    service_category_id: int
    requested_date: str
    time_window: str
    location_address: str
    location_city: str
    urgency: str = "normal"
    notes: Optional[str] = None
    voice_transcript: Optional[str] = None
    service_hours: float = 1.0

    @validator("urgency")
    def validate_urgency(cls, v):
        if v not in ["normal", "urgent", "emergency"]:
            raise ValueError("Urgency must be normal, urgent, or emergency")
        return v


class BookingStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


class BookingOut(BaseModel):
    id: int
    reference: str
    customer_id: int
    customer_name: Optional[str]
    worker_id: Optional[int]
    service_category_id: int
    service_category_name_en: Optional[str]
    service_category_name_ta: Optional[str]
    requested_date: str
    time_window: str
    location_address: str
    location_city: str
    urgency: str
    status: str
    notes: Optional[str]
    voice_transcript: Optional[str]
    service_hours: float
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


# ── Matching Schemas ──────────────────────────────────────────────────────────
class ScoreBreakdown(BaseModel):
    skill_score: float
    distance_score: float
    availability_score: float
    reliability_score: float
    fairness_score: float
    total: float


class MatchCandidate(BaseModel):
    worker: WorkerProfileOut
    score: float
    score_breakdown: ScoreBreakdown
    match_explanation: str
    is_recommended: bool


class MatchResult(BaseModel):
    booking_id: int
    candidates: List[MatchCandidate]
    algorithm: str
    nearest_available_top: Optional[MatchCandidate]
    fairness_improvement_desc: Optional[str]


# ── Invoice Schemas ───────────────────────────────────────────────────────────
class InvoiceOut(BaseModel):
    id: int
    reference: str
    booking_id: int
    service_amount: float
    commission_rate: float
    welfare_rate: float
    commission_amount: float
    welfare_amount: float
    worker_payout: float
    payment_status: str
    created_at: datetime
    paid_at: Optional[datetime]

    class Config:
        orm_mode = True


class SimulatePaymentRequest(BaseModel):
    booking_id: int


# ── Rating Schemas ────────────────────────────────────────────────────────────
class RatingCreate(BaseModel):
    booking_id: int
    to_user_id: int
    score: int
    comment: Optional[str] = None

    @validator("score")
    def validate_score(cls, v):
        if not 1 <= v <= 5:
            raise ValueError("Score must be between 1 and 5")
        return v


class RatingOut(BaseModel):
    id: int
    booking_id: int
    from_user_id: int
    to_user_id: int
    score: int
    comment: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True


# ── Dispute Schemas ───────────────────────────────────────────────────────────
class DisputeCreate(BaseModel):
    booking_id: int
    title: str
    description: str


class DisputeUpdate(BaseModel):
    status: str
    resolution_notes: Optional[str] = None


class DisputeOut(BaseModel):
    id: int
    booking_id: int
    raised_by_id: int
    raised_by_name: Optional[str]
    title: str
    description: str
    status: str
    resolution_notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


# ── Welfare Schemas ───────────────────────────────────────────────────────────
class WelfareClaimCreate(BaseModel):
    claim_type: str
    description: str
    amount_requested: float


class WelfareClaimUpdate(BaseModel):
    status: str
    admin_notes: Optional[str] = None


class WelfareClaimOut(BaseModel):
    id: int
    worker_id: int
    claim_type: str
    description: str
    amount_requested: float
    status: str
    admin_notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


# ── Voice Intent Schemas ──────────────────────────────────────────────────────
class VoiceIntentRequest(BaseModel):
    transcript: str
    language: str = "en"


class VoiceIntentResponse(BaseModel):
    intent: str
    service_category: Optional[str]
    requested_date: Optional[str]
    time_window: Optional[str]
    location: Optional[str]
    urgency: str = "normal"
    confidence: float
    missing_fields: List[str]
    raw_transcript: str


# ── Analytics Schemas ─────────────────────────────────────────────────────────
class CategoryDemand(BaseModel):
    category_en: str
    category_ta: str
    count: int


class BookingTrend(BaseModel):
    date: str
    bookings: int
    completed: int


class WorkloadData(BaseModel):
    worker_name: str
    jobs_this_week: int
    jobs_all_time: int


class CoopMetrics(BaseModel):
    total_workers: int
    verified_workers: int
    active_bookings: int
    completed_jobs: int
    pending_disputes: int
    total_earnings: float
    total_cooperative_contribution: float
    demand_by_category: List[CategoryDemand]
    booking_trend: List[BookingTrend]
    workload_distribution: List[WorkloadData]


# ── Verification ──────────────────────────────────────────────────────────────
class VerifyWorkerRequest(BaseModel):
    status: str
    notes: Optional[str] = None

    @validator("status")
    def validate_status(cls, v):
        if v not in ["verified", "rejected", "pending"]:
            raise ValueError("Status must be verified, rejected, or pending")
        return v
