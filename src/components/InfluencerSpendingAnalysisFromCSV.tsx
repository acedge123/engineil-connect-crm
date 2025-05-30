
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart3, Users, DollarSign, TrendingUp, Play, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import CustomerOrdersUpload from './CustomerOrdersUpload';

type CustomerOrder = {
  id: string;
  user_id: string;
  customer_email: string;
  customer_name?: string;
  order_id: string;
  order_total: number;
  order_date: string;
  shopify_client_id?: string;
  created_at: string;
};

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

type ShopifyClient = {
  id: string;
  client_name: string;
  shopify_url: string;
};

const InfluencerSpendingAnalysisFromCSV = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [analysisResults, setAnalysisResults] = useState<InfluencerSpendingResult[]>([]);
  const [selectedShopifyClient, setSelectedShopifyClient] = useState<string>('default');

  // Fetch Shopify clients with simplified query
  const shopifyClientsQuery = useQuery({
    queryKey: ['shopify-clients'] as const,
    queryFn: async (): Promise<ShopifyClient[]> => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('shopify_clients')
        .select('id, client_name, shopify_url')
        .eq('user_id', user.id)
        .order('client_name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const shopifyClients = shopifyClientsQuery.data;

  // Fetch customer orders with simplified query
  const customerOrdersQuery = useQuery({
    queryKey: ['customer-orders', selectedShopifyClient] as const,
    queryFn: async (): Promise<CustomerOrder[]> => {
      if (!user) throw new Error('User not authenticated');
      
      let query = supabase
        .from('customer_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('order_date', { ascending: false });

      if (selectedShopifyClient && selectedShopifyClient !== 'default') {
        query = query.eq('shopify_client_id', selectedShopifyClient);
      } else {
        query = query.is('shopify_client_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const customerOrders = customerOrdersQuery.data;
  const ordersLoading = customerOrdersQuery.isLoading;

  // Fetch influencers with simplified query
  const influencersQuery = useQuery({
    queryKey: ['influencers'] as const,
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('influencers')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const influencers = influencersQuery.data;

  // Analyze spending mutation with simplified type handling
  const analyzeSpendingMutation = useMutation({
    mutationFn: async (): Promise<InfluencerSpendingResult[]> => {
      if (!user || !customerOrders || !influencers) {
        throw new Error('Missing required data for analysis');
      }

      // Create email map for faster lookups
      const ordersByEmail = new Map<string, CustomerOrder[]>();
      
      customerOrders.forEach(order => {
        const normalizedEmail = order.customer_email.toLowerCase().trim();
        if (!ordersByEmail.has(normalizedEmail)) {
          ordersByEmail.set(normalizedEmail, []);
        }
        ordersByEmail.get(normalizedEmail)!.push(order);
      });

      const clientName = selectedShopifyClient 
        ? shopifyClients?.find(c => c.id === selectedShopifyClient)?.client_name || 'Selected Client'
        : 'Default';

      console.log(`Analyzing ${influencers.length} influencers against ${customerOrders.length} orders for client: ${clientName}`);

      const results: InfluencerSpendingResult[] = [];

      for (const influencer of influencers) {
        const normalizedInfluencerEmail = influencer.email.toLowerCase().trim();
        const influencerOrders = ordersByEmail.get(normalizedInfluencerEmail) || [];

        if (influencerOrders.length > 0) {
          const totalSpent = influencerOrders.reduce((sum, order) => sum + order.order_total, 0);
          const orderCount = influencerOrders.length;
          const averageOrderValue = totalSpent / orderCount;

          // Get date range
          const orderDates = influencerOrders.map(order => new Date(order.order_date));
          const firstOrderDate = new Date(Math.min(...orderDates.map(d => d.getTime())));
          const lastOrderDate = new Date(Math.max(...orderDates.map(d => d.getTime())));

          // Get customer name from orders
          const customerName = influencerOrders.find(order => order.customer_name)?.customer_name;

          results.push({
            influencer_id: influencer.id,
            customer_email: influencer.email,
            customer_name: customerName,
            total_spent: totalSpent,
            order_count: orderCount,
            first_order_date: firstOrderDate.toISOString(),
            last_order_date: lastOrderDate.toISOString(),
            average_order_value: averageOrderValue,
            influencer: {
              name: influencer.name,
              instagram_handle: influencer.instagram_handle,
              category: influencer.category,
            },
          });
        } else {
          // Include influencers with no orders
          results.push({
            influencer_id: influencer.id,
            customer_email: influencer.email,
            customer_name: null,
            total_spent: 0,
            order_count: 0,
            first_order_date: '',
            last_order_date: '',
            average_order_value: 0,
            influencer: {
              name: influencer.name,
              instagram_handle: influencer.instagram_handle,
              category: influencer.category,
            },
          });
        }
      }

      // Save results to database
      const analysisData = results.map(result => ({
        user_id: user.id,
        influencer_id: result.influencer_id,
        customer_email: result.customer_email,
        customer_name: result.customer_name,
        total_spent: result.total_spent,
        order_count: result.order_count,
        first_order_date: result.first_order_date || null,
        last_order_date: result.last_order_date || null,
        average_order_value: result.average_order_value,
        shopify_client_id: selectedShopifyClient === 'default' ? null : selectedShopifyClient,
        analysis_date: new Date().toISOString(),
      }));

      // Delete previous analysis for this client
      let deleteQuery = supabase
        .from('influencer_spending_analysis')
        .delete()
        .eq('user_id', user.id);

      if (selectedShopifyClient && selectedShopifyClient !== 'default') {
        deleteQuery = deleteQuery.eq('shopify_client_id', selectedShopifyClient);
      } else {
        deleteQuery = deleteQuery.is('shopify_client_id', null);
      }

      await deleteQuery;

      // Insert new analysis
      const { data, error } = await supabase
        .from('influencer_spending_analysis')
        .insert(analysisData)
        .select();

      if (error) throw error;

      return results;
    },
    onSuccess: (results) => {
      setAnalysisResults(results);
      const clientName = selectedShopifyClient && selectedShopifyClient !== 'default'
        ? shopifyClients?.find(c => c.id === selectedShopifyClient)?.client_name || 'Selected Client'
        : 'Default';
      toast.success(`Analysis complete for ${clientName}! Found ${results.filter(r => r.total_spent > 0).length} influencers with orders`);
    },
    onError: (error: Error) => {
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  const handleAnalyze = () => {
    if (!customerOrders || customerOrders.length === 0) {
      const clientName = selectedShopifyClient && selectedShopifyClient !== 'default'
        ? shopifyClients?.find(c => c.id === selectedShopifyClient)?.client_name || 'selected client'
        : 'default client';
      toast.error(`Please upload customer orders data for ${clientName} first`);
      return;
    }
    if (!influencers || influencers.length === 0) {
      toast.error('No influencers found. Please add influencers first');
      return;
    }
    analyzeSpendingMutation.mutate();
  };

  const exportResults = () => {
    if (analysisResults.length === 0) {
      toast.error('No analysis results to export');
      return;
    }

    const clientName = selectedShopifyClient && selectedShopifyClient !== 'default'
      ? shopifyClients?.find(c => c.id === selectedShopifyClient)?.client_name || 'SelectedClient'
      : 'Default';

    const csvContent = [
      ['Influencer Name', 'Email', 'Instagram Handle', 'Category', 'Total Spent', 'Order Count', 'Average Order Value', 'First Order', 'Last Order'].join(','),
      ...analysisResults
        .filter(result => result.total_spent > 0)
        .map(result => [
          result.influencer?.name || '',
          result.customer_email,
          result.influencer?.instagram_handle || '',
          result.influencer?.category || '',
          result.total_spent.toFixed(2),
          result.order_count,
          result.average_order_value.toFixed(2),
          result.first_order_date ? new Date(result.first_order_date).toLocaleDateString() : '',
          result.last_order_date ? new Date(result.last_order_date).toLocaleDateString() : ''
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `influencer-spending-analysis-${clientName}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const totalSpending = analysisResults.reduce((sum, result) => sum + result.total_spent, 0);
  const influencersWithOrders = analysisResults.filter(result => result.total_spent > 0);
  const averageSpending = influencersWithOrders.length > 0 
    ? totalSpending / influencersWithOrders.length 
    : 0;

  return (
    <div className="space-y-6">
      <CustomerOrdersUpload />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Influencer Spending Analysis
          </CardTitle>
          <CardDescription>
            Analyze influencer spending patterns based on uploaded customer order data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="analysis-client">Shopify Client for Analysis</Label>
            <Select value={selectedShopifyClient} onValueChange={setSelectedShopifyClient}>
              <SelectTrigger>
                <SelectValue placeholder="Select a Shopify client or leave blank for default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default (No specific client)</SelectItem>
                {shopifyClients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.client_name} ({client.shopify_url})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleAnalyze}
              disabled={analyzeSpendingMutation.isPending || ordersLoading}
              className="bg-crm-blue hover:bg-blue-600"
            >
              <Play className="w-4 h-4 mr-2" />
              {analyzeSpendingMutation.isPending ? 'Analyzing...' : 'Run Analysis'}
            </Button>
            
            {analysisResults.length > 0 && (
              <Button 
                onClick={exportResults}
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Results
              </Button>
            )}
          </div>

          {/* Stats Cards */}
          {analysisResults.length > 0 && (
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
          )}

          {/* Results Table */}
          {analysisResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
                <CardDescription>
                  Influencer spending breakdown (showing only influencers with orders)
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
                            {result.first_order_date && result.last_order_date ? (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InfluencerSpendingAnalysisFromCSV;
