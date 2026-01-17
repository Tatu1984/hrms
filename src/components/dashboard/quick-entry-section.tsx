'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  type: string;
}

interface QuickEntrySectionProps {
  categories: Category[];
  totalIncome: number;
  totalExpenses: number;
  recentEntries: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    date: string;
    category?: { name: string } | null;
  }>;
}

export function QuickEntrySection({ categories, totalIncome, totalExpenses, recentEntries }: QuickEntrySectionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'EXPENSE',
    categoryId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    paymentPurpose: '',
    paymentMode: '',
    senderName: '',
    bankInfo: '',
    paymentTo: '',
    paymentCategory: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setOpen(false);
        setFormData({
          type: 'EXPENSE',
          categoryId: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          description: '',
          reference: '',
          paymentPurpose: '',
          paymentMode: '',
          senderName: '',
          bankInfo: '',
          paymentTo: '',
          paymentCategory: '',
        });
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create entry');
      }
    } catch (error) {
      console.error('Error creating entry:', error);
      alert('Failed to create entry');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(c => c.type === formData.type);
  const netBalance = totalIncome - totalExpenses;

  return (
    <>
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Income</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Expenses</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
              </div>
              <div className="bg-red-100 p-2 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${netBalance >= 0 ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Net Balance</p>
                <p className={`text-xl font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {formatCurrency(netBalance)}
                </p>
              </div>
              <div className={`${netBalance >= 0 ? 'bg-blue-100' : 'bg-orange-100'} p-2 rounded-lg`}>
                <Wallet className={`w-5 h-5 ${netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Entry Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Quick Entry
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => { setFormData(prev => ({ ...prev, type: 'INCOME' })); setOpen(true); }}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Income
              </Button>
              <Button
                onClick={() => { setFormData(prev => ({ ...prev, type: 'EXPENSE' })); setOpen(true); }}
                className="bg-red-600 hover:bg-red-700"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Expense
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {recentEntries.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-500 mb-3">Recent Entries</p>
              {recentEntries.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${entry.type === 'INCOME' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="text-sm font-medium">{entry.description}</p>
                      <p className="text-xs text-gray-500">
                        {entry.category?.name || 'Uncategorized'} • {new Date(entry.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`font-semibold ${entry.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.type === 'INCOME' ? '+' : '-'}{formatCurrency(entry.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No entries yet. Add your first income or expense!</p>
          )}
        </CardContent>
      </Card>

      {/* Entry Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {formData.type === 'INCOME' ? 'Add Income' : 'Add Expense'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value, categoryId: '' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME">Income</SelectItem>
                    <SelectItem value="EXPENSE">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (INR) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                required
                placeholder={formData.type === 'INCOME' ? 'e.g., Client payment for project' : 'e.g., Salary payment, Office supplies'}
              />
            </div>

            {formData.type === 'INCOME' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From (Sender)</Label>
                  <Input
                    value={formData.senderName}
                    onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                    placeholder="Client/Customer name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Mode</Label>
                  <Select value={formData.paymentMode} onValueChange={(value) => setFormData({ ...formData, paymentMode: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {formData.type === 'EXPENSE' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Paid To</Label>
                  <Input
                    value={formData.paymentTo}
                    onChange={(e) => setFormData({ ...formData, paymentTo: e.target.value })}
                    placeholder="Recipient name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expense Type</Label>
                  <Select value={formData.paymentCategory} onValueChange={(value) => setFormData({ ...formData, paymentCategory: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Salary">Salary</SelectItem>
                      <SelectItem value="Office Expense">Office Expense</SelectItem>
                      <SelectItem value="Rent">Rent</SelectItem>
                      <SelectItem value="Utilities">Utilities</SelectItem>
                      <SelectItem value="Equipment">Equipment</SelectItem>
                      <SelectItem value="Travel">Travel</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Reference (Optional)</Label>
              <Input
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="Invoice #, Receipt #, Transaction ID"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.categoryId}
                className={formData.type === 'INCOME' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {formData.type === 'INCOME' ? 'Add Income' : 'Add Expense'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
