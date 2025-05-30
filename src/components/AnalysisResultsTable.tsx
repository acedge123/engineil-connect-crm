
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InfluencerSpendingResult } from '@/hooks/useInfluencerAnalysis';

interface AnalysisResultsTableProps {
  analysisResults: InfluencerSpendingResult[];
}

const AnalysisResultsTable: React.FC<AnalysisResultsTableProps> = ({ analysisResults }) => {
  const influencersWithOrders = analysisResults.filter(result => result.total_spent > 0);

  console.log(`Analysis results: ${analysisResults.length} total, ${influencersWithOrders.length} with orders`);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis Results</CardTitle>
        <CardDescription>
          Showing all {influencersWithOrders.length} influencers with orders (from {analysisResults.length} total analyzed)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Influencer</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Instagram</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Avg Order</TableHead>
              <TableHead>Date Range</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {influencersWithOrders
              .sort((a, b) => b.total_spent - a.total_spent)
              .map((result) => (
                <TableRow key={result.influencer_id}>
                  <TableCell className="font-medium">
                    {result.influencer?.name || result.customer_name || 'N/A'}
                  </TableCell>
                  <TableCell>{result.customer_email}</TableCell>
                  <TableCell>{result.influencer?.instagram_handle || 'N/A'}</TableCell>
                  <TableCell>{result.influencer?.category || 'N/A'}</TableCell>
                  <TableCell className="text-right font-semibold">
                    ${result.total_spent.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">{result.order_count}</TableCell>
                  <TableCell className="text-right">
                    ${result.average_order_value.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {result.first_order_date && result.last_order_date && result.first_order_date.trim() !== '' ? (
                      <>
                        {new Date(result.first_order_date).toLocaleDateString()}
                        {result.first_order_date !== result.last_order_date && (
                          <> - {new Date(result.last_order_date).toLocaleDateString()}</>
                        )}
                      </>
                    ) : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AnalysisResultsTable;
