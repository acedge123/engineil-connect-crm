
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useInfluencerSpendingAnalysis } from '@/hooks/useInfluencerSpendingAnalysis';

interface InfluencerCustomerLinkDialogProps {
  selectedShopifyClient: string;
}

type Influencer = {
  id: string;
  name: string | null;
  email: string;
  instagram_handle: string | null;
};

type CustomerOrder = {
  id: string;
  order_id: string;
  customer_email: string;
  customer_name: string | null;
  order_total: number;
  order_date: string;
};

const InfluencerCustomerLinkDialog: React.FC<InfluencerCustomerLinkDialogProps> = ({ 
  selectedShopifyClient 
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<string>('');
  const [selectedCustomerOrder, setSelectedCustomerOrder] = useState<string>('');
  
  const { createLink, isCreating } = useInfluencerSpendingAnalysis(selectedShopifyClient);

  // Fetch influencers
  const influencersQuery = useQuery<Influencer[]>({
    queryKey: ['influencers-for-linking'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('influencers')
        .select('id, name, email, instagram_handle')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Influencer[];
    },
    enabled: !!user && isOpen,
  });

  // Fetch customer orders
  const customerOrdersQuery = useQuery<CustomerOrder[]>({
    queryKey: ['customer-orders-for-linking', selectedShopifyClient],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      let query = supabase
        .from('customer_orders')
        .select('id, order_id, customer_email, customer_name, order_total, order_date')
        .eq('user_id', user.id)
        .order('order_date', { ascending: false })
        .limit(100);

      if (selectedShopifyClient && selectedShopifyClient !== 'default') {
        query = query.eq('shopify_client_id', selectedShopifyClient);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CustomerOrder[];
    },
    enabled: !!user && isOpen,
  });

  const handleCreateLink = () => {
    if (!selectedInfluencer || !selectedCustomerOrder) {
      return;
    }

    createLink({
      influencerId: selectedInfluencer,
      customerOrderId: selectedCustomerOrder,
      shopifyClientId: selectedShopifyClient !== 'default' ? selectedShopifyClient : undefined,
    });

    setSelectedInfluencer('');
    setSelectedCustomerOrder('');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Link className="w-4 h-4" />
          Link Influencer to Customer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Link Influencer to Customer</DialogTitle>
          <DialogDescription>
            Create a connection between an influencer and a customer order to track spending patterns.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="influencer-select">Select Influencer</Label>
            <Select value={selectedInfluencer} onValueChange={setSelectedInfluencer}>
              <SelectTrigger id="influencer-select">
                <SelectValue placeholder="Choose an influencer..." />
              </SelectTrigger>
              <SelectContent>
                {influencersQuery.data?.map((influencer) => (
                  <SelectItem key={influencer.id} value={influencer.id}>
                    {influencer.name || influencer.email} 
                    {influencer.instagram_handle && ` (@${influencer.instagram_handle})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-order-select">Select Customer Order</Label>
            <Select value={selectedCustomerOrder} onValueChange={setSelectedCustomerOrder}>
              <SelectTrigger id="customer-order-select">
                <SelectValue placeholder="Choose a customer order..." />
              </SelectTrigger>
              <SelectContent>
                {customerOrdersQuery.data?.map((order) => (
                  <SelectItem key={order.id} value={order.id}>
                    {order.customer_name || order.customer_email} - ${order.order_total} 
                    ({new Date(order.order_date).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleCreateLink}
            disabled={!selectedInfluencer || !selectedCustomerOrder || isCreating}
            className="w-full"
          >
            {isCreating ? 'Creating Link...' : 'Create Link'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InfluencerCustomerLinkDialog;
