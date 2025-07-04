import DirectChat from '@/components/chat/direct-chat';

export default async function ChatPage({ 
  params 
}: { 
  params: { conversationId: string } 
}) {
  // This is now a server component that passes the conversationId to a client component
  return <DirectChat conversationId={params.conversationId} />;
} 