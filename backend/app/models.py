"""SQLAlchemy ORM Models for SahakarVaani."""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Text, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(200), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    phone = Column(String(20))
    role = Column(SAEnum("customer", "worker", "coop_admin", "federation_admin", name="user_role"), nullable=False)
    preferred_language = Column(SAEnum("en", "ta", name="lang"), default="en")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Cooperative(Base):
    __tablename__ = "cooperatives"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    registration_number = Column(String(100), unique=True, nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    commission_rate = Column(Float, default=0.10)   # 10%
    welfare_rate = Column(Float, default=0.05)       # 5%
    is_active = Column(Boolean, default=True)
    workers = relationship("WorkerProfile", back_populates="cooperative")


class ServiceCategory(Base):
    __tablename__ = "service_categories"
    id = Column(Integer, primary_key=True, index=True)
    name_en = Column(String(100), nullable=False)
    name_ta = Column(String(200), nullable=False)
    description_en = Column(Text)
    description_ta = Column(Text)
    icon = Column(String(50), default="Wrench")
    base_rate = Column(Float, default=200.0)  # INR per hour
    is_active = Column(Boolean, default=True)


class WorkerProfile(Base):
    __tablename__ = "worker_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    cooperative_id = Column(Integer, ForeignKey("cooperatives.id"), nullable=False)
    service_radius_km = Column(Float, default=10.0)
    location_city = Column(String(100), nullable=False)
    location_lat = Column(Float)
    location_lng = Column(Float)
    verification_status = Column(
        SAEnum("pending", "verified", "rejected", name="verification_status"),
        default="pending"
    )
    is_available = Column(Boolean, default=True)
    rating_avg = Column(Float, default=0.0)
    rating_count = Column(Integer, default=0)
    completed_jobs = Column(Integer, default=0)
    current_jobs = Column(Integer, default=0)
    certification_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", foreign_keys=[user_id])
    cooperative = relationship("Cooperative", back_populates="workers")
    skills = relationship("WorkerSkill", back_populates="worker", cascade="all, delete-orphan")


class WorkerSkill(Base):
    __tablename__ = "worker_skills"
    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("worker_profiles.id"), nullable=False)
    service_category_id = Column(Integer, ForeignKey("service_categories.id"), nullable=False)
    experience_years = Column(Float, default=1.0)
    certification_note = Column(String(500))
    worker = relationship("WorkerProfile", back_populates="skills")
    service_category = relationship("ServiceCategory")


class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String(20), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    worker_id = Column(Integer, ForeignKey("worker_profiles.id"))
    service_category_id = Column(Integer, ForeignKey("service_categories.id"), nullable=False)
    requested_date = Column(String(20), nullable=False)
    time_window = Column(String(50), nullable=False)
    location_address = Column(Text, nullable=False)
    location_city = Column(String(100), nullable=False)
    urgency = Column(SAEnum("normal", "urgent", "emergency", name="urgency"), default="normal")
    status = Column(
        SAEnum("requested", "matched", "accepted", "in_progress", "completed", "cancelled", "declined", name="booking_status"),
        default="requested"
    )
    notes = Column(Text)
    voice_transcript = Column(Text)
    service_hours = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("User", foreign_keys=[customer_id])
    worker = relationship("WorkerProfile", foreign_keys=[worker_id])
    service_category = relationship("ServiceCategory")
    invoice = relationship("Invoice", back_populates="booking", uselist=False)


class MatchDecision(Base):
    __tablename__ = "match_decisions"
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    worker_id = Column(Integer, ForeignKey("worker_profiles.id"), nullable=False)
    score = Column(Float, nullable=False)
    skill_score = Column(Float, default=0)
    distance_score = Column(Float, default=0)
    availability_score = Column(Float, default=0)
    reliability_score = Column(Float, default=0)
    fairness_score = Column(Float, default=0)
    algorithm = Column(String(50), default="fairness_aware")
    created_at = Column(DateTime, default=datetime.utcnow)


class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String(20), unique=True, nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True, nullable=False)
    service_amount = Column(Float, nullable=False)
    commission_rate = Column(Float, nullable=False)
    welfare_rate = Column(Float, nullable=False)
    commission_amount = Column(Float, nullable=False)
    welfare_amount = Column(Float, nullable=False)
    worker_payout = Column(Float, nullable=False)
    payment_status = Column(
        SAEnum("pending", "simulated_paid", "failed", name="payment_status"),
        default="pending"
    )
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime)
    booking = relationship("Booking", back_populates="invoice")


class Rating(Base):
    __tablename__ = "ratings"
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    from_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    to_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Integer, nullable=False)   # 1–5
    comment = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class Dispute(Base):
    __tablename__ = "disputes"
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    raised_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(
        SAEnum("open", "under_review", "resolved", "closed", name="dispute_status"),
        default="open"
    )
    resolution_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    raised_by = relationship("User", foreign_keys=[raised_by_id])


class WelfareClaim(Base):
    __tablename__ = "welfare_claims"
    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("worker_profiles.id"), nullable=False)
    claim_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    amount_requested = Column(Float, nullable=False)
    status = Column(
        SAEnum("submitted", "under_review", "approved", "rejected", name="welfare_status"),
        default="submitted"
    )
    admin_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    worker = relationship("WorkerProfile")


class VoiceLog(Base):
    __tablename__ = "voice_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    raw_transcript = Column(Text)
    extracted_intent = Column(Text)  # JSON string
    booking_id = Column(Integer, ForeignKey("bookings.id"))
    language = Column(String(5), default="en")
    confidence = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditEvent(Base):
    __tablename__ = "audit_events"
    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
