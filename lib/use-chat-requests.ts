"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const hasInitialized = useRef(false);

  // Fetch initial data
  const fetchData = useCallback(async () => {
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
        setPendingRequests((data as unknown as ChatRequest[]) || []);
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
    if (!user || !supabase || hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;

    // Fetch initial data
    fetchData();

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
      .subscribe((status) => {});

    return () => {
      hasInitialized.current = false;
      supabase.removeChannel(chatRequestsChannel);
    };
  }, [user?.id, supabase, fetchData]);

  // Remove a request from the pending list (for UI updates)
  const removeRequest = (requestId: string) => {
    setPendingRequests((prev) => prev.filter((req) => req.id !== requestId));
  };

  return {
    pendingRequests,
    isLoading,
    removeRequest,
  };
}
