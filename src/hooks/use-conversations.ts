import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Conversation {
  id: string;
  title: string | null;
  updated_at: string | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  feedback: string | null;
  created_at: string;
  suggested_actions: Record<string, unknown> | null;
}

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await fetch('/api/conversations');
      if (!res.ok) throw new Error('Failed to load conversations');
      const data = await res.json();
      return data.conversations;
    },
  });
}

export function useMessages(conversationId: string | null) {
  return useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages?limit=100`
      );
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();
      return data.messages;
    },
    enabled: !!conversationId,
  });
}

export function useInvalidateConversations() {
  const queryClient = useQueryClient();
  return {
    invalidateConversations: () =>
      queryClient.invalidateQueries({ queryKey: ['conversations'] }),
    invalidateMessages: (conversationId: string) =>
      queryClient.invalidateQueries({
        queryKey: ['messages', conversationId],
      }),
  };
}
