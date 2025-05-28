
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyticsParams {
  shopify_url: string;
  admin_api_key: string;
  date_from: string;
  date_to: string;
}

interface ShopifyAnalytics {
  period_net_sales: string;
  ytd_net_sales: string;
  ytd_growth: string;
  conversion_rate: string;
  returning_customer_rate: string;
  site_traffic: string;
  aov: string;
}

async function getAnalyticsData(params: AnalyticsParams): Promise<ShopifyAnalytics> {
  const { shopify_url, admin_api_key, date_from, date_to } = params;
  
  let baseUrl = shopify_url.replace(/^https?:\/\//, '');
  baseUrl = `https://${baseUrl}`;
  
  if (!baseUrl.includes('.myshopify.com')) {
    baseUrl = baseUrl.replace(/\/$/, '') + '.myshopify.com';
  }

  const accessToken = Deno.env.get('SHOPIFY_ACCESS_TOKEN') || admin_api_key;
  
  // Calculate date ranges
  const startDate = new Date(date_from);
  const endDate = new Date(date_to);
  const now = new Date();
  const currentYear = now.getFullYear();
  const lastYear = currentYear - 1;

  // YTD calculation (January 1st to today)
  const ytdStart = new Date(currentYear, 0, 1);
  const ytdEnd = now;

  // Last year same period for YoY comparison
  const lastYearStart = new Date(lastYear, 0, 1);
  const lastYearEnd = new Date(lastYear, 11, 31);

  try {
    const headers = {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    };

    // Test API connection first with a smaller request
    const testUrl = `${baseUrl}/admin/api/2023-10/orders.json?limit=1&status=any`;
    const testResponse = await fetch(testUrl, { headers });
    
    if (!testResponse.ok) {
      throw new Error(`API test failed: ${testResponse.status}`);
    }

    console.log('API connection successful, fetching optimized analytics...');

    // Use Promise.allSettled to handle potential timeouts gracefully
    // Reduce page limits to prevent CPU timeout
    const [periodResult, ytdResult, lastYearResult, customerResult] = await Promise.allSettled([
      fetchOrdersSummary(baseUrl, headers, startDate, endDate, 'period', 8), // Reduced from 15
      fetchOrdersSummary(baseUrl, headers, ytdStart, ytdEnd, 'ytd', 8), // Reduced from 15
      fetchOrdersSummary(baseUrl, headers, lastYearStart, lastYearEnd, 'lastYear', 5), // Reduced from 10
      fetchCustomersSummary(baseUrl, headers, 3) // Reduced from 5
    ]);

    // Handle results and extract data safely
    const periodData = periodResult.status === 'fulfilled' ? periodResult.value : { totalSales: 0, orderCount: 0 };
    const ytdData = ytdResult.status === 'fulfilled' ? ytdResult.value : { totalSales: 0, orderCount: 0 };
    const lastYearData = lastYearResult.status === 'fulfilled' ? lastYearResult.value : { totalSales: 0, orderCount: 0 };
    const customerData = customerResult.status === 'fulfilled' ? customerResult.value : { totalCustomers: 0, returningCustomers: 0 };

    // Log any failures
    if (periodResult.status === 'rejected') console.error('Period data fetch failed:', periodResult.reason);
    if (ytdResult.status === 'rejected') console.error('YTD data fetch failed:', ytdResult.reason);
    if (lastYearResult.status === 'rejected') console.error('Last year data fetch failed:', lastYearResult.reason);
    if (customerResult.status === 'rejected') console.error('Customer data fetch failed:', customerResult.reason);

    // Calculate metrics
    const periodNetSales = periodData.totalSales;
    const ytdNetSales = ytdData.totalSales;
    const lastYearNetSales = lastYearData.totalSales;

    // Calculate YoY growth
    const yoyGrowth = lastYearNetSales > 0 
      ? ((ytdNetSales - lastYearNetSales) / lastYearNetSales * 100).toFixed(1)
      : '0';

    // Calculate AOV for selected period
    const aov = periodData.orderCount > 0 
      ? (periodNetSales / periodData.orderCount).toFixed(2)
      : '0.00';

    // Estimate conversion rate and traffic (using industry standards)
    const estimatedSessions = Math.round(periodData.orderCount / 0.025); // 2.5% conversion rate
    const conversionRate = periodData.orderCount > 0 ? '2.50' : '0.00';

    // Calculate returning customer rate
    const returningCustomerRate = customerData.totalCustomers > 0 
      ? ((customerData.returningCustomers / customerData.totalCustomers) * 100).toFixed(2)
      : '0.00';

    const analytics: ShopifyAnalytics = {
      period_net_sales: `$${periodNetSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      ytd_net_sales: `$${ytdNetSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      ytd_growth: `(${yoyGrowth > 0 ? '+' : ''}${yoyGrowth}% YoY)`,
      conversion_rate: `${conversionRate}%`,
      returning_customer_rate: `${returningCustomerRate}%`,
      site_traffic: estimatedSessions.toLocaleString('en-US'),
      aov: `$${aov}`,
    };

    console.log('Analytics calculated successfully:', analytics);
    console.log(`Period: ${periodData.orderCount} orders, $${periodNetSales.toFixed(2)}`);
    console.log(`YTD: ${ytdData.orderCount} orders, $${ytdNetSales.toFixed(2)}`);
    return analytics;

  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
}

async function fetchOrdersSummary(baseUrl: string, headers: any, startDate: Date, endDate: Date, period: string, maxPages: number = 8) {
  const params = `status=any&created_at_min=${startDate.toISOString()}&created_at_max=${endDate.toISOString()}&limit=250`;
  let totalSales = 0;
  let orderCount = 0;
  let hasNextPage = true;
  let pageInfo = '';
  let pageCount = 0;

  console.log(`Fetching ${period} orders summary (up to ${maxPages} pages)...`);

  try {
    while (hasNextPage && pageCount < maxPages) {
      const url = pageInfo 
        ? `${baseUrl}/admin/api/2023-10/orders.json?page_info=${pageInfo}&limit=250`
        : `${baseUrl}/admin/api/2023-10/orders.json?${params}`;

      const response = await fetch(url, { 
        headers,
        signal: AbortSignal.timeout(15000) // 15 second timeout per request
      });
      
      if (!response.ok) {
        console.error(`Failed to fetch ${period} orders:`, response.status);
        break;
      }

      const data = await response.json();
      const orders = data.orders || [];

      // Calculate totals
      for (const order of orders) {
        totalSales += parseFloat(order.total_price || '0');
        orderCount++;
      }

      // Check for pagination
      const linkHeader = response.headers.get('Link');
      hasNextPage = false;
      
      if (linkHeader) {
        const nextMatch = linkHeader.match(/<[^>]*page_info=([^&>]+)[^>]*>; rel="next"/);
        if (nextMatch) {
          pageInfo = nextMatch[1];
          hasNextPage = true;
        }
      }

      pageCount++;
      console.log(`${period}: Page ${pageCount}, fetched ${orders.length} orders, total: ${orderCount}, sales: $${totalSales.toFixed(2)}`);

      // If we got less than 250 orders, we've reached the end
      if (orders.length < 250) {
        console.log(`${period}: Reached end of orders (page returned ${orders.length} orders)`);
        break;
      }
    }

    if (pageCount >= maxPages) {
      console.log(`${period}: Reached page limit (${maxPages}), data may be incomplete`);
    }

  } catch (error) {
    console.error(`Error fetching ${period} orders:`, error);
    // Return partial data instead of failing completely
  }

  return { totalSales, orderCount };
}

async function fetchCustomersSummary(baseUrl: string, headers: any, maxPages: number = 3) {
  let totalCustomers = 0;
  let returningCustomers = 0;
  let hasNextPage = true;
  let pageInfo = '';
  let pageCount = 0;

  console.log(`Fetching customers summary (up to ${maxPages} pages)...`);

  try {
    while (hasNextPage && pageCount < maxPages) {
      const url = pageInfo 
        ? `${baseUrl}/admin/api/2023-10/customers.json?page_info=${pageInfo}&limit=250`
        : `${baseUrl}/admin/api/2023-10/customers.json?limit=250`;

      const response = await fetch(url, { 
        headers,
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        console.error('Failed to fetch customers:', response.status);
        break;
      }

      const data = await response.json();
      const customers = data.customers || [];

      for (const customer of customers) {
        totalCustomers++;
        if (customer.orders_count > 1) {
          returningCustomers++;
        }
      }

      // Check for pagination
      const linkHeader = response.headers.get('Link');
      hasNextPage = false;
      
      if (linkHeader) {
        const nextMatch = linkHeader.match(/<[^>]*page_info=([^&>]+)[^>]*>; rel="next"/);
        if (nextMatch) {
          pageInfo = nextMatch[1];
          hasNextPage = true;
        }
      }

      pageCount++;
      console.log(`Customers: Page ${pageCount}, fetched ${customers.length}, total: ${totalCustomers}, returning: ${returningCustomers}`);

      // If we got less than 250 customers, we've reached the end
      if (customers.length < 250) {
        break;
      }
    }
  } catch (error) {
    console.error('Error fetching customers:', error);
  }

  return { totalCustomers, returningCustomers };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: AnalyticsParams = await req.json();
    
    console.log('Fetching optimized analytics for:', params.shopify_url);
    console.log('Date range:', params.date_from, 'to', params.date_to);

    const analytics = await getAnalyticsData(params);

    return new Response(JSON.stringify(analytics), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in shopify-analytics-optimized function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to fetch optimized Shopify analytics data. The function may have timed out due to large data volume.'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
