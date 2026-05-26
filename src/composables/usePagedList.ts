import { ref, shallowRef } from 'vue';

export interface PagedListOptions<T> {
    initialPage?: number;
    loadPage: (page: number) => Promise<{ items: T[]; hasMore: boolean }>;
}

export function usePagedList<T>(options: PagedListOptions<T>) {
    const page = ref(options.initialPage ?? 1);
    const items = shallowRef<T[]>([]);
    const loading = ref(false);
    const error = ref('');
    const hasMore = ref(true);

    async function load(reset = false): Promise<void> {
        if (loading.value) {
            return;
        }

        loading.value = true;
        error.value = '';

        try {
            if (reset) {
                page.value = options.initialPage ?? 1;
                items.value = [];
                hasMore.value = true;
            }

            const result = await options.loadPage(page.value);
            items.value = reset ? result.items : [...items.value, ...result.items];
            hasMore.value = result.hasMore;
        } catch (caught) {
            error.value = caught instanceof Error ? caught.message : String(caught);
            hasMore.value = false;
        } finally {
            loading.value = false;
        }
    }

    async function loadNext(): Promise<void> {
        if (!hasMore.value || loading.value) {
            return;
        }

        page.value += 1;
        await load();
    }

    return {
        page,
        items,
        loading,
        error,
        hasMore,
        load,
        loadNext,
    };
}
