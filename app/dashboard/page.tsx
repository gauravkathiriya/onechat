'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/lib/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { toast } from 'sonner';
import {
    PlusCircle,
    MessageSquare,
    Search,
    LogOut,
    Settings,
    UserCircle,
    Globe,
    Users,
    Calendar,
    RefreshCcw
} from 'lucide-react';
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
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from 'next/link';

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
    const [searchQuery, setSearchQuery] = useState('');
    const [hasFetchedHistory, setHasFetchedHistory] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        } else if (user && !hasFetchedHistory) {
            // Fetch chat history only once when component mounts and user is available
            fetchChatHistory();
            setHasFetchedHistory(true);
        }
    }, [isLoading, user, router, hasFetchedHistory]); // Added hasFetchedHistory to dependencies

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

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut();
            toast.success('Signed out successfully');
            router.push('/login');
        } catch (error) {
            toast.error('Failed to sign out');
        }
    };

    const filteredChatUsers = chatUsers.filter((chatUser) => {
        const name = chatUser.display_name || chatUser.email;
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-16 w-16 bg-muted rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-muted rounded mb-3"></div>
                    <div className="h-3 w-24 bg-muted rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Sidebar */}
            <div className="flex flex-col md:flex-row h-screen">
                <aside className="w-full md:w-64 border-r bg-card md:h-screen">
                    <div className="p-4 border-b flex items-center justify-between">
                        <div className="flex items-center">
                            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">One</span>
                            <span className="text-xl font-bold">Chat</span>
                        </div>
                        <ThemeToggle />
                    </div>

                    {user && (
                        <div className="p-4 border-b">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="w-full flex items-center justify-start gap-2 hover:bg-accent">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.user_metadata?.avatar_url} />
                                            <AvatarFallback>
                                                {getInitials(
                                                    user.user_metadata?.display_name,
                                                    user.email
                                                )}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col items-start overflow-hidden">
                                            <span className="font-medium truncate w-full">
                                                {user.user_metadata?.display_name || user.email}
                                            </span>
                                            <span className="text-xs text-muted-foreground truncate w-full">
                                                {user.email}
                                            </span>
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="cursor-pointer" asChild>
                                        <Link href="/profile" className="flex items-center">
                                            <UserCircle className="mr-2 h-4 w-4" />
                                            Profile
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer" asChild>
                                        <Link href="/settings" className="flex items-center">
                                            <Settings className="mr-2 h-4 w-4" />
                                            Settings
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="cursor-pointer text-red-500 focus:text-red-500"
                                        onClick={handleSignOut}
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Sign out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}

                    <div className="p-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Quick Stats</h3>
                        <div className="grid grid-cols-2 gap-2 mb-6">
                            <Card className="p-3">
                                <div className="flex flex-col">
                                    <span className="text-xl font-bold">{chatUsers.length}</span>
                                    <span className="text-xs text-muted-foreground">Contacts</span>
                                </div>
                            </Card>
                            <Card className="p-3">
                                <div className="flex flex-col">
                                    <span className="text-xl font-bold">
                                        {chatUsers.filter(u => u.last_message_time).length}
                                    </span>
                                    <span className="text-xs text-muted-foreground">Active Chats</span>
                                </div>
                            </Card>
                        </div>

                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Navigation</h3>
                        <div className="space-y-1">
                            <Button variant="ghost" className="w-full justify-start gap-2">
                                <Users className="h-4 w-4" />
                                Contacts
                            </Button>
                            <Button variant="ghost" className="w-full justify-start gap-2">
                                <Calendar className="h-4 w-4" />
                                Schedule
                            </Button>
                        </div>
                    </div>
                </aside>

                {/* Main content */}
                <main className="flex-1 flex flex-col h-screen overflow-hidden">
                    <header className="border-b p-4 flex justify-between items-center bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                        <h1 className="text-xl font-bold">Your Conversations</h1>

                        <div className="flex items-center gap-2">
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search conversations..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={async () => {
                                    try {
                                        setHasFetchedHistory(false);
                                        await fetchChatHistory();
                                        toast.success('Conversations refreshed');
                                    } catch (error) {
                                        console.error('Error refreshing conversations:', error);
                                        toast.error('Failed to refresh conversations');
                                    } finally {
                                        setHasFetchedHistory(true);
                                    }
                                }}
                                title="Refresh conversations"
                            >
                                <RefreshCcw className="h-4 w-4" />
                            </Button>

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
                    </header>

                    <div className="flex-1 p-6 overflow-y-auto">
                        {filteredChatUsers.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="bg-primary/10 rounded-full p-6 mb-4">
                                    <MessageSquare className="h-12 w-12 text-primary" />
                                </div>
                                <h3 className="text-xl font-medium mb-2">No conversations yet</h3>
                                <p className="text-muted-foreground max-w-sm">
                                    {searchQuery
                                        ? 'No conversations match your search. Try a different term.'
                                        : 'Start chatting by clicking the "New Chat" button above.'}
                                </p>
                                {searchQuery && (
                                    <Button
                                        variant="link"
                                        onClick={() => setSearchQuery('')}
                                        className="mt-2"
                                    >
                                        Clear search
                                    </Button>
                                )}
                                {!searchQuery && (
                                    <Button
                                        onClick={() => setIsDialogOpen(true)}
                                        className="mt-4"
                                    >
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Start New Chat
                                    </Button>
                                )}
                            </div>
                        )}

                        {filteredChatUsers.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredChatUsers.map((chatUser) => (
                                    <Card
                                        key={chatUser.id}
                                        className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                                        onClick={() => goToChat(chatUser.conversation_id!)}
                                    >
                                        <CardHeader className="p-4 pb-0">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 border-2 border-background">
                                                        <AvatarImage src={chatUser.avatar_url} />
                                                        <AvatarFallback className="bg-primary/10 text-primary">
                                                            {getInitials(chatUser.display_name, chatUser.email)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <h3 className="font-medium line-clamp-1">
                                                            {chatUser.display_name || chatUser.email}
                                                        </h3>
                                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                                            {chatUser.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                {chatUser.last_message_time && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {formatDistanceToNow(new Date(chatUser.last_message_time), {
                                                            addSuffix: true,
                                                            includeSeconds: true
                                                        })}
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4">
                                            {chatUser.last_message ? (
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {chatUser.last_message}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-muted-foreground italic">
                                                    No messages yet. Start a conversation!
                                                </p>
                                            )}
                                        </CardContent>
                                        <CardFooter className="p-3 bg-muted/30 border-t flex justify-between">
                                            <span className="text-xs text-muted-foreground">
                                                Click to continue conversation
                                            </span>
                                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
} 