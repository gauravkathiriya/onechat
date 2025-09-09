"use client";

import { useState, useEffect, useCallback } from "react";
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

export function useChatRequests() {
  const { supabase, user } = useSupabase();
  const [pendingRequests, setPendingRequests] = useState<ChatRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch pending chat requests for the current user
  const fetchPendingRequests = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

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
        // If table doesn't exist, just set empty array and don't show error
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
        setPendingRequests([]);
      }
    } catch (error) {
      console.error("Error fetching pending chat requests:", error);
      setPendingRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user]);

  // Set up real-time subscription for chat requests
  useEffect(() => {
    if (!user) return;

    // Fetch initial data
    fetchPendingRequests();

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
                setPendingRequests((data as unknown as ChatRequest[]) ?? []);
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
      supabase.removeChannel(chatRequestsChannel);
    };
  }, []);

  // Remove a request from the pending list (for UI updates)
  const removeRequest = (requestId: string) => {
    setPendingRequests((prev) => prev.filter((req) => req.id !== requestId));
  };

  return {
    pendingRequests,
    isLoading,
    removeRequest,
    refetch: fetchPendingRequests,
  };
}
