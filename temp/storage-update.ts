// IStorage arayüzüne eklenecek metodlar
export interface IStorage {
  // ... mevcut metodlar ...
  
  // Client Portal için metodlar
  getClientByAccessCode(accessCode: string): Promise<Client | undefined>;
  generateClientAccessCode(clientId: number): Promise<string>;
  updateClientAccessCode(clientId: number, accessCode: string): Promise<boolean>;
  
  // Client Session yönetimi
  createClientSession(session: InsertClientSession): Promise<ClientSession>;
  getClientSession(sessionToken: string): Promise<ClientSession | undefined>;
  updateClientSessionActivity(sessionToken: string): Promise<boolean>;
  deleteClientSession(sessionToken: string): Promise<boolean>;
}

// DatabaseStorage sınıfına eklenecek metodlar
export class DatabaseStorage implements IStorage {
  // ... mevcut metodlar ...
  
  // Danışanı erişim koduna göre getir
  async getClientByAccessCode(accessCode: string): Promise<Client | undefined> {
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.accessCode, accessCode));
    
    return client;
  }
  
  // Danışan için benzersiz erişim kodu oluştur
  async generateClientAccessCode(clientId: number): Promise<string> {
    // 6 karakterlik alfanumerik kod oluştur
    const generateCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Karışabilecek karakterleri çıkardık (0, O, 1, I)
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };
    
    // Benzersiz kod oluşturana kadar dene
    let code: string;
    let isUnique = false;
    
    do {
      code = generateCode();
      const existingClient = await this.getClientByAccessCode(code);
      isUnique = !existingClient;
    } while (!isUnique);
    
    // Kodu danışan kaydına ekle
    await db
      .update(clients)
      .set({ accessCode: code })
      .where(eq(clients.id, clientId));
    
    return code;
  }
  
  // Danışan erişim kodunu güncelle
  async updateClientAccessCode(clientId: number, accessCode: string): Promise<boolean> {
    try {
      await db
        .update(clients)
        .set({ accessCode: accessCode })
        .where(eq(clients.id, clientId));
      
      return true;
    } catch (error) {
      console.error('Update client access code error:', error);
      return false;
    }
  }
  
  // Oturum oluştur
  async createClientSession(session: InsertClientSession): Promise<ClientSession> {
    const [newSession] = await db
      .insert(clientSessions)
      .values(session)
      .returning();
    
    return newSession;
  }
  
  // Oturumu getir
  async getClientSession(sessionToken: string): Promise<ClientSession | undefined> {
    const [session] = await db
      .select()
      .from(clientSessions)
      .where(eq(clientSessions.sessionToken, sessionToken));
    
    return session;
  }
  
  // Oturum aktivitesini güncelle
  async updateClientSessionActivity(sessionToken: string): Promise<boolean> {
    try {
      await db
        .update(clientSessions)
        .set({ lastActivity: new Date() })
        .where(eq(clientSessions.sessionToken, sessionToken));
      
      return true;
    } catch (error) {
      console.error('Update session activity error:', error);
      return false;
    }
  }
  
  // Oturumu sil
  async deleteClientSession(sessionToken: string): Promise<boolean> {
    try {
      const result = await db
        .delete(clientSessions)
        .where(eq(clientSessions.sessionToken, sessionToken));
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('Delete client session error:', error);
      return false;
    }
  }
}
