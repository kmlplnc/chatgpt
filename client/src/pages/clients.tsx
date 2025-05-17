import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, UserPlus, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  occupation: string | null;
  status: "active" | "inactive";
  gender: "male" | "female";
  height: number;
  birthDate: string | null;
  address: string | null;
  notes: string | null;
}

async function getClients(): Promise<Client[]> {
  const response = await fetch("/api/clients");
  if (!response.ok) {
    throw new Error("Danışanlar alınamadı");
  }
  return response.json();
}

async function createClient(data: Omit<Client, "id">): Promise<Client> {
  const response = await fetch("/api/clients", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Danışan oluşturulamadı");
  }
  return response.json();
}

async function deleteClient(id: string): Promise<void> {
  const response = await fetch(`/api/clients/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Danışan silinemedi");
  }
}

async function updateClient(id: string, data: Omit<Client, "id">): Promise<Client> {
  console.log("updateClient - Gönderilecek ham veri:", data);
  console.log("updateClient - Boy değeri tipi:", typeof data.height);
  console.log("updateClient - Boy değeri:", data.height);
  
  // Convert string ID to number
  const numericId = parseInt(id);
  if (isNaN(numericId)) {
    throw new Error("Geçersiz danışan ID'si");
  }

  // Convert height to string with correct precision
  const updatedData = {
    ...data,
    height: String(Number(data.height).toFixed(2))
  };

  console.log("updateClient - Dönüştürülmüş veri:", updatedData);
  console.log("updateClient - Dönüştürülmüş boy değeri tipi:", typeof updatedData.height);
  console.log("updateClient - Dönüştürülmüş boy değeri:", updatedData.height);

  const response = await fetch(`/api/clients/${numericId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("updateClient - Güncelleme hatası:", errorText);
    throw new Error(`Danışan güncellenemedi: ${errorText}`);
  }

  const result = await response.json();
  console.log("updateClient - Sunucu yanıtı:", result);
  return result;
}

export default function ClientsPage() {
  const [, setLocation] = useLocation();
  const [showDialog, setShowDialog] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = React.useState<Omit<Client, "id">>({
    firstName: "",
    lastName: "",
    email: "",
    phone: null,
    occupation: null,
    status: "active",
    gender: "male",
    height: 170,
    birthDate: null,
    address: null,
    notes: null
  });

  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: getClients,
  });

  const updateClientMutation = useMutation({
    mutationFn: (data: { id: string; updates: Omit<Client, "id"> }) => 
      updateClient(data.id, data.updates),
    onSuccess: async () => {
      await refetch(); // Ensure we get fresh data from the database
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setShowDialog(false);
      resetForm();
      setIsEditing(false);
      setSelectedClient(null);
      toast({
        title: "Başarılı",
        description: "Danışan bilgileri güncellendi",
      });
    },
    onError: (error: any) => {
      console.error("Güncelleme hatası:", error);
      toast({
        title: "Hata",
        description: error.message || "Danışan güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const createClientMutation = useMutation({
    mutationFn: createClient,
    onSuccess: async () => {
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setShowDialog(false);
      resetForm();
      toast({
        title: "Başarılı",
        description: "Danışan başarıyla eklendi",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Danışan eklenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: null,
      occupation: null,
      status: "active",
      gender: "male",
      height: 170,
      birthDate: null,
      address: null,
      notes: null
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing && selectedClient) {
        // Log the data before sending
        console.log("Gönderilecek veri:", {
          ...formData,
          height: Number(formData.height),
          birthDate: formData.birthDate || null,
          phone: formData.phone || null,
          occupation: formData.occupation || null,
          address: formData.address || null,
          notes: formData.notes || null
        });

        await updateClientMutation.mutateAsync({
          id: selectedClient.id,
          updates: {
            ...formData,
            height: Number(formData.height),
            birthDate: formData.birthDate || null,
            phone: formData.phone || null,
            occupation: formData.occupation || null,
            address: formData.address || null,
            notes: formData.notes || null
          }
        });

        // Log success
        console.log("Güncelleme başarılı");
      } else {
        // YENİ DANIŞAN EKLEME
        await createClientMutation.mutateAsync({
          ...formData,
          height: Number(formData.height),
          birthDate: formData.birthDate || null,
          phone: formData.phone || null,
          occupation: formData.occupation || null,
          address: formData.address || null,
          notes: formData.notes || null
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Form gönderilirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedClient) return;
    try {
      await deleteClient(selectedClient.id);
      setShowDeleteDialog(false);
      setSelectedClient(null);
      refetch();
    } catch (error) {
      console.error("Hata:", error);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="w-full max-w-6xl mx-auto px-4 ml-8 md:ml-24">
        <div className="space-y-8">
          <div className="flex justify-between items-center animate-fade-up">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">
                Danışanlar
              </h1>
              <p className="text-muted-foreground">
                Tüm danışanlarınızı buradan yönetebilirsiniz
              </p>
            </div>

            <Dialog 
              open={showDialog} 
              onOpenChange={(open) => {
                setShowDialog(open);
                if (!open) {
                  setIsEditing(false);
                  setSelectedClient(null);
                  resetForm();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  className="rounded-xl hover:scale-105 transition-transform duration-300"
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedClient(null);
                    resetForm();
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Yeni Danışan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{isEditing ? "Danışan Düzenle" : "Yeni Danışan Ekle"}</DialogTitle>
                  <DialogDescription>
                    {isEditing ? "Danışan bilgilerini güncelleyin." : "Yeni bir danışan ekleyin."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Ad"
                      value={formData.firstName || ""}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          firstName: e.target.value
                        }));
                      }}
                    />
                    <Input
                      placeholder="Soyad"
                      value={formData.lastName || ""}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          lastName: e.target.value
                        }));
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="email"
                      placeholder="E-posta"
                      value={formData.email || ""}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          email: e.target.value
                        }));
                      }}
                    />
                    <Input
                      type="tel"
                      placeholder="Telefon"
                      value={formData.phone || ""}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          phone: e.target.value
                        }));
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="height">Boy (cm)</label>
                      <Input
                        id="height"
                        name="height"
                        type="number"
                        value={formData.height}
                        onChange={(e) => {
                          const value = parseFloat(Number(e.target.value).toFixed(2));
                          console.log("Boy değeri değişti:", value);
                          setFormData(prev => ({
                            ...prev,
                            height: value
                          }));
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="gender">Cinsiyet</label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) => {
                          console.log("Cinsiyet değişti:", value);
                          setFormData(prev => ({
                            ...prev,
                            gender: value as "male" | "female"
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Erkek</SelectItem>
                          <SelectItem value="female">Kadın</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="date"
                      placeholder="Doğum Tarihi"
                      value={formData.birthDate || ""}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          birthDate: e.target.value
                        }));
                      }}
                    />
                    <Input
                      placeholder="Meslek"
                      value={formData.occupation || ""}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          occupation: e.target.value
                        }));
                      }}
                    />
                  </div>

                  <Input
                    placeholder="Adres"
                    value={formData.address || ""}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        address: e.target.value
                      }));
                    }}
                  />

                  <textarea
                    placeholder="Notlar"
                    className="w-full min-h-[100px] p-3 rounded-md border"
                    value={formData.notes || ""}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        notes: e.target.value
                      }));
                    }}
                  />

                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      type="button" 
                      onClick={() => {
                        setShowDialog(false);
                        setIsEditing(false);
                        setSelectedClient(null);
                        resetForm();
                      }}
                    >
                      İptal
                    </Button>
                    <Button type="submit">
                      {isEditing ? "Güncelle" : "Kaydet"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-card rounded-xl border shadow-sm overflow-hidden animate-fade-up-delay-1">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Meslek</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="w-[100px] text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin size-4 border-2 border-primary border-t-transparent rounded-full"></div>
                        <span className="text-muted-foreground">Yükleniyor...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : !clients || clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Henüz danışan bulunmuyor
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client, index) => (
                    <TableRow 
                      key={client.id}
                      className={cn(
                        "transition-all duration-300 hover:bg-muted/50 cursor-pointer",
                        `animate-fade-up-delay-${Math.min(index + 2, 5)}`
                      )}
                      onClick={() => setLocation(`/clients/${client.id}`)}
                    >
                      <TableCell className="font-medium">
                        {client.firstName} {client.lastName}
                      </TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell>{client.occupation}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                          client.status === "active" 
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        )}>
                          {client.status === "active" ? "Aktif" : "Pasif"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:scale-110 transition-transform duration-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDialog(true);
                              setIsEditing(true);
                              setSelectedClient(client);
                              setFormData({
                                firstName: client.firstName,
                                lastName: client.lastName,
                                email: client.email,
                                phone: client.phone,
                                occupation: client.occupation,
                                status: client.status,
                                gender: client.gender,
                                height: client.height,
                                birthDate: client.birthDate,
                                address: client.address,
                                notes: client.notes
                              });
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:scale-110 transition-transform duration-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClient(client);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Danışanı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu danışanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}