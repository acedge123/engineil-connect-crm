
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchAllOrders(baseUrl: string, headers: any, params: string) {
  let allOrders: any[] = [];
  let nextPageInfo: string | null = null;
  
  do {
    const url = nextPageInfo 
      ? `${baseUrl}/admin/api/2023-10/orders.json?${params}&page_info=${nextPageInfo}`
      : `${baseUrl}/admin/api/2023-10/orders.json?${params}`;
    
    console.log('Fetching orders from:', url);
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch orders: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    allOrders = allOrders.concat(data.orders || []);
    
    // Check for pagination using Link header
    const linkHeader = response.headers.get('Link');
    nextPageInfo = null;
    
    if (linkHeader) {
      const nextMatch = linkHeader.match(/<[^>]*page_info=([^&>]+)[^>]*>; rel="next"/);
      if (nextMatch) {
        nextPageInfo = nextMatch[1];
      }
    }
    
    console.log(`Fetched ${data.orders?.length || 0} orders, total so far: ${allOrders.length}`);
    
  } while (nextPageInfo && allOrders.length < 10000); // Safety limit
  
  return allOrders;
}

async function fetchAllCustomers(baseUrl: string, headers: any) {
  let allCustomers: any[] = [];
  let nextPageInfo: string | null = null;
  
  do {
    const url = nextPageInfo 
      ? `${baseUrl}/admin/api/2023-10/customers.json?limit=250&page_info=${nextPageInfo}`
      : `${baseUrl}/admin/api/2023-10/customers.json?limit=250`;
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      console.error('Failed to fetch customers:', response.status);
      break;
    }
    
    const data = await response.json();
    allCustomers = allCustomers.concat(data.customers || []);
    
    // Check for pagination using Link header
    const linkHeader = response.headers.get('Link');
    nextPageInfo = null;
    
    if (linkHeader) {
      const nextMatch = linkHeader.match(/<[^>]*page_info=([^&>]+)[^>]*>; rel="next"/);
      if (nextMatch) {
        nextPageInfo = nextMatch[1];
      }
    }
    
    console.log(`Fetched ${data.customers?.length || 0} customers, total so far: ${allCustomers.length}`);
    
  } while (nextPageInfo && allCustomers.length < 50000); // Safety limit
  
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

    // Ensure URL format is correct - remove any protocol and add https://
    let baseUrl = shopify_url.replace(/^https?:\/\//, '');
    baseUrl = `https://${baseUrl}`;
    
    // Ensure it ends with .myshopify.com if not already
    if (!baseUrl.includes('.myshopify.com')) {
      baseUrl = baseUrl.replace(/\/$/, '') + '.myshopify.com';
    }

    console.log('Final base URL:', baseUrl);

    // Use provided date range or default to current year
    const startDate = date_from ? new Date(date_from) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = date_to ? new Date(date_to) : new Date();

    // Get current date information for MTD and YTD calculations
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
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
    const lastYearEnd = new Date(lastYear, currentMonth - 1, now.getDate()).toISOString();

    const headers = {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    };

    // Test API connection first with a simple request
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

    console.log('API connection successful, fetching all orders...');

    // Fetch ALL orders for selected period with pagination
    const periodOrdersParams = `status=any&created_at_min=${periodStart}&created_at_max=${periodEnd}&limit=250`;
    const periodOrders = await fetchAllOrders(baseUrl, headers, periodOrdersParams);
    
    console.log('Total period orders fetched:', periodOrders.length);

    // Fetch ALL orders for YTD with pagination
    const ytdOrdersParams = `status=any&created_at_min=${ytdStart}&created_at_max=${ytdEnd}&limit=250`;
    const ytdOrders = await fetchAllOrders(baseUrl, headers, ytdOrdersParams);

    // Fetch ALL orders for last year (for YoY comparison) with pagination
    const lastYearOrdersParams = `status=any&created_at_min=${lastYearStart}&created_at_max=${lastYearEnd}&limit=250`;
    const lastYearOrders = await fetchAllOrders(baseUrl, headers, lastYearOrdersParams);

    // Fetch ALL customers for returning customer analysis with pagination
    console.log('Fetching all customers...');
    const allCustomers = await fetchAllCustomers(baseUrl, headers);
    console.log('Total customers fetched:', allCustomers.length);

    // Calculate Period Net Sales (selected date range)
    const periodNetSales = periodOrders.reduce((total: number, order: any) => {
      return total + parseFloat(order.total_price || '0');
    }, 0);

    // Calculate YTD Net Sales
    const ytdNetSales = ytdOrders.reduce((total: number, order: any) => {
      return total + parseFloat(order.total_price || '0');
    }, 0);

    // Calculate Last Year Net Sales for same period
    const lastYearNetSales = lastYearOrders.reduce((total: number, order: any) => {
      return total + parseFloat(order.total_price || '0');
    }, 0);

    // Calculate YoY growth
    const yoyGrowth = lastYearNetSales > 0 
      ? ((ytdNetSales - lastYearNetSales) / lastYearNetSales * 100).toFixed(1)
      : '0';

    // Calculate conversion rate for selected period (using a more realistic estimate)
    const totalOrders = periodOrders.length;
    // Using industry average conversion rate of 2-3% to estimate sessions
    const estimatedSessions = Math.round(totalOrders / 0.025); // Assuming 2.5% conversion rate
    const conversionRate = '2.50'; // This is an estimate - Shopify doesn't provide session data via Admin API

    // Calculate returning customer rate based on customers who have multiple orders
    const customerOrderCounts = new Map();
    
    // Count orders per customer for the period
    periodOrders.forEach((order: any) => {
      if (order.customer && order.customer.id) {
        const customerId = order.customer.id;
        customerOrderCounts.set(customerId, (customerOrderCounts.get(customerId) || 0) + 1);
      }
    });

    // Also check historical order counts for customers
    const returningCustomers = allCustomers.filter((customer: any) => 
      customer.orders_count > 1
    ).length;
    
    const uniqueCustomersInPeriod = customerOrderCounts.size;
    const returningCustomerRate = uniqueCustomersInPeriod > 0 
      ? ((returningCustomers / allCustomers.length) * 100).toFixed(2)
      : '0.00';

    // Calculate AOV for selected period
    const orderCount = periodOrders.length || 1;
    const aov = (periodNetSales / orderCount).toFixed(2);

    // Estimate site traffic for selected period (based on conversion rate)
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
    console.log('Unique customers in period:', uniqueCustomersInPeriod);
    console.log('Total customers with multiple orders:', returningCustomers);

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
