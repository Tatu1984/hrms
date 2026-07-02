'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SalaryConfig {
  id: string;
  pfPercentage: number;
  esiPercentage: number;
  taxSlabs: any;
  bonusRules: any;
  updatedAt: Date;
}

interface PayrollSettingsClientProps {
  settings: SalaryConfig | null;
}

export function PayrollSettingsClient({ settings }: PayrollSettingsClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Salary Component Percentages (for Sales)
    basicSalaryPercentage: 70, // For sales: 70% basic
    variablePayPercentage: 30, // For sales: 30% variable

    // Earnings Component Percentages (of Basic)
    hraPercentage: 40, // HRA as % of Basic
    conveyanceAllowance: 1600, // Fixed amount
    medicalAllowance: 1250, // Fixed amount
    specialAllowancePercentage: 10, // Special allowance as % of Basic

    // Deduction Percentages
    pfPercentage: settings?.pfPercentage || 12,
    esiPercentage: settings?.esiPercentage || 0.75,
    esiWageCeiling: 21000, // ESI applies below this monthly gross
    tdsPercentage: 10, // TDS percentage (legacy display)
    professionalTax: 200, // Fixed professional tax

    // Deduction Toggles (which statutory deductions are applied)
    applyPf: false,
    applyEsi: false,
    applyTds: false,
    applyProfessionalTax: true,

    // TDS slabs as JSON: [{ upTo: number|null, rate: number }]
    tdsSlabs: '[]',

    // Display Settings
    showPF: true,
    showESI: true,
    showTDS: true,
    showProfessionalTax: true,
    showHRA: true,
    showConveyance: true,
    showMedical: true,
    showSpecialAllowance: true,
  });

  // Rehydrate all values from the persisted settings on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/payroll-settings');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data || typeof data !== 'object') return;
        const bonus = (data.bonusRules && typeof data.bonusRules === 'object') ? data.bonusRules : {};
        setFormData((prev) => ({
          ...prev,
          basicSalaryPercentage: typeof bonus.basicSalaryPercentage === 'number' ? bonus.basicSalaryPercentage : prev.basicSalaryPercentage,
          variablePayPercentage: typeof bonus.variablePayPercentage === 'number' ? bonus.variablePayPercentage : prev.variablePayPercentage,
          pfPercentage: typeof data.pfPercentage === 'number' ? data.pfPercentage : prev.pfPercentage,
          esiPercentage: typeof data.esiPercentage === 'number' ? data.esiPercentage : prev.esiPercentage,
          esiWageCeiling: typeof data.esiWageCeiling === 'number' ? data.esiWageCeiling : prev.esiWageCeiling,
          professionalTax: typeof data.professionalTax === 'number' ? data.professionalTax : prev.professionalTax,
          applyPf: typeof data.applyPf === 'boolean' ? data.applyPf : prev.applyPf,
          applyEsi: typeof data.applyEsi === 'boolean' ? data.applyEsi : prev.applyEsi,
          applyTds: typeof data.applyTds === 'boolean' ? data.applyTds : prev.applyTds,
          applyProfessionalTax: typeof data.applyProfessionalTax === 'boolean' ? data.applyProfessionalTax : prev.applyProfessionalTax,
          tdsSlabs: Array.isArray(data.tdsSlabs) ? JSON.stringify(data.tdsSlabs, null, 2) : prev.tdsSlabs,
        }));
      } catch (err) {
        console.error('Failed to load payroll settings:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Parse the TDS slabs JSON textarea into an array (if provided/valid)
    let parsedTdsSlabs: unknown = undefined;
    const raw = formData.tdsSlabs?.trim();
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
          alert('TDS slabs must be a JSON array, e.g. [{"upTo":250000,"rate":0}]');
          return;
        }
        parsedTdsSlabs = parsed;
      } catch {
        alert('TDS slabs is not valid JSON. Please fix it or leave it empty.');
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch('/api/payroll-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, tdsSlabs: parsedTdsSlabs }),
      });

      if (response.ok) {
        alert('Payroll settings updated successfully');
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Salary Components */}
      <Card>
        <CardHeader>
          <CardTitle>Salary Structure (Sales Department)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="basicSalaryPercentage">Basic Salary Percentage (%)</Label>
              <Input
                id="basicSalaryPercentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.basicSalaryPercentage}
                onChange={(e) => setFormData({ ...formData, basicSalaryPercentage: parseFloat(e.target.value) })}
              />
              <p className="text-xs text-gray-500">
                For sales employees, this percentage of total salary is considered as basic salary
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="variablePayPercentage">Variable Pay Percentage (%)</Label>
              <Input
                id="variablePayPercentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.variablePayPercentage}
                onChange={(e) => setFormData({ ...formData, variablePayPercentage: parseFloat(e.target.value) })}
              />
              <p className="text-xs text-gray-500">
                For sales employees, this percentage is variable pay based on target achievement
              </p>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-sm">
            <p className="font-semibold text-blue-900 mb-1">Note:</p>
            <p className="text-blue-700">
              For non-sales employees, 100% of salary is considered as fixed basic salary with no variable component.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings Components (Allowances)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="hraPercentage">HRA (% of Basic Salary)</Label>
              <Input
                id="hraPercentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.hraPercentage}
                onChange={(e) => setFormData({ ...formData, hraPercentage: parseFloat(e.target.value) })}
              />
              <p className="text-xs text-gray-500">
                House Rent Allowance as percentage of basic salary (typically 40%)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialAllowancePercentage">Special Allowance (% of Basic)</Label>
              <Input
                id="specialAllowancePercentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.specialAllowancePercentage}
                onChange={(e) => setFormData({ ...formData, specialAllowancePercentage: parseFloat(e.target.value) })}
              />
              <p className="text-xs text-gray-500">
                Special allowance as percentage of basic salary (typically 10%)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="conveyanceAllowance">Conveyance Allowance (Fixed Amount)</Label>
              <Input
                id="conveyanceAllowance"
                type="number"
                step="0.01"
                min="0"
                value={formData.conveyanceAllowance}
                onChange={(e) => setFormData({ ...formData, conveyanceAllowance: parseFloat(e.target.value) })}
              />
              <p className="text-xs text-gray-500">
                Fixed monthly conveyance allowance (typically ₹1600)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="medicalAllowance">Medical Allowance (Fixed Amount)</Label>
              <Input
                id="medicalAllowance"
                type="number"
                step="0.01"
                min="0"
                value={formData.medicalAllowance}
                onChange={(e) => setFormData({ ...formData, medicalAllowance: parseFloat(e.target.value) })}
              />
              <p className="text-xs text-gray-500">
                Fixed monthly medical allowance (typically ₹1250)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deduction Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Deduction Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Statutory deduction toggles */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="applyPf" className="cursor-pointer">Apply PF</Label>
                <p className="text-xs text-gray-500">Deduct Provident Fund</p>
              </div>
              <Switch
                id="applyPf"
                checked={formData.applyPf}
                onCheckedChange={(checked) => setFormData({ ...formData, applyPf: checked })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="applyEsi" className="cursor-pointer">Apply ESI</Label>
                <p className="text-xs text-gray-500">Deduct Employee State Insurance</p>
              </div>
              <Switch
                id="applyEsi"
                checked={formData.applyEsi}
                onCheckedChange={(checked) => setFormData({ ...formData, applyEsi: checked })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="applyTds" className="cursor-pointer">Apply TDS</Label>
                <p className="text-xs text-gray-500">Deduct tax using configured slabs</p>
              </div>
              <Switch
                id="applyTds"
                checked={formData.applyTds}
                onCheckedChange={(checked) => setFormData({ ...formData, applyTds: checked })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="applyProfessionalTax" className="cursor-pointer">Apply Professional Tax</Label>
                <p className="text-xs text-gray-500">Deduct fixed professional tax</p>
              </div>
              <Switch
                id="applyProfessionalTax"
                checked={formData.applyProfessionalTax}
                onCheckedChange={(checked) => setFormData({ ...formData, applyProfessionalTax: checked })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="pfPercentage">PF Percentage (%)</Label>
              <Input
                id="pfPercentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.pfPercentage}
                onChange={(e) => setFormData({ ...formData, pfPercentage: parseFloat(e.target.value) })}
              />
              <p className="text-xs text-gray-500">
                Provident Fund deduction percentage (typically 12%)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="esiPercentage">ESI Percentage (%)</Label>
              <Input
                id="esiPercentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.esiPercentage}
                onChange={(e) => setFormData({ ...formData, esiPercentage: parseFloat(e.target.value) })}
              />
              <p className="text-xs text-gray-500">
                Employee State Insurance percentage (typically 0.75%)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="tdsPercentage">TDS Percentage (%)</Label>
              <Input
                id="tdsPercentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.tdsPercentage}
                onChange={(e) => setFormData({ ...formData, tdsPercentage: parseFloat(e.target.value) })}
              />
              <p className="text-xs text-gray-500">
                Tax Deducted at Source percentage (typically 10%)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="professionalTax">Professional Tax (Fixed Amount)</Label>
              <Input
                id="professionalTax"
                type="number"
                step="0.01"
                min="0"
                value={formData.professionalTax}
                onChange={(e) => setFormData({ ...formData, professionalTax: parseFloat(e.target.value) })}
              />
              <p className="text-xs text-gray-500">
                Fixed professional tax amount per month (typically ₹200)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="esiWageCeiling">ESI Wage Ceiling (Fixed Amount)</Label>
              <Input
                id="esiWageCeiling"
                type="number"
                step="1"
                min="0"
                value={formData.esiWageCeiling}
                onChange={(e) => setFormData({ ...formData, esiWageCeiling: parseFloat(e.target.value) })}
              />
              <p className="text-xs text-gray-500">
                ESI is deducted only when monthly gross is at or below this amount (typically ₹21000)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tdsSlabs">TDS Slabs (JSON)</Label>
            <Textarea
              id="tdsSlabs"
              rows={5}
              className="font-mono text-xs"
              value={formData.tdsSlabs}
              placeholder='[{"upTo":250000,"rate":0},{"upTo":500000,"rate":5},{"upTo":null,"rate":20}]'
              onChange={(e) => setFormData({ ...formData, tdsSlabs: e.target.value })}
            />
            <p className="text-xs text-gray-500">
              TDS is calculated from these configured slabs when &quot;Apply TDS&quot; is enabled. Each entry is
              {' '}<code>{'{ "upTo": number|null, "rate": percent }'}</code>; use <code>null</code> for the top slab.
              Leave empty to keep the existing slabs unchanged.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Display Options */}
      <Card>
        <CardHeader>
          <CardTitle>Payslip Display Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-3">Earnings to Display</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showHRA"
                    checked={formData.showHRA}
                    onChange={(e) => setFormData({ ...formData, showHRA: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="showHRA" className="cursor-pointer">Show HRA</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showConveyance"
                    checked={formData.showConveyance}
                    onChange={(e) => setFormData({ ...formData, showConveyance: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="showConveyance" className="cursor-pointer">Show Conveyance Allowance</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showMedical"
                    checked={formData.showMedical}
                    onChange={(e) => setFormData({ ...formData, showMedical: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="showMedical" className="cursor-pointer">Show Medical Allowance</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showSpecialAllowance"
                    checked={formData.showSpecialAllowance}
                    onChange={(e) => setFormData({ ...formData, showSpecialAllowance: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="showSpecialAllowance" className="cursor-pointer">Show Special Allowance</Label>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Deductions to Display</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showPF"
                    checked={formData.showPF}
                    onChange={(e) => setFormData({ ...formData, showPF: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="showPF" className="cursor-pointer">Show PF</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showESI"
                    checked={formData.showESI}
                    onChange={(e) => setFormData({ ...formData, showESI: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="showESI" className="cursor-pointer">Show ESI</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showTDS"
                    checked={formData.showTDS}
                    onChange={(e) => setFormData({ ...formData, showTDS: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="showTDS" className="cursor-pointer">Show TDS</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showProfessionalTax"
                    checked={formData.showProfessionalTax}
                    onChange={(e) => setFormData({ ...formData, showProfessionalTax: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="showProfessionalTax" className="cursor-pointer">Show Professional Tax</Label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="bg-blue-600">
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </form>
  );
}
