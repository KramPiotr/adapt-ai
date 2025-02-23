
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getAccessToken() {
  try {
    const serviceAccountStr = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
    if (!serviceAccountStr) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT environment variable is not set');
    }

    console.log('Parsing service account credentials...');
    const serviceAccount = JSON.parse(serviceAccountStr);
    
    console.log('Creating JWT header...');
    const jwtHeader = {
      alg: 'RS256',
      typ: 'JWT',
      kid: serviceAccount.private_key_id
    };
    
    const now = Math.floor(Date.now() / 1000);
    console.log('Creating JWT claim set...');
    const jwtClaimSet = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    // Create JWT
    const encoder = new TextEncoder();
    const headerB64 = btoa(JSON.stringify(jwtHeader)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const claimB64 = btoa(JSON.stringify(jwtClaimSet)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const message = `${headerB64}.${claimB64}`;
    
    console.log('Processing private key...');
    // Convert PEM key to ArrayBuffer for signing
    const privateKey = serviceAccount.private_key
      .replace('-----BEGIN PRIVATE KEY-----\n', '')
      .replace('\n-----END PRIVATE KEY-----\n', '')
      .replace(/\n/g, '');
    
    console.log('Importing key for signing...');
    const binaryKey = Uint8Array.from(atob(privateKey), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256'
      },
      false,
      ['sign']
    );

    console.log('Signing JWT...');
    // Sign the message
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      key,
      encoder.encode(message)
    );
    
    // Convert signature to base64
    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const jwt = `${message}.${signatureB64}`;

    console.log('Exchanging JWT for access token...');
    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange error response:', errorData);
      throw new Error(`Failed to get access token: ${errorData}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('Successfully obtained access token');
    return tokenData.access_token;
  } catch (error) {
    console.error('Detailed error in getAccessToken:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing speech-to-text request...');
    const { audio } = await req.json();

    if (!audio) {
      console.error('No audio data provided');
      throw new Error('No audio data provided');
    }

    console.log('Audio data received, getting access token...');
    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      throw new Error('Failed to obtain access token');
    }
    
    console.log('Got access token, preparing request for Google Cloud...');
    
    // Convert base64 to audio bytes
    const binaryAudio = Uint8Array.from(atob(audio), c => c.charCodeAt(0));

    // Create request for Google Cloud Speech-to-Text
    const request = {
      audio: {
        content: audio // Send the original base64 string directly
      },
      config: {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode: 'en-US',
        model: 'default',
        useEnhanced: true,
      }
    };

    console.log('Sending request to Google Cloud Speech-to-Text...');
    console.log('Authorization header:', `Bearer ${accessToken}`); // Log the authorization header (without the full token)

    // Call Google Cloud Speech-to-Text API
    const response = await fetch('https://speech.googleapis.com/v1/speech:recognize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Goog-User-Project': JSON.parse(Deno.env.get('GOOGLE_SERVICE_ACCOUNT') || '{}').project_id
      },
      body: JSON.stringify(request)
    });

    console.log('Received response from Google Cloud Speech-to-Text');
    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (!response.ok) {
      throw new Error(`Google Speech-to-Text API error: ${responseText}`);
    }

    const result = JSON.parse(responseText);
    let text = '';
    if (result.results && result.results.length > 0) {
      text = result.results[0].alternatives[0].transcript;
      console.log('Transcribed text:', text);
    }

    return new Response(
      JSON.stringify({ text }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in speech-to-text function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
