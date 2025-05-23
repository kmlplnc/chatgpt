interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include", // Include cookies in the request
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.message || "Bir hata oluştu",
      };
    }

    return {
      ok: true,
      data,
    };
  } catch (error) {
    console.error("API request error:", error);
    return {
      ok: false,
      error: "Sunucu ile iletişim kurulamadı",
    };
  }
} 