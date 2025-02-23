
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const History = () => {
  const { user } = useAuth();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading session history..." />;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4 text-white">Session History</h1>
      {sessions && sessions.length > 0 ? (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <CardTitle>Session ID: {session.id}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Started At: {new Date(session.started_at).toLocaleString()}</p>
                {session.ended_at && <p>Ended At: {new Date(session.ended_at).toLocaleString()}</p>}
                {session.transcript && (
                  <>
                    <h2 className="text-lg font-semibold mt-2">Transcript:</h2>
                    <p className="whitespace-pre-line">{session.transcript}</p>
                  </>
                )}
                {session.ai_responses && session.ai_responses.length > 0 && (
                  <>
                    <h2 className="text-lg font-semibold mt-2">AI Responses:</h2>
                    <ul>
                      {session.ai_responses.map((response, index) => (
                        <li key={index}>{response}</li>
                      ))}
                    </ul>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p>No sessions found.</p>
      )}
    </div>
  );
};

export default History;
