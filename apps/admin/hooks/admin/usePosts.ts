"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PostKind, PostStatus, ReleaseChannel } from "@trymatcha/types";
import { apiClient } from "@/lib/api";
import { POSTS_URL, post_url } from "@/routes/api_routes";

export type PostRow = {
    id: string;
    kind: PostKind;
    slug: string;
    title: string;
    summary: string | null;
    status: PostStatus;
    version: string | null;
    channel: ReleaseChannel | null;
    author: string | null;
    readingTime: number;
    publishedAt: string | null;
    updatedAt: string;
};

export type PostDetail = PostRow & {
    content: string;
    plainText: string;
    coverImage: string | null;
    tags: string[];
};

export type PostInput = {
    kind: PostKind;
    title: string;
    slug?: string;
    summary?: string;
    author?: string;
    coverImage?: string;
    tags: string[];
    version?: string;
    channel?: ReleaseChannel;
    content: string;
    status: PostStatus;
};

const POSTS_KEY = ["admin", "posts"] as const;

export function usePosts() {
    return useQuery({
        queryKey: POSTS_KEY,
        queryFn: async () => {
            const { data } = await apiClient.get(POSTS_URL);
            return data.data as PostRow[];
        },
    });
}

export function usePost(id: string | undefined) {
    return useQuery({
        queryKey: [...POSTS_KEY, id],
        enabled: Boolean(id),
        queryFn: async () => {
            const { data } = await apiClient.get(post_url(id!));
            return data.data as PostDetail;
        },
    });
}

export function useCreatePost() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: PostInput) => {
            const { data } = await apiClient.post(POSTS_URL, input);
            return data.data as PostDetail;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: POSTS_KEY }),
    });
}

export function useUpdatePost(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: PostInput) => {
            const { data } = await apiClient.patch(post_url(id), input);
            return data.data as PostDetail;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: POSTS_KEY }),
    });
}

export function useDeletePost() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(post_url(id));
            return id;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: POSTS_KEY }),
    });
}
