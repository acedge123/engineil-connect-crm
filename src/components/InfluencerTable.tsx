
import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

interface InfluencerTableProps {
  influencers: Influencer[];
  onEdit: (influencer: Influencer) => void;
  onDelete: (influencerId: string) => void;
}

const InfluencerTable: React.FC<InfluencerTableProps> = ({ influencers, onEdit, onDelete }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Influencer Database</CardTitle>
        <CardDescription>
          Manage your influencer contacts and their information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Instagram</TableHead>
              <TableHead>Followers</TableHead>
              <TableHead>Engagement</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {influencers.map((influencer) => (
              <TableRow key={influencer.id}>
                <TableCell className="font-medium">
                  {influencer.name || 'N/A'}
                </TableCell>
                <TableCell>{influencer.email}</TableCell>
                <TableCell>{influencer.instagram_handle || 'N/A'}</TableCell>
                <TableCell>
                  {influencer.follower_count ? influencer.follower_count.toLocaleString() : 'N/A'}
                </TableCell>
                <TableCell>
                  {influencer.engagement_rate ? `${influencer.engagement_rate}%` : 'N/A'}
                </TableCell>
                <TableCell>{influencer.category || 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(influencer)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(influencer.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default InfluencerTable;
