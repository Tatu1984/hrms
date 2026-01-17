"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Receipt,
  Building2,
  Package,
  Users,
  ShoppingCart,
  FileText,
  Calculator,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Wallet,
  CreditCard,
  BarChart3,
  PieChart,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  cashBalance: number;
  bankBalance: number;
  receivables: number;
  payables: number;
  pendingInvoices: number;
  pendingBills: number;
}

const accountingModules = [
  {
    title: "Chart of Accounts",
    description: "Manage ledger groups and accounts",
    href: "/admin/accounting/chart-of-accounts",
    icon: BookOpen,
    color: "bg-blue-500",
  },
  {
    title: "Ledgers",
    description: "View and manage all ledgers",
    href: "/admin/accounting/ledgers",
    icon: Receipt,
    color: "bg-green-500",
  },
  {
    title: "Vouchers",
    description: "Journal entries and transactions",
    href: "/admin/accounting/vouchers",
    icon: FileText,
    color: "bg-purple-500",
  },
  {
    title: "Cost Centers",
    description: "Track costs by department/project",
    href: "/admin/accounting/cost-centers",
    icon: PieChart,
    color: "bg-orange-500",
  },
  {
    title: "Banking",
    description: "Bank accounts and reconciliation",
    href: "/admin/accounting/banking",
    icon: Building2,
    color: "bg-cyan-500",
  },
  {
    title: "Inventory",
    description: "Items, stock, and warehouses",
    href: "/admin/accounting/inventory",
    icon: Package,
    color: "bg-amber-500",
  },
  {
    title: "Parties",
    description: "Customers and vendors",
    href: "/admin/accounting/parties",
    icon: Users,
    color: "bg-pink-500",
  },
  {
    title: "Purchases",
    description: "Bills and purchase orders",
    href: "/admin/accounting/purchases",
    icon: ShoppingCart,
    color: "bg-red-500",
  },
  {
    title: "Sales Management",
    description: "Invoices, quotations, and orders",
    href: "/admin/accounting/sales-mgmt",
    icon: CreditCard,
    color: "bg-emerald-500",
  },
  {
    title: "Taxation",
    description: "GST, TDS, and tax reports",
    href: "/admin/accounting/taxation",
    icon: Calculator,
    color: "bg-indigo-500",
  },
  {
    title: "Financial Reports",
    description: "P&L, Balance Sheet, Cash Flow",
    href: "/admin/accounting/fin-reports",
    icon: BarChart3,
    color: "bg-violet-500",
  },
  {
    title: "Budgets",
    description: "Budget planning and tracking",
    href: "/admin/accounting/budgets",
    icon: Wallet,
    color: "bg-teal-500",
  },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

export default function AccountingDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // For now, use mock data - will be replaced with actual API call
    const mockStats: DashboardStats = {
      totalIncome: 2450000,
      totalExpenses: 1820000,
      netProfit: 630000,
      cashBalance: 125000,
      bankBalance: 875000,
      receivables: 450000,
      payables: 280000,
      pendingInvoices: 12,
      pendingBills: 8,
    };

    setTimeout(() => {
      setStats(mockStats);
      setIsLoading(false);
    }, 500);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accounting</h1>
          <p className="text-gray-500">
            Complete financial management and accounting system
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/accounting/fin-reports">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Reports
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/accounting/vouchers/new">
              <FileText className="mr-2 h-4 w-4" />
              New Voucher
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Income
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalIncome)}
              </div>
              <p className="text-xs text-gray-500 flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Expenses
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.totalExpenses)}
              </div>
              <p className="text-xs text-gray-500 flex items-center mt-1">
                <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                +5% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Net Profit
              </CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(stats.netProfit)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {((stats.netProfit / stats.totalIncome) * 100).toFixed(1)}% profit margin
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Cash + Bank
              </CardTitle>
              <Wallet className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(stats.cashBalance + stats.bankBalance)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Cash: {formatCurrency(stats.cashBalance)} | Bank: {formatCurrency(stats.bankBalance)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Receivables and Payables */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Receivables</CardTitle>
              <CardDescription>Outstanding amounts from customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(stats.receivables)}
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {stats.pendingInvoices} pending invoices
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payables</CardTitle>
              <CardDescription>Outstanding amounts to vendors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-red-600">
                  {formatCurrency(stats.payables)}
                </div>
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  {stats.pendingBills} pending bills
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Accounting Modules Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Accounting Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {accountingModules.map((module) => (
            <Link key={module.href} href={module.href}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-l-4" style={{ borderLeftColor: module.color.replace('bg-', '').includes('500') ? undefined : undefined }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${module.color}`}>
                      <module.icon className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-base">{module.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">{module.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/accounting/vouchers/new?type=receipt">
                <ArrowUpRight className="mr-2 h-4 w-4 text-green-500" />
                Record Receipt
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/accounting/vouchers/new?type=payment">
                <ArrowDownRight className="mr-2 h-4 w-4 text-red-500" />
                Record Payment
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/accounting/sales-mgmt/invoices/new">
                <FileText className="mr-2 h-4 w-4 text-blue-500" />
                Create Invoice
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/accounting/purchases/bills/new">
                <Receipt className="mr-2 h-4 w-4 text-orange-500" />
                Record Bill
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/accounting/banking/reconciliation">
                <Building2 className="mr-2 h-4 w-4 text-purple-500" />
                Bank Reconciliation
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
