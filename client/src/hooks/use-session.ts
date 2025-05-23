import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/query-client";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

interface Session {
  user: User;
  sessionToken: string;
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // 1 saniye

    const loadSession = async () => {
      try {
        const response = await apiRequest<Session>("/api/auth/session", {
          method: "GET",
        });

        if (response.ok) {
          setSession(response.data);
          setError(null);
        } else {
          setError(response.error || "Oturum bilgisi alınamadı");
          setSession(null);
        }
      } catch (err) {
        console.error("Session yükleme hatası:", err);
        setError("Oturum bilgisi alınamadı");
        setSession(null);

        // Retry logic
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(loadSession, retryDelay * retryCount);
        }
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  return { session, loading, error };
} 