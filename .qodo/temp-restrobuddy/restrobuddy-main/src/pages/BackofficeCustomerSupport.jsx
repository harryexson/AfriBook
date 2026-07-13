import React, { useState, useEffect } from "react";
import { SupportTicket } from "@/entities/SupportTicket";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HeadphonesIcon, ArrowLeft, Clock, AlertCircle, CheckCircle, Send
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function BackofficeCustomerSupport() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchQuery, statusFilter]);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const allTickets = await SupportTicket.list("-created_date");
      setTickets(allTickets);
    } catch (error) {
      console.error("Error loading tickets:", error);
    }
    setIsLoading(false);
  };

  const filterTickets = () => {
    let filtered = [...tickets];

    if (statusFilter !== "all") {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.ticket_number?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTickets(filtered);
  };

  const handleOpenTicket = (ticket) => {
    setSelectedTicket(ticket);
    setShowTicketDialog(true);
    setNewMessage("");
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    setIsSending(true);
    try {
      const user = await base44.auth.me();
      const updatedMessages = [
        ...(selectedTicket.messages || []),
        {
          from: user.email,
          message: newMessage,
          timestamp: new Date().toISOString(),
          is_internal: false
        }
      ];

      await SupportTicket.update(selectedTicket.id, {
        messages: updatedMessages,
        status: selectedTicket.status === "open" ? "in_progress" : selectedTicket.status
      });

      setSelectedTicket({...selectedTicket, messages: updatedMessages});
      setNewMessage("");
      await loadTickets();
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    }
    setIsSending(false);
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedTicket) return;

    try {
      const updates = { status: newStatus };
      if (newStatus === "resolved" || newStatus === "closed") {
        updates.resolved_date = new Date().toISOString();
      }

      await SupportTicket.update(selectedTicket.id, updates);
      await loadTickets();
      setShowTicketDialog(false);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open": return "bg-red-100 text-red-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading support tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 border-b border-purple-500">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link to={createPageUrl("DeveloperBackoffice")}>
              <Button variant="ghost" className="text-white hover:bg-purple-500">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <HeadphonesIcon className="w-8 h-8" />
            Customer Support & CRM
          </h1>
          <p className="text-purple-100 mt-1">Manage support tickets and customer relationships</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Open</p>
                  <p className="text-2xl font-bold text-red-600">
                    {tickets.filter(t => t.status === "open").length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {tickets.filter(t => t.status === "in_progress").length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {tickets.filter(t => t.status === "resolved").length}
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
                  <p className="text-sm text-slate-600">Avg Response Time</p>
                  <p className="text-2xl font-bold text-purple-600">2.4h</p>
                </div>
                <Clock className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-xl mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Search by ticket #, email, or subject..."
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
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Support Tickets ({filteredTickets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono text-sm">
                        {ticket.ticket_number || ticket.id.slice(-8)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{ticket.customer_name || "N/A"}</p>
                          <p className="text-xs text-slate-500">{ticket.customer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{ticket.subject}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ticket.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {format(new Date(ticket.created_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleOpenTicket(ticket)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ticket Detail Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Ticket #{selectedTicket?.ticket_number || selectedTicket?.id.slice(-8)}
            </DialogTitle>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              {/* Ticket Info */}
              <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{selectedTicket.subject}</h3>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(selectedTicket.status)}>
                      {selectedTicket.status}
                    </Badge>
                    <Badge className={getPriorityColor(selectedTicket.priority)}>
                      {selectedTicket.priority}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-slate-600">
                  <strong>From:</strong> {selectedTicket.customer_name} ({selectedTicket.customer_email})
                </p>
                <p className="text-sm text-slate-600">
                  <strong>Category:</strong> {selectedTicket.category}
                </p>
                <p className="text-sm text-slate-600">
                  <strong>Created:</strong> {format(new Date(selectedTicket.created_date), "MMM d, yyyy HH:mm")}
                </p>
              </div>

              {/* Initial Message */}
              <div className="p-4 bg-white border rounded-lg">
                <p className="text-sm text-slate-900">{selectedTicket.description}</p>
              </div>

              {/* Message Thread */}
              {selectedTicket.messages && selectedTicket.messages.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Conversation</h4>
                  {selectedTicket.messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg ${
                        msg.from === selectedTicket.customer_email
                          ? "bg-blue-50 border-l-4 border-blue-500"
                          : "bg-slate-50 border-l-4 border-slate-500"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{msg.from}</span>
                        <span className="text-xs text-slate-500">
                          {format(new Date(msg.timestamp), "MMM d, HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Box */}
              {selectedTicket.status !== "closed" && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Reply</h4>
                  <Textarea
                    placeholder="Type your response..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={4}
                  />
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus("in_progress")}
                        disabled={selectedTicket.status === "in_progress"}
                      >
                        Mark In Progress
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-green-50 text-green-700 hover:bg-green-100"
                        onClick={() => handleUpdateStatus("resolved")}
                      >
                        Mark Resolved
                      </Button>
                    </div>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isSending ? "Sending..." : "Send Reply"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}