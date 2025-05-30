
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Play, RefreshCw, TrendingUp, DollarSign, ShoppingCart, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useInfluencerAnalysis } from '@/hooks/useInfluencerAnalysis';

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
  influencer: {
    name: string | null;
    instagram_handle: string | null;
    category: string | null;
  } | null;
};

const InfluencerSpendingAnalysis = () => {
  const { user } = useAuth();
  const [selectedClient, setSelectedClient] = useState<string>('');

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

  // Use the same hook as the CSV analysis component
  const { 
    analysisResults, 
    isAnalyzing, 
    handleAnalyze 
  } = useInfluencerAnalysis(selectedClient, shopifyClients);

  // Fetch cached analysis results from database
  const { data: analysisData, isLoading } = useQuery({
    queryKey: ['influencer-spending-analysis', selectedClient],
    queryFn: async () => {
      if (!selectedClient) return [];
      
      let query = supabase
        .from('influencer_spending_analysis')
        .select(`
          *,
          influencers (
            name,
            instagram_handle,
            category
          )
        `);
      
      // Handle client filtering
      if (selectedClient === 'default') {
        query = query.is('shopify_client_id', null);
      } else {
        query = query.eq('shopify_client_id', selectedClient);
      }
      
      query = query.order('total_spent', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      
      // Transform the data to match the expected structure
      return data.map(item => ({
        ...item,
        influencer: item.influencers ? {
          name: item.influencers.name,
          instagram_handle: item.influencers.instagram_handle,
          category: item.influencers.category,
        } : null
      })) as SpendingAnalysis[];
    },
    enabled: !!user && !!selectedClient,
  });

  const handleRunAnalysis = () => {
    if (!selectedClient) {
      toast.error('Please select a Shopify client first');
      return;
    }
    handleAnalyze();
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

  // Use live analysis results if available, otherwise use cached data
  const displayData = analysisResults.length > 0 ? analysisResults : analysisData || [];
  const spendingInfluencers = displayData.filter(item => item.total_spent > 0);

  // Calculate summary stats
  const totalSpent = displayData.reduce((sum, item) => sum + item.total_spent, 0);
  const totalOrders = displayData.reduce((sum, item) => sum + item.order_count, 0);

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
              <SelectItem value="default">Default (Four Visions)</SelectItem>
              {shopifyClients?.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.client_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            onClick={handleRunAnalysis}
            disabled={!selectedClient || isAnalyzing}
            className="bg-crm-blue hover:bg-blue-600"
          >
            {isAnalyzing ? (
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
                <div className="text-2xl font-bold">{spendingInfluencers.length}</div>
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
          ) : displayData && displayData.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Spending Analysis Results</CardTitle>
                <CardDescription>
                  Showing {spendingInfluencers.length} influencers with orders (from {displayData.length} total analyzed)
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
                    {spendingInfluencers
                      .sort((a, b) => b.total_spent - a.total_spent)
                      .map((item) => (
                        <TableRow key={item.influencer_id || item.customer_email}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{item.influencer?.name || item.customer_name || 'N/A'}</div>
                              {item.influencer?.instagram_handle && (
                                <div className="text-sm text-gray-500">{item.influencer.instagram_handle}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{item.customer_email}</TableCell>
                          <TableCell>{item.influencer?.category || 'N/A'}</TableCell>
                          <TableCell className="font-semibold">
                            <span className="text-green-600">
                              {formatCurrency(item.total_spent)}
                            </span>
                          </TableCell>
                          <TableCell>{item.order_count}</TableCell>
                          <TableCell>
                            {formatCurrency(item.average_order_value)}
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
                  disabled={isAnalyzing}
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
