
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

    // Step 1: Fetch ALL influencers with pagination
    console.log('Fetching all influencers with pagination...');
    let allInfluencers: any[] = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: influencerBatch, error: influencersError } = await supabaseClient
        .from('influencers')
        .select('id, email, name, instagram_handle, category')
        .range(from, from + batchSize - 1);

      if (influencersError) {
        throw new Error(`Failed to fetch influencers: ${influencersError.message}`);
      }

      if (influencerBatch && influencerBatch.length > 0) {
        allInfluencers = [...allInfluencers, ...influencerBatch];
        console.log(`Fetched batch ${from}-${from + influencerBatch.length - 1}: ${influencerBatch.length} influencers`);
        
        hasMore = influencerBatch.length === batchSize;
        from += batchSize;
      } else {
        hasMore = false;
      }
    }

    console.log(`Fetched ALL ${allInfluencers.length} influencers`);

    // Step 2: Fetch ALL customer orders with pagination
    console.log('Fetching all customer orders with pagination...');
    let allOrders: any[] = [];
    from = 0;
    hasMore = true;

    while (hasMore) {
      let ordersQuery = supabaseClient
        .from('customer_orders')
        .select('customer_email, customer_name, order_total, order_date')
        .range(from, from + batchSize - 1);

      // Apply shopify_client_id filter
      if (shopify_client_id && shopify_client_id !== 'default') {
        ordersQuery = ordersQuery.eq('shopify_client_id', shopify_client_id);
      } else {
        ordersQuery = ordersQuery.is('shopify_client_id', null);
      }

      const { data: orderBatch, error: ordersError } = await ordersQuery;

      if (ordersError) {
        throw new Error(`Failed to fetch orders: ${ordersError.message}`);
      }

      if (orderBatch && orderBatch.length > 0) {
        allOrders = [...allOrders, ...orderBatch];
        console.log(`Fetched batch ${from}-${from + orderBatch.length - 1}: ${orderBatch.length} orders`);
        
        hasMore = orderBatch.length === batchSize;
        from += batchSize;
      } else {
        hasMore = false;
      }
    }

    console.log(`Fetched ALL ${allOrders.length} customer orders`);

    // Step 3: Process data with FIXED matching logic
    const results: InfluencerSpendingResult[] = [];

    if (allInfluencers && allOrders) {
      // Create a map of normalized customer emails to their orders for faster lookup
      const ordersByEmail = new Map<string, typeof allOrders>();
      
      allOrders.forEach(order => {
        if (!order.customer_email) return;
        
        // Normalize email: lowercase and trim
        const normalizedEmail = order.customer_email.toLowerCase().trim();
        
        if (!ordersByEmail.has(normalizedEmail)) {
          ordersByEmail.set(normalizedEmail, []);
        }
        ordersByEmail.get(normalizedEmail)!.push(order);
      });

      console.log(`Created email lookup map with ${ordersByEmail.size} unique email addresses`);

      // Process each influencer
      let matchedCount = 0;
      allInfluencers.forEach((influencer, index) => {
        if (!influencer.email) {
          // Create entry for influencer with no email
          results.push({
            influencer_id: influencer.id,
            customer_email: influencer.email || '',
            customer_name: undefined,
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
          return;
        }

        // Normalize influencer email
        const normalizedInfluencerEmail = influencer.email.toLowerCase().trim();
        const matchingOrders = ordersByEmail.get(normalizedInfluencerEmail) || [];

        if (matchingOrders.length > 0) {
          matchedCount++;
          console.log(`Match ${matchedCount}: ${influencer.email} has ${matchingOrders.length} orders`);
        }

        // Calculate spending metrics
        const totalSpent = matchingOrders.reduce((sum, order) => {
          const orderTotal = parseFloat(order.order_total) || 0;
          return sum + orderTotal;
        }, 0);
        
        const orderCount = matchingOrders.length;
        const averageOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;

        // Get date range with better error handling
        const validOrderDates = matchingOrders
          .map(order => {
            if (!order.order_date || order.order_date.trim() === '') return null;
            try {
              return new Date(order.order_date);
            } catch (e) {
              console.warn(`Invalid date format for order: ${order.order_date}`);
              return null;
            }
          })
          .filter(date => date !== null && !isNaN(date.getTime()));
        
        let firstOrderDate = '';
        let lastOrderDate = '';
        
        if (validOrderDates.length > 0) {
          const sortedDates = validOrderDates.sort((a, b) => a.getTime() - b.getTime());
          firstOrderDate = sortedDates[0].toISOString();
          lastOrderDate = sortedDates[sortedDates.length - 1].toISOString();
        }

        // Get customer name from any of the matching orders
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

        // Log progress every 500 influencers
        if ((index + 1) % 500 === 0) {
          console.log(`Processed ${index + 1}/${allInfluencers.length} influencers. Matches so far: ${matchedCount}`);
        }
      });

      console.log(`Analysis completed. Total matches found: ${matchedCount}`);
    }

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

    // Insert new analysis results in batches to avoid timeout
    if (cacheData.length > 0) {
      const insertBatchSize = 1000;
      let insertedCount = 0;
      
      for (let i = 0; i < cacheData.length; i += insertBatchSize) {
        const batch = cacheData.slice(i, i + insertBatchSize);
        const { error: insertError } = await supabaseClient
          .from('influencer_spending_analysis')
          .insert(batch);

        if (insertError) {
          console.error(`Failed to save analysis batch ${i}-${i + batch.length}:`, insertError);
        } else {
          insertedCount += batch.length;
          console.log(`Successfully cached batch ${i}-${i + batch.length} (${insertedCount}/${cacheData.length} total)`);
        }
      }
      
      console.log(`Successfully cached ${insertedCount} analysis results total`);
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
