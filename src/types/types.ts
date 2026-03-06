export type UserLogin = { username: string; password: string };

export const NotificationMessage = {
  Ok: "ok",
  Err: "err",
  Info: "info",
} as const;
export type NotificationMessageConst =
  (typeof NotificationMessage)[keyof typeof NotificationMessage];

export type Toast = {
  msg: string;
  type: NotificationMessageConst;
} | null;
