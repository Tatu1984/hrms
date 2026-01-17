"use client";

import Link from "next/link";
import { ArrowLeft, PieChart, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CostCentersPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cost Centers</h1>
          <p className="text-gray-500">
            Track costs by department, project, or location
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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <PieChart className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-xl">Coming Soon</CardTitle>
          <CardDescription className="text-base">
            The Cost Centers module is currently under development.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
            <Clock className="h-4 w-4" />
            <span>Expected features:</span>
          </div>
          <ul className="text-sm text-gray-600 space-y-2 max-w-md mx-auto text-left">
            <li>- Create and manage cost centers</li>
            <li>- Track expenses by department</li>
            <li>- Project-based cost allocation</li>
            <li>- Location-wise expense tracking</li>
            <li>- Cost center reports and analytics</li>
            <li>- Budget vs actual comparison</li>
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
