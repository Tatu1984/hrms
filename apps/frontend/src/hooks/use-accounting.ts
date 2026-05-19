"use client";

import { useState, useCallback } from "react";

// Simplified hook for accounting - no multi-tenancy needed
// This replaces the organization-based approach from the accounting system

export function useAccounting() {
  const [isLoading, setIsLoading] = useState(false);

  // Base API path for accounting endpoints
  const apiBase = "/api/accounting";

  const fetchData = useCallback(async <T>(endpoint: string): Promise<T | null> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBase}${endpoint}`);
      if (!response.ok) throw new Error("Failed to fetch");
      return await response.json();
    } catch (error) {
      console.error("Accounting API error:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const postData = useCallback(async <T>(endpoint: string, data: unknown): Promise<T | null> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBase}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to post");
      return await response.json();
    } catch (error) {
      console.error("Accounting API error:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateData = useCallback(async <T>(endpoint: string, data: unknown): Promise<T | null> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBase}${endpoint}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update");
      return await response.json();
    } catch (error) {
      console.error("Accounting API error:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteData = useCallback(async (endpoint: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBase}${endpoint}`, {
        method: "DELETE",
      });
      return response.ok;
    } catch (error) {
      console.error("Accounting API error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    apiBase,
    fetchData,
    postData,
    updateData,
    deleteData,
  };
}

// Helper hook to format currency
export function useCurrencyFormatter(currency: string = "INR") {
  const format = useCallback((amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  }, [currency]);

  return format;
}
