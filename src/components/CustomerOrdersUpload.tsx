
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ClientSelector from './ClientSelector';
import CustomerOrderUploadDialog from './CustomerOrderUploadDialog';

type ShopifyClient = {
  id: string;
  client_name: string;
  shopify_url: string;
};

const CustomerOrdersUpload = () => {
  const { user } = useAuth();
  const [selectedShopifyClient, setSelectedShopifyClient] = useState<string>('default');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  // Fetch Shopify clients
  const shopifyClientsQuery = useQuery({
    queryKey: ['shopify-clients'],
    queryFn: async (): Promise<ShopifyClient[]> => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('shopify_clients')
        .select('id, client_name, shopify_url')
        .eq('user_id', user.id)
        .order('client_name');

      if (error) throw error;
      return data as ShopifyClient[];
    },
    enabled: !!user,
  });

  const shopifyClients = shopifyClientsQuery.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Customer Data Upload
        </CardTitle>
        <CardDescription>
          Upload Shopify customer data from CSV files to analyze influencer spending patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ClientSelector
          selectedShopifyClient={selectedShopifyClient}
          onValueChange={setSelectedShopifyClient}
          shopifyClients={shopifyClients}
        />

        <CustomerOrderUploadDialog
          selectedShopifyClient={selectedShopifyClient}
          isOpen={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
        />
      </CardContent>
    </Card>
  );
};

export default CustomerOrdersUpload;
