export type AuthSession = {
  userId: string;
} | null | undefined;

export function canAccessAppRoute(
  session: AuthSession,
  pathname: string,
): boolean {
  return Boolean(session?.userId && pathname.startsWith("/"));
}

export function getLoginRedirect(pathnameWithSearch: string): string {
  return `/login?next=${encodeURIComponent(pathnameWithSearch)}`;
}
