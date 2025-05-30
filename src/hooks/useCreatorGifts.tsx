
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: gifts, isLoading, error } = useQuery({
    queryKey: ['creator-gifts'],
    queryFn: async (): Promise<CreatorGift[]> => {
      if (!user) throw new Error('User not authenticated');
      
      console.log('Fetching creator gifts for user:', user.id);
      
      const { data, error } = await supabase
        .from('creator_gifts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching creator gifts:', error);
        throw error;
      }

      console.log('Creator gifts fetched:', data?.length || 0);
      return data as CreatorGift[];
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('creator_gifts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

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

  return {
    gifts: gifts || [],
    isLoading,
    error,
    handleDelete,
    isDeleting,
  };
};
