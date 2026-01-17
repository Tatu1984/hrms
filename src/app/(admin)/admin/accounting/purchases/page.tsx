"use client";

import Link from "next/link";
import { ArrowLeft, ShoppingCart, TrendingDown, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PurchasesPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchases</h1>
          <p className="text-gray-500">
            Track purchases and vendor payments
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
              Record Purchase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Record purchases and bills as expense entries.
            </p>
            <Button asChild className="w-full bg-red-600 hover:bg-red-700">
              <Link href="/admin/accounts">Add Purchase Entry</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Manage Vendors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              View and manage your vendor/supplier list.
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
              Payment Vouchers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Create payment vouchers for vendor payments.
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
            <ShoppingCart className="h-5 w-5" />
            Quick Purchase Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Use the Accounts page to quickly record purchase expenses.
            Select "Expense" type and choose an appropriate category for your purchase.
          </p>
          <Button asChild>
            <Link href="/admin/accounts">Go to Accounts</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
