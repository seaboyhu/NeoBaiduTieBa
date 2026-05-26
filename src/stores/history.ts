import { defineStore } from 'pinia';
import { ref } from 'vue';

export type HistoryItemType = 'thread' | 'bar' | 'user';

export interface HistoryItem {
    id: string;
    type: HistoryItemType;
    title: string;
    target: string;
    icon: string;
    timestamp: number;
}

export const useHistoryStore = defineStore('history', () => {
    const items = ref<HistoryItem[]>([]);

    function addHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>): void {
        const id = `${item.type}:${item.target}`;
        items.value = [
            {
                ...item,
                id,
                timestamp: Date.now(),
            },
            ...items.value.filter(existing => existing.id !== id),
        ].slice(0, 100);
    }

    function clearHistory(): void {
        items.value = [];
    }

    return {
        items,
        addHistory,
        clearHistory,
    };
}, {
    persist: {
        storage: localStorage,
    },
});
