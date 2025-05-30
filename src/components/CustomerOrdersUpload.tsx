
import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface CustomerOrderInsert {
  user_id: string;
  customer_email: string;
  customer_name?: string;
  order_id: string;
  order_total: number;
  order_date: string;
  shopify_client_id?: string;
}

interface ShopifyClient {
  id: string;
  client_name: string;
  shopify_url: string;
}

const CustomerOrdersUpload = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [selectedShopifyClient, setSelectedShopifyClient] = useState<string>('default');

  // Fetch Shopify clients with simplified query
  const shopifyClientsQuery = useQuery({
    queryKey: ['shopify-clients'] as const,
    queryFn: async (): Promise<ShopifyClient[]> => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('shopify_clients')
        .select('id, client_name, shopify_url')
        .eq('user_id', user.id)
        .order('client_name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const shopifyClients = shopifyClientsQuery.data;

  // CSV upload mutation with simplified type handling
  const uploadCsvMutation = useMutation({
    mutationFn: async (file: File): Promise<any[]> => {
      if (!user) throw new Error('User not authenticated');

      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must contain at least a header and one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      
      // Check for Shopify format (requires Email and Total Spent)
      const isShopifyFormat = headers.includes('email') && headers.includes('total spent');
      
      if (isShopifyFormat) {
        // Shopify format processing
        const requiredHeaders = ['email', 'total spent'];
        const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
        if (missingHeaders.length > 0) {
          throw new Error(`Shopify CSV must contain the following columns: ${missingHeaders.join(', ')}`);
        }

        const ordersToInsert: CustomerOrderInsert[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          
          // Create order object step by step
          const baseOrder: CustomerOrderInsert = {
            user_id: user.id,
            customer_email: '',
            order_id: '',
            order_total: 0,
            order_date: new Date().toISOString().split('T')[0],
          };

          // Add shopify_client_id conditionally
          const order: CustomerOrderInsert = selectedShopifyClient && selectedShopifyClient !== 'default'
            ? { ...baseOrder, shopify_client_id: selectedShopifyClient }
            : baseOrder;

          let firstName = '';
          let lastName = '';
          
          headers.forEach((header, index) => {
            const value = values[index];
            if (value) {
              switch (header) {
                case 'email':
                  order.customer_email = value.toLowerCase().trim();
                  break;
                case 'first name':
                  firstName = value;
                  break;
                case 'last name':
                  lastName = value;
                  break;
                case 'customer id':
                  order.order_id = `SHOPIFY-${value}`;
                  break;
                case 'total spent':
                  order.order_total = parseFloat(value) || 0;
                  break;
              }
            }
          });

          // Combine first and last name for customer_name only if they exist
          if (firstName || lastName) {
            order.customer_name = `${firstName} ${lastName}`.trim();
          }

          // Ensure we have required fields
          if (order.customer_email && order.order_total > 0) {
            // If no order_id from customer_id, generate one
            if (!order.order_id) {
              order.order_id = `SHOPIFY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            }
            ordersToInsert.push(order);
          }
        }

        if (ordersToInsert.length === 0) {
          throw new Error('No valid customer data found in Shopify CSV. Make sure customers have spent money.');
        }

        // Delete existing orders for this user and client combination first
        if (selectedShopifyClient && selectedShopifyClient !== 'default') {
          const { error: deleteError } = await supabase
            .from('customer_orders')
            .delete()
            .eq('user_id', user.id)
            .eq('shopify_client_id', selectedShopifyClient);

          if (deleteError) {
            console.log('Warning: Failed to delete previous orders:', deleteError.message);
          }
        } else {
          const { error: deleteError } = await supabase
            .from('customer_orders')
            .delete()
            .eq('user_id', user.id)
            .is('shopify_client_id', null);

          if (deleteError) {
            console.log('Warning: Failed to delete previous orders:', deleteError.message);
          }
        }

        const { data, error } = await supabase
          .from('customer_orders')
          .insert(ordersToInsert)
          .select();

        if (error) throw error;
        return data || [];
      } else {
        // Original custom format processing
        const requiredHeaders = ['customer_email', 'order_id', 'order_total', 'order_date'];
        const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
        if (missingHeaders.length > 0) {
          throw new Error(`Custom CSV must contain the following columns: ${missingHeaders.join(', ')}`);
        }

        const ordersToInsert: CustomerOrderInsert[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          
          const baseOrder: CustomerOrderInsert = {
            user_id: user.id,
            customer_email: '',
            order_id: '',
            order_total: 0,
            order_date: '',
          };

          // Add shopify_client_id conditionally
          const order: CustomerOrderInsert = selectedShopifyClient && selectedShopifyClient !== 'default'
            ? { ...baseOrder, shopify_client_id: selectedShopifyClient }
            : baseOrder;
          
          headers.forEach((header, index) => {
            const value = values[index];
            if (value) {
              switch (header) {
                case 'customer_email':
                  order.customer_email = value.toLowerCase().trim();
                  break;
                case 'customer_name':
                  order.customer_name = value;
                  break;
                case 'order_id':
                  order.order_id = value;
                  break;
                case 'order_total':
                  order.order_total = parseFloat(value) || 0;
                  break;
                case 'order_date':
                  order.order_date = value;
                  break;
              }
            }
          });

          if (order.customer_email && order.order_id && order.order_total && order.order_date) {
            ordersToInsert.push(order);
          }
        }

        if (ordersToInsert.length === 0) {
          throw new Error('No valid order data found in CSV');
        }

        // Delete existing orders for this user and client combination first
        if (selectedShopifyClient && selectedShopifyClient !== 'default') {
          const { error: deleteError } = await supabase
            .from('customer_orders')
            .delete()
            .eq('user_id', user.id)
            .eq('shopify_client_id', selectedShopifyClient);

          if (deleteError) {
            console.log('Warning: Failed to delete previous orders:', deleteError.message);
          }
        } else {
          const { error: deleteError } = await supabase
            .from('customer_orders')
            .delete()
            .eq('user_id', user.id)
            .is('shopify_client_id', null);

          if (deleteError) {
            console.log('Warning: Failed to delete previous orders:', deleteError.message);
          }
        }

        const { data, error } = await supabase
          .from('customer_orders')
          .insert(ordersToInsert)
          .select();

        if (error) throw error;
        return data || [];
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      setIsDialogOpen(false);
      setCsvFile(null);
      setSelectedShopifyClient('default');
      const clientName = selectedShopifyClient && selectedShopifyClient !== 'default' 
        ? shopifyClients?.find(c => c.id === selectedShopifyClient)?.client_name || 'selected client'
        : 'default';
      toast.success(`Successfully uploaded ${data.length} customer records for ${clientName}`);
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
          Customer Data Upload
        </CardTitle>
        <CardDescription>
          Upload customer data from Shopify export or custom CSV format
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Shopify Format:</strong> Export customers from Shopify Admin. Required columns: Email, Total Spent. Optional: First Name, Last Name, Customer ID.
            <br />
            <strong>Custom Format:</strong> customer_email, order_id, order_total, order_date. Optional: customer_name
          </AlertDescription>
        </Alert>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-crm-blue hover:bg-blue-600">
              <Upload className="w-4 h-4 mr-2" />
              Upload Customer Data CSV
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Customer Data CSV</DialogTitle>
              <DialogDescription>
                Upload a CSV file with customer data. The system will automatically detect the format.
                <br /><br />
                <strong>Shopify Export Format:</strong>
                <br />
                Email, Total Spent (required). Optional: First Name, Last Name, Customer ID
                <br />
                <strong>Custom Format:</strong>
                <br />
                customer_email, customer_name, order_id, order_total, order_date
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="shopify-client">Shopify Client (Optional)</Label>
                <Select value={selectedShopifyClient} onValueChange={setSelectedShopifyClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Shopify client or leave blank for default" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">No specific client (Default)</SelectItem>
                    {shopifyClients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.client_name} ({client.shopify_url})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
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
