import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, X, Check, PlusCircle, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { translateUI } from "@/lib/translations";
import { apiRequest } from "@/lib/queryClient";

// User tipi
interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
  role: string;
  subscriptionStatus: string;
  subscriptionPlan?: string;
  createdAt: string;
}

interface EditUserForm {
  username: string;
  email: string;
  name?: string;
  role: string;
  subscriptionStatus: string;
  subscriptionPlan?: string;
  password?: string;
}

export default function UserManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditUserForm | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<EditUserForm>({
    username: "",
    email: "",
    name: "",
    role: "user",
    subscriptionStatus: "free",
    subscriptionPlan: "",
    password: ""
  });

  // Admin yetkisi kontrolü
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Yetkisiz Erişim</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Kullanıcıları getir
  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/admin/users");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched users:", data); // Debug için
        return data;
      } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
      }
    }
  });

  // Hata durumunu göster
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Hata</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">Kullanıcılar yüklenirken bir hata oluştu: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Kullanıcı güncelleme mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: { id: number, updates: Partial<EditUserForm> }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userData.id}`, userData.updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Kullanıcı güncellendi",
        description: "Kullanıcı bilgileri başarıyla güncellendi.",
      });
      setEditingUser(null);
      setEditForm(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error) => {
      toast({
        title: "Güncelleme hatası",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Kullanıcı silme mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return response.ok;
    },
    onSuccess: () => {
      toast({
        title: "Kullanıcı silindi",
        description: "Kullanıcı başarıyla silindi.",
      });
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error) => {
      toast({
        title: "Silme hatası",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Yeni kullanıcı oluşturma mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: EditUserForm) => {
      const response = await apiRequest("POST", "/api/admin/users", userData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Kullanıcı oluşturuldu",
        description: "Yeni kullanıcı başarıyla oluşturuldu.",
      });
      setIsCreateDialogOpen(false);
      setCreateForm({
        username: "",
        email: "",
        name: "",
        role: "user",
        subscriptionStatus: "free",
        subscriptionPlan: "",
        password: ""
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error) => {
      toast({
        title: "Oluşturma hatası",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Düzenleme modunu başlat
  const startEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      email: user.email || "",
      name: user.name || "",
      role: user.role,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPlan: user.subscriptionPlan || "",
      password: ""
    });
  };

  // Düzenlemeyi iptal et
  const cancelEdit = () => {
    setEditingUser(null);
    setEditForm(null);
  };

  // Düzenlemeyi kaydet
  const saveEdit = () => {
    if (!editingUser || !editForm) return;

    // Boş parola alanını filtreleme
    const updates = { ...editForm };
    if (!updates.password) {
      delete updates.password;
    }

    updateUserMutation.mutate({ 
      id: editingUser.id, 
      updates 
    });
  };

  // Silme işlemini başlat
  const startDelete = (user: User) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  // Silmeyi onayla
  const confirmDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

  // Kullanıcı oluştur
  const createNewUser = () => {
    if (!createForm.username || !createForm.password || !createForm.email) {
      toast({
        title: "Geçersiz form",
        description: "Kullanıcı adı, parola ve e-posta gereklidir.",
        variant: "destructive",
      });
      return;
    }

    createUserMutation.mutate(createForm);
  };

  // Kullanıcı form alanını güncelle
  const updateFormField = (field: keyof EditUserForm, value: string) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        [field]: value
      });
    }
  };

  // Kullanıcı oluşturma form alanını güncelle
  const updateCreateFormField = (field: keyof EditUserForm, value: string) => {
    setCreateForm({
      ...createForm,
      [field]: value
    });
  };

  // Arama filtreleme
  const filteredUsers = users.filter(user => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchTerm) ||
      (user.email && user.email.toLowerCase().includes(searchTerm)) ||
      (user.name && user.name.toLowerCase().includes(searchTerm))
    );
  });

  // Abonelik durumu için renk
  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'trial': return 'bg-blue-500';
      case 'expired': return 'bg-red-500';
      case 'canceled': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  // Rol için renk ve etiket
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-600">Yönetici</Badge>;
      case 'user':
        return <Badge>Kullanıcı</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold">Kullanıcı Yönetimi</CardTitle>
              <CardDescription>
                Sistemdeki tüm kullanıcıları yönetin
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Yeni Kullanıcı
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search" 
                placeholder="Kullanıcı ara..." 
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Kullanıcılar yükleniyor...</p>
            </div>
          ) : (
            <>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Hiç kullanıcı bulunamadı.</p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Kullanıcı Adı</TableHead>
                        <TableHead>E-posta</TableHead>
                        <TableHead>Ad</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Abonelik</TableHead>
                        <TableHead>Tarih</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map(user => (
                        <TableRow key={user.id}>
                          {editingUser?.id === user.id ? (
                            // Düzenleme modu
                            <>
                              <TableCell>{user.id}</TableCell>
                              <TableCell>
                                <Input 
                                  value={editForm?.username || ''} 
                                  onChange={(e) => updateFormField('username', e.target.value)}
                                  className="w-32"
                                />
                              </TableCell>
                              <TableCell>
                                <Input 
                                  value={editForm?.email || ''} 
                                  onChange={(e) => updateFormField('email', e.target.value)}
                                  className="w-40"
                                />
                              </TableCell>
                              <TableCell>
                                <Input 
                                  value={editForm?.name || ''} 
                                  onChange={(e) => updateFormField('name', e.target.value)}
                                  className="w-32"
                                />
                              </TableCell>
                              <TableCell>
                                <Select 
                                  value={editForm?.role || 'user'} 
                                  onValueChange={(value) => updateFormField('role', value)}
                                >
                                  <SelectTrigger className="w-24">
                                    <SelectValue placeholder="Rol" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">Kullanıcı</SelectItem>
                                    <SelectItem value="admin">Yönetici</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <Select 
                                    value={editForm?.subscriptionStatus || 'free'} 
                                    onValueChange={(value) => updateFormField('subscriptionStatus', value)}
                                  >
                                    <SelectTrigger className="w-28">
                                      <SelectValue placeholder="Durum" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="free">Ücretsiz</SelectItem>
                                      <SelectItem value="trial">Deneme</SelectItem>
                                      <SelectItem value="active">Aktif</SelectItem>
                                      <SelectItem value="expired">Süresi Dolmuş</SelectItem>
                                      <SelectItem value="canceled">İptal Edilmiş</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Select 
                                    value={editForm?.subscriptionPlan || ''} 
                                    onValueChange={(value) => updateFormField('subscriptionPlan', value)}
                                  >
                                    <SelectTrigger className="w-28">
                                      <SelectValue placeholder="Plan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">Yok</SelectItem>
                                      <SelectItem value="basic">Temel</SelectItem>
                                      <SelectItem value="premium">Premium</SelectItem>
                                      <SelectItem value="pro">Pro</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </TableCell>
                              <TableCell>{new Date(user.createdAt).toLocaleDateString('tr-TR')}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button size="icon" variant="ghost" onClick={cancelEdit}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={saveEdit}>
                                    <Check className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          ) : (
                            // Normal görünüm modu
                            <>
                              <TableCell>{user.id}</TableCell>
                              <TableCell>{user.username}</TableCell>
                              <TableCell>{user.email || '-'}</TableCell>
                              <TableCell>{user.name || '-'}</TableCell>
                              <TableCell>{getRoleBadge(user.role)}</TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-1">
                                    <div className={`w-2 h-2 rounded-full ${getSubscriptionStatusColor(user.subscriptionStatus)}`}></div>
                                    <span className="text-sm">
                                      {user.subscriptionStatus === 'free' ? 'Ücretsiz' : 
                                       user.subscriptionStatus === 'trial' ? 'Deneme' :
                                       user.subscriptionStatus === 'active' ? 'Aktif' :
                                       user.subscriptionStatus === 'expired' ? 'Süresi Dolmuş' :
                                       user.subscriptionStatus === 'canceled' ? 'İptal Edilmiş' :
                                       user.subscriptionStatus}
                                    </span>
                                  </div>
                                  {user.subscriptionPlan && (
                                    <span className="text-xs text-muted-foreground">
                                      {user.subscriptionPlan === 'basic' ? 'Temel' :
                                       user.subscriptionPlan === 'premium' ? 'Premium' :
                                       user.subscriptionPlan === 'pro' ? 'Pro' :
                                       user.subscriptionPlan}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{new Date(user.createdAt).toLocaleDateString('tr-TR')}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button size="icon" variant="ghost" onClick={() => startEdit(user)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => startDelete(user)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>Toplam: {filteredUsers.length} kullanıcı</div>
        </CardFooter>
      </Card>

      {/* Silme Onay Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kullanıcıyı Sil</DialogTitle>
            <DialogDescription>
              "{userToDelete?.username}" kullanıcısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>İptal</Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Siliniyor..." : "Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Yeni Kullanıcı Oluşturma Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Kullanıcı Oluştur</DialogTitle>
            <DialogDescription>
              Sisteme yeni bir kullanıcı ekle
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Kullanıcı Adı*
              </Label>
              <Input
                id="username"
                value={createForm.username}
                onChange={(e) => updateCreateFormField('username', e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Parola*
              </Label>
              <Input
                id="password"
                type="password"
                value={createForm.password}
                onChange={(e) => updateCreateFormField('password', e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                E-posta*
              </Label>
              <Input
                id="email"
                type="email"
                value={createForm.email}
                onChange={(e) => updateCreateFormField('email', e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Ad
              </Label>
              <Input
                id="name"
                value={createForm.name}
                onChange={(e) => updateCreateFormField('name', e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Rol
              </Label>
              <Select
                value={createForm.role}
                onValueChange={(value) => updateCreateFormField('role', value)}
              >
                <SelectTrigger id="role" className="col-span-3">
                  <SelectValue placeholder="Rol seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Kullanıcı</SelectItem>
                  <SelectItem value="admin">Yönetici</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Abonelik Durumu
              </Label>
              <Select
                value={createForm.subscriptionStatus}
                onValueChange={(value) => updateCreateFormField('subscriptionStatus', value)}
              >
                <SelectTrigger id="status" className="col-span-3">
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Ücretsiz</SelectItem>
                  <SelectItem value="trial">Deneme</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="expired">Süresi Dolmuş</SelectItem>
                  <SelectItem value="canceled">İptal Edilmiş</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="plan" className="text-right">
                Plan
              </Label>
              <Select
                value={createForm.subscriptionPlan || "none"}
                onValueChange={(value) => updateCreateFormField('subscriptionPlan', value)}
              >
                <SelectTrigger id="plan" className="col-span-3">
                  <SelectValue placeholder="Plan seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Yok</SelectItem>
                  <SelectItem value="basic">Temel</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>İptal</Button>
            <Button 
              onClick={createNewUser}
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? "Oluşturuluyor..." : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}