
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type Influencer = {
  id: string;
  user_id: string;
  email: string;
  name?: string;
  instagram_handle?: string;
  follower_count?: number;
  engagement_rate?: number;
  category?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export const useInfluencers = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const influencersQuery = useQuery<Influencer[]>({
    queryKey: ['influencers'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      console.log('Fetching ALL influencers for user:', user.id);
      
      // Fetch ALL influencers without any limits
      let allInfluencers: Influencer[] = [];
      let from = 0;
      const batchSize = 1000; // Fetch in batches to avoid memory issues
      let hasMore = true;

      while (hasMore) {
        const { data, error, count } = await supabase
          .from('influencers')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(from, from + batchSize - 1);

        if (error) {
          console.error('Error fetching influencers:', error);
          throw error;
        }

        if (data && data.length > 0) {
          allInfluencers = [...allInfluencers, ...data];
          from += batchSize;
          
          // Check if we've fetched all records
          hasMore = data.length === batchSize;
          
          console.log(`Fetched batch: ${data.length} influencers (total so far: ${allInfluencers.length})`);
          if (count !== null) {
            console.log(`Database total count: ${count}`);
          }
        } else {
          hasMore = false;
        }
      }
      
      console.log(`Successfully fetched ALL ${allInfluencers.length} influencers from database`);
      
      return allInfluencers as Influencer[];
    },
    enabled: !!user,
  });

  const deleteInfluencerMutation = useMutation({
    mutationFn: async (influencerId: string) => {
      const { error } = await supabase
        .from('influencers')
        .delete()
        .eq('id', influencerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['influencers'] });
      toast.success('Influencer deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete influencer: ${error.message}`);
    },
  });

  const handleDelete = (influencerId: string) => {
    if (window.confirm('Are you sure you want to delete this influencer?')) {
      deleteInfluencerMutation.mutate(influencerId);
    }
  };

  return {
    influencers: influencersQuery.data,
    isLoading: influencersQuery.isLoading,
    handleDelete,
  };
};
