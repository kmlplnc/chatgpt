import React, { useState } from "react";
import { PlusCircle, Search, SlidersHorizontal, MessageCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProtectedFeature from "@/components/premium/protected-feature";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Client schema for the form
const clientSchema = z.object({
  firstName: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  lastName: z.string().min(2, "Soyisim en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.enum(["male", "female", "other"]),
  occupation: z.string().optional(),
  medicalConditions: z.string().optional(),
  allergies: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

// API istekleri
async function getClients() {
  const response = await fetch("/api/clients");
  if (!response.ok) {
    throw new Error("Danışanlar alınamadı");
  }
  return response.json();
}

async function getLastMessages() {
  const response = await fetch("/api/messages/last-messages");
  if (!response.ok) {
    throw new Error("Son mesajlar alınamadı");
  }
  return response.json();
}

async function createClient(data: z.infer<typeof clientSchema>) {
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

async function updateClient(id: number, data: z.infer<typeof clientSchema>) {
  const response = await fetch(`/api/clients/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error("Danışan güncellenemedi");
  }
  
  return response.json();
}

export default function ClientsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [openNewClientDialog, setOpenNewClientDialog] = useState(false);
  const [openEditClientDialog, setOpenEditClientDialog] = useState(false);
  const [currentClient, setCurrentClient] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  
  // Yeni danışan formu
  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      gender: "female",
      occupation: "",
      medicalConditions: "",
      allergies: "",
      notes: "",
      status: "active",
    },
  });
  
  // Danışan düzenleme formu
  const editForm = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      gender: "female",
      occupation: "",
      medicalConditions: "",
      allergies: "",
      notes: "",
      status: "active",
    },
  });
  
  // Danışanları getirme
  const { data: clients, isLoading, error } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: getClients,
  });
  
  // Son mesajları getirme
  const { data: lastMessages } = useQuery({
    queryKey: ["/api/messages/last-messages"],
    queryFn: getLastMessages,
    refetchInterval: 10000, // 10 saniyede bir yenile
  });
  
  // Danışan oluşturma
  const createClientMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Danışan başarıyla eklendi",
      });
      form.reset();
      setOpenNewClientDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Danışan eklenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Danışan güncelleme
  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: z.infer<typeof clientSchema> }) => updateClient(id, data),
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Danışan bilgileri başarıyla güncellendi",
      });
      setOpenEditClientDialog(false);
      setCurrentClient(null);
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Danışan güncellenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Yeni danışan form gönderim işlemi
  function onSubmit(data: z.infer<typeof clientSchema>) {
    createClientMutation.mutate(data);
  }
  
  // Danışan düzenleme form gönderim işlemi
  function onEditSubmit(data: z.infer<typeof clientSchema>) {
    if (currentClient) {
      updateClientMutation.mutate({ id: currentClient.id, data });
    }
  }
  
  // Danışan düzenleme modalını aç
  function handleEditClient(id: number) {
    // Danışanı bul
    const client = clients?.find((c: any) => c.id === id);
    if (client) {
      // Form varsayılan değerlerini ayarla
      editForm.reset({
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone || "",
        gender: client.gender,
        birthDate: client.birthDate || "",
        occupation: client.occupation || "",
        medicalConditions: client.medicalConditions || "",
        allergies: client.allergies || "",
        notes: client.notes || "",
        status: client.status,
      });
      
      // Mevcut danışanı ayarla ve düzenleme modalını aç
      setCurrentClient(client);
      setOpenEditClientDialog(true);
    }
  }
  
  // Danışanları filtreleme
  const filteredClients = React.useMemo(() => {
    if (!clients) return [];
    
    return clients.filter((client: any) => {
      // Arama filtreleme
      const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
      if (search && !fullName.includes(search.toLowerCase())) {
        return false;
      }
      
      // Tab filtreleme
      if (activeTab !== "all" && client.status !== activeTab) {
        return false;
      }
      
      return true;
    });
  }, [clients, search, activeTab]);
  
  return (
    <ProtectedFeature featureName="Danışan Yönetimi">
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Danışanlar</h1>
          
          {/* Danışan düzenleme modalı */}
          <Dialog open={openEditClientDialog} onOpenChange={setOpenEditClientDialog}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Danışan Düzenle</DialogTitle>
                <DialogDescription>
                  Danışan bilgilerini güncelleyin. Tüm gerekli alanlar doldurulmalıdır.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ad</FormLabel>
                          <FormControl>
                            <Input placeholder="Danışan adı" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Soyad</FormLabel>
                          <FormControl>
                            <Input placeholder="Danışan soyadı" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-posta</FormLabel>
                          <FormControl>
                            <Input placeholder="E-posta adresi" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefon</FormLabel>
                          <FormControl>
                            <Input placeholder="Telefon numarası" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Doğum Tarihi</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cinsiyet</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Cinsiyet seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="female">Kadın</SelectItem>
                              <SelectItem value="male">Erkek</SelectItem>
                              <SelectItem value="other">Diğer</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="occupation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meslek</FormLabel>
                          <FormControl>
                            <Input placeholder="Meslek" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Durum</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Durum seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Aktif</SelectItem>
                              <SelectItem value="inactive">Pasif</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <FormField
                      control={editForm.control}
                      name="medicalConditions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sağlık Durumu</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Mevcut sağlık durumları veya hastalıklar" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="allergies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alerjiler</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Besin alerjileri veya intoleranslar" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notlar</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Diğer notlar veya bilgiler" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpenEditClientDialog(false)}>
                      İptal
                    </Button>
                    <Button type="submit" disabled={updateClientMutation.isPending}>
                      {updateClientMutation.isPending ? "Güncelleniyor..." : "Danışanı Güncelle"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={openNewClientDialog} onOpenChange={setOpenNewClientDialog}>
            <Button className="flex items-center gap-2" onClick={() => setOpenNewClientDialog(true)}>
              <PlusCircle className="h-4 w-4" />
              Yeni Danışan Ekle
            </Button>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Yeni Danışan Ekle</DialogTitle>
                <DialogDescription>
                  Yeni danışan bilgilerini girin. Tüm gerekli alanlar doldurulmalıdır.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ad</FormLabel>
                          <FormControl>
                            <Input placeholder="Danışan adı" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Soyad</FormLabel>
                          <FormControl>
                            <Input placeholder="Danışan soyadı" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-posta</FormLabel>
                          <FormControl>
                            <Input placeholder="E-posta adresi" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefon</FormLabel>
                          <FormControl>
                            <Input placeholder="Telefon numarası" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Doğum Tarihi</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cinsiyet</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Cinsiyet seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="female">Kadın</SelectItem>
                              <SelectItem value="male">Erkek</SelectItem>
                              <SelectItem value="other">Diğer</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="occupation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meslek</FormLabel>
                          <FormControl>
                            <Input placeholder="Meslek" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Durum</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Durum seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Aktif</SelectItem>
                              <SelectItem value="inactive">Pasif</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="medicalConditions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sağlık Durumu</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Mevcut sağlık durumları veya hastalıklar" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="allergies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alerjiler</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Besin alerjileri veya intoleranslar" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notlar</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Diğer notlar veya bilgiler" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpenNewClientDialog(false)}>
                      İptal
                    </Button>
                    <Button type="submit" disabled={createClientMutation.isPending}>
                      {createClientMutation.isPending ? "Ekleniyor..." : "Danışan Ekle"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* İstatistik kartları */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Toplam Danışan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clients?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tüm zamanlar
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Yeni Danışan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                0
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Son 30 gün içinde eklendi
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">İlerleme Kaydeden</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                0
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Son ölçümlerde ilerleme kaydedenler
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ortalama BKİ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                0
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tüm aktif danışanlar
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Danışan ara..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Button variant="outline" size="icon">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
        
        <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="active">Aktif</TabsTrigger>
            <TabsTrigger value="inactive">Pasif</TabsTrigger>
            <TabsTrigger value="all">Tümü</TabsTrigger>
          </TabsList>
          
          <Card className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>İsim Soyisim</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Cinsiyet</TableHead>
                  <TableHead>Başlangıç Tarihi</TableHead>
                  <TableHead>BKİ</TableHead>
                  <TableHead>BMH (kcal)</TableHead>
                  <TableHead>Son Ölçüm</TableHead>
                  <TableHead>Son Mesaj</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">
                      Yükleniyor...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-destructive">
                      Hata: {(error as Error).message}
                    </TableCell>
                  </TableRow>
                ) : filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">
                      Danışan bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client: any, index: number) => (
                    <TableRow 
                      key={client.id} 
                      className="cursor-pointer hover:bg-secondary/20"
                      onClick={() => setLocation(`/client/${client.id}`)}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{client.firstName} {client.lastName}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>
                        {client.gender === 'female' ? 'Kadın' : 
                        client.gender === 'male' ? 'Erkek' : 'Diğer'}
                      </TableCell>
                      <TableCell>{client.createdAt ? formatDate(client.createdAt) : '-'}</TableCell>
                      <TableCell>{client.lastMeasurement?.bmi ? parseFloat(client.lastMeasurement.bmi).toFixed(1) : '-'}</TableCell> {/* BKI değeri */}
                      <TableCell>{client.lastMeasurement?.basalMetabolicRate ? Math.round(client.lastMeasurement.basalMetabolicRate) : '-'}</TableCell>
                      <TableCell>{client.lastMeasurement?.date ? formatDate(client.lastMeasurement.date) : '-'}</TableCell>
                      <TableCell className="max-w-[200px]">
                        {lastMessages?.find(msg => msg.clientId === client.id)?.message ? (
                          <div className="truncate text-sm">
                            <span className={`${lastMessages.find(msg => msg.clientId === client.id)?.message?.fromClient ? 'text-blue-600 font-medium' : 'text-gray-500 italic'}`}>
                              {lastMessages.find(msg => msg.clientId === client.id)?.message?.fromClient ? 'Danışan: ' : 'Siz: '}
                            </span>
                            {lastMessages.find(msg => msg.clientId === client.id)?.message?.content}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm italic">Mesaj yok</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClient(client.id);
                          }}
                        >
                          Düzenle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </Tabs>
      </div>
    </ProtectedFeature>
  );
}