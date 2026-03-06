export const NotificationType = {
  Ok: "ok",
  Err: "err",
  Info: "info",
} as const;
export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export interface Notification {
  message: string;
  type: NotificationType;
}
