"""
FastAPI Microservice for Financial Fraud Inference & Anomaly Detection
Provides REST endpoints for live scoring, explainable AI explanations, and model metrics.
"""
import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="Intelligent Financial Fraud Detection ML Engine",
    version="1.2.0",
    description="Ensemble Random Forest & Isolation Forest Inference Service"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")
RF_PATH = os.path.join(MODELS_DIR, "rf_model.joblib")
ISO_PATH = os.path.join(MODELS_DIR, "iso_forest.joblib")
PREPROC_PATH = os.path.join(MODELS_DIR, "preprocessor.joblib")
METRICS_PATH = os.path.join(MODELS_DIR, "metrics.json")

# In-memory model cache
models = {
    "rf": None,
    "iso": None,
    "preproc": None,
    "metrics": None,
    "loaded": False
}

def load_artifacts():
    try:
        if os.path.exists(RF_PATH) and os.path.exists(ISO_PATH) and os.path.exists(PREPROC_PATH):
            models["rf"] = joblib.load(RF_PATH)
            models["iso"] = joblib.load(ISO_PATH)
            models["preproc"] = joblib.load(PREPROC_PATH)
            if os.path.exists(METRICS_PATH):
                with open(METRICS_PATH, "r") as f:
                    models["metrics"] = json.load(f)
            models["loaded"] = True
            print("Successfully loaded ML models and preprocessor.")
        else:
            print("Model files not found yet. Run training script first.")
            models["loaded"] = False
    except Exception as e:
        print(f"Error loading models: {e}")
        models["loaded"] = False

# Load on startup
@app.on_event("startup")
def startup_event():
    load_artifacts()

# Pydantic Schemas
class TransactionPayload(BaseModel):
    transaction_id: Optional[str] = "TX-DEMO"
    customer_id: Optional[str] = "CUST-DEMO"
    amount: float = Field(..., gt=0, description="Transaction amount in currency units")
    customer_avg_amount: float = Field(..., gt=0, description="Customer average transaction amount")
    tx_hour: int = Field(12, ge=0, le=23, description="Hour of the transaction (0-23)")
    tx_velocity_1h: int = Field(1, ge=1, description="Number of transactions in the past 1 hour")
    is_new_device: int = Field(0, ge=0, le=1, description="1 if novel device, 0 if familiar")
    is_new_location: int = Field(0, ge=0, le=1, description="1 if novel IP/country, 0 if normal")
    channel: str = Field("CARD", description="Payment channel: CARD, ONLINE, WIRE_TRANSFER, ATM, UPI")
    customer_risk_profile: str = Field("LOW", description="Customer historical tier: LOW, MEDIUM, HIGH")
    historical_fraud_count: int = Field(0, ge=0, description="Count of past confirmed fraud incidents")
    days_since_last_tx: float = Field(1.0, ge=0.0, description="Days since last activity")

class BatchTransactionPayload(BaseModel):
    transactions: List[TransactionPayload]

def generate_explainability_reasons(row: dict, rf_proba: float, anomaly_score: float) -> List[str]:
    reasons = []
    ratio = row['amount_to_avg_ratio']
    
    # 1. Amount deviation
    if ratio >= 8.0:
        reasons.append(f"Extreme amount anomaly: Transaction is {ratio:.1f}x higher than customer's baseline (${row['customer_avg_amount']:.2f}).")
    elif ratio >= 3.5:
        reasons.append(f"Unusual high-value spending: Transaction is {ratio:.1f}x customer's normal average.")

    # 2. Velocity spike
    if row['tx_velocity_1h'] >= 6:
        reasons.append(f"High-frequency velocity burst: {row['tx_velocity_1h']} transactions attempted within 60 minutes.")
    elif row['tx_velocity_1h'] >= 3:
        reasons.append(f"Elevated velocity: {row['tx_velocity_1h']} transactions in the past hour.")

    # 3. Nighttime anomaly
    if row['is_night_tx'] == 1:
        reasons.append(f"High-risk window: Transaction executed during midnight/dormant hours ({row['tx_hour']:02d}:00).")

    # 4. Device and Geolocation mismatch
    if row['is_new_device'] == 1 and row['is_new_location'] == 1:
        reasons.append("Simultaneous new device fingerprint and unverified geographical location.")
    elif row['is_new_device'] == 1:
        reasons.append("Unrecognized device fingerprint; not previously linked to customer profile.")
    elif row['is_new_location'] == 1:
        reasons.append("Unfamiliar geolocation or foreign IP range detected.")

    # 5. Channel-specific risk
    if row['channel'] == 'WIRE_TRANSFER' and ratio > 4.0:
        reasons.append("Outsized wire transfer request deviates from historical payment methods.")

    # 6. Unsupervised Anomaly Engine
    if anomaly_score > 0.65:
        reasons.append("Isolation Forest detected multi-dimensional outlier pattern inconsistent with benign clusters.")

    # 7. Customer profile risk
    if row['historical_fraud_count'] > 0:
        reasons.append(f"Account has {row['historical_fraud_count']} prior flagged fraud incidents on record.")

    if not reasons:
        reasons.append("Transaction exhibits regular spending metrics aligned with customer baseline.")

    return reasons

