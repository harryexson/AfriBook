import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { GroupOrder } from "@/entities/GroupOrder";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Users,
  Plus,
  Clock,
  Store,
  Check,
  ArrowRight,
  ShoppingBag
} from "lucide-react";

export default function MyGroupOrders() {
  const navigate = useNavigate();
  const [groupOrders, setGroupOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const orders = await GroupOrder.filter({ organizer_email: user.email }, "-created_date");
      setGroupOrders(orders);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const activeOrders = groupOrders.filter(o => 
    ["collecting", "closed"].includes(o.status)
  );
  const completedOrders = groupOrders.filter(o => 
    ["submitted", "confirmed", "completed", "cancelled"].includes(o.status)
  );

  const getStatusBadge = (status) => {
    const styles = {
      collecting: "bg-blue-100 text-blue-700",
      closed: "bg-amber-100 text-amber-700",
      submitted: "bg-green-100 text-green-700",
      confirmed: "bg-emerald-100 text-emerald-700",
      completed: "bg-slate-100 text-slate-700",
      cancelled: "bg-red-100 text-red-700"
    };
    return <Badge className={styles[status]}>{status}</Badge>;
  };

  const OrderCard = ({ order }) => {
    const submittedCount = order.party_members?.filter(m => m.status === "submitted").length || 0;
    const totalMembers = order.party_members?.length || 0;
    const isDeadlinePassed = new Date(order.deadline) < new Date();

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg text-slate-900">{order.title}</h3>
              <p className="text-sm text-slate-600 flex items-center gap-1">
                <Store className="w-4 h-4" />
                {order.restaurant_name}
              </p>
            </div>
            {getStatusBadge(order.status)}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <Users className="w-5 h-5 text-purple-600 mx-auto mb-1" />
              <p className="text-lg font-bold">{submittedCount}/{totalMembers}</p>
              <p className="text-xs text-slate-500">Submitted</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <ShoppingBag className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-lg font-bold">${order.total_amount?.toFixed(2) || "0.00"}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <Clock className={`w-5 h-5 mx-auto mb-1 ${isDeadlinePassed ? 'text-red-500' : 'text-blue-600'}`} />
              <p className={`text-sm font-bold ${isDeadlinePassed ? 'text-red-600' : ''}`}>
                {isDeadlinePassed ? "Passed" : new Date(order.deadline).toLocaleDateString()}
              </p>
              <p className="text-xs text-slate-500">Deadline</p>
            </div>
          </div>

          <Button
            onClick={() => navigate(createPageUrl("ManageGroupOrder") + `?id=${order.id}`)}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            Manage Order
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">My Group Orders</h1>
              <p className="text-slate-600">Manage your group food orders</p>
            </div>
          </div>
          <Button
            onClick={() => navigate(createPageUrl("CreateGroupOrder"))}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Group Order
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-5">
              <p className="text-blue-100 text-sm">Active Orders</p>
              <p className="text-3xl font-bold">{activeOrders.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardContent className="p-5">
              <p className="text-emerald-100 text-sm">Completed</p>
              <p className="text-3xl font-bold">{completedOrders.filter(o => o.status === "completed").length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-5">
              <p className="text-purple-100 text-sm">Total Orders</p>
              <p className="text-3xl font-bold">{groupOrders.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start bg-white p-2 rounded-xl shadow mb-6">
            <TabsTrigger value="active" className="rounded-lg px-6 py-2">
              Active ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg px-6 py-2">
              Completed ({completedOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeOrders.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Group Orders</h3>
                  <p className="text-slate-600 mb-6">Create a group order and invite your party to order together!</p>
                  <Button
                    onClick={() => navigate(createPageUrl("CreateGroupOrder"))}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Group Order
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {activeOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedOrders.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="p-12 text-center">
                  <Check className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No Completed Orders Yet</h3>
                  <p className="text-slate-600">Your completed group orders will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {completedOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}