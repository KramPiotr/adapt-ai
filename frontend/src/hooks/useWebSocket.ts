
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface WebSocketOptions {
  userId: string;
  sessionId: string;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export const useWebSocket = ({
  userId,
  sessionId,
  onTranscript,
  onError
}: WebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(async () => {
    try {
      const { data } = await supabase.functions.invoke('voice-call');
      if (!data?.url) throw new Error('Failed to get WebSocket URL');

      ws.current = new WebSocket(data.url);

      ws.current.onopen = () => {
        setIsConnected(true);
        reconnectAttempts.current = 0;
        toast.success('Connected to voice service');
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          setTimeout(connect, 2000 * Math.pow(2, reconnectAttempts.current));
        } else {
          toast.error('Failed to connect to voice service');
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.('Connection error');
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'transcript') {
            onTranscript?.(data.text, data.isFinal);
          } else if (data.type === 'error') {
            onError?.(data.message);
            toast.error(data.message);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };
    } catch (error) {
      console.error('Failed to connect:', error);
      onError?.('Failed to establish connection');
    }
  }, [onTranscript, onError]);

  const sendAudio = useCallback((audioBlob: Blob) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Audio = (reader.result as string).split(',')[1];
      ws.current?.send(JSON.stringify({
        type: 'audio_data',
        audioData: base64Audio,
        userId,
        sessionId
      }));
    };
    reader.readAsDataURL(audioBlob);
  }, [userId, sessionId]);

  const interrupt = useCallback(() => {
    ws.current?.send(JSON.stringify({ type: 'interrupt' }));
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    sendAudio,
    interrupt
  };
};
