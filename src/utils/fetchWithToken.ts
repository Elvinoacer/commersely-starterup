export async function fetchWithToken(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const accessToken = localStorage.getItem("accessToken");
  const headers = new Headers(init?.headers);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return fetch(input, {
    ...init,
    headers,
  });
}
