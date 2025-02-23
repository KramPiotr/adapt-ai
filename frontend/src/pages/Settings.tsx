
import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const colorSchemes = [
  { name: 'Default', value: 'default', colors: {
    primary: '#8CAF1E',
    secondary: '#1E1E1E',
    background: '#FFFFFF',
    text: '#283618'
  }},
  { name: 'Ocean Blue', value: 'ocean', colors: {
    primary: '#0EA5E9',
    secondary: '#F0F9FF',
    background: '#FFFFFF',
    text: '#0C4A6E'
  }},
  { name: 'Forest Green', value: 'forest', colors: {
    primary: '#22C55E',
    secondary: '#F0FDF4',
    background: '#FFFFFF',
    text: '#166534'
  }},
  { name: 'Royal Purple', value: 'royal', colors: {
    primary: '#9b87f5',
    secondary: '#F5F3FF',
    background: '#FFFFFF',
    text: '#5B21B6'
  }},
  { name: 'Sunset Orange', value: 'sunset', colors: {
    primary: '#FEC6A1',
    secondary: '#FFF7ED',
    background: '#FFFFFF',
    text: '#9A3412'
  }}
];

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || { color_scheme: 'default', show_realtime_transcript: true };
    },
    enabled: !!user,
  });

  const { mutate: updateSettings, isPending } = useMutation({
    mutationFn: async (newSettings: {
      color_scheme?: string;
      show_realtime_transcript?: boolean;
    }) => {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          ...settings,
          ...newSettings,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', user?.id] });
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating settings",
        description: "There was a problem saving your preferences. Please try again.",
        variant: "destructive"
      });
      console.error('Error updating settings:', error);
    },
  });

  const handleColorSchemeChange = (newScheme: string) => {
    updateSettings({ color_scheme: newScheme });
  };

  const handleTranscriptToggle = (checked: boolean) => {
    updateSettings({ show_realtime_transcript: checked });
  };

  useEffect(() => {
    if (settings?.color_scheme) {
      const scheme = colorSchemes.find(s => s.value === settings.color_scheme);
      if (scheme) {
        document.documentElement.style.setProperty('--primary', scheme.colors.primary);
        document.documentElement.style.setProperty('--secondary', scheme.colors.secondary);
        document.documentElement.style.setProperty('--background', scheme.colors.background);
        document.documentElement.style.setProperty('--foreground', scheme.colors.text);
      }
    }
  }, [settings?.color_scheme]);

  if (isLoading) {
    return <LoadingSpinner message="Loading settings..." />;
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="colorScheme">Color Scheme</Label>
            <Select
              value={settings?.color_scheme || 'default'}
              onValueChange={handleColorSchemeChange}
            >
              <SelectTrigger id="colorScheme" className="w-full bg-background">
                <SelectValue placeholder="Select color scheme" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-input shadow-md">
                {colorSchemes.map(scheme => (
                  <SelectItem 
                    key={scheme.value} 
                    value={scheme.value}
                    className="hover:bg-accent hover:text-accent-foreground"
                  >
                    {scheme.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="transcript">Show Realtime Transcript</Label>
            <Switch
              id="transcript"
              checked={settings?.show_realtime_transcript}
              onCheckedChange={handleTranscriptToggle}
              disabled={isPending}
            />
          </div>

          {isPending && (
            <div className="text-sm text-muted-foreground">
              Saving changes...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
