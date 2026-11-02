"""
Synthetic Financial Transaction Dataset Generator
Produces reproducible, realistic transactions with clean distributions, edge cases,
and labeled fraud scenarios (velocity bursts, abnormal amounts, novel devices, location leaps).
"""
import numpy as np
import pandas as pd
import random
import os

def generate_synthetic_transactions(n_samples=6000, random_seed=42):
    np.random.seed(random_seed)
    random.seed(random_seed)

    channels = ['CARD', 'ONLINE', 'WIRE_TRANSFER', 'ATM', 'UPI']
    customer_risk_levels = ['LOW', 'MEDIUM', 'HIGH']

    records = []

    for i in range(n_samples):
        # 1. Customer baseline attributes
        customer_risk = np.random.choice(customer_risk_levels, p=[0.75, 0.20, 0.05])
        
        # Base customer spending habit
        tier = np.random.choice(['student', 'middle_class', 'affluent', 'business'], p=[0.3, 0.45, 0.2, 0.05])
        if tier == 'student':
            cust_avg = np.random.uniform(15, 80)
        elif tier == 'middle_class':
            cust_avg = np.random.uniform(80, 400)
        elif tier == 'affluent':
            cust_avg = np.random.uniform(400, 2500)
        else:
            cust_avg = np.random.uniform(2500, 12000)

        # Fraud probability assignment based on synthetic scenario
        # Target fraud rate roughly 7-8% reflecting real financial fraud rates in monitored streams
        scenario = np.random.choice([
            'normal_routine',
            'legit_high_value',
            'fraud_account_takeover',
            'fraud_velocity_burst',
            'fraud_midnight_drain',
            'fraud_card_testing'
        ], p=[0.85, 0.07, 0.03, 0.02, 0.015, 0.015])

        if scenario == 'normal_routine':
            # Regular spending
            amount = max(5.0, np.random.normal(cust_avg, cust_avg * 0.25))
            tx_hour = int(np.random.choice(range(7, 23)))
            tx_velocity_1h = int(np.random.choice([1, 1, 1, 2, 3], p=[0.7, 0.15, 0.1, 0.04, 0.01]))
            is_new_device = int(np.random.choice([0, 1], p=[0.96, 0.04]))
            is_new_location = int(np.random.choice([0, 1], p=[0.95, 0.05]))
            channel = np.random.choice(channels, p=[0.35, 0.35, 0.05, 0.15, 0.10])
            hist_fraud = 0
            days_since_last = float(np.random.exponential(scale=1.5))
            label = 0

        elif scenario == 'legit_high_value':
            # Legitimate large purchase (e.g., flight, electronics, hospital) - High amount, but familiar device, daytime, low velocity!
            multiplier = np.random.uniform(3.0, 8.0)
            amount = cust_avg * multiplier
            tx_hour = int(np.random.choice(range(9, 21)))
            tx_velocity_1h = 1
            is_new_device = 0
            is_new_location = int(np.random.choice([0, 1], p=[0.85, 0.15]))
            channel = np.random.choice(['CARD', 'ONLINE', 'WIRE_TRANSFER'], p=[0.4, 0.4, 0.2])
            hist_fraud = 0
            days_since_last = float(np.random.uniform(0.5, 7.0))
            label = 0  # CRITICAL: genuine high value to train false positive reduction!

        elif scenario == 'fraud_account_takeover':
            # Sudden takeover: massive amount, completely new device & location, wire transfer
            multiplier = np.random.uniform(7.0, 25.0)
            amount = cust_avg * multiplier
            tx_hour = int(np.random.choice([23, 0, 1, 2, 3, 4, 5, 14, 15]))
            tx_velocity_1h = int(np.random.choice([2, 3, 4, 6]))
            is_new_device = 1
            is_new_location = 1
            channel = np.random.choice(['WIRE_TRANSFER', 'ONLINE'], p=[0.7, 0.3])
            hist_fraud = int(np.random.choice([0, 1], p=[0.8, 0.2]))
            days_since_last = float(np.random.uniform(0.01, 0.2))
            label = 1

        elif scenario == 'fraud_velocity_burst':
            # Rapid sequential transactions in under an hour (bot or stolen card)
            amount = cust_avg * np.random.uniform(1.2, 4.5)
            tx_hour = int(np.random.choice(range(24)))
            tx_velocity_1h = int(np.random.choice([5, 6, 7, 8, 10, 14]))
            is_new_device = int(np.random.choice([0, 1], p=[0.3, 0.7]))
            is_new_location = int(np.random.choice([0, 1], p=[0.4, 0.6]))
            channel = np.random.choice(['ONLINE', 'CARD'], p=[0.7, 0.3])
            hist_fraud = int(np.random.choice([0, 1], p=[0.7, 0.3]))
            days_since_last = 0.02
            label = 1

        elif scenario == 'fraud_midnight_drain':
            # 2 AM - 5 AM wire transfer / ATM max drain
            amount = cust_avg * np.random.uniform(5.0, 18.0)
            tx_hour = int(np.random.choice([0, 1, 2, 3, 4]))
            tx_velocity_1h = int(np.random.choice([2, 3, 4]))
            is_new_device = 1
            is_new_location = int(np.random.choice([0, 1], p=[0.2, 0.8]))
            channel = np.random.choice(['ATM', 'WIRE_TRANSFER'], p=[0.5, 0.5])
            hist_fraud = int(np.random.choice([0, 1], p=[0.8, 0.2]))
            days_since_last = float(np.random.uniform(0.1, 1.0))
            label = 1

        else: # fraud_card_testing
            # Tiny amounts rapidly tested against an online merchant
            amount = np.random.uniform(1.0, 15.0)
            tx_hour = int(np.random.choice(range(24)))
            tx_velocity_1h = int(np.random.choice([6, 7, 9, 12, 15]))
            is_new_device = 1
            is_new_location = int(np.random.choice([0, 1], p=[0.2, 0.8]))
            channel = 'ONLINE'
            hist_fraud = 0
            days_since_last = 0.01
            label = 1

        is_night_tx = 1 if tx_hour in [0, 1, 2, 3, 4, 5] else 0
        amount_to_avg_ratio = amount / (cust_avg + 1e-5)

        # Introduce realistic borderline noise (2-3% ambiguous cases)
        noise_flip = np.random.uniform(0, 1)
        if scenario == 'legit_high_value' and noise_flip < 0.08:
            # Borderline legitimate that looks suspicious (e.g. new device used while travelling)
            is_new_device = 1
        elif scenario == 'normal_routine' and noise_flip < 0.02:
            # Unusual hour for normal transaction
            is_night_tx = 1
            tx_hour = 1
        elif scenario == 'fraud_velocity_burst' and noise_flip < 0.05:
            # Subtle low velocity fraud
            tx_velocity_1h = 3

        records.append({
            'amount': round(float(amount), 2),
            'customer_avg_amount': round(float(cust_avg), 2),
            'amount_to_avg_ratio': round(float(amount_to_avg_ratio), 4),
            'tx_hour': int(tx_hour),
            'is_night_tx': int(is_night_tx),
            'tx_velocity_1h': int(tx_velocity_1h),
            'is_new_device': int(is_new_device),
            'is_new_location': int(is_new_location),
            'channel': str(channel),
            'customer_risk_profile': str(customer_risk),
            'historical_fraud_count': int(hist_fraud),
            'days_since_last_tx': round(float(days_since_last), 4),
            'is_fraud': int(label)
        })

    df = pd.DataFrame(records)
    return df

if __name__ == '__main__':
    data_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'sample-data')
    os.makedirs(data_dir, exist_ok=True)
    df = generate_synthetic_transactions(n_samples=6000, random_seed=42)
    csv_path = os.path.join(data_dir, 'synthetic_training_data.csv')
    df.to_csv(csv_path, index=False)
    print(f"Generated {len(df)} transactions. Fraud rate: {df['is_fraud'].mean()*100:.2f}%. Saved to {csv_path}")
