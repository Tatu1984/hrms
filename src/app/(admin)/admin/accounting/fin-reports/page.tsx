"use client";

import Link from "next/link";
import { ArrowLeft, BarChart3, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function FinancialReportsPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-gray-500">
            Profit & Loss, Balance Sheet, and Cash Flow statements
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/accounting">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Accounting
          </Link>
        </Button>
      </div>

      <Card className="border-dashed">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100">
            <BarChart3 className="h-8 w-8 text-violet-600" />
          </div>
          <CardTitle className="text-xl">Coming Soon</CardTitle>
          <CardDescription className="text-base">
            The Financial Reports module is currently under development.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
            <Clock className="h-4 w-4" />
            <span>Expected features:</span>
          </div>
          <ul className="text-sm text-gray-600 space-y-2 max-w-md mx-auto text-left">
            <li>- Profit & Loss statement</li>
            <li>- Balance Sheet</li>
            <li>- Cash Flow statement</li>
            <li>- Trial Balance</li>
            <li>- Day Book and registers</li>
            <li>- Custom financial reports</li>
          </ul>
          <div className="mt-6">
            <Button asChild>
              <Link href="/admin/accounting">
                Return to Accounting Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
