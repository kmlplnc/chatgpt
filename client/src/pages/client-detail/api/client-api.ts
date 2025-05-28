import { Client } from '../types/client';
import { Measurement } from '../types/measurement';

export const getClient = async (id: string): Promise<Client> => {
  const response = await fetch(`/api/clients/${id}`);
  if (!response.ok) {
    throw new Error("Müşteri bilgileri alınamadı");
  }
  const data = await response.json();
  return data as Client;
};

export const getMeasurements = async (id: string): Promise<Measurement[]> => {
  const response = await fetch(`/api/clients/${id}/measurements`);
  if (!response.ok) {
    throw new Error("Ölçümler alınamadı");
  }
  const data = await response.json();
  return data as Measurement[];
};

export const createMeasurement = async (id: string, data: any): Promise<Measurement> => {
  const response = await fetch(`/api/clients/${id}/measurements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Ölçüm eklenemedi");
  }
  const responseData = await response.json();
  return responseData as Measurement;
};

export const updateMeasurement = async (id: string, measurementId: number, data: any): Promise<Measurement> => {
  const response = await fetch(`/api/clients/${id}/measurements/${measurementId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Ölçüm güncellenemedi");
  }
  const responseData = await response.json();
  return responseData as Measurement;
};

export const deleteClient = async (id: string): Promise<void> => {
  const response = await fetch(`/api/clients/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error("Müşteri silinemedi");
  }
};

export const deleteMeasurement = async (id: string, measurementId: number): Promise<void> => {
  const response = await fetch(`/api/clients/${id}/measurements/${measurementId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error("Ölçüm silinemedi");
  }
}; 