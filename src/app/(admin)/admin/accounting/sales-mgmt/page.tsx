"use client";

import Link from "next/link";
import { ArrowLeft, CreditCard, TrendingUp, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SalesManagementPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales Management</h1>
          <p className="text-gray-500">
            Track sales and customer payments
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
              <TrendingUp className="h-5 w-5 text-green-500" />
              Record Sale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Record sales and customer payments as income entries.
            </p>
            <Button asChild className="w-full bg-green-600 hover:bg-green-700">
              <Link href="/admin/accounts">Add Sales Entry</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Manage Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              View and manage your customer list.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/accounting/parties">View Parties</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Receipt Vouchers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Create receipt vouchers for customer payments.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/accounting/vouchers">View Vouchers</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Quick Sales Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Use the Accounts page to quickly record sales income.
            Select "Income" type and choose an appropriate category for your sale.
          </p>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/admin/accounts">Go to Accounts</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/invoices">Manage Invoices</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
