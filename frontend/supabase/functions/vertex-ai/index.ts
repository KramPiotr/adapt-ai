
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@^0.1.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, sessionId, userId } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    console.log('Processing text with Vertex AI:', text);

    // Initialize Google AI
    const genAI = new GoogleGenerativeAI(Deno.env.get('GOOGLE_SERVICE_ACCOUNT') || '');
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `You are an AI coach having a conversation. You should provide helpful, 
    encouraging responses that are concise (2-3 sentences maximum) and natural-sounding.
    
    User's message: ${text}
    
    Provide a brief, natural response:`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    console.log('AI Response:', response);

    // Store the interaction in Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (supabaseUrl && supabaseKey) {
      const { error: dbError } = await fetch(
        `${supabaseUrl}/rest/v1/chat_interactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            session_id: sessionId,
            user_id: userId,
            user_message: text,
            ai_response: response,
            interaction_type: 'voice',
            successful: true,
          }),
        }
      ).then(res => res.json());

      if (dbError) {
        console.error('Error storing interaction:', dbError);
      }
    }

    return new Response(
      JSON.stringify({ response }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in vertex-ai function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
