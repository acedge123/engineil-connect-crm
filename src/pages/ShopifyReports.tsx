import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { BarChart3, TrendingUp, Users, Eye, DollarSign, ShoppingCart } from 'lucide-react';
import { DateRange } from "react-day-picker";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePickerWithPresets } from '@/components/DateRangePickerWithPresets';
import { toast } from 'sonner';

type ShopifyClient = {
  id: string;
  client_name: string;
  shopify_url: string;
  admin_api_key: string;
};

type ShopifyAnalytics = {
  mtd_net_sales: string;
  ytd_net_sales: string;
  ytd_growth: string;
  conversion_rate: string;
  returning_customer_rate: string;
  site_traffic: string;
  aov: string;
};

const ShopifyReports = () => {
  const { user } = useAuth();
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [analytics, setAnalytics] = useState<ShopifyAnalytics | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 1), // Start of current year
    to: new Date(), // Today
  });

  // Fetch Shopify clients
  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ['shopify-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopify_clients')
        .select('*')
        .order('client_name', { ascending: true });

      if (error) throw error;
      return data as ShopifyClient[];
    },
    enabled: !!user,
  });

  // Fetch analytics mutation with date range support
  const fetchAnalyticsMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const client = clients?.find(c => c.id === clientId);
      if (!client) throw new Error('Client not found');

      const { data, error } = await supabase.functions.invoke('shopify-analytics', {
        body: {
          shopify_url: client.shopify_url,
          admin_api_key: client.admin_api_key,
          date_from: dateRange?.from?.toISOString(),
          date_to: dateRange?.to?.toISOString(),
        },
      });

      if (error) throw error;
      return data as ShopifyAnalytics;
    },
    onSuccess: (data) => {
      setAnalytics(data);
      toast.success('Analytics data retrieved successfully');
    },
    onError: (error) => {
      toast.error(`Failed to fetch analytics: ${error.message}`);
    },
  });

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    setAnalytics(null);
  };

  const handleFetchAnalytics = () => {
    if (selectedClientId && dateRange?.from && dateRange?.to) {
      fetchAnalyticsMutation.mutate(selectedClientId);
    } else {
      toast.error('Please select a client and date range');
    }
  };

  if (clientsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-crm-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shopify Reports</h1>
          <p className="text-gray-600 mt-2">View analytics and performance metrics for your Shopify stores</p>
        </div>
      </div>

      {/* Client Selection and Date Range */}
      <Card>
        <CardHeader>
          <CardTitle>Select Client and Date Range</CardTitle>
          <CardDescription>Choose a client and date range to view their analytics data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Shopify Client</label>
              <Select value={selectedClientId} onValueChange={handleClientSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a Shopify client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.client_name} ({client.shopify_url})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Date Range</label>
              <DateRangePickerWithPresets
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>
          </div>
          
          <Button
            onClick={handleFetchAnalytics}
            disabled={!selectedClientId || !dateRange?.from || !dateRange?.to || fetchAnalyticsMutation.isPending}
            className="bg-crm-blue hover:bg-blue-600"
          >
            {fetchAnalyticsMutation.isPending ? 'Loading...' : 'Fetch Analytics'}
          </Button>
          
          {!clients || clients.length === 0 && (
            <p className="text-gray-500 text-sm">
              No Shopify clients found. Please add clients in the Shopify Clients tab first.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Analytics Display */}
      {analytics && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{analytics.mtd_net_sales}</div>
              <p className="text-xs text-muted-foreground">For selected period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">YTD Net Sales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{analytics.ytd_net_sales}</div>
              <p className="text-xs text-green-600 mt-1">{analytics.ytd_growth}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">E-comm Conversion Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{analytics.conversion_rate}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Returning Customer Rate</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{analytics.returning_customer_rate}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Site Traffic</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{analytics.site_traffic}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Order Value (AOV)</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">{analytics.aov}</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ShopifyReports;
