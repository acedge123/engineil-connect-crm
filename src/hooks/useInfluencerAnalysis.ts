
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type InfluencerSpendingResult = {
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

type Influencer = {
  id: string;
  email: string;
  name?: string;
  instagram_handle?: string;
  category?: string;
};

type ShopifyClient = {
  id: string;
  client_name: string;
  shopify_url: string;
};

export const useInfluencerAnalysis = (
  selectedShopifyClient: string,
  shopifyClients?: ShopifyClient[]
) => {
  const { user } = useAuth();
  const [analysisResults, setAnalysisResults] = useState<InfluencerSpendingResult[]>([]);

  const analyzeSpendingMutation = useMutation<
    InfluencerSpendingResult[],
    Error,
    { customerOrders: CustomerOrder[]; influencers: Influencer[] }
  >({
    mutationFn: async ({ customerOrders, influencers }) => {
      if (!user || !customerOrders || !influencers) {
        throw new Error('Missing required data for analysis');
      }

      console.log(`=== ANALYSIS DEBUG START ===`);
      console.log(`Starting analysis with ${influencers.length} influencers and ${customerOrders.length} customer orders`);

      // Detailed analysis of customer orders
      console.log(`=== CUSTOMER ORDERS ANALYSIS ===`);
      const totalCustomerSpending = customerOrders.reduce((sum, order) => sum + order.order_total, 0);
      const uniqueCustomerEmails = new Set(customerOrders.map(order => order.customer_email.toLowerCase().trim()));
      console.log(`Total customer orders: ${customerOrders.length}`);
      console.log(`Unique customer emails: ${uniqueCustomerEmails.size}`);
      console.log(`Total spending in customer orders: $${totalCustomerSpending.toFixed(2)}`);
      
      // Sample customer orders
      console.log(`Sample customer orders:`, customerOrders.slice(0, 5).map(order => ({
        email: order.customer_email,
        total: order.order_total,
        name: order.customer_name
      })));

      // Create email map for faster lookups
      const ordersByEmail = new Map<string, CustomerOrder[]>();
      
      customerOrders.forEach(order => {
        const normalizedEmail = order.customer_email.toLowerCase().trim();
        if (!ordersByEmail.has(normalizedEmail)) {
          ordersByEmail.set(normalizedEmail, []);
        }
        ordersByEmail.get(normalizedEmail)!.push(order);
      });

      console.log(`=== EMAIL MAPPING ===`);
      console.log(`Created order lookup map with ${ordersByEmail.size} unique customer emails`);

      // Analyze influencer emails
      console.log(`=== INFLUENCER ANALYSIS ===`);
      const influencerEmails = new Set(influencers.map(inf => inf.email.toLowerCase().trim()));
      console.log(`Total influencers: ${influencers.length}`);
      console.log(`Unique influencer emails: ${influencerEmails.size}`);
      
      // Sample influencer emails
      console.log(`Sample influencer emails:`, Array.from(influencerEmails).slice(0, 10));

      // Find overlapping emails
      const overlappingEmails = Array.from(influencerEmails).filter(email => uniqueCustomerEmails.has(email));
      console.log(`=== EMAIL OVERLAP ANALYSIS ===`);
      console.log(`Overlapping emails found: ${overlappingEmails.length}`);
      console.log(`Sample overlapping emails:`, overlappingEmails.slice(0, 10));

      const clientName = selectedShopifyClient 
        ? shopifyClients?.find(c => c.id === selectedShopifyClient)?.client_name || 'Selected Client'
        : 'Default';

      const results: InfluencerSpendingResult[] = [];
      let matchedInfluencers = 0;
      let totalMatchedSpending = 0;

      for (const influencer of influencers) {
        const normalizedInfluencerEmail = influencer.email.toLowerCase().trim();
        const influencerOrders = ordersByEmail.get(normalizedInfluencerEmail) || [];

        if (influencerOrders.length > 0) {
          matchedInfluencers++;
          const totalSpent = influencerOrders.reduce((sum, order) => sum + order.order_total, 0);
          totalMatchedSpending += totalSpent;
          const orderCount = influencerOrders.length;
          const averageOrderValue = totalSpent / orderCount;

          console.log(`MATCH: ${influencer.email} -> $${totalSpent.toFixed(2)} (${orderCount} orders)`);

          // Get date range - only from orders with valid dates
          const validOrderDates = influencerOrders
            .filter(order => order.order_date && order.order_date.trim() !== '')
            .map(order => new Date(order.order_date));
          
          let firstOrderDate = '';
          let lastOrderDate = '';
          
          if (validOrderDates.length > 0) {
            const firstDate = new Date(Math.min(...validOrderDates.map(d => d.getTime())));
            const lastDate = new Date(Math.max(...validOrderDates.map(d => d.getTime())));
            firstOrderDate = firstDate.toISOString();
            lastOrderDate = lastDate.toISOString();
          }

          // Get customer name from orders
          const customerName = influencerOrders.find(order => order.customer_name)?.customer_name;

          results.push({
            influencer_id: influencer.id,
            customer_email: influencer.email,
            customer_name: customerName,
            total_spent: totalSpent,
            order_count: orderCount,
            first_order_date: firstOrderDate,
            last_order_date: lastOrderDate,
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

      console.log(`=== FINAL ANALYSIS RESULTS ===`);
      console.log(`Analysis complete: ${matchedInfluencers} out of ${influencers.length} influencers had orders`);
      console.log(`Total matched spending: $${totalMatchedSpending.toFixed(2)}`);
      console.log(`Expected matches (from ChatGPT): 1772 influencers with $268,906`);
      console.log(`Our results: ${matchedInfluencers} influencers with $${totalMatchedSpending.toFixed(2)}`);
      console.log(`=== ANALYSIS DEBUG END ===`);

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
      const matchedCount = results.filter(r => r.total_spent > 0).length;
      const totalSpending = results.reduce((sum, r) => sum + r.total_spent, 0);
      toast.success(`Analysis complete for ${clientName}! Found ${matchedCount} influencers with orders totaling $${totalSpending.toFixed(2)}`);
    },
    onError: (error: Error) => {
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  const handleAnalyze = (customerOrders: any[], influencers: any[]) => {
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
    
    console.log(`Starting analysis with ${influencers.length} total influencers`);
    analyzeSpendingMutation.mutate({ customerOrders, influencers });
  };

  return {
    analysisResults,
    isAnalyzing: analyzeSpendingMutation.isPending,
    handleAnalyze,
  };
};
