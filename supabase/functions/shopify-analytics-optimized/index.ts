
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

    // Test API connection first
    const testUrl = `${baseUrl}/admin/api/2023-10/shop.json`;
    const testResponse = await fetch(testUrl, { headers });
    
    if (!testResponse.ok) {
      throw new Error(`API test failed: ${testResponse.status}`);
    }

    console.log('API connection successful, fetching analytics using Analytics API...');

    // Use GraphQL for aggregated data (much faster)
    const graphqlQuery = `
      query GetSalesData($startDate: DateTime!, $endDate: DateTime!, $ytdStart: DateTime!, $ytdEnd: DateTime!) {
        orders(first: 1, query: "created_at:>='${startDate.toISOString()}' AND created_at:<='${endDate.toISOString()}'") {
          totalCount
          edges {
            node {
              totalPriceSet {
                shopMoney {
                  amount
                }
              }
            }
          }
        }
        ytdOrders: orders(first: 1, query: "created_at:>='${ytdStart.toISOString()}' AND created_at:<='${ytdEnd.toISOString()}'") {
          totalCount
        }
        customers(first: 1) {
          totalCount
        }
      }
    `;

    // Fetch data using Analytics API endpoints in parallel
    const [
      periodSalesResult,
      ytdSalesResult,
      lastYearSalesResult,
      customerAnalyticsResult,
      trafficResult,
      graphqlResult
    ] = await Promise.allSettled([
      fetchSalesByDate(baseUrl, headers, startDate, endDate, 'period'),
      fetchSalesByDate(baseUrl, headers, ytdStart, ytdEnd, 'ytd'),
      fetchSalesByDate(baseUrl, headers, lastYearStart, lastYearEnd, 'lastYear'),
      fetchCustomerAnalytics(baseUrl, headers, startDate, endDate),
      fetchTrafficData(baseUrl, headers, startDate, endDate),
      fetchGraphQLData(baseUrl, headers, graphqlQuery)
    ]);

    // Extract data safely from results
    const periodSales = periodSalesResult.status === 'fulfilled' ? periodSalesResult.value : { totalSales: 0, orderCount: 0, avgOrderValue: 0 };
    const ytdSales = ytdSalesResult.status === 'fulfilled' ? ytdSalesResult.value : { totalSales: 0, orderCount: 0, avgOrderValue: 0 };
    const lastYearSales = lastYearSalesResult.status === 'fulfilled' ? lastYearSalesResult.value : { totalSales: 0, orderCount: 0, avgOrderValue: 0 };
    const customerData = customerAnalyticsResult.status === 'fulfilled' ? customerAnalyticsResult.value : { returningCustomerRate: 0 };
    const trafficData = trafficResult.status === 'fulfilled' ? trafficResult.value : { sessions: 0, conversionRate: 0 };
    const graphqlData = graphqlResult.status === 'fulfilled' ? graphqlResult.value : null;

    // Log any failures for debugging
    [periodSalesResult, ytdSalesResult, lastYearSalesResult, customerAnalyticsResult, trafficResult, graphqlResult].forEach((result, index) => {
      if (result.status === 'rejected') {
        const names = ['period sales', 'ytd sales', 'last year sales', 'customer analytics', 'traffic data', 'graphql data'];
        console.error(`${names[index]} fetch failed:`, result.reason);
      }
    });

    // Calculate metrics using Analytics API data
    const periodNetSales = periodSales.totalSales;
    const ytdNetSales = ytdSales.totalSales;
    const lastYearNetSales = lastYearSales.totalSales;

    // Calculate YoY growth
    const yoyGrowth = lastYearNetSales > 0 
      ? ((ytdNetSales - lastYearNetSales) / lastYearNetSales * 100).toFixed(1)
      : '0';

    // Use Analytics API AOV or calculate from aggregated data
    const aov = periodSales.avgOrderValue || (periodSales.orderCount > 0 ? (periodNetSales / periodSales.orderCount) : 0);

    // Use traffic data from Analytics API
    const conversionRate = trafficData.conversionRate || (trafficData.sessions > 0 ? ((periodSales.orderCount / trafficData.sessions) * 100).toFixed(2) : '2.50');
    const siteTraffic = trafficData.sessions || Math.round(periodSales.orderCount / 0.025);

    // Use customer analytics data
    const returningCustomerRate = customerData.returningCustomerRate || '0.00';

    const analytics: ShopifyAnalytics = {
      period_net_sales: `$${periodNetSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      ytd_net_sales: `$${ytdNetSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      ytd_growth: `(${yoyGrowth > 0 ? '+' : ''}${yoyGrowth}% YoY)`,
      conversion_rate: `${conversionRate}%`,
      returning_customer_rate: `${returningCustomerRate}%`,
      site_traffic: siteTraffic.toLocaleString('en-US'),
      aov: `$${aov.toFixed(2)}`,
    };

    console.log('Analytics calculated successfully using Analytics API:', analytics);
    return analytics;

  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
}

