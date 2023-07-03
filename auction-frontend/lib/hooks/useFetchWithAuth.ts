import { getServerSession } from "next-auth";
import { authOptions } from "../../app/api/auth/[...nextauth]/route";

const useFetchWithAuth = async (): Promise<(url: string, options?: RequestInit) => Promise<Response>> => {
  const session = await getServerSession(authOptions);

  if (!(session as any).idToken) {
    throw new Error('Access token not found in session');
  }

  return (url: string, options: RequestInit = {}) => {
    const headers = {
      ...options.headers,
      Authorization: session!.idToken,
    };

    const modifiedOptions: RequestInit = { ...options, headers };

    return fetch(url, modifiedOptions);
  };
};

export default useFetchWithAuth;