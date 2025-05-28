
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, RefreshCw, TrendingUp, DollarSign, ShoppingCart, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

type ShopifyClient = {
  id: string;
  client_name: string;
  shopify_url: string;
};

type SpendingAnalysis = {
  id: string;
  influencer_id: string;
  customer_email: string;
  customer_name: string | null;
  total_spent: number;
  order_count: number;
  first_order_date: string | null;
  last_order_date: string | null;
  average_order_value: number;
  analysis_date: string;
  influencers: {
    name: string | null;
    instagram_handle: string | null;
    category: string | null;
  } | null;
};

const InfluencerSpendingAnalysis = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch Shopify clients
  const { data: shopifyClients } = useQuery({
    queryKey: ['shopify-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopify_clients')
        .select('id, client_name, shopify_url')
        .order('client_name');

      if (error) throw error;
      return data as ShopifyClient[];
    },
    enabled: !!user,
  });

  // Fetch spending analysis results
  const { data: analysisData, isLoading } = useQuery({
    queryKey: ['influencer-spending-analysis', selectedClient],
    queryFn: async () => {
      if (!selectedClient) return [];
      
      const { data, error } = await supabase
        .from('influencer_spending_analysis')
        .select(`
          *,
          influencers (
            name,
            instagram_handle,
            category
          )
        `)
        .eq('shopify_client_id', selectedClient)
        .order('total_spent', { ascending: false });

      if (error) throw error;
      return data as SpendingAnalysis[];
    },
    enabled: !!user && !!selectedClient,
  });

  // Run analysis mutation
  const runAnalysisMutation = useMutation({
    mutationFn: async (clientId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const response = await fetch(
        `https://nljhbmgbgqqcaxqbvghs.supabase.co/functions/v1/analyze-influencer-spending`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            shopify_client_id: clientId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['influencer-spending-analysis'] });
      toast.success(`Analysis complete! Analyzed ${data.analyzed_influencers} influencers from ${data.total_orders} orders.`);
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  const handleRunAnalysis = () => {
    if (!selectedClient) {
      toast.error('Please select a Shopify client first');
      return;
    }
    runAnalysisMutation.mutate(selectedClient);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate summary stats
  const totalSpent = analysisData?.reduce((sum, item) => sum + item.total_spent, 0) || 0;
  const totalOrders = analysisData?.reduce((sum, item) => sum + item.order_count, 0) || 0;
  const spendingInfluencers = analysisData?.filter(item => item.total_spent > 0).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Influencer Spending Analysis</h2>
          <p className="text-gray-600 mt-1">Compare your influencers with Shopify customer data to track their spending</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select Shopify Client" />
            </SelectTrigger>
            <SelectContent>
              {shopifyClients?.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.client_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            onClick={handleRunAnalysis}
            disabled={!selectedClient || runAnalysisMutation.isPending}
            className="bg-crm-blue hover:bg-blue-600"
          >
            {runAnalysisMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Analysis
              </>
            )}
          </Button>
        </div>
      </div>

      {selectedClient && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOrders}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Spending Influencers</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{spendingInfluencers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalOrders > 0 ? formatCurrency(totalSpent / totalOrders) : '$0'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Results Table */}
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-crm-blue"></div>
              </CardContent>
            </Card>
          ) : analysisData && analysisData.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Spending Analysis Results</CardTitle>
                <CardDescription>
                  Detailed breakdown of influencer spending behavior
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Influencer</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Total Spent</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Avg Order</TableHead>
                      <TableHead>First Order</TableHead>
                      <TableHead>Last Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysisData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{item.influencers?.name || item.customer_name || 'N/A'}</div>
                            {item.influencers?.instagram_handle && (
                              <div className="text-sm text-gray-500">{item.influencers.instagram_handle}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.customer_email}</TableCell>
                        <TableCell>{item.influencers?.category || 'N/A'}</TableCell>
                        <TableCell className="font-semibold">
                          <span className={item.total_spent > 0 ? 'text-green-600' : 'text-gray-500'}>
                            {formatCurrency(item.total_spent)}
                          </span>
                        </TableCell>
                        <TableCell>{item.order_count}</TableCell>
                        <TableCell>
                          {item.order_count > 0 ? formatCurrency(item.average_order_value) : 'N/A'}
                        </TableCell>
                        <TableCell>{formatDate(item.first_order_date)}</TableCell>
                        <TableCell>{formatDate(item.last_order_date)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <CardTitle className="text-xl mb-2">No Analysis Data</CardTitle>
                <CardDescription className="mb-4">
                  Run an analysis to see how your influencers are spending with your Shopify store.
                </CardDescription>
                <Button
                  onClick={handleRunAnalysis}
                  disabled={runAnalysisMutation.isPending}
                  className="bg-crm-blue hover:bg-blue-600"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run Analysis
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!selectedClient && shopifyClients && shopifyClients.length > 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <CardTitle className="text-xl mb-2">Select a Shopify Client</CardTitle>
            <CardDescription>
              Choose a Shopify store to analyze influencer spending patterns.
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InfluencerSpendingAnalysis;
