import React, { useState, useEffect } from "react";
import { Subscription } from "@/entities/Subscription";
import { Transaction } from "@/entities/Transaction";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign, CheckCircle, Ban, Play, RefreshCw,
  ArrowLeft, Calendar, CreditCard, TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function BackofficeSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [filteredSubs, setFilteredSubs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [actionData, setActionData] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  useEffect(() => {
    filterSubscriptions();
  }, [subscriptions, searchQuery, statusFilter]);

  const loadSubscriptions = async () => {
    setIsLoading(true);
    try {
      // CRITICAL FIX: Use asServiceRole to see ALL subscriptions (developer only)
      const user = await base44.auth.me();
      const isDeveloper = user.role === "admin" ||
                          user.email === "harryxson@hotmail.com" ||
                          user.email === "harryexson@hotmail.com" ||
                          user.email === "developer@restrobuddy.com" ||
                          user.email.endsWith("@restrobuddy.com");
      
      if (!isDeveloper) {
        alert("Access denied. Developer-only area.");
        window.location.href = "/";
        return;
      }
      
      const subs = await base44.asServiceRole.entities.Subscription.list("-created_date");
      console.log("Raw subscriptions loaded:", subs);
      
      // Enrich subscriptions with restaurant names if missing
      const { Restaurant } = await import("@/entities/Restaurant");
      const enrichedSubs = await Promise.all(subs.map(async (sub) => {
        if (!sub.restaurant_name && sub.restaurant_id) {
          try {
            const restaurants = await Restaurant.filter({ id: sub.restaurant_id });
            if (restaurants.length > 0) {
              return { ...sub, restaurant_name: restaurants[0].business_name };
            }
          } catch (e) {
            console.log("Could not fetch restaurant for sub:", sub.id);
          }
        }
        return sub;
      }));
      
      setSubscriptions(enrichedSubs);
    } catch (error) {
      console.error("Error loading subscriptions:", error);
    }
    setIsLoading(false);
  };

  const filterSubscriptions = () => {
    let filtered = [...subscriptions];

    if (statusFilter !== "all") {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(s =>
        s.restaurant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.owner_email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredSubs(filtered);
  };

  const handleAction = (sub, action) => {
    setSelectedSub(sub);
    setActionType(action);
    setActionData({});
    setShowActionDialog(true);
  };

  const processAction = async () => {
    if (!selectedSub) return;

    setIsProcessing(true);
    try {
      const user = await base44.auth.me();

      switch (actionType) {
        case "suspend":
          await Subscription.update(selectedSub.id, {
            status: "suspended",
            suspension_reason: actionData.reason || "No reason provided"
          });
          break;

        case "activate":
          await Subscription.update(selectedSub.id, {
            status: "active",
            suspension_reason: null
          });
          break;

        case "cancel":
          await Subscription.update(selectedSub.id, {
            status: "cancelled",
            cancellation_date: new Date().toISOString()
          });
          break;

        case "refund":
          await Transaction.create({
            restaurant_id: selectedSub.restaurant_id,
            subscription_id: selectedSub.id,
            type: "refund",
            amount: parseFloat(actionData.amount) || 0,
            status: "completed",
            refund_reason: actionData.reason || "No reason provided",
            refunded_date: new Date().toISOString(),
            processed_by: user.email
          });
          break;

        case "charge":
          await Transaction.create({
            restaurant_id: selectedSub.restaurant_id,
            subscription_id: selectedSub.id,
            type: "subscription_payment",
            amount: parseFloat(actionData.amount) || 0,
            status: "completed",
            description: actionData.description || "Manual charge",
            processed_by: user.email
          });
          break;
      }

      await loadSubscriptions();
      setShowActionDialog(false);
      setSelectedSub(null);
    } catch (error) {
      console.error("Error processing action:", error);
      alert("Failed to process action");
    }
    setIsProcessing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "trial": return "bg-blue-100 text-blue-800";
      case "suspended": return "bg-red-100 text-red-800";
      case "cancelled": return "bg-gray-100 text-gray-800";
      case "past_due": return "bg-amber-100 text-amber-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-500">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link to={createPageUrl("DeveloperBackoffice")}>
              <Button variant="ghost" className="text-white hover:bg-blue-500">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <DollarSign className="w-8 h-8" />
            Billing & Subscriptions
          </h1>
          <p className="text-blue-100 mt-1">Manage subscriptions, payments, and billing</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    {subscriptions.filter(s => s.status === "active").length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Trial</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {subscriptions.filter(s => s.status === "trial").length}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Suspended</p>
                  <p className="text-2xl font-bold text-red-600">
                    {subscriptions.filter(s => s.status === "suspended").length}
                  </p>
                </div>
                <Ban className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total MRR</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    ${subscriptions.reduce((sum, s) => sum + (s.mrr || 0), 0).toFixed(0)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-xl mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Search by restaurant or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Subscriptions Table */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>All Subscriptions ({filteredSubs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>MRR</TableHead>
                    <TableHead>Total Paid</TableHead>
                    <TableHead>Next Billing</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubs.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.restaurant_name || "N/A"}</TableCell>
                      <TableCell>{sub.owner_email}</TableCell>
                      <TableCell>
                        <Badge className="bg-indigo-100 text-indigo-800">
                          {sub.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(sub.status)}>
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell>${sub.mrr || 0}</TableCell>
                      <TableCell>${sub.total_paid || 0}</TableCell>
                      <TableCell>
                        {sub.next_billing_date ? format(new Date(sub.next_billing_date), "MMM d, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {sub.status === "active" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleAction(sub, "suspend")}
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          )}
                          {sub.status === "suspended" && (
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-green-600"
                              onClick={() => handleAction(sub, "activate")}
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(sub, "refund")}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(sub, "charge")}
                          >
                            <CreditCard className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "suspend" && "Suspend Subscription"}
              {actionType === "activate" && "Activate Subscription"}
              {actionType === "cancel" && "Cancel Subscription"}
              {actionType === "refund" && "Process Refund"}
              {actionType === "charge" && "Process Charge"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedSub && (
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="font-semibold">{selectedSub.restaurant_name}</p>
                <p className="text-sm text-slate-600">{selectedSub.owner_email}</p>
              </div>
            )}

            {(actionType === "refund" || actionType === "charge") && (
              <div>
                <label className="block text-sm font-medium mb-2">Amount ($)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={actionData.amount || ""}
                  onChange={(e) => setActionData({...actionData, amount: e.target.value})}
                />
              </div>
            )}

            {(actionType === "suspend" || actionType === "refund" || actionType === "charge") && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  {actionType === "refund" ? "Refund Reason" : actionType === "charge" ? "Description" : "Suspension Reason"}
                </label>
                <Textarea
                  placeholder="Enter reason..."
                  value={actionData.reason || actionData.description || ""}
                  onChange={(e) => setActionData({
                    ...actionData, 
                    [actionType === "charge" ? "description" : "reason"]: e.target.value
                  })}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={processAction}
              disabled={isProcessing}
              className={
                actionType === "suspend" || actionType === "cancel" ? "bg-red-600 hover:bg-red-700" :
                actionType === "activate" ? "bg-green-600 hover:bg-green-700" :
                "bg-blue-600 hover:bg-blue-700"
              }
            >
              {isProcessing ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}