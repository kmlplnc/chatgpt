import { apiRequest } from "@/lib/queryClient";

export function useClientApi(clientId: string | number) {
  console.log("useClientApi clientId:", clientId);
  return {
    getClient: async () => {
      const response = await apiRequest("GET", `/api/clients/${clientId}`);
      return response.json();
    },
    
    getMeasurements: async () => {
      const response = await apiRequest("GET", `/api/clients/${clientId}/measurements`);
      return response.json();
    },
    
    getAppointments: async () => {
      const response = await apiRequest("GET", `/api/appointments?clientId=${clientId}`);
      return response.json();
    },
    
    getMessages: async () => {
      console.log("getMessages clientId:", clientId);
      const response = await apiRequest("GET", `/api/messages?clientId=${clientId}`);
      return response.json();
    },
    
    sendMessage: async (content: string) => {
      const messageData = {
        content,
        clientId: Number(clientId),
        fromClient: false
      };
      const response = await apiRequest("POST", `/api/messages`, messageData);
      return response.json();
    },
    
    updateClient: async (data: any) => {
      const response = await apiRequest("PUT", `/api/clients/${clientId}`, data);
      return response.json();
    },
    
    deleteClient: async () => {
      const response = await apiRequest("DELETE", `/api/clients/${clientId}`);
      return response.json();
    }
  };
} 