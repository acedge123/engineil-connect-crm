
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ShopifyClient = {
  id: string;
  client_name: string;
  shopify_url: string;
};

interface ClientSelectorProps {
  selectedShopifyClient: string;
  onValueChange: (value: string) => void;
  shopifyClients?: ShopifyClient[];
}

const ClientSelector: React.FC<ClientSelectorProps> = ({ 
  selectedShopifyClient, 
  onValueChange, 
  shopifyClients 
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="analysis-client">Shopify Client for Analysis</Label>
      <Select value={selectedShopifyClient} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a Shopify client or leave blank for default" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Default (No specific client)</SelectItem>
          {shopifyClients?.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              {client.client_name} ({client.shopify_url})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ClientSelector;
