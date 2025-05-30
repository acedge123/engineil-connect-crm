
import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ClientSelector from './ClientSelector';
import AnalysisControls from './AnalysisControls';
import AnalysisStatsCards from './AnalysisStatsCards';
import AnalysisResultsTable from './AnalysisResultsTable';
import { InfluencerSpendingResult } from '@/hooks/useInfluencerAnalysis';

type ShopifyClient = {
  id: string;
  client_name: string;
  shopify_url: string;
};

interface InfluencerAnalysisSectionProps {
  selectedShopifyClient: string;
  onShopifyClientChange: (value: string) => void;
  shopifyClients?: ShopifyClient[];
  onAnalyze: () => void;
  isAnalyzing: boolean;
  isOrdersLoading: boolean;
  analysisResults: InfluencerSpendingResult[];
  influencersCount?: number;
}

const InfluencerAnalysisSection: React.FC<InfluencerAnalysisSectionProps> = ({
  selectedShopifyClient,
  onShopifyClientChange,
  shopifyClients,
  onAnalyze,
  isAnalyzing,
  isOrdersLoading,
  analysisResults,
  influencersCount = 0,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Influencer Spending Analysis
        </CardTitle>
        <CardDescription>
          Analyze influencer spending patterns based on uploaded customer order data.
          {influencersCount > 0 && (
            <span className="block mt-1 text-sm font-medium text-blue-600">
              Ready to analyze {influencersCount} influencers
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ClientSelector
          selectedShopifyClient={selectedShopifyClient}
          onValueChange={onShopifyClientChange}
          shopifyClients={shopifyClients}
        />

        <AnalysisControls
          onAnalyze={onAnalyze}
          isAnalyzing={isAnalyzing}
          isOrdersLoading={isOrdersLoading}
          analysisResults={analysisResults}
          selectedShopifyClient={selectedShopifyClient}
          shopifyClients={shopifyClients}
        />

        {analysisResults.length > 0 && (
          <>
            <AnalysisStatsCards analysisResults={analysisResults} />
            <AnalysisResultsTable analysisResults={analysisResults} />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default InfluencerAnalysisSection;
