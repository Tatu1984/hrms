"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  ArrowUpDown,
  FileText,
  Download,
  Loader2,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LedgerGroup {
  id: string;
  name: string;
  nature: "ASSETS" | "LIABILITIES" | "INCOME" | "EXPENSES" | "EQUITY";
}

interface Ledger {
  id: string;
  name: string;
  code: string | null;
  group: LedgerGroup;
  openingBalance: number;
  openingBalanceType: "DEBIT" | "CREDIT";
  currentBalance: number;
  gstNo: string | null;
  panNo: string | null;
  isActive: boolean;
}

const natureColors: Record<string, string> = {
  ASSETS: "bg-blue-100 text-blue-800",
  LIABILITIES: "bg-red-100 text-red-800",
  INCOME: "bg-green-100 text-green-800",
  EXPENSES: "bg-orange-100 text-orange-800",
  EQUITY: "bg-purple-100 text-purple-800",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

// Mock data for demonstration
const mockLedgers: Ledger[] = [
  {
    id: "1",
    name: "Cash",
    code: "CASH001",
    group: { id: "1", name: "Cash & Bank", nature: "ASSETS" },
    openingBalance: 50000,
    openingBalanceType: "DEBIT",
    currentBalance: 125000,
    gstNo: null,
    panNo: null,
    isActive: true,
  },
  {
    id: "2",
    name: "Bank Account - HDFC",
    code: "BANK001",
    group: { id: "1", name: "Cash & Bank", nature: "ASSETS" },
    openingBalance: 500000,
    openingBalanceType: "DEBIT",
    currentBalance: 875000,
    gstNo: null,
    panNo: null,
    isActive: true,
  },
  {
    id: "3",
    name: "Accounts Receivable",
    code: "AR001",
    group: { id: "2", name: "Sundry Debtors", nature: "ASSETS" },
    openingBalance: 200000,
    openingBalanceType: "DEBIT",
    currentBalance: 450000,
    gstNo: null,
    panNo: null,
    isActive: true,
  },
  {
    id: "4",
    name: "Accounts Payable",
    code: "AP001",
    group: { id: "3", name: "Sundry Creditors", nature: "LIABILITIES" },
    openingBalance: 150000,
    openingBalanceType: "CREDIT",
    currentBalance: 280000,
    gstNo: null,
    panNo: null,
    isActive: true,
  },
  {
    id: "5",
    name: "Sales Revenue",
    code: "REV001",
    group: { id: "4", name: "Direct Income", nature: "INCOME" },
    openingBalance: 0,
    openingBalanceType: "CREDIT",
    currentBalance: 2450000,
    gstNo: null,
    panNo: null,
    isActive: true,
  },
  {
    id: "6",
    name: "Salary Expenses",
    code: "EXP001",
    group: { id: "5", name: "Direct Expenses", nature: "EXPENSES" },
    openingBalance: 0,
    openingBalanceType: "DEBIT",
    currentBalance: 1200000,
    gstNo: null,
    panNo: null,
    isActive: true,
  },
  {
    id: "7",
    name: "Office Rent",
    code: "EXP002",
    group: { id: "6", name: "Indirect Expenses", nature: "EXPENSES" },
    openingBalance: 0,
    openingBalanceType: "DEBIT",
    currentBalance: 360000,
    gstNo: null,
    panNo: null,
    isActive: true,
  },
  {
    id: "8",
    name: "Capital Account",
    code: "CAP001",
    group: { id: "7", name: "Capital", nature: "EQUITY" },
    openingBalance: 1000000,
    openingBalanceType: "CREDIT",
    currentBalance: 1000000,
    gstNo: null,
    panNo: null,
    isActive: true,
  },
];

const mockGroups: LedgerGroup[] = [
  { id: "1", name: "Cash & Bank", nature: "ASSETS" },
  { id: "2", name: "Sundry Debtors", nature: "ASSETS" },
  { id: "3", name: "Sundry Creditors", nature: "LIABILITIES" },
  { id: "4", name: "Direct Income", nature: "INCOME" },
  { id: "5", name: "Direct Expenses", nature: "EXPENSES" },
  { id: "6", name: "Indirect Expenses", nature: "EXPENSES" },
  { id: "7", name: "Capital", nature: "EQUITY" },
];

export default function LedgersPage() {
  const [ledgers, setLedgers] = React.useState<Ledger[]>([]);
  const [groups, setGroups] = React.useState<LedgerGroup[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedNature, setSelectedNature] = React.useState<string>("all");
  const [deleteLedgerId, setDeleteLedgerId] = React.useState<string | null>(null);
  const [editingLedger, setEditingLedger] = React.useState<Ledger | null>(null);

  // Form state
  const [formData, setFormData] = React.useState({
    name: "",
    code: "",
    groupId: "",
    openingBalance: "",
    openingBalanceType: "DEBIT",
    gstNo: "",
    panNo: "",
    creditLimit: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      groupId: "",
      openingBalance: "",
      openingBalanceType: "DEBIT",
      gstNo: "",
      panNo: "",
      creditLimit: "",
    });
    setEditingLedger(null);
  };

  const handleOpenDialog = (ledger?: Ledger) => {
    if (ledger) {
      setEditingLedger(ledger);
      setFormData({
        name: ledger.name,
        code: ledger.code || "",
        groupId: ledger.group?.id || "",
        openingBalance: ledger.openingBalance?.toString() || "",
        openingBalanceType: ledger.openingBalanceType || "DEBIT",
        gstNo: ledger.gstNo || "",
        panNo: ledger.panNo || "",
        creditLimit: "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  React.useEffect(() => {
    // Load mock data - will be replaced with API call
    setTimeout(() => {
      setLedgers(mockLedgers);
      setGroups(mockGroups);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleSubmitLedger = async () => {
    if (!formData.name || !formData.groupId) {
      alert("Name and group are required");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      if (editingLedger) {
        setLedgers(prev => prev.map(l =>
          l.id === editingLedger.id
            ? { ...l, name: formData.name, code: formData.code || null }
            : l
        ));
      } else {
        const newLedger: Ledger = {
          id: Date.now().toString(),
          name: formData.name,
          code: formData.code || null,
          group: groups.find(g => g.id === formData.groupId) || groups[0],
          openingBalance: parseFloat(formData.openingBalance) || 0,
          openingBalanceType: formData.openingBalanceType as "DEBIT" | "CREDIT",
          currentBalance: parseFloat(formData.openingBalance) || 0,
          gstNo: formData.gstNo || null,
          panNo: formData.panNo || null,
          isActive: true,
        };
        setLedgers(prev => [...prev, newLedger]);
      }

      setIsDialogOpen(false);
      resetForm();
      setIsSubmitting(false);
    }, 500);
  };

  const handleDeleteLedger = async () => {
    if (!deleteLedgerId) return;
    setLedgers(prev => prev.filter(l => l.id !== deleteLedgerId));
    setDeleteLedgerId(null);
  };

  const filteredLedgers = React.useMemo(() => {
    if (selectedNature === "all") return ledgers;
    return ledgers.filter((l) => l.group?.nature === selectedNature);
  }, [selectedNature, ledgers]);

  const columns: ColumnDef<Ledger>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Ledger Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.getValue("name")}</span>
          {row.original.code && (
            <span className="text-xs text-gray-500">
              {row.original.code}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "group",
      header: "Group",
      cell: ({ row }) => <span>{row.original.group?.name || "-"}</span>,
    },
    {
      id: "nature",
      header: "Nature",
      cell: ({ row }) => {
        const nature = row.original.group?.nature;
        if (!nature) return "-";
        return (
          <Badge variant="secondary" className={natureColors[nature]}>
            {nature}
          </Badge>
        );
      },
    },
    {
      accessorKey: "openingBalance",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="justify-end w-full"
        >
          Opening Balance
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const balance = Number(row.getValue("openingBalance")) || 0;
        const type = row.original.openingBalanceType;
        return (
          <div className="text-right font-medium tabular-nums">
            {formatCurrency(balance)}{" "}
            <span className="text-xs text-gray-500">
              {type === "DEBIT" ? "DR" : "CR"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "currentBalance",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="justify-end w-full"
        >
          Current Balance
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const balance = Number(row.getValue("currentBalance")) || 0;
        const isDebit = balance >= 0;
        return (
          <div className="text-right font-medium tabular-nums">
            <span className={isDebit ? "text-blue-600" : "text-green-600"}>
              {formatCurrency(balance)}
            </span>{" "}
            <span className="text-xs text-gray-500">
              {isDebit ? "DR" : "CR"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleOpenDialog(row.original)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileText className="mr-2 h-4 w-4" />
              View Transactions
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleOpenDialog(row.original)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => setDeleteLedgerId(row.original.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ledgers</h1>
          <p className="text-gray-500">
            Manage all your ledger accounts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Ledger
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingLedger ? "Edit Ledger" : "Create New Ledger"}</DialogTitle>
                <DialogDescription>
                  {editingLedger ? "Update the ledger account details" : "Add a new ledger account to your chart of accounts"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ledger-name">Ledger Name *</Label>
                    <Input
                      id="ledger-name"
                      placeholder="Enter ledger name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ledger-code">Ledger Code</Label>
                    <Input
                      id="ledger-code"
                      placeholder="e.g., CASH001"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Under Group *</Label>
                    <Select
                      value={formData.groupId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, groupId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name} ({group.nature})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Opening Balance Type</Label>
                    <Select
                      value={formData.openingBalanceType}
                      onValueChange={(value) =>
                        setFormData({ ...formData, openingBalanceType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DEBIT">Debit (DR)</SelectItem>
                        <SelectItem value="CREDIT">Credit (CR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="opening-balance">Opening Balance</Label>
                    <Input
                      id="opening-balance"
                      type="number"
                      placeholder="0.00"
                      value={formData.openingBalance}
                      onChange={(e) =>
                        setFormData({ ...formData, openingBalance: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credit-limit">Credit Limit</Label>
                    <Input
                      id="credit-limit"
                      type="number"
                      placeholder="0.00"
                      value={formData.creditLimit}
                      onChange={(e) =>
                        setFormData({ ...formData, creditLimit: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gst-no">GST Number</Label>
                    <Input
                      id="gst-no"
                      placeholder="e.g., 27AADCA1234A1ZA"
                      value={formData.gstNo}
                      onChange={(e) =>
                        setFormData({ ...formData, gstNo: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pan-no">PAN Number</Label>
                    <Input
                      id="pan-no"
                      placeholder="e.g., AADCA1234A"
                      value={formData.panNo}
                      onChange={(e) =>
                        setFormData({ ...formData, panNo: e.target.value })
                      }
                    />
                  </div>
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
                <Button onClick={handleSubmitLedger} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingLedger ? "Update Ledger" : "Create Ledger"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs value={selectedNature} onValueChange={setSelectedNature}>
        <TabsList>
          <TabsTrigger value="all">All Ledgers</TabsTrigger>
          <TabsTrigger value="ASSETS">Assets</TabsTrigger>
          <TabsTrigger value="LIABILITIES">Liabilities</TabsTrigger>
          <TabsTrigger value="INCOME">Income</TabsTrigger>
          <TabsTrigger value="EXPENSES">Expenses</TabsTrigger>
          <TabsTrigger value="EQUITY">Equity</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Ledgers Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredLedgers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">No ledgers found</h3>
              <p className="text-gray-500 mb-4">
                Get started by creating your first ledger
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Ledger
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredLedgers}
              searchKey="name"
              searchPlaceholder="Search ledgers..."
            />
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteLedgerId} onOpenChange={() => setDeleteLedgerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ledger</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this ledger? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLedger}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
