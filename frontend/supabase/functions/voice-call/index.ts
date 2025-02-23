
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SpeechClient } from "https://esm.sh/@google-cloud/speech@6.0.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { headers } = req;
    const upgradeHeader = headers.get("upgrade") || "";

    if (upgradeHeader.toLowerCase() !== "websocket") {
      return new Response("Expected WebSocket connection", { 
        status: 400,
        headers: corsHeaders
      });
    }

    // Get Google credentials from environment
    const credentials = JSON.parse(Deno.env.get('GOOGLE_SERVICE_ACCOUNT') || '');
    const speechClient = new SpeechClient({ credentials });

    // Create WebSocket connection
    const { socket, response } = Deno.upgradeWebSocket(req);

    // Track the current recognition stream
    let recognizeStream: any = null;
    let processing = false;

    socket.onopen = () => {
      console.log("WebSocket connection established");
    };

    socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'interrupt') {
          processing = false;
          if (recognizeStream) {
            recognizeStream.destroy();
            recognizeStream = null;
          }
          return;
        }

        if (message.type === 'audio_data') {
          const startTime = performance.now();
          
          if (!processing) {
            processing = true;
            recognizeStream = speechClient.streamingRecognize({
              config: {
                encoding: 'WEBM_OPUS',
                sampleRateHertz: 16000,
                languageCode: 'en-US',
                enableAutomaticPunctuation: true,
                model: 'latest_short',
                useEnhanced: true,
              },
              interimResults: true,
            });

            recognizeStream.on('data', async (data: any) => {
              if (data.results[0]?.isFinal) {
                const transcript = data.results[0].alternatives[0].transcript;
                const endTime = performance.now();
                
                // Store metrics
                const { data: metricsData, error: metricsError } = await supabase
                  .from('performance_metrics')
                  .insert({
                    user_id: message.userId,
                    session_id: message.sessionId,
                    metric_type: 'speech_to_text_latency',
                    value: endTime - startTime
                  });

                if (metricsError) {
                  console.error('Error storing metrics:', metricsError);
                }

                // Store interaction
                const { data: interactionData, error: interactionError } = await supabase
                  .from('chat_interactions')
                  .insert({
                    user_id: message.userId,
                    session_id: message.sessionId,
                    user_message: transcript,
                    interaction_type: 'speech',
                    processing_time_ms: endTime - startTime,
                    successful: true
                  });

                if (interactionError) {
                  console.error('Error storing interaction:', interactionError);
                }

                // Send transcript back to client
                socket.send(JSON.stringify({
                  type: 'transcript',
                  text: transcript,
                  isFinal: true
                }));
              }
            });

            recognizeStream.on('error', (error: Error) => {
              console.error('Recognition error:', error);
              socket.send(JSON.stringify({
                type: 'error',
                message: 'Speech recognition error'
              }));
            });
          }

          if (recognizeStream && message.audioData) {
            recognizeStream.write(Uint8Array.from(atob(message.audioData), c => c.charCodeAt(0)));
          }
        }
      } catch (error) {
        console.error('Error processing message:', error);
        socket.send(JSON.stringify({
          type: 'error',
          message: 'Error processing audio data'
        }));
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log("Client disconnected");
      if (recognizeStream) {
        recognizeStream.destroy();
        recognizeStream = null;
      }
    };

    return response;
  } catch (error) {
    console.error('Connection error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to establish WebSocket connection' }), 
      { status: 500, headers: corsHeaders }
    );
  }
});
