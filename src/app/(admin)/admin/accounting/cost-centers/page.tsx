"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, PieChart, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

interface CostCenter {
  id: string;
  name: string;
  code?: string;
  parentId?: string;
  parent?: { id: string; name: string };
  children?: { id: string; name: string }[];
  isActive: boolean;
}

export default function CostCentersPage() {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    parentId: "",
  });

  useEffect(() => {
    fetchCostCenters();
  }, []);

  const fetchCostCenters = async () => {
    try {
      const res = await fetch("/api/accounting/cost-centers");
      if (res.ok) {
        const data = await res.json();
        setCostCenters(data);
      }
    } catch (error) {
      console.error("Failed to fetch cost centers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/accounting/cost-centers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId || null,
        }),
      });
      if (res.ok) {
        setDialogOpen(false);
        setFormData({ name: "", code: "", parentId: "" });
        fetchCostCenters();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create cost center");
      }
    } catch (error) {
      alert("Failed to create cost center");
    } finally {
      setSaving(false);
    }
  };

  // Get root level cost centers (no parent)
  const rootCostCenters = costCenters.filter((cc) => !cc.parentId);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cost Centers</h1>
          <p className="text-gray-500">
            Track costs by department, project, or location
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/accounting">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Cost Center
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : costCenters.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <PieChart className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No cost centers</h3>
            <p className="text-gray-500 mt-1">Create cost centers to track expenses by department or project.</p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Cost Center
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rootCostCenters.map((cc) => (
            <Card key={cc.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-orange-500" />
                  {cc.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {cc.code && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Code:</span>
                      <span className="font-mono">{cc.code}</span>
                    </div>
                  )}
                  {cc.children && cc.children.length > 0 && (
                    <div className="border-t pt-2 mt-2">
                      <p className="text-gray-500 mb-1">Sub-centers:</p>
                      <div className="flex flex-wrap gap-1">
                        {cc.children.map((child) => (
                          <span key={child.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {child.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Cost Center</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Marketing Department"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Code</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., MKT-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Parent Cost Center</Label>
              <Select
                value={formData.parentId}
                onValueChange={(v) => setFormData({ ...formData, parentId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None (Top Level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (Top Level)</SelectItem>
                  {costCenters.map((cc) => (
                    <SelectItem key={cc.id} value={cc.id}>
                      {cc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Cost Center
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
