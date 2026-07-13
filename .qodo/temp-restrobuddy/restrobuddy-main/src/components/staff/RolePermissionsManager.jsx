import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Shield, Check } from "lucide-react";

export default function RolePermissionsManager({ onClose }) {
  const roles = [
    {
      name: "Manager",
      key: "manager",
      color: "bg-purple-100 text-purple-800",
      description: "Full access to manage restaurant operations",
      permissions: {
        manage_inventory: true,
        manage_orders: true,
        manage_menu: true,
        manage_tables: true,
        view_reports: true,
        manage_employees: true,
        process_payroll: true
      }
    },
    {
      name: "Chef",
      key: "chef",
      color: "bg-orange-100 text-orange-800",
      description: "Kitchen operations and menu management",
      permissions: {
        manage_inventory: true,
        manage_orders: true,
        manage_menu: true,
        manage_tables: false,
        view_reports: false,
        manage_employees: false,
        process_payroll: false
      }
    },
    {
      name: "Server",
      key: "server",
      color: "bg-blue-100 text-blue-800",
      description: "Handle orders and table service",
      permissions: {
        manage_inventory: false,
        manage_orders: true,
        manage_menu: false,
        manage_tables: true,
        view_reports: false,
        manage_employees: false,
        process_payroll: false
      }
    },
    {
      name: "Cashier",
      key: "cashier",
      color: "bg-green-100 text-green-800",
      description: "Process payments and handle transactions",
      permissions: {
        manage_inventory: false,
        manage_orders: true,
        manage_menu: false,
        manage_tables: false,
        view_reports: false,
        manage_employees: false,
        process_payroll: false
      }
    },
    {
      name: "Kitchen Staff",
      key: "kitchen_staff",
      color: "bg-amber-100 text-amber-800",
      description: "Prepare orders and manage kitchen tasks",
      permissions: {
        manage_inventory: true,
        manage_orders: true,
        manage_menu: false,
        manage_tables: false,
        view_reports: false,
        manage_employees: false,
        process_payroll: false
      }
    },
    {
      name: "Delivery Driver",
      key: "delivery",
      color: "bg-indigo-100 text-indigo-800",
      description: "Handle delivery orders",
      permissions: {
        manage_inventory: false,
        manage_orders: true,
        manage_menu: false,
        manage_tables: false,
        view_reports: false,
        manage_employees: false,
        process_payroll: false
      }
    }
  ];

  const permissionLabels = {
    manage_inventory: "Manage Inventory",
    manage_orders: "Manage Orders",
    manage_menu: "Manage Menu",
    manage_tables: "Manage Tables",
    view_reports: "View Reports",
    manage_employees: "Manage Employees",
    process_payroll: "Process Payroll"
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-5xl w-full max-h-[90vh] overflow-auto">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6" />
              <CardTitle className="text-2xl">Role Permissions</CardTitle>
            </div>
            <Button size="icon" variant="ghost" onClick={onClose} className="text-white hover:bg-purple-500">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <p className="text-slate-600 mb-6">
            Default permissions for each staff role. Individual permissions can be customized when editing staff members.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {roles.map((role) => (
              <Card key={role.key} className="border-2">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge className={`${role.color} text-base py-1 px-3`}>
                      {role.name}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">{role.description}</p>

                  <div className="space-y-2">
                    {Object.entries(role.permissions).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-slate-700">
                          {permissionLabels[key]}
                        </span>
                        {value ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Check className="w-3 h-3 mr-1" />
                            Yes
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600">
                            No
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> These are default permissions. You can customize individual staff member permissions when adding or editing their profile.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}