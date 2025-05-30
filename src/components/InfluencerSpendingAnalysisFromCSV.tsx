
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import CustomerOrdersUpload from './CustomerOrdersUpload';
import AnalysisStatsCards from './AnalysisStatsCards';
import AnalysisResultsTable from './AnalysisResultsTable';
import ClientSelector from './ClientSelector';
import AnalysisControls from './AnalysisControls';

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

type Influencer = {
  id: string;
  email: string;
  name?: string;
  instagram_handle?: string;
  category?: string;
};

const InfluencerSpendingAnalysisFromCSV = () => {
  const { user } = useAuth();
  const [analysisResults, setAnalysisResults] = useState<InfluencerSpendingResult[]>([]);
  const [selectedShopifyClient, setSelectedShopifyClient] = useState<string>('default');

  // Fetch Shopify clients with explicit typing
  const shopifyClientsQuery = useQuery<ShopifyClient[]>({
    queryKey: ['shopify-clients'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('shopify_clients')
        .select('id, client_name, shopify_url')
        .eq('user_id', user.id)
        .order('client_name');

      if (error) throw error;
      return data as ShopifyClient[];
    },
    enabled: !!user,
  });

  const shopifyClients = shopifyClientsQuery.data;

  // Fetch customer orders with explicit typing
  const customerOrdersQuery = useQuery<CustomerOrder[]>({
    queryKey: ['customer-orders', selectedShopifyClient],
    queryFn: async () => {
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
      return data as CustomerOrder[];
    },
    enabled: !!user,
  });

  const customerOrders = customerOrdersQuery.data;
  const ordersLoading = customerOrdersQuery.isLoading;

  // Fetch influencers with explicit typing
  const influencersQuery = useQuery<Influencer[]>({
    queryKey: ['influencers'],
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

  // Analyze spending mutation with explicit typing
  const analyzeSpendingMutation = useMutation<InfluencerSpendingResult[], Error>({
    mutationFn: async () => {
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
          <ClientSelector
            selectedShopifyClient={selectedShopifyClient}
            onValueChange={setSelectedShopifyClient}
            shopifyClients={shopifyClients}
          />

          <AnalysisControls
            onAnalyze={handleAnalyze}
            isAnalyzing={analyzeSpendingMutation.isPending}
            isOrdersLoading={ordersLoading}
            analysisResults={analysisResults}
            selectedShopifyClient={selectedShopifyClient}
            shopifyClients={shopifyClients}
          />

          {analysisResults.length > 0 && (
            <>
              <AnalysisStatsCards analysisResults={analysisResults} />
              <AnalysisResultsTable analysisResults={analysisResults} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InfluencerSpendingAnalysisFromCSV;
