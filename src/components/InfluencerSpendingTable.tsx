
import React from 'react';
import { Trash2, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

type InfluencerSpendingAnalysis = {
  id: string;
  user_id: string;
  influencer_id: string | null;
  customer_email: string;
  customer_name: string | null;
  total_spent: number | null;
  shopify_client_id: string | null;
  customer_order_id: string | null;
  analysis_date: string;
  created_at: string;
};

interface InfluencerSpendingTableProps {
  analysis: InfluencerSpendingAnalysis[];
  onDeleteLink: (analysisId: string) => void;
  isDeleting: boolean;
}

const InfluencerSpendingTable: React.FC<InfluencerSpendingTableProps> = ({ 
  analysis, 
  onDeleteLink, 
  isDeleting 
}) => {
  if (!analysis || analysis.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Influencer-Customer Links
          </CardTitle>
          <CardDescription>
            No influencer-customer links found. Create links to track spending patterns.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Influencer-Customer Links
        </CardTitle>
        <CardDescription>
          Track connections between influencers and customer spending patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Total Spent</TableHead>
              <TableHead>Linked Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analysis.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.customer_name || 'N/A'}
                </TableCell>
                <TableCell>{item.customer_email}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="font-semibold">
                      {formatCurrency(item.total_spent)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(item.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteLink(item.id)}
                    disabled={isDeleting}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default InfluencerSpendingTable;
