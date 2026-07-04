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
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/lib/export";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Nature = "ASSETS" | "LIABILITIES" | "INCOME" | "EXPENSES" | "EQUITY";

interface LedgerGroup {
  id: string;
  name: string;
  nature: Nature;
  parentId: string | null;
  children: LedgerGroup[];
  ledgerCount: number;
  totalBalance: number;
}

// Raw group as returned by /api/accounting/ledger-groups
interface ApiLedgerGroup {
  id: string;
  name: string;
  nature: Nature;
  parentId: string | null;
  _count?: { ledgers: number };
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

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

// Build a two-level tree of top-level groups with their direct children.
// Balances are not exposed by this endpoint, so totalBalance stays 0.
function buildTree(raw: ApiLedgerGroup[]): LedgerGroup[] {
  const nodes = new Map<string, LedgerGroup>();
  raw.forEach((g) => {
    nodes.set(g.id, {
      id: g.id,
      name: g.name,
      nature: g.nature,
      parentId: g.parentId ?? null,
      children: [],
      ledgerCount: g._count?.ledgers ?? 0,
      totalBalance: 0,
    });
  });

  const roots: LedgerGroup[] = [];
  nodes.forEach((node) => {
    if (node.parentId && nodes.has(node.parentId)) {
      nodes.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Roll the child ledger counts up into the parent card total.
  roots.forEach((root) => {
    root.ledgerCount += root.children.reduce((sum, c) => sum + c.ledgerCount, 0);
  });

  return roots;
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
  const [allGroups, setAllGroups] = React.useState<ApiLedgerGroup[]>([]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    nature: "ASSETS",
    parentId: "",
  });

  const fetchGroups = React.useCallback(async () => {
    try {
      const res = await fetch("/api/accounting/ledger-groups");
      if (res.ok) {
        const data: ApiLedgerGroup[] = await res.json();
        setAllGroups(data);
        setGroups(buildTree(data));
      }
    } catch (error) {
      console.error("Failed to fetch ledger groups:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleSubmitGroup = async () => {
    if (!formData.name) {
      alert("Name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/accounting/ledger-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          nature: formData.nature,
          parentId: formData.parentId || null,
        }),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        setFormData({ name: "", nature: "ASSETS", parentId: "" });
        await fetchGroups();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create group");
      }
    } catch (error) {
      console.error("Failed to create group:", error);
      alert("Failed to create group");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const addGroupDialog = (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Group
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Ledger Group</DialogTitle>
          <DialogDescription>
            Create a new group to organize your ledger accounts
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Group Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Current Assets"
            />
          </div>
          <div className="space-y-2">
            <Label>Nature *</Label>
            <Select
              value={formData.nature}
              onValueChange={(v) => setFormData({ ...formData, nature: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ASSETS">Assets</SelectItem>
                <SelectItem value="LIABILITIES">Liabilities</SelectItem>
                <SelectItem value="INCOME">Income</SelectItem>
                <SelectItem value="EXPENSES">Expenses</SelectItem>
                <SelectItem value="EQUITY">Equity</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Parent Group</Label>
            <Select
              value={formData.parentId || "none"}
              onValueChange={(v) =>
                setFormData({ ...formData, parentId: v === "none" ? "" : v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="None (top-level)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (top-level)</SelectItem>
                {allGroups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name} ({g.nature})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsDialogOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmitGroup} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

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
          <Button
            variant="outline"
            disabled={allGroups.length === 0}
            onClick={() =>
              downloadCsv("chart-of-accounts", allGroups, [
                { key: "name", label: "Name" },
                { key: "nature", label: "Nature" },
                { key: "ledgers", label: "Ledgers", format: (g) => g._count?.ledgers ?? 0 },
              ])
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/accounting/ledgers">
              <BookOpen className="mr-2 h-4 w-4" />
              View Ledgers
            </Link>
          </Button>
          {addGroupDialog}
        </div>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">No ledger groups yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first group to start building your chart of accounts
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Group
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
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
            {(Object.entries(groupsByNature) as [keyof typeof groupsByNature, LedgerGroup[]][])
              .filter(([, natureGroups]) => natureGroups.length > 0)
              .map(([nature, natureGroups]) => (
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
        </>
      )}
    </div>
  );
}
