
import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const InfluencerUploadDialog: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const uploadCsvMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('User not authenticated');

      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must contain at least a header and one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['email'];
      
      if (!requiredHeaders.every(header => headers.includes(header))) {
        throw new Error('CSV must contain at least an "email" column');
      }

      const influencersToInsert = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const influencer: any = { user_id: user.id };
        
        headers.forEach((header, index) => {
          const value = values[index];
          if (value) {
            switch (header) {
              case 'email':
                influencer.email = value;
                break;
              case 'name':
                influencer.name = value;
                break;
              case 'instagram_handle':
                influencer.instagram_handle = value;
                break;
              case 'follower_count':
                influencer.follower_count = parseInt(value) || null;
                break;
              case 'engagement_rate':
                influencer.engagement_rate = parseFloat(value) || null;
                break;
              case 'category':
                influencer.category = value;
                break;
              case 'notes':
                influencer.notes = value;
                break;
            }
          }
        });

        if (influencer.email) {
          influencersToInsert.push(influencer);
        }
      }

      if (influencersToInsert.length === 0) {
        throw new Error('No valid influencer data found in CSV');
      }

      const { data, error } = await supabase
        .from('influencers')
        .insert(influencersToInsert)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['influencers'] });
      setIsUploadDialogOpen(false);
      setCsvFile(null);
      toast.success(`Successfully uploaded ${data.length} influencers`);
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
    <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-crm-blue text-crm-blue hover:bg-crm-blue hover:text-white">
          <Upload className="w-4 h-4 mr-2" />
          Upload CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Influencers CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with influencer data. Required column: email. Optional: name, instagram_handle, follower_count, engagement_rate, category, notes.
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
  );
};

export default InfluencerUploadDialog;
