
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
      console.log('=== DEBUGGING EMAIL MATCHING PROCESS ===');
      console.log('Starting to populate influencer spending analysis...');
      
      // First, get all influencers with detailed logging
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

      // Log first 10 influencer emails for debugging
      console.log('Sample influencer emails:', influencers.slice(0, 10).map(inf => ({
        id: inf.id,
        email: inf.email,
        name: inf.name
      })));

      // Get all customer orders with detailed logging
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

      // Log first 10 customer emails for debugging
      console.log('Sample customer emails:', customerOrders.slice(0, 10).map(order => ({
        id: order.id,
        email: order.customer_email,
        name: order.customer_name,
        total: order.order_total
      })));

      // Create sets of unique emails for comparison
      const influencerEmails = new Set(influencers.map(inf => inf.email.toLowerCase().trim()));
      const customerEmails = new Set(customerOrders.map(order => order.customer_email.toLowerCase().trim()));

      console.log(`Unique influencer emails: ${influencerEmails.size}`);
      console.log(`Unique customer emails: ${customerEmails.size}`);

      // Find overlapping emails
      const matchingEmails = [...influencerEmails].filter(email => customerEmails.has(email));
      console.log(`Found ${matchingEmails.length} matching emails:`, matchingEmails.slice(0, 10));

      // Create a map of email to total spent (normalized emails)
      const emailSpendingMap = new Map<string, { totalSpent: number, customerName: string | null, orderIds: string[] }>();

      customerOrders.forEach(order => {
        const email = order.customer_email.toLowerCase().trim();
        const existing = emailSpendingMap.get(email);
        
        if (existing) {
          existing.totalSpent += Number(order.order_total);
          existing.orderIds.push(order.id);
        } else {
          emailSpendingMap.set(email, {
            totalSpent: Number(order.order_total),
            customerName: order.customer_name,
            orderIds: [order.id]
          });
        }
      });

      console.log(`Created spending map for ${emailSpendingMap.size} unique customer emails`);

      // Find matches and prepare analysis records with detailed logging
      const analysisRecords = [];
      let matchCount = 0;
      let unmatchedInfluencers = [];

      for (const influencer of influencers) {
        const influencerEmail = influencer.email.toLowerCase().trim();
        const customerData = emailSpendingMap.get(influencerEmail);
        
        if (customerData) {
          matchCount++;
          console.log(`MATCH FOUND: ${influencer.email} -> ${customerData.totalSpent} spent across ${customerData.orderIds.length} orders`);
          
          // Create one record per order for this influencer-customer match
          for (const orderId of customerData.orderIds) {
            analysisRecords.push({
              user_id: user.id,
              influencer_id: influencer.id,
              customer_email: influencerEmail,
              customer_name: customerData.customerName,
              total_spent: customerData.totalSpent,
              customer_order_id: orderId,
              shopify_client_id: null
            });
          }
        } else {
          unmatchedInfluencers.push(influencer.email);
        }
      }

      console.log(`=== MATCHING SUMMARY ===`);
      console.log(`Total influencers: ${influencers.length}`);
      console.log(`Total customer orders: ${customerOrders.length}`);
      console.log(`Unique influencer emails: ${influencerEmails.size}`);
      console.log(`Unique customer emails: ${customerEmails.size}`);
      console.log(`Email matches found: ${matchCount}`);
      console.log(`Analysis records to create: ${analysisRecords.length}`);
      console.log(`First 10 unmatched influencer emails:`, unmatchedInfluencers.slice(0, 10));

      if (analysisRecords.length === 0) {
        toast.warning('No matching emails found between influencers and customer orders');
        console.log('=== NO MATCHES - DETAILED DEBUG ===');
        console.log('Influencer emails (first 20):', Array.from(influencerEmails).slice(0, 20));
        console.log('Customer emails (first 20):', Array.from(customerEmails).slice(0, 20));
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
      const batchSize = 100;
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

      console.log(`=== FINAL RESULTS ===`);
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
