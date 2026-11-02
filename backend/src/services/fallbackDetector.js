/**
 * Transparent Fallback Heuristic Detector
 * Activates if the Python FastAPI ML microservice is unreachable.
 * Computes deterministic, explainable risk assessments without claiming to be a trained ML model.
 */
function evaluateFallbackRisk(tx) {
  const amount = Number(tx.amount) || 0;
  const custAvg = Number(tx.customerAvgAmount) || (amount > 0 ? amount : 100);
  const ratio = amount / (custAvg + 1e-5);
  const velocity = Number(tx.txVelocity1h) || 1;
  const isNewDevice = Number(tx.isNewDevice) || 0;
  const isNewLocation = Number(tx.isNewLocation) || 0;
  const txHour = Number(tx.txHour !== undefined ? tx.txHour : new Date(tx.timestamp || Date.now()).getHours());
  const isNight = [0, 1, 2, 3, 4, 5].includes(txHour) ? 1 : 0;
  const channel = (tx.channel || 'CARD').toUpperCase();
  const histFraud = Number(tx.historicalFraudCount) || 0;

  let baseRisk = 12.0; // Baseline low risk for standard commerce
  const reasons = [];

  // 1. Amount Deviation
  if (ratio >= 10.0) {
    baseRisk += 38.0;
    reasons.push(`Extreme amount anomaly: Transaction is ${ratio.toFixed(1)}x greater than customer baseline ($${custAvg.toFixed(2)}).`);
  } else if (ratio >= 4.0) {
    baseRisk += 24.0;
    reasons.push(`Elevated spending: Transaction is ${ratio.toFixed(1)}x customer's normal transaction average.`);
  } else if (ratio >= 2.0) {
    baseRisk += 10.0;
  }

  // 2. Velocity
  if (velocity >= 6) {
    baseRisk += 35.0;
    reasons.push(`Rapid transaction velocity: ${velocity} transactions observed within a 60-minute interval.`);
  } else if (velocity >= 3) {
    baseRisk += 16.0;
    reasons.push(`Above-average velocity: ${velocity} transactions initiated in past hour.`);
  }

  // 3. Device & Geolocation
  if (isNewDevice === 1 && isNewLocation === 1) {
    baseRisk += 28.0;
    reasons.push('Unrecognized device signature combined with unfamiliar geographical location.');
  } else if (isNewDevice === 1) {
    baseRisk += 14.0;
    reasons.push('Unrecognized device hardware fingerprint.');
  } else if (isNewLocation === 1) {
    baseRisk += 12.0;
    reasons.push('Unverified geolocation / remote IP address.');
  }

  // 4. Night Window
  if (isNight === 1) {
    baseRisk += 14.0;
    reasons.push(`Off-hours activity: Transaction executed during dormant midnight window (${txHour.toString().padStart(2, '0')}:00).`);
  }

  // 5. Wire Transfer Risk
  if (channel === 'WIRE_TRANSFER' && ratio > 3.0) {
    baseRisk += 15.0;
    reasons.push('High-value wire transfer significantly exceeds routine payment history.');
  }

  // 6. Account history
  if (histFraud > 0) {
    baseRisk += 15.0;
    reasons.push(`Customer account has ${histFraud} past flagged fraud incident(s).`);
  }

  const riskScore = Math.min(100.0, Math.max(0.0, Math.round(baseRisk * 10) / 10));

  let riskCategory = 'LOW';
  let predictedClass = 0;
  let actionRecommendation = 'Genuine Candidate / Auto-Approve';

  if (riskScore >= 80.0) {
    riskCategory = 'CRITICAL';
    predictedClass = 1;
    actionRecommendation = 'Urgent Investigation / Immediate Hold';
  } else if (riskScore >= 60.0) {
    riskCategory = 'HIGH';
    predictedClass = 1;
    actionRecommendation = 'Suspicious / Analyst Review Required';
  } else if (riskScore >= 30.0) {
    riskCategory = 'MEDIUM';
    predictedClass = 0;
    actionRecommendation = 'Review Recommended / Step-Up Auth';
  }

  if (reasons.length === 0) {
    reasons.push('Transaction metrics align with customer normal spending parameters.');
  }

  return {
    riskScore,
    riskCategory,
    actionRecommendation,
    predictedClass,
    supervisedProbability: Math.round((riskScore / 100) * 1000) / 1000,
    anomalyScore: Math.round((riskScore > 50 ? (riskScore - 20) / 100 : 0.15) * 1000) / 1000,
    reasons,
    modelVersion: 'v1.0-embedded-engine',
    detector: 'rule_based_fallback'
  };
}

module.exports = { evaluateFallbackRisk };
