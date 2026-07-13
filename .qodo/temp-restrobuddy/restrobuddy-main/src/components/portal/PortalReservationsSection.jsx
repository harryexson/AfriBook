import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Reservation } from "@/entities/Reservation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Calendar, Clock, Users, Phone,
  X, Plus, PartyPopper
} from "lucide-react";
import { format } from "date-fns";

export default function PortalReservationsSection({ reservations, user, onRefresh }) {
  const navigate = useNavigate();
  const [resTab, setResTab] = useState("upcoming");
  const [showNewReservation, setShowNewReservation] = useState(false);
  const [newReservation, setNewReservation] = useState({
    party_size: 2,
    reservation_date: "",
    reservation_time: "",
    special_requests: "",
    occasion: "none"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const upcomingReservations = reservations.filter(r => 
    new Date(r.reservation_date) >= new Date() && 
    !["cancelled", "no_show", "completed"].includes(r.status)
  );

  const pastReservations = reservations.filter(r => 
    new Date(r.reservation_date) < new Date() || 
    ["completed", "cancelled", "no_show"].includes(r.status)
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed": return "bg-green-500";
      case "pending": return "bg-amber-500";
      case "checked_in": return "bg-blue-500";
      case "seated": return "bg-purple-500";
      case "completed": return "bg-slate-500";
      case "cancelled": return "bg-red-500";
      case "no_show": return "bg-red-700";
      default: return "bg-slate-400";
    }
  };

  const handleCancelReservation = async (reservation) => {
    if (!confirm("Are you sure you want to cancel this reservation?")) return;
    
    try {
      await Reservation.update(reservation.id, { status: "cancelled" });
      onRefresh();
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      alert("Failed to cancel reservation");
    }
  };

  const handleCreateReservation = async () => {
    if (!newReservation.reservation_date || !newReservation.reservation_time) {
      alert("Please select a date and time");
      return;
    }

    setIsSubmitting(true);
    try {
      const confirmationCode = `RES${Date.now().toString(36).toUpperCase()}`;
      
      await Reservation.create({
        ...newReservation,
        customer_name: user.full_name,
        customer_email: user.email,
        customer_phone: user.phone || "",
        confirmation_code: confirmationCode,
        status: "pending",
        booking_source: "app"
      });

      setShowNewReservation(false);
      setNewReservation({
        party_size: 2,
        reservation_date: "",
        reservation_time: "",
        special_requests: "",
        occasion: "none"
      });
      onRefresh();
      alert(`Reservation created! Confirmation: ${confirmationCode}`);
    } catch (error) {
      console.error("Error creating reservation:", error);
      alert("Failed to create reservation");
    }
    setIsSubmitting(false);
  };

  const ReservationCard = ({ reservation, isPast }) => (
    <Card className={`border-0 shadow-lg ${isPast ? 'opacity-75' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="text-xl font-bold text-slate-900">
                {format(new Date(reservation.reservation_date), 'EEEE, MMM d')}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {reservation.reservation_time}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {reservation.party_size} guests
              </span>
            </div>
          </div>
          <Badge className={`${getStatusColor(reservation.status)} text-white`}>
            {reservation.status.replace('_', ' ')}
          </Badge>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Confirmation Code</span>
            <span className="font-mono font-bold text-slate-900">{reservation.confirmation_code}</span>
          </div>
          {reservation.table_number && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-slate-600">Table</span>
              <span className="font-bold text-slate-900">#{reservation.table_number}</span>
            </div>
          )}
        </div>

        {reservation.occasion && reservation.occasion !== "none" && (
          <div className="flex items-center gap-2 mb-3">
            <PartyPopper className="w-4 h-4 text-pink-500" />
            <span className="text-sm text-slate-600 capitalize">{reservation.occasion.replace('_', ' ')}</span>
          </div>
        )}

        {reservation.special_requests && (
          <p className="text-sm text-slate-600 italic mb-4">
            "{reservation.special_requests}"
          </p>
        )}

        {!isPast && reservation.status !== "cancelled" && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleCancelReservation(reservation)}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              <Phone className="w-4 h-4 mr-2" />
              Contact Restaurant
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">My Reservations</h2>
        <Dialog open={showNewReservation} onOpenChange={setShowNewReservation}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600">
              <Plus className="w-4 h-4 mr-2" />
              New Reservation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Make a Reservation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newReservation.reservation_date}
                  onChange={(e) => setNewReservation({...newReservation, reservation_date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  value={newReservation.reservation_time}
                  onChange={(e) => setNewReservation({...newReservation, reservation_time: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Party Size</Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={newReservation.party_size}
                  onChange={(e) => setNewReservation({...newReservation, party_size: parseInt(e.target.value)})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Occasion (Optional)</Label>
                <select
                  value={newReservation.occasion}
                  onChange={(e) => setNewReservation({...newReservation, occasion: e.target.value})}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                >
                  <option value="none">No special occasion</option>
                  <option value="birthday">Birthday</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="business">Business</option>
                  <option value="date_night">Date Night</option>
                  <option value="celebration">Celebration</option>
                </select>
              </div>
              <div>
                <Label>Special Requests (Optional)</Label>
                <Input
                  value={newReservation.special_requests}
                  onChange={(e) => setNewReservation({...newReservation, special_requests: e.target.value})}
                  placeholder="e.g., high chair, wheelchair access"
                  className="mt-1"
                />
              </div>
              <Button 
                onClick={handleCreateReservation} 
                disabled={isSubmitting}
                className="w-full bg-emerald-600"
              >
                {isSubmitting ? 'Creating...' : 'Create Reservation'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={resTab} onValueChange={setResTab}>
        <TabsList className="bg-white border border-slate-200 p-1 rounded-lg mb-6">
          <TabsTrigger value="upcoming" className="rounded-md data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            Upcoming ({upcomingReservations.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="rounded-md data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            Past ({pastReservations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {upcomingReservations.length === 0 ? (
            <Card className="border-0 shadow-xl text-center p-12">
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No upcoming reservations</h3>
              <p className="text-slate-600 mb-6">Book a table at your favorite restaurant</p>
              <Button onClick={() => setShowNewReservation(true)} className="bg-emerald-600">
                <Plus className="w-4 h-4 mr-2" />
                Make a Reservation
              </Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {upcomingReservations.map(res => (
                <ReservationCard key={res.id} reservation={res} isPast={false} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {pastReservations.length === 0 ? (
            <Card className="border-0 shadow-xl text-center p-12">
              <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No past reservations</h3>
              <p className="text-slate-600">Your reservation history will appear here</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {pastReservations.map(res => (
                <ReservationCard key={res.id} reservation={res} isPast={true} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}