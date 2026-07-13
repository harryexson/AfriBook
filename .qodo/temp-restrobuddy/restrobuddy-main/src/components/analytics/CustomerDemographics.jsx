import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

export default function CustomerDemographics({ orders }) {
  // Customer tier analysis
  const customersByTier = {};
  const uniqueCustomers = new Set();
  const customerFrequency = {};
  
  orders.forEach(order => {
    const customerId = order.customer_email || order.customer_phone;
    if (customerId) {
      uniqueCustomers.add(customerId);
      customerFrequency[customerId] = (customerFrequency[customerId] || 0) + 1;
    }
  });

  // Segment customers
  Object.entries(customerFrequency).forEach(([customer, count]) => {
    let tier = 'One-time';
    if (count >= 10) tier = 'VIP (10+ orders)';
    else if (count >= 5) tier = 'Regular (5-9 orders)';
    else if (count >= 2) tier = 'Returning (2-4 orders)';
    
    customersByTier[tier] = (customersByTier[tier] || 0) + 1;
  });

  const tierData = Object.entries(customersByTier).map(([name, value]) => ({ name, value }));

  // Order type breakdown
  const orderTypeData = orders.reduce((acc, order) => {
    const type = order.order_type || 'web';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const orderTypeChartData = Object.entries(orderTypeData).map(([name, value]) => ({ 
    name: name.replace('_', ' ').toUpperCase(), 
    value 
  }));

  // Day of week analysis
  const dayOfWeekData = Array(7).fill(0).map((_, i) => ({
    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
    orders: 0,
    revenue: 0
  }));

  orders.forEach(order => {
    const day = new Date(order.created_date).getDay();
    dayOfWeekData[day].orders += 1;
    dayOfWeekData[day].revenue += order.total_amount;
  });

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Customer Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Customers</p>
                <p className="text-3xl font-bold text-slate-900">{uniqueCustomers.size}</p>
              </div>
              <Users className="w-10 h-10 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">VIP Customers</p>
                <p className="text-3xl font-bold text-slate-900">
                  {customersByTier['VIP (10+ orders)'] || 0}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Avg Orders/Customer</p>
                <p className="text-3xl font-bold text-slate-900">
                  {(orders.length / (uniqueCustomers.size || 1)).toFixed(1)}
                </p>
              </div>
              <Calendar className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Customer Segmentation */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">Customer Segmentation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={tierData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {tierData.map((tier, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-sm font-medium">{tier.name}</span>
                  </div>
                  <span className="text-sm font-bold">{tier.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Day of Week Performance */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">Day of Week Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dayOfWeekData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="#10b981" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
              <p className="text-sm text-emerald-900">
                <strong>Busiest Day:</strong> {dayOfWeekData.reduce((max, day) => day.orders > max.orders ? day : max).day} 
                {' '}with {Math.max(...dayOfWeekData.map(d => d.orders))} orders
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}