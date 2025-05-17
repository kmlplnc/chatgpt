import React from 'react';
import { useApi } from '../../shared/hooks/useApi';
import { AppError } from '../../shared/utils/errorHandler';

interface User {
  id: number;
  name: string;
}

export function ExampleComponent() {
  const { data, error, loading, execute } = useApi<User>();

  const fetchUser = async () => {
    try {
      // Örnek bir API çağrısı
      const response = await fetch('https://api.example.com/user/1');
      if (!response.ok) {
        throw new AppError('Kullanıcı bilgileri alınamadı', response.status);
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  const handleFetch = () => {
    execute(fetchUser, 'ExampleComponent.fetchUser');
  };

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (error) {
    return (
      <div>
        <h3>Hata Oluştu</h3>
        <p>{error.message}</p>
        <button onClick={handleFetch}>Tekrar Dene</button>
      </div>
    );
  }

  return (
    <div>
      {data ? (
        <div>
          <h2>Kullanıcı Bilgileri</h2>
          <p>ID: {data.id}</p>
          <p>İsim: {data.name}</p>
        </div>
      ) : (
        <button onClick={handleFetch}>Kullanıcı Bilgilerini Getir</button>
      )}
    </div>
  );
} 