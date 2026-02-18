

import { db } from '../db';
import { UserAccount } from '../types';

/**
 * Cloud Service - ONYX Link System
 * 
 * This service manages Authentication and Data Synchronization.
 * Currently configured in "Simulation Mode" using localStorage to mimic a remote server.
 * 
 * TO CONNECT REAL BACKEND (Supabase/Firebase):
 * 1. Replace `mockLogin` with real auth call.
 * 2. Replace `syncTable` logic with API endpoints (GET/POST).
 */

class CloudService {
  private USER_KEY = 'onyx_user_session';
  private SYNC_KEY = 'onyx_last_sync';
  
  // --- AUTHENTICATION ---

  getCurrentUser(): UserAccount | null {
    const data = localStorage.getItem(this.USER_KEY);
    return data ? JSON.parse(data) : null;
  }

  async login(email: string, password: string): Promise<UserAccount> {
    // SIMULATION: In a real app, await api.auth.signIn(email, password)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password.length > 3) {
          const user: UserAccount = {
            id: 'u_' + btoa(email).substring(0, 8),
            email,
            lastSync: 0
          };
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
          resolve(user);
        } else {
          reject(new Error("Credenciais inválidas. Protocolo abortado."));
        }
      }, 1500);
    });
  }

  async logout(): Promise<void> {
    return new Promise(resolve => {
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.SYNC_KEY);
      resolve();
    });
  }

  // --- SYNCHRONIZATION ---

  async syncAll(): Promise<{ success: boolean; message: string }> {
    const user = this.getCurrentUser();
    if (!user) return { success: false, message: "Acesso negado. Usuário desconectado." };

    const lastSync = parseInt(localStorage.getItem(this.SYNC_KEY) || '0');
    const now = Date.now();

    try {
      // Iterate over all Dexie tables defined in db
      const tables = (db as any).tables.map((t: any) => t.name);

      for (const tableName of tables) {
        if (tableName === 'app_state') continue; // Skip local-only state if preferred, or sync it too.

        await this.syncTable(tableName, user.id, lastSync);
      }

      localStorage.setItem(this.SYNC_KEY, now.toString());
      return { success: true, message: `Sincronização concluída às ${new Date(now).toLocaleTimeString()}` };
    } catch (error) {
      console.error("Sync Failed", error);
      return { success: false, message: "Falha na conexão neural. Tente novamente." };
    }
  }

  /**
   * Syncs a single table using "Last Write Wins" based on updatedAt
   */
  private async syncTable(tableName: string, userId: string, lastSync: number) {
    const table = (db as any).table(tableName);

    // 1. PUSH: Get local items changed since last sync
    const localChanges = await table
      .filter((item: any) => (item.updatedAt || 0) > lastSync)
      .toArray();

    if (localChanges.length > 0) {
      await this.mockPushToCloud(tableName, userId, localChanges);
    }

    // 2. PULL: Get remote items changed since last sync
    const remoteChanges = await this.mockPullFromCloud(tableName, userId, lastSync);

    // 3. MERGE: Apply remote changes to local DB
    if (remoteChanges.length > 0) {
       await (db as any).transaction('rw', table, async () => {
         await table.bulkPut(remoteChanges);
       });
    }
  }

  // --- MOCK BACKEND IMPLEMENTATION (Replace with Real API) ---

  private getMockCloudStore(tableName: string, userId: string): any[] {
    const key = `cloud_${userId}_${tableName}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private setMockCloudStore(tableName: string, userId: string, data: any[]) {
    const key = `cloud_${userId}_${tableName}`;
    localStorage.setItem(key, JSON.stringify(data));
  }

  private async mockPushToCloud(tableName: string, userId: string, items: any[]): Promise<void> {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 200)); 

    const cloudData = this.getMockCloudStore(tableName, userId);
    
    items.forEach(localItem => {
      const index = cloudData.findIndex((c: any) => c.id === localItem.id);
      if (index >= 0) {
        // Update if local is newer (handled by caller logic usually, but here just overwrite)
        if ((localItem.updatedAt || 0) > (cloudData[index].updatedAt || 0)) {
           cloudData[index] = localItem;
        }
      } else {
        cloudData.push(localItem);
      }
    });

    this.setMockCloudStore(tableName, userId, cloudData);
  }

  private async mockPullFromCloud(tableName: string, userId: string, lastSync: number): Promise<any[]> {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 200)); 

    const cloudData = this.getMockCloudStore(tableName, userId);
    return cloudData.filter((item: any) => (item.updatedAt || 0) > lastSync);
  }
}

export const cloud = new CloudService();
