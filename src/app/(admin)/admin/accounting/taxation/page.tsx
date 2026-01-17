"use client";

import Link from "next/link";
import { ArrowLeft, Calculator, FileText, TrendingDown, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TaxationPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Taxation</h1>
          <p className="text-gray-500">
            Tax tracking and expense management
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/accounting">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Record Tax Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Record tax payments as expense entries (TDS, GST, etc.).
            </p>
            <Button asChild className="w-full bg-red-600 hover:bg-red-700">
              <Link href="/admin/accounts">Add Tax Expense</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              View Vouchers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              View all accounting vouchers including tax entries.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/accounting/vouchers">View Vouchers</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-500" />
              Financial Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              View profit & loss and other financial reports.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/accounting/fin-reports">View Reports</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Tax Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Track your tax payments through the Accounts page. Create expense entries with categories
            like "GST Payment", "TDS Payment", "Income Tax", etc. to maintain proper records.
          </p>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/admin/accounts">Go to Accounts</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/accounting/ledgers">View Ledgers</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
