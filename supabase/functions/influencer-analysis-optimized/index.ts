
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

    // Build the WHERE clause for shopify_client_id
    let shopifyClientFilter = '';
    if (shopify_client_id && shopify_client_id !== 'default') {
      shopifyClientFilter = `AND co.shopify_client_id = '${shopify_client_id}'`;
    } else {
      shopifyClientFilter = 'AND co.shopify_client_id IS NULL';
    }

    // Use a single SQL query with JOIN to efficiently match influencers with customer orders
    const analysisQuery = `
      WITH influencer_orders AS (
        SELECT 
          i.id as influencer_id,
          i.email as customer_email,
          i.name as influencer_name,
          i.instagram_handle,
          i.category,
          COALESCE(SUM(co.order_total), 0) as total_spent,
          COUNT(co.id) as order_count,
          MIN(co.order_date) as first_order_date,
          MAX(co.order_date) as last_order_date,
          CASE 
            WHEN COUNT(co.id) > 0 THEN COALESCE(SUM(co.order_total), 0) / COUNT(co.id)
            ELSE 0
          END as average_order_value,
          STRING_AGG(DISTINCT co.customer_name, ', ') as customer_names
        FROM influencers i
        LEFT JOIN customer_orders co ON 
          LOWER(TRIM(i.email)) = LOWER(TRIM(co.customer_email))
          AND co.user_id = i.user_id
          ${shopifyClientFilter}
        WHERE i.user_id = $1
        GROUP BY i.id, i.email, i.name, i.instagram_handle, i.category
      )
      SELECT 
        influencer_id,
        customer_email,
        influencer_name,
        instagram_handle,
        category,
        total_spent,
        order_count,
        first_order_date,
        last_order_date,
        average_order_value,
        customer_names
      FROM influencer_orders
      ORDER BY total_spent DESC, customer_email;
    `;

    console.log('Executing optimized analysis query...');
    
    // Execute the query directly using the Supabase client
    const { data: directResults, error: directError } = await supabaseClient
      .from('influencers')
      .select(`
        id,
        email,
        name,
        instagram_handle,
        category,
        customer_orders!left (
          order_total,
          order_date,
          customer_name,
          shopify_client_id
        )
      `)
      .eq('user_id', user.id);

    if (directError) {
      throw new Error(`Failed to fetch analysis data: ${directError.message}`);
    }

    // Process the results in JavaScript
    const results = directResults.map(influencer => {
      // Filter customer orders based on shopify_client_id
      let filteredOrders = influencer.customer_orders || [];
      if (shopify_client_id && shopify_client_id !== 'default') {
        filteredOrders = filteredOrders.filter(order => order.shopify_client_id === shopify_client_id);
      } else {
        filteredOrders = filteredOrders.filter(order => !order.shopify_client_id);
      }

      const totalSpent = filteredOrders.reduce((sum, order) => sum + (order.order_total || 0), 0);
      const orderCount = filteredOrders.length;
      const averageOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;

      // Get date range
      const validOrderDates = filteredOrders
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

      const customerName = filteredOrders.find(order => order.customer_name)?.customer_name;

      return {
        influencer_id: influencer.id,
        customer_email: influencer.email,
        influencer_name: influencer.name,
        instagram_handle: influencer.instagram_handle,
        category: influencer.category,
        total_spent: totalSpent,
        order_count: orderCount,
        first_order_date: firstOrderDate,
        last_order_date: lastOrderDate,
        average_order_value: averageOrderValue,
        customer_names: customerName
      };
    });

    console.log(`Analysis completed. Found ${results.length} influencers.`);

    // Calculate summary statistics
    const matchedInfluencers = results.filter(r => r.order_count > 0).length;
    const totalSpending = results.reduce((sum, r) => sum + r.total_spent, 0);
    const totalOrders = results.reduce((sum, r) => sum + r.order_count, 0);

    console.log(`=== OPTIMIZED ANALYSIS RESULTS ===`);
    console.log(`Total influencers: ${results.length}`);
    console.log(`Matched influencers: ${matchedInfluencers}`);
    console.log(`Total spending: $${totalSpending.toFixed(2)}`);
    console.log(`Total orders: ${totalOrders}`);

    // Format results for response
    const formattedResults: InfluencerSpendingResult[] = results.map(result => ({
      influencer_id: result.influencer_id,
      customer_email: result.customer_email,
      customer_name: result.customer_names,
      total_spent: result.total_spent,
      order_count: result.order_count,
      first_order_date: result.first_order_date || '',
      last_order_date: result.last_order_date || '',
      average_order_value: result.average_order_value,
      influencer: {
        name: result.influencer_name,
        instagram_handle: result.instagram_handle,
        category: result.category,
      },
    }));

    // Save results to database for caching
    const cacheData = formattedResults.map(result => ({
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
      .insert(cacheData);

    if (insertError) {
      console.error('Failed to save analysis results:', insertError);
    }

    console.log('=== OPTIMIZED ANALYSIS END ===');

    return new Response(JSON.stringify({
      results: formattedResults,
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
