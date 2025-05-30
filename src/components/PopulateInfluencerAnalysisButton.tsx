
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LinkIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const PopulateInfluencerAnalysisButton = () => {
  const { user } = useAuth();
  const [isPopulating, setIsPopulating] = useState(false);

  const populateAnalysis = async () => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    setIsPopulating(true);
    
    try {
      console.log('=== STARTING EMAIL MATCHING PROCESS ===');
      console.log('Starting to populate influencer spending analysis...');
      
      // First, get all influencers
      const { data: influencers, error: influencersError } = await supabase
        .from('influencers')
        .select('id, email, name')
        .eq('user_id', user.id);

      if (influencersError) {
        console.error('Error fetching influencers:', influencersError);
        throw influencersError;
      }

      console.log(`Found ${influencers?.length || 0} influencers in database`);
      
      if (!influencers || influencers.length === 0) {
        toast.error('No influencers found');
        return;
      }

      // Get all customer orders
      const { data: customerOrders, error: ordersError } = await supabase
        .from('customer_orders')
        .select('id, customer_email, customer_name, order_total')
        .eq('user_id', user.id);

      if (ordersError) {
        console.error('Error fetching customer orders:', ordersError);
        throw ordersError;
      }

      console.log(`Found ${customerOrders?.length || 0} customer orders in database`);

      if (!customerOrders || customerOrders.length === 0) {
        toast.error('No customer orders found');
        return;
      }

      // Create normalized email maps for fast lookup
      const normalizeEmail = (email: string) => email.toLowerCase().trim();
      
      // Create influencer email map
      const influencerEmailMap = new Map();
      influencers.forEach(influencer => {
        const normalizedEmail = normalizeEmail(influencer.email);
        influencerEmailMap.set(normalizedEmail, influencer);
      });

      // Create customer spending map (aggregate by email)
      const customerSpendingMap = new Map();
      customerOrders.forEach(order => {
        const normalizedEmail = normalizeEmail(order.customer_email);
        
        if (customerSpendingMap.has(normalizedEmail)) {
          const existing = customerSpendingMap.get(normalizedEmail);
          existing.totalSpent += Number(order.order_total);
          existing.orderCount += 1;
          existing.orderIds.push(order.id);
        } else {
          customerSpendingMap.set(normalizedEmail, {
            email: order.customer_email, // Keep original case
            customerName: order.customer_name,
            totalSpent: Number(order.order_total),
            orderCount: 1,
            orderIds: [order.id]
          });
        }
      });

      console.log(`Created influencer email map: ${influencerEmailMap.size} unique emails`);
      console.log(`Created customer spending map: ${customerSpendingMap.size} unique emails`);

      // Find matches and create analysis records
      const analysisRecords = [];
      let matchCount = 0;

      // Iterate through customer emails to find matches with influencers
      for (const [normalizedEmail, customerData] of customerSpendingMap) {
        const influencer = influencerEmailMap.get(normalizedEmail);
        
        if (influencer) {
          matchCount++;
          console.log(`MATCH #${matchCount}: ${customerData.email} -> $${customerData.totalSpent} (${customerData.orderCount} orders)`);
          
          // Create ONE analysis record per matched email with aggregated spending
          analysisRecords.push({
            user_id: user.id,
            influencer_id: influencer.id,
            customer_email: customerData.email,
            customer_name: customerData.customerName,
            total_spent: customerData.totalSpent,
            customer_order_id: customerData.orderIds[0], // Use first order ID as reference
            shopify_client_id: null
          });
        }
      }

      console.log(`=== MATCHING RESULTS ===`);
      console.log(`Total influencers: ${influencers.length}`);
      console.log(`Total customer orders: ${customerOrders.length}`);
      console.log(`Unique customer emails: ${customerSpendingMap.size}`);
      console.log(`Email matches found: ${matchCount}`);
      console.log(`Analysis records to create: ${analysisRecords.length}`);

      if (analysisRecords.length === 0) {
        toast.warning('No matching emails found between influencers and customer orders');
        return;
      }

      // Clear existing analysis data for this user first
      const { error: deleteError } = await supabase
        .from('influencer_spending_analysis')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error clearing existing analysis:', deleteError);
        throw deleteError;
      }

      // Insert new analysis records in batches
      const batchSize = 1000; // Increased batch size for efficiency
      let insertedCount = 0;

      for (let i = 0; i < analysisRecords.length; i += batchSize) {
        const batch = analysisRecords.slice(i, i + batchSize);
        
        const { error: insertError } = await supabase
          .from('influencer_spending_analysis')
          .insert(batch);

        if (insertError) {
          console.error('Error inserting analysis batch:', insertError);
          throw insertError;
        }

        insertedCount += batch.length;
        console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}, total records: ${insertedCount}`);
      }

      console.log(`=== SUCCESS ===`);
      console.log(`Successfully populated ${insertedCount} analysis records from ${matchCount} email matches`);
      toast.success(`Successfully created ${insertedCount} analysis records from ${matchCount} matching emails`);
      
    } catch (error: any) {
      console.error('Error populating analysis:', error);
      toast.error(`Failed to populate analysis: ${error.message}`);
    } finally {
      setIsPopulating(false);
    }
  };

  return (
    <Button
      onClick={populateAnalysis}
      disabled={isPopulating}
      variant="outline"
      className="gap-2"
    >
      {isPopulating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <LinkIcon className="w-4 h-4" />
      )}
      {isPopulating ? 'Populating Analysis...' : 'Populate Analysis from Email Matches'}
    </Button>
  );
};

export default PopulateInfluencerAnalysisButton;
