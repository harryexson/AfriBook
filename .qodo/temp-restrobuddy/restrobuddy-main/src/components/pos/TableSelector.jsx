import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Users, Clock, Utensils } from "lucide-react";

const statusColors = {
  available: "bg-green-500",
  occupied: "bg-red-500",
  reserved: "bg-amber-500",
  needs_cleaning: "bg-purple-500"
};

const statusLabels = {
  available: "Available",
  occupied: "Occupied",
  reserved: "Reserved",
  needs_cleaning: "Cleaning"
};

export default function TableSelector({ tables, onSelect, onClose }) {
  const groupedTables = tables.reduce((acc, table) => {
    const section = table.location_section || "Main";
    if (!acc[section]) acc[section] = [];
    acc[section].push(table);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <CardHeader className="bg-slate-800 text-white flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Select Table
          </CardTitle>
          <Button size="icon" variant="ghost" onClick={onClose} className="text-white hover:bg-slate-700">
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Status Legend */}
          <div className="flex gap-4 mb-6 flex-wrap">
            {Object.entries(statusLabels).map(([status, label]) => (
              <div key={status} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
                <span className="text-sm text-slate-600">{label}</span>
              </div>
            ))}
          </div>

          {Object.entries(groupedTables).map(([section, sectionTables]) => (
            <div key={section} className="mb-6">
              <h3 className="font-bold text-slate-700 mb-3">{section}</h3>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {sectionTables.map(table => (
                  <button
                    key={table.id}
                    onClick={() => onSelect(table)}
                    disabled={table.status === "reserved"}
                    className={`
                      relative p-4 rounded-xl border-2 transition-all
                      ${table.status === "available" 
                        ? "border-green-500 bg-green-50 hover:bg-green-100 cursor-pointer" 
                        : table.status === "occupied"
                        ? "border-red-500 bg-red-50 hover:bg-red-100 cursor-pointer"
                        : table.status === "needs_cleaning"
                        ? "border-purple-500 bg-purple-50 hover:bg-purple-100 cursor-pointer"
                        : "border-amber-500 bg-amber-50 opacity-50 cursor-not-allowed"
                      }
                    `}
                  >
                    <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${statusColors[table.status]}`} />
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-800">{table.table_number}</p>
                      <div className="flex items-center justify-center gap-1 text-xs text-slate-500 mt-1">
                        <Users className="w-3 h-3" />
                        {table.capacity}
                      </div>
                    </div>
                    {table.status === "occupied" && table.seated_at && (
                      <div className="flex items-center justify-center gap-1 text-xs text-red-600 mt-1">
                        <Clock className="w-3 h-3" />
                        {Math.round((Date.now() - new Date(table.seated_at).getTime()) / 60000)}m
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {tables.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Utensils className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No tables configured. Go to Table Management to add tables.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}