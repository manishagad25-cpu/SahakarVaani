"""
SahakarVaani Backend — Flask API Server
Pure Python, no Rust/C compilation needed.
Uses SQLite with the built-in sqlite3 module.
"""
import sys
import io
# Fix Windows cp1252 stdout for emoji/Unicode in print()
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
else:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import json
import os
import sqlite3
import hashlib
import hmac
import secrets
import time
from datetime import datetime, date, timedelta
from functools import wraps
from flask import Flask, request, jsonify, g
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"])

DATABASE = os.path.join(os.path.dirname(__file__), "sahakarvaani.db")
SECRET_KEY = os.getenv("SECRET_KEY", "sahakarvaani-dev-secret-2024")


# ── DB helpers ────────────────────────────────────────────────────────────────
def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE, detect_types=sqlite3.PARSE_DECLTYPES)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(e=None):
    db = g.pop("db", None)
    if db:
        db.close()


def query(sql, args=(), one=False):
    cur = get_db().execute(sql, args)
    rv = cur.fetchall()
    return (dict(rv[0]) if rv else None) if one else [dict(r) for r in rv]


def execute(sql, args=()):
    db = get_db()
    cur = db.execute(sql, args)
    db.commit()
    return cur.lastrowid


# ── Auth helpers ──────────────────────────────────────────────────────────────
def hash_password(pw: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.sha256((salt + pw + SECRET_KEY).encode()).hexdigest()
    return f"{salt}:{h}"


def verify_password(pw: str, stored: str) -> bool:
    try:
        salt, h = stored.split(":")
        return hmac.compare_digest(h, hashlib.sha256((salt + pw + SECRET_KEY).encode()).hexdigest())
    except Exception:
        return False


def make_token(user_id: int, role: str) -> str:
    payload = f"{user_id}:{role}:{int(time.time()) + 86400}"
    sig = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    raw = f"{payload}:{sig}"
    import base64
    return base64.b64encode(raw.encode()).decode()


def decode_token(token: str):
    try:
        import base64
        raw = base64.b64decode(token.encode()).decode()
        parts = raw.split(":")
        user_id, role, exp, sig = parts[0], parts[1], int(parts[2]), parts[3]
        if int(time.time()) > exp:
            return None, None
        payload = f"{user_id}:{role}:{exp}"
        expected = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None, None
        return int(user_id), role
    except Exception:
        return None, None


def require_auth(roles=None):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            auth = request.headers.get("Authorization", "")
            if not auth.startswith("Bearer "):
                return jsonify({"error": "Unauthorized"}), 401
            token = auth[7:]
            user_id, role = decode_token(token)
            if not user_id:
                return jsonify({"error": "Invalid or expired token"}), 401
            if roles and role not in roles:
                return jsonify({"error": f"Access denied. Required: {roles}"}), 403
            g.current_user_id = user_id
            g.current_user_role = role
            return f(*args, **kwargs)
        return decorated
    return decorator


# ── DB Init ───────────────────────────────────────────────────────────────────
def init_db():
    with app.app_context():
        db = get_db()
        db.executescript("""
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            phone TEXT,
            role TEXT NOT NULL DEFAULT 'customer',
            preferred_language TEXT DEFAULT 'en',
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS cooperatives (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            registration_number TEXT UNIQUE NOT NULL,
            city TEXT NOT NULL,
            state TEXT NOT NULL,
            commission_rate REAL DEFAULT 0.10,
            welfare_rate REAL DEFAULT 0.05,
            is_active INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS service_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name_en TEXT NOT NULL,
            name_ta TEXT NOT NULL,
            description_en TEXT,
            description_ta TEXT,
            icon TEXT DEFAULT 'Wrench',
            base_rate REAL DEFAULT 200.0,
            is_active INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS worker_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
            cooperative_id INTEGER NOT NULL REFERENCES cooperatives(id),
            service_radius_km REAL DEFAULT 10.0,
            location_city TEXT NOT NULL,
            location_lat REAL,
            location_lng REAL,
            verification_status TEXT DEFAULT 'pending',
            is_available INTEGER DEFAULT 1,
            rating_avg REAL DEFAULT 0.0,
            rating_count INTEGER DEFAULT 0,
            completed_jobs INTEGER DEFAULT 0,
            current_jobs INTEGER DEFAULT 0,
            certification_notes TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS worker_skills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            worker_id INTEGER NOT NULL REFERENCES worker_profiles(id),
            service_category_id INTEGER NOT NULL REFERENCES service_categories(id),
            experience_years REAL DEFAULT 1.0,
            certification_note TEXT
        );

        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reference TEXT UNIQUE NOT NULL,
            customer_id INTEGER NOT NULL REFERENCES users(id),
            worker_id INTEGER REFERENCES worker_profiles(id),
            service_category_id INTEGER NOT NULL REFERENCES service_categories(id),
            requested_date TEXT NOT NULL,
            time_window TEXT NOT NULL,
            location_address TEXT NOT NULL,
            location_city TEXT NOT NULL,
            urgency TEXT DEFAULT 'normal',
            status TEXT DEFAULT 'requested',
            notes TEXT,
            voice_transcript TEXT,
            service_hours REAL DEFAULT 1.0,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS match_decisions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER NOT NULL REFERENCES bookings(id),
            worker_id INTEGER NOT NULL REFERENCES worker_profiles(id),
            score REAL NOT NULL,
            skill_score REAL DEFAULT 0,
            distance_score REAL DEFAULT 0,
            availability_score REAL DEFAULT 0,
            reliability_score REAL DEFAULT 0,
            fairness_score REAL DEFAULT 0,
            algorithm TEXT DEFAULT 'fairness_aware',
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reference TEXT UNIQUE NOT NULL,
            booking_id INTEGER UNIQUE NOT NULL REFERENCES bookings(id),
            service_amount REAL NOT NULL,
            commission_rate REAL NOT NULL,
            welfare_rate REAL NOT NULL,
            commission_amount REAL NOT NULL,
            welfare_amount REAL NOT NULL,
            worker_payout REAL NOT NULL,
            payment_status TEXT DEFAULT 'pending',
            created_at TEXT DEFAULT (datetime('now')),
            paid_at TEXT
        );

        CREATE TABLE IF NOT EXISTS ratings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER NOT NULL REFERENCES bookings(id),
            from_user_id INTEGER NOT NULL REFERENCES users(id),
            to_user_id INTEGER NOT NULL REFERENCES users(id),
            score INTEGER NOT NULL,
            comment TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            UNIQUE(booking_id, from_user_id)
        );

        CREATE TABLE IF NOT EXISTS disputes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER NOT NULL REFERENCES bookings(id),
            raised_by_id INTEGER NOT NULL REFERENCES users(id),
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT DEFAULT 'open',
            resolution_notes TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS welfare_claims (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            worker_id INTEGER NOT NULL REFERENCES worker_profiles(id),
            claim_type TEXT NOT NULL,
            description TEXT NOT NULL,
            amount_requested REAL NOT NULL,
            status TEXT DEFAULT 'submitted',
            admin_notes TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS voice_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            raw_transcript TEXT,
            extracted_intent TEXT,
            booking_id INTEGER REFERENCES bookings(id),
            language TEXT DEFAULT 'en',
            confidence REAL,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS audit_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            actor_id INTEGER REFERENCES users(id),
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id INTEGER NOT NULL,
            notes TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );
        """)
        db.commit()


def log_audit(actor_id, action, entity_type, entity_id, notes=None):
    execute(
        "INSERT INTO audit_events (actor_id, action, entity_type, entity_id, notes) VALUES (?,?,?,?,?)",
        (actor_id, action, entity_type, entity_id, notes)
    )


# ── Auth Routes ───────────────────────────────────────────────────────────────
@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.json or {}
    required = ["full_name", "email", "password", "role"]
    for f in required:
        if not data.get(f):
            return jsonify({"error": f"'{f}' is required"}), 400
    role = data["role"]
    if role not in ["customer", "worker", "coop_admin", "federation_admin"]:
        return jsonify({"error": "Invalid role"}), 400
    existing = query("SELECT id FROM users WHERE email=?", (data["email"],), one=True)
    if existing:
        return jsonify({"error": "Email already registered"}), 409
    uid = execute(
        "INSERT INTO users (full_name, email, hashed_password, phone, role, preferred_language) VALUES (?,?,?,?,?,?)",
        (data["full_name"], data["email"], hash_password(data["password"]),
         data.get("phone"), role, data.get("preferred_language", "en"))
    )
    user = query("SELECT * FROM users WHERE id=?", (uid,), one=True)
    token = make_token(user["id"], user["role"])
    user.pop("hashed_password", None)
    return jsonify({"access_token": token, "token_type": "bearer", "user": user}), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json or {}
    user = query("SELECT * FROM users WHERE email=?", (data.get("email", ""),), one=True)
    if not user or not verify_password(data.get("password", ""), user["hashed_password"]):
        return jsonify({"error": "Invalid email or password"}), 401
    token = make_token(user["id"], user["role"])
    u = dict(user)
    u.pop("hashed_password", None)
    return jsonify({"access_token": token, "token_type": "bearer", "user": u})


@app.route("/api/auth/me", methods=["GET"])
@require_auth()
def me():
    user = query("SELECT * FROM users WHERE id=?", (g.current_user_id,), one=True)
    if not user:
        return jsonify({"error": "Not found"}), 404
    u = dict(user)
    u.pop("hashed_password", None)
    return jsonify(u)


# ── Cooperatives ──────────────────────────────────────────────────────────────
@app.route("/api/cooperatives", methods=["GET"])
def get_cooperatives():
    coops = query("SELECT * FROM cooperatives WHERE is_active=1")
    return jsonify(coops)


# ── Service Categories ────────────────────────────────────────────────────────
@app.route("/api/service-categories", methods=["GET"])
def get_service_categories():
    cats = query("SELECT * FROM service_categories WHERE is_active=1")
    return jsonify(cats)


# ── Workers ───────────────────────────────────────────────────────────────────
def enrich_worker(w):
    """Add skills, cooperative name, user info to a worker dict."""
    skills = query(
        """SELECT ws.*, sc.name_en as service_category_name_en, sc.name_ta as service_category_name_ta
           FROM worker_skills ws JOIN service_categories sc ON ws.service_category_id=sc.id
           WHERE ws.worker_id=?""",
        (w["id"],)
    )
    w["skills"] = skills
    coop = query("SELECT name FROM cooperatives WHERE id=?", (w["cooperative_id"],), one=True)
    w["cooperative_name"] = coop["name"] if coop else None
    user = query("SELECT full_name, phone, preferred_language FROM users WHERE id=?", (w["user_id"],), one=True)
    if user:
        w["full_name"] = user["full_name"]
        w["phone"] = user["phone"]
        w["preferred_language"] = user["preferred_language"]
    return w


@app.route("/api/workers", methods=["GET"])
def get_workers():
    status = request.args.get("status", "all")
    coop_id = request.args.get("cooperative_id")
    sql = "SELECT * FROM worker_profiles WHERE 1=1"
    args = []
    if status != "all":
        sql += " AND verification_status=?"
        args.append(status)
    if coop_id:
        sql += " AND cooperative_id=?"
        args.append(int(coop_id))
    workers = query(sql, args)
    return jsonify([enrich_worker(w) for w in workers])


@app.route("/api/workers/<int:wid>", methods=["GET"])
def get_worker(wid):
    w = query("SELECT * FROM worker_profiles WHERE id=?", (wid,), one=True)
    if not w:
        return jsonify({"error": "Worker not found"}), 404
    return jsonify(enrich_worker(w))


@app.route("/api/workers/my-profile", methods=["GET"])
@require_auth(roles=["worker"])
def my_worker_profile():
    w = query("SELECT * FROM worker_profiles WHERE user_id=?", (g.current_user_id,), one=True)
    if not w:
        return jsonify({"error": "Profile not found"}), 404
    return jsonify(enrich_worker(w))


@app.route("/api/workers/register", methods=["POST"])
@require_auth(roles=["worker"])
def register_worker():
    data = request.json or {}
    existing = query("SELECT id FROM worker_profiles WHERE user_id=?", (g.current_user_id,), one=True)
    if existing:
        return jsonify({"error": "Profile already exists"}), 409
    wid = execute(
        """INSERT INTO worker_profiles 
           (user_id, cooperative_id, service_radius_km, location_city, location_lat, location_lng, certification_notes)
           VALUES (?,?,?,?,?,?,?)""",
        (g.current_user_id, data.get("cooperative_id", 1),
         data.get("service_radius_km", 10.0), data.get("location_city", "Chennai"),
         data.get("location_lat"), data.get("location_lng"),
         data.get("certification_notes"))
    )
    # Add skills
    for skill in data.get("skills", []):
        execute(
            "INSERT INTO worker_skills (worker_id, service_category_id, experience_years, certification_note) VALUES (?,?,?,?)",
            (wid, skill["service_category_id"], skill.get("experience_years", 1.0), skill.get("certification_note"))
        )
    w = query("SELECT * FROM worker_profiles WHERE id=?", (wid,), one=True)
    return jsonify(enrich_worker(w)), 201


@app.route("/api/workers/<int:wid>/availability", methods=["PUT"])
@require_auth(roles=["worker"])
def update_availability(wid):
    w = query("SELECT * FROM worker_profiles WHERE id=? AND user_id=?", (wid, g.current_user_id), one=True)
    if not w:
        return jsonify({"error": "Unauthorized"}), 403
    data = request.json or {}
    execute("UPDATE worker_profiles SET is_available=?, updated_at=datetime('now') WHERE id=?",
            (1 if data.get("is_available") else 0, wid))
    return jsonify({"success": True})


@app.route("/api/workers/<int:wid>/verify", methods=["PUT"])
@require_auth(roles=["coop_admin", "federation_admin"])
def verify_worker(wid):
    data = request.json or {}
    status = data.get("status")
    if status not in ["verified", "rejected", "pending"]:
        return jsonify({"error": "Invalid status"}), 400
    execute("UPDATE worker_profiles SET verification_status=?, updated_at=datetime('now') WHERE id=?", (status, wid))
    log_audit(g.current_user_id, f"worker_{status}", "worker_profile", wid, data.get("notes"))
    return jsonify({"success": True, "verification_status": status})


# ── Bookings ──────────────────────────────────────────────────────────────────
def gen_ref(prefix="BK"):
    return f"{prefix}{secrets.token_hex(4).upper()}"


def enrich_booking(b):
    sc = query("SELECT name_en, name_ta FROM service_categories WHERE id=?", (b["service_category_id"],), one=True)
    b["service_category_name_en"] = sc["name_en"] if sc else None
    b["service_category_name_ta"] = sc["name_ta"] if sc else None
    cust = query("SELECT full_name FROM users WHERE id=?", (b["customer_id"],), one=True)
    b["customer_name"] = cust["full_name"] if cust else None
    if b.get("worker_id"):
        b["worker"] = enrich_worker(query("SELECT * FROM worker_profiles WHERE id=?", (b["worker_id"],), one=True) or {})
    inv = query("SELECT * FROM invoices WHERE booking_id=?", (b["id"],), one=True)
    b["invoice"] = inv
    return b


@app.route("/api/bookings", methods=["GET"])
@require_auth()
def get_bookings():
    role = g.current_user_role
    uid = g.current_user_id
    if role == "customer":
        bks = query("SELECT * FROM bookings WHERE customer_id=? ORDER BY created_at DESC", (uid,))
    elif role == "worker":
        w = query("SELECT id FROM worker_profiles WHERE user_id=?", (uid,), one=True)
        if not w:
            return jsonify([])
        bks = query("SELECT * FROM bookings WHERE worker_id=? ORDER BY created_at DESC", (w["id"],))
    else:
        bks = query("SELECT * FROM bookings ORDER BY created_at DESC")
    return jsonify([enrich_booking(b) for b in bks])


@app.route("/api/bookings/<int:bid>", methods=["GET"])
@require_auth()
def get_booking(bid):
    b = query("SELECT * FROM bookings WHERE id=?", (bid,), one=True)
    if not b:
        return jsonify({"error": "Not found"}), 404
    return jsonify(enrich_booking(b))


@app.route("/api/bookings", methods=["POST"])
@require_auth(roles=["customer"])
def create_booking():
    data = request.json or {}
    required = ["service_category_id", "requested_date", "time_window", "location_address", "location_city"]
    for f in required:
        if not data.get(f):
            return jsonify({"error": f"'{f}' is required"}), 400
    ref = gen_ref()
    bid = execute(
        """INSERT INTO bookings
           (reference, customer_id, service_category_id, requested_date, time_window,
            location_address, location_city, urgency, notes, voice_transcript, service_hours)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
        (ref, g.current_user_id, data["service_category_id"], data["requested_date"],
         data["time_window"], data["location_address"], data["location_city"],
         data.get("urgency", "normal"), data.get("notes"), data.get("voice_transcript"),
         data.get("service_hours", 1.0))
    )
    if data.get("voice_transcript"):
        execute(
            "INSERT INTO voice_logs (user_id, raw_transcript, booking_id, language) VALUES (?,?,?,?)",
            (g.current_user_id, data["voice_transcript"], bid, data.get("language", "en"))
        )
    b = query("SELECT * FROM bookings WHERE id=?", (bid,), one=True)
    return jsonify(enrich_booking(b)), 201


@app.route("/api/bookings/<int:bid>/status", methods=["PUT"])
@require_auth()
def update_booking_status(bid):
    data = request.json or {}
    new_status = data.get("status")
    valid = ["requested", "matched", "accepted", "in_progress", "completed", "cancelled", "declined"]
    if new_status not in valid:
        return jsonify({"error": "Invalid status"}), 400
    b = query("SELECT * FROM bookings WHERE id=?", (bid,), one=True)
    if not b:
        return jsonify({"error": "Not found"}), 404

    role = g.current_user_role
    uid = g.current_user_id
    # Role-based transition checks
    if new_status == "cancelled" and role == "customer" and b["customer_id"] != uid:
        return jsonify({"error": "Not your booking"}), 403
    if new_status in ["accepted", "declined"] and role == "worker":
        w = query("SELECT id FROM worker_profiles WHERE user_id=?", (uid,), one=True)
        if not w or b["worker_id"] != w["id"]:
            return jsonify({"error": "Not your job"}), 403

    execute("UPDATE bookings SET status=?, updated_at=datetime('now') WHERE id=?", (new_status, bid))

    # Auto-generate invoice when completed
    if new_status == "completed" and b.get("worker_id"):
        existing_inv = query("SELECT id FROM invoices WHERE booking_id=?", (bid,), one=True)
        if not existing_inv:
            _generate_invoice(bid, b)

    log_audit(uid, f"booking_{new_status}", "booking", bid)
    b = query("SELECT * FROM bookings WHERE id=?", (bid,), one=True)
    return jsonify(enrich_booking(b))


def _generate_invoice(bid, booking):
    coop = query(
        """SELECT c.commission_rate, c.welfare_rate FROM cooperatives c
           JOIN worker_profiles wp ON wp.cooperative_id=c.id
           WHERE wp.id=?""",
        (booking["worker_id"],), one=True
    )
    commission_rate = coop["commission_rate"] if coop else 0.10
    welfare_rate = coop["welfare_rate"] if coop else 0.05
    sc = query("SELECT base_rate FROM service_categories WHERE id=?", (booking["service_category_id"],), one=True)
    base_rate = sc["base_rate"] if sc else 200.0
    service_amount = base_rate * booking.get("service_hours", 1.0)
    commission_amount = round(service_amount * commission_rate, 2)
    welfare_amount = round(service_amount * welfare_rate, 2)
    worker_payout = round(service_amount - commission_amount - welfare_amount, 2)
    ref = gen_ref("INV")
    execute(
        """INSERT INTO invoices
           (reference, booking_id, service_amount, commission_rate, welfare_rate,
            commission_amount, welfare_amount, worker_payout)
           VALUES (?,?,?,?,?,?,?,?)""",
        (ref, bid, service_amount, commission_rate, welfare_rate,
         commission_amount, welfare_amount, worker_payout)
    )


@app.route("/api/bookings/<int:bid>/assign-worker", methods=["PUT"])
@require_auth(roles=["coop_admin", "federation_admin"])
def assign_worker(bid):
    data = request.json or {}
    worker_id = data.get("worker_id")
    execute("UPDATE bookings SET worker_id=?, status='matched', updated_at=datetime('now') WHERE id=?",
            (worker_id, bid))
    log_audit(g.current_user_id, "booking_matched", "booking", bid, f"worker_id={worker_id}")
    b = query("SELECT * FROM bookings WHERE id=?", (bid,), one=True)
    return jsonify(enrich_booking(b))


# ── Matching ──────────────────────────────────────────────────────────────────
def haversine_km(lat1, lng1, lat2, lng2):
    """Simple haversine distance in km."""
    import math
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))


def fairness_match(booking, workers_with_skills, weights=None):
    """
    Two-stage matching:
    Stage A: Eligibility (skill, verified, available)
    Stage B: Ranking (skill, distance, availability, reliability, fairness)
    """
    if not weights:
        weights = {
            "skill": 0.30,
            "distance": 0.20,
            "availability": 0.15,
            "reliability": 0.20,
            "fairness": 0.15,
        }

    eligible = []
    for w in workers_with_skills:
        if w["verification_status"] != "verified":
            continue
        if not w["is_available"]:
            continue
        # Check skill
        skill_match = any(
            s["service_category_id"] == booking["service_category_id"]
            for s in w.get("skills", [])
        )
        if not skill_match:
            continue
        eligible.append(w)

    if not eligible:
        return []

    # Find max jobs for normalisation
    all_jobs = [w.get("completed_jobs", 0) for w in eligible]
    max_jobs = max(all_jobs) if all_jobs else 1
    min_jobs = min(all_jobs) if all_jobs else 0

    scored = []
    for w in eligible:
        # Skill score: experience years normalised
        skill_exp = max(
            (s.get("experience_years", 1) for s in w.get("skills", [])
             if s["service_category_id"] == booking["service_category_id"]),
            default=1
        )
        skill_score = min(skill_exp / 10.0, 1.0)

        # Distance score (lower is better) — use city match if no coords
        if w.get("location_lat") and w.get("location_lng"):
            # Booking city coords approximation
            blat = w["location_lat"] + 0.05  # placeholder
            blng = w["location_lng"] + 0.05
            dist_km = haversine_km(w["location_lat"], w["location_lng"], blat, blng)
            distance_score = max(0, 1 - dist_km / max(w["service_radius_km"], 1))
        else:
            # Same city → good score
            distance_score = 0.9 if w["location_city"].lower() == booking.get("location_city", "").lower() else 0.4

        # Availability score
        availability_score = 1.0 if w["is_available"] and w.get("current_jobs", 0) < 3 else 0.5

        # Reliability (rating)
        reliability_score = w.get("rating_avg", 3.0) / 5.0

        # Fairness score — favour workers with fewer recent jobs
        jobs = w.get("completed_jobs", 0)
        if max_jobs == min_jobs:
            fairness_score = 1.0
        else:
            fairness_score = 1.0 - (jobs - min_jobs) / (max_jobs - min_jobs)

        total = (
            weights["skill"] * skill_score +
            weights["distance"] * distance_score +
            weights["availability"] * availability_score +
            weights["reliability"] * reliability_score +
            weights["fairness"] * fairness_score
        )

        scored.append({
            "worker": w,
            "score": round(total, 4),
            "score_breakdown": {
                "skill_score": round(skill_score, 3),
                "distance_score": round(distance_score, 3),
                "availability_score": round(availability_score, 3),
                "reliability_score": round(reliability_score, 3),
                "fairness_score": round(fairness_score, 3),
                "total": round(total, 4),
            },
            "is_recommended": False,
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    if scored:
        scored[0]["is_recommended"] = True
    return scored


@app.route("/api/matching/<int:bid>", methods=["GET"])
@require_auth()
def get_matching(bid):
    b = query("SELECT * FROM bookings WHERE id=?", (bid,), one=True)
    if not b:
        return jsonify({"error": "Booking not found"}), 404
    workers = query("SELECT * FROM worker_profiles")
    workers = [enrich_worker(w) for w in workers]

    fa_candidates = fairness_match(b, workers)

    # Nearest-available baseline (distance only)
    na_candidates = fairness_match(b, workers, weights={
        "skill": 0.50, "distance": 0.50, "availability": 0.0, "reliability": 0.0, "fairness": 0.0
    })

    def build_candidate(c):
        exp = []
        bd = c["score_breakdown"]
        exp.append(f"Skill match: {bd['skill_score']:.2f}")
        exp.append(f"Distance suitability: {bd['distance_score']:.2f}")
        exp.append(f"Availability: {bd['availability_score']:.2f}")
        exp.append(f"Reliability (rating): {bd['reliability_score']:.2f}")
        exp.append(f"Fairness (workload balance): {bd['fairness_score']:.2f}")
        return {
            "worker": c["worker"],
            "score": c["score"],
            "score_breakdown": c["score_breakdown"],
            "match_explanation": " | ".join(exp),
            "is_recommended": c["is_recommended"],
        }

    result = {
        "booking_id": bid,
        "candidates": [build_candidate(c) for c in fa_candidates[:5]],
        "algorithm": "fairness_aware",
        "nearest_available_top": build_candidate(na_candidates[0]) if na_candidates else None,
        "fairness_improvement_desc": (
            f"Fairness-aware algorithm selected worker with {fa_candidates[0]['worker'].get('completed_jobs',0)} jobs "
            f"vs nearest-available worker with {na_candidates[0]['worker'].get('completed_jobs',0)} jobs, "
            f"balancing workload more equitably."
            if fa_candidates and na_candidates else None
        ),
    }
    return jsonify(result)


# ── Invoices ──────────────────────────────────────────────────────────────────
@app.route("/api/invoices", methods=["GET"])
@require_auth()
def get_invoices():
    role = g.current_user_role
    uid = g.current_user_id
    if role == "customer":
        invs = query(
            "SELECT i.* FROM invoices i JOIN bookings b ON i.booking_id=b.id WHERE b.customer_id=?",
            (uid,)
        )
    elif role == "worker":
        w = query("SELECT id FROM worker_profiles WHERE user_id=?", (uid,), one=True)
        if not w:
            return jsonify([])
        invs = query(
            "SELECT i.* FROM invoices i JOIN bookings b ON i.booking_id=b.id WHERE b.worker_id=?",
            (w["id"],)
        )
    else:
        invs = query("SELECT * FROM invoices ORDER BY created_at DESC")
    return jsonify(invs)


@app.route("/api/invoices/<int:iid>/pay", methods=["POST"])
@require_auth(roles=["customer"])
def simulate_payment(iid):
    inv = query("SELECT * FROM invoices WHERE id=?", (iid,), one=True)
    if not inv:
        return jsonify({"error": "Invoice not found"}), 404
    if inv["payment_status"] == "simulated_paid":
        return jsonify({"error": "Already paid"}), 409
    execute(
        "UPDATE invoices SET payment_status='simulated_paid', paid_at=datetime('now') WHERE id=?",
        (iid,)
    )
    log_audit(g.current_user_id, "payment_simulated", "invoice", iid)
    inv = query("SELECT * FROM invoices WHERE id=?", (iid,), one=True)
    return jsonify(inv)


# ── Ratings ───────────────────────────────────────────────────────────────────
@app.route("/api/ratings", methods=["POST"])
@require_auth()
def create_rating():
    data = request.json or {}
    bid = data.get("booking_id")
    to_uid = data.get("to_user_id")
    score = data.get("score")
    if not all([bid, to_uid, score]):
        return jsonify({"error": "booking_id, to_user_id, score required"}), 400
    if not 1 <= int(score) <= 5:
        return jsonify({"error": "Score 1-5"}), 400
    # Prevent duplicate
    existing = query("SELECT id FROM ratings WHERE booking_id=? AND from_user_id=?", (bid, g.current_user_id), one=True)
    if existing:
        return jsonify({"error": "Already rated this booking"}), 409
    rid = execute(
        "INSERT INTO ratings (booking_id, from_user_id, to_user_id, score, comment) VALUES (?,?,?,?,?)",
        (bid, g.current_user_id, to_uid, score, data.get("comment"))
    )
    # Update worker rating avg
    w = query("SELECT id FROM worker_profiles WHERE user_id=?", (to_uid,), one=True)
    if w:
        ratings = query("SELECT score FROM ratings WHERE to_user_id=?", (to_uid,))
        avg = sum(r["score"] for r in ratings) / len(ratings) if ratings else 0
        execute("UPDATE worker_profiles SET rating_avg=?, rating_count=? WHERE id=?",
                (round(avg, 2), len(ratings), w["id"]))
    return jsonify(query("SELECT * FROM ratings WHERE id=?", (rid,), one=True)), 201


@app.route("/api/ratings/booking/<int:bid>", methods=["GET"])
@require_auth()
def get_ratings_for_booking(bid):
    return jsonify(query("SELECT * FROM ratings WHERE booking_id=?", (bid,)))


# ── Disputes ──────────────────────────────────────────────────────────────────
@app.route("/api/disputes", methods=["GET"])
@require_auth()
def get_disputes():
    role = g.current_user_role
    uid = g.current_user_id
    if role in ["coop_admin", "federation_admin"]:
        disputes = query("SELECT * FROM disputes ORDER BY created_at DESC")
    else:
        disputes = query("SELECT * FROM disputes WHERE raised_by_id=? ORDER BY created_at DESC", (uid,))
    for d in disputes:
        user = query("SELECT full_name FROM users WHERE id=?", (d["raised_by_id"],), one=True)
        d["raised_by_name"] = user["full_name"] if user else None
    return jsonify(disputes)


@app.route("/api/disputes", methods=["POST"])
@require_auth()
def create_dispute():
    data = request.json or {}
    if not all([data.get("booking_id"), data.get("title"), data.get("description")]):
        return jsonify({"error": "booking_id, title, description required"}), 400
    did = execute(
        "INSERT INTO disputes (booking_id, raised_by_id, title, description) VALUES (?,?,?,?)",
        (data["booking_id"], g.current_user_id, data["title"], data["description"])
    )
    return jsonify(query("SELECT * FROM disputes WHERE id=?", (did,), one=True)), 201


@app.route("/api/disputes/<int:did>", methods=["PUT"])
@require_auth(roles=["coop_admin", "federation_admin"])
def update_dispute(did):
    data = request.json or {}
    execute(
        "UPDATE disputes SET status=?, resolution_notes=?, updated_at=datetime('now') WHERE id=?",
        (data.get("status", "under_review"), data.get("resolution_notes"), did)
    )
    log_audit(g.current_user_id, f"dispute_{data.get('status')}", "dispute", did)
    return jsonify(query("SELECT * FROM disputes WHERE id=?", (did,), one=True))


# ── Welfare Claims ────────────────────────────────────────────────────────────
@app.route("/api/welfare", methods=["GET"])
@require_auth()
def get_welfare_claims():
    role = g.current_user_role
    uid = g.current_user_id
    if role in ["coop_admin", "federation_admin"]:
        claims = query("SELECT * FROM welfare_claims ORDER BY created_at DESC")
    else:
        w = query("SELECT id FROM worker_profiles WHERE user_id=?", (uid,), one=True)
        if not w:
            return jsonify([])
        claims = query("SELECT * FROM welfare_claims WHERE worker_id=? ORDER BY created_at DESC", (w["id"],))
    return jsonify(claims)


@app.route("/api/welfare", methods=["POST"])
@require_auth(roles=["worker"])
def create_welfare_claim():
    data = request.json or {}
    w = query("SELECT id FROM worker_profiles WHERE user_id=?", (g.current_user_id,), one=True)
    if not w:
        return jsonify({"error": "Worker profile required"}), 400
    cid = execute(
        "INSERT INTO welfare_claims (worker_id, claim_type, description, amount_requested) VALUES (?,?,?,?)",
        (w["id"], data.get("claim_type", "medical"), data.get("description", ""), data.get("amount_requested", 0))
    )
    return jsonify(query("SELECT * FROM welfare_claims WHERE id=?", (cid,), one=True)), 201


@app.route("/api/welfare/<int:cid>", methods=["PUT"])
@require_auth(roles=["coop_admin", "federation_admin"])
def update_welfare_claim(cid):
    data = request.json or {}
    execute(
        "UPDATE welfare_claims SET status=?, admin_notes=?, updated_at=datetime('now') WHERE id=?",
        (data.get("status"), data.get("admin_notes"), cid)
    )
    log_audit(g.current_user_id, f"welfare_{data.get('status')}", "welfare_claim", cid)
    return jsonify(query("SELECT * FROM welfare_claims WHERE id=?", (cid,), one=True))


# ── Voice Intent Extraction ───────────────────────────────────────────────────
TAMIL_SERVICE_MAP = {
    "plumber": "Plumbing", "plumbing": "Plumbing",
    "pipe": "Plumbing", "கழிவுநீர்": "Plumbing", "plambr": "Plumbing",
    "electric": "Electrical", "electrician": "Electrical",
    "மின்சாரம்": "Electrical", "மின்": "Electrical",
    "clean": "Cleaning", "cleaning": "Cleaning",
    "சுத்தம்": "Cleaning", "தூய்மை": "Cleaning",
    "driver": "Driving", "driving": "Driving",
    "ஓட்டுநர்": "Driving", "வாகனம்": "Driving",
    "repair": "Home Repairs", "repaire": "Home Repairs",
    "சரி": "Home Repairs", "பழுது": "Home Repairs",
}

TAMIL_DATE_MAP = {
    "today": "today", "இன்று": "today", "inru": "today",
    "tomorrow": "tomorrow", "நாளை": "tomorrow", "naalaiku": "tomorrow",
    "naalaikku": "tomorrow", "naalai": "tomorrow", "நாளைக்கு": "tomorrow",
    "நாலைக்கு": "tomorrow",
}

TAMIL_TIME_MAP = {
    "morning": "morning", "காலை": "morning", "kalai": "morning",
    "kaalaila": "morning", "afternoon": "afternoon", "மதியம்": "afternoon",
    "evening": "evening", "மாலை": "evening", "malai": "evening",
    "night": "evening", "இரவு": "evening",
}

TAMIL_URGENCY_MAP = {
    "urgent": "urgent", "emergency": "emergency",
    "அவசரம்": "urgent", "emergency": "emergency",
    "avasaram": "urgent",
}


@app.route("/api/voice/extract-intent", methods=["POST"])
@require_auth()
def extract_intent():
    data = request.json or {}
    transcript = data.get("transcript", "").strip()
    language = data.get("language", "en")
    if not transcript:
        return jsonify({"error": "transcript required"}), 400

    lower = transcript.lower()
    service_category = None
    for keyword, cat in TAMIL_SERVICE_MAP.items():
        if keyword in lower:
            service_category = cat
            break

    requested_date = None
    for keyword, d in TAMIL_DATE_MAP.items():
        if keyword in lower:
            requested_date = d
            break

    time_window = None
    for keyword, t in TAMIL_TIME_MAP.items():
        if keyword in lower:
            time_window = t
            break

    urgency = "normal"
    for keyword, u in TAMIL_URGENCY_MAP.items():
        if keyword in lower:
            urgency = u
            break

    missing = []
    if not service_category:
        missing.append("service_category")
    if not requested_date:
        missing.append("requested_date")
    if not time_window:
        missing.append("time_window")

    confidence = 0.9 - (len(missing) * 0.2)
    confidence = max(0.1, confidence)

    # Resolve date
    today = date.today()
    if requested_date == "tomorrow":
        actual_date = (today + timedelta(days=1)).isoformat()
    elif requested_date == "today":
        actual_date = today.isoformat()
    else:
        actual_date = None

    result = {
        "intent": "book_service" if service_category else "unknown",
        "service_category": service_category,
        "requested_date": actual_date,
        "time_window": time_window,
        "location": None,
        "urgency": urgency,
        "confidence": round(confidence, 2),
        "missing_fields": missing,
        "raw_transcript": transcript,
    }

    # Log voice interaction
    execute(
        "INSERT INTO voice_logs (user_id, raw_transcript, extracted_intent, language, confidence) VALUES (?,?,?,?,?)",
        (g.current_user_id, transcript, json.dumps(result), language, confidence)
    )
    return jsonify(result)


# ── Analytics ─────────────────────────────────────────────────────────────────
@app.route("/api/analytics/coop-metrics", methods=["GET"])
@require_auth(roles=["coop_admin", "federation_admin"])
def coop_metrics():
    total_workers = query("SELECT COUNT(*) as c FROM worker_profiles", one=True)["c"]
    verified_workers = query("SELECT COUNT(*) as c FROM worker_profiles WHERE verification_status='verified'", one=True)["c"]
    active_bookings = query("SELECT COUNT(*) as c FROM bookings WHERE status IN ('requested','matched','accepted','in_progress')", one=True)["c"]
    completed_jobs = query("SELECT COUNT(*) as c FROM bookings WHERE status='completed'", one=True)["c"]
    pending_disputes = query("SELECT COUNT(*) as c FROM disputes WHERE status IN ('open','under_review')", one=True)["c"]

    earnings_row = query("SELECT COALESCE(SUM(service_amount),0) as t FROM invoices", one=True)
    total_earnings = earnings_row["t"]
    contrib_row = query("SELECT COALESCE(SUM(commission_amount+welfare_amount),0) as t FROM invoices", one=True)
    total_coop_contrib = contrib_row["t"]

    demand = query(
        """SELECT sc.name_en as category_en, sc.name_ta as category_ta, COUNT(b.id) as count
           FROM bookings b JOIN service_categories sc ON b.service_category_id=sc.id
           GROUP BY sc.id ORDER BY count DESC"""
    )

    trend = []
    for i in range(7, 0, -1):
        d = (date.today() - timedelta(days=i)).isoformat()
        row = query("SELECT COUNT(*) as c FROM bookings WHERE DATE(created_at)=?", (d,), one=True)
        comp = query("SELECT COUNT(*) as c FROM bookings WHERE DATE(created_at)=? AND status='completed'", (d,), one=True)
        trend.append({"date": d, "bookings": row["c"], "completed": comp["c"]})

    workload = query(
        """SELECT u.full_name as worker_name, wp.completed_jobs as jobs_all_time,
                  (SELECT COUNT(*) FROM bookings b WHERE b.worker_id=wp.id AND b.status IN ('accepted','in_progress')) as jobs_this_week
           FROM worker_profiles wp JOIN users u ON wp.user_id=u.id
           WHERE wp.verification_status='verified'
           ORDER BY wp.completed_jobs DESC LIMIT 10"""
    )

    return jsonify({
        "total_workers": total_workers,
        "verified_workers": verified_workers,
        "active_bookings": active_bookings,
        "completed_jobs": completed_jobs,
        "pending_disputes": pending_disputes,
        "total_earnings": round(total_earnings, 2),
        "total_cooperative_contribution": round(total_coop_contrib, 2),
        "demand_by_category": demand,
        "booking_trend": trend,
        "workload_distribution": workload,
    })


@app.route("/api/analytics/forecast", methods=["GET"])
@require_auth(roles=["coop_admin", "federation_admin"])
def demand_forecast():
    """Simple linear extrapolation from historical data."""
    cats = query("SELECT * FROM service_categories WHERE is_active=1")
    result = []
    for cat in cats:
        # Historical: last 4 weeks
        for i in range(4, 0, -1):
            week_start = (date.today() - timedelta(weeks=i)).isoformat()
            week_end = (date.today() - timedelta(weeks=i-1)).isoformat()
            actual = query(
                "SELECT COUNT(*) as c FROM bookings WHERE service_category_id=? AND DATE(created_at) BETWEEN ? AND ?",
                (cat["id"], week_start, week_end), one=True
            )["c"]
            result.append({
                "period": f"Week -{i}",
                "category_en": cat["name_en"],
                "category_ta": cat["name_ta"],
                "actual": actual,
                "forecast": actual,
                "confidence_low": max(0, actual - 1),
                "confidence_high": actual + 2,
                "is_forecast": False,
            })
        # Forecast next 2 weeks (simple: avg of last 2 + 10% growth)
        hist = [r["actual"] for r in result if r["category_en"] == cat["name_en"] and not r["is_forecast"]]
        avg = sum(hist[-2:]) / max(len(hist[-2:]), 1)
        for j in range(1, 3):
            fcast = round(avg * (1 + 0.1 * j))
            result.append({
                "period": f"Week +{j} (forecast)",
                "category_en": cat["name_en"],
                "category_ta": cat["name_ta"],
                "actual": None,
                "forecast": fcast,
                "confidence_low": max(0, fcast - 2),
                "confidence_high": fcast + 3,
                "is_forecast": True,
            })
    return jsonify({"data": result, "is_simulated": True, "label": "⚠ Demo data — simulated forecast"})


# ── Federation ────────────────────────────────────────────────────────────────
@app.route("/api/federation/metrics", methods=["GET"])
@require_auth(roles=["federation_admin"])
def federation_metrics():
    coops = query("SELECT * FROM cooperatives WHERE is_active=1")
    summaries = []
    for coop in coops:
        workers_count = query("SELECT COUNT(*) as c FROM worker_profiles WHERE cooperative_id=?", (coop["id"],), one=True)["c"]
        verified_count = query("SELECT COUNT(*) as c FROM worker_profiles WHERE cooperative_id=? AND verification_status='verified'", (coop["id"],), one=True)["c"]
        worker_ids = query("SELECT id FROM worker_profiles WHERE cooperative_id=?", (coop["id"],))
        wid_list = [str(w["id"]) for w in worker_ids]
        if wid_list:
            bookings = query(f"SELECT COUNT(*) as c FROM bookings WHERE worker_id IN ({','.join(['?']*len(wid_list))})", wid_list, one=True)["c"]
            completed = query(f"SELECT COUNT(*) as c FROM bookings WHERE worker_id IN ({','.join(['?']*len(wid_list))}) AND status='completed'", wid_list, one=True)["c"]
            earnings_row = query(
                f"SELECT COALESCE(SUM(i.service_amount),0) as t FROM invoices i JOIN bookings b ON i.booking_id=b.id WHERE b.worker_id IN ({','.join(['?']*len(wid_list))})",
                wid_list, one=True
            )
            earnings = earnings_row["t"]
            disputes = query(
                f"SELECT COUNT(*) as c FROM disputes WHERE booking_id IN (SELECT id FROM bookings WHERE worker_id IN ({','.join(['?']*len(wid_list))}) )",
                wid_list, one=True
            )["c"]
        else:
            bookings = completed = earnings = disputes = 0

        summaries.append({
            "cooperative": coop,
            "workers": workers_count,
            "verified_workers": verified_count,
            "bookings": bookings,
            "completed": completed,
            "earnings": round(earnings, 2),
            "disputes": disputes,
        })

    totals_workers = sum(s["workers"] for s in summaries)
    totals_verified = sum(s["verified_workers"] for s in summaries)
    totals_bookings = sum(s["bookings"] for s in summaries)
    totals_completed = sum(s["completed"] for s in summaries)
    totals_earnings = sum(s["earnings"] for s in summaries)
    totals_disputes = sum(s["disputes"] for s in summaries)

    return jsonify({
        "cooperatives": summaries,
        "totals": {
            "total_workers": totals_workers,
            "verified_workers": totals_verified,
            "total_bookings": totals_bookings,
            "completed_bookings": totals_completed,
            "total_earnings": round(totals_earnings, 2),
            "unresolved_disputes": totals_disputes,
        }
    })


# ── Admin ─────────────────────────────────────────────────────────────────────
@app.route("/api/admin/pending-verifications", methods=["GET"])
@require_auth(roles=["coop_admin", "federation_admin"])
def pending_verifications():
    workers = query("SELECT * FROM worker_profiles WHERE verification_status='pending' ORDER BY created_at DESC")
    return jsonify([enrich_worker(w) for w in workers])


@app.route("/api/admin/audit-log", methods=["GET"])
@require_auth(roles=["coop_admin", "federation_admin"])
def audit_log():
    events = query("SELECT ae.*, u.full_name as actor_name FROM audit_events ae LEFT JOIN users u ON ae.actor_id=u.id ORDER BY ae.created_at DESC LIMIT 50")
    return jsonify(events)


@app.route("/api/admin/all-bookings", methods=["GET"])
@require_auth(roles=["coop_admin", "federation_admin"])
def all_bookings():
    bks = query("SELECT * FROM bookings ORDER BY created_at DESC")
    return jsonify([enrich_booking(b) for b in bks])


# ── Health ────────────────────────────────────────────────────────────────────
@app.route("/", methods=["GET"])
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "SahakarVaani API", "version": "1.0.0"})


# ── Seed Data ─────────────────────────────────────────────────────────────────
def seed_data():
    """Seed realistic fictional demo data."""
    db = get_db()
    existing = query("SELECT COUNT(*) as c FROM users", one=True)
    if existing["c"] > 0:
        return  # Already seeded

    print("[SEED] Seeding demo data...")

    # Cooperatives
    coops = [
        ("Chennai Household Workers Cooperative", "CHWC-TN-001", "Chennai", "Tamil Nadu", 0.10, 0.05),
        ("Coimbatore Service Workers Guild", "CSWG-TN-002", "Coimbatore", "Tamil Nadu", 0.08, 0.04),
        ("Madurai Skilled Workers Cooperative", "MSKWC-TN-003", "Madurai", "Tamil Nadu", 0.10, 0.05),
    ]
    coop_ids = []
    for c in coops:
        cid = execute(
            "INSERT INTO cooperatives (name, registration_number, city, state, commission_rate, welfare_rate) VALUES (?,?,?,?,?,?)", c
        )
        coop_ids.append(cid)

    # Service categories
    categories = [
        ("Plumbing", "குழாய் பணி", "Expert plumbers for leaks, installations, and drain cleaning.", "கசிவுகள், நிறுவல்கள் மற்றும் வடிகால் சுத்தம் செய்வதற்கான நிபுணர் குழாய் திருத்துனர்கள்.", "Droplets", 250.0),
        ("Electrical", "மின் பணி", "Certified electricians for wiring, repairs, and installations.", "வைரிங், பழுதுபார்த்தல் மற்றும் நிறுவலுக்கான சான்றளிக்கப்பட்ட மின்சாரர்கள்.", "Zap", 300.0),
        ("Cleaning", "சுத்தம் செய்தல்", "Professional home and office cleaning services.", "தொழில்முறை வீட்டு மற்றும் அலுவலக சுத்தம் செய்யும் சேவைகள்.", "Sparkles", 200.0),
        ("Driving", "வாகன ஓட்டுதல்", "Reliable drivers for personal and goods transport.", "தனிப்பட்ட மற்றும் சரக்கு போக்குவரத்துக்கான நம்பகமான ஓட்டுனர்கள்.", "Car", 180.0),
        ("Home Repairs", "வீட்டு பழுதுபார்ப்பு", "General repair and maintenance for household fixtures.", "வீட்டு கருவிகளுக்கான பொது பழுதுபார்ப்பு மற்றும் பராமரிப்பு.", "Wrench", 220.0),
    ]
    cat_ids = []
    for cat in categories:
        cid = execute(
            "INSERT INTO service_categories (name_en, name_ta, description_en, description_ta, icon, base_rate) VALUES (?,?,?,?,?,?)", cat
        )
        cat_ids.append(cid)

    # Users (customers + workers + admin)
    def add_user(name, email, pw, phone, role, lang="en"):
        return execute(
            "INSERT INTO users (full_name, email, hashed_password, phone, role, preferred_language) VALUES (?,?,?,?,?,?)",
            (name, email, hash_password(pw), phone, role, lang)
        )

    # Admin users
    admin_id = add_user("Kavitha Rajan", "admin@sahakarvaani.in", "admin123", "9444100001", "coop_admin", "ta")
    fed_id = add_user("Arjun Menon", "federation@sahakarvaani.in", "fed123", "9444100002", "federation_admin", "en")

    # Customer users
    cust1 = add_user("Priya Sundarajan", "priya@demo.in", "demo123", "9876543201", "customer", "ta")
    cust2 = add_user("Ramesh Kumar", "ramesh@demo.in", "demo123", "9876543202", "customer", "en")
    cust3 = add_user("Meena Lakshmi", "meena@demo.in", "demo123", "9876543203", "customer", "ta")

    # Worker users
    worker_data = [
        ("Murugan Selvam", "murugan@demo.in", "demo123", "9876501001", "ta", 13.0826, 80.2707, "Chennai", coop_ids[0], [(cat_ids[0], 5, "Licensed plumber, 5 years exp")]),
        ("Anbu Karuppiah", "anbu@demo.in", "demo123", "9876501002", "ta", 13.0450, 80.2101, "Chennai", coop_ids[0], [(cat_ids[1], 7, "Certified electrician, TNEB approved"), (cat_ids[4], 3, "General repairs")]),
        ("Selvi Devi", "selvi@demo.in", "demo123", "9876501003", "ta", 13.0878, 80.2785, "Chennai", coop_ids[0], [(cat_ids[2], 4, "Professional housekeeper")]),
        ("Rajan Pillai", "rajan@demo.in", "demo123", "9876501004", "en", 11.0168, 76.9558, "Coimbatore", coop_ids[1], [(cat_ids[3], 8, "Commercial vehicle license"), (cat_ids[4], 2, "Minor repairs")]),
        ("Gomathi Arumugam", "gomathi@demo.in", "demo123", "9876501005", "ta", 13.0550, 80.2600, "Chennai", coop_ids[0], [(cat_ids[0], 3, "Plumbing cert"), (cat_ids[4], 5, "Home repair specialist")]),
        ("Bala Krishnan", "bala@demo.in", "demo123", "9876501006", "ta", 9.9252, 78.1198, "Madurai", coop_ids[2], [(cat_ids[1], 6, "Master electrician")]),
        ("Kaveri Nataraj", "kaveri@demo.in", "demo123", "9876501007", "ta", 13.0600, 80.2500, "Chennai", coop_ids[0], [(cat_ids[2], 2, "Cleaning team lead")]),
        ("Senthil Kumar", "senthil@demo.in", "demo123", "9876501008", "ta", 11.0200, 76.9600, "Coimbatore", coop_ids[1], [(cat_ids[3], 10, "Heavy vehicle license, 10 years"), (cat_ids[2], 1, "Basic cleaning")]),
    ]

    worker_ids = []
    for (name, email, pw, phone, lang, lat, lng, city, coop_id, skills) in worker_data:
        uid = add_user(name, email, pw, phone, "worker", lang)
        wid = execute(
            """INSERT INTO worker_profiles
               (user_id, cooperative_id, service_radius_km, location_city, location_lat, location_lng,
                verification_status, is_available, rating_avg, rating_count, completed_jobs)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (uid, coop_id, 12.0, city, lat, lng, "verified", 1,
             round(3.5 + len(worker_ids) * 0.1, 1), 10 + len(worker_ids) * 3,
             5 + len(worker_ids) * 4)
        )
        for (cat_id, exp, note) in skills:
            execute(
                "INSERT INTO worker_skills (worker_id, service_category_id, experience_years, certification_note) VALUES (?,?,?,?)",
                (wid, cat_id, exp, note)
            )
        worker_ids.append(wid)

    # Add one pending worker for demo
    pend_uid = add_user("Vijay Anandan", "vijay@demo.in", "demo123", "9876501009", "worker", "ta")
    pend_wid = execute(
        """INSERT INTO worker_profiles
           (user_id, cooperative_id, service_radius_km, location_city, verification_status, is_available)
           VALUES (?,?,?,?,?,?)""",
        (pend_uid, coop_ids[0], 8.0, "Chennai", "pending", 1)
    )
    execute("INSERT INTO worker_skills (worker_id, service_category_id, experience_years) VALUES (?,?,?)",
            (pend_wid, cat_ids[0], 2.0))
    worker_ids.append(pend_wid)

    # Bookings & Invoices
    today = date.today()
    booking_scenarios = [
        # (customer_id, worker_id, cat_id, date_offset, time_window, city, urgency, status, hours)
        (cust1, worker_ids[0], cat_ids[0], -5, "morning", "Chennai", "normal", "completed", 2.0),
        (cust2, worker_ids[1], cat_ids[1], -3, "afternoon", "Chennai", "urgent", "completed", 1.5),
        (cust3, worker_ids[2], cat_ids[2], -2, "morning", "Chennai", "normal", "completed", 3.0),
        (cust1, worker_ids[3], cat_ids[3], -1, "afternoon", "Coimbatore", "normal", "completed", 1.0),
        (cust2, worker_ids[0], cat_ids[0], 0, "morning", "Chennai", "normal", "in_progress", 1.5),
        (cust1, worker_ids[4], cat_ids[4], 1, "afternoon", "Chennai", "normal", "accepted", 2.0),
        (cust3, worker_ids[1], cat_ids[1], 2, "evening", "Chennai", "urgent", "matched", 1.0),
        (cust2, None, cat_ids[2], 3, "morning", "Chennai", "normal", "requested", 2.0),
        (cust1, None, cat_ids[0], 4, "afternoon", "Chennai", "emergency", "requested", 1.0),
    ]

    booking_ids = []
    for (cust_id, wid, cat_id, day_off, tw, city, urg, stat, hours) in booking_scenarios:
        bdate = (today + timedelta(days=day_off)).isoformat()
        ref = gen_ref()
        bid = execute(
            """INSERT INTO bookings
               (reference, customer_id, worker_id, service_category_id, requested_date, time_window,
                location_address, location_city, urgency, status, service_hours)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (ref, cust_id, wid, cat_id, bdate, tw,
             f"{city}, Tamil Nadu", city, urg, stat, hours)
        )
        booking_ids.append(bid)

        # Generate invoices for completed bookings
        if stat == "completed" and wid:
            coop = query("SELECT commission_rate, welfare_rate FROM cooperatives WHERE id=(SELECT cooperative_id FROM worker_profiles WHERE id=?)", (wid,), one=True)
            sc = query("SELECT base_rate FROM service_categories WHERE id=?", (cat_id,), one=True)
            cr = coop["commission_rate"] if coop else 0.10
            wr = coop["welfare_rate"] if coop else 0.05
            br = sc["base_rate"] if sc else 200.0
            sa = round(br * hours, 2)
            ca = round(sa * cr, 2)
            wa = round(sa * wr, 2)
            payout = round(sa - ca - wa, 2)
            iref = gen_ref("INV")
            execute(
                """INSERT INTO invoices
                   (reference, booking_id, service_amount, commission_rate, welfare_rate,
                    commission_amount, welfare_amount, worker_payout, payment_status, paid_at)
                   VALUES (?,?,?,?,?,?,?,?,'simulated_paid',datetime('now'))""",
                (iref, bid, sa, cr, wr, ca, wa, payout)
            )

    # Ratings
    rating_data = [
        (booking_ids[0], cust1, worker_ids[0], 5, "Excellent work! Very professional."),
        (booking_ids[1], cust2, worker_ids[1], 4, "Good job, on time."),
        (booking_ids[2], cust3, worker_ids[2], 5, "அருமை! மிகவும் நன்றாக செய்தார்கள்."),
        (booking_ids[3], cust1, worker_ids[3], 4, "Reliable driver."),
    ]
    for (bid, from_uid, wid, score, comment) in rating_data:
        execute("INSERT OR IGNORE INTO ratings (booking_id, from_user_id, to_user_id, score, comment) VALUES (?,?,?,?,?)",
                (bid, from_uid, wid, score, comment))

    # Update worker ratings
    for wid in worker_ids:
        wuser = query("SELECT user_id FROM worker_profiles WHERE id=?", (wid,), one=True)
        if wuser:
            ratings = query("SELECT score FROM ratings WHERE to_user_id=?", (wuser["user_id"],))
            if ratings:
                avg = sum(r["score"] for r in ratings) / len(ratings)
                execute("UPDATE worker_profiles SET rating_avg=?, rating_count=? WHERE id=?",
                        (round(avg, 2), len(ratings), wid))

    # Disputes
    execute(
        "INSERT INTO disputes (booking_id, raised_by_id, title, description, status) VALUES (?,?,?,?,?)",
        (booking_ids[1], cust2, "Worker arrived late", "The electrician arrived 2 hours after the scheduled time window.", "under_review")
    )
    execute(
        "INSERT INTO disputes (booking_id, raised_by_id, title, description, status, resolution_notes) VALUES (?,?,?,?,?,?)",
        (booking_ids[0], cust1, "Invoice amount query", "The invoice amount seems higher than discussed.", "resolved",
         "Amount verified correct as per service rate card. Customer acknowledged.")
    )

    # Welfare claims
    execute(
        "INSERT INTO welfare_claims (worker_id, claim_type, description, amount_requested, status) VALUES (?,?,?,?,?)",
        (worker_ids[0], "medical", "Medical treatment for work-related hand injury", 5000.0, "approved")
    )
    execute(
        "INSERT INTO welfare_claims (worker_id, claim_type, description, amount_requested, status) VALUES (?,?,?,?,?)",
        (worker_ids[1], "equipment", "Replacement of damaged electrical testing equipment", 3500.0, "under_review")
    )
    execute(
        "INSERT INTO welfare_claims (worker_id, claim_type, description, amount_requested, status) VALUES (?,?,?,?,?)",
        (worker_ids[2], "maternity", "Maternity support allowance request", 8000.0, "submitted")
    )

    db.commit()
    print("✅ Demo data seeded successfully.")
    print("\n📋 Demo accounts:")
    print("  Admin:        admin@sahakarvaani.in / admin123")
    print("  Federation:   federation@sahakarvaani.in / fed123")
    print("  Customer:     priya@demo.in / demo123")
    print("  Customer:     ramesh@demo.in / demo123")
    print("  Worker:       murugan@demo.in / demo123  (Plumber, Verified)")
    print("  Worker:       vijay@demo.in / demo123    (Pending verification)")


if __name__ == "__main__":
    init_db()
    with app.app_context():
        seed_data()
    app.run(host="0.0.0.0", port=8000, debug=True)
