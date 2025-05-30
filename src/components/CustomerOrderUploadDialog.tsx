
import React from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCustomerOrderUpload } from '@/hooks/useCustomerOrderUpload';

type CustomerOrderUploadDialogProps = {
  selectedShopifyClient: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

const CustomerOrderUploadDialog: React.FC<CustomerOrderUploadDialogProps> = ({
  selectedShopifyClient,
  isOpen,
  onOpenChange
}) => {
  const { csvFile, setCsvFile, isUploading, handleUpload } = useCustomerOrderUpload();

  const onUpload = async () => {
    await handleUpload(selectedShopifyClient);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Upload className="w-4 h-4 mr-2" />
          Upload Shopify Customer CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Shopify Customer CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with Shopify customer data. Required column: Email. 
            Optional columns: First Name, Last Name, Customer ID, Total Spent, Total Orders.
            The system will automatically map Shopify column headers.
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={onUpload}
            disabled={!csvFile || isUploading}
            className="bg-crm-blue hover:bg-blue-600"
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerOrderUploadDialog;
