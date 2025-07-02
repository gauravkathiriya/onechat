'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSupabase } from '@/lib/auth-provider';
import { toast } from 'sonner';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { Edit2, MoreVertical, Pencil, Save, Smile, Trash, X, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface Message {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    is_edited: boolean;
    edited_at: string | null;
    user: {
        id: string;
        display_name?: string;
        avatar_url?: string;
        email?: string;
    };
}

interface Participant {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
}

export default function DirectChatPage({ params }: { params: { conversationId: string } }) {
    const { supabase, user, isLoading } = useSupabase();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editedContent, setEditedContent] = useState('');
    const [otherParticipant, setOtherParticipant] = useState<Participant | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { conversationId } = params;

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        } else if (user) {
            fetchConversationDetails();
            fetchMessages();
        }
    }, [user, isLoading, router, conversationId]);

    const fetchConversationDetails = async () => {
        try {
            // Get conversation participants
            const { data: participants, error } = await supabase
                .from('conversation_participants')
                .select(`
                    user_id,
                    user:profiles(id, email, display_name, avatar_url)
                `)
                .eq('conversation_id', conversationId);
            
            if (error) throw error;
            console.log("Participant data:", JSON.stringify(participants, null, 2));
            
            // Find the other participant
            const otherParticipantData = participants?.find(p => p.user_id !== user?.id);
            if (otherParticipantData && otherParticipantData.user) {
                // Handle the user data structure correctly
                const userData = Array.isArray(otherParticipantData.user) 
                    ? otherParticipantData.user[0] 
                    : otherParticipantData.user;
                
                setOtherParticipant({
                    id: userData.id,
                    email: userData.email,
                    display_name: userData.display_name,
                    avatar_url: userData.avatar_url
                });
            }
        } catch (error: any) {
            console.error('Error fetching conversation details:', error);
            toast.error('Failed to load conversation details');
        }
    };

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*, user:profiles(id, display_name, avatar_url, email)')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);
            scrollToBottom();
        } catch (error: any) {
            toast.error('Error fetching messages: ' + error.message);
        }
    };

    useEffect(() => {
        if (user) {
            // Subscribe to new messages for this conversation
            const messagesChannel = supabase
                .channel(`conversation:${conversationId}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                }, async (payload) => {
                    // When a new message comes in, fetch the complete message with user details
                    const { data, error } = await supabase
                        .from('messages')
                        .select('*, user:profiles(id, display_name, avatar_url, email)')
                        .eq('id', payload.new.id)
                        .single();

                    if (error) {
                        console.error('Error fetching new message details:', error);
                        return;
                    }

                    if (data) {
                        setMessages(prev => [...prev, data]);
                        scrollToBottom();
                    }
                })
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                }, (payload) => {
                    setMessages(prev =>
                        prev.map(message =>
                            message.id === payload.new.id
                                ? { ...message, ...payload.new }
                                : message
                        )
                    );
                })
                .subscribe();

            return () => {
                supabase.removeChannel(messagesChannel);
            };
        }
    }, [supabase, user, conversationId]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessage.trim() || !user) return;

        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('messages')
                .insert([
                    {
                        content: newMessage.trim(),
                        user_id: user.id,
                        conversation_id: conversationId
                    }
                ]);

            if (error) throw error;

            // Update the conversation's updated_at timestamp
            await supabase
                .from('conversations')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', conversationId);

            setNewMessage('');
            setShowEmojiPicker(false);
        } catch (error: any) {
            toast.error('Error sending message: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const startEditMessage = (message: Message) => {
        if (message.user_id === user?.id) {
            setEditingMessageId(message.id);
            setEditedContent(message.content);
        }
    };

    const cancelEditMessage = () => {
        setEditingMessageId(null);
        setEditedContent('');
    };

    const saveEditedMessage = async (messageId: string) => {
        if (!editedContent.trim()) return;

        try {
            const { error } = await supabase
                .from('messages')
                .update({
                    content: editedContent.trim(),
                    is_edited: true,
                    edited_at: new Date().toISOString()
                })
                .eq('id', messageId)
                .eq('user_id', user?.id);

            if (error) throw error;

            setEditingMessageId(null);
            setEditedContent('');
        } catch (error: any) {
            toast.error('Error updating message: ' + error.message);
        }
    };

    const deleteMessage = async (messageId: string) => {
        try {
            const { error } = await supabase
                .from('messages')
                .delete()
                .eq('id', messageId)
                .eq('user_id', user?.id);

            if (error) throw error;

            setMessages(prev => prev.filter(message => message.id !== messageId));
        } catch (error: any) {
            toast.error('Error deleting message: ' + error.message);
        }
    };

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        setNewMessage(prev => prev + emojiData.emoji);
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
        <div className="flex flex-col h-screen bg-background">
            <header className="border-b p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/dashboard')}
                        className="mr-1"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>

                    {otherParticipant && (
                        <>
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={otherParticipant.avatar_url} />
                                <AvatarFallback>
                                    {getInitials(otherParticipant.display_name, otherParticipant.email)}
                                </AvatarFallback>
                            </Avatar>
                            <h1 className="font-medium">
                                {otherParticipant.display_name || otherParticipant.email}
                            </h1>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <ThemeToggle />
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.user_id === user?.id ? 'justify-end' : 'justify-start'
                            }`}
                    >
                        <div
                            className={`flex gap-2 max-w-[80%] ${message.user_id === user?.id ? 'flex-row-reverse' : ''
                                }`}
                        >
                            <Avatar className="h-8 w-8 mt-1">
                                <AvatarImage src={message.user.avatar_url} />
                                <AvatarFallback>
                                    {getInitials(message.user.display_name, message.user.email)}
                                </AvatarFallback>
                            </Avatar>

                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs text-muted-foreground">
                                        {message.user_id === user?.id ? 'You' : message.user.display_name || message.user.email}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                    </span>
                                    {message.is_edited && (
                                        <span className="text-xs text-muted-foreground">(edited)</span>
                                    )}
                                </div>

                                {editingMessageId === message.id ? (
                                    <div className="flex flex-col gap-2">
                                        <Textarea
                                            value={editedContent}
                                            onChange={(e) => setEditedContent(e.target.value)}
                                            className="min-h-[60px]"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={cancelEditMessage}
                                            >
                                                <X className="h-4 w-4 mr-1" /> Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => saveEditedMessage(message.id)}
                                            >
                                                <Save className="h-4 w-4 mr-1" /> Save
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="group relative">
                                        <div
                                            className={`p-3 rounded-lg ${message.user_id === user?.id
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted'
                                                }`}
                                        >
                                            {message.content}
                                        </div>

                                        {message.user_id === user?.id && (
                                            <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => startEditMessage(message)}>
                                                            <Pencil className="h-4 w-4 mr-2" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => deleteMessage(message.id)}
                                                            className="text-destructive focus:text-destructive"
                                                        >
                                                            <Trash className="h-4 w-4 mr-2" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="border-t p-4">
                <form onSubmit={sendMessage} className="flex gap-2">
                    <div className="relative flex-1">
                        <Textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="min-h-[60px] pr-10"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (newMessage.trim()) {
                                        sendMessage(e);
                                    }
                                }
                            }}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 bottom-2"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        >
                            <Smile className="h-5 w-5" />
                        </Button>
                        {showEmojiPicker && (
                            <div className="absolute bottom-full right-0 mb-2">
                                <EmojiPicker onEmojiClick={handleEmojiClick} />
                            </div>
                        )}
                    </div>
                    <Button type="submit" disabled={isSubmitting || !newMessage.trim()}>
                        Send
                    </Button>
                </form>
            </div>
        </div>
    );
} 