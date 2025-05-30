
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, Package, User, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type CreatorGift = {
  id: string;
  user_id: string;
  draft_order_shopify_id?: string;
  order_shopify_id?: string;
  creator_id: string;
  creator_email: string;
  brand_name: string;
  webhook_created_at?: string;
  webhook_updated_at?: string;
  amount: number;
  quantity: number;
  products?: any[];
  page_campaign_name?: string;
  page_campaign_subdomain?: string;
  page_campaign_fixed_subdomain?: string;
  created_at: string;
  updated_at: string;
};

interface CreatorGiftTableProps {
  gifts: CreatorGift[];
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

const CreatorGiftTable: React.FC<CreatorGiftTableProps> = ({
  gifts,
  onDelete,
  isDeleting
}) => {
  if (!gifts || gifts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Creator Gifts
          </CardTitle>
          <CardDescription>
            No creator gifts found. Data will appear here when webhook events are received.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No creator gifts to display</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Creator Gifts ({gifts.length})
        </CardTitle>
        <CardDescription>
          Gifts sent to creators tracked via webhook data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creator</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Order Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gifts.map((gift) => (
                <TableRow key={gift.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{gift.creator_email}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {gift.creator_id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{gift.brand_name}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-medium">${gift.amount.toFixed(2)}</span>
                      {gift.quantity > 1 && (
                        <span className="text-sm text-gray-500">
                          (qty: {gift.quantity})
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {gift.products && gift.products.length > 0 ? (
                      <div className="space-y-1">
                        {gift.products.slice(0, 2).map((product: any, index: number) => (
                          <div key={index} className="text-sm">
                            {product.title || product.name || 'Product'}
                          </div>
                        ))}
                        {gift.products.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{gift.products.length - 2} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">No products</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {gift.page_campaign_name ? (
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{gift.page_campaign_name}</div>
                        {(gift.page_campaign_subdomain || gift.page_campaign_fixed_subdomain) && (
                          <div className="text-xs text-gray-500">
                            {gift.page_campaign_fixed_subdomain || gift.page_campaign_subdomain}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">No campaign</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {gift.order_shopify_id && (
                        <Badge variant="default" className="text-xs">
                          Order: {gift.order_shopify_id.slice(-8)}
                        </Badge>
                      )}
                      {gift.draft_order_shopify_id && (
                        <Badge variant="secondary" className="text-xs">
                          Draft: {gift.draft_order_shopify_id.slice(-8)}
                        </Badge>
                      )}
                      {!gift.order_shopify_id && !gift.draft_order_shopify_id && (
                        <span className="text-gray-400 text-sm">No order</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(gift.created_at), { addSuffix: true })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(gift.id)}
                      disabled={isDeleting}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatorGiftTable;
