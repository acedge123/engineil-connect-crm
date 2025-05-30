
import React from 'react';
import { DollarSign, Package, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type CreatorGift = {
  id: string;
  user_id: string;
  draft_order_shopify_id?: string;
  order_shopify_id?: string;
  creator_id: string;
  creator_email: string;
  brand_name: string;
  webhook_created_at?: string;
  webhook_updated_at?: string;
  amount: number;
  quantity: number;
  products?: any[];
  page_campaign_name?: string;
  page_campaign_subdomain?: string;
  page_campaign_fixed_subdomain?: string;
  created_at: string;
  updated_at: string;
};

interface CreatorGiftStatsProps {
  gifts: CreatorGift[];
}

const CreatorGiftStats: React.FC<CreatorGiftStatsProps> = ({ gifts }) => {
  const totalValue = gifts.reduce((sum, gift) => sum + gift.amount, 0);
  const totalQuantity = gifts.reduce((sum, gift) => sum + gift.quantity, 0);
  const uniqueCreators = new Set(gifts.map(gift => gift.creator_email)).size;
  const uniqueBrands = new Set(gifts.map(gift => gift.brand_name)).size;

  const stats = [
    {
      title: "Total Value",
      value: `$${totalValue.toFixed(2)}`,
      description: "Total value of all gifts",
      icon: <DollarSign className="w-4 h-4" />,
      color: "text-green-600"
    },
    {
      title: "Total Gifts",
      value: totalQuantity.toString(),
      description: `${gifts.length} gift records`,
      icon: <Package className="w-4 h-4" />,
      color: "text-blue-600"
    },
    {
      title: "Unique Creators",
      value: uniqueCreators.toString(),
      description: "Different creators reached",
      icon: <Users className="w-4 h-4" />,
      color: "text-purple-600"
    },
    {
      title: "Brands",
      value: uniqueBrands.toString(),
      description: "Different brands involved",
      icon: <TrendingUp className="w-4 h-4" />,
      color: "text-orange-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={stat.color}>{stat.icon}</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CreatorGiftStats;
