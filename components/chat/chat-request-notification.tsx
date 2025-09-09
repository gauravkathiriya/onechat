'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabase } from '@/lib/auth-provider';
import { toast } from 'sonner';
import { Check, X, MessageCircle } from 'lucide-react';

interface ChatRequest {
  id: string;
  requester_id: string;
  recipient_id: string;
  message?: string;
  created_at: string;
  requester: {
    id: string;
    display_name?: string;
    avatar_url?: string;
    email: string;
  };
}

interface ChatRequestNotificationProps {
  request: ChatRequest;
  onClose: () => void;
}

export default function ChatRequestNotification({ request, onClose }: ChatRequestNotificationProps) {
  const { supabase, user } = useSupabase();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const getInitials = (name?: string, email?: string) => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return '?';
  };

  const handleAccept = async () => {
    if (!user || isProcessing) return;

    setIsProcessing(true);
    try {
      // Call the accept_chat_request function
      const { data: conversationId, error } = await supabase
        .rpc('accept_chat_request', { request_id: request.id });

      if (error) throw error;

      toast.success('Chat request accepted! Starting conversation...');
      onClose();
      
      // Navigate to the new conversation
      if (conversationId) {
        router.push(`/chat/${conversationId}`);
      }
    } catch (error: any) {
      console.error('Error accepting chat request:', error);
      toast.error('Failed to accept chat request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIgnore = async () => {
    if (!user || isProcessing) return;

    setIsProcessing(true);
    try {
      // Call the ignore_chat_request function
      const { error } = await supabase
        .rpc('ignore_chat_request', { request_id: request.id });

      if (error) throw error;

      toast.success('Chat request ignored');
      onClose();
    } catch (error: any) {
      console.error('Error ignoring chat request:', error);
      toast.error('Failed to ignore chat request');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={request.requester.avatar_url} />
              <AvatarFallback>
                {getInitials(request.requester.display_name, request.requester.email)}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-lg">
            New Chat Request
          </CardTitle>
          <CardDescription>
            <strong>{request.requester.display_name || request.requester.email}</strong> wants to start a conversation with you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {request.message && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Message:</strong> {request.message}
              </p>
            </div>
          )}
          
          <div className="flex gap-3">
            <Button
              onClick={handleAccept}
              disabled={isProcessing}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-2" />
              Accept
            </Button>
            <Button
              onClick={handleIgnore}
              disabled={isProcessing}
              variant="outline"
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Ignore
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground text-center">
            {new Date(request.created_at).toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
