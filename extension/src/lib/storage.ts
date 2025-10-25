import type { UserPreferences, StorageData } from '@/types'

/**
 * Chrome Storage Wrapper
 * Provides type-safe access to chrome.storage.local and chrome.storage.sync
 *
 * Note: In Manifest V3, service workers cannot use localStorage.
 * Must use chrome.storage API for persistence.
 */

// Storage keys
const STORAGE_KEYS = {
  PREFERENCES: 'preferences',
  API_KEY: 'apiKey',
  MODE: 'mode',
  LAST_SYNC: 'lastSync'
} as const

/**
 * Get user preferences from storage
 */
export async function getPreferences(): Promise<UserPreferences | null> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.PREFERENCES)
    return result[STORAGE_KEYS.PREFERENCES] || null
  } catch (error) {
    console.error('Failed to get preferences:', error)
    return null
  }
}

/**
 * Save user preferences to storage
 */
export async function savePreferences(preferences: UserPreferences): Promise<void> {
  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.PREFERENCES]: preferences,
      [STORAGE_KEYS.LAST_SYNC]: Date.now()
    })
  } catch (error) {
    console.error('Failed to save preferences:', error)
    throw new Error('Failed to save preferences')
  }
}

/**
 * Get API key from storage (encrypted in production)
 */
export async function getApiKey(): Promise<string | null> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.API_KEY)
    return result[STORAGE_KEYS.API_KEY] || null
  } catch (error) {
    console.error('Failed to get API key:', error)
    return null
  }
}

/**
 * Save API key to storage
 * Note: In production, this should be encrypted
 */
export async function saveApiKey(apiKey: string): Promise<void> {
  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.API_KEY]: apiKey
    })
  } catch (error) {
    console.error('Failed to save API key:', error)
    throw new Error('Failed to save API key')
  }
}

/**
 * Get current mode from storage
 */
export async function getMode(): Promise<'suggestion' | 'yolo'> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.MODE)
    return result[STORAGE_KEYS.MODE] || 'suggestion'
  } catch (error) {
    console.error('Failed to get mode:', error)
    return 'suggestion' // Default to suggestion mode on error
  }
}

/**
 * Set current mode in storage
 */
export async function setMode(mode: 'suggestion' | 'yolo'): Promise<void> {
  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.MODE]: mode
    })
  } catch (error) {
    console.error('Failed to set mode:', error)
    throw new Error('Failed to set mode')
  }
}

/**
 * Get all storage data
 */
export async function getAllStorage(): Promise<StorageData> {
  try {
    const result = await chrome.storage.local.get(null)
    return result as StorageData
  } catch (error) {
    console.error('Failed to get all storage:', error)
    return {}
  }
}

/**
 * Clear all storage data
 */
export async function clearAllStorage(): Promise<void> {
  try {
    await chrome.storage.local.clear()
  } catch (error) {
    console.error('Failed to clear storage:', error)
    throw new Error('Failed to clear storage')
  }
}

/**
 * Listen for mode changes
 */
export function onModeChange(callback: (mode: 'suggestion' | 'yolo') => void): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes[STORAGE_KEYS.MODE]) {
      const newMode = changes[STORAGE_KEYS.MODE].newValue
      if (newMode) {
        callback(newMode)
      }
    }
  })
}

/**
 * Listen for preferences changes
 */
export function onPreferencesChange(callback: (preferences: UserPreferences) => void): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes[STORAGE_KEYS.PREFERENCES]) {
      const newPreferences = changes[STORAGE_KEYS.PREFERENCES].newValue
      if (newPreferences) {
        callback(newPreferences)
      }
    }
  })
}

/**
 * Get storage usage statistics
 */
export async function getStorageUsage(): Promise<{ bytesInUse: number; quota: number }> {
  try {
    const bytesInUse = await chrome.storage.local.getBytesInUse(null)
    // chrome.storage.local has a quota of 10MB (10485760 bytes)
    const quota = chrome.storage.local.QUOTA_BYTES
    return { bytesInUse, quota }
  } catch (error) {
    console.error('Failed to get storage usage:', error)
    return { bytesInUse: 0, quota: 10485760 }
  }
}
