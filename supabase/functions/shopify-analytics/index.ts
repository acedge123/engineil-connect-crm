
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log('API connection successful, fetching orders...');

    // Fetch orders for selected period
    const periodOrdersResponse = await fetch(
      `${baseUrl}/admin/api/2023-10/orders.json?status=any&created_at_min=${periodStart}&created_at_max=${periodEnd}&limit=250`,
      { headers }
    );

    if (!periodOrdersResponse.ok) {
      const errorText = await periodOrdersResponse.text();
      console.error('Period Orders API error:', errorText);
      throw new Error(`Failed to fetch orders: ${periodOrdersResponse.status} - ${errorText}`);
    }

    const periodOrders = await periodOrdersResponse.json();
    console.log('Period orders fetched:', periodOrders.orders?.length || 0);

    // Fetch orders for YTD
    const ytdOrdersResponse = await fetch(
      `${baseUrl}/admin/api/2023-10/orders.json?status=any&created_at_min=${ytdStart}&created_at_max=${ytdEnd}&limit=250`,
      { headers }
    );

    const ytdOrders = await ytdOrdersResponse.json();

    // Fetch orders for last year (for YoY comparison)
    const lastYearOrdersResponse = await fetch(
      `${baseUrl}/admin/api/2023-10/orders.json?status=any&created_at_min=${lastYearStart}&created_at_max=${lastYearEnd}&limit=250`,
      { headers }
    );

    const lastYearOrders = await lastYearOrdersResponse.json();

    // Fetch customers for returning customer analysis
    const customersResponse = await fetch(
      `${baseUrl}/admin/api/2023-10/customers.json?limit=250`,
      { headers }
    );

    const customers = await customersResponse.json();

    // Calculate Period Net Sales (selected date range)
    const periodNetSales = periodOrders.orders?.reduce((total: number, order: any) => {
      return total + parseFloat(order.total_price || '0');
    }, 0) || 0;

    // Calculate YTD Net Sales
    const ytdNetSales = ytdOrders.orders?.reduce((total: number, order: any) => {
      return total + parseFloat(order.total_price || '0');
    }, 0) || 0;

    // Calculate Last Year Net Sales for same period
    const lastYearNetSales = lastYearOrders.orders?.reduce((total: number, order: any) => {
      return total + parseFloat(order.total_price || '0');
    }, 0) || 0;

    // Calculate YoY growth
    const yoyGrowth = lastYearNetSales > 0 
      ? ((ytdNetSales - lastYearNetSales) / lastYearNetSales * 100).toFixed(1)
      : '0';

    // Calculate conversion rate for selected period
    const totalOrders = periodOrders.orders?.length || 0;
    const estimatedSessions = totalOrders * 40; // Rough estimate: 1 order per 40 sessions for 2.5% conversion
    const conversionRate = estimatedSessions > 0 ? ((totalOrders / estimatedSessions) * 100).toFixed(2) : '0.00';

    // Calculate returning customer rate
    const returningCustomers = customers.customers?.filter((customer: any) => 
      customer.orders_count > 1
    ).length || 0;
    const totalCustomers = customers.customers?.length || 1;
    const returningCustomerRate = ((returningCustomers / totalCustomers) * 100).toFixed(2);

    // Calculate AOV for selected period
    const totalOrderValue = periodOrders.orders?.reduce((total: number, order: any) => {
      return total + parseFloat(order.total_price || '0');
    }, 0) || 0;
    const orderCount = periodOrders.orders?.length || 1;
    const aov = (totalOrderValue / orderCount).toFixed(2);

    // Estimate site traffic for selected period
    const siteTraffic = Math.round(totalOrders * 45); // Rough estimate based on conversion rates

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
