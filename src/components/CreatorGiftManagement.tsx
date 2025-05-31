
import React from 'react';
import { Package, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CreatorGiftStats from './CreatorGiftStats';
import CreatorGiftTable from './CreatorGiftTable';
import { useCreatorGifts } from '@/hooks/useCreatorGifts';

const CreatorGiftManagement = () => {
  const { gifts, isLoading, handleDelete, isDeleting, manualRefresh } = useCreatorGifts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-crm-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Creator Gift Management
              </CardTitle>
              <CardDescription>
                Track and manage gifts sent to creators through webhook data
              </CardDescription>
            </div>
            <Button 
              onClick={manualRefresh}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            This section displays creator gift data received from webhook events. 
            Data is automatically populated when webhook events are triggered.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Current gifts count: {gifts.length}
          </p>
        </CardContent>
      </Card>

      <CreatorGiftStats gifts={gifts} />

      <CreatorGiftTable
        gifts={gifts}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default CreatorGiftManagement;
