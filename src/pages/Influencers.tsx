
import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InfluencerForm from '@/components/InfluencerForm';
import InfluencerStats from '@/components/InfluencerStats';
import InfluencerTable from '@/components/InfluencerTable';
import InfluencerUploadDialog from '@/components/InfluencerUploadDialog';
import EmptyInfluencerState from '@/components/EmptyInfluencerState';
import CustomerOrdersUpload from '@/components/CustomerOrdersUpload';
import { useInfluencers } from '@/hooks/useInfluencers';

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

const Influencers = () => {
  const { influencers, isLoading, handleDelete } = useInfluencers();
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null);

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
          <h1 className="text-3xl font-bold text-gray-900">Influencers</h1>
          <p className="text-gray-600 mt-2">Manage your influencer database and customer data</p>
        </div>
      </div>

      <Tabs defaultValue="influencers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="influencers">Influencers</TabsTrigger>
          <TabsTrigger value="customer-upload">Customer Data Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="influencers" className="space-y-6">
          <div className="flex justify-end gap-2">
            <InfluencerUploadDialog />
            <InfluencerForm
              editingInfluencer={editingInfluencer}
              onEditingChange={setEditingInfluencer}
            />
          </div>

          <InfluencerStats influencers={influencers} />

          {influencers && influencers.length > 0 ? (
            <InfluencerTable
              influencers={influencers}
              onEdit={setEditingInfluencer}
              onDelete={handleDelete}
            />
          ) : (
            <EmptyInfluencerState
              onAddInfluencer={() => setEditingInfluencer(null)}
              onUploadCSV={() => {}}
            />
          )}
        </TabsContent>

        <TabsContent value="customer-upload">
          <CustomerOrdersUpload />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Influencers;
