// Core domain types for SahakarVaani

export type UserRole = 'customer' | 'worker' | 'coop_admin' | 'federation_admin';
export type Language = 'en' | 'ta';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type BookingStatus = 
  | 'requested' 
  | 'matched' 
  | 'accepted' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled'
  | 'declined';

export type UrgencyLevel = 'normal' | 'urgent' | 'emergency';
export type PaymentStatus = 'pending' | 'simulated_paid' | 'failed';
export type WelfareClaimStatus = 'submitted' | 'under_review' | 'approved' | 'rejected';
export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'closed';

// ── Auth ────────────────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  preferred_language: Language;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  preferred_language: Language;
  is_active: boolean;
  created_at: string;
}

// ── Cooperative ───────────────────────────────────────────────────────────────
export interface Cooperative {
  id: number;
  name: string;
  registration_number: string;
  city: string;
  state: string;
  commission_rate: number;  // 0–1 (e.g. 0.10 = 10%)
  welfare_rate: number;     // 0–1 (e.g. 0.05 = 5%)
  is_active: boolean;
}

// ── Service Category ─────────────────────────────────────────────────────────
export interface ServiceCategory {
  id: number;
  name_en: string;
  name_ta: string;
  description_en: string;
  description_ta: string;
  icon: string;  // lucide icon name
  base_rate: number;  // INR per hour
}

// ── Worker Profile ────────────────────────────────────────────────────────────
export interface WorkerProfile {
  id: number;
  user_id: number;
  cooperative_id: number;
  cooperative_name?: string;
  full_name: string;
  phone: string;
  service_radius_km: number;
  location_city: string;
  location_lat?: number;
  location_lng?: number;
  verification_status: VerificationStatus;
  is_available: boolean;
  rating_avg: number;
  rating_count: number;
  skills: WorkerSkill[];
  completed_jobs: number;
  current_jobs: number;
  preferred_language: Language;
}

export interface WorkerSkill {
  id: number;
  service_category_id: number;
  service_category_name_en: string;
  service_category_name_ta: string;
  experience_years: number;
  certification_note?: string;
}

// ── Booking ──────────────────────────────────────────────────────────────────
export interface BookingCreateRequest {
  service_category_id: number;
  requested_date: string;         // ISO date
  time_window: string;            // e.g. "morning", "afternoon", "evening", "09:00-11:00"
  location_address: string;
  location_city: string;
  urgency: UrgencyLevel;
  notes?: string;
  voice_transcript?: string;
}

export interface Booking {
  id: number;
  reference: string;
  customer_id: number;
  customer_name: string;
  worker_id?: number;
  worker?: WorkerProfile;
  service_category_id: number;
  service_category_name_en: string;
  service_category_name_ta: string;
  requested_date: string;
  time_window: string;
  location_address: string;
  location_city: string;
  urgency: UrgencyLevel;
  status: BookingStatus;
  notes?: string;
  voice_transcript?: string;
  created_at: string;
  updated_at: string;
  invoice?: Invoice;
}

// ── Matching ─────────────────────────────────────────────────────────────────
export interface MatchCandidate {
  worker: WorkerProfile;
  score: number;
  score_breakdown: ScoreBreakdown;
  match_explanation: string;
  is_recommended: boolean;
}

export interface ScoreBreakdown {
  skill_score: number;
  distance_score: number;
  availability_score: number;
  reliability_score: number;
  fairness_score: number;
  total: number;
}

export interface MatchResult {
  booking_id: number;
  candidates: MatchCandidate[];
  algorithm: 'fairness_aware' | 'nearest_available';
  comparison?: AlgorithmComparison;
}

export interface AlgorithmComparison {
  fairness_aware_top: MatchCandidate;
  nearest_available_top: MatchCandidate;
  fairness_improvement: string;
  distance_trade_off_km: number;
}

// ── Invoice & Payments ────────────────────────────────────────────────────────
export interface Invoice {
  id: number;
  reference: string;
  booking_id: number;
  service_amount: number;
  commission_amount: number;
  welfare_amount: number;
  worker_payout: number;
  commission_rate: number;
  welfare_rate: number;
  payment_status: PaymentStatus;
  created_at: string;
  paid_at?: string;
}

// ── Ratings ──────────────────────────────────────────────────────────────────
export interface Rating {
  id: number;
  booking_id: number;
  from_user_id: number;
  to_user_id: number;
  score: number;          // 1–5
  comment?: string;
  created_at: string;
}

// ── Dispute / Complaint ───────────────────────────────────────────────────────
export interface Dispute {
  id: number;
  booking_id: number;
  raised_by_id: number;
  raised_by_name?: string;
  title: string;
  description: string;
  status: DisputeStatus;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

// ── Welfare Claim ─────────────────────────────────────────────────────────────
export interface WelfareClaim {
  id: number;
  worker_id: number;
  claim_type: string;
  description: string;
  amount_requested: number;
  status: WelfareClaimStatus;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export interface CoopMetrics {
  total_workers: number;
  verified_workers: number;
  active_bookings: number;
  completed_jobs: number;
  pending_disputes: number;
  total_earnings: number;
  total_cooperative_contribution: number;
  demand_by_category: CategoryDemand[];
  booking_trend: BookingTrend[];
  workload_distribution: WorkloadData[];
}

export interface CategoryDemand {
  category_en: string;
  category_ta: string;
  count: number;
}

export interface BookingTrend {
  date: string;
  bookings: number;
  completed: number;
}

export interface WorkloadData {
  worker_name: string;
  jobs_this_week: number;
  jobs_all_time: number;
}

// ── Demand Forecast ───────────────────────────────────────────────────────────
export interface ForecastPoint {
  period: string;
  category_en: string;
  category_ta: string;
  actual?: number;
  forecast: number;
  confidence_low: number;
  confidence_high: number;
  is_forecast: boolean;
}

// ── Voice Intent ──────────────────────────────────────────────────────────────
export interface VoiceIntent {
  intent: 'book_service' | 'check_status' | 'cancel_booking' | 'unknown';
  service_category?: string;
  requested_date?: string;
  time_window?: string;
  location?: string;
  urgency?: UrgencyLevel;
  confidence: number;
  missing_fields: string[];
  raw_transcript: string;
}

// ── Federation ────────────────────────────────────────────────────────────────
export interface FederationMetrics {
  cooperatives: CooperativeSummary[];
  totals: {
    total_workers: number;
    verified_workers: number;
    total_bookings: number;
    completed_bookings: number;
    total_earnings: number;
    unresolved_disputes: number;
  };
}

export interface CooperativeSummary {
  cooperative: Cooperative;
  workers: number;
  verified_workers: number;
  bookings: number;
  completed: number;
  earnings: number;
  disputes: number;
}

// ── Pagination ────────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// ── Audit Event ───────────────────────────────────────────────────────────────
export interface AuditEvent {
  id: number;
  actor_id: number;
  actor_name?: string;
  action: string;
  entity_type: string;
  entity_id: number;
  notes?: string;
  created_at: string;
}
