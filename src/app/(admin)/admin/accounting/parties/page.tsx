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
  Loader2,
  Users,
  Building2,
  Phone,
  Mail,
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

interface Party {
  id: string;
  name: string;
  type: "CUSTOMER" | "VENDOR" | "BOTH";
  email: string;
  phone: string;
  gstNo: string | null;
  panNo: string | null;
  address: string;
  outstandingReceivable: number;
  outstandingPayable: number;
  isActive: boolean;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

// Mock data
const mockParties: Party[] = [
  {
    id: "1",
    name: "Acme Corporation",
    type: "CUSTOMER",
    email: "contact@acme.com",
    phone: "+91 98765 43210",
    gstNo: "27AADCA1234A1ZA",
    panNo: "AADCA1234A",
    address: "123 Business Park, Mumbai",
    outstandingReceivable: 150000,
    outstandingPayable: 0,
    isActive: true,
  },
  {
    id: "2",
    name: "Tech Solutions Pvt Ltd",
    type: "VENDOR",
    email: "info@techsolutions.in",
    phone: "+91 87654 32109",
    gstNo: "29AABCT1234B1ZV",
    panNo: "AABCT1234B",
    address: "456 Industrial Area, Bangalore",
    outstandingReceivable: 0,
    outstandingPayable: 85000,
    isActive: true,
  },
  {
    id: "3",
    name: "Global Services Inc",
    type: "BOTH",
    email: "hello@globalservices.com",
    phone: "+91 76543 21098",
    gstNo: "06AADCG5678C1ZR",
    panNo: "AADCG5678C",
    address: "789 Corporate Tower, Delhi",
    outstandingReceivable: 200000,
    outstandingPayable: 50000,
    isActive: true,
  },
  {
    id: "4",
    name: "Office Supplies Co",
    type: "VENDOR",
    email: "sales@officesupplies.in",
    phone: "+91 65432 10987",
    gstNo: null,
    panNo: "AABCO5678D",
    address: "101 Market Street, Chennai",
    outstandingReceivable: 0,
    outstandingPayable: 25000,
    isActive: true,
  },
  {
    id: "5",
    name: "Startup Ventures",
    type: "CUSTOMER",
    email: "founders@startupventures.io",
    phone: "+91 54321 09876",
    gstNo: "27AADCS9012E1ZQ",
    panNo: "AADCS9012E",
    address: "202 Innovation Hub, Pune",
    outstandingReceivable: 100000,
    outstandingPayable: 0,
    isActive: true,
  },
];

export default function PartiesPage() {
  const [parties, setParties] = React.useState<Party[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedType, setSelectedType] = React.useState<string>("all");

  const [formData, setFormData] = React.useState({
    name: "",
    type: "CUSTOMER",
    email: "",
    phone: "",
    gstNo: "",
    panNo: "",
    address: "",
  });

  React.useEffect(() => {
    setTimeout(() => {
      setParties(mockParties);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleSubmitParty = async () => {
    if (!formData.name || !formData.email) {
      alert("Name and email are required");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const newParty: Party = {
        id: Date.now().toString(),
        ...formData,
        type: formData.type as Party["type"],
        gstNo: formData.gstNo || null,
        panNo: formData.panNo || null,
        outstandingReceivable: 0,
        outstandingPayable: 0,
        isActive: true,
      };
      setParties(prev => [...prev, newParty]);
      setIsDialogOpen(false);
      setFormData({ name: "", type: "CUSTOMER", email: "", phone: "", gstNo: "", panNo: "", address: "" });
      setIsSubmitting(false);
    }, 500);
  };

  const filteredParties = React.useMemo(() => {
    if (selectedType === "all") return parties;
    if (selectedType === "CUSTOMER") return parties.filter(p => p.type === "CUSTOMER" || p.type === "BOTH");
    if (selectedType === "VENDOR") return parties.filter(p => p.type === "VENDOR" || p.type === "BOTH");
    return parties;
  }, [selectedType, parties]);

  const columns: ColumnDef<Party>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.getValue("name")}</span>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Mail className="h-3 w-3" /> {row.original.email}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        return (
          <Badge variant={type === "CUSTOMER" ? "default" : type === "VENDOR" ? "secondary" : "outline"}>
            {type}
          </Badge>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-gray-400" />
          {row.getValue("phone")}
        </div>
      ),
    },
    {
      accessorKey: "gstNo",
      header: "GST No",
      cell: ({ row }) => row.getValue("gstNo") || "-",
    },
    {
      accessorKey: "outstandingReceivable",
      header: "Receivable",
      cell: ({ row }) => {
        const amount = row.getValue("outstandingReceivable") as number;
        return amount > 0 ? (
          <span className="text-green-600 font-medium">{formatCurrency(amount)}</span>
        ) : "-";
      },
    },
    {
      accessorKey: "outstandingPayable",
      header: "Payable",
      cell: ({ row }) => {
        const amount = row.getValue("outstandingPayable") as number;
        return amount > 0 ? (
          <span className="text-red-600 font-medium">{formatCurrency(amount)}</span>
        ) : "-";
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
            <DropdownMenuItem><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
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
          <h1 className="text-2xl font-bold tracking-tight">Parties</h1>
          <p className="text-gray-500">Manage your customers and vendors</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Party</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Party</DialogTitle>
              <DialogDescription>Add a customer or vendor to your records</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Party Name *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CUSTOMER">Customer</SelectItem>
                      <SelectItem value="VENDOR">Vendor</SelectItem>
                      <SelectItem value="BOTH">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>GST Number</Label>
                  <Input value={formData.gstNo} onChange={(e) => setFormData({ ...formData, gstNo: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>PAN Number</Label>
                  <Input value={formData.panNo} onChange={(e) => setFormData({ ...formData, panNo: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmitParty} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Party
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-gray-500">Customers</span>
            </div>
            <div className="text-2xl font-bold">{parties.filter(p => p.type === "CUSTOMER" || p.type === "BOTH").length}</div>
            <div className="text-sm text-green-600">
              Total Receivable: {formatCurrency(parties.reduce((sum, p) => sum + p.outstandingReceivable, 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange-500" />
              <span className="text-sm text-gray-500">Vendors</span>
            </div>
            <div className="text-2xl font-bold">{parties.filter(p => p.type === "VENDOR" || p.type === "BOTH").length}</div>
            <div className="text-sm text-red-600">
              Total Payable: {formatCurrency(parties.reduce((sum, p) => sum + p.outstandingPayable, 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-gray-500">Total Parties</span>
            </div>
            <div className="text-2xl font-bold">{parties.length}</div>
            <div className="text-sm text-gray-500">Active accounts</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedType} onValueChange={setSelectedType}>
        <TabsList>
          <TabsTrigger value="all">All Parties</TabsTrigger>
          <TabsTrigger value="CUSTOMER">Customers</TabsTrigger>
          <TabsTrigger value="VENDOR">Vendors</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={filteredParties} searchKey="name" searchPlaceholder="Search parties..." />
        </CardContent>
      </Card>
    </div>
  );
}
