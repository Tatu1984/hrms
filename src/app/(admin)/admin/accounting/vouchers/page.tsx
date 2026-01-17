'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  FileText,
  Search,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface VoucherType {
  id: string;
  name: string;
  code: string;
  nature: string;
}

interface Ledger {
  id: string;
  name: string;
  group: {
    name: string;
    nature: string;
  };
}

interface FiscalYear {
  id: string;
  name: string;
}

interface VoucherEntry {
  id: string;
  ledgerId: string;
  ledger: {
    id: string;
    name: string;
    group?: {
      name: string;
      nature: string;
    };
  };
  debitAmount: number;
  creditAmount: number;
  narration?: string;
}

interface Voucher {
  id: string;
  voucherNumber: string;
  date: string;
  narration?: string;
  referenceNo?: string;
  totalDebit: number;
  totalCredit: number;
  status: string;
  voucherType: VoucherType;
  entries: VoucherEntry[];
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [voucherTypes, setVoucherTypes] = useState<VoucherType[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewVoucher, setViewVoucher] = useState<Voucher | null>(null);

  const [formData, setFormData] = useState({
    voucherTypeId: '',
    fiscalYearId: '',
    date: new Date().toISOString().split('T')[0],
    narration: '',
    referenceNo: '',
    entries: [
      { ledgerId: '', debitAmount: 0, creditAmount: 0, narration: '' },
      { ledgerId: '', debitAmount: 0, creditAmount: 0, narration: '' },
    ],
  });

  useEffect(() => {
    fetchData();
  }, [selectedType, searchQuery, page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (selectedType !== 'all') params.append('voucherTypeId', selectedType);
      if (searchQuery) params.append('search', searchQuery);

      const [vouchersRes, typesRes, ledgersRes, fyRes] = await Promise.all([
        fetch(`/api/accounting/vouchers?${params}`),
        fetch('/api/accounting/voucher-types'),
        fetch('/api/accounting/ledgers'),
        fetch('/api/accounting/fiscal-years'),
      ]);

      if (vouchersRes.ok) {
        const data = await vouchersRes.json();
        setVouchers(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }

      if (typesRes.ok) {
        const types = await typesRes.json();
        setVoucherTypes(types);
      }

      if (ledgersRes.ok) {
        const ledgersData = await ledgersRes.json();
        setLedgers(ledgersData);
      }

      if (fyRes.ok) {
        const fyData = await fyRes.json();
        setFiscalYears(fyData);
        if (fyData.length > 0 && !formData.fiscalYearId) {
          setFormData(prev => ({ ...prev, fiscalYearId: fyData[0].id }));
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = () => {
    setFormData(prev => ({
      ...prev,
      entries: [...prev.entries, { ledgerId: '', debitAmount: 0, creditAmount: 0, narration: '' }],
    }));
  };

  const handleRemoveEntry = (index: number) => {
    if (formData.entries.length > 2) {
      setFormData(prev => ({
        ...prev,
        entries: prev.entries.filter((_, i) => i !== index),
      }));
    }
  };

  const handleEntryChange = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      entries: prev.entries.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      ),
    }));
  };

