import { getServerSession } from "next-auth";
import { authOptions } from "../../app/api/auth/[...nextauth]/route";

export async function request<TResponse>(
  url: string,
  config?: RequestInit
): Promise<TResponse> {
  const response = await fetch(url, config);
  return await response.json();
}

export async function requestWithAuth<TResponse>(
  url: string,
  config?: RequestInit
): Promise<TResponse> {
  const session = await getServerSession(authOptions);

  if (!session?.idToken) {
    throw new Error("Access token not found in session");
  }

  const headers = {
    ...config?.headers,
    Authorization: session.idToken,
  };

  const modifiedConfig: RequestInit = { ...config, headers };

  return await request(url, modifiedConfig);
}