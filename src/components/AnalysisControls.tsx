
import React from 'react';
import { Play, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InfluencerSpendingResult } from '@/hooks/useInfluencerAnalysis';

type ShopifyClient = {
  id: string;
  client_name: string;
  shopify_url: string;
};

interface AnalysisControlsProps {
  onAnalyze: () => void;
  isAnalyzing: boolean;
  isOrdersLoading: boolean;
  analysisResults: InfluencerSpendingResult[];
  selectedShopifyClient: string;
  shopifyClients?: ShopifyClient[];
}

const AnalysisControls: React.FC<AnalysisControlsProps> = ({
  onAnalyze,
  isAnalyzing,
  analysisResults,
  selectedShopifyClient,
  shopifyClients,
}) => {
  const clientName = selectedShopifyClient && selectedShopifyClient !== 'default'
    ? shopifyClients?.find(c => c.id === selectedShopifyClient)?.client_name || 'Selected Client'
    : 'Default Client';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Analysis Controls</h3>
          <p className="text-sm text-gray-600">
            Run backend analysis to match influencer emails with customer orders
          </p>
        </div>
        <Button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Run Analysis for {clientName}
            </>
          )}
        </Button>
      </div>

      {analysisResults.length > 0 && (
        <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
          ✅ Last analysis completed successfully with {analysisResults.length} influencers processed
        </div>
      )}
    </div>
  );
};

export default AnalysisControls;
