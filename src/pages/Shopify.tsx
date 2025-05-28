
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Store, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

type ShopifyClient = {
  id: string;
  user_id: string;
  client_name: string;
  shopify_url: string;
  admin_api_key: string;
  created_at: string;
  updated_at: string;
};

const Shopify = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ShopifyClient | null>(null);
  const [formData, setFormData] = useState({
    client_name: '',
    shopify_url: '',
    admin_api_key: '',
  });

  // Fetch Shopify clients
  const { data: clients, isLoading } = useQuery({
    queryKey: ['shopify-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopify_clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ShopifyClient[];
    },
    enabled: !!user,
  });

  // Create/Update client mutation
  const saveClientMutation = useMutation({
    mutationFn: async (clientData: typeof formData) => {
      if (!user) throw new Error('User not authenticated');

      if (editingClient) {
        const { data, error } = await supabase
          .from('shopify_clients')
          .update({
            ...clientData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingClient.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('shopify_clients')
          .insert({
            ...clientData,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopify-clients'] });
      setIsDialogOpen(false);
      setEditingClient(null);
      setFormData({ client_name: '', shopify_url: '', admin_api_key: '' });
      toast.success(editingClient ? 'Client updated successfully' : 'Client added successfully');
    },
    onError: (error) => {
      toast.error(`Failed to ${editingClient ? 'update' : 'add'} client: ${error.message}`);
    },
  });

  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from('shopify_clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopify-clients'] });
      toast.success('Client deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete client: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_name || !formData.shopify_url || !formData.admin_api_key) {
      toast.error('Please fill in all fields');
      return;
    }

    // Basic URL validation
    if (!formData.shopify_url.includes('.myshopify.com')) {
      toast.error('Please enter a valid Shopify URL (e.g., yourstore.myshopify.com)');
      return;
    }

    saveClientMutation.mutate(formData);
  };

  const handleEdit = (client: ShopifyClient) => {
    setEditingClient(client);
    setFormData({
      client_name: client.client_name,
      shopify_url: client.shopify_url,
      admin_api_key: client.admin_api_key,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (clientId: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      deleteClientMutation.mutate(clientId);
    }
  };

  const resetForm = () => {
    setFormData({ client_name: '', shopify_url: '', admin_api_key: '' });
    setEditingClient(null);
  };

  if (isLoading) {
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
          <h1 className="text-3xl font-bold text-gray-900">Shopify Clients</h1>
          <p className="text-gray-600 mt-2">Manage your Shopify store connections</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-crm-blue hover:bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingClient ? 'Edit' : 'Add'} Shopify Client</DialogTitle>
              <DialogDescription>
                {editingClient ? 'Update' : 'Add'} your Shopify store details to connect and manage analytics.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Client Name</Label>
                  <Input
                    id="client_name"
                    placeholder="My Store"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shopify_url">Shopify URL</Label>
                  <Input
                    id="shopify_url"
                    placeholder="yourstore.myshopify.com"
                    value={formData.shopify_url}
                    onChange={(e) => setFormData({ ...formData, shopify_url: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin_api_key">Admin API Key</Label>
                  <Input
                    id="admin_api_key"
                    type="password"
                    placeholder="Enter your Shopify Admin API key"
                    value={formData.admin_api_key}
                    onChange={(e) => setFormData({ ...formData, admin_api_key: e.target.value })}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-crm-blue hover:bg-blue-600"
                  disabled={saveClientMutation.isPending}
                >
                  {saveClientMutation.isPending ? 'Saving...' : editingClient ? 'Update' : 'Add'} Client
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {clients && clients.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Store className="w-5 h-5 text-crm-blue" />
                    <CardTitle className="text-lg">{client.client_name}</CardTitle>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(client)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(client.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <ExternalLink className="w-4 h-4" />
                  <a
                    href={`https://${client.shopify_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-crm-blue transition-colors truncate"
                  >
                    {client.shopify_url}
                  </a>
                </div>
                <p className="text-xs text-gray-500">
                  Added {new Date(client.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <CardTitle className="text-xl mb-2">No Shopify Clients</CardTitle>
            <CardDescription className="mb-4">
              Add your first Shopify store to start managing analytics and data.
            </CardDescription>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-crm-blue hover:bg-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Client
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Shopify;
