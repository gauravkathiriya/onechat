"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useSupabase } from "./auth-provider";

interface ChatRequest {
  id: string;
  requester_id: string;
  recipient_id: string;
  message?: string;
  status: "pending" | "accepted" | "ignored";
  created_at: string;
  responded_at?: string;
  requester: {
    id: string;
    display_name?: string;
    avatar_url?: string;
    email: string;
  };
}

interface ChatUser {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  conversation_id?: string;
  last_message?: string;
  last_message_time?: string;
}

interface ChatContextType {
  // Chat Requests
  pendingRequests: ChatRequest[];
  isLoadingRequests: boolean;
  removeRequest: (requestId: string) => void;

  // Chat Users (for dashboard)
  chatUsers: ChatUser[];
  isLoadingUsers: boolean;
  fetchChatHistory: () => Promise<void>;

  // Actions
  startNewChat: (
    email: string
  ) => Promise<{ success: boolean; message: string; conversationId?: string }>;
  acceptChatRequest: (
    requestId: string
  ) => Promise<{ success: boolean; message: string; conversationId?: string }>;
  ignoreChatRequest: (
    requestId: string
  ) => Promise<{ success: boolean; message: string }>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { supabase, user } = useSupabase();

  // Chat Requests State
  const [pendingRequests, setPendingRequests] = useState<ChatRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  // Chat Users State
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Refs to prevent infinite loops
  const hasInitializedRequests = useRef(false);
  const hasInitializedUsers = useRef(false);

