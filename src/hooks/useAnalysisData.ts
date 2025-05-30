
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

export const useAnalysisData = (selectedShopifyClient: string) => {
  const { user } = useAuth();

  // Fetch Shopify clients
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

  // Fetch customer orders
  const customerOrdersQuery = useQuery<CustomerOrder[]>({
    queryKey: ['customer-orders', selectedShopifyClient],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      console.log('Fetching customer orders for analysis...');
      
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
      
      console.log(`Fetched ${data?.length || 0} customer orders for analysis`);
      return data as CustomerOrder[];
    },
    enabled: !!user,
  });

  // Fetch ALL influencers
  const influencersQuery = useQuery<Influencer[]>({
    queryKey: ['influencers-for-analysis'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      console.log('Fetching ALL influencers for analysis...');
      
      let allInfluencers: Influencer[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error, count } = await supabase
          .from('influencers')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(from, from + batchSize - 1);

        if (error) {
          console.error('Error fetching influencers for analysis:', error);
          throw error;
        }

        if (data && data.length > 0) {
          allInfluencers = [...allInfluencers, ...data];
          from += batchSize;
          hasMore = data.length === batchSize;
          
          console.log(`Fetched batch: ${data.length} influencers for analysis (total so far: ${allInfluencers.length})`);
          if (count !== null) {
            console.log(`Database total count for analysis: ${count}`);
          }
        } else {
          hasMore = false;
        }
      }
      
      console.log(`Successfully fetched ALL ${allInfluencers.length} influencers for analysis`);
      return allInfluencers;
    },
    enabled: !!user,
  });

  return {
    shopifyClients: shopifyClientsQuery.data,
    customerOrders: customerOrdersQuery.data,
    influencers: influencersQuery.data,
    ordersLoading: customerOrdersQuery.isLoading,
  };
};
