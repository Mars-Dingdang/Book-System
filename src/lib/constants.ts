export const ROLES = ["USER", "ADMIN"] as const;
export const APPROVAL_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export const COPY_STATUSES = ["AVAILABLE", "BORROWED", "LOST", "DAMAGED"] as const;
export const BORROW_STATUSES = ["BORROWED", "RETURNED", "OVERDUE", "LOST"] as const;
export const SOURCE_TYPES = ["ORIGINAL", "PHOTOCOPY", "HANDOUT", "INTERNAL", "OTHER"] as const;

export type Role = (typeof ROLES)[number];
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];
export type CopyStatus = (typeof COPY_STATUSES)[number];
export type BorrowStatus = (typeof BORROW_STATUSES)[number];
export type SourceType = (typeof SOURCE_TYPES)[number];
