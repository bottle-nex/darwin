import type { KanbanStatus } from "@/types/kanban";

/** DOM lookups against the `data-*` anchors added to the board for this feature. */

export function locateCard(issueId: string): HTMLElement | null {
    return document.querySelector<HTMLElement>(`[data-issue-id="${issueId}"]`);
}

export function locateColumn(status: KanbanStatus): HTMLElement | null {
    return document.querySelector<HTMLElement>(`[data-column-status="${status}"]`);
}

export function locateColumnList(columnEl: HTMLElement): HTMLElement | null {
    return columnEl.querySelector<HTMLElement>("[data-column-list]");
}

export function locateScrollRow(): HTMLElement | null {
    return document.querySelector<HTMLElement>("[data-kanban-scroll-row]");
}

export function rectCenter(rect: DOMRect) {
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

export function viewportCenter() {
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

/**
 * How far `container` needs to scroll along one axis to bring `target` into view,
 * centered — or null if at least 80% of `target` is already visible. The 80%
 * threshold (rather than requiring full containment) keeps a column-sized element
 * from being judged "off-screen" by a sliver.
 */
function centeredScrollDelta(
    start: number,
    end: number,
    containerStart: number,
    containerEnd: number,
) {
    const size = end - start;
    if (size <= 0) return null;
    const overlap = Math.max(0, Math.min(end, containerEnd) - Math.max(start, containerStart));
    if (overlap / size >= 0.8) return null;
    const containerSize = containerEnd - containerStart;
    return start - containerStart - (containerSize - size) / 2;
}

export function horizontalScrollDelta(columnEl: HTMLElement, rowEl: HTMLElement): number | null {
    const col = columnEl.getBoundingClientRect();
    const row = rowEl.getBoundingClientRect();
    return centeredScrollDelta(col.left, col.right, row.left, row.right);
}

export function verticalScrollDelta(cardEl: HTMLElement, listEl: HTMLElement): number | null {
    const card = cardEl.getBoundingClientRect();
    const list = listEl.getBoundingClientRect();
    return centeredScrollDelta(card.top, card.bottom, list.top, list.bottom);
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * rAF-driven scroll tween, returning a Promise that resolves on completion —
 * unlike `scrollIntoView({behavior:"smooth"})`, this can be awaited so the cursor
 * animation can wait for the scroll to actually settle before continuing.
 */
export function animateScrollTo(
    el: HTMLElement,
    axis: "left" | "top",
    delta: number,
    duration: number,
): Promise<void> {
    return new Promise((resolve) => {
        const start = axis === "left" ? el.scrollLeft : el.scrollTop;
        const target = start + delta;
        const startTime = performance.now();

        function step(now: number) {
            const t = Math.min(1, (now - startTime) / duration);
            const value = start + (target - start) * easeOutCubic(t);
            if (axis === "left") el.scrollLeft = value;
            else el.scrollTop = value;
            if (t < 1) requestAnimationFrame(step);
            else resolve();
        }
        requestAnimationFrame(step);
    });
}
