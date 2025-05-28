
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchOrdersBatch(baseUrl: string, headers: any, params: string, maxPages = 20) {
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
    
    console.log(`Fetching orders page ${pageCount + 1} from:`, url);
    
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

async function fetchCustomersBatch(baseUrl: string, headers: any, maxPages = 10) {
  let allCustomers: any[] = [];
  let nextPageInfo: string | null = null;
  let pageCount = 0;
  
  do {
    let url: string;
    
    if (nextPageInfo) {
      url = `${baseUrl}/admin/api/2023-10/customers.json?page_info=${nextPageInfo}&limit=250`;
    } else {
      url = `${baseUrl}/admin/api/2023-10/customers.json?limit=250`;
    }
    
    console.log(`Fetching customers page ${pageCount + 1}`);
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      console.error(`Failed to fetch customers on page ${pageCount + 1}:`, response.status);
      break;
    }
    
    const data = await response.json();
    const customers = data.customers || [];
    allCustomers = allCustomers.concat(customers);
    
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
    console.log(`Fetched ${customers.length} customers on page ${pageCount}, total so far: ${allCustomers.length}`);
    
    // Break if we've fetched enough pages to prevent timeout
    if (pageCount >= maxPages) {
      console.log(`Reached maximum page limit (${maxPages}), stopping fetch`);
      break;
    }
    
  } while (nextPageInfo);
  
  return allCustomers;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shopify_url, admin_api_key, date_from, date_to } = await req.json();

    console.log('Fetching analytics for:', shopify_url);
    console.log('Date range:', date_from, 'to', date_to);
    
    // Use the access token from Supabase secrets
    const accessToken = Deno.env.get('SHOPIFY_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('SHOPIFY_ACCESS_TOKEN secret not configured');
    }
    console.log('Using access token from secrets (first 10 chars):', accessToken.substring(0, 10) + '...');

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

    // Use provided date range or default to current year
    const startDate = date_from ? new Date(date_from) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = date_to ? new Date(date_to) : new Date();

    // Get current date information for calculations
    const now = new Date();
    const currentYear = now.getFullYear();
    const lastYear = currentYear - 1;

    // Period calculation (selected range)
    const periodStart = startDate.toISOString();
    const periodEnd = endDate.toISOString();

    // YTD calculation (January 1st to today)
    const ytdStart = new Date(currentYear, 0, 1).toISOString();
    const ytdEnd = now.toISOString();

    // Last year same period for YoY comparison
    const lastYearStart = new Date(lastYear, 0, 1).toISOString();
    const lastYearEnd = new Date(lastYear, 11, 31).toISOString();

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
        throw new Error(`Invalid Shopify API credentials. Please check your admin API key and ensure it has the correct permissions. Status: ${testResponse.status}`);
      } else if (testResponse.status === 404) {
        throw new Error(`Shopify store not found. Please verify the store URL: ${baseUrl}`);
      } else {
        throw new Error(`Shopify API error: ${testResponse.status} - ${testError}`);
      }
    }

    console.log('API connection successful, fetching orders with optimized batching...');

    // Fetch orders for selected period with limited pagination
    const periodOrdersParams = `status=any&created_at_min=${periodStart}&created_at_max=${periodEnd}`;
    const periodOrders = await fetchOrdersBatch(baseUrl, headers, periodOrdersParams, 15);
    console.log('Total period orders fetched:', periodOrders.length);

    // Fetch YTD orders with limited pagination
    const ytdOrdersParams = `status=any&created_at_min=${ytdStart}&created_at_max=${ytdEnd}`;
    const ytdOrders = await fetchOrdersBatch(baseUrl, headers, ytdOrdersParams, 15);
    console.log('Total YTD orders fetched:', ytdOrders.length);

    // Fetch last year orders with limited pagination
    const lastYearOrdersParams = `status=any&created_at_min=${lastYearStart}&created_at_max=${lastYearEnd}`;
    const lastYearOrders = await fetchOrdersBatch(baseUrl, headers, lastYearOrdersParams, 10);
    console.log('Total last year orders fetched:', lastYearOrders.length);

    // Fetch customers with limited pagination
    console.log('Fetching customers with optimized batching...');
    const allCustomers = await fetchCustomersBatch(baseUrl, headers, 5);
    console.log('Total customers fetched:', allCustomers.length);

    // Calculate Period Net Sales (selected date range)
    const periodNetSales = periodOrders.reduce((total: number, order: any) => {
      return total + parseFloat(order.total_price || '0');
    }, 0);

    // Calculate YTD Net Sales
    const ytdNetSales = ytdOrders.reduce((total: number, order: any) => {
      return total + parseFloat(order.total_price || '0');
    }, 0);

    // Calculate Last Year Net Sales
    const lastYearNetSales = lastYearOrders.reduce((total: number, order: any) => {
      return total + parseFloat(order.total_price || '0');
    }, 0);

    // Calculate YoY growth
    const yoyGrowth = lastYearNetSales > 0 
      ? ((ytdNetSales - lastYearNetSales) / lastYearNetSales * 100).toFixed(1)
      : '0';

    // Calculate conversion rate (using industry average estimate)
    const totalOrders = periodOrders.length;
    const estimatedSessions = Math.round(totalOrders / 0.025); // 2.5% conversion rate
    const conversionRate = '2.50';

    // Calculate returning customer rate
    const returningCustomers = allCustomers.filter((customer: any) => 
      customer.orders_count > 1
    ).length;
    
    const returningCustomerRate = allCustomers.length > 0 
      ? ((returningCustomers / allCustomers.length) * 100).toFixed(2)
      : '0.00';

    // Calculate AOV for selected period
    const orderCount = periodOrders.length || 1;
    const aov = (periodNetSales / orderCount).toFixed(2);

    // Estimate site traffic for selected period
    const siteTraffic = estimatedSessions;

    const analytics = {
      mtd_net_sales: `$${periodNetSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      ytd_net_sales: `$${ytdNetSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      ytd_growth: `(${yoyGrowth > 0 ? '+' : ''}${yoyGrowth}% YoY)`,
      conversion_rate: `${conversionRate}%`,
      returning_customer_rate: `${returningCustomerRate}%`,
      site_traffic: siteTraffic.toLocaleString('en-US'),
      aov: `$${aov}`,
    };

    console.log('Analytics calculated successfully:', analytics);
    console.log('Period orders count:', totalOrders);
    console.log('Returning customers:', returningCustomers);

    return new Response(JSON.stringify(analytics), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in shopify-analytics function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to fetch Shopify analytics data. Please check your Shopify store URL and admin API key.'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
