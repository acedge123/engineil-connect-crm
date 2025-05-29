
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

type CustomerOrder = {
  id: string;
  user_id: string;
  customer_email: string;
  customer_name?: string;
  order_id: string;
  order_total: number;
  order_date: string;
  created_at: string;
};

const CustomerOrdersUpload = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // CSV upload mutation
  const uploadCsvMutation = useMutation({
    mutationFn: async (file: File) => {
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

        const ordersToInsert = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const order: any = { user_id: user.id };
          
          headers.forEach((header, index) => {
            const value = values[index];
            if (value) {
              switch (header) {
                case 'email':
                  order.customer_email = value.toLowerCase().trim();
                  break;
                case 'first name':
                  order.customer_first_name = value;
                  break;
                case 'last name':
                  order.customer_last_name = value;
                  break;
                case 'customer id':
                  order.order_id = `SHOPIFY-${value}`;
                  break;
                case 'total spent':
                  order.order_total = parseFloat(value) || 0;
                  break;
                // Remove the 'total orders' case since order_count doesn't exist in the database
              }
            }
          });

          // Combine first and last name for customer_name only if they exist
          const firstName = order.customer_first_name || '';
          const lastName = order.customer_last_name || '';
          if (firstName || lastName) {
            order.customer_name = `${firstName} ${lastName}`.trim();
          }

          // Clean up temporary fields
          delete order.customer_first_name;
          delete order.customer_last_name;

          // Set a default order date since Shopify customer export doesn't include individual order dates
          order.order_date = new Date().toISOString().split('T')[0];

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

        // Delete existing orders for this user first
        const { error: deleteError } = await supabase
          .from('customer_orders')
          .delete()
          .eq('user_id', user.id);

        if (deleteError) {
          console.log('Warning: Failed to delete previous orders:', deleteError.message);
        }

        const { data, error } = await supabase
          .from('customer_orders')
          .insert(ordersToInsert)
          .select();

        if (error) throw error;
        return data;
      } else {
        // Original custom format processing
        const requiredHeaders = ['customer_email', 'order_id', 'order_total', 'order_date'];
        const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
        if (missingHeaders.length > 0) {
          throw new Error(`Custom CSV must contain the following columns: ${missingHeaders.join(', ')}`);
        }

        const ordersToInsert = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const order: any = { user_id: user.id };
          
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

        // Delete existing orders for this user first
        const { error: deleteError } = await supabase
          .from('customer_orders')
          .delete()
          .eq('user_id', user.id);

        if (deleteError) {
          console.log('Warning: Failed to delete previous orders:', deleteError.message);
        }

        const { data, error } = await supabase
          .from('customer_orders')
          .insert(ordersToInsert)
          .select();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      setIsDialogOpen(false);
      setCsvFile(null);
      toast.success(`Successfully uploaded ${data.length} customer records`);
    },
    onError: (error) => {
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