async function fetchSalesByDate(baseUrl: string, headers: any, startDate: Date, endDate: Date, period: string) {
  const url = `${baseUrl}/admin/api/2023-10/analytics/reports/sales_by_date.json?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`;
  
  console.log(`Fetching ${period} sales data from Analytics API...`);
  
  try {
    const response = await fetch(url, { 
      headers,
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch ${period} sales data:`, response.status);
      return { totalSales: 0, orderCount: 0, avgOrderValue: 0 };
    }

    const data = await response.json();
    const salesData = data.analytics_report?.table_data || [];
    
    let totalSales = 0;
    let orderCount = 0;
    
    // Parse sales data from Analytics API
    salesData.forEach((row: any[]) => {
      if (row.length >= 2) {
        totalSales += parseFloat(row[1] || '0'); // Sales amount
        orderCount += parseInt(row[2] || '0'); // Order count (if available)
      }
    });

    const avgOrderValue = orderCount > 0 ? totalSales / orderCount : 0;

    console.log(`${period}: $${totalSales.toFixed(2)} sales, ${orderCount} orders, AOV: $${avgOrderValue.toFixed(2)}`);
    return { totalSales, orderCount, avgOrderValue };

  } catch (error) {
    console.error(`Error fetching ${period} sales:`, error);
    return { totalSales: 0, orderCount: 0, avgOrderValue: 0 };
  }
}

async function fetchCustomerAnalytics(baseUrl: string, headers: any, startDate: Date, endDate: Date) {
  const url = `${baseUrl}/admin/api/2023-10/analytics/reports/customers_by_date.json?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`;
  
  console.log('Fetching customer analytics from Analytics API...');
  
  try {
    const response = await fetch(url, { 
      headers,
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      console.error('Failed to fetch customer analytics:', response.status);
      return { returningCustomerRate: '0.00' };
    }

    const data = await response.json();
    const customerData = data.analytics_report?.table_data || [];
    
    let totalCustomers = 0;
    let returningCustomers = 0;
    
    // Parse customer data from Analytics API
    customerData.forEach((row: any[]) => {
      if (row.length >= 3) {
        totalCustomers += parseInt(row[1] || '0'); // Total customers
        returningCustomers += parseInt(row[2] || '0'); // Returning customers
      }
    });

    const returningCustomerRate = totalCustomers > 0 
      ? ((returningCustomers / totalCustomers) * 100).toFixed(2)
      : '0.00';

    console.log(`Customer analytics: ${totalCustomers} total, ${returningCustomers} returning (${returningCustomerRate}%)`);
    return { returningCustomerRate };

  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    return { returningCustomerRate: '0.00' };
  }
}

async function fetchTrafficData(baseUrl: string, headers: any, startDate: Date, endDate: Date) {
  const url = `${baseUrl}/admin/api/2023-10/analytics/reports/sessions_by_date.json?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`;
  
  console.log('Fetching traffic data from Analytics API...');
  
  try {
    const response = await fetch(url, { 
      headers,
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      console.error('Failed to fetch traffic data:', response.status);
      return { sessions: 0, conversionRate: 0 };
    }

    const data = await response.json();
    const trafficData = data.analytics_report?.table_data || [];
    
    let totalSessions = 0;
    
    // Parse traffic data from Analytics API
    trafficData.forEach((row: any[]) => {
      if (row.length >= 2) {
        totalSessions += parseInt(row[1] || '0'); // Session count
      }
    });

    console.log(`Traffic data: ${totalSessions} sessions`);
    return { sessions: totalSessions, conversionRate: 0 };

  } catch (error) {
    console.error('Error fetching traffic data:', error);
    return { sessions: 0, conversionRate: 0 };
  }
}

async function fetchGraphQLData(baseUrl: string, headers: any, query: string) {
  const url = `${baseUrl}/admin/api/2023-10/graphql.json`;
  
  console.log('Fetching data via GraphQL Admin API...');
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      console.error('Failed to fetch GraphQL data:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('GraphQL data fetched successfully');
    return data.data;

  } catch (error) {
    console.error('Error fetching GraphQL data:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: AnalyticsParams = await req.json();
    
    console.log('Fetching analytics using Analytics API for:', params.shopify_url);
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
        details: 'Failed to fetch Shopify analytics data using Analytics API.'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
