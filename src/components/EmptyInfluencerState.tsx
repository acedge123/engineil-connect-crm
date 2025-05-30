
import React from 'react';
import { Plus, Upload, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';

interface EmptyInfluencerStateProps {
  onAddInfluencer: () => void;
  onUploadCSV: () => void;
}

const EmptyInfluencerState: React.FC<EmptyInfluencerStateProps> = ({ onAddInfluencer, onUploadCSV }) => {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <CardTitle className="text-xl mb-2">No Influencers Found</CardTitle>
        <CardDescription className="mb-4">
          Start building your influencer database by adding contacts manually or uploading a CSV file.
        </CardDescription>
        <div className="flex justify-center gap-2">
          <Button
            onClick={onAddInfluencer}
            className="bg-crm-blue hover:bg-blue-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Influencer
          </Button>
          <Button
            onClick={onUploadCSV}
            variant="outline"
            className="border-crm-blue text-crm-blue hover:bg-crm-blue hover:text-white"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyInfluencerState;
