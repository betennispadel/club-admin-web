import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useClubStore } from '@/stores/clubStore';

interface ApiKeyCache {
  [key: string]: string;
}

class ApiKeyService {
  private static instance: ApiKeyService;
  private cache: ApiKeyCache = {};
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): ApiKeyService {
    if (!ApiKeyService.instance) {
      ApiKeyService.instance = new ApiKeyService();
    }
    return ApiKeyService.instance;
  }

  private async fetchApiKeys(): Promise<void> {
    try {
      const now = Date.now();
      if (now - this.lastFetch < this.CACHE_DURATION && Object.keys(this.cache).length > 0) {
        return; // Use cached data
      }

      const { selectedClub } = useClubStore.getState();
      if (!selectedClub) {
        this.setFallbackKeys();
        return;
      }

      const apiKeysRef = collection(db, selectedClub.id, 'apiKeys', 'apiKeys');
      const activeKeysQuery = query(apiKeysRef, where('isActive', '==', true));
      const querySnapshot = await getDocs(activeKeysQuery);

      this.cache = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        this.cache[data.provider.toLowerCase()] = data.key;
      });

      if (querySnapshot.empty) {
        this.setFallbackKeys();
      }

      this.lastFetch = now;
    } catch (error) {
      this.setFallbackKeys();
    }
  }

  private setFallbackKeys(): void {
    // Default fallback keys (these should be replaced with actual keys in production)
    this.cache = {
      'openweathermap': '',
      'openai': '',
      'google': '',
      'google cloud': '',
    };
  }

  public async getApiKey(provider: string): Promise<string | null> {
    await this.fetchApiKeys();
    return this.cache[provider.toLowerCase()] || null;
  }

  public async getOpenWeatherMapKey(): Promise<string | null> {
    return this.getApiKey('openweathermap');
  }

  public async getOpenAIKey(): Promise<string | null> {
    return this.getApiKey('openai');
  }

  public async getGoogleGeminiKey(): Promise<string | null> {
    return this.getApiKey('google');
  }

  public async getGoogleCloudKey(): Promise<string | null> {
    return this.getApiKey('google cloud');
  }

  public clearCache(): void {
    this.cache = {};
    this.lastFetch = 0;
  }
}

export default ApiKeyService;

// Export singleton instance
export const apiKeyService = ApiKeyService.getInstance();
