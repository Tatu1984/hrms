'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  BarChart3,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Loader2,
  Download,
} from 'lucide-react';

interface ReportItem {
  name: string;
  amount: number;
}

interface TrialBalanceItem {
  id: string;
  name: string;
  group: string;
  nature: string;
  debit: number;
  credit: number;
}

export default function FinancialReportsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trial-balance');
  const [trialBalance, setTrialBalance] = useState<{
    data: TrialBalanceItem[];
    totals: { debit: number; credit: number; difference: number };
  } | null>(null);
  const [profitLoss, setProfitLoss] = useState<{
    income: ReportItem[];
    expenses: ReportItem[];
    totals: { totalIncome: number; totalExpenses: number; netProfit: number };
  } | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<{
    assets: ReportItem[];
    liabilities: ReportItem[];
    equity: ReportItem[];
    totals: { totalAssets: number; totalLiabilities: number; totalEquity: number; liabilitiesAndEquity: number };
  } | null>(null);

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab]);

  const fetchReport = async (type: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/accounting/reports?type=${type}`);
      if (response.ok) {
        const data = await response.json();
        switch (type) {
          case 'trial-balance':
            setTrialBalance(data);
            break;
          case 'profit-loss':
            setProfitLoss(data);
            break;
          case 'balance-sheet':
            setBalanceSheet(data);
            break;
        }
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/accounting" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-bold">Financial Reports</h1>
          </div>
          <p className="text-gray-600">View financial statements and reports</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trial-balance">
            <FileText className="w-4 h-4 mr-2" />
            Trial Balance
          </TabsTrigger>
          <TabsTrigger value="profit-loss">
            <TrendingUp className="w-4 h-4 mr-2" />
            Profit & Loss
          </TabsTrigger>
          <TabsTrigger value="balance-sheet">
            <BarChart3 className="w-4 h-4 mr-2" />
            Balance Sheet
          </TabsTrigger>
        </TabsList>

        {/* Trial Balance */}
        <TabsContent value="trial-balance">
          <Card>
            <CardHeader>
              <CardTitle>Trial Balance</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
                </div>
              ) : trialBalance && trialBalance.data.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ledger</TableHead>
                        <TableHead>Group</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trialBalance.data.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-gray-500">{item.group}</TableCell>
                          <TableCell className="text-right">
                            {item.debit > 0 ? formatCurrency(item.debit) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.credit > 0 ? formatCurrency(item.credit) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-gray-50">
                        <TableCell colSpan={2}>Total</TableCell>
                        <TableCell className="text-right">{formatCurrency(trialBalance.totals.debit)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(trialBalance.totals.credit)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  {trialBalance.totals.difference !== 0 && (
                    <p className="text-red-600 mt-4 text-sm">
                      Warning: Trial balance is not balanced. Difference: {formatCurrency(Math.abs(trialBalance.totals.difference))}
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No data available</p>
                  <p className="text-sm">Add ledgers and create transactions to see the trial balance</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profit & Loss */}
        <TabsContent value="profit-loss">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income */}
            <Card>
              <CardHeader className="bg-green-50">
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <TrendingUp className="w-5 h-5" />
                  Income
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : profitLoss && profitLoss.income.length > 0 ? (
                  <Table>
                    <TableBody>
                      {profitLoss.income.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            {formatCurrency(item.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold border-t-2">
                        <TableCell>Total Income</TableCell>
                        <TableCell className="text-right text-green-700">
                          {formatCurrency(profitLoss.totals.totalIncome)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-gray-500 py-4">No income recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Expenses */}
            <Card>
              <CardHeader className="bg-red-50">
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <TrendingDown className="w-5 h-5" />
                  Expenses
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : profitLoss && profitLoss.expenses.length > 0 ? (
                  <Table>
                    <TableBody>
                      {profitLoss.expenses.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right text-red-600 font-medium">
                            {formatCurrency(item.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold border-t-2">
                        <TableCell>Total Expenses</TableCell>
                        <TableCell className="text-right text-red-700">
                          {formatCurrency(profitLoss?.totals.totalExpenses || 0)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-gray-500 py-4">No expenses recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Net Profit/Loss Summary */}
            <Card className="lg:col-span-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-full ${(profitLoss?.totals.netProfit || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                      <DollarSign className={`w-6 h-6 ${(profitLoss?.totals.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <span className="text-lg font-medium">
                      {(profitLoss?.totals.netProfit || 0) >= 0 ? 'Net Profit' : 'Net Loss'}
                    </span>
                  </div>
                  <span className={`text-2xl font-bold ${(profitLoss?.totals.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(Math.abs(profitLoss?.totals.netProfit || 0))}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Balance Sheet */}
        <TabsContent value="balance-sheet">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assets */}
            <Card>
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-blue-700">Assets</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : balanceSheet && balanceSheet.assets.length > 0 ? (
                  <Table>
                    <TableBody>
                      {balanceSheet.assets.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold border-t-2 bg-blue-50">
                        <TableCell>Total Assets</TableCell>
                        <TableCell className="text-right text-blue-700">
                          {formatCurrency(balanceSheet.totals.totalAssets)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-gray-500 py-4">No assets recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Liabilities & Equity */}
            <Card>
              <CardHeader className="bg-purple-50">
                <CardTitle className="text-purple-700">Liabilities & Equity</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableBody>
                      {balanceSheet && balanceSheet.liabilities.length > 0 && (
                        <>
                          <TableRow className="bg-gray-50">
                            <TableCell colSpan={2} className="font-semibold">Liabilities</TableCell>
                          </TableRow>
                          {balanceSheet.liabilities.map((item, index) => (
                            <TableRow key={`l-${index}`}>
                              <TableCell className="pl-6">{item.name}</TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(item.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </>
                      )}
                      {balanceSheet && balanceSheet.equity.length > 0 && (
                        <>
                          <TableRow className="bg-gray-50">
                            <TableCell colSpan={2} className="font-semibold">Equity</TableCell>
                          </TableRow>
                          {balanceSheet.equity.map((item, index) => (
                            <TableRow key={`e-${index}`}>
                              <TableCell className="pl-6">{item.name}</TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(item.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </>
                      )}
                      <TableRow className="font-bold border-t-2 bg-purple-50">
                        <TableCell>Total Liabilities & Equity</TableCell>
                        <TableCell className="text-right text-purple-700">
                          {formatCurrency(balanceSheet?.totals.liabilitiesAndEquity || 0)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
