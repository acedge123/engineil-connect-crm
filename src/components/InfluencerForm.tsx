
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

type FormData = {
  email: string;
  name: string;
  instagram_handle: string;
  follower_count: string;
  engagement_rate: string;
  category: string;
  notes: string;
};

interface InfluencerFormProps {
  editingInfluencer: Influencer | null;
  onEditingChange: (influencer: Influencer | null) => void;
}

const InfluencerForm: React.FC<InfluencerFormProps> = ({ editingInfluencer, onEditingChange }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    name: '',
    instagram_handle: '',
    follower_count: '',
    engagement_rate: '',
    category: '',
    notes: '',
  });

  useEffect(() => {
    if (editingInfluencer) {
      setFormData({
        email: editingInfluencer.email,
        name: editingInfluencer.name || '',
        instagram_handle: editingInfluencer.instagram_handle || '',
        follower_count: editingInfluencer.follower_count?.toString() || '',
        engagement_rate: editingInfluencer.engagement_rate?.toString() || '',
        category: editingInfluencer.category || '',
        notes: editingInfluencer.notes || '',
      });
      setIsDialogOpen(true);
    }
  }, [editingInfluencer]);

  const saveInfluencerMutation = useMutation({
    mutationFn: async (influencerData: FormData) => {
      if (!user) throw new Error('User not authenticated');

      const dataToSave = {
        ...influencerData,
        follower_count: influencerData.follower_count ? parseInt(influencerData.follower_count) : null,
        engagement_rate: influencerData.engagement_rate ? parseFloat(influencerData.engagement_rate) : null,
      };

      if (editingInfluencer) {
        const { data, error } = await supabase
          .from('influencers')
          .update({
            ...dataToSave,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingInfluencer.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('influencers')
          .insert({
            ...dataToSave,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['influencers'] });
      setIsDialogOpen(false);
      onEditingChange(null);
      resetForm();
      toast.success(editingInfluencer ? 'Influencer updated successfully' : 'Influencer added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to ${editingInfluencer ? 'update' : 'add'} influencer: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast.error('Email is required');
      return;
    }

    saveInfluencerMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      instagram_handle: '',
      follower_count: '',
      engagement_rate: '',
      category: '',
      notes: '',
    });
    onEditingChange(null);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-crm-blue hover:bg-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          Add Influencer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingInfluencer ? 'Edit' : 'Add'} Influencer</DialogTitle>
          <DialogDescription>
            {editingInfluencer ? 'Update' : 'Add'} influencer information to your database.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="influencer@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instagram_handle">Instagram Handle</Label>
                <Input
                  id="instagram_handle"
                  placeholder="@username"
                  value={formData.instagram_handle}
                  onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="Fashion, Tech, Lifestyle..."
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="follower_count">Follower Count</Label>
                <Input
                  id="follower_count"
                  type="number"
                  placeholder="10000"
                  value={formData.follower_count}
                  onChange={(e) => setFormData({ ...formData, follower_count: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="engagement_rate">Engagement Rate (%)</Label>
                <Input
                  id="engagement_rate"
                  type="number"
                  step="0.01"
                  placeholder="3.45"
                  value={formData.engagement_rate}
                  onChange={(e) => setFormData({ ...formData, engagement_rate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about the influencer..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-crm-blue hover:bg-blue-600"
              disabled={saveInfluencerMutation.isPending}
            >
              {saveInfluencerMutation.isPending ? 'Saving...' : editingInfluencer ? 'Update' : 'Add'} Influencer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InfluencerForm;
