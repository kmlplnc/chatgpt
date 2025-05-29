import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  subscriptionStatus?: string;
  subscriptionEndDate?: string;
}

export default function Profile() {
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-muted rounded"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="text-center p-8 text-red-500">
          Profil bilgileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Profil Bilgileri</CardTitle>
          <CardDescription>
            Hesap bilgilerinizi buradan görüntüleyebilir ve düzenleyebilirsiniz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Ad Soyad</h3>
              <p className="mt-1">{profile.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">E-posta</h3>
              <p className="mt-1">{profile.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Üyelik Durumu</h3>
              <p className="mt-1">{profile.subscriptionStatus || "Ücretsiz"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Üyelik Bitiş Tarihi</h3>
              <p className="mt-1">
                {profile.subscriptionEndDate
                  ? format(new Date(profile.subscriptionEndDate), "d MMMM yyyy", {
                      locale: tr,
                    })
                  : "-"}
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button variant="outline">Şifre Değiştir</Button>
            <Button>Profili Düzenle</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 