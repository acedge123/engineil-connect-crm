
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import ClientSelector from './ClientSelector';

type CustomerOrderInsert = {
  user_id: string;
  customer_email: string;
  customer_name?: string;
  order_id: string;
  order_total: number;
  order_date: string;
  shopify_client_id?: string;
};

type ShopifyClient = {
  id: string;
  client_name: string;
  shopify_url: string;
};

const CustomerOrdersUpload = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [selectedShopifyClient, setSelectedShopifyClient] = useState<string>('default');

  // Fetch Shopify clients with explicit typing
  const shopifyClientsQuery = useQuery<ShopifyClient[]>({
    queryKey: ['shopify-clients'],
    queryFn: async () => {
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

  // CSV upload mutation with explicit typing to fix TypeScript error
  const uploadCsvMutation = useMutation<CustomerOrderInsert[], Error, File>({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('User not authenticated');

      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must contain at least a header and one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['customer_email', 'order_id', 'order_total', 'order_date'];
      
      if (!requiredHeaders.every(header => headers.includes(header))) {
        throw new Error('CSV must contain columns: customer_email, order_id, order_total, order_date');
      }

      const ordersToInsert: CustomerOrderInsert[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const order: Partial<CustomerOrderInsert> = { user_id: user.id };
        
        headers.forEach((header, index) => {
          const value = values[index];
          if (value) {
            switch (header) {
              case 'customer_email':
                order.customer_email = value;
                break;
              case 'customer_name':
                order.customer_name = value;
                break;
              case 'order_id':
                order.order_id = value;
                break;
              case 'order_total':
                order.order_total = parseFloat(value);
                break;
              case 'order_date':
                order.order_date = value;
                break;
            }
          }
        });

        if (order.customer_email && order.order_id && order.order_total && order.order_date) {
          if (selectedShopifyClient && selectedShopifyClient !== 'default') {
            order.shopify_client_id = selectedShopifyClient;
          }
          ordersToInsert.push(order as CustomerOrderInsert);
        }
      }

      if (ordersToInsert.length === 0) {
        throw new Error('No valid order data found in CSV');
      }

      // Delete existing orders for this client first
      let deleteQuery = supabase
        .from('customer_orders')
        .delete()
        .eq('user_id', user.id);

      if (selectedShopifyClient && selectedShopifyClient !== 'default') {
        deleteQuery = deleteQuery.eq('shopify_client_id', selectedShopifyClient);
      } else {
        deleteQuery = deleteQuery.is('shopify_client_id', null);
      }

      await deleteQuery;

      const { data, error } = await supabase
        .from('customer_orders')
        .insert(ordersToInsert)
        .select();

      if (error) throw error;
      return data as CustomerOrderInsert[];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      setIsUploadDialogOpen(false);
      setCsvFile(null);
      const clientName = selectedShopifyClient && selectedShopifyClient !== 'default'
        ? shopifyClients?.find(c => c.id === selectedShopifyClient)?.client_name || 'Selected Client'
        : 'Default';
      toast.success(`Successfully uploaded ${data.length} orders for ${clientName}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload CSV: ${error.message}`);
    },
  });

  const handleCsvUpload = () => {
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }
    uploadCsvMutation.mutate(csvFile);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Customer Orders Data
        </CardTitle>
        <CardDescription>
          Upload customer order data from CSV files to analyze influencer spending patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ClientSelector
          selectedShopifyClient={selectedShopifyClient}
          onValueChange={setSelectedShopifyClient}
          shopifyClients={shopifyClients}
        />

        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              Upload Customer Orders CSV
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Customer Orders CSV</DialogTitle>
              <DialogDescription>
                Upload a CSV file with customer order data. Required columns: customer_email, order_id, order_total, order_date. Optional: customer_name.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="csv-file">CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCsvUpload}
                disabled={!csvFile || uploadCsvMutation.isPending}
                className="bg-crm-blue hover:bg-blue-600"
              >
                {uploadCsvMutation.isPending ? 'Uploading...' : 'Upload'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CustomerOrdersUpload;
