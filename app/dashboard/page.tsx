'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/lib/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { toast } from 'sonner';
import { PlusCircle, MessageSquare } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from '@/components/ui/dialog';
import {
    Card,
    CardContent,
} from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

interface ChatUser {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
    last_message?: string;
    last_message_time?: string;
    conversation_id?: string;
}

interface ProfileData {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
}

export default function DashboardPage() {
    const { supabase, user, isLoading } = useSupabase();
    const router = useRouter();
    const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        } else if (user) {
            fetchChatHistory();
        }
    }, [user, isLoading, router]);

    const fetchChatHistory = async () => {
        if (!user) return;

        try {
            // Get all conversations where the current user is involved
            const { data: conversations, error } = await supabase
                .from('conversations')
                .select(`
                    id,
                    participants:conversation_participants(
                        user_id,
                        user:profiles(id, email, display_name, avatar_url)
                    ),
                    last_message:messages(
                        content, 
                        created_at
                    )
                `)
                .contains('participant_ids', [user.id])
                .order('updated_at', { ascending: false });

            if (error) throw error;
            console.log("Conversations data:", JSON.stringify(conversations, null, 2));

            // Process the conversations to extract other participants
            const processedUsers: ChatUser[] = [];

            conversations?.forEach(conversation => {
                // Find the other participants (not the current user)
                const otherParticipants = conversation.participants.filter(
                    p => p.user_id !== user.id
                );

                otherParticipants.forEach(participant => {
                    // Handle the user data structure correctly
                    if (participant.user) {
                        const lastMessage = conversation.last_message?.[0];
                        
                        // The user field might be an array or a single object
                        const userDataArray = Array.isArray(participant.user) 
                            ? participant.user 
                            : [participant.user];
                        
                        userDataArray.forEach(userData => {
                            processedUsers.push({
                                id: userData.id,
                                email: userData.email,
                                display_name: userData.display_name,
                                avatar_url: userData.avatar_url,
                                last_message: lastMessage?.content,
                                last_message_time: lastMessage?.created_at,
                                conversation_id: conversation.id
                            });
                        });
                    }
                });
            });

            setChatUsers(processedUsers);
        } catch (error: any) {
            console.error('Error fetching chat history:', error);
            toast.error('Failed to load chat history');
        }
    };

    const startNewChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserEmail.trim() || !user) return;

        setIsSubmitting(true);

        try {
            // Check if the user exists
            const { data: targetUser, error: userError } = await supabase
                .from('profiles')
                .select('id, email, display_name, avatar_url')
                .eq('email', newUserEmail.toLowerCase())
                .single();

            if (userError || !targetUser) {
                toast.error('User not found with that email');
                setIsSubmitting(false);
                return;
            }

            // Check if a conversation already exists
            const { data: existingConversation, error: convError } = await supabase
                .from('conversations')
                .select('id')
                .contains('participant_ids', [user.id, targetUser.id])
                .single();

            let conversationId = existingConversation?.id;

            // If no conversation exists, create a new one
            if (!existingConversation) {
                const { data: newConversation, error: createError } = await supabase
                    .from('conversations')
                    .insert({
                        participant_ids: [user.id, targetUser.id],
                        created_by: user.id,
                    })
                    .select('id')
                    .single();

                if (createError) throw createError;

                conversationId = newConversation.id;

                // Add participants to the conversation
                await supabase.from('conversation_participants').insert([
                    { conversation_id: conversationId, user_id: user.id },
                    { conversation_id: conversationId, user_id: targetUser.id }
                ]);
            }

            // Add the user to the chat history if not already there
            if (!chatUsers.some(chatUser => chatUser.id === targetUser.id)) {
                setChatUsers(prev => [
                    {
                        id: targetUser.id,
                        email: targetUser.email,
                        display_name: targetUser.display_name,
                        avatar_url: targetUser.avatar_url,
                        conversation_id: conversationId
                    },
                    ...prev
                ]);
            }

            setNewUserEmail('');
            setIsDialogOpen(false);

            // Navigate to the chat with this user
            router.push(`/chat/${conversationId}`);
        } catch (error: any) {
            console.error('Error starting new chat:', error);
            toast.error('Failed to start new chat');
        } finally {
            setIsSubmitting(false);
        }
    };

    const goToChat = (conversationId: string) => {
        if (conversationId) {
            router.push(`/chat/${conversationId}`);
        } else {
            toast.error('Could not find conversation');
        }
    };

    const getInitials = (name?: string, email?: string) => {
        if (name) return name.charAt(0).toUpperCase();
        if (email) return email.charAt(0).toUpperCase();
        return '?';
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold">OneChat Dashboard</h1>

                <div className="flex items-center gap-4">
                    <ThemeToggle />

                    {user && (
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.user_metadata?.avatar_url} />
                                    <AvatarFallback>
                                        {getInitials(
                                            user.user_metadata?.display_name,
                                            user.email
                                        )}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-1 ring-white" />
                            </div>
                            <span>{user.user_metadata?.display_name || user.email}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push('/chat')}
                            >
                                Global Chat
                            </Button>
                        </div>
                    )}
                </div>
            </header>

            <main className="container mx-auto py-8 px-4">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold">Your Conversations</h2>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                New Chat
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Start a new conversation</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={startNewChat} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium">
                                        Enter user email
                                    </label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="user@example.com"
                                        value={newUserEmail}
                                        onChange={(e) => setNewUserEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? 'Starting...' : 'Start Chat'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {chatUsers.length === 0 ? (
                    <div className="text-center py-12">
                        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">No conversations yet</h3>
                        <p className="text-muted-foreground mt-2">
                            Start a new conversation by clicking the "New Chat" button.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {chatUsers.map((chatUser) => (
                            <Card
                                key={chatUser.id}
                                className="cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => goToChat(chatUser.conversation_id!)}
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={chatUser.avatar_url} />
                                            <AvatarFallback>
                                                {getInitials(chatUser.display_name, chatUser.email)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium truncate">
                                                {chatUser.display_name || chatUser.email}
                                            </h3>
                                            {chatUser.last_message && (
                                                <p className="text-muted-foreground text-sm truncate">
                                                    {chatUser.last_message}
                                                </p>
                                            )}
                                            {chatUser.last_message_time && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatDistanceToNow(new Date(chatUser.last_message_time), { addSuffix: true })}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
} 