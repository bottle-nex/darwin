export const DEFAULT_COLLECTION_PAGE_LIMIT = 50;
export const MAX_COLLECTION_PAGE_LIMIT = 100;

export type TupleCursor = {
    createdAt: Date;
    id: string;
};

export default class PaginationService {
    static older_than_cursor(cursor: TupleCursor) {
        return {
            OR: [
                { createdAt: { lt: cursor.createdAt } },
                { createdAt: cursor.createdAt, id: { lt: cursor.id } },
            ],
        };
    }
}
