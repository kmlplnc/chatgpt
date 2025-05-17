import { apiRequest } from "@/lib/queryClient";
import type { Client, Measurement, Appointment, Message } from "@/types/client";

export function useClientApi(clientId?: string | number) {
  if (!clientId) {
    throw new Error("Client ID is required");
  }

  return {
    getClient: async () => {
      const response = await apiRequest("GET", `/api/clients/${clientId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch client");
      }
      return response.json();
    },

    getMeasurements: async () => {
      const response = await apiRequest("GET", `/api/clients/${clientId}/measurements`);
      if (!response.ok) {
        throw new Error("Failed to fetch measurements");
      }
      return response.json();
    },

    getAppointments: async () => {
      const response = await apiRequest("GET", `/api/appointments?clientId=${clientId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }
      return response.json();
    },

    getMessages: async () => {
      const response = await apiRequest("GET", `/api/messages?clientId=${clientId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      return response.json();
    },

    createMeasurement: async (data: Partial<Measurement>) => {
      const response = await apiRequest("POST", `/api/clients/${clientId}/measurements`, data);
      if (!response.ok) {
        throw new Error("Failed to create measurement");
      }
      return response.json();
    },

    updateMeasurement: async (id: number, data: Partial<Measurement>) => {
      const response = await apiRequest("PATCH", `/api/clients/${clientId}/measurements/${id}`, data);
      if (!response.ok) {
        throw new Error("Failed to update measurement");
      }
      return response.json();
    },

    deleteMeasurement: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/clients/${clientId}/measurements/${id}`);
      if (!response.ok) {
        throw new Error("Failed to delete measurement");
      }
    },

    createAppointment: async (data: Partial<Appointment>) => {
      const response = await apiRequest("POST", `/api/appointments`, {
        ...data,
        clientId: Number(clientId)
      });
      if (!response.ok) {
        throw new Error("Failed to create appointment");
      }
      return response.json();
    },

    updateAppointment: async (id: number, data: Partial<Appointment>) => {
      const response = await apiRequest("PATCH", `/api/appointments/${id}`, {
        ...data,
        clientId: Number(clientId)
      });
      if (!response.ok) {
        throw new Error("Failed to update appointment");
      }
      return response.json();
    },

    deleteAppointment: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/appointments/${id}`);
      if (!response.ok) {
        throw new Error("Failed to delete appointment");
      }
    },

    sendMessage: async (content: string) => {
      const messageData = {
        content,
        clientId: Number(clientId),
        fromClient: false
      };
      const response = await apiRequest("POST", `/api/messages`, messageData);
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      return response.json();
    },

    markMessagesAsRead: async (messageIds: number[]) => {
      const response = await apiRequest("PATCH", `/api/messages/mark-as-read`, { 
        messageIds,
        clientId: Number(clientId)
      });
      if (!response.ok) {
        throw new Error("Failed to mark messages as read");
      }
    },

    updateClient: async (data: Partial<Client>) => {
      const response = await apiRequest("PATCH", `/api/clients/${clientId}`, data);
      if (!response.ok) {
        throw new Error("Failed to update client");
      }
      return response.json();
    },

    deleteClient: async () => {
      const response = await apiRequest("DELETE", `/api/clients/${clientId}`);
      if (!response.ok) {
        throw new Error("Failed to delete client");
      }
    },

    generateAccessCode: async () => {
      const response = await apiRequest("POST", `/api/clients/${clientId}/generate-access-code`);
      if (!response.ok) {
        throw new Error("Failed to generate access code");
      }
      const data = await response.json();
      return data.accessCode;
    }
  };
} 