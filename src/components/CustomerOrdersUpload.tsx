
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ClientSelector from './ClientSelector';
import CustomerOrderUploadDialog from './CustomerOrderUploadDialog';
import InfluencerCustomerLinkDialog from './InfluencerCustomerLinkDialog';
import InfluencerSpendingTable from './InfluencerSpendingTable';
import { useInfluencerSpendingAnalysis } from '@/hooks/useInfluencerSpendingAnalysis';

type ShopifyClient = {
  id: string;
  client_name: string;
  shopify_url: string;
};

const CustomerOrdersUpload = () => {
  const { user } = useAuth();
  const [selectedShopifyClient, setSelectedShopifyClient] = useState<string>('default');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const { analysis, deleteLink, isDeleting } = useInfluencerSpendingAnalysis(selectedShopifyClient);

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Customer Data Management
          </CardTitle>
          <CardDescription>
            Upload Shopify customer data and create influencer-customer connections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ClientSelector
            selectedShopifyClient={selectedShopifyClient}
            onValueChange={setSelectedShopifyClient}
            shopifyClients={shopifyClients}
          />

          <div className="flex gap-2">
            <CustomerOrderUploadDialog
              selectedShopifyClient={selectedShopifyClient}
              isOpen={isUploadDialogOpen}
              onOpenChange={setIsUploadDialogOpen}
            />
            
            <InfluencerCustomerLinkDialog 
              selectedShopifyClient={selectedShopifyClient}
            />
          </div>
        </CardContent>
      </Card>

      <InfluencerSpendingTable
        analysis={analysis || []}
        onDeleteLink={deleteLink}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default CustomerOrdersUpload;
