"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plus,
  BookOpen,
  ChevronRight,
  Loader2,
  TrendingUp,
  TrendingDown,
  Wallet,
  DollarSign,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LedgerGroup {
  id: string;
  name: string;
  nature: "ASSETS" | "LIABILITIES" | "INCOME" | "EXPENSES" | "EQUITY";
  parentId: string | null;
  children: LedgerGroup[];
  ledgerCount: number;
  totalBalance: number;
}

const natureConfig = {
  ASSETS: {
    color: "bg-blue-100 text-blue-800 border-blue-200",
    bgColor: "bg-blue-50",
    icon: Wallet,
    description: "What you own",
  },
  LIABILITIES: {
    color: "bg-red-100 text-red-800 border-red-200",
    bgColor: "bg-red-50",
    icon: CreditCard,
    description: "What you owe",
  },
  INCOME: {
    color: "bg-green-100 text-green-800 border-green-200",
    bgColor: "bg-green-50",
    icon: TrendingUp,
    description: "Money coming in",
  },
  EXPENSES: {
    color: "bg-orange-100 text-orange-800 border-orange-200",
    bgColor: "bg-orange-50",
    icon: TrendingDown,
    description: "Money going out",
  },
  EQUITY: {
    color: "bg-purple-100 text-purple-800 border-purple-200",
    bgColor: "bg-purple-50",
    icon: DollarSign,
    description: "Owner's stake",
  },
};

// Mock data
const mockGroups: LedgerGroup[] = [
  {
    id: "1",
    name: "Current Assets",
    nature: "ASSETS",
    parentId: null,
    children: [
      { id: "1a", name: "Cash & Bank", nature: "ASSETS", parentId: "1", children: [], ledgerCount: 5, totalBalance: 1000000 },
      { id: "1b", name: "Sundry Debtors", nature: "ASSETS", parentId: "1", children: [], ledgerCount: 12, totalBalance: 450000 },
      { id: "1c", name: "Stock in Trade", nature: "ASSETS", parentId: "1", children: [], ledgerCount: 3, totalBalance: 250000 },
    ],
    ledgerCount: 20,
    totalBalance: 1700000,
  },
  {
    id: "2",
    name: "Fixed Assets",
    nature: "ASSETS",
    parentId: null,
    children: [
      { id: "2a", name: "Furniture & Fixtures", nature: "ASSETS", parentId: "2", children: [], ledgerCount: 2, totalBalance: 150000 },
      { id: "2b", name: "Computer Equipment", nature: "ASSETS", parentId: "2", children: [], ledgerCount: 3, totalBalance: 300000 },
    ],
    ledgerCount: 5,
    totalBalance: 450000,
  },
  {
    id: "3",
    name: "Current Liabilities",
    nature: "LIABILITIES",
    parentId: null,
    children: [
      { id: "3a", name: "Sundry Creditors", nature: "LIABILITIES", parentId: "3", children: [], ledgerCount: 8, totalBalance: 280000 },
      { id: "3b", name: "Duties & Taxes", nature: "LIABILITIES", parentId: "3", children: [], ledgerCount: 4, totalBalance: 85000 },
    ],
    ledgerCount: 12,
    totalBalance: 365000,
  },
  {
    id: "4",
    name: "Direct Income",
    nature: "INCOME",
    parentId: null,
    children: [
      { id: "4a", name: "Sales", nature: "INCOME", parentId: "4", children: [], ledgerCount: 3, totalBalance: 2200000 },
      { id: "4b", name: "Service Revenue", nature: "INCOME", parentId: "4", children: [], ledgerCount: 2, totalBalance: 250000 },
    ],
    ledgerCount: 5,
    totalBalance: 2450000,
  },
  {
    id: "5",
    name: "Direct Expenses",
    nature: "EXPENSES",
    parentId: null,
    children: [
      { id: "5a", name: "Salaries & Wages", nature: "EXPENSES", parentId: "5", children: [], ledgerCount: 1, totalBalance: 1200000 },
      { id: "5b", name: "Professional Fees", nature: "EXPENSES", parentId: "5", children: [], ledgerCount: 2, totalBalance: 180000 },
    ],
    ledgerCount: 3,
    totalBalance: 1380000,
  },
  {
    id: "6",
    name: "Indirect Expenses",
    nature: "EXPENSES",
    parentId: null,
    children: [
      { id: "6a", name: "Office Expenses", nature: "EXPENSES", parentId: "6", children: [], ledgerCount: 4, totalBalance: 120000 },
      { id: "6b", name: "Rent & Utilities", nature: "EXPENSES", parentId: "6", children: [], ledgerCount: 3, totalBalance: 360000 },
    ],
    ledgerCount: 7,
    totalBalance: 480000,
  },
  {
    id: "7",
    name: "Capital",
    nature: "EQUITY",
    parentId: null,
    children: [],
    ledgerCount: 2,
    totalBalance: 1000000,
  },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

function GroupCard({ group }: { group: LedgerGroup }) {
  const config = natureConfig[group.nature];
  const Icon = config.icon;

  return (
    <Card className={`${config.bgColor} border`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded ${config.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <CardTitle className="text-base">{group.name}</CardTitle>
          </div>
          <Badge variant="outline" className={config.color}>
            {group.nature}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold">{formatCurrency(group.totalBalance)}</span>
          <span className="text-sm text-gray-500">{group.ledgerCount} ledgers</span>
        </div>
        {group.children.length > 0 && (
          <div className="space-y-2">
            {group.children.map((child) => (
              <div
                key={child.id}
                className="flex items-center justify-between p-2 bg-white rounded border"
              >
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">{child.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{formatCurrency(child.totalBalance)}</div>
                  <div className="text-xs text-gray-500">{child.ledgerCount} ledgers</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ChartOfAccountsPage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [groups, setGroups] = React.useState<LedgerGroup[]>([]);

  React.useEffect(() => {
    setTimeout(() => {
      setGroups(mockGroups);
      setIsLoading(false);
    }, 500);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const groupsByNature = {
    ASSETS: groups.filter((g) => g.nature === "ASSETS"),
    LIABILITIES: groups.filter((g) => g.nature === "LIABILITIES"),
    INCOME: groups.filter((g) => g.nature === "INCOME"),
    EXPENSES: groups.filter((g) => g.nature === "EXPENSES"),
    EQUITY: groups.filter((g) => g.nature === "EQUITY"),
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chart of Accounts</h1>
          <p className="text-gray-500">
            Organize your ledger accounts into groups
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/accounting/ledgers">
              <BookOpen className="mr-2 h-4 w-4" />
              View Ledgers
            </Link>
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Group
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {(Object.entries(natureConfig) as [keyof typeof natureConfig, typeof natureConfig[keyof typeof natureConfig]][]).map(([nature, config]) => {
          const total = groupsByNature[nature].reduce((sum, g) => sum + g.totalBalance, 0);
          const Icon = config.icon;
          return (
            <Card key={nature} className={config.bgColor}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1 rounded ${config.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{nature}</span>
                </div>
                <div className="text-xl font-bold">{formatCurrency(total)}</div>
                <p className="text-xs text-gray-500">{config.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Groups by Nature */}
      <div className="space-y-6">
        {(Object.entries(groupsByNature) as [keyof typeof groupsByNature, LedgerGroup[]][]).map(([nature, natureGroups]) => (
          <div key={nature}>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              {React.createElement(natureConfig[nature].icon, { className: "h-5 w-5" })}
              {nature}
              <Badge variant="secondary" className="ml-2">
                {natureGroups.reduce((sum, g) => sum + g.ledgerCount, 0)} ledgers
              </Badge>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {natureGroups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
