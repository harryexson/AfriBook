import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { addDays, format, setHours, setMinutes } from 'npm:date-fns@3.0.0';

// Historical patterns for demand prediction
const DEMAND_PATTERNS = {
    weekday_morning_rush: { hours: [7, 8, 9], multiplier: 2.5, event: 'rush_hour' },
    weekday_evening_rush: { hours: [17, 18, 19], multiplier: 2.8, event: 'rush_hour' },
    weekend_night: { hours: [22, 23, 0, 1], multiplier: 2.0, event: 'weekend_night', days: [5, 6] }, // Fri, Sat
    lunch_hour: { hours: [12, 13], multiplier: 1.5, event: 'none' },
    late_night: { hours: [2, 3, 4, 5], multiplier: 0.3, event: 'none' }
};

// Calculate base demand for a time slot
function calculateBaseDemand(dayOfWeek, hour) {
    const baseRideCount = 100; // Base rides per hour
    let multiplier = 1.0;
    let eventType = 'none';

    // Check if it matches any pattern
    for (const [patternName, pattern] of Object.entries(DEMAND_PATTERNS)) {
        if (pattern.hours.includes(hour)) {
            // Check day restriction if exists
            if (pattern.days && !pattern.days.includes(dayOfWeek)) {
                continue;
            }
            
            multiplier = Math.max(multiplier, pattern.multiplier);
            if (pattern.event !== 'none') {
                eventType = pattern.event;
            }
        }
    }

    // Weekend adjustment
    if (dayOfWeek === 6 || dayOfWeek === 0) { // Sat, Sun
        multiplier *= 0.8; // Less weekday traffic
        if (hour >= 10 && hour <= 14) {
            multiplier *= 1.3; // Weekend brunch/shopping
        }
    }

    const predictedRides = Math.round(baseRideCount * multiplier);
    
    // Determine demand level
    let demandLevel = 'medium';
    if (multiplier >= 2.5) demandLevel = 'very_high';
    else if (multiplier >= 1.8) demandLevel = 'high';
    else if (multiplier >= 1.2) demandLevel = 'medium';
    else if (multiplier >= 0.6) demandLevel = 'low';
    else demandLevel = 'very_low';

    return {
        predictedRides,
        demandLevel,
        eventType,
        baseMultiplier: multiplier
    };
}

// Calculate guaranteed earnings based on demand
function calculateGuaranteedEarnings(demandLevel, timeSlotHours) {
    const hourlyRates = {
        very_high: 35,
        high: 30,
        medium: 25,
        low: 20,
        very_low: 15
    };

    return hourlyRates[demandLevel] * timeSlotHours;
}

