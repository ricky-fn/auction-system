import { Session } from "next-auth";
import { SessionContextValue } from "next-auth/react";

export const useMockSession = (session?: Omit<SessionContextValue, 'update'>) => {
  const mockSession: Session = {
    expires: new Date(Date.now() + 2 * 86400).toISOString(),
    user: { name: "admin" }
  };

  return {
    useSession: jest.fn(() => {
      const result: Omit<SessionContextValue, 'update'> = {
        data: mockSession,
        status: 'unauthenticated',
        ...session
      };
      return result;
    }),
  };
}