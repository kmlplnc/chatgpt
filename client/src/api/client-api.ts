import { apiRequest } from '../lib/api-request';
import { Client, Measurement, Appointment } from '../types/client';

export const getClient = async (id: string): Promise<Client> => {
  const response = await apiRequest(`/api/clients/${id}`);
  if (!response.ok) throw new Error("Danışan bilgileri yüklenemedi");
  return response.data as Client;
};

export const getMeasurements = async (id: string): Promise<Measurement[]> => {
  const response = await apiRequest(`/api/clients/${id}/measurements`);
  if (!response.ok) throw new Error("Ölçüm verileri yüklenemedi");
  return response.data as Measurement[];
};

export const createMeasurement = async (id: string, data: any) => {
  const response = await apiRequest(`/api/clients/${id}/measurements`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Ölçüm kaydedilemedi");
  return response.data;
};

export const updateMeasurement = async (id: string, measurementId: number, data: any) => {
  const response = await apiRequest(`/api/clients/${id}/measurements/${measurementId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Ölçüm güncellenemedi");
  return response.data;
};

export const deleteClient = async (id: string) => {
  const response = await apiRequest(`/api/clients/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Danışan silinemedi");
  return true;
};

export const deleteMeasurement = async (id: string, measurementId: number) => {
  const response = await apiRequest(`/api/clients/${id}/measurements/${measurementId}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Ölçüm silinemedi");
  return response.data;
};

export const getAppointments = async (id: string): Promise<Appointment[]> => {
  const response = await apiRequest(`/api/appointments?clientId=${id}`);
  if (!response.ok) throw new Error(`Randevular yüklenirken bir hata oluştu: ${response.error}`);
  return response.data as Appointment[];
};

export const createAppointment = async (id: string, data: any) => {
  const appointmentDate = new Date(data.date);
  const [hours, minutes] = data.time.split(":").map(Number);
  const startTime = new Date(appointmentDate);
  startTime.setHours(hours, minutes, 0, 0);
  const duration = data.duration || 60;
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + duration);
  const appointmentData = {
    ...data,
    clientId: Number(id),
    userId: data.userId || undefined,
    startTime,
    endTime,
    duration: 30,
    time: data.time,
  };
  const response = await apiRequest(`/api/appointments`, {
    method: "POST",
    body: JSON.stringify(appointmentData),
  });
  if (!response.ok) throw new Error("Randevu oluşturulamadı");
  return response.data;
};

export const updateAppointment = async (appointmentId: number, data: any) => {
  const appointmentDate = new Date(data.date);
  const [hours, minutes] = data.time.split(":").map(Number);
  const startTime = new Date(appointmentDate);
  startTime.setHours(hours, minutes, 0, 0);
  const endTime = new Date(startTime);
  endTime.setHours(endTime.getHours() + 1);
  const appointmentData = {
    ...data,
    startTime,
    endTime,
    duration: 30,
    time: data.time,
  };
  const response = await apiRequest(`/api/appointments/${appointmentId}`, {
    method: "PATCH",
    body: JSON.stringify(appointmentData),
  });
  if (!response.ok) throw new Error("Randevu güncellenemedi");
  return response.data;
};

export const deleteAppointment = async (appointmentId: number) => {
  const response = await apiRequest(`/api/appointments/${appointmentId}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Randevu silinemedi");
  return response.data;
};

export const getMessages = async (id: string) => {
  const response = await apiRequest(`/api/messages?clientId=${id}`);
  if (!response.ok) throw new Error(`Mesajlar yüklenirken bir hata oluştu: ${response.error}`);
  return response.data;
};

export const sendMessage = async (id: string, content: string) => {
  const messageData = { content, clientId: Number(id), fromClient: false };
  const response = await apiRequest(`/api/messages`, {
    method: "POST",
    body: JSON.stringify(messageData),
  });
  if (!response.ok) throw new Error("Mesaj gönderilemedi");
  return response.data;
};

export const markMessagesAsRead = async (id: string, messageIds: number[]) => {
  if (messageIds && messageIds.length > 0) {
    const response = await apiRequest(`/api/messages/mark-read`, {
      method: "PATCH",
      body: JSON.stringify({ messageIds }),
    });
    if (!response.ok) throw new Error("Mesajlar okundu olarak işaretlenemedi");
    return response.data;
  }
  const response = await apiRequest(`/api/messages/read?clientId=${id}`, { method: "PATCH" });
  if (!response.ok) throw new Error("Mesajlar okundu olarak işaretlenemedi");
  return response.data;
};

export const generateAccessCode = async (id: string) => {
  const response = await apiRequest(`/api/clients/${id}/access-code`, { method: "POST" });
  if (!response.ok) throw new Error("Erişim kodu oluşturulamadı");
  return response.data;
}; 