// Calculate bonus multiplier
function calculateBonusMultiplier(demandLevel, driverGap) {
    if (demandLevel === 'very_high' && driverGap > 20) return 1.75; // 75% bonus
    if (demandLevel === 'very_high' && driverGap > 10) return 1.5; // 50% bonus
    if (demandLevel === 'high' && driverGap > 15) return 1.4; // 40% bonus
    if (demandLevel === 'high' && driverGap > 5) return 1.25; // 25% bonus
    if (demandLevel === 'medium' && driverGap > 10) return 1.15; // 15% bonus
    return 1.0; // No bonus
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user || user.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Unauthorized - Admin only' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const serviceClient = base44.asServiceRole;
        const { daysAhead = 7 } = await req.json().catch(() => ({}));

        const forecasts = [];
        const notifications = [];
        
        // Generate forecasts for next N days
        for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
            const forecastDate = addDays(new Date(), dayOffset);
            const dayOfWeek = forecastDate.getDay();
            const dayName = format(forecastDate, 'EEEE').toLowerCase();
            const dateStr = format(forecastDate, 'yyyy-MM-dd');

            // Generate forecasts for key time slots
            const timeSlots = [
                { start: '07:00', end: '10:00', hours: 3 }, // Morning rush
                { start: '12:00', end: '14:00', hours: 2 }, // Lunch
                { start: '17:00', end: '20:00', hours: 3 }, // Evening rush
                { start: '22:00', end: '02:00', hours: 4 }  // Night
            ];

            for (const slot of timeSlots) {
                const startHour = parseInt(slot.start.split(':')[0]);
                const demand = calculateBaseDemand(dayOfWeek, startHour);

                // Count already scheduled drivers for this slot
                const scheduledDrivers = await serviceClient.entities.DriverSchedule.filter({
                    schedule_date: dateStr,
                    start_time: { $lte: slot.start },
                    end_time: { $gte: slot.end },
                    status: { $in: ['scheduled', 'confirmed'] }
                });

                const availableDriversCount = scheduledDrivers.length;
                const driverGap = Math.max(0, Math.round(demand.predictedRides / 5) - availableDriversCount);
                const isHighDemand = demand.demandLevel === 'high' || demand.demandLevel === 'very_high';
                const needsMoreDrivers = driverGap > 3;

                const guaranteedEarnings = isHighDemand && needsMoreDrivers 
                    ? calculateGuaranteedEarnings(demand.demandLevel, slot.hours)
                    : 0;

                const bonusMultiplier = needsMoreDrivers 
                    ? calculateBonusMultiplier(demand.demandLevel, driverGap)
                    : 1.0;

                // Check if forecast already exists
                const existingForecast = await serviceClient.entities.DemandForecast.filter({
                    forecast_date: dateStr,
                    time_slot_start: slot.start,
                    time_slot_end: slot.end
                });

                const forecastData = {
                    forecast_date: dateStr,
                    time_slot_start: slot.start,
                    time_slot_end: slot.end,
                    day_of_week: dayName,
                    predicted_demand_level: demand.demandLevel,
                    predicted_ride_count: demand.predictedRides,
                    available_drivers_count: availableDriversCount,
                    driver_gap: driverGap,
                    is_high_demand: isHighDemand && needsMoreDrivers,
                    guaranteed_earnings_offered: guaranteedEarnings,
                    bonus_multiplier: bonusMultiplier,
                    event_type: demand.eventType,
                    drivers_signed_up_count: availableDriversCount
                };

                if (existingForecast.length > 0) {
                    await serviceClient.entities.DemandForecast.update(existingForecast[0].id, forecastData);
                } else {
                    await serviceClient.entities.DemandForecast.create(forecastData);
                }

                forecasts.push(forecastData);

                // Queue notification if high-demand and not yet notified
                if (isHighDemand && needsMoreDrivers && dayOffset <= 3) {
                    const shouldNotify = existingForecast.length === 0 || !existingForecast[0].notification_sent;
                    
                    if (shouldNotify) {
                        notifications.push({
                            date: dateStr,
                            dayName,
                            slot,
                            guaranteed: guaranteedEarnings,
                            bonus: bonusMultiplier,
                            gap: driverGap
                        });
                    }
                }
            }
        }

        // Send notifications to available drivers
        let notificationsSent = 0;
        if (notifications.length > 0) {
            const availableDrivers = await serviceClient.entities.User.filter({
                user_type: { $in: ['driver', 'both'] },
                status: 'active'
            });

            for (const driver of availableDrivers) {
                try {
                    const notificationText = notifications.map(n => 
                        `${n.dayName} ${n.date} (${n.slot.start}-${n.slot.end}): $${n.guaranteed} guaranteed${n.bonus > 1 ? `, ${((n.bonus - 1) * 100).toFixed(0)}% bonus` : ''}`
                    ).join('\n');

                    await serviceClient.integrations.Core.SendEmail({
                        to: driver.email,
                        subject: '🔥 High-Demand Slots Available - Guaranteed Earnings!',
                        body: `Hi ${driver.full_name},\n\nWe have high-demand slots available with guaranteed earnings and bonuses:\n\n${notificationText}\n\nSchedule your shifts now in the app to secure these earnings!\n\nBest regards,\nRide-ly Team`
                    });

                    notificationsSent++;
                } catch (emailError) {
                    console.error(`Failed to notify driver ${driver.id}:`, emailError);
                }
            }

            // Mark forecasts as notified
            for (const notif of notifications) {
                const forecast = await serviceClient.entities.DemandForecast.filter({
                    forecast_date: notif.date,
                    time_slot_start: notif.slot.start,
                    time_slot_end: notif.slot.end
                });

                if (forecast.length > 0) {
                    await serviceClient.entities.DemandForecast.update(forecast[0].id, {
                        notification_sent: true,
                        notification_sent_at: new Date().toISOString()
                    });
                }
            }
        }

        console.log(`[DEMAND FORECAST] Generated ${forecasts.length} forecasts, sent ${notificationsSent} notifications`);

        return new Response(JSON.stringify({
            success: true,
            forecasts_generated: forecasts.length,
            high_demand_slots: forecasts.filter(f => f.is_high_demand).length,
            notifications_sent: notificationsSent,
            forecasts: forecasts.filter(f => f.is_high_demand)
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[DEMAND FORECAST ERROR]:', error);
        return new Response(JSON.stringify({ 
            error: error.message,
            success: false
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});