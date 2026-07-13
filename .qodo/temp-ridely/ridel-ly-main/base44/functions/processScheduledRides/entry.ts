import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Cron job to process scheduled rides
 * - Assigns drivers to scheduled rides 2 hours before pickup
 * - Creates rides from recurring schedules
 * - Sends reminder notifications
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify admin/service access
        const user = await base44.auth.me().catch(() => null);
        if (user && user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const serviceClient = base44.asServiceRole;
        const now = new Date();
        
        const results = {
            scheduled_rides_processed: 0,
            drivers_assigned: 0,
            recurring_rides_created: 0,
            notifications_sent: 0,
            errors: []
        };

        console.log(`[SCHEDULED RIDES] Processing at ${now.toISOString()}`);

        // Part 1: Assign drivers to scheduled rides (2 hours before pickup)
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const twoHours15FromNow = new Date(now.getTime() + 2.25 * 60 * 60 * 1000);

        const ridesNeedingDrivers = await serviceClient.entities.Ride.filter({
            status: 'scheduled',
            driver_id: null,
            scheduled_time: {
                $gte: twoHoursFromNow.toISOString(),
                $lte: twoHours15FromNow.toISOString()
            }
        });

        console.log(`[SCHEDULED RIDES] Found ${ridesNeedingDrivers.length} rides needing driver assignment`);

        for (const ride of ridesNeedingDrivers) {
            try {
                results.scheduled_rides_processed++;

                // Find available driver
                const dispatchResult = await serviceClient.functions.invoke('findAvailableDrivers', {
                    rideId: ride.id,
                    isScheduled: true
                });

                if (dispatchResult?.success) {
                    results.drivers_assigned++;
                    
                    // Send confirmation to rider
                    const rider = await serviceClient.entities.User.get(ride.rider_id);
                    await serviceClient.integrations.Core.SendEmail({
                        to: rider.email,
                        subject: '✅ Driver Assigned for Your Scheduled Ride',
                        body: `Hi ${rider.full_name},\n\nGood news! A driver has been assigned for your scheduled ride:\n\n📅 Pickup Time: ${new Date(ride.scheduled_time).toLocaleString()}\n📍 Pickup: ${ride.pickup_location.address}\n📍 Destination: ${ride.destination.address}\n💰 Guaranteed Fare: $${ride.fare.total_fare.toFixed(2)}\n\nYour driver will arrive on time. We'll send you a reminder 30 minutes before pickup.\n\nThank you for choosing Ride-ly!\n\nBest regards,\nRide-ly Team`
                    });

                    results.notifications_sent++;
                } else {
                    console.warn(`[SCHEDULED RIDES] Could not assign driver for ride ${ride.id}`);
                }
            } catch (error) {
                console.error(`[SCHEDULED RIDES] Error processing ride ${ride.id}:`, error);
                results.errors.push(`Ride ${ride.id}: ${error.message}`);
            }
        }

        // Part 2: Send 30-minute reminders
        const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
        const thirtyFiveMinutesFromNow = new Date(now.getTime() + 35 * 60 * 1000);

        const ridesNeedingReminders = await serviceClient.entities.Ride.filter({
            status: 'scheduled',
            driver_id: { $ne: null },
            scheduled_time: {
                $gte: thirtyMinutesFromNow.toISOString(),
                $lte: thirtyFiveMinutesFromNow.toISOString()
            }
        });

        for (const ride of ridesNeedingReminders) {
            try {
                const rider = await serviceClient.entities.User.get(ride.rider_id);
                const driver = await serviceClient.entities.User.get(ride.driver_id);

                await serviceClient.integrations.Core.SendEmail({
                    to: rider.email,
                    subject: '🚗 Your Ride is Coming Soon!',
                    body: `Hi ${rider.full_name},\n\nYour scheduled ride is 30 minutes away!\n\n📅 Pickup Time: ${new Date(ride.scheduled_time).toLocaleString()}\n📍 Pickup Location: ${ride.pickup_location.address}\n\n🚗 Your Driver:\nName: ${driver.full_name}\nVehicle: ${driver.driver_info?.vehicle_make} ${driver.driver_info?.vehicle_model}\nLicense Plate: ${driver.driver_info?.license_plate}\nRating: ${driver.average_rating?.toFixed(1)} ⭐\n\nPlease be ready at the pickup location.\n\nBest regards,\nRide-ly Team`
                });

                results.notifications_sent++;
            } catch (error) {
                console.error(`[SCHEDULED RIDES] Error sending reminder for ride ${ride.id}:`, error);
                results.errors.push(`Reminder ${ride.id}: ${error.message}`);
            }
        }

        // Part 3: Create rides from recurring schedules
        const activeSchedules = await serviceClient.entities.RecurringSchedule.filter({
            is_active: true
        });

        console.log(`[SCHEDULED RIDES] Found ${activeSchedules.length} active recurring schedules`);

        for (const schedule of activeSchedules) {
            try {
                // Check if we should create a ride for today
                const today = new Date();
                const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'lowercase' });
                
                let shouldCreateRide = false;

                if (schedule.recurrence_pattern === 'daily') {
                    shouldCreateRide = true;
                } else if (schedule.recurrence_pattern === 'weekdays') {
                    shouldCreateRide = !['saturday', 'sunday'].includes(dayOfWeek);
                } else if (schedule.recurrence_pattern === 'weekends') {
                    shouldCreateRide = ['saturday', 'sunday'].includes(dayOfWeek);
                } else if (schedule.recurrence_pattern === 'weekly' || schedule.recurrence_pattern === 'custom') {
                    shouldCreateRide = schedule.days_of_week?.includes(dayOfWeek);
                }

                // Check if within date range
                const startDate = new Date(schedule.start_date);
                startDate.setHours(0, 0, 0, 0);
                const endDate = schedule.end_date ? new Date(schedule.end_date) : null;
                
                if (today < startDate) {
                    shouldCreateRide = false;
                }
                if (endDate && today > endDate) {
                    shouldCreateRide = false;
                }

                if (!shouldCreateRide) continue;

                // Check if ride already created for today
                const [hours, minutes] = schedule.scheduled_time.split(':');
                const scheduledDateTime = new Date();
                scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                const existingRide = await serviceClient.entities.Ride.filter({
                    rider_id: schedule.user_id,
                    status: 'scheduled',
                    scheduled_time: scheduledDateTime.toISOString()
                });

                if (existingRide.length > 0) {
                    console.log(`[SCHEDULED RIDES] Ride already exists for schedule ${schedule.id} today`);
                    continue;
                }

                // Create the ride
                const rideData = {
                    rider_id: schedule.user_id,
                    pickup_location: schedule.pickup_location,
                    destination: schedule.destination,
                    ride_type: schedule.ride_type,
                    status: 'scheduled',
                    scheduled_time: scheduledDateTime.toISOString(),
                    fare: {
                        base_fare: 12.50, // Base fare for recurring rides
                        surge_multiplier: 1.0
                    },
                    ride_preferences: schedule.ride_preferences || {},
                    notes: `Created from recurring schedule: ${schedule.schedule_name}`
                };

                const newRide = await serviceClient.entities.Ride.create(rideData);

                // Update schedule
                await serviceClient.entities.RecurringSchedule.update(schedule.id, {
                    last_ride_created: scheduledDateTime.toISOString(),
                    total_rides_created: (schedule.total_rides_created || 0) + 1
                });

                results.recurring_rides_created++;

                // Send confirmation email
                const user = await serviceClient.entities.User.get(schedule.user_id);
                await serviceClient.integrations.Core.SendEmail({
                    to: user.email,
                    subject: `✅ Recurring Ride Created: ${schedule.schedule_name}`,
                    body: `Hi ${user.full_name},\n\nYour recurring ride "${schedule.schedule_name}" has been scheduled for today:\n\n📅 Time: ${scheduledDateTime.toLocaleTimeString()}\n📍 From: ${schedule.pickup_location.address}\n📍 To: ${schedule.destination.address}\n🚗 Type: ${schedule.ride_type}\n\nA driver will be assigned 2 hours before pickup.\n\nBest regards,\nRide-ly Team`
                });

                results.notifications_sent++;
                console.log(`[SCHEDULED RIDES] ✅ Created ride from schedule ${schedule.id}`);

            } catch (error) {
                console.error(`[SCHEDULED RIDES] Error processing schedule ${schedule.id}:`, error);
                results.errors.push(`Schedule ${schedule.id}: ${error.message}`);
            }
        }

        console.log('[SCHEDULED RIDES] ✅ Processing complete:', JSON.stringify(results, null, 2));

        return Response.json({
            success: true,
            timestamp: now.toISOString(),
            ...results
        });

    } catch (error) {
        console.error('[SCHEDULED RIDES] ❌ Fatal error:', error);
        return Response.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
});