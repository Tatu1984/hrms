"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Package, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Item {
  id: string;
  name: string;
  sku?: string;
  type: string;
  purchasePrice?: number;
  sellingPrice?: number;
  category?: { id: string; name: string };
  primaryUnit?: { id: string; name: string; symbol: string };
  stocks?: { warehouseId: string; quantity: number }[];
}

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/accounting/items");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch items:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const getTotalStock = (item: Item) => {
    return item.stocks?.reduce((sum, s) => sum + s.quantity, 0) || 0;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-gray-500">
            Manage products, goods, and services
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/accounting">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No items yet</h3>
            <p className="text-gray-500 mt-1">Items will appear here once added through vouchers or the seed process.</p>
            <Button className="mt-4" variant="outline" asChild>
              <Link href="/admin/accounting">Go to Accounting</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Item Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Purchase Price</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Selling Price</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.name}</div>
                      {item.category && (
                        <div className="text-xs text-gray-500">{item.category.name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">{item.sku || "-"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={item.type === "GOODS" ? "default" : "secondary"}>
                        {item.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {item.purchasePrice ? formatCurrency(item.purchasePrice) : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {item.sellingPrice ? formatCurrency(item.sellingPrice) : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {getTotalStock(item)} {item.primaryUnit?.symbol || "units"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
