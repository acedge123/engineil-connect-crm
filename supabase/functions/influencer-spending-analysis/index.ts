
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

    console.log('=== FIXED ANALYSIS START ===');
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

    // Get ALL influencers for the user
    const { data: allInfluencers, error: influencersError } = await supabaseClient
      .from('influencers')
      .select('id, email, name, instagram_handle, category')
      .eq('user_id', user.id);

    if (influencersError) {
      throw new Error(`Failed to fetch influencers: ${influencersError.message}`);
    }

    console.log(`Retrieved ${allInfluencers?.length || 0} influencers`);

    // Get ALL customer orders for the specific shopify_client_id
    const { data: customerOrders, error: ordersError } = await supabaseClient
      .from('customer_orders')
      .select('customer_email, customer_name, order_total, order_date, order_id')
      .eq('user_id', user.id)
      .eq('shopify_client_id', shopify_client_id);

    if (ordersError) {
      console.error('Customer orders query error:', ordersError);
      throw new Error(`Failed to fetch customer orders: ${ordersError.message}`);
    }

    console.log(`Retrieved ${customerOrders?.length || 0} customer orders`);

    if (!allInfluencers || !customerOrders) {
      return new Response(JSON.stringify({
        results: [],
        summary: {
          total_influencers: 0,
          matched_influencers: 0,
          total_spending: 0,
          total_orders: 0
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Debug: Log a sample of customer orders to understand the data structure
    if (customerOrders.length > 0) {
      console.log('Sample customer order data:', JSON.stringify(customerOrders[0], null, 2));
    }

    // Create email map for faster lookups
    const ordersByEmail = new Map<string, typeof customerOrders>();
    
    customerOrders.forEach((order, index) => {
      const normalizedEmail = order.customer_email.toLowerCase().trim();
      
      // Debug problematic order data
      if (normalizedEmail.includes('alison.grayson')) {
        console.log(`DEBUGGING Alison Grayson order [${index}]:`, {
          customer_email: order.customer_email,
          customer_name: order.customer_name,
          order_total: order.order_total,
          order_total_type: typeof order.order_total,
          order_id: order.order_id,
          order_date: order.order_date
        });
      }
      
      // Validate order_total is a valid number and not a phone number
      let validOrderTotal = 0;
      if (order.order_total !== null && order.order_total !== undefined) {
        const orderTotalNum = Number(order.order_total);
        // Check if the order total looks like a phone number (10+ digits)
        const orderTotalStr = String(order.order_total);
        if (orderTotalStr.length >= 10 && orderTotalStr.match(/^\d{10,}$/)) {
          console.log(`WARNING: Suspected phone number in order_total for ${order.customer_email}: ${order.order_total}`);
          validOrderTotal = 0; // Set to 0 if it looks like a phone number
        } else if (!isNaN(orderTotalNum) && isFinite(orderTotalNum) && orderTotalNum >= 0 && orderTotalNum < 100000) {
          // Only accept reasonable order totals (less than $100,000)
          validOrderTotal = orderTotalNum;
        } else {
          console.log(`Invalid order_total for ${order.customer_email}: ${order.order_total} (type: ${typeof order.order_total})`);
          validOrderTotal = 0;
        }
      }
      
      const validatedOrder = {
        ...order,
        order_total: validOrderTotal
      };
      
      if (!ordersByEmail.has(normalizedEmail)) {
        ordersByEmail.set(normalizedEmail, []);
      }
      ordersByEmail.get(normalizedEmail)!.push(validatedOrder);
    });

    console.log(`Created lookup map with ${ordersByEmail.size} unique customer emails`);

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

        // Get date range
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

    console.log(`=== FIXED ANALYSIS RESULTS ===`);
    console.log(`Total influencers: ${allInfluencers.length}`);
    console.log(`Total customer orders: ${customerOrders.length}`);
    console.log(`Matched influencers: ${matchedInfluencers}`);
    console.log(`Total spending: $${totalMatchedSpending.toFixed(2)}`);
    console.log(`=== ANALYSIS END ===`);

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
