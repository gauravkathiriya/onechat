'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSupabase } from '@/lib/auth-provider';
import { toast } from 'sonner';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { Edit2, MoreVertical, Pencil, Save, Smile, Trash, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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
    last_seen?: string;
  };
}

interface UserStatus {
  id: string;
  display_name?: string;
  avatar_url?: string;
  last_seen?: string;
  is_online: boolean;
}

export default function ChatPage() {
  const { supabase, user, isLoading, signOut } = useSupabase();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<UserStatus[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [showUsersDialog, setShowUsersDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);
  
  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, user:profiles(id, display_name, avatar_url, email, last_seen)')
        .order('created_at', { ascending: true })
        .limit(100);
        
      if (error) throw error;
      setMessages(data || []);
      scrollToBottom();
    } catch (error: any) {
      toast.error('Error fetching messages: ' + error.message);
    }
  };

  const fetchOnlineUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, last_seen')
        .order('last_seen', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Consider users who were active in the last 5 minutes as online
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      setOnlineUsers(
        data.map(profile => ({
          ...profile,
          is_online: profile.last_seen ? new Date(profile.last_seen) > new Date(fiveMinutesAgo) : false
        }))
      );
    } catch (error: any) {
      console.error('Error fetching online users:', error);
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchMessages();
      fetchOnlineUsers();
      
      // Subscribe to new messages
      const messagesChannel = supabase
        .channel('public:messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        }, async (payload) => {
          // When a new message comes in, fetch the complete message with user details
          const { data, error } = await supabase
            .from('messages')
            .select('*, user:profiles(id, display_name, avatar_url, email, last_seen)')
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
          table: 'messages'
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

      // Subscribe to profile changes for online status
      const profilesChannel = supabase
        .channel('public:profiles')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        }, (payload) => {
          // Update last seen status
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
          
          setOnlineUsers(prev => 
            prev.map(profile => 
              profile.id === payload.new.id 
                ? { 
                    ...profile, 
                    ...payload.new,
                    is_online: payload.new.last_seen ? 
                      new Date(payload.new.last_seen) > new Date(fiveMinutesAgo) : 
                      false 
                  } 
                : profile
            )
          );
        })
        .subscribe();
        
      // Update user's last_seen every minute
      const interval = setInterval(async () => {
        try {
          await supabase
            .from('profiles')
            .update({ last_seen: new Date().toISOString() })
            .eq('id', user.id);
        } catch (error) {
          console.error('Error updating last_seen:', error);
        }
      }, 60000);
      
      return () => {
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(profilesChannel);
        clearInterval(interval);
      };
    }
  }, [supabase, user]);
  
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
          }
        ]);
        
      if (error) throw error;
      
      setNewMessage('');
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
      const { data, error } = await supabase
        .rpc('update_message', {
          message_id: messageId,
          new_content: editedContent.trim()
        });

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
      toast.success('Message deleted');
    } catch (error: any) {
      toast.error('Error deleting message: ' + error.message);
    }
  };
  
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    if (editingMessageId) {
      setEditedContent(prev => prev + emojiData.emoji);
    } else {
      setNewMessage(prev => prev + emojiData.emoji);
    }
    setShowEmojiPicker(false);
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return '?';
  };

  const isUserOnline = (userId: string) => {
    const userStatus = onlineUsers.find(u => u.id === userId);
    return userStatus?.is_online || false;
  };
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">OneChat</h1>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              fetchOnlineUsers();
              setShowUsersDialog(true);
            }}
          >
            <Badge className="mr-2" variant="outline">
              {onlineUsers.filter(u => u.is_online).length}
            </Badge>
            Online Users
          </Button>
          
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
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-2 ${
              message.user_id === user?.id ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.user_id !== user?.id && (
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.user?.avatar_url} />
                  <AvatarFallback>
                    {getInitials(
                      message.user?.display_name,
                      message.user?.email
                    )}
                  </AvatarFallback>
                </Avatar>
                {isUserOnline(message.user.id) && (
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-1 ring-white" />
                )}
              </div>
            )}
            
            <div
              className={`max-w-[70%] px-4 py-2 rounded-lg ${
                message.user_id === user?.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              {message.user_id !== user?.id && (
                <p className="text-xs font-medium mb-1">
                  {message.user?.display_name || message.user?.email}
                </p>
              )}
              
              {editingMessageId === message.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="min-h-[60px] text-black dark:text-white bg-white dark:bg-gray-800 border-0"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        saveEditedMessage(message.id);
                      } else if (e.key === 'Escape') {
                        cancelEditMessage();
                      }
                    }}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={cancelEditMessage}
                      className="h-7 px-2 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" /> Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => saveEditedMessage(message.id)}
                      className="h-7 px-2 text-xs"
                    >
                      <Save className="h-3 w-3 mr-1" /> Save
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
              
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs opacity-70">
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {message.is_edited && (
                    <span className="ml-1">(edited)</span>
                  )}
                </p>
                
                {message.user_id === user?.id && !editingMessageId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => startEditMessage(message)}>
                        <Pencil className="h-3.5 w-3.5 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteMessage(message.id)}
                        className="text-red-500 focus:text-red-500"
                      >
                        <Trash className="h-3.5 w-3.5 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
            
            {message.user_id === user?.id && (
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
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t p-4">
        <form onSubmit={sendMessage} className="flex gap-2 relative">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="min-h-[60px] flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e);
              }
            }}
          />
          
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="h-5 w-5" />
            </Button>
            
            <Button type="submit" disabled={isSubmitting || !newMessage.trim()}>
              Send
            </Button>
          </div>
          
          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-2">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}
        </form>
      </div>

      <Dialog open={showUsersDialog} onOpenChange={setShowUsersDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Online Users</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {onlineUsers.map(user => (
                <div key={user.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>
                        {getInitials(user.display_name, '')}
                      </AvatarFallback>
                    </Avatar>
                    {user.is_online && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-1 ring-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{user.display_name}</p>
                    <p className="text-xs text-gray-500">
                      {user.is_online 
                        ? 'Online now' 
                        : user.last_seen 
                          ? `Last seen ${formatDistanceToNow(new Date(user.last_seen))} ago` 
                          : 'Never seen'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}