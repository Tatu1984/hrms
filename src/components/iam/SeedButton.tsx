'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export function SeedButton() {
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    if (!confirm('This will create/update system roles and permissions. Continue?')) return;

    setSeeding(true);
    try {
      const response = await fetch('/api/iam/seed', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Seeded ${data.roles} roles and ${data.permissions} permissions`);
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to seed');
      }
    } catch {
      alert('Failed to seed');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleSeed}
      disabled={seeding}
    >
      <RefreshCw className={`w-4 h-4 mr-2 ${seeding ? 'animate-spin' : ''}`} />
      {seeding ? 'Seeding...' : 'Initialize Roles'}
    </Button>
  );
}
