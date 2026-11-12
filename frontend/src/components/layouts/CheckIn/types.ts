export type RecentScanStatus = "success" | "duplicate" | "checked_out" | "not_checked_in" | "error";

export interface RecentScan {
    id: string;
    name: string;
    code: string;
    status: RecentScanStatus;
    seatLabel: string | null;
    timestamp: number;
}
