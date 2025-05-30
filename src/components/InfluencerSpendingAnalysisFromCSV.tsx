
import React from 'react';
import CustomerOrdersUpload from './CustomerOrdersUpload';

const InfluencerSpendingAnalysisFromCSV = () => {
  return (
    <div className="space-y-6">
      <CustomerOrdersUpload />
      
      <div className="text-center py-12">
        <p className="text-gray-500">Spending analysis feature has been removed.</p>
      </div>
    </div>
  );
};

export default InfluencerSpendingAnalysisFromCSV;
