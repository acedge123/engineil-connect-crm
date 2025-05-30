
import React from 'react';
import { Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Influencer = {
  id: string;
  user_id: string;
  email: string;
  name?: string;
  instagram_handle?: string;
  follower_count?: number;
  engagement_rate?: number;
  category?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

interface InfluencerStatsProps {
  influencers: Influencer[] | undefined;
}

const InfluencerStats: React.FC<InfluencerStatsProps> = ({ influencers }) => {
  const totalInfluencers = influencers?.length || 0;
  
  const avgFollowers = influencers && influencers.length > 0
    ? Math.round(
        influencers
          .filter(i => i.follower_count)
          .reduce((sum, i) => sum + (i.follower_count || 0), 0) /
        influencers.filter(i => i.follower_count).length
      )
    : 0;

  const avgEngagement = influencers && influencers.length > 0
    ? (
        influencers
          .filter(i => i.engagement_rate)
          .reduce((sum, i) => sum + (i.engagement_rate || 0), 0) /
        influencers.filter(i => i.engagement_rate).length
      ).toFixed(2)
    : '0.00';

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Influencers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalInfluencers}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Followers</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {avgFollowers.toLocaleString()}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgEngagement}%</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InfluencerStats;
