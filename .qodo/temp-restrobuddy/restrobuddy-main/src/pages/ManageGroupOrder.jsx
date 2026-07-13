import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { GroupOrder } from "@/entities/GroupOrder";
import { Order } from "@/entities/Order";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notification } from "@/entities/Notification";
import {
  Users,
  Clock,
  Store,
  Check,
  X,
  Mail,
  RefreshCw,
  AlertCircle,
  CreditCard,
  Copy,
  ExternalLink,
  Trash2,
  UserPlus,
  Send,
  Copy as CopyIcon,
  Edit
} from "lucide-react";
import GroupOrderTracker from "@/components/grouporder/GroupOrderTracker";
import ItemEditModal from "@/components/orders/ItemEditModal";

export default function ManageGroupOrder() {
  const navigate = useNavigate();
  const [groupOrder, setGroupOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [resendingTo, setResendingTo] = useState(null);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", email: "" });
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [showEditDeadline, setShowEditDeadline] = useState(false);
  const [newDeadline, setNewDeadline] = useState("");
  const [showEditOrder, setShowEditOrder] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    min_participants: 0,
    max_participants: 0,
    deadline: "",
    delivery_type: "pickup",
    pickup_time: "",
    delivery_address: {
      street: "",
      city: "",
      state: "",
      zip: "",
      instructions: ""
    }
  });
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateFormData, setDuplicateFormData] = useState({
    title: "",
    deadline: "",
    min_participants: 0,
    max_participants: 0
  });
  const [isDuplicating, setIsDuplicating] = useState(false);

  useEffect(() => {
    loadGroupOrder();
    
    // Real-time updates using Base44 subscriptions
    const unsubscribe = GroupOrder.subscribe((event) => {
      const urlParams = new URLSearchParams(window.location.search);
      const orderId = urlParams.get("id");
      
      if (event.data.id === orderId && (event.type === 'update' || event.type === 'create')) {
        setGroupOrder(event.data);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  const loadGroupOrder = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const orderId = urlParams.get("id");

      if (!orderId) {
        navigate(createPageUrl("MyGroupOrders"));
        return;
      }

      const orders = await GroupOrder.filter({});
      const order = orders.find(o => o.id === orderId);

      if (!order) {
        navigate(createPageUrl("MyGroupOrders"));
        return;
      }

      setGroupOrder(order);
      setEditFormData({
        title: order.title,
        min_participants: order.min_participants || 0,
        max_participants: order.max_participants || 0,
        deadline: order.deadline || "",
        delivery_type: order.delivery_type || "pickup",
        pickup_time: order.pickup_time || "",
        delivery_address: order.delivery_address || {
          street: "",
          city: "",
          state: "",
          zip: "",
          instructions: ""
        }
      });
      // Initialize duplicate form with suggested values
      const defaultDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      setDuplicateFormData({
        title: `${order.title} (Copy)`,
        deadline: defaultDeadline,
        min_participants: order.min_participants || 0,
        max_participants: order.max_participants || 0
      });
    } catch (error) {
      console.error("Error loading group order:", error);
    }
    setIsLoading(false);
  };

  const handleEditOrder = async () => {
    if (!editFormData.title.trim()) {
      alert("Please enter a title");
      return;
    }

    if (!editFormData.deadline) {
      alert("Please select a deadline");
      return;
    }

    if (editFormData.delivery_type === "delivery" && !editFormData.delivery_address.street) {
      alert("Please enter a delivery address");
      return;
    }

    try {
      await GroupOrder.update(groupOrder.id, {
        title: editFormData.title,
        min_participants: editFormData.min_participants,
        max_participants: editFormData.max_participants,
        deadline: editFormData.deadline,
        delivery_type: editFormData.delivery_type,
        pickup_time: editFormData.pickup_time,
        delivery_address: editFormData.delivery_address,
        activity_log: [
          ...(groupOrder.activity_log || []),
          {
            timestamp: new Date().toISOString(),
            action: "order_edited",
            user_name: groupOrder.organizer_name,
            user_email: groupOrder.organizer_email,
            details: `Group order details were updated`
          }
        ]
      });
      
      loadGroupOrder();
      setShowEditOrder(false);
      alert("Group order updated successfully!");
    } catch (error) {
      console.error("Error editing order:", error);
      alert("Failed to update group order. Please try again.");
    }
  };

  const handleDuplicateOrder = async () => {
    if (!duplicateFormData.title.trim()) {
      alert("Please enter a title");
      return;
    }

    if (!duplicateFormData.deadline) {
      alert("Please select a deadline");
      return;
    }

    setIsDuplicating(true);
    try {
      const newGroupOrder = await GroupOrder.create({
        restaurant_id: groupOrder.restaurant_id,
        restaurant_name: groupOrder.restaurant_name,
        organizer_name: groupOrder.organizer_name,
        organizer_email: groupOrder.organizer_email,
        organizer_phone: groupOrder.organizer_phone,
        title: duplicateFormData.title,
        min_participants: duplicateFormData.min_participants,
        max_participants: duplicateFormData.max_participants,
        deadline: duplicateFormData.deadline,
        pickup_time: groupOrder.pickup_time,
        delivery_type: groupOrder.delivery_type,
        delivery_address: groupOrder.delivery_address,
        party_members: groupOrder.party_members.map(m => ({
          id: crypto.randomUUID(),
          name: m.name,
          email: m.email,
          status: "pending",
          items: [],
          subtotal: 0
        })),
        share_link: `${window.location.origin}/group-order-select?token=${crypto.randomUUID()}`,
        status: "collecting"
      });
      
      setShowDuplicateDialog(false);
      navigate(createPageUrl("ManageGroupOrder") + `?id=${newGroupOrder.id}`);
    } catch (error) {
      console.error("Error duplicating order:", error);
      alert("Failed to duplicate order. Please try again.");
    }
    setIsDuplicating(false);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-slate-100 text-slate-700",
      viewed: "bg-blue-100 text-blue-700",
      submitted: "bg-green-100 text-green-700"
    };
    const labels = {
      pending: "Awaiting",
      viewed: "Viewed",
      submitted: "Submitted"
    };
    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  // Build a personal invite link for a member
  const getMemberLink = (member) => {
    try {
      const url = new URL(groupOrder.share_link);
      const token = url.searchParams.get('token');
      return `${window.location.origin}${createPageUrl("GroupOrderSelect")}?token=${token}&memberId=${member.id}`;
    } catch {
      return `${groupOrder.share_link}&memberId=${member.id}`;
    }
  };

  const sendMemberEmail = async (member, subject, body) => {
    await base44.integrations.Core.SendEmail({ to: member.email, subject, body });
  };

  const submittedCount = groupOrder?.party_members?.filter(m => m.status === "submitted").length || 0;
  const totalMembers = groupOrder?.party_members?.length || 0;
  const progress = totalMembers > 0 ? (submittedCount / totalMembers) * 100 : 0;

  const resendInvitation = async (member) => {
    setResendingTo(member.id);
    try {
      const memberLink = getMemberLink(member);
      const deadlineStr = new Date(groupOrder.deadline).toLocaleString();
      await sendMemberEmail(
        member,
        `⏰ Reminder: Submit your selection for "${groupOrder.title}"`,
        `Hi ${member.name},\n\nThis is a reminder that ${groupOrder.organizer_name} is waiting for your food selection!\n\n📋 Order: ${groupOrder.title}\n🏪 Restaurant: ${groupOrder.restaurant_name}\n⏰ Deadline: ${deadlineStr}\n\nClick here to pick your items:\n👉 ${memberLink}\n\nDon't miss out!\nRESTROBUDDY`
      );
      alert(`Reminder sent to ${member.name}!`);
    } catch (error) {
      console.error("Error resending invitation:", error);
      alert("Failed to send reminder. Please try again.");
    }
    setResendingTo(null);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(groupOrder.share_link);
    alert("Share link copied to clipboard!");
  };

  const closeOrderEarly = async () => {
    try {
      await GroupOrder.update(groupOrder.id, { status: "closed" });
      loadGroupOrder();
    } catch (error) {
      console.error("Error closing order:", error);
    }
  };

  const submitFinalOrder = async () => {
    setIsSubmitting(true);
    try {
      // Combine all submitted members' items into one order
      const allItems = [];
      groupOrder.party_members
        .filter(m => m.status === "submitted")
        .forEach(member => {
          (member.items || []).forEach(item => {
            allItems.push({
              menu_item_id: item.menu_item_id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              special_instructions: item.special_instructions || item.customizations?.special_instructions || ""
            });
          });
        });

      // Create the actual Order entity
      const order = await Order.create({
        customer_name: groupOrder.organizer_name,
        customer_email: groupOrder.organizer_email,
        customer_phone: groupOrder.organizer_phone || "",
        items: allItems,
        total_amount: groupOrder.total_amount || 0,
        status: "pending",
        payment_status: "pending",
        order_type: "web",
        delivery_type: groupOrder.delivery_type,
        delivery_address: groupOrder.delivery_type === "delivery" ? groupOrder.delivery_address : null,
        special_requests: `GROUP ORDER: "${groupOrder.title}" — ${submittedCount} participants.`
      });

      // Update group order as submitted
      await GroupOrder.update(groupOrder.id, {
        status: "submitted",
        order_id: order.id,
        activity_log: [
          ...(groupOrder.activity_log || []),
          {
            timestamp: new Date().toISOString(),
            action: "submitted",
            user_name: groupOrder.organizer_name,
            user_email: groupOrder.organizer_email,
            details: `Order submitted to ${groupOrder.restaurant_name}. Total: $${groupOrder.total_amount?.toFixed(2)}`
          }
        ]
      });

      // Notify all members via email with a professional confirmation
      const submittedAt = new Date().toLocaleString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
      await Promise.all(
        groupOrder.party_members.filter(m => m.email).map(member => {
          const memberItems = member.items || [];
          const itemLines = memberItems.length > 0
            ? memberItems.map(i => `  • ${i.quantity}x ${i.name}${i.special_instructions ? ` (${i.special_instructions})` : ""}  — $${(i.price * i.quantity).toFixed(2)}`).join("\n")
            : "  (No items submitted)";
          const deliveryLine = groupOrder.delivery_type === "delivery"
            ? `🚚 Delivery to: ${groupOrder.delivery_address?.street || ""}, ${groupOrder.delivery_address?.city || ""}`
            : `🏪 Pickup from: ${groupOrder.restaurant_name}`;
          const body = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  ORDER CONFIRMED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hi ${member.name},

Great news! ${groupOrder.organizer_name} has placed the group order and your food is now being prepared. 🎉

┌─────────────────────────────┐
  📋  ${groupOrder.title}
  🏪  ${groupOrder.restaurant_name}
  ${deliveryLine}
  🕐  Submitted: ${submittedAt}
└─────────────────────────────┘

YOUR ITEMS:
${itemLines}

  Your Subtotal:  $${(member.subtotal || 0).toFixed(2)}
  Group Total:    $${groupOrder.total_amount?.toFixed(2) || "0.00"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${groupOrder.delivery_type === "delivery"
  ? "Your order is on its way! You'll be notified when it's closer."
  : "Your order will be ready for pickup soon. You'll be notified when it's ready."}

Thank you for ordering with RESTROBUDDY!`;
          return base44.integrations.Core.SendEmail({
            to: member.email,
            subject: `✅ Order confirmed: "${groupOrder.title}" from ${groupOrder.restaurant_name}`,
            body
          }).catch(e => console.error("Failed to notify", member.email, e));
        })
      );

      alert("✅ Group order submitted successfully! All members have been notified by email.");
      setShowConfirmDialog(false);
      loadGroupOrder();
    } catch (error) {
      console.error("Error submitting order:", error);
      alert("❌ Failed to submit order: " + (error.message || "Please try again."));
    }
    setIsSubmitting(false);
  };

  const addNewMember = async () => {
    if (!newMember.name || !newMember.email) {
      alert("Please enter both name and email");
      return;
    }

    // Check max participants limit
    if (groupOrder.max_participants && groupOrder.party_members.length >= groupOrder.max_participants) {
      alert(`Cannot add more members. Maximum capacity (${groupOrder.max_participants}) reached.`);
      return;
    }

    setIsAddingMember(true);
    try {
      const memberId = crypto.randomUUID();
      const updatedMembers = [
        ...groupOrder.party_members,
        {
          id: memberId,
          name: newMember.name,
          email: newMember.email,
          status: "pending",
          items: [],
          subtotal: 0
        }
      ];

      // Update group order
      await GroupOrder.update(groupOrder.id, {
        party_members: updatedMembers,
        activity_log: [
          ...(groupOrder.activity_log || []),
          {
            timestamp: new Date().toISOString(),
            action: "member_added",
            user_name: groupOrder.organizer_name,
            user_email: groupOrder.organizer_email,
            details: `${newMember.name} was added to the group order`
          }
        ]
      });

      // Send invitation to new member
      try {
        const newMemberObj = { id: memberId, ...newMember };
        const memberLink = getMemberLink(newMemberObj);
        const deadlineStr = new Date(groupOrder.deadline).toLocaleString();
        await base44.integrations.Core.SendEmail({
          to: newMember.email,
          subject: `🍽️ You're invited to a group order: ${groupOrder.title}`,
          body: `Hi ${newMember.name},\n\n${groupOrder.organizer_name} has invited you to join a group order from ${groupOrder.restaurant_name}!\n\n📋 Order: ${groupOrder.title}\n⏰ Deadline: ${deadlineStr}\n\nClick the link below to pick your items:\n👉 ${memberLink}\n\nRESTROBUDDY`
        });
      } catch (error) {
        console.error("Failed to send invitation:", error);
      }

      setNewMember({ name: "", email: "" });
      setShowAddMemberDialog(false);
      loadGroupOrder();
    } catch (error) {
      console.error("Error adding member:", error);
      alert("Failed to add member. Please try again.");
    }
    setIsAddingMember(false);
  };

  const removeMember = async (member) => {
    if (member.status === "submitted") {
      if (!confirm(`${member.name} has already submitted their order. Are you sure you want to remove them?`)) {
        return;
      }
    }

    try {
      const updatedMembers = groupOrder.party_members.filter(m => m.id !== member.id);
      
      // Recalculate totals if member had submitted
      let newSubtotal = groupOrder.subtotal || 0;
      if (member.status === "submitted") {
        newSubtotal -= (member.subtotal || 0);
      }
      const newTax = newSubtotal * 0.08;
      const newTotal = newSubtotal + newTax;

      await GroupOrder.update(groupOrder.id, {
        party_members: updatedMembers,
        subtotal: newSubtotal,
        tax: newTax,
        total_amount: newTotal,
        activity_log: [
          ...(groupOrder.activity_log || []),
          {
            timestamp: new Date().toISOString(),
            action: "member_removed",
            user_name: groupOrder.organizer_name,
            user_email: groupOrder.organizer_email,
            details: `${member.name} was removed from the group order`
          }
        ]
      });

      // Notify removed member
      try {
        await base44.integrations.Core.SendEmail({
          to: member.email,
          subject: `Group order "${groupOrder.title}" has been updated`,
          body: `Hi ${member.name},\n\nYou have been removed from the group order "${groupOrder.title}".\n\nIf you have any questions, please contact ${groupOrder.organizer_name}.\n\nThank you,\nRESTROBUDDY`
        });
      } catch (error) {
        console.error("Failed to notify member:", error);
      }

      loadGroupOrder();
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Failed to remove member. Please try again.");
    }
  };

  const resendAllInvitations = async () => {
    const pendingMembers = groupOrder.party_members.filter(m => m.status !== "submitted");
    
    if (pendingMembers.length === 0) {
      alert("All members have already submitted their orders!");
      return;
    }

    if (!confirm(`Send reminder emails to ${pendingMembers.length} member(s) who haven't submitted yet?`)) {
      return;
    }

    try {
      const deadlineStr = new Date(groupOrder.deadline).toLocaleString();
      await Promise.all(pendingMembers.map(member => {
        const memberLink = getMemberLink(member);
        return base44.integrations.Core.SendEmail({
          to: member.email,
          subject: `⏰ Reminder: Submit your selection for "${groupOrder.title}"`,
          body: `Hi ${member.name},\n\n${groupOrder.organizer_name} is waiting for your food selection!\n\n📋 Order: ${groupOrder.title}\n🏪 Restaurant: ${groupOrder.restaurant_name}\n⏰ Deadline: ${deadlineStr}\n\nClick here to pick your items:\n👉 ${memberLink}\n\nRESTROBUDDY`
        }).catch(e => console.error(`Failed to remind ${member.email}`, e));
      }));
      alert(`Reminders sent to ${pendingMembers.length} member(s)!`);
    } catch (error) {
      console.error("Error resending invitations:", error);
      alert("Failed to send reminders. Please try again.");
    }
  };

  const cancelGroupOrder = async () => {
    if (!confirm("Are you sure you want to cancel this group order? This cannot be undone.")) return;
    
    try {
      await GroupOrder.update(groupOrder.id, { status: "cancelled" });
      
      // Notify all members
      for (const member of groupOrder.party_members) {
        try {
          await base44.integrations.Core.SendEmail({
            to: member.email,
            subject: `Group order "${groupOrder.title}" has been cancelled`,
            body: `
Hi ${member.name},

The group order "${groupOrder.title}" from ${groupOrder.restaurant_name} has been cancelled.

If you have any questions, please reach out to ${groupOrder.organizer_name}.

Thank you,
RESTROBUDDY
            `.trim()
          });
        } catch (error) {
          console.error(`Failed to notify ${member.name}:`, error);
        }
      }

      navigate(createPageUrl("MyGroupOrders"));
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert("Failed to cancel order. Please try again.");
    }
  };

  const handleSaveEditedItem = async (updatedItem) => {
    if (!editingMemberId) return;

    const updatedMembers = groupOrder.party_members.map(member => {
      if (member.id === editingMemberId) {
        let newItems;
        if (!updatedItem) {
          // Delete item
          newItems = member.items.filter(i => i.menu_item_id !== editingItem.menu_item_id);
        } else {
          // Update item
          newItems = member.items.map(i => i.menu_item_id === updatedItem.menu_item_id ? updatedItem : i);
        }
        const newSubtotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return { ...member, items: newItems, subtotal: newSubtotal };
      }
      return member;
    });

    // Recalculate group totals
    const newSubtotal = updatedMembers.reduce((sum, m) => sum + (m.subtotal || 0), 0);
    const newTax = newSubtotal * 0.08;
    const newTotal = newSubtotal + newTax;
    const newItemsCount = updatedMembers.reduce((sum, m) => sum + (m.items?.length || 0), 0);

    try {
      await GroupOrder.update(groupOrder.id, {
        party_members: updatedMembers,
        subtotal: newSubtotal,
        tax: newTax,
        total_amount: newTotal,
        total_items_count: newItemsCount,
        activity_log: [
          ...(groupOrder.activity_log || []),
          {
            timestamp: new Date().toISOString(),
            action: "item_edited",
            user_name: groupOrder.organizer_name,
            user_email: groupOrder.organizer_email,
            details: `Item was edited by organizer`
          }
        ]
      });
      loadGroupOrder();
    } catch (error) {
      console.error("Error editing item:", error);
      alert("Failed to edit item. Please try again.");
    }
    setEditingItem(null);
    setEditingMemberId(null);
  };

  const handleUpdateDeadline = async () => {
    if (!newDeadline) return;

    try {
      const updatedLog = [
        ...(groupOrder.activity_log || []),
        {
          timestamp: new Date().toISOString(),
          action: "deadline_changed",
          user_name: groupOrder.organizer_name,
          user_email: groupOrder.organizer_email,
          details: `Deadline updated to ${new Date(newDeadline).toLocaleString()}`
        }
      ];

      await GroupOrder.update(groupOrder.id, {
        deadline: newDeadline,
        activity_log: updatedLog
      });

      // Notify all members about deadline change
      for (const member of groupOrder.party_members) {
        try {
          await base44.integrations.Core.SendEmail({
            to: member.email,
            subject: `Group order deadline has been updated`,
            body: `Hi ${member.name},\n\nThe deadline for the group order "${groupOrder.title}" has been updated to ${new Date(newDeadline).toLocaleString()}.\n\nPlease place your order before this deadline.\n\nThank you,\nRESTROBUDDY`
          });

          await Notification.create({
            customer_email: member.email,
            title: "Order Deadline Updated",
            message: `The deadline for "${groupOrder.title}" has been extended to ${new Date(newDeadline).toLocaleString()}`,
            type: "order_update",
            priority: "high",
            status: "unread",
            action_url: `/manage-group-order?id=${groupOrder.id}`,
            action_label: "View Order",
            related_order_id: groupOrder.id,
            icon: "clock"
          });
        } catch (error) {
          console.error(`Failed to notify ${member.name}:`, error);
        }
      }

      loadGroupOrder();
      setShowEditDeadline(false);
      setNewDeadline("");
    } catch (error) {
      console.error("Error updating deadline:", error);
      alert("Failed to update deadline. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!groupOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Order Not Found</h2>
            <Button onClick={() => navigate(createPageUrl("MyGroupOrders"))}>
              Go to My Group Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isDeadlinePassed = new Date(groupOrder.deadline) < new Date();
  const meetsMinimum = !groupOrder.min_participants || submittedCount >= groupOrder.min_participants;
  const canSubmit = submittedCount > 0 && meetsMinimum && (groupOrder.status === "collecting" || groupOrder.status === "closed");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{groupOrder.title}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-slate-600 flex items-center gap-1">
                    <Store className="w-4 h-4" />
                    {groupOrder.restaurant_name}
                  </span>
                  <Badge className={
                    groupOrder.status === "collecting" ? "bg-blue-100 text-blue-700" :
                    groupOrder.status === "closed" ? "bg-amber-100 text-amber-700" :
                    groupOrder.status === "submitted" ? "bg-green-100 text-green-700" :
                    groupOrder.status === "cancelled" ? "bg-red-100 text-red-700" :
                    "bg-slate-100 text-slate-700"
                  }>
                    {groupOrder.status}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditOrder(true)}
                className="gap-2"
                disabled={groupOrder.status !== "collecting"}
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadGroupOrder}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Card */}
        <Card className="mb-6 border-0 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-purple-100 text-sm">Participants</p>
                <p className="text-3xl font-bold">
                  {submittedCount} / {totalMembers}
                  {groupOrder.min_participants && (
                    <span className="text-lg ml-2 text-purple-200">
                      (min: {groupOrder.min_participants})
                    </span>
                  )}
                </p>
                {groupOrder.min_participants && submittedCount < groupOrder.min_participants && (
                  <Badge className="mt-2 bg-amber-500">
                    Need {groupOrder.min_participants - submittedCount} more participant(s)
                  </Badge>
                )}
                <p className="text-sm text-purple-200 mt-2">
                  Total items: {groupOrder.total_items_count || 0}
                </p>
              </div>
              <div className="text-right">
                <p className="text-purple-100 text-sm flex items-center gap-1 justify-end">
                  <Clock className="w-4 h-4" />
                  Deadline
                </p>
                <div>
                  <p className={`font-semibold ${isDeadlinePassed ? 'text-amber-300' : ''}`}>
                    {new Date(groupOrder.deadline).toLocaleString()}
                  </p>
                  {groupOrder.status === "collecting" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setNewDeadline(groupOrder.deadline);
                        setShowEditDeadline(true);
                      }}
                      className="mt-1 text-xs text-purple-300 hover:bg-purple-500/20 h-auto p-1"
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <Progress value={progress} className="h-3 bg-white/20" />
          </div>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Estimated Total</p>
                  <p className="text-2xl font-bold text-slate-900">${groupOrder.total_amount?.toFixed(2) || "0.00"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600">Order Type</p>
                  <Badge variant="outline" className="text-sm">
                    {groupOrder.delivery_type === "delivery" ? "🚚 Delivery" : "🏪 Pickup"}
                  </Badge>
                </div>
                {groupOrder.min_participants && (
                  <div>
                    <p className="text-sm text-slate-600">Min. Participants</p>
                    <p className="text-lg font-bold text-slate-900">{groupOrder.min_participants}</p>
                  </div>
                )}
                </div>

              {groupOrder.delivery_type === "delivery" && groupOrder.delivery_address && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900 mb-1">Delivery Address:</p>
                  <p className="text-sm text-blue-800">
                    {groupOrder.delivery_address.street}<br />
                    {groupOrder.delivery_address.city}, {groupOrder.delivery_address.state} {groupOrder.delivery_address.zip}
                  </p>
                  {groupOrder.delivery_address.instructions && (
                    <p className="text-xs text-blue-700 mt-2 italic">
                      Instructions: {groupOrder.delivery_address.instructions}
                    </p>
                  )}
                </div>
              )}

              <div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyShareLink}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Link
                </Button>
                {groupOrder.status === "collecting" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={closeOrderEarly}
                    className="gap-2"
                  >
                    <X className="w-4 h-4" />
                    Close Early
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Tracking - Show after submission */}
        {['submitted', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed'].includes(groupOrder.status) && (
          <div className="mb-6">
            <GroupOrderTracker groupOrder={groupOrder} />
          </div>
        )}

        {/* Party Members */}
        <Card className="mb-6 border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Party Members
              </CardTitle>
              {groupOrder.status === "collecting" && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resendAllInvitations}
                    className="gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Resend All Invites
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowAddMemberDialog(true)}
                    className="bg-purple-600 hover:bg-purple-700 gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Member
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {groupOrder.party_members?.map((member, idx) => (
              <div 
                key={member.id} 
                className={`p-4 rounded-xl border-2 ${
                  member.status === "submitted" 
                    ? "bg-green-50 border-green-200" 
                    : member.status === "viewed"
                    ? "bg-blue-50 border-blue-200"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      member.status === "submitted" ? "bg-green-600" :
                      member.status === "viewed" ? "bg-blue-600" : "bg-slate-400"
                    }`}>
                      {member.status === "submitted" ? <Check className="w-5 h-5" /> : idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{member.name}</p>
                      <p className="text-sm text-slate-600">{member.email}</p>
                      {member.submitted_at && (
                        <p className="text-xs text-slate-500">
                          Submitted {new Date(member.submitted_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {member.status === "submitted" && (
                      <span className="font-bold text-green-700">
                        ${member.subtotal?.toFixed(2)}
                      </span>
                    )}
                    {getStatusBadge(member.status)}
                    {groupOrder.status === "collecting" && (
                      <div className="flex gap-1">
                        {member.status !== "submitted" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resendInvitation(member)}
                            disabled={resendingTo === member.id}
                            className="text-purple-600"
                            title="Resend invitation"
                          >
                            {resendingTo === member.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Mail className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeMember(member)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {member.items?.length > 0 && (
                  <div className="mt-3 pt-3 border-t" style={{
                    borderColor: member.status === 'submitted' ? '#bbf7d0' : '#e2e8f0'
                  }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className={`text-sm font-semibold ${member.status === 'submitted' ? 'text-green-700' : 'text-slate-700'}`}>
                        Items ordered: {member.items.length}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {member.items.map((item, i) => (
                        <div key={i} className="bg-white rounded-lg p-3 border border-slate-200">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-900">{item.quantity}x {item.name}</span>
                                {item.added_by_name && item.added_by_name !== member.name && (
                                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                                    Added by {item.added_by_name}
                                  </Badge>
                                )}
                              </div>
                              {item.special_instructions && (
                                <p className="text-xs text-slate-600 mt-1 italic">
                                  📝 {item.special_instructions}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-emerald-600 whitespace-nowrap">
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>
                              {groupOrder.status === "collecting" && member.status === "submitted" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingItem(item);
                                    setEditingMemberId(member.id);
                                  }}
                                  className="text-blue-600 hover:bg-blue-50 h-auto p-1"
                                  title="Edit item"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Activity Log */}
        {groupOrder.activity_log && groupOrder.activity_log.length > 0 && (
          <Card className="mb-6 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...groupOrder.activity_log].reverse().slice(0, 10).map((log, idx) => (
                  <div key={idx} className="flex gap-3 pb-3 border-b last:border-0">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{log.details}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-slate-600">{log.user_name}</p>
                        <span className="text-xs text-slate-400">•</span>
                        <p className="text-xs text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {groupOrder.status !== "submitted" && groupOrder.status !== "cancelled" && (
          <div className="flex gap-4 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setShowDuplicateDialog(true)}
              className="gap-2"
            >
              <CopyIcon className="w-4 h-4" />
              Duplicate Order
            </Button>
            <Button
              variant="outline"
              onClick={cancelGroupOrder}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Cancel Order
            </Button>
            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={!canSubmit}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-6"
              title={!meetsMinimum ? `Need at least ${groupOrder.min_participants} participants` : ''}
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Submit & Pay for Group Order (${groupOrder.total_amount?.toFixed(2) || "0.00"})
            </Button>
          </div>
        )}

        {groupOrder.status === "submitted" && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6 text-center">
              <Check className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-green-900 mb-2">Order Submitted!</h3>
              <p className="text-green-700 mb-4">
                Your group order has been submitted successfully. All members have been notified.
              </p>
              <Button onClick={() => navigate(createPageUrl("OrderStatus") + `?id=${groupOrder.order_id}`)}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Track Order Status
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add Member Dialog */}
        <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Member</DialogTitle>
              <DialogDescription>
                Invite a new person to join this group order
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-member-name">Name</Label>
                <Input
                  id="new-member-name"
                  placeholder="John Doe"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="new-member-email">Email</Label>
                <Input
                  id="new-member-email"
                  type="email"
                  placeholder="john@example.com"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddMemberDialog(false);
                  setNewMember({ name: "", email: "" });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={addNewMember}
                disabled={isAddingMember || !newMember.name || !newMember.email}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isAddingMember ? "Adding..." : "Add & Send Invite"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Item Edit Modal */}
        {editingItem && (
          <ItemEditModal
            isOpen={!!editingItem}
            item={editingItem}
            onClose={() => {
              setEditingItem(null);
              setEditingMemberId(null);
            }}
            onSave={handleSaveEditedItem}
          />
        )}

        {/* Edit Order Dialog */}
        <Dialog open={showEditOrder} onOpenChange={setShowEditOrder}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Group Order</DialogTitle>
              <DialogDescription>
                Update all order details and settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Details */}
              <div className="space-y-4 border-b pb-4">
                <h3 className="font-semibold text-slate-900">Basic Details</h3>
                <div>
                  <Label htmlFor="edit-title">Order Title</Label>
                  <Input
                    id="edit-title"
                    placeholder="e.g., Team Lunch"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-deadline">Deadline</Label>
                  <Input
                    id="edit-deadline"
                    type="datetime-local"
                    value={editFormData.deadline ? new Date(editFormData.deadline).toISOString().slice(0, 16) : ""}
                    onChange={(e) => setEditFormData({ ...editFormData, deadline: new Date(e.target.value).toISOString() })}
                    min={new Date().toISOString().slice(0, 16)}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-min">Min Participants</Label>
                    <Input
                      id="edit-min"
                      type="number"
                      min="0"
                      value={editFormData.min_participants}
                      onChange={(e) => setEditFormData({ ...editFormData, min_participants: parseInt(e.target.value) || 0 })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-max">Max Participants</Label>
                    <Input
                      id="edit-max"
                      type="number"
                      min="0"
                      value={editFormData.max_participants}
                      onChange={(e) => setEditFormData({ ...editFormData, max_participants: parseInt(e.target.value) || 0 })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Details */}
              <div className="space-y-4 border-b pb-4">
                <h3 className="font-semibold text-slate-900">Delivery Details</h3>
                <div>
                  <Label htmlFor="edit-delivery-type">Delivery Type</Label>
                  <select
                    id="edit-delivery-type"
                    value={editFormData.delivery_type}
                    onChange={(e) => setEditFormData({ ...editFormData, delivery_type: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="pickup">🏪 Pickup</option>
                    <option value="delivery">🚚 Delivery</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="edit-pickup-time">Pickup/Ready Time</Label>
                  <Input
                    id="edit-pickup-time"
                    type="datetime-local"
                    value={editFormData.pickup_time ? new Date(editFormData.pickup_time).toISOString().slice(0, 16) : ""}
                    onChange={(e) => setEditFormData({ ...editFormData, pickup_time: new Date(e.target.value).toISOString() })}
                    className="mt-1"
                  />
                </div>

                {editFormData.delivery_type === "delivery" && (
                  <div className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900">Delivery Address</h4>
                    <Input
                      placeholder="Street Address"
                      value={editFormData.delivery_address.street}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        delivery_address: { ...editFormData.delivery_address, street: e.target.value }
                      })}
                      className="mt-1"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="City"
                        value={editFormData.delivery_address.city}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          delivery_address: { ...editFormData.delivery_address, city: e.target.value }
                        })}
                      />
                      <Input
                        placeholder="State"
                        value={editFormData.delivery_address.state}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          delivery_address: { ...editFormData.delivery_address, state: e.target.value }
                        })}
                      />
                    </div>
                    <Input
                      placeholder="Zip Code"
                      value={editFormData.delivery_address.zip}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        delivery_address: { ...editFormData.delivery_address, zip: e.target.value }
                      })}
                    />
                    <Input
                      placeholder="Delivery Instructions (optional)"
                      value={editFormData.delivery_address.instructions}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        delivery_address: { ...editFormData.delivery_address, instructions: e.target.value }
                      })}
                    />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditOrder(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditOrder}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Deadline Dialog */}
        <Dialog open={showEditDeadline} onOpenChange={setShowEditDeadline}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Order Deadline</DialogTitle>
              <DialogDescription>
                Extend or change the submission deadline for this group order
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="deadline">New Deadline</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={newDeadline ? new Date(newDeadline).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setNewDeadline(new Date(e.target.value).toISOString())}
                  min={new Date().toISOString().slice(0, 16)}
                  className="mt-1"
                />
              </div>
              <p className="text-sm text-slate-600">
                All members will be notified of the new deadline.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditDeadline(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateDeadline}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Update Deadline
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Duplicate Order Dialog */}
        <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Duplicate Group Order</DialogTitle>
              <DialogDescription>
                Create a copy of this order and customize the details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="dup-title">Order Title</Label>
                <Input
                  id="dup-title"
                  placeholder="e.g., Team Lunch"
                  value={duplicateFormData.title}
                  onChange={(e) => setDuplicateFormData({ ...duplicateFormData, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dup-deadline">Deadline</Label>
                <Input
                  id="dup-deadline"
                  type="datetime-local"
                  value={duplicateFormData.deadline ? new Date(duplicateFormData.deadline).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setDuplicateFormData({ ...duplicateFormData, deadline: new Date(e.target.value).toISOString() })}
                  min={new Date().toISOString().slice(0, 16)}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dup-min">Min Participants</Label>
                  <Input
                    id="dup-min"
                    type="number"
                    min="0"
                    value={duplicateFormData.min_participants}
                    onChange={(e) => setDuplicateFormData({ ...duplicateFormData, min_participants: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="dup-max">Max Participants</Label>
                  <Input
                    id="dup-max"
                    type="number"
                    min="0"
                    value={duplicateFormData.max_participants}
                    onChange={(e) => setDuplicateFormData({ ...duplicateFormData, max_participants: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                ℹ️ All party members will be invited to this new order with empty selections.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDuplicateDialog(false)}
                disabled={isDuplicating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDuplicateOrder}
                disabled={isDuplicating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isDuplicating ? "Creating..." : "Create Duplicate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Group Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span>Subtotal ({submittedCount} people)</span>
                  <span>${groupOrder.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Tax (8%)</span>
                  <span>${groupOrder.tax?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span className="text-purple-600">${groupOrder.total_amount?.toFixed(2)}</span>
                </div>
              </div>

              <p className="text-sm text-slate-600">
                By clicking submit, you agree to pay for the entire group order. 
                All party members will be notified that the order has been placed.
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitFinalOrder}
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  {isSubmitting ? "Processing..." : "Submit Order"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}