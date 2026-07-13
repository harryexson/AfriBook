import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ExportReportButton({ data, filename = "report" }) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = (data) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    downloadBlob(blob, `${filename}.csv`);
  };

  const exportToJSON = (data) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    downloadBlob(blob, `${filename}.json`);
  };

  const exportToPDF = async (data) => {
    setIsExporting(true);
    try {
      // Generate simple PDF report
      const reportHtml = generateReportHTML(data);
      const printWindow = window.open('', '_blank');
      printWindow.document.write(reportHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to export PDF');
    }
    setIsExporting(false);
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateReportHTML = (data) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${filename}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #10b981; border-bottom: 3px solid #10b981; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #10b981; color: white; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .metadata { margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h1>RESTROBUDDY - ${filename}</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              ${Object.keys(data[0] || {}).map(key => `<th>${key}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${Object.values(row).map(val => `<td>${val ?? ''}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="metadata">
          <p>© 2024 RESTROBUDDY - by Bold Intelligent Solutions Partners Inc.</p>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Export Report
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => exportToCSV(data)}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToJSON(data)}>
          <FileText className="w-4 h-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToPDF(data)}>
          <FileText className="w-4 h-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}