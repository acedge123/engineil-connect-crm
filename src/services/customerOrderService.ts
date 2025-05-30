
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
    const ordersToInsert: CustomerOrderInsert[] = customerData.map(data => ({
      user_id: userId,
      customer_email: data.customer_email,
      customer_name: data.customer_name,
      order_id: data.order_id,
      order_total: data.order_total,
      order_date: data.order_date,
      ...(shopifyClientId && shopifyClientId !== 'default' && { shopify_client_id: shopifyClientId })
    }));

    console.log('Processing', ordersToInsert.length, 'customer records');

    // Delete existing orders for this client first
    if (shopifyClientId && shopifyClientId !== 'default') {
      const { error: deleteError } = await supabase
        .from('customer_orders')
        .delete()
        .eq('user_id', userId)
        .eq('shopify_client_id', shopifyClientId);
      
      if (deleteError) throw deleteError;
    } else {
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
