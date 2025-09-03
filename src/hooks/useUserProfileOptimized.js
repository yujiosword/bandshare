import { useState, useEffect, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Cache for user profiles to avoid repeated reads
const profileCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useUserProfileOptimized = (user) => {
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const cacheKey = user?.uid;
  const lastFetchRef = useRef(0);

  const loadDisplayName = async (forceRefresh = false) => {
    if (!user) {
      setDisplayName('');
      setLoading(false);
      return;
    }
    
    // Check cache first
    const now = Date.now();
    const cached = profileCache.get(cacheKey);
    
    if (!forceRefresh && cached && (now - cached.timestamp < CACHE_DURATION)) {
      setDisplayName(cached.displayName);
      setLoading(false);
      return cached.displayName;
    }
    
    // Prevent duplicate reads if already fetching
    if (now - lastFetchRef.current < 1000) {
      return;
    }
    lastFetchRef.current = now;
    
    setLoading(true);
    try {
      const profileRef = doc(db, 'userProfiles', user.uid);
      const profileSnap = await getDoc(profileRef);
      
      let name;
      if (profileSnap.exists() && profileSnap.data().nickname) {
        name = profileSnap.data().nickname;
      } else {
        name = user.displayName;
      }
      
      // Update cache
      profileCache.set(cacheKey, {
        displayName: name,
        timestamp: now
      });
      
      setDisplayName(name);
      return name;
    } catch (error) {
      console.error('Error loading user profile:', error);
      setDisplayName(user.displayName || '');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDisplayName();
  }, [cacheKey]); // Only re-fetch if user.uid changes

  const updateDisplayName = (newNickname) => {
    setDisplayName(newNickname);
    // Update cache immediately
    if (cacheKey) {
      profileCache.set(cacheKey, {
        displayName: newNickname,
        timestamp: Date.now()
      });
    }
  };

  const clearCache = () => {
    if (cacheKey) {
      profileCache.delete(cacheKey);
    }
  };

  return { 
    displayName, 
    loading, 
    updateDisplayName, 
    refreshProfile: () => loadDisplayName(true),
    clearCache 
  };
};

// Batch fetch multiple user profiles at once
export const batchFetchUserProfiles = async (uids) => {
  const uniqueUids = [...new Set(uids)]; // Remove duplicates
  const uncachedUids = [];
  const results = {};
  const now = Date.now();
  
  // Check cache first
  for (const uid of uniqueUids) {
    const cached = profileCache.get(uid);
    if (cached && (now - cached.timestamp < CACHE_DURATION)) {
      results[uid] = cached.displayName;
    } else {
      uncachedUids.push(uid);
    }
  }
  
  // Batch fetch uncached profiles
  if (uncachedUids.length > 0) {
    const fetchPromises = uncachedUids.map(async (uid) => {
      try {
        const profileRef = doc(db, 'userProfiles', uid);
        const profileSnap = await getDoc(profileRef);
        
        const displayName = profileSnap.exists() && profileSnap.data().nickname
          ? profileSnap.data().nickname
          : 'Unknown User';
        
        // Update cache
        profileCache.set(uid, {
          displayName,
          timestamp: now
        });
        
        results[uid] = displayName;
      } catch (error) {
        console.error(`Error fetching profile for ${uid}:`, error);
        results[uid] = 'Unknown User';
      }
    });
    
    await Promise.all(fetchPromises);
  }
  
  return results;
};

// Hook to get display name for any user by UID (optimized with cache)
export const useUserDisplayName = (uid, fallbackName = '') => {
  const [displayName, setDisplayName] = useState(fallbackName);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setDisplayName(fallbackName);
      setLoading(false);
      return;
    }

    loadUserDisplayName();
  }, [uid, fallbackName]);

  const loadUserDisplayName = async () => {
    const now = Date.now();
    const cached = profileCache.get(uid);
    
    // Check cache first
    if (cached && (now - cached.timestamp < CACHE_DURATION)) {
      setDisplayName(cached.displayName);
      setLoading(false);
      return;
    }

    try {
      const profileRef = doc(db, 'userProfiles', uid);
      const profileSnap = await getDoc(profileRef);
      
      let name;
      if (profileSnap.exists() && profileSnap.data().nickname) {
        name = profileSnap.data().nickname;
      } else {
        name = fallbackName;
      }
      
      // Update cache
      profileCache.set(uid, {
        displayName: name,
        timestamp: now
      });
      
      setDisplayName(name);
    } catch (error) {
      console.error('Error loading user display name:', error);
      setDisplayName(fallbackName);
    }
    setLoading(false);
  };

  return { displayName, loading };
};