
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { parseShopifyCustomerCSV } from '@/utils/csvParser';
import { customerOrderService } from '@/services/customerOrderService';
import { toast } from 'sonner';

export const useCustomerOrderUpload = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async ({ file, shopifyClientId }: { file: File; shopifyClientId: string }) => {
      if (!user) throw new Error('User not authenticated');

      console.log('=== UPLOAD MUTATION START ===');
      console.log('Selected shopify client ID:', shopifyClientId);

      const text = await file.text();
      const parseResult = parseShopifyCustomerCSV(text);

      if (!parseResult.success) {
        throw new Error(parseResult.error);
      }

      console.log('Parsed customer data count:', parseResult.data.length);
      console.log('Calling customerOrderService.uploadCustomerOrders with shopifyClientId:', shopifyClientId);

      return customerOrderService.uploadCustomerOrders(
        user.id,
        parseResult.data,
        shopifyClientId
      );
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      setCsvFile(null);
      const clientName = variables.shopifyClientId && variables.shopifyClientId !== 'default'
        ? 'Selected Client'
        : 'Default';
      
      console.log('=== UPLOAD SUCCESS ===');
      console.log('Uploaded data count:', data.length);
      console.log('Client:', clientName);
      
      toast.success(`Successfully uploaded ${data.length} customer records for ${clientName}`);
    },
    onError: (error: Error) => {
      console.error('Upload error:', error);
      toast.error(`Failed to upload CSV: ${error.message}`);
    },
  });

  const handleUpload = async (shopifyClientId: string) => {
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }

    console.log('=== HANDLE UPLOAD START ===');
    console.log('File:', csvFile.name);
    console.log('Shopify Client ID passed to handleUpload:', shopifyClientId);

    setIsUploading(true);
    try {
      await uploadMutation.mutateAsync({ file: csvFile, shopifyClientId });
    } finally {
      setIsUploading(false);
    }
  };

  return {
    csvFile,
    setCsvFile,
    isUploading,
    handleUpload,
    isLoading: uploadMutation.isPending
  };
};
