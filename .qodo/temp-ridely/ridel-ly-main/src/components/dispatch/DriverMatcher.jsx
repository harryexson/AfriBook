import React from 'react';

// Advanced Driver Matching Algorithm
export class DriverMatchingService {
  
  // Haversine formula for calculating distance between two points
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  }
  
  static toRadians(degrees) {
    return degrees * (Math.PI/180);
  }

  // Calculate ETA based on distance and traffic conditions
  static calculateETA(distance, trafficMultiplier = 1.2) {
    const avgSpeed = 30; // Average city speed in km/h
    const baseTime = (distance / avgSpeed) * 60; // Minutes
    return Math.round(baseTime * trafficMultiplier);
  }

  // Driver scoring algorithm (similar to Uber's dispatch system)
  static calculateDriverScore(driver, rideRequest) {
    const distance = this.calculateDistance(
      driver.latitude, driver.longitude,
      rideRequest.pickup_latitude, rideRequest.pickup_longitude
    );
    
    // Score factors (weights can be adjusted)
    const distanceScore = Math.max(0, 100 - (distance * 10)); // Closer = better
    const ratingScore = (driver.average_rating || 4.5) * 20; // Rating out of 5 * 20
    const acceptanceScore = (driver.acceptance_rate || 0.8) * 100; // Acceptance rate
    const experienceScore = Math.min((driver.total_rides || 0) * 0.5, 50); // Experience bonus
    
    // Battery and network quality factors
    const batteryPenalty = driver.battery_level < 20 ? -20 : 0;
    const networkBonus = {
      'excellent': 10,
      'good': 5,
      'fair': 0,
      'poor': -10
    }[driver.network_quality] || 0;

    // Time since last ride (fresher drivers get slight preference)
    const timeSinceLastRide = driver.minutes_since_last_ride || 60;
    const freshnessBonus = Math.max(0, 30 - (timeSinceLastRide * 0.5));

    const totalScore = distanceScore + ratingScore + acceptanceScore + 
                      experienceScore + batteryPenalty + networkBonus + freshnessBonus;
    
    return {
      score: totalScore,
      distance: distance,
      eta: this.calculateETA(distance),
      factors: {
        distanceScore,
        ratingScore,
        acceptanceScore,
        experienceScore,
        batteryPenalty,
        networkBonus,
        freshnessBonus
      }
    };
  }

  // Find best drivers for a ride request
  static async findBestDrivers(rideRequest, availableDrivers, maxDrivers = 3) {
    const scoredDrivers = availableDrivers
      .map(driver => ({
        ...driver,
        matchData: this.calculateDriverScore(driver, rideRequest)
      }))
      .filter(driver => driver.matchData.distance <= 15) // Max 15km radius
      .sort((a, b) => b.matchData.score - a.matchData.score) // Highest score first
      .slice(0, maxDrivers);

    return scoredDrivers;
  }

  // H3 based spatial indexing (simplified)
  static getDriversInH3Neighbors(h3Index, driverLocations) {
    // In real implementation, would use actual H3 library
    // For demo, we'll use a simplified approach
    const [, lat, lng] = h3Index.split('_');
    const centerLat = parseFloat(lat);
    const centerLng = parseFloat(lng);
    
    // Find drivers within approximate hex neighbors (±0.01 degrees ≈ 1km)
    return driverLocations.filter(driver => {
      const latDiff = Math.abs(driver.latitude - centerLat);
      const lngDiff = Math.abs(driver.longitude - centerLng);
      return latDiff <= 0.02 && lngDiff <= 0.02; // Approximate neighboring hexes
    });
  }

  // Machine Learning dispatch simulation
  static async optimizeDispatch(rideRequest, availableDrivers) {
    // Simulate ML model predictions for:
    // 1. Driver acceptance probability
    // 2. ETA accuracy
    // 3. Rider satisfaction prediction
    // 4. Market demand patterns

    const predictions = availableDrivers.map(driver => {
      const baseAcceptanceRate = driver.acceptance_rate || 0.8;
      const distance = this.calculateDistance(
        driver.latitude, driver.longitude,
        rideRequest.pickup_latitude, rideRequest.pickup_longitude
      );

      // Simulate ML predictions
      const acceptanceProbability = Math.max(0.1, baseAcceptanceRate - (distance * 0.05));
      const etaAccuracy = Math.max(0.5, 1 - (distance * 0.02));
      const satisfactionPrediction = (driver.average_rating / 5) * acceptanceProbability;

      return {
        driver_id: driver.driver_id,
        acceptance_probability: acceptanceProbability,
        eta_accuracy: etaAccuracy,
        satisfaction_prediction: satisfactionPrediction,
        composite_score: acceptanceProbability * etaAccuracy * satisfactionPrediction
      };
    });

    return predictions.sort((a, b) => b.composite_score - a.composite_score);
  }
}

export default DriverMatchingService;