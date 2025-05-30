
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreatorGiftWebhookData {
  creator_id: string;
  creator_email: string;
  brand_name: string;
  amount: number;
  quantity?: number;
  products?: any[];
  page_campaign_name?: string;
  page_campaign_subdomain?: string;
  page_campaign_fixed_subdomain?: string;
  draft_order_shopify_id?: string;
  order_shopify_id?: string;
  webhook_created_at?: string;
  webhook_updated_at?: string;
  user_id: string; // This should be provided in the webhook data to identify which user this gift belongs to
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const webhookData: CreatorGiftWebhookData = await req.json();
    
    console.log('Received creator gift webhook data:', webhookData);

    // Validate required fields
    if (!webhookData.creator_id || !webhookData.creator_email || !webhookData.brand_name || !webhookData.user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: creator_id, creator_email, brand_name, user_id' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Insert the creator gift data
    const { data, error } = await supabase
      .from('creator_gifts')
      .insert({
        creator_id: webhookData.creator_id,
        creator_email: webhookData.creator_email,
        brand_name: webhookData.brand_name,
        amount: webhookData.amount || 0,
        quantity: webhookData.quantity || 1,
        products: webhookData.products,
        page_campaign_name: webhookData.page_campaign_name,
        page_campaign_subdomain: webhookData.page_campaign_subdomain,
        page_campaign_fixed_subdomain: webhookData.page_campaign_fixed_subdomain,
        draft_order_shopify_id: webhookData.draft_order_shopify_id,
        order_shopify_id: webhookData.order_shopify_id,
        webhook_created_at: webhookData.webhook_created_at,
        webhook_updated_at: webhookData.webhook_updated_at,
        user_id: webhookData.user_id
      });

    if (error) {
      console.error('Error inserting creator gift:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to store creator gift data' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    console.log('Creator gift stored successfully:', data);

    return new Response(
      JSON.stringify({ success: true, message: 'Creator gift data received and stored' }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});
