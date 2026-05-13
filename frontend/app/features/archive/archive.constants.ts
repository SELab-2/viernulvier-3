export const ARCHIVE_PERMISSIONS = {
  create: "archive:create",
  update: "archive:update",
  delete: "archive:delete",
} as const;

export type ArchivePermission = typeof ARCHIVE_PERMISSIONS[keyof typeof ARCHIVE_PERMISSIONS];
