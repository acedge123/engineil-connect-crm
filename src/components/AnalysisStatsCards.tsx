
import React from 'react';
import { DollarSign, Users, TrendingUp, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

interface AnalysisStatsCardsProps {
  analysisResults: InfluencerSpendingResult[];
}

const AnalysisStatsCards: React.FC<AnalysisStatsCardsProps> = ({ analysisResults }) => {
  const totalSpending = analysisResults.reduce((sum, result) => sum + result.total_spent, 0);
  const influencersWithOrders = analysisResults.filter(result => result.total_spent > 0);
  const averageSpending = influencersWithOrders.length > 0 
    ? totalSpending / influencersWithOrders.length 
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalSpending.toFixed(2)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Influencers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{influencersWithOrders.length}</div>
          <p className="text-xs text-muted-foreground">
            of {analysisResults.length} total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Spending</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${averageSpending.toFixed(2)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {analysisResults.reduce((sum, result) => sum + result.order_count, 0)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisStatsCards;
