"use client";

import Link from "next/link";
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BudgetsPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budgets</h1>
          <p className="text-gray-500">
            Budget planning and expense tracking
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
              Track Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Record all income sources to track your budget inflows.
            </p>
            <Button asChild className="w-full bg-green-600 hover:bg-green-700">
              <Link href="/admin/accounts">Add Income Entry</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Track Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Record all expenses to monitor budget spending.
            </p>
            <Button asChild className="w-full bg-red-600 hover:bg-red-700">
              <Link href="/admin/accounts">Add Expense Entry</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              View Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              View your complete financial summary and balances.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/accounts">View All Transactions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Quick Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Use the Accounts page to quickly add income and expense entries.
            All entries are automatically tracked in the accounting system with proper double-entry bookkeeping.
          </p>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/admin/accounts">Go to Accounts</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/accounting/fin-reports">View Reports</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
