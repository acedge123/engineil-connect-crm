
import { supabase } from '@/integrations/supabase/client';
import type { ParsedCustomerData } from '@/utils/csvParser';

type CustomerOrderInsert = {
  user_id: string;
  customer_email: string;
  customer_name?: string;
  order_id: string;
  order_total: number;
  order_date: string;
  shopify_client_id?: string;
};

export const customerOrderService = {
  async uploadCustomerOrders(
    userId: string,
    customerData: ParsedCustomerData[],
    shopifyClientId?: string
  ) {
    const ordersToInsert: CustomerOrderInsert[] = customerData.map(data => {
      const order: CustomerOrderInsert = {
        user_id: userId,
        customer_email: data.customer_email,
        customer_name: data.customer_name,
        order_id: data.order_id,
        order_total: data.order_total,
        order_date: data.order_date,
      };

      // Only add shopify_client_id if it's provided and not 'default'
      if (shopifyClientId && shopifyClientId !== 'default') {
        order.shopify_client_id = shopifyClientId;
      }
      // If shopifyClientId is 'default' or not provided, we leave shopify_client_id as undefined (which becomes null in DB)

      return order;
    });

    console.log('Processing', ordersToInsert.length, 'customer records');
    console.log('Shopify Client ID being stored:', shopifyClientId);
    console.log('Sample order with shopify_client_id:', ordersToInsert[0]);

    // Delete existing orders for this client first
    if (shopifyClientId && shopifyClientId !== 'default') {
      console.log('Deleting existing orders for shopify_client_id:', shopifyClientId);
      const { error: deleteError } = await supabase
        .from('customer_orders')
        .delete()
        .eq('user_id', userId)
        .eq('shopify_client_id', shopifyClientId);
      
      if (deleteError) throw deleteError;
    } else {
      console.log('Deleting existing orders for default client (null shopify_client_id)');
      const { error: deleteError } = await supabase
        .from('customer_orders')
        .delete()
        .eq('user_id', userId)
        .is('shopify_client_id', null);
      
      if (deleteError) throw deleteError;
    }

    const { data, error } = await supabase
      .from('customer_orders')
      .insert(ordersToInsert)
      .select();

    if (error) throw error;
    
    return data;
  }
};
