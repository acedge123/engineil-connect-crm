
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type InfluencerSpendingResult = {
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

type AnalysisResponse = {
  results: InfluencerSpendingResult[];
  summary: {
    total_influencers: number;
    matched_influencers: number;
    total_spending: number;
    total_orders: number;
  };
};

export const useInfluencerAnalysis = (
  selectedShopifyClient: string,
  shopifyClients?: ShopifyClient[]
) => {
  const { user } = useAuth();
  const [analysisResults, setAnalysisResults] = useState<InfluencerSpendingResult[]>([]);

  const analyzeSpendingMutation = useMutation<AnalysisResponse, Error, void>({
    mutationFn: async () => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('=== FRONTEND: Calling optimized analysis function ===');
      console.log(`Selected Shopify Client: ${selectedShopifyClient}`);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase.functions.invoke('influencer-analysis-optimized', {
        body: {
          shopify_client_id: selectedShopifyClient === 'default' ? null : selectedShopifyClient,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Optimized analysis function error:', error);
        throw new Error(error.message || 'Analysis failed');
      }

      console.log('=== FRONTEND: Optimized analysis completed ===');
      console.log(`Total influencers: ${data.summary.total_influencers}`);
      console.log(`Matched influencers: ${data.summary.matched_influencers}`);
      console.log(`Total spending: $${data.summary.total_spending.toFixed(2)}`);
      console.log(`Total orders: ${data.summary.total_orders}`);

      return data;
    },
    onSuccess: (data) => {
      setAnalysisResults(data.results);
      const clientName = selectedShopifyClient && selectedShopifyClient !== 'default'
        ? shopifyClients?.find(c => c.id === selectedShopifyClient)?.client_name || 'Selected Client'
        : 'Default';
      
      toast.success(
        `Optimized analysis complete for ${clientName}! Found ${data.summary.matched_influencers} influencers with orders totaling $${data.summary.total_spending.toFixed(2)} across ${data.summary.total_orders} orders`
      );
    },
    onError: (error: Error) => {
      console.error('Optimized analysis mutation error:', error);
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  const handleAnalyze = () => {
    console.log('=== FRONTEND: Starting optimized analysis ===');
    analyzeSpendingMutation.mutate();
  };

  return {
    analysisResults,
    isAnalyzing: analyzeSpendingMutation.isPending,
    handleAnalyze,
  };
};
