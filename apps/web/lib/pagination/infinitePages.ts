import type { InfiniteData } from "@tanstack/react-query";
import type { CursorPage } from "@trydarwin/types";

type Identifiable = {
    id: string;
};

export function flattenInfinitePages<T extends Identifiable>(pages: readonly CursorPage<T>[]) {
    const itemIds = new Set<string>();

    return pages.flatMap((page) =>
        page.items.filter((item) => {
            if (itemIds.has(item.id)) return false;
            itemIds.add(item.id);
            return true;
        }),
    );
}

export function mapInfinitePages<T extends Identifiable, TPageParam>(
    data: InfiniteData<CursorPage<T>, TPageParam>,
    mapItems: (items: T[]) => T[],
) {
    let changedPages: CursorPage<T>[] | undefined;

    data.pages.forEach((page, pageIndex) => {
        const items = mapItems(page.items);
        if (items === page.items) return;

        changedPages ??= data.pages.slice();
        changedPages[pageIndex] = { ...page, items };
    });

    return changedPages ? { ...data, pages: changedPages } : data;
}

export function updateInfinitePageItem<T extends Identifiable, TPageParam>(
    data: InfiniteData<CursorPage<T>, TPageParam>,
    itemId: string,
    updateItem: (item: T) => T,
) {
    return mapInfinitePages(data, (items) => {
        const itemIndex = items.findIndex((item) => item.id === itemId);
        if (itemIndex === -1) return items;

        const updatedItem = updateItem(items[itemIndex]);
        if (updatedItem === items[itemIndex]) return items;

        const updatedItems = items.slice();
        updatedItems[itemIndex] = updatedItem;
        return updatedItems;
    });
}

export function removeInfinitePageItem<T extends Identifiable, TPageParam>(
    data: InfiniteData<CursorPage<T>, TPageParam>,
    itemId: string,
) {
    return mapInfinitePages(data, (items) => {
        const itemIndex = items.findIndex((item) => item.id === itemId);
        if (itemIndex === -1) return items;

        return [...items.slice(0, itemIndex), ...items.slice(itemIndex + 1)];
    });
}

export function replaceInfinitePageItem<T extends Identifiable, TPageParam>(
    data: InfiniteData<CursorPage<T>, TPageParam>,
    optimisticItemId: string,
    confirmedItem: T,
) {
    const hasOptimisticItem = data.pages.some((page) =>
        page.items.some((item) => item.id === optimisticItemId),
    );
    if (!hasOptimisticItem) return data;

    return mapInfinitePages(data, (items) => {
        let updatedItems: T[] | undefined;

        items.forEach((item, itemIndex) => {
            const shouldReplace = item.id === optimisticItemId;
            const shouldRemove = item.id === confirmedItem.id;
            if (!shouldReplace && !shouldRemove) {
                updatedItems?.push(item);
                return;
            }

            updatedItems ??= items.slice(0, itemIndex);
            if (shouldReplace) updatedItems.push(confirmedItem);
        });

        return updatedItems ?? items;
    });
}
