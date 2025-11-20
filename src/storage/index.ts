import { ElectronStorage } from './electron';
import { RedisStorage } from './redis';
import type { IStorage } from './base';
import type { AppSettings } from '@/types';

let storageInstance: IStorage | null = null;

export async function initializeStorage(settings?: AppSettings): Promise<IStorage> {
  if (storageInstance) return storageInstance;

  const isElectron = typeof window !== 'undefined' && window.electronAPI?.storage;
  const shouldUseRedis = settings?.storageType === 'redis' && settings.redisUrl && settings.redisToken;

  if (shouldUseRedis) {
    console.log('Using Redis storage');
    storageInstance = new RedisStorage(settings!.redisUrl!, settings!.redisToken!);
  } else if (isElectron) {
    console.log('Using Electron storage');
    storageInstance = new ElectronStorage();
  } else {
    console.log('Using LocalStorage (web)');
    const { LocalStorage } = await import('./local');
    storageInstance = new LocalStorage();
  }

  await storageInstance.initialize();
  return storageInstance;
}

export function getStorage(): IStorage {
  if (!storageInstance) {
    throw new Error('Storage not initialized. Call initializeStorage first.');
  }
  return storageInstance;
}

export function resetStorage(): void {
  storageInstance = null;
}

