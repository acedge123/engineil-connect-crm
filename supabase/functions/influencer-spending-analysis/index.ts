
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InfluencerSpendingResult {
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
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { shopify_client_id } = await req.json();

    console.log('=== BACKEND ANALYSIS START ===');
    console.log(`Analyzing for shopify_client_id: ${shopify_client_id || 'null/default'}`);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    console.log(`Processing for user: ${user.id}`);

    // Fetch ALL influencers for the user in batches
    let allInfluencers: any[] = [];
    let offset = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: influencerBatch, error: influencersError } = await supabaseClient
        .from('influencers')
        .select('id, email, name, instagram_handle, category')
        .eq('user_id', user.id)
        .range(offset, offset + batchSize - 1);

      if (influencersError) {
        throw new Error(`Failed to fetch influencers: ${influencersError.message}`);
      }

      if (influencerBatch && influencerBatch.length > 0) {
        allInfluencers = allInfluencers.concat(influencerBatch);
        console.log(`Fetched batch: ${influencerBatch.length} influencers (total so far: ${allInfluencers.length})`);
        
        if (influencerBatch.length < batchSize) {
          hasMore = false;
        } else {
          offset += batchSize;
        }
      } else {
        hasMore = false;
      }
    }

    console.log(`Successfully fetched ALL ${allInfluencers.length} influencers`);

    // Fetch customer orders based on shopify_client_id - with better debugging
    console.log(`Building customer orders query for shopify_client_id: ${shopify_client_id}`);
    
    let ordersQuery = supabaseClient
      .from('customer_orders')
      .select('customer_email, customer_name, order_total, order_date')
      .eq('user_id', user.id);

    // Handle shopify_client_id filtering more explicitly
    if (shopify_client_id && shopify_client_id !== 'default' && shopify_client_id !== null) {
      console.log(`Filtering by shopify_client_id: ${shopify_client_id}`);
      ordersQuery = ordersQuery.eq('shopify_client_id', shopify_client_id);
    } else {
      console.log('Filtering for null shopify_client_id (default client)');
      ordersQuery = ordersQuery.is('shopify_client_id', null);
    }

    const { data: customerOrders, error: ordersError } = await ordersQuery;

    if (ordersError) {
      console.error('Customer orders query error:', ordersError);
      throw new Error(`Failed to fetch customer orders: ${ordersError.message}`);
    }

    console.log(`Fetched ${customerOrders?.length || 0} customer orders`);

    // If no customer orders, let's also check what clients exist for debugging
    if (!customerOrders || customerOrders.length === 0) {
      console.log('=== DEBUGGING: No customer orders found ===');
      
      // Check all shopify_client_ids for this user
      const { data: allOrdersCheck } = await supabaseClient
        .from('customer_orders')
        .select('shopify_client_id')
        .eq('user_id', user.id)
        .limit(5);
        
      console.log('Sample shopify_client_ids in customer_orders:', allOrdersCheck?.map(o => o.shopify_client_id));
      
      // Check total count for user
      const { count: totalOrdersCount } = await supabaseClient
        .from('customer_orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
        
      console.log(`Total customer orders for user: ${totalOrdersCount}`);
    }

    if (!allInfluencers || !customerOrders) {
      return new Response(JSON.stringify({
        results: [],
        summary: {
          total_influencers: allInfluencers?.length || 0,
          matched_influencers: 0,
          total_spending: 0,
          total_orders: customerOrders?.length || 0
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Create email map for faster lookups
    const ordersByEmail = new Map<string, typeof customerOrders>();
    
    customerOrders.forEach(order => {
      const normalizedEmail = order.customer_email.toLowerCase().trim();
      if (!ordersByEmail.has(normalizedEmail)) {
        ordersByEmail.set(normalizedEmail, []);
      }
      ordersByEmail.get(normalizedEmail)!.push(order);
    });

    console.log(`Created order lookup map with ${ordersByEmail.size} unique customer emails`);

    // Process influencers and match with orders
    const results: InfluencerSpendingResult[] = [];
    let matchedInfluencers = 0;
    let totalMatchedSpending = 0;

    for (const influencer of allInfluencers) {
      const normalizedInfluencerEmail = influencer.email.toLowerCase().trim();
      const influencerOrders = ordersByEmail.get(normalizedInfluencerEmail) || [];

      if (influencerOrders.length > 0) {
        matchedInfluencers++;
        const totalSpent = influencerOrders.reduce((sum, order) => sum + (order.order_total || 0), 0);
        totalMatchedSpending += totalSpent;
        const orderCount = influencerOrders.length;
        const averageOrderValue = totalSpent / orderCount;

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

        console.log(`MATCH: ${influencer.email} -> $${totalSpent.toFixed(2)} (${orderCount} orders)`);
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

    console.log(`=== BACKEND ANALYSIS RESULTS ===`);
    console.log(`Total influencers processed: ${allInfluencers.length}`);
    console.log(`Matched influencers with orders: ${matchedInfluencers}`);
    console.log(`Total matched spending: $${totalMatchedSpending.toFixed(2)}`);
    console.log(`Total customer orders available: ${customerOrders.length}`);
    console.log(`Expected matches: 1772 influencers`);
    console.log(`=== BACKEND ANALYSIS END ===`);

    // Save results to database for caching
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
      shopify_client_id: shopify_client_id === 'default' ? null : shopify_client_id,
      analysis_date: new Date().toISOString(),
    }));

    // Delete previous analysis for this client
    let deleteQuery = supabaseClient
      .from('influencer_spending_analysis')
      .delete()
      .eq('user_id', user.id);

    if (shopify_client_id && shopify_client_id !== 'default') {
      deleteQuery = deleteQuery.eq('shopify_client_id', shopify_client_id);
    } else {
      deleteQuery = deleteQuery.is('shopify_client_id', null);
    }

    await deleteQuery;

    // Insert new analysis results
    const { error: insertError } = await supabaseClient
      .from('influencer_spending_analysis')
      .insert(analysisData);

    if (insertError) {
      console.error('Failed to save analysis results:', insertError);
      // Don't throw error, just log it as results are still returned
    }

    return new Response(JSON.stringify({
      results,
      summary: {
        total_influencers: allInfluencers.length,
        matched_influencers: matchedInfluencers,
        total_spending: totalMatchedSpending,
        total_orders: customerOrders.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Error in influencer-spending-analysis function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
