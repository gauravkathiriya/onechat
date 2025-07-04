import DirectChat from '@/components/chat/direct-chat';

export default async function ChatPage({ 
  params 
}: { 
  params: Promise<{ conversationId: string }> 
}) {
  const { conversationId } = await params;
  return <DirectChat conversationId={conversationId} />;
} 