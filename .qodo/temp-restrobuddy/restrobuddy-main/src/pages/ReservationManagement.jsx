import React, { useState, useEffect } from "react";
import { Reservation } from "@/entities/Reservation";
import { WaitlistEntry } from "@/entities/WaitlistEntry";
import { Table } from "@/entities/Table";
import { Restaurant } from "@/entities/Restaurant";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  Users,
  Phone,
  XCircle,
  AlertCircle,
  Plus,
  Search,
  MessageSquare,
  UserCheck,
  Utensils,
  MapPin,
  Star,
  List
} from "lucide-react";
import { format, parseISO } from "date-fns";

export default function ReservationManagement() {
  const [restaurant, setRestaurant] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showReservationDialog, setShowReservationDialog] = useState(false);
  const [showWaitlistDialog, setShowWaitlistDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [newReservation, setNewReservation] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    party_size: 2,
    reservation_date: format(new Date(), 'yyyy-MM-dd'),
    reservation_time: "19:00",
    special_requests: "",
    occasion: "none",
    booking_source: "phone"
  });

  const [newWaitlistEntry, setNewWaitlistEntry] = useState({
    customer_name: "",
    customer_phone: "",
    party_size: 2,
    special_requests: "",
    notification_method: "sms",
    seating_preference: "any"
  });

  useEffect(() => {
    loadData();
    // Poll every 30 seconds for real-time updates
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      const restaurants = await Restaurant.filter({ owner_email: user.email });
      
      if (restaurants.length > 0) {
        const rest = restaurants[0];
        setRestaurant(rest);

        // Load reservations for selected date
        const allReservations = await Reservation.filter({ restaurant_id: rest.id });
        const dateReservations = allReservations.filter(r => r.reservation_date === selectedDate);
        setReservations(dateReservations.sort((a, b) => 
          a.reservation_time.localeCompare(b.reservation_time)
        ));

        // Load waitlist (only active entries)
        const allWaitlistEntries = await WaitlistEntry.filter({ 
          restaurant_id: rest.id
        });
        const activeWaitlist = allWaitlistEntries.filter(w => 
          ["waiting", "notified", "ready"].includes(w.status)
        );
        setWaitlist(activeWaitlist.sort((a, b) => a.position - b.position));

        // Load tables
        const tableList = await Table.list();
        setTables(tableList);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleCreateReservation = async () => {
    try {
      const confirmationCode = `RES-${Date.now().toString(36).toUpperCase()}`;
      const datetime = parseISO(`${newReservation.reservation_date}T${newReservation.reservation_time}`);
      
      const reservation = await Reservation.create({
        ...newReservation,
        restaurant_id: restaurant.id,
        confirmation_code: confirmationCode,
        reservation_datetime: datetime.toISOString(),
        status: "confirmed"
      });

      // Send confirmation SMS
      try {
        await base44.functions.invoke('sendReservationNotifications', {
          reservationId: reservation.id,
          notificationType: 'confirmation'
        });
      } catch (smsError) {
        console.error('Failed to send confirmation SMS:', smsError);
        // Continue even if SMS fails
      }
      
      setShowReservationDialog(false);
      setNewReservation({
        customer_name: "",
        customer_phone: "",
        customer_email: "",
        party_size: 2,
        reservation_date: format(new Date(), 'yyyy-MM-dd'),
        reservation_time: "19:00",
        special_requests: "",
        occasion: "none",
        booking_source: "phone"
      });
      
      await loadData();
      alert(`Reservation created! Confirmation code: ${confirmationCode}\nConfirmation SMS sent to ${newReservation.customer_phone}`);
    } catch (error) {
      console.error("Error creating reservation:", error);
      alert("Failed to create reservation");
    }
  };

  const handleAddToWaitlist = async () => {
    try {
      const position = waitlist.length + 1;
      const estimatedWait = position * 15; // 15 min per party average
      
      const entry = await WaitlistEntry.create({
        ...newWaitlistEntry,
        restaurant_id: restaurant.id,
        status: "waiting",
        position: position,
        estimated_wait_time: estimatedWait,
        quoted_wait_time: estimatedWait,
        join_time: new Date().toISOString()
      });

      // Send waitlist joined SMS
      try {
        await base44.functions.invoke('sendWaitlistNotifications', {
          waitlistId: entry.id,
          notificationType: 'joined',
          position: position,
          estimatedWait: estimatedWait
        });
      } catch (smsError) {
        console.error('Failed to send waitlist SMS:', smsError);
      }

      setShowWaitlistDialog(false);
      setNewWaitlistEntry({
        customer_name: "",
        customer_phone: "",
        party_size: 2,
        special_requests: "",
        notification_method: "sms",
        seating_preference: "any"
      });
      
      await loadData();
      alert(`Added to waitlist! Position #${position}, estimated wait: ${estimatedWait} minutes\nSMS notification sent.`);
    } catch (error) {
      console.error("Error adding to waitlist:", error);
      alert("Failed to add to waitlist");
    }
  };

  const handleCheckIn = async (reservation) => {
    try {
      await Reservation.update(reservation.id, {
        status: "checked_in",
        checked_in_at: new Date().toISOString()
      });
      await loadData();
    } catch (error) {
      console.error("Error checking in:", error);
    }
  };

  const handleSeatGuest = async (item, tableId, isReservation = true) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    try {
      const Entity = isReservation ? Reservation : WaitlistEntry;
      const now = new Date().toISOString();
      
      await Entity.update(item.id, {
        status: "seated",
        table_id: tableId,
        table_number: table.table_number,
        seated_at: now,
        ...(isReservation ? {} : {
          actual_wait_time: Math.round((new Date(now) - new Date(item.join_time)) / 60000)
        })
      });

      // Update table status
      await Table.update(tableId, {
        status: "occupied",
        current_order_id: item.id,
        seated_at: now,
        party_size: item.party_size
      });

      await loadData();
    } catch (error) {
      console.error("Error seating guest:", error);
    }
  };

  const handleNotifyGuest = async (entry) => {
    try {
      // Determine notification type based on position
      let notificationType = 'position_update';
      if (entry.position === 1) {
        notificationType = 'table_ready';
      } else if (entry.position <= 2) {
        notificationType = 'almost_ready';
      }

      await base44.functions.invoke('sendWaitlistNotifications', {
        waitlistId: entry.id,
        notificationType: notificationType,
        position: entry.position,
        estimatedWait: entry.estimated_wait_time
      });

      await WaitlistEntry.update(entry.id, {
        status: notificationType === 'table_ready' ? 'ready' : 'notified',
        notified_at: new Date().toISOString(),
        notification_sent: true
      });

      alert(`Guest ${entry.customer_name} notified via ${entry.notification_method}`);
      await loadData();
    } catch (error) {
      console.error("Error notifying guest:", error);
      alert("Failed to send notification");
    }
  };

  const handleSendReminders = async (reservation, reminderType) => {
    try {
      await base44.functions.invoke('sendReservationNotifications', {
        reservationId: reservation.id,
        notificationType: reminderType
      });
      
      alert(`${reminderType === 'reminder_24h' ? '24-hour' : '1-hour'} reminder sent to ${reservation.customer_name}`);
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Failed to send reminder');
    }
  };

  const handleCancelReservation = async (reservation) => {
    if (!confirm("Cancel this reservation?")) return;
    
    try {
      await Reservation.update(reservation.id, {
        status: "cancelled"
      });
      await loadData();
    } catch (error) {
      console.error("Error cancelling:", error);
    }
  };

  const handleNoShow = async (item, isReservation = true) => {
    try {
      const Entity = isReservation ? Reservation : WaitlistEntry;
      await Entity.update(item.id, {
        status: "no_show"
      });
      await loadData();
    } catch (error) {
      console.error("Error marking no-show:", error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      checked_in: "bg-purple-100 text-purple-800",
      seated: "bg-green-100 text-green-800",
      completed: "bg-slate-100 text-slate-800",
      cancelled: "bg-red-100 text-red-800",
      no_show: "bg-orange-100 text-orange-800",
      waiting: "bg-amber-100 text-amber-800",
      notified: "bg-blue-100 text-blue-800",
      ready: "bg-green-100 text-green-800"
    };
    return colors[status] || "bg-slate-100 text-slate-800";
  };

  const stats = {
    totalReservations: reservations.length,
    checkedIn: reservations.filter(r => r.status === "checked_in").length,
    seated: reservations.filter(r => r.status === "seated").length,
    waitlistSize: waitlist.length,
    availableTables: tables.filter(t => t.status === "available").length
  };

  const filteredReservations = reservations.filter(r =>
    r.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.customer_phone.includes(searchQuery) ||
    r.confirmation_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredWaitlist = waitlist.filter(w =>
    w.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.customer_phone.includes(searchQuery)
  );

  const availableTables = tables.filter(t => t.status === "available");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-12">
          <p className="text-2xl font-bold text-slate-900 mb-4">No Restaurant Found</p>
          <p className="text-slate-600">Please set up your restaurant first</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Reservations & Waitlist</h1>
            <p className="text-slate-600">Manage bookings and walk-ins for {restaurant.business_name}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-48"
            />
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold mb-1">{stats.totalReservations}</div>
              <div className="text-blue-100 text-sm">Reservations</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold mb-1">{stats.checkedIn}</div>
              <div className="text-purple-100 text-sm">Checked In</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Utensils className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold mb-1">{stats.seated}</div>
              <div className="text-green-100 text-sm">Currently Seated</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <List className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold mb-1">{stats.waitlistSize}</div>
              <div className="text-amber-100 text-sm">On Waitlist</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold mb-1">{stats.availableTables}</div>
              <div className="text-emerald-100 text-sm">Tables Free</div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, or confirmation code..."
              className="pl-10"
            />
          </div>
          
          <Dialog open={showReservationDialog} onOpenChange={setShowReservationDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Calendar className="w-4 h-4 mr-2" />
                New Reservation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Reservation</DialogTitle>
              </DialogHeader>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Customer Name *</Label>
                  <Input
                    value={newReservation.customer_name}
                    onChange={(e) => setNewReservation({...newReservation, customer_name: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label>Phone Number *</Label>
                  <Input
                    value={newReservation.customer_phone}
                    onChange={(e) => setNewReservation({...newReservation, customer_phone: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newReservation.customer_email}
                    onChange={(e) => setNewReservation({...newReservation, customer_email: e.target.value})}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label>Party Size *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newReservation.party_size}
                    onChange={(e) => setNewReservation({...newReservation, party_size: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={newReservation.reservation_date}
                    onChange={(e) => setNewReservation({...newReservation, reservation_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Time *</Label>
                  <Input
                    type="time"
                    value={newReservation.reservation_time}
                    onChange={(e) => setNewReservation({...newReservation, reservation_time: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Occasion</Label>
                  <Select
                    value={newReservation.occasion}
                    onValueChange={(value) => setNewReservation({...newReservation, occasion: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Special Occasion</SelectItem>
                      <SelectItem value="birthday">Birthday</SelectItem>
                      <SelectItem value="anniversary">Anniversary</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="date_night">Date Night</SelectItem>
                      <SelectItem value="celebration">Celebration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Source</Label>
                  <Select
                    value={newReservation.booking_source}
                    onValueChange={(value) => setNewReservation({...newReservation, booking_source: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="walk_in">Walk-in</SelectItem>
                      <SelectItem value="app">Mobile App</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>Special Requests</Label>
                  <Textarea
                    value={newReservation.special_requests}
                    onChange={(e) => setNewReservation({...newReservation, special_requests: e.target.value})}
                    placeholder="High chair, wheelchair access, window seat, etc."
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowReservationDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCreateReservation} className="flex-1 bg-blue-600">
                  Create Reservation
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showWaitlistDialog} onOpenChange={setShowWaitlistDialog}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="w-4 h-4 mr-2" />
                Add to Waitlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add to Waitlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Customer Name *</Label>
                  <Input
                    value={newWaitlistEntry.customer_name}
                    onChange={(e) => setNewWaitlistEntry({...newWaitlistEntry, customer_name: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label>Phone Number *</Label>
                  <Input
                    value={newWaitlistEntry.customer_phone}
                    onChange={(e) => setNewWaitlistEntry({...newWaitlistEntry, customer_phone: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <Label>Party Size *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newWaitlistEntry.party_size}
                    onChange={(e) => setNewWaitlistEntry({...newWaitlistEntry, party_size: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Notification Method</Label>
                  <Select
                    value={newWaitlistEntry.notification_method}
                    onValueChange={(value) => setNewWaitlistEntry({...newWaitlistEntry, notification_method: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">Text Message (SMS)</SelectItem>
                      <SelectItem value="call">Phone Call</SelectItem>
                      <SelectItem value="in_person">In Person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Seating Preference</Label>
                  <Select
                    value={newWaitlistEntry.seating_preference}
                    onValueChange={(value) => setNewWaitlistEntry({...newWaitlistEntry, seating_preference: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Available</SelectItem>
                      <SelectItem value="indoor">Indoor</SelectItem>
                      <SelectItem value="outdoor">Outdoor</SelectItem>
                      <SelectItem value="bar">Bar</SelectItem>
                      <SelectItem value="booth">Booth</SelectItem>
                      <SelectItem value="window">Window</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Special Requests</Label>
                  <Textarea
                    value={newWaitlistEntry.special_requests}
                    onChange={(e) => setNewWaitlistEntry({...newWaitlistEntry, special_requests: e.target.value})}
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowWaitlistDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleAddToWaitlist} className="flex-1 bg-amber-600">
                  Add to Waitlist
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="reservations">
          <TabsList>
            <TabsTrigger value="reservations">
              <Calendar className="w-4 h-4 mr-2" />
              Reservations ({filteredReservations.length})
            </TabsTrigger>
            <TabsTrigger value="waitlist">
              <List className="w-4 h-4 mr-2" />
              Waitlist ({filteredWaitlist.length})
            </TabsTrigger>
          </TabsList>

          {/* Reservations Tab */}
          <TabsContent value="reservations">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6">
                {filteredReservations.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg">No reservations for this date</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredReservations.map(reservation => (
                      <Card key={reservation.id} className="border-2">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-slate-900">
                                  {reservation.customer_name}
                                </h3>
                                {reservation.vip && (
                                  <Badge className="bg-amber-500">
                                    <Star className="w-3 h-3 mr-1" />
                                    VIP
                                  </Badge>
                                )}
                                <Badge className={getStatusColor(reservation.status)}>
                                  {reservation.status.replace('_', ' ')}
                                </Badge>
                                {reservation.occasion !== "none" && (
                                  <Badge variant="outline" className="capitalize">
                                    🎉 {reservation.occasion}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="grid md:grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Clock className="w-4 h-4" />
                                  <span>{reservation.reservation_time}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Users className="w-4 h-4" />
                                  <span>{reservation.party_size} guests</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Phone className="w-4 h-4" />
                                  <span>{reservation.customer_phone}</span>
                                </div>
                              </div>

                              {reservation.table_number && (
                                <div className="mt-2">
                                  <Badge className="bg-emerald-100 text-emerald-800">
                                    Table {reservation.table_number}
                                  </Badge>
                                </div>
                              )}

                              {reservation.special_requests && (
                                <p className="text-sm text-slate-600 mt-2 italic">
                                  Note: {reservation.special_requests}
                                </p>
                              )}

                              {reservation.confirmation_code && (
                                <p className="text-xs text-slate-500 mt-2">
                                  Confirmation: {reservation.confirmation_code}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col gap-2">
                              {reservation.status === "confirmed" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleCheckIn(reservation)}
                                    className="bg-purple-600"
                                  >
                                    <UserCheck className="w-4 h-4 mr-2" />
                                    Check In
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSendReminders(reservation, 'reminder_1h')}
                                    className="text-blue-600"
                                  >
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Send Reminder
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCancelReservation(reservation)}
                                    className="text-red-600"
                                  >
                                    Cancel
                                  </Button>
                                </>
                              )}

                              {reservation.status === "checked_in" && availableTables.length > 0 && (
                                <Select onValueChange={(tableId) => handleSeatGuest(reservation, tableId, true)}>
                                  <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Assign Table" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableTables.map(table => (
                                      <SelectItem key={table.id} value={table.id}>
                                        Table {table.table_number} ({table.capacity} seats)
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}

                              {reservation.status === "seated" && (
                                <Badge className="bg-green-600 text-white">
                                  Currently Dining
                                </Badge>
                              )}

                              {["confirmed", "checked_in"].includes(reservation.status) && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleNoShow(reservation, true)}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  No Show
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Waitlist Tab */}
          <TabsContent value="waitlist">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6">
                {filteredWaitlist.length === 0 ? (
                  <div className="text-center py-12">
                    <List className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg">No one on waitlist</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredWaitlist.map((entry, index) => (
                      <Card key={entry.id} className="border-2 border-amber-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge className="bg-amber-600 text-white text-lg px-3 py-1">
                                  #{entry.position}
                                </Badge>
                                <h3 className="text-xl font-bold text-slate-900">
                                  {entry.customer_name}
                                </h3>
                                <Badge className={getStatusColor(entry.status)}>
                                  {entry.status}
                                </Badge>
                              </div>

                              <div className="grid md:grid-cols-4 gap-4 text-sm mb-3">
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Users className="w-4 h-4" />
                                  <span>{entry.party_size} guests</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Phone className="w-4 h-4" />
                                  <span>{entry.customer_phone}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Clock className="w-4 h-4" />
                                  <span>
                                    {entry.join_time && format(new Date(entry.join_time), 'h:mm a')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-amber-600 font-semibold">
                                  <AlertCircle className="w-4 h-4" />
                                  <span>~{entry.estimated_wait_time || 0} min wait</span>
                                </div>
                              </div>

                              {entry.seating_preference !== "any" && (
                                <Badge variant="outline" className="capitalize">
                                  {entry.seating_preference} seating
                                </Badge>
                              )}

                              {entry.special_requests && (
                                <p className="text-sm text-slate-600 mt-2 italic">
                                  Note: {entry.special_requests}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col gap-2">
                              {entry.status === "waiting" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleNotifyGuest(entry)}
                                  className="bg-blue-600"
                                >
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  Notify Guest
                                </Button>
                              )}

                              {(entry.status === "notified" || entry.status === "ready") && availableTables.length > 0 && (
                                <Select onValueChange={(tableId) => handleSeatGuest(entry, tableId, false)}>
                                  <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Assign Table" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableTables.map(table => (
                                      <SelectItem key={table.id} value={table.id}>
                                        Table {table.table_number} ({table.capacity} seats)
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleNoShow(entry, false)}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                No Show
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}