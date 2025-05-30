
import React, { useState } from 'react';
import CustomerOrdersUpload from './CustomerOrdersUpload';
import InfluencerAnalysisSection from './InfluencerAnalysisSection';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useInfluencerAnalysis } from '@/hooks/useInfluencerAnalysis';

const InfluencerSpendingAnalysisFromCSV = () => {
  const [selectedShopifyClient, setSelectedShopifyClient] = useState<string>('default');
  
  const { 
    shopifyClients, 
    customerOrders, 
    influencers, 
    ordersLoading 
  } = useAnalysisData(selectedShopifyClient);

  const { 
    analysisResults, 
    isAnalyzing, 
    handleAnalyze 
  } = useInfluencerAnalysis(selectedShopifyClient, shopifyClients);

  const onAnalyze = () => {
    if (customerOrders && influencers) {
      handleAnalyze(customerOrders, influencers);
    }
  };

  return (
    <div className="space-y-6">
      <CustomerOrdersUpload />

      <InfluencerAnalysisSection
        selectedShopifyClient={selectedShopifyClient}
        onShopifyClientChange={setSelectedShopifyClient}
        shopifyClients={shopifyClients}
        onAnalyze={onAnalyze}
        isAnalyzing={isAnalyzing}
        isOrdersLoading={ordersLoading}
        analysisResults={analysisResults}
        influencersCount={influencers?.length}
      />
    </div>
  );
};

export default InfluencerSpendingAnalysisFromCSV;
