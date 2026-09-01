export interface SolveReport {
    id: string;
    attemptNumber: number;
    model: string | null;
    report: string;
    startedAt: string;
    endedAt: string | null;
}
