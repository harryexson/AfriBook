import React, { useState, useEffect } from "react";
import { Transaction } from "@/entities/Transaction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3, ArrowLeft, Download
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

export default function BackofficeAccounting() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [dateRange, setDateRange] = useState("this_month");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    subscriptionRevenue: 0,
    marketplaceCommission: 0,
    refunds: 0,
    netRevenue: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterTransactions();
    calculateStats();
  }, [transactions, dateRange, typeFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const allTransactions = await Transaction.list("-created_date");
      setTransactions(allTransactions);
    } catch (error) {
      console.error("Error loading transactions:", error);
    }
    setIsLoading(false);
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Date range filter
    const now = new Date();
    let startDate, endDate;

    switch (dateRange) {
      case "this_month":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case "last_month":
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(subMonths(now, 1));
        break;
      case "last_3_months":
        startDate = startOfMonth(subMonths(now, 3));
        endDate = endOfMonth(now);
        break;
      case "this_year":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = null;
        endDate = null;
    }

    if (startDate && endDate) {
      filtered = filtered.filter(t => {
        const tDate = new Date(t.created_date);
        return tDate >= startDate && tDate <= endDate;
      });
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(t => t.type === typeFilter);
    }

    setFilteredTransactions(filtered);
  };

  const calculateStats = () => {
    const completed = filteredTransactions.filter(t => t.status === "completed");
    
    const subscriptionRev = completed
      .filter(t => t.type === "subscription_payment")
      .reduce((sum, t) => sum + t.amount, 0);

    const marketplaceRev = completed
      .filter(t => t.type === "marketplace_commission")
      .reduce((sum, t) => sum + t.amount, 0);

    const refunds = filteredTransactions
      .filter(t => t.type === "refund")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalRevenue = subscriptionRev + marketplaceRev;
    const netRevenue = totalRevenue - refunds;

    setStats({
      totalRevenue,
      subscriptionRevenue: subscriptionRev,
      marketplaceCommission: marketplaceRev,
      refunds,
      netRevenue
    });
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "subscription_payment": return "bg-blue-100 text-blue-800";
      case "marketplace_commission": return "bg-purple-100 text-purple-800";
      case "refund": return "bg-red-100 text-red-800";
      case "chargeback": return "bg-amber-100 text-amber-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      case "refunded": return "bg-gray-100 text-gray-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 border-b border-green-500">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link to={createPageUrl("DeveloperBackoffice")}>
              <Button variant="ghost" className="text-white hover:bg-green-500">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8" />
            Accounting & Analytics
          </h1>
          <p className="text-green-100 mt-1">Financial reports and revenue analytics</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Revenue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ${stats.totalRevenue.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-slate-600 mb-1">Subscriptions</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${stats.subscriptionRevenue.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-slate-600 mb-1">Marketplace</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${stats.marketplaceCommission.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-slate-600 mb-1">Refunds</p>
                <p className="text-2xl font-bold text-red-600">
                  -${stats.refunds.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-slate-600 mb-1">Net Revenue</p>
                <p className="text-2xl font-bold text-emerald-600">
                  ${stats.netRevenue.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-xl mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex gap-4 flex-1">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this_month">This Month</SelectItem>
                    <SelectItem value="last_month">Last Month</SelectItem>
                    <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                    <SelectItem value="this_year">This Year</SelectItem>
                    <SelectItem value="all_time">All Time</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Transaction type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="subscription_payment">Subscriptions</SelectItem>
                    <SelectItem value="marketplace_commission">Marketplace</SelectItem>
                    <SelectItem value="refund">Refunds</SelectItem>
                    <SelectItem value="chargeback">Chargebacks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Transaction History ({filteredTransactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Processed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="text-sm">
                        {format(new Date(txn.created_date), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(txn.type)}>
                          {txn.type.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{txn.restaurant_id || "N/A"}</TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        {txn.description || txn.refund_reason || "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        <span className={txn.type === "refund" ? "text-red-600" : "text-green-600"}>
                          {txn.type === "refund" ? "-" : ""}${txn.amount.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(txn.status)}>
                          {txn.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {txn.processed_by || "System"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}