  // Fetch chat requests
  const fetchChatRequests = useCallback(async () => {
    if (!user || !supabase) return;

    try {
      const { data, error } = await supabase
        .from("chat_requests")
        .select(
          `
          id,
          requester_id,
          recipient_id,
          message,
          status,
          created_at,
          responded_at,
          requester:profiles!chat_requests_requester_id_fkey(
            id,
            display_name,
            avatar_url,
            email
          )
        `
        )
        .eq("recipient_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        if (
          error.code === "PGRST116" ||
          error.message?.includes('relation "chat_requests" does not exist')
        ) {
          console.log(
            "Chat requests table not found. Please run the database setup first."
          );
          setPendingRequests([]);
        } else {
          throw error;
        }
      } else {
        setPendingRequests((data as unknown as ChatRequest[]) || []);
      }
    } catch (error) {
      console.error("Error fetching pending chat requests:", error);
      setPendingRequests([]);
    } finally {
      setIsLoadingRequests(false);
    }
  }, []);

  // Fetch chat history (conversations)
  const fetchChatHistory = useCallback(async () => {
    if (!user || !supabase) return;

    setIsLoadingUsers(true);
    try {
      const { data: conversations, error } = await supabase
        .from("conversations")
        .select(
          `
          id,
          created_at,
          updated_at,
          participant_ids,
          conversation_participants!inner(
            user_id,
            user:profiles!conversation_participants_user_id_fkey(
              id,
              email,
              display_name,
              avatar_url
            )
          )
        `
        )
        .contains("participant_ids", [user.id])
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const users: ChatUser[] = [];
      conversations?.forEach((conversation) => {
        const otherParticipants = conversation.conversation_participants
          .filter((p: any) => p.user_id !== user.id)
          .map((p: any) => ({
            id: p.user.id,
            email: p.user.email,
            display_name: p.user.display_name,
            avatar_url: p.user.avatar_url,
            conversation_id: conversation.id,
          }));
        users.push(...otherParticipants);
      });

      setChatUsers(users);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [supabase, user]);

  // Start new chat (create chat request)
  const startNewChat = useCallback(
    async (email: string) => {
      if (!user || !supabase) {
        return { success: false, message: "User not authenticated" };
      }

      try {
        // Check if the user exists
        const { data: targetUser, error: userError } = await supabase
          .from("profiles")
          .select("id, email, display_name, avatar_url")
          .eq("email", email.toLowerCase())
          .single();

        if (userError || !targetUser) {
          return { success: false, message: "User not found with that email" };
        }

        // Check if user is trying to chat with themselves
        if (targetUser.id === user.id) {
          return {
            success: false,
            message: "You cannot start a chat with yourself",
          };
        }

        // Check if a conversation already exists
        const { data: existingConversation, error: convError } = await supabase
          .from("conversations")
          .select("id")
          .contains("participant_ids", [user.id, targetUser.id])
          .single();

        // If conversation already exists, return the conversation ID
        if (existingConversation) {
          return {
            success: true,
            message: "Conversation already exists",
            conversationId: existingConversation.id,
          };
        }

        // Check if there's already a pending chat request
        const { data: existingRequest, error: requestError } = await supabase
          .from("chat_requests")
          .select("id, status")
          .eq("requester_id", user.id)
          .eq("recipient_id", targetUser.id)
          .eq("status", "pending")
          .single();

        if (requestError && requestError.code !== "PGRST116") {
          throw requestError;
        }

        if (existingRequest) {
          return {
            success: false,
            message: "You already have a pending chat request with this user",
          };
        }

        // Create a chat request
        const { data: chatRequest, error: createError } = await supabase
          .from("chat_requests")
          .insert({
            requester_id: user.id,
            recipient_id: targetUser.id,
            message: `Hi! I'd like to start a conversation with you.`,
          })
          .select("id")
          .single();

        if (createError) {
          if (
            createError.code === "PGRST116" ||
            createError.message?.includes(
              'relation "chat_requests" does not exist'
            )
          ) {
            return {
              success: false,
              message:
                "Chat requests feature is not set up yet. Please run the database setup first.",
            };
          }
          throw createError;
        }

        return {
          success: true,
          message: `Chat request sent to ${
            targetUser.display_name || targetUser.email
          }! They will receive a notification to accept or ignore your request.`,
        };
      } catch (error: any) {
        console.error("Error starting new chat:", error);
        return { success: false, message: "Failed to send chat request" };
      }
    },
    [supabase, user]
  );

  // Accept chat request
  const acceptChatRequest = useCallback(
    async (requestId: string) => {
      if (!user || !supabase) {
        return { success: false, message: "User not authenticated" };
      }

      try {
        const { data: conversationId, error } = await supabase.rpc(
          "accept_chat_request",
          { request_id: requestId }
        );

        if (error) throw error;

        // Refresh chat history to include the new conversation
        await fetchChatHistory();

        return {
          success: true,
          message: "Chat request accepted! Starting conversation...",
          conversationId,
        };
      } catch (error: any) {
        console.error("Error accepting chat request:", error);
        return { success: false, message: "Failed to accept chat request" };
      }
    },
    [supabase, user, fetchChatHistory]
  );

  // Ignore chat request
  const ignoreChatRequest = useCallback(
    async (requestId: string) => {
      if (!user || !supabase) {
        return { success: false, message: "User not authenticated" };
      }

      try {
        const { error } = await supabase.rpc("ignore_chat_request", {
          request_id: requestId,
        });

        if (error) throw error;

        return { success: true, message: "Chat request ignored" };
      } catch (error: any) {
        console.error("Error ignoring chat request:", error);
        return { success: false, message: "Failed to ignore chat request" };
      }
    },
    [supabase, user]
  );

  // Remove request from state (for UI updates)
  const removeRequest = useCallback((requestId: string) => {
    setPendingRequests((prev) => prev.filter((req) => req.id !== requestId));
  }, []);

  // Initialize chat requests subscription
  useEffect(() => {
    if (!user || !supabase || hasInitializedRequests.current) {
      return;
    }

    hasInitializedRequests.current = true;

    // Fetch initial data
    fetchChatRequests();

    // Subscribe to new chat requests
    const chatRequestsChannel = supabase
      .channel("chat_requests")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_requests",
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("New chat request received:", payload);
          // Fetch the complete request with requester details
          supabase
            .from("chat_requests")
            .select(
              `
              id,
              requester_id,
              recipient_id,
              message,
              status,
              created_at,
              responded_at,
              requester:profiles!chat_requests_requester_id_fkey(
                id,
                display_name,
                avatar_url,
                email
              )
            `
            )
            .eq("id", payload.new.id)
            .single()
            .then(({ data, error }) => {
              if (error) {
                console.error(
                  "Error fetching new chat request details:",
                  error
                );
                return;
              }
              if (data) {
                console.log("Adding new chat request to state:", data);
                setPendingRequests((prev) => [
                  data as unknown as ChatRequest,
                  ...prev,
                ]);
              }
            });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_requests",
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          // Remove the request from pending list if it's no longer pending
          if (payload.new.status !== "pending") {
            setPendingRequests((prev) =>
              prev.filter((req) => req.id !== payload.new.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      hasInitializedRequests.current = false;
      supabase.removeChannel(chatRequestsChannel);
    };
  }, [user?.id, supabase]);

  // Initialize chat history when user changes
  useEffect(() => {
    if (!user || !supabase || hasInitializedUsers.current) {
      return;
    }

    hasInitializedUsers.current = true;
    fetchChatHistory();

    return () => {
      hasInitializedUsers.current = false;
    };
  }, [user?.id, supabase, fetchChatHistory]);

  const value: ChatContextType = {
    pendingRequests,
    isLoadingRequests,
    removeRequest,
    chatUsers,
    isLoadingUsers,
    fetchChatHistory,
    startNewChat,
    acceptChatRequest,
    ignoreChatRequest,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
