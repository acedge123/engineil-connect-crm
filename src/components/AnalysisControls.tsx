
import React from 'react';
import { Play, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type InfluencerSpendingResult = {
  influencer_id: string;
  customer_email: string;
  customer_name?: string;
  total_spent: number;
  order_count: number;
  first_order_date: string;
  last_order_date: string;
  average_order_value: number;
  influencer?: {
    name?: string;
    instagram_handle?: string;
    category?: string;
  };
};

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
  isOrdersLoading,
  analysisResults,
  selectedShopifyClient,
  shopifyClients
}) => {
  const exportResults = () => {
    if (analysisResults.length === 0) {
      toast.error('No analysis results to export');
      return;
    }

    const clientName = selectedShopifyClient && selectedShopifyClient !== 'default'
      ? shopifyClients?.find(c => c.id === selectedShopifyClient)?.client_name || 'SelectedClient'
      : 'Default';

    const csvContent = [
      ['Influencer Name', 'Email', 'Instagram Handle', 'Category', 'Total Spent', 'Order Count', 'Average Order Value', 'First Order', 'Last Order'].join(','),
      ...analysisResults
        .filter(result => result.total_spent > 0)
        .map(result => [
          result.influencer?.name || '',
          result.customer_email,
          result.influencer?.instagram_handle || '',
          result.influencer?.category || '',
          result.total_spent.toFixed(2),
          result.order_count,
          result.average_order_value.toFixed(2),
          result.first_order_date ? new Date(result.first_order_date).toLocaleDateString() : '',
          result.last_order_date ? new Date(result.last_order_date).toLocaleDateString() : ''
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `influencer-spending-analysis-${clientName}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-2">
      <Button 
        onClick={onAnalyze}
        disabled={isAnalyzing || isOrdersLoading}
        className="bg-crm-blue hover:bg-blue-600"
      >
        <Play className="w-4 h-4 mr-2" />
        {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
      </Button>
      
      {analysisResults.length > 0 && (
        <Button 
          onClick={exportResults}
          variant="outline"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Results
        </Button>
      )}
    </div>
  );
};

export default AnalysisControls;
