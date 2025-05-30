
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

type CustomerOrder = {
  id: string;
  order_id: string;
  customer_email: string;
  customer_name: string | null;
  order_total: number;
  order_date: string;
};

export const useInfluencerSpendingAnalysis = (shopifyClientId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const analysisQuery = useQuery<InfluencerSpendingAnalysis[]>({
    queryKey: ['influencer-spending-analysis', shopifyClientId],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('influencer_spending_analysis')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (shopifyClientId && shopifyClientId !== 'default') {
        query = query.eq('shopify_client_id', shopifyClientId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching influencer spending analysis:', error);
        throw error;
      }

      return data as InfluencerSpendingAnalysis[];
    },
    enabled: !!user,
  });

  const createAnalysisMutation = useMutation({
    mutationFn: async ({ 
      influencerId, 
      customerOrderId, 
      shopifyClientId 
    }: { 
      influencerId: string; 
      customerOrderId: string; 
      shopifyClientId?: string; 
    }) => {
      if (!user) throw new Error('User not authenticated');

      // First, get the customer order details
      const { data: customerOrder, error: orderError } = await supabase
        .from('customer_orders')
        .select('*')
        .eq('id', customerOrderId)
        .single();

      if (orderError) throw orderError;

      // Calculate total spent for this customer across all orders
      const { data: allOrders, error: totalError } = await supabase
        .from('customer_orders')
        .select('order_total')
        .eq('customer_email', customerOrder.customer_email)
        .eq('user_id', user.id);

      if (totalError) throw totalError;

      const totalSpent = allOrders.reduce((sum, order) => sum + order.order_total, 0);

      // Create or update the analysis record
      const { data, error } = await supabase
        .from('influencer_spending_analysis')
        .upsert({
          user_id: user.id,
          influencer_id: influencerId,
          customer_email: customerOrder.customer_email,
          customer_name: customerOrder.customer_name,
          total_spent: totalSpent,
          shopify_client_id: shopifyClientId || null,
          customer_order_id: customerOrderId,
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['influencer-spending-analysis'] });
      toast.success('Influencer-customer link created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create link: ${error.message}`);
    },
  });

  const deleteAnalysisMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const { error } = await supabase
        .from('influencer_spending_analysis')
        .delete()
        .eq('id', analysisId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['influencer-spending-analysis'] });
      toast.success('Influencer-customer link removed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove link: ${error.message}`);
    },
  });

  return {
    analysis: analysisQuery.data,
    isLoading: analysisQuery.isLoading,
    createLink: createAnalysisMutation.mutate,
    deleteLink: deleteAnalysisMutation.mutate,
    isCreating: createAnalysisMutation.isPending,
    isDeleting: deleteAnalysisMutation.isPending,
  };
};
