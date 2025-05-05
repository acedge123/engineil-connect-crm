
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building, Plus, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from "sonner";

// Mock industry data
const initialIndustries = [
  { id: 1, name: 'Technology', description: 'Software, hardware, and IT services', companies: 12 },
  { id: 2, name: 'Healthcare', description: 'Hospitals, pharmaceuticals, and medical devices', companies: 8 },
  { id: 3, name: 'Manufacturing', description: 'Production of goods and materials', companies: 10 },
  { id: 4, name: 'Finance', description: 'Banking, insurance, and investment services', companies: 6 },
  { id: 5, name: 'Energy', description: 'Oil, gas, renewable energy, and utilities', companies: 5 },
  { id: 6, name: 'Retail', description: 'Consumer goods and services', companies: 9 },
  { id: 7, name: 'Transportation', description: 'Logistics, shipping, and transit', companies: 4 },
  { id: 8, name: 'Education', description: 'Schools, universities, and educational services', companies: 3 },
];

const Industries = () => {
  const [industries, setIndustries] = useState(initialIndustries);
  const [searchTerm, setSearchTerm] = useState('');
  const [newIndustry, setNewIndustry] = useState({ name: '', description: '' });
  const [editingIndustry, setEditingIndustry] = useState<null | { id: number; name: string; description: string; }>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const filteredIndustries = industries.filter(industry => 
    industry.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    industry.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddIndustry = () => {
    if (!newIndustry.name.trim()) {
      toast.error('Industry name is required');
      return;
    }

    const newIndustryWithId = {
      id: industries.length > 0 ? Math.max(...industries.map(i => i.id)) + 1 : 1,
      name: newIndustry.name,
      description: newIndustry.description,
      companies: 0
    };

    setIndustries([...industries, newIndustryWithId]);
    setNewIndustry({ name: '', description: '' });
    setIsAddDialogOpen(false);
    toast.success('Industry added successfully');
  };

  const handleEditIndustry = () => {
    if (!editingIndustry) return;
    
    if (!editingIndustry.name.trim()) {
      toast.error('Industry name is required');
      return;
    }

    setIndustries(industries.map(industry => 
      industry.id === editingIndustry.id 
        ? { ...industry, name: editingIndustry.name, description: editingIndustry.description }
        : industry
    ));
    
    setIsEditDialogOpen(false);
    toast.success('Industry updated successfully');
  };

  const handleDeleteIndustry = () => {
    if (!editingIndustry) return;
    
    setIndustries(industries.filter(industry => industry.id !== editingIndustry.id));
    setIsDeleteDialogOpen(false);
    toast.success('Industry deleted successfully');
  };

  const openEditDialog = (industry: typeof industries[0]) => {
    setEditingIndustry({
      id: industry.id,
      name: industry.name,
      description: industry.description
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (industry: typeof industries[0]) => {
    setEditingIndustry({
      id: industry.id,
      name: industry.name,
      description: industry.description
    });
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Industries</h1>
          <p className="text-gray-600">Manage industry categories for your companies</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-crm-blue hover:bg-blue-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Industry
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search industries..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Industry List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIndustries.map((industry) => (
          <Card key={industry.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-crm-blue" />
                  <CardTitle className="text-lg">{industry.name}</CardTitle>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditDialog(industry)}
                  >
                    <Edit className="h-4 w-4 text-gray-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openDeleteDialog(industry)}
                  >
                    <Trash2 className="h-4 w-4 text-gray-500" />
                  </Button>
                </div>
              </div>
              <CardDescription>{industry.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{industry.companies}</span> companies
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full text-crm-blue" onClick={() => window.location.href = '/companies'}>
                View Companies
              </Button>
            </CardFooter>
          </Card>
        ))}

        {filteredIndustries.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <Building className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No industries found</h3>
            <p className="text-gray-600 mt-1">Try adjusting your search or add a new industry.</p>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              variant="outline" 
              className="mt-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Industry
            </Button>
          </div>
        )}
      </div>

      {/* Add Industry Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Industry</DialogTitle>
            <DialogDescription>
              Create a new industry category for organizing companies.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Industry Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                placeholder="e.g., Technology"
                value={newIndustry.name}
                onChange={(e) => setNewIndustry({...newIndustry, name: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Input
                id="description"
                placeholder="e.g., Software, hardware, and IT services"
                value={newIndustry.description}
                onChange={(e) => setNewIndustry({...newIndustry, description: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddIndustry} className="bg-crm-blue hover:bg-blue-600">
              Add Industry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Industry Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Industry</DialogTitle>
            <DialogDescription>
              Update the industry information.
            </DialogDescription>
          </DialogHeader>
          {editingIndustry && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label htmlFor="edit-name" className="text-sm font-medium">
                  Industry Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="edit-name"
                  value={editingIndustry.name}
                  onChange={(e) => setEditingIndustry({...editingIndustry, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-description" className="text-sm font-medium">
                  Description
                </label>
                <Input
                  id="edit-description"
                  value={editingIndustry.description}
                  onChange={(e) => setEditingIndustry({...editingIndustry, description: e.target.value})}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditIndustry} className="bg-crm-blue hover:bg-blue-600">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Industry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this industry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {editingIndustry && (
            <div className="py-4">
              <p className="text-gray-900 font-medium">{editingIndustry.name}</p>
              <p className="text-gray-600 text-sm">{editingIndustry.description}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteIndustry}>
              Delete Industry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Industries;
