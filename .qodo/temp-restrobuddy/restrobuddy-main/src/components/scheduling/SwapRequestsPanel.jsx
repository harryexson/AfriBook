import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RefreshCw, Check, X, ArrowRightLeft, Gift, Hand } from "lucide-react";
import { ShiftSwapRequest } from "@/entities/ShiftSwapRequest";
import { ShiftSchedule } from "@/entities/ShiftSchedule";
import { format } from "date-fns";

export default function SwapRequestsPanel({ requests, employees, shifts, onRefresh }) {
  const [processing, setProcessing] = useState(null);
  const [managerNotes, setManagerNotes] = useState({});

  const handleApprove = async (request) => {
    setProcessing(request.id);
    try {
      // Update request status
      await ShiftSwapRequest.update(request.id, {
        status: 'manager_approved',
        manager_responded_at: new Date().toISOString(),
        manager_response: managerNotes[request.id] || 'Approved'
      });

      // Perform the shift swap
      if (request.swap_type === 'swap' && request.target_shift_id) {
        // Swap both shifts
        const originalShift = shifts.find(s => s.id === request.original_shift_id);
        const targetShift = shifts.find(s => s.id === request.target_shift_id);

        if (originalShift && targetShift) {
          await ShiftSchedule.update(originalShift.id, {
            employee_id: request.target_employee_id,
            employee_name: request.target_employee_name
          });
          await ShiftSchedule.update(targetShift.id, {
            employee_id: request.requester_id,
            employee_name: request.requester_name
          });
        }
      } else if (request.swap_type === 'giveaway' && request.target_employee_id) {
        // Give shift to another employee
        await ShiftSchedule.update(request.original_shift_id, {
          employee_id: request.target_employee_id,
          employee_name: request.target_employee_name
        });
      } else if (request.swap_type === 'pickup') {
        // Someone picking up an open shift
        await ShiftSchedule.update(request.original_shift_id, {
          employee_id: request.requester_id,
          employee_name: request.requester_name
        });
      }

      onRefresh();
    } catch (error) {
      console.error("Error approving swap:", error);
      alert("Failed to approve swap request");
    }
    setProcessing(null);
  };

  const handleReject = async (request) => {
    setProcessing(request.id);
    try {
      await ShiftSwapRequest.update(request.id, {
        status: 'rejected',
        manager_responded_at: new Date().toISOString(),
        manager_response: managerNotes[request.id] || 'Rejected'
      });
      onRefresh();
    } catch (error) {
      console.error("Error rejecting swap:", error);
    }
    setProcessing(null);
  };

  const getSwapTypeIcon = (type) => {
    const icons = {
      swap: ArrowRightLeft,
      giveaway: Gift,
      pickup: Hand
    };
    return icons[type] || RefreshCw;
  };

  const getSwapTypeColor = (type) => {
    const colors = {
      swap: 'bg-blue-100 text-blue-800',
      giveaway: 'bg-purple-100 text-purple-800',
      pickup: 'bg-green-100 text-green-800'
    };
    return colors[type] || 'bg-slate-100 text-slate-800';
  };

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-emerald-600" />
          Shift Swap Requests
        </CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No pending swap requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(request => {
              const Icon = getSwapTypeIcon(request.swap_type);
              const originalShift = shifts.find(s => s.id === request.original_shift_id);

              return (
                <Card key={request.id} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getSwapTypeColor(request.swap_type)}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-900">{request.requester_name}</span>
                            <Badge className={getSwapTypeColor(request.swap_type)}>
                              {request.swap_type}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600">
                            {request.original_shift_date && format(new Date(request.original_shift_date), 'EEE, MMM d')}
                            {' • '}{request.original_shift_time || (originalShift && `${originalShift.start_time} - ${originalShift.end_time}`)}
                          </p>
                          {request.target_employee_name && (
                            <p className="text-sm text-slate-600">
                              {request.swap_type === 'swap' ? 'Swap with: ' : 'Give to: '}
                              <span className="font-medium">{request.target_employee_name}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-slate-500">
                        {format(new Date(request.created_date), 'MMM d, h:mm a')}
                      </span>
                    </div>

                    {request.reason && (
                      <div className="bg-slate-50 rounded-lg p-3 mb-4">
                        <p className="text-sm text-slate-700">
                          <strong>Reason:</strong> {request.reason}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Input
                        placeholder="Manager notes (optional)..."
                        value={managerNotes[request.id] || ''}
                        onChange={(e) => setManagerNotes({...managerNotes, [request.id]: e.target.value})}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => handleApprove(request)}
                        disabled={processing === request.id}
                        className="bg-emerald-600"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleReject(request)}
                        disabled={processing === request.id}
                        variant="outline"
                        className="text-red-600"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}