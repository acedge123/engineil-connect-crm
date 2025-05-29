
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Upload, FileText, Users, TrendingUp, Edit, Trash2, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import InfluencerSpendingAnalysisFromCSV from '@/components/InfluencerSpendingAnalysisFromCSV';

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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    instagram_handle: '',
    follower_count: '',
    engagement_rate: '',
    category: '',
    notes: '',
  });

  // Fetch influencers
  const { data: influencers, isLoading } = useQuery({
    queryKey: ['influencers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('influencers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Influencer[];
    },
    enabled: !!user,
  });

  // Create/Update influencer mutation
  const saveInfluencerMutation = useMutation({
    mutationFn: async (influencerData: typeof formData) => {
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
      setEditingInfluencer(null);
      resetForm();
      toast.success(editingInfluencer ? 'Influencer updated successfully' : 'Influencer added successfully');
    },
    onError: (error) => {
      toast.error(`Failed to ${editingInfluencer ? 'update' : 'add'} influencer: ${error.message}`);
    },
  });

  // Delete influencer mutation
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
    onError: (error) => {
      toast.error(`Failed to delete influencer: ${error.message}`);
    },
  });

  // CSV upload mutation
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
    onError: (error) => {
      toast.error(`Failed to upload CSV: ${error.message}`);
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

  const handleEdit = (influencer: Influencer) => {
    setEditingInfluencer(influencer);
    setFormData({
      email: influencer.email,
      name: influencer.name || '',
      instagram_handle: influencer.instagram_handle || '',
      follower_count: influencer.follower_count?.toString() || '',
      engagement_rate: influencer.engagement_rate?.toString() || '',
      category: influencer.category || '',
      notes: influencer.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (influencerId: string) => {
    if (window.confirm('Are you sure you want to delete this influencer?')) {
      deleteInfluencerMutation.mutate(influencerId);
    }
  };

  const handleCsvUpload = () => {
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }
    uploadCsvMutation.mutate(csvFile);
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
    setEditingInfluencer(null);
  };

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
          <p className="text-gray-600 mt-2">Manage your influencer database and analyze their spending patterns</p>
        </div>
      </div>

      <Tabs defaultValue="database" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="database">
            <Users className="w-4 h-4 mr-2" />
            Influencer Database
          </TabsTrigger>
          <TabsTrigger value="analysis">
            <BarChart3 className="w-4 h-4 mr-2" />
            Spending Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="database" className="space-y-6">
          <div className="flex justify-end gap-2">
            {/* Dialog components for upload and add */}
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

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
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
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Influencers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{influencers?.length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Followers</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {influencers && influencers.length > 0
                    ? Math.round(
                        influencers
                          .filter(i => i.follower_count)
                          .reduce((sum, i) => sum + (i.follower_count || 0), 0) /
                        influencers.filter(i => i.follower_count).length
                      ).toLocaleString()
                    : '0'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {influencers && influencers.length > 0
                    ? (
                        influencers
                          .filter(i => i.engagement_rate)
                          .reduce((sum, i) => sum + (i.engagement_rate || 0), 0) /
                        influencers.filter(i => i.engagement_rate).length
                      ).toFixed(2) + '%'
                    : '0%'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Influencers Table */}
          {influencers && influencers.length > 0 ? (
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
                              onClick={() => handleEdit(influencer)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(influencer.id)}
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
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <CardTitle className="text-xl mb-2">No Influencers Found</CardTitle>
                <CardDescription className="mb-4">
                  Start building your influencer database by adding contacts manually or uploading a CSV file.
                </CardDescription>
                <div className="flex justify-center gap-2">
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-crm-blue hover:bg-blue-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Influencer
                  </Button>
                  <Button
                    onClick={() => setIsUploadDialogOpen(true)}
                    variant="outline"
                    className="border-crm-blue text-crm-blue hover:bg-crm-blue hover:text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analysis">
          <InfluencerSpendingAnalysisFromCSV />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Influencers;
