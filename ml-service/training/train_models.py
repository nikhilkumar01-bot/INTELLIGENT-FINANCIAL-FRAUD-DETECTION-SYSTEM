"""
Machine Learning Training Pipeline
Trains:
1. Random Forest Classifier (Supervised fraud risk probability)
2. Isolation Forest (Unsupervised anomaly detection for zero-day/unseen fraud)
Saves models and full evaluation metrics to disk.
"""
import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

# Import generator from local module
import sys
sys.path.append(os.path.dirname(__file__))
from generate_dataset import generate_synthetic_transactions

def train_fraud_models():
    print("Generating synthetic financial dataset (6,000 transactions)...")
    df = generate_synthetic_transactions(n_samples=6000, random_seed=42)

    feature_cols_num = [
        'amount',
        'customer_avg_amount',
        'amount_to_avg_ratio',
        'tx_hour',
        'is_night_tx',
        'tx_velocity_1h',
        'is_new_device',
        'is_new_location',
        'historical_fraud_count',
        'days_since_last_tx'
    ]
    feature_cols_cat = ['channel', 'customer_risk_profile']

    X = df[feature_cols_num + feature_cols_cat]
    y = df['is_fraud']

    # Stratified 75% train, 25% test to strictly prevent data leakage
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    print(f"Dataset split: Train={len(X_train)} samples, Test={len(X_test)} samples")
    print(f"Train fraud count: {y_train.sum()}, Test fraud count: {y_test.sum()}")

    # Setup preprocessor
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), feature_cols_num),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), feature_cols_cat)
        ]
    )

    X_train_proc = preprocessor.fit_transform(X_train)
    X_test_proc = preprocessor.transform(X_test)

    # Get processed feature names
    cat_feature_names = list(preprocessor.named_transformers_['cat'].get_feature_names_out(feature_cols_cat))
    all_feature_names = feature_cols_num + cat_feature_names

    # 1. Random Forest Classifier
    print("Training Random Forest Classifier...")
    rf_model = RandomForestClassifier(
        n_estimators=120,
        max_depth=10,
        min_samples_split=4,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )
    rf_model.fit(X_train_proc, y_train)

    # 2. Isolation Forest (Trained on benign normal data to establish baseline)
    print("Training Isolation Forest Anomaly Detector...")
    normal_mask = (y_train == 0)
    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=0.07,
        max_samples='auto',
        random_state=42,
        n_jobs=-1
    )
    iso_forest.fit(X_train_proc[normal_mask])

    # 3. Model Evaluation on Held-Out Test Set
    print("Evaluating models on test dataset...")
    y_pred_proba = rf_model.predict_proba(X_test_proc)[:, 1]
    y_pred = (y_pred_proba >= 0.5).astype(int)

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred))
    rec = float(recall_score(y_test, y_pred))
    f1 = float(f1_score(y_test, y_pred))
    roc_auc = float(roc_auc_score(y_test, y_pred_proba))

    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = [int(v) for v in cm.ravel()]

    # Feature importances
    importances = rf_model.feature_importances_
    feat_importance_list = [
        {"feature": name, "importance": round(float(imp), 4)}
        for name, imp in sorted(zip(all_feature_names, importances), key=lambda x: x[1], reverse=True)
    ]

    metrics = {
        "model_name": "RandomForest_IsolationForest_Ensemble",
        "model_version": "v1.2.0",
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(roc_auc, 4),
        "confusion_matrix": {
            "true_negatives": tn,
            "false_positives": fp,
            "false_negatives": fn,
            "true_positives": tp
        },
        "false_positive_rate": round(fp / (fp + tn), 4) if (fp + tn) > 0 else 0.0,
        "false_negative_rate": round(fn / (fn + tp), 4) if (fn + tp) > 0 else 0.0,
        "feature_importances": feat_importance_list[:10],
        "all_features": all_feature_names
    }

    print("\n--- Model Evaluation Results ---")
    print(f"Accuracy:  {acc*100:.2f}%")
    print(f"Precision: {prec*100:.2f}%")
    print(f"Recall:    {rec*100:.2f}%")
    print(f"F1-Score:  {f1*100:.2f}%")
    print(f"ROC-AUC:   {roc_auc:.4f}")
    print(f"Confusion Matrix: TN={tn}, FP={fp}, FN={fn}, TP={tp}")
    print("--------------------------------\n")

    # Save artifacts
    models_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
    os.makedirs(models_dir, exist_ok=True)

    joblib.dump(rf_model, os.path.join(models_dir, 'rf_model.joblib'))
    joblib.dump(iso_forest, os.path.join(models_dir, 'iso_forest.joblib'))
    joblib.dump(preprocessor, os.path.join(models_dir, 'preprocessor.joblib'))

    with open(os.path.join(models_dir, 'metrics.json'), 'w') as f:
        json.dump(metrics, f, indent=2)

    print(f"Models and metrics successfully serialized to {models_dir}")
    return metrics

if __name__ == '__main__':
    train_fraud_models()
