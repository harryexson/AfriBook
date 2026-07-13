import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { Employee } from "@/entities/Employee";

export default function EmployeeTaxInfo({ employee, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [taxInfo, setTaxInfo] = useState({
    ssn_last4: '',
    filing_status: 'single',
    federal_allowances: 0,
    state_allowances: 0,
    additional_withholding: 0,
    exempt_federal: false,
    exempt_state: false,
    state: '',
    w4_submitted: false,
    w4_date: ''
  });
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zip: ''
  });

  useEffect(() => {
    if (employee) {
      setTaxInfo(employee.tax_info || {
        ssn_last4: '',
        filing_status: 'single',
        federal_allowances: 0,
        state_allowances: 0,
        additional_withholding: 0,
        exempt_federal: false,
        exempt_state: false,
        state: '',
        w4_submitted: false,
        w4_date: ''
      });
      setAddress(employee.address || {
        street: '',
        city: '',
        state: '',
        zip: ''
      });
    }
  }, [employee]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Employee.update(employee.id, {
        tax_info: taxInfo,
        address: address
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving tax info:", error);
      alert("Failed to save tax information");
    }
    setSaving(false);
  };

  const filingStatuses = [
    { value: 'single', label: 'Single' },
    { value: 'married', label: 'Married Filing Jointly' },
    { value: 'married_separate', label: 'Married Filing Separately' },
    { value: 'head_of_household', label: 'Head of Household' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="max-w-2xl w-full">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Tax Information
              </CardTitle>
              <p className="text-purple-200 text-sm mt-1">{employee?.full_name}</p>
            </div>
            <Button size="icon" variant="ghost" onClick={onClose} className="text-white hover:bg-purple-500">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* W-4 Status */}
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-slate-600" />
                <div>
                  <div className="font-semibold">W-4 Form Status</div>
                  <div className="text-sm text-slate-500">
                    {taxInfo.w4_submitted 
                      ? `Submitted on ${taxInfo.w4_date}` 
                      : 'Not yet submitted'}
                  </div>
                </div>
              </div>
              {taxInfo.w4_submitted ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-800">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Pending
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Personal Info */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Personal Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>SSN (Last 4 digits)</Label>
                  <Input
                    type="password"
                    maxLength={4}
                    value={taxInfo.ssn_last4 || ''}
                    onChange={(e) => setTaxInfo({...taxInfo, ssn_last4: e.target.value})}
                    placeholder="••••"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={employee?.date_of_birth || ''}
                    disabled
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Address</h3>
              <div className="space-y-3">
                <div>
                  <Label>Street Address</Label>
                  <Input
                    value={address.street || ''}
                    onChange={(e) => setAddress({...address, street: e.target.value})}
                    placeholder="123 Main St"
                    className="mt-1"
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <Label>City</Label>
                    <Input
                      value={address.city || ''}
                      onChange={(e) => setAddress({...address, city: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input
                      value={address.state || ''}
                      onChange={(e) => setAddress({...address, state: e.target.value})}
                      maxLength={2}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>ZIP Code</Label>
                    <Input
                      value={address.zip || ''}
                      onChange={(e) => setAddress({...address, zip: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tax Withholding */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Tax Withholding</h3>
              <div className="space-y-4">
                <div>
                  <Label>Filing Status</Label>
                  <select
                    value={taxInfo.filing_status || 'single'}
                    onChange={(e) => setTaxInfo({...taxInfo, filing_status: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  >
                    {filingStatuses.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Federal Allowances</Label>
                    <Input
                      type="number"
                      min="0"
                      value={taxInfo.federal_allowances || 0}
                      onChange={(e) => setTaxInfo({...taxInfo, federal_allowances: parseInt(e.target.value) || 0})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>State Allowances</Label>
                    <Input
                      type="number"
                      min="0"
                      value={taxInfo.state_allowances || 0}
                      onChange={(e) => setTaxInfo({...taxInfo, state_allowances: parseInt(e.target.value) || 0})}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Additional Withholding ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={taxInfo.additional_withholding || 0}
                    onChange={(e) => setTaxInfo({...taxInfo, additional_withholding: parseFloat(e.target.value) || 0})}
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">Extra amount to withhold each pay period</p>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium">Exempt from Federal Tax</div>
                    <div className="text-xs text-slate-500">Employee claims exemption from federal withholding</div>
                  </div>
                  <Switch
                    checked={taxInfo.exempt_federal || false}
                    onCheckedChange={(checked) => setTaxInfo({...taxInfo, exempt_federal: checked})}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium">Exempt from State Tax</div>
                    <div className="text-xs text-slate-500">Employee claims exemption from state withholding</div>
                  </div>
                  <Switch
                    checked={taxInfo.exempt_state || false}
                    onCheckedChange={(checked) => setTaxInfo({...taxInfo, exempt_state: checked})}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium">W-4 Form Received</div>
                    <div className="text-xs text-slate-500">Mark when employee has submitted W-4</div>
                  </div>
                  <Switch
                    checked={taxInfo.w4_submitted || false}
                    onCheckedChange={(checked) => setTaxInfo({
                      ...taxInfo, 
                      w4_submitted: checked,
                      w4_date: checked ? new Date().toISOString().split('T')[0] : ''
                    })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-purple-600 hover:bg-purple-700">
              {saving ? 'Saving...' : 'Save Tax Information'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}