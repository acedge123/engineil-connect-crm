
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type CreatorGift = {
  id: string;
  user_id: string;
  draft_order_shopify_id?: string;
  order_shopify_id?: string;
  creator_id: string;
  creator_email: string;
  brand_name: string;
  webhook_created_at?: string;
  webhook_updated_at?: string;
  amount: number;
  quantity: number;
  products?: any[];
  page_campaign_name?: string;
  page_campaign_subdomain?: string;
  page_campaign_fixed_subdomain?: string;
  created_at: string;
  updated_at: string;
};

export const useCreatorGifts = () => {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: gifts, isLoading, error, refetch } = useQuery({
    queryKey: ['creator-gifts'],
    queryFn: async (): Promise<CreatorGift[]> => {
      console.log('Fetching all creator gifts');
      
      // First, let's check the total count in the table
      const { count, error: countError } = await supabase
        .from('creator_gifts')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('Error getting count:', countError);
      } else {
        console.log('Total creator gifts in database:', count);
      }
      
      const { data, error } = await supabase
        .from('creator_gifts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching creator gifts:', error);
        throw error;
      }

      console.log('Creator gifts fetched:', data?.length || 0);
      console.log('Raw data:', data);
      
      // Let's specifically look for the UUID you mentioned
      if (data) {
        const specificGift = data.find(gift => gift.id === '56f771c2-8929-4e45-beb6-078f2a1c1ae7' || gift.user_id === '56f771c2-8929-4e45-beb6-078f2a1c1ae7');
        if (specificGift) {
          console.log('Found specific gift:', specificGift);
        } else {
          console.log('Specific gift not found in results');
        }
      }
      
      return data as CreatorGift[];
    },
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache the data
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('creator_gifts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-gifts'] });
      toast.success('Creator gift deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting creator gift:', error);
      toast.error(`Failed to delete creator gift: ${error.message}`);
    },
  });

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(id);
    } finally {
      setIsDeleting(false);
    }
  };

  const manualRefresh = () => {
    console.log('Manual refresh triggered');
    queryClient.invalidateQueries({ queryKey: ['creator-gifts'] });
    refetch();
  };

  return {
    gifts: gifts || [],
    isLoading,
    error,
    handleDelete,
    isDeleting,
    manualRefresh,
  };
};
