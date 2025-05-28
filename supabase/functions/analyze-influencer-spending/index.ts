
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  shopify_client_id: string;
  influencer_ids?: string[];
  date_from?: string;
  date_to?: string;
}

interface ShopifyOrder {
  id: string;
  email: string;
  customer: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  total_price: string;
  created_at: string;
  financial_status: string;
}

async function fetchShopifyOrders(shopifyUrl: string, apiKey: string, dateFrom?: string, dateTo?: string) {
  let baseUrl = shopifyUrl.replace(/^https?:\/\//, '');
  baseUrl = `https://${baseUrl}`;
  
  if (!baseUrl.includes('.myshopify.com')) {
    baseUrl = baseUrl.replace(/\/$/, '') + '.myshopify.com';
  }

  const headers = {
    'X-Shopify-Access-Token': apiKey,
    'Content-Type': 'application/json',
  };

  let url = `${baseUrl}/admin/api/2023-10/orders.json?limit=250&status=any`;
  
  if (dateFrom) {
    url += `&created_at_min=${dateFrom}`;
  }
  if (dateTo) {
    url += `&created_at_max=${dateTo}`;
  }

  console.log('Fetching orders from:', url);

  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    throw new Error(`Shopify API failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.orders || [];
}

async function analyzeInfluencerSpending(
  supabase: any,
  userId: string,
  shopifyClientId: string,
  orders: ShopifyOrder[],
  influencerIds?: string[]
) {
  console.log(`Analyzing ${orders.length} orders for influencer spending`);

  // Get influencers to analyze
  let influencersQuery = supabase
    .from('influencers')
    .select('*')
    .eq('user_id', userId);

  if (influencerIds && influencerIds.length > 0) {
    influencersQuery = influencersQuery.in('id', influencerIds);
  }

  const { data: influencers, error: influencersError } = await influencersQuery;

  if (influencersError) {
    throw new Error(`Failed to fetch influencers: ${influencersError.message}`);
  }

  console.log(`Analyzing ${influencers.length} influencers`);

  const analysisResults = [];

  for (const influencer of influencers) {
    console.log(`Analyzing influencer: ${influencer.email}`);
    
    // Find orders for this influencer
    const influencerOrders = orders.filter(order => 
      order.customer?.email?.toLowerCase() === influencer.email.toLowerCase() ||
      order.email?.toLowerCase() === influencer.email.toLowerCase()
    );

    console.log(`Found ${influencerOrders.length} orders for ${influencer.email}`);

    if (influencerOrders.length > 0) {
      // Calculate spending metrics
      const totalSpent = influencerOrders.reduce((sum, order) => 
        sum + parseFloat(order.total_price || '0'), 0
      );

      const orderCount = influencerOrders.length;
      const averageOrderValue = totalSpent / orderCount;

      // Get date range
      const orderDates = influencerOrders.map(order => new Date(order.created_at));
      const firstOrderDate = new Date(Math.min(...orderDates.map(d => d.getTime())));
      const lastOrderDate = new Date(Math.max(...orderDates.map(d => d.getTime())));

      // Get customer name from first order
      const customerName = influencerOrders[0].customer?.first_name && influencerOrders[0].customer?.last_name
        ? `${influencerOrders[0].customer.first_name} ${influencerOrders[0].customer.last_name}`
        : null;

      const analysisResult = {
        user_id: userId,
        influencer_id: influencer.id,
        shopify_client_id: shopifyClientId,
        customer_email: influencer.email,
        customer_name: customerName,
        total_spent: totalSpent,
        order_count: orderCount,
        first_order_date: firstOrderDate.toISOString(),
        last_order_date: lastOrderDate.toISOString(),
        average_order_value: averageOrderValue,
        analysis_date: new Date().toISOString(),
      };

      analysisResults.push(analysisResult);
    } else {
      // No orders found - still record this
      const analysisResult = {
        user_id: userId,
        influencer_id: influencer.id,
        shopify_client_id: shopifyClientId,
        customer_email: influencer.email,
        customer_name: null,
        total_spent: 0,
        order_count: 0,
        first_order_date: null,
        last_order_date: null,
        average_order_value: 0,
        analysis_date: new Date().toISOString(),
      };

      analysisResults.push(analysisResult);
    }
  }

  return analysisResults;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shopify_client_id, influencer_ids, date_from, date_to }: AnalysisRequest = await req.json();

    if (!shopify_client_id) {
      throw new Error('shopify_client_id is required');
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get user from auth header
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authorization token');
    }

    console.log('Analyzing influencer spending for user:', user.id);

    // Get Shopify client details
    const { data: shopifyClient, error: clientError } = await supabase
      .from('shopify_clients')
      .select('*')
      .eq('id', shopify_client_id)
      .eq('user_id', user.id)
      .single();

    if (clientError || !shopifyClient) {
      throw new Error('Shopify client not found or access denied');
    }

    console.log('Using Shopify client:', shopifyClient.client_name);

    // Fetch orders from Shopify
    const orders = await fetchShopifyOrders(
      shopifyClient.shopify_url,
      shopifyClient.admin_api_key,
      date_from,
      date_to
    );

    console.log(`Fetched ${orders.length} orders from Shopify`);

    // Analyze influencer spending
    const analysisResults = await analyzeInfluencerSpending(
      supabase,
      user.id,
      shopify_client_id,
      orders,
      influencer_ids
    );

    console.log(`Generated ${analysisResults.length} analysis results`);

    // Delete previous analysis for this client and user
    const { error: deleteError } = await supabase
      .from('influencer_spending_analysis')
      .delete()
      .eq('user_id', user.id)
      .eq('shopify_client_id', shopify_client_id);

    if (deleteError) {
      console.log('Warning: Failed to delete previous analysis:', deleteError.message);
    }

    // Insert new analysis results
    if (analysisResults.length > 0) {
      const { data: insertData, error: insertError } = await supabase
        .from('influencer_spending_analysis')
        .insert(analysisResults)
        .select();

      if (insertError) {
        throw new Error(`Failed to save analysis results: ${insertError.message}`);
      }

      console.log('Successfully saved analysis results');
      
      return new Response(JSON.stringify({
        success: true,
        analyzed_influencers: analysisResults.length,
        total_orders: orders.length,
        results: insertData
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({
        success: true,
        analyzed_influencers: 0,
        total_orders: orders.length,
        message: 'No influencers to analyze'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in analyze-influencer-spending function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to analyze influencer spending data'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
