"use client";

import { usePortfolio } from "../api/usePortfolio";
import { TopNav } from "./TopNav";
import { PortfolioTable } from "./PortfolioTable/PortfolioTable";
import { LoadingSpinner } from "@/common/components/LoadingSpinner";
import { ErrorBanner } from "@/common/components/ErrorBanner";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function Dashboard() {
  const { data, isLoading, error, lastFetchTime, refetch } = usePortfolio();

  function renderContent() {
    if (isLoading && !data) {
      return <LoadingSpinner />;
    }

    if (!data) {
      return (
        <div className="flex flex-col flex-1 items-center justify-center">
          <p className="text-gray-600 mb-4">Failed to load portfolio data</p>
          <Button onClick={refetch} size="sm">
            <RefreshCw className="size-4" />
            Retry
          </Button>
        </div>
      );
    }

    if (data.sectors.length === 0) {
      return (
        <div className="flex flex-col flex-1 items-center justify-center">
          <p className="text-gray-500">No holdings data available.</p>
        </div>
      );
    }

    return <PortfolioTable sectors={data.sectors} />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav
        lastFetchTime={lastFetchTime}
        isLoading={isLoading}
        onRefresh={refetch}
      />

      <div className="flex flex-col flex-1 max-w-[1440px] w-full mx-auto px-4 py-6">
        {error && <ErrorBanner message={error} />}
        {renderContent()}
      </div>
    </div>
  );
}
