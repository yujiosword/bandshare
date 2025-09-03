import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit, startAfter, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import FileCard from './FileCard';
import { useTranslation } from 'react-i18next';

const FILE_TYPES = {
  audio: { color: '#FF6B6B', icon: '🎵', label: 'Audio' },
  link: { color: '#4ECDC4', icon: '🔗', label: 'Link' },
  video: { color: '#95E77E', icon: '🎬', label: 'Video' },
  image: { color: '#FFE66D', icon: '📷', label: 'Image' },
  document: { color: '#A8E6CF', icon: '📄', label: 'Document' },
  other: { color: '#C7CEEA', icon: '📁', label: 'Other' }
};

const ITEMS_PER_PAGE = 20; // Only load 20 items at a time

function FileListOptimized({ filter, setFilter, user }) {
  const [uploads, setUploads] = useState([]);
  const [filteredUploads, setFilteredUploads] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { t } = useTranslation();

  // Initial load - use getDocs instead of listener for first batch
  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'uploads'), 
        orderBy('timestamp', 'desc'),
        limit(ITEMS_PER_PAGE)
      );
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUploads(data);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);
      setIsInitialLoad(false);
      
      // Only set up real-time listener for NEW uploads after initial load
      setupNewUploadsListener();
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
    setLoading(false);
  };

  // Listen only for NEW uploads (not the entire collection)
  const setupNewUploadsListener = () => {
    const q = query(
      collection(db, 'uploads'),
      orderBy('timestamp', 'desc'),
      limit(1) // Only listen for the newest upload
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!isInitialLoad && !snapshot.metadata.hasPendingWrites) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const newUpload = {
              id: change.doc.id,
              ...change.doc.data()
            };
            
            // Only add if it's not already in the list
            setUploads(prev => {
              if (prev.find(u => u.id === newUpload.id)) return prev;
              return [newUpload, ...prev];
            });
          }
        });
      }
    });
    
    return () => unsubscribe();
  };

  // Load more data (pagination)
  const loadMore = async () => {
    if (!lastDoc || !hasMore || loading) return;
    
    setLoading(true);
    try {
      const q = query(
        collection(db, 'uploads'),
        orderBy('timestamp', 'desc'),
        startAfter(lastDoc),
        limit(ITEMS_PER_PAGE)
      );
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUploads(prev => [...prev, ...data]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Error loading more data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    let filtered = [...uploads];
    
    // Filter by type
    if (filter.type !== 'all') {
      filtered = filtered.filter(upload => upload.type === filter.type);
    }
    
    // Filter by date range (days)
    if (filter.dateRange !== 'all') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - filter.dateRange);
      filtered = filtered.filter(upload => 
        upload.timestamp?.toDate() > cutoff
      );
    }
    
    setFilteredUploads(filtered);
  }, [uploads, filter]);

  return (
    <div className="file-list-container">
      <div className="filter-bar">
        <div className="filter-group">
          <label>{t('filters.type')}</label>
          <select 
            value={filter.type} 
            onChange={(e) => setFilter({...filter, type: e.target.value})}
          >
            <option value="all">{t('filters.allTypes')}</option>
            {Object.entries(FILE_TYPES).map(([key, config]) => (
              <option key={key} value={key}>
                {config.icon} {t(`fileTypes.${key}`)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>{t('filters.time')}</label>
          <select 
            value={filter.dateRange} 
            onChange={(e) => setFilter({...filter, dateRange: e.target.value})}
          >
            <option value="1">{t('filters.today')}</option>
            <option value="7">{t('filters.lastWeek')}</option>
            <option value="30">{t('filters.lastMonth')}</option>
            <option value="all">{t('filters.allTime')}</option>
          </select>
        </div>

        <div className="filter-stats">
          {t('filters.showing', { count: filteredUploads.length })}
          {hasMore && ' (more available)'}
        </div>
      </div>

      <div className="file-grid">
        {filteredUploads.map(upload => (
          <FileCard key={upload.id} upload={upload} currentUser={user} />
        ))}
      </div>

      {hasMore && (
        <div className="load-more-container">
          <button 
            onClick={loadMore} 
            disabled={loading}
            className="load-more-btn"
          >
            {loading ? 'Loading...' : 'Load More Files'}
          </button>
        </div>
      )}
    </div>
  );
}

export default FileListOptimized;