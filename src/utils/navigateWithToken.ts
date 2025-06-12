import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export function useNavigateWithToken() {
  const router = useRouter();
  const { setAccessToken } = useAuthStore();

  // Function to wrap fetch calls and handle new access tokens
  const fetchWithToken = async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
    const accessToken = localStorage.getItem("accessToken");
    const headers = new Headers(init?.headers);
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
    const response = await fetch(input, {
      ...init,
      headers,
    });
    const newAccessToken = response.headers.get("X-New-Access-Token");
    if (newAccessToken) {
      setAccessToken(newAccessToken);
    }
    return response;
  };

  // Override Next.js router methods to include Authorization header
  useEffect(() => {
    const originalPush = router.push;
    router.push = async (href: string, options?: any) => {
      // Trigger a fetch to check if the route is protected and include token
      const response = await fetchWithToken(href, { method: "GET" });
      if (response.ok) {
        return originalPush(href, options);
      } else {
        // Handle redirect to login if needed
        return originalPush("/auth/login", options);
      }
    };

    return () => {
      router.push = originalPush;
    };
  }, [router]);

  return { ...router, fetchWithToken };
}