  const totalDebit = formData.entries.reduce((sum, e) => sum + (Number(e.debitAmount) || 0), 0);
  const totalCredit = formData.entries.reduce((sum, e) => sum + (Number(e.creditAmount) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isBalanced) {
      alert('Total Debit must equal Total Credit');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/accounting/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          entries: formData.entries.filter(e => e.ledgerId).map(e => ({
            ...e,
            debitAmount: Number(e.debitAmount) || 0,
            creditAmount: Number(e.creditAmount) || 0,
          })),
        }),
      });

      if (response.ok) {
        setDialogOpen(false);
        setFormData({
          voucherTypeId: '',
          fiscalYearId: fiscalYears[0]?.id || '',
          date: new Date().toISOString().split('T')[0],
          narration: '',
          referenceNo: '',
          entries: [
            { ledgerId: '', debitAmount: 0, creditAmount: 0, narration: '' },
            { ledgerId: '', debitAmount: 0, creditAmount: 0, narration: '' },
          ],
        });
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create voucher');
      }
    } catch (error) {
      console.error('Error creating voucher:', error);
      alert('Failed to create voucher');
    } finally {
      setCreating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
      case 'PENDING_APPROVAL':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/accounting" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-bold">Vouchers</h1>
          </div>
          <p className="text-gray-600">Manage journal entries and vouchers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-2" />
              New Voucher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Voucher</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Voucher Type *</Label>
                  <Select
                    value={formData.voucherTypeId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, voucherTypeId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {voucherTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name} ({type.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reference No</Label>
                  <Input
                    value={formData.referenceNo}
                    onChange={(e) => setFormData(prev => ({ ...prev, referenceNo: e.target.value }))}
                    placeholder="Optional reference"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Narration</Label>
                <Input
                  value={formData.narration}
                  onChange={(e) => setFormData(prev => ({ ...prev, narration: e.target.value }))}
                  placeholder="Description of the voucher"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Voucher Entries</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddEntry}>
                    <Plus className="w-4 h-4 mr-1" /> Add Line
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-[40%]">Ledger</TableHead>
                        <TableHead>Debit</TableHead>
                        <TableHead>Credit</TableHead>
                        <TableHead className="w-[10%]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.entries.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Select
                              value={entry.ledgerId}
                              onValueChange={(value) => handleEntryChange(index, 'ledgerId', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select ledger" />
                              </SelectTrigger>
                              <SelectContent>
                                {ledgers.map((ledger) => (
                                  <SelectItem key={ledger.id} value={ledger.id}>
                                    {ledger.name} ({ledger.group.name})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={entry.debitAmount || ''}
                              onChange={(e) => handleEntryChange(index, 'debitAmount', e.target.value)}
                              placeholder="0.00"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={entry.creditAmount || ''}
                              onChange={(e) => handleEntryChange(index, 'creditAmount', e.target.value)}
                              placeholder="0.00"
                            />
                          </TableCell>
                          <TableCell>
                            {formData.entries.length > 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveEntry(index)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50 font-semibold">
                        <TableCell>Total</TableCell>
                        <TableCell className={totalDebit !== totalCredit ? 'text-red-600' : ''}>
                          {formatCurrency(totalDebit)}
                        </TableCell>
                        <TableCell className={totalDebit !== totalCredit ? 'text-red-600' : ''}>
                          {formatCurrency(totalCredit)}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                {!isBalanced && (
                  <p className="text-red-600 text-sm">
                    Difference: {formatCurrency(Math.abs(totalDebit - totalCredit))} - Debit must equal Credit
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating || !formData.voucherTypeId || !isBalanced}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Voucher
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by voucher number, narration..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Tabs value={selectedType} onValueChange={setSelectedType}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                {voucherTypes.slice(0, 4).map((type) => (
                  <TabsTrigger key={type.id} value={type.id}>
                    {type.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Vouchers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Voucher List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
          ) : vouchers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No vouchers found</p>
              <p className="text-sm">Create your first voucher to get started</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Voucher No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Narration</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vouchers.map((voucher) => (
                    <TableRow key={voucher.id}>
                      <TableCell className="font-medium">{voucher.voucherNumber}</TableCell>
                      <TableCell>{new Date(voucher.date).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{voucher.voucherType.name}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {voucher.narration || '-'}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(Number(voucher.totalDebit))}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(voucher.status)}>
                          {voucher.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewVoucher(voucher)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* View Voucher Dialog */}
      <Dialog open={!!viewVoucher} onOpenChange={() => setViewVoucher(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Voucher Details: {viewVoucher?.voucherNumber}</DialogTitle>
          </DialogHeader>
          {viewVoucher && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Date:</span>{' '}
                  {new Date(viewVoucher.date).toLocaleDateString('en-IN')}
                </div>
                <div>
                  <span className="text-gray-500">Type:</span>{' '}
                  {viewVoucher.voucherType.name}
                </div>
                <div>
                  <span className="text-gray-500">Reference:</span>{' '}
                  {viewVoucher.referenceNo || '-'}
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>{' '}
                  <Badge className={getStatusColor(viewVoucher.status)}>
                    {viewVoucher.status}
                  </Badge>
                </div>
              </div>
              {viewVoucher.narration && (
                <div className="text-sm">
                  <span className="text-gray-500">Narration:</span> {viewVoucher.narration}
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ledger</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewVoucher.entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.ledger.name}</TableCell>
                      <TableCell className="text-right">
                        {Number(entry.debitAmount) > 0 ? formatCurrency(Number(entry.debitAmount)) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(entry.creditAmount) > 0 ? formatCurrency(Number(entry.creditAmount)) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-semibold bg-gray-50">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(viewVoucher.totalDebit))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(viewVoucher.totalCredit))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
