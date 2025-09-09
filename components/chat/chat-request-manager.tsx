'use client';

import { useChat } from '@/lib/chat-context';
import ChatRequestNotification from './chat-request-notification';

export default function ChatRequestManager() {
  const { pendingRequests, isLoadingRequests } = useChat();

  if (isLoadingRequests || pendingRequests.length === 0) {
    return null;
  }

  // Show the most recent pending request
  const latestRequest = pendingRequests[0];

  return (
    <ChatRequestNotification
      request={latestRequest}
      onClose={() => {
        // The notification will handle its own closing
      }}
    />
  );
}
