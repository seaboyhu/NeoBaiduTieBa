export type ApiErrorKind = 'network' | 'business' | 'auth' | 'empty' | 'unknown';

export type ApiResult<T> =
    | { ok: true; data: T; hasMore?: boolean }
    | { ok: false; kind: ApiErrorKind; message: string; code?: string | number };

export interface PageState {
    loading: boolean;
    refreshing: boolean;
    error: string;
    hasMore: boolean;
    page: number;
}

export interface StableUser {
    id: string;
    name: string;
    displayName: string;
    avatar: string;
    level?: number;
    ipAddress?: string;
}

export interface StablePost {
    id: string;
    tid?: string;
    authorId: string;
    author?: StableUser;
    title?: string;
    content: unknown[];
    createdAt: number;
    floor?: number;
    replyCount: number;
    agreeCount: number;
}

export interface ThreadPage {
    tid: string;
    title: string;
    forumName: string;
    forumAvatar: string;
    posts: StablePost[];
    users: StableUser[];
    hasMore: boolean;
}

export interface BarPage {
    name: string;
    avatar: string;
    slogan: string;
    threads: StablePost[];
    pinnedThreads: StablePost[];
    hasMore: boolean;
}

export interface UserProfile {
    id: string;
    name: string;
    displayName: string;
    avatar: string;
    raw: unknown;
}

export interface UserPostPage {
    userId: string;
    posts: StablePost[];
    hasMore: boolean;
    raw: unknown;
}
