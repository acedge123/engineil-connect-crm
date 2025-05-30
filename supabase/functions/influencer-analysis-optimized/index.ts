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

    console.log('=== OPTIMIZED ANALYSIS START ===');
    console.log(`Target shopify_client_id: ${shopify_client_id}`);

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

    console.log(`Analyzing for user: ${user.id}`);

    // Step 1: Fetch all influencers (removed user_id filter)
    console.log('Fetching influencers...');
    const { data: influencers, error: influencersError } = await supabaseClient
      .from('influencers')
      .select('id, email, name, instagram_handle, category');

    if (influencersError) {
      throw new Error(`Failed to fetch influencers: ${influencersError.message}`);
    }

    console.log(`Found ${influencers?.length || 0} influencers`);

    // Step 2: Fetch customer orders based on shopify_client_id filter (removed user_id filter)
    console.log('Fetching customer orders...');
    let ordersQuery = supabaseClient
      .from('customer_orders')
      .select('customer_email, customer_name, order_total, order_date');

    // Apply shopify_client_id filter
    if (shopify_client_id && shopify_client_id !== 'default') {
      ordersQuery = ordersQuery.eq('shopify_client_id', shopify_client_id);
    } else {
      ordersQuery = ordersQuery.is('shopify_client_id', null);
    }

    const { data: orders, error: ordersError } = await ordersQuery;

    if (ordersError) {
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }

    console.log(`Found ${orders?.length || 0} customer orders`);

    // Step 3: Process data in JavaScript to match influencers with orders
    const results: InfluencerSpendingResult[] = [];

    if (influencers && orders) {
      // Create a map of customer emails to their orders for faster lookup
      const ordersByEmail = new Map<string, typeof orders>();
      orders.forEach(order => {
        const email = order.customer_email?.toLowerCase()?.trim();
        if (email) {
          if (!ordersByEmail.has(email)) {
            ordersByEmail.set(email, []);
          }
          ordersByEmail.get(email)!.push(order);
        }
      });

      // Process each influencer
      influencers.forEach(influencer => {
        const influencerEmail = influencer.email?.toLowerCase()?.trim();
        const matchingOrders = influencerEmail ? ordersByEmail.get(influencerEmail) || [] : [];

        // Calculate spending metrics
        const totalSpent = matchingOrders.reduce((sum, order) => sum + (order.order_total || 0), 0);
        const orderCount = matchingOrders.length;
        const averageOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;

        // Get date range
        const validOrderDates = matchingOrders
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

        const customerName = matchingOrders.find(order => order.customer_name)?.customer_name;

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
      });
    }

    console.log(`Analysis completed. Processed ${results.length} influencers.`);

    // Calculate summary statistics
    const matchedInfluencers = results.filter(r => r.order_count > 0).length;
    const totalSpending = results.reduce((sum, r) => sum + r.total_spent, 0);
    const totalOrders = results.reduce((sum, r) => sum + r.order_count, 0);

    console.log(`=== OPTIMIZED ANALYSIS RESULTS ===`);
    console.log(`Total influencers: ${results.length}`);
    console.log(`Matched influencers: ${matchedInfluencers}`);
    console.log(`Total spending: $${totalSpending.toFixed(2)}`);
    console.log(`Total orders: ${totalOrders}`);

    // Save results to database for caching (keep user_id for cache ownership)
    const cacheData = results.map(result => ({
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
    if (cacheData.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('influencer_spending_analysis')
        .insert(cacheData);

      if (insertError) {
        console.error('Failed to save analysis results:', insertError);
      } else {
        console.log(`Successfully cached ${cacheData.length} analysis results`);
      }
    }

    console.log('=== OPTIMIZED ANALYSIS END ===');

    return new Response(JSON.stringify({
      results: results,
      summary: {
        total_influencers: results.length,
        matched_influencers: matchedInfluencers,
        total_spending: totalSpending,
        total_orders: totalOrders
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Error in influencer-analysis-optimized function:', error);
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