@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "active",
        "service": "Intelligent Financial Fraud Detection ML Engine",
        "models_loaded": models["loaded"],
        "model_version": "v1.2.0",
        "supported_features": [
            "amount", "customer_avg_amount", "amount_to_avg_ratio", "tx_hour",
            "is_night_tx", "tx_velocity_1h", "is_new_device", "is_new_location",
            "historical_fraud_count", "days_since_last_tx", "channel", "customer_risk_profile"
        ]
    }

@app.get("/metrics", tags=["Evaluation"])
def get_model_metrics():
    if not models["loaded"] or models["metrics"] is None:
        if os.path.exists(METRICS_PATH):
            with open(METRICS_PATH, "r") as f:
                models["metrics"] = json.load(f)
                return models["metrics"]
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model metrics not yet generated. Please trigger model training."
        )
    return models["metrics"]

@app.post("/predict", tags=["Inference"])
def predict_fraud(payload: TransactionPayload):
    # Ensure models are loaded
    if not models["loaded"]:
        load_artifacts()
    
    if not models["loaded"]:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML models not available. Train models or use backend fallback detector."
        )

    # Feature preparation
    amount = float(payload.amount)
    cust_avg = float(payload.customer_avg_amount)
    ratio = amount / (cust_avg + 1e-5)
    is_night = 1 if payload.tx_hour in [0, 1, 2, 3, 4, 5] else 0

    row_dict = {
        'amount': amount,
        'customer_avg_amount': cust_avg,
        'amount_to_avg_ratio': float(ratio),
        'tx_hour': int(payload.tx_hour),
        'is_night_tx': int(is_night),
        'tx_velocity_1h': int(payload.tx_velocity_1h),
        'is_new_device': int(payload.is_new_device),
        'is_new_location': int(payload.is_new_location),
        'historical_fraud_count': int(payload.historical_fraud_count),
        'days_since_last_tx': float(payload.days_since_last_tx),
        'channel': str(payload.channel).upper(),
        'customer_risk_profile': str(payload.customer_risk_profile).upper()
    }

    df_in = pd.DataFrame([row_dict])

    try:
        X_proc = models["preproc"].transform(df_in)

        # 1. Random Forest Supervised Probability
        rf_proba = float(models["rf"].predict_proba(X_proc)[0, 1])

        # 2. Isolation Forest Anomaly Score
        # decision_function yields negative for anomalies, positive for normal
        raw_iso = float(models["iso"].decision_function(X_proc)[0])
        # Map raw decision function to [0, 1] anomaly score: lower decision means higher anomaly
        anomaly_score = float(1.0 / (1.0 + np.exp(raw_iso * 4.0)))

        # 3. Calibrated Ensemble Combined Score (0 - 100)
        combined_score = round(float((0.65 * rf_proba + 0.35 * anomaly_score) * 100.0), 1)
        combined_score = max(0.0, min(100.0, combined_score))

        # 4. Risk Classification Tier
        if combined_score < 30.0:
            risk_category = "LOW"
            action_recommendation = "Genuine Candidate / Auto-Approve"
            predicted_class = 0
        elif combined_score < 60.0:
            risk_category = "MEDIUM"
            action_recommendation = "Review Recommended / Low Risk Step-Up"
            predicted_class = 0
        elif combined_score < 80.0:
            risk_category = "HIGH"
            action_recommendation = "Suspicious / Analyst Review Required"
            predicted_class = 1
        else:
            risk_category = "CRITICAL"
            action_recommendation = "Urgent Investigation / Immediate Hold"
            predicted_class = 1

        # 5. Explainable AI decision reasons
        reasons = generate_explainability_reasons(row_dict, rf_proba, anomaly_score)

        return {
            "transaction_id": payload.transaction_id,
            "risk_score": combined_score,
            "risk_category": risk_category,
            "action_recommendation": action_recommendation,
            "predicted_class": predicted_class,
            "supervised_probability": round(rf_proba, 4),
            "anomaly_score": round(anomaly_score, 4),
            "reasons": reasons,
            "model_version": "v1.2.0",
            "detector": "ml_ensemble_random_forest_isolation_forest"
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}"
        )

@app.post("/retrain", tags=["Model Management"])
def retrain_models():
    try:
        from training.train_models import train_fraud_models
        metrics = train_fraud_models()
        load_artifacts()
        return {
            "status": "success",
            "message": "Models successfully retrained and reloaded into memory.",
            "metrics": metrics
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Retraining failed: {str(e)}"
        )
