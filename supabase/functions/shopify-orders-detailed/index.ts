
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DetailedOrdersParams {
  shopify_url: string;
  admin_api_key: string;
  date_from: string;
  date_to: string;
  limit?: number;
  detailed?: boolean;
}

async function fetchOrdersBatch(baseUrl: string, headers: any, params: string, maxPages = 10) {
  let allOrders: any[] = [];
  let nextPageInfo: string | null = null;
  let pageCount = 0;
  
  do {
    let url: string;
    
    if (nextPageInfo) {
      url = `${baseUrl}/admin/api/2023-10/orders.json?page_info=${nextPageInfo}&limit=250`;
    } else {
      url = `${baseUrl}/admin/api/2023-10/orders.json?${params}&limit=250`;
    }
    
    console.log(`Fetching detailed orders page ${pageCount + 1} from:`, url);
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch orders on page ${pageCount + 1}:`, response.status, errorText);
      break;
    }
    
    const data = await response.json();
    const orders = data.orders || [];
    allOrders = allOrders.concat(orders);
    
    // Check for pagination using Link header
    const linkHeader = response.headers.get('Link');
    nextPageInfo = null;
    
    if (linkHeader) {
      const nextMatch = linkHeader.match(/<[^>]*page_info=([^&>]+)[^>]*>; rel="next"/);
      if (nextMatch) {
        nextPageInfo = nextMatch[1];
      }
    }
    
    pageCount++;
    console.log(`Fetched ${orders.length} orders on page ${pageCount}, total so far: ${allOrders.length}`);
    
    // Break if we've fetched enough pages to prevent timeout
    if (pageCount >= maxPages) {
      console.log(`Reached maximum page limit (${maxPages}), stopping fetch`);
      break;
    }
    
  } while (nextPageInfo);
  
  return allOrders;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shopify_url, admin_api_key, date_from, date_to, limit = 1000, detailed = true }: DetailedOrdersParams = await req.json();

    console.log('Fetching detailed orders for:', shopify_url);
    console.log('Date range:', date_from, 'to', date_to);
    console.log('Limit:', limit, 'Detailed:', detailed);
    
    // Use the access token from Supabase secrets
    const accessToken = Deno.env.get('SHOPIFY_ACCESS_TOKEN') || admin_api_key;
    if (!accessToken) {
      throw new Error('SHOPIFY_ACCESS_TOKEN secret not configured and no admin_api_key provided');
    }

    if (!shopify_url) {
      throw new Error('Missing shopify_url');
    }

    // Ensure URL format is correct
    let baseUrl = shopify_url.replace(/^https?:\/\//, '');
    baseUrl = `https://${baseUrl}`;
    
    if (!baseUrl.includes('.myshopify.com')) {
      baseUrl = baseUrl.replace(/\/$/, '') + '.myshopify.com';
    }

    console.log('Final base URL:', baseUrl);

    const startDate = new Date(date_from);
    const endDate = new Date(date_to);

    const headers = {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    };

    // Test API connection first
    console.log('Testing API connection...');
    const testUrl = `${baseUrl}/admin/api/2023-10/shop.json`;
    const testResponse = await fetch(testUrl, { headers });
    
    if (!testResponse.ok) {
      const testError = await testResponse.text();
      console.error('API test failed:', testResponse.status, testError);
      
      if (testResponse.status === 401) {
        throw new Error(`Invalid Shopify API credentials. Status: ${testResponse.status}`);
      } else if (testResponse.status === 404) {
        throw new Error(`Shopify store not found: ${baseUrl}`);
      } else {
        throw new Error(`Shopify API error: ${testResponse.status} - ${testError}`);
      }
    }

    console.log('API connection successful, fetching detailed orders...');

    // Calculate max pages based on limit
    const maxPages = Math.min(Math.ceil(limit / 250), 20); // Cap at 20 pages for safety

    // Fetch orders for selected period
    const orderParams = `status=any&created_at_min=${startDate.toISOString()}&created_at_max=${endDate.toISOString()}`;
    const orders = await fetchOrdersBatch(baseUrl, headers, orderParams, maxPages);
    
    console.log('Total detailed orders fetched:', orders.length);

    // If not detailed, return summary
    if (!detailed) {
      const summary = {
        total_orders: orders.length,
        total_sales: orders.reduce((sum: number, order: any) => sum + parseFloat(order.total_price || '0'), 0),
        average_order_value: orders.length > 0 
          ? orders.reduce((sum: number, order: any) => sum + parseFloat(order.total_price || '0'), 0) / orders.length
          : 0
      };
      
      return new Response(JSON.stringify(summary), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return detailed order data
    const detailedData = {
      orders: orders.slice(0, limit), // Respect the limit
      total_count: orders.length,
      date_range: {
        from: date_from,
        to: date_to
      },
      summary: {
        total_sales: orders.reduce((sum: number, order: any) => sum + parseFloat(order.total_price || '0'), 0),
        average_order_value: orders.length > 0 
          ? orders.reduce((sum: number, order: any) => sum + parseFloat(order.total_price || '0'), 0) / orders.length
          : 0
      }
    };

    return new Response(JSON.stringify(detailedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in shopify-orders-detailed function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to fetch detailed Shopify orders data.'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
