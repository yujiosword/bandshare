import React, { useState, useEffect, useRef } from 'react';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useTranslation } from 'react-i18next';

function UserProfile({ user, onNicknameUpdate }) {
  const [nickname, setNickname] = useState('');
  const [currentNickname, setCurrentNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const { t } = useTranslation();
  const profileCache = useRef(null);
  const lastFetch = useRef(0);

  const loadUserProfile = async () => {
    if (!user?.uid) return;
    
    // Check if we've recently fetched (within 5 seconds)
    const now = Date.now();
    if (profileCache.current && (now - lastFetch.current < 5000)) {
      const cached = profileCache.current;
      setCurrentNickname(cached.nickname);
      setNickname(cached.nickname);
      return;
    }
    
    try {
      const profileRef = doc(db, 'userProfiles', user.uid);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        const profile = profileSnap.data();
        const savedNickname = profile.nickname || user.displayName;
        setCurrentNickname(savedNickname);
        setNickname(savedNickname);
        // Cache the result
        profileCache.current = { nickname: savedNickname };
        lastFetch.current = now;
      } else {
        setCurrentNickname(user.displayName);
        setNickname(user.displayName);
        // Cache the result
        profileCache.current = { nickname: user.displayName };
        lastFetch.current = now;
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setCurrentNickname(user.displayName);
      setNickname(user.displayName);
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, [user?.uid]); // Only depend on user.uid to avoid infinite loops

  const saveNickname = async () => {
    if (!nickname.trim()) {
      setMessage(t('profile.nicknameEmpty'));
      return;
    }

    if (nickname.trim().length > 30) {
      setMessage(t('profile.nicknameTooLong'));
      return;
    }

    setSaving(true);
    setMessage(''); // Clear any previous messages
    
    try {
      const profileRef = doc(db, 'userProfiles', user.uid);
      const profileData = {
        uid: user.uid,
        email: user.email,
        nickname: nickname.trim(),
        originalName: user.displayName,
        updatedAt: serverTimestamp()
      };
      
      
      await setDoc(profileRef, profileData, { merge: true });

      // Verify the save was successful
      await getDoc(profileRef);

      setCurrentNickname(nickname.trim());
      setMessage(t('profile.updateSuccess'));
      
      // Update cache
      profileCache.current = { nickname: nickname.trim() };
      lastFetch.current = Date.now();
      
      // Call the callback to update the display name in the header
      if (onNicknameUpdate) {
        onNicknameUpdate(nickname.trim());
      }
      
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      console.error('Error saving nickname:', error);
      setMessage(t('profile.updateFailed') + ' ' + error.message);
    }
    setSaving(false);
  };

  const resetToOriginal = () => {
    setNickname(user.displayName);
  };

  return (
    <div className="user-profile">
      <div className="profile-header">
        <h3>{t('profile.title')}</h3>
        <p>{t('profile.description')}</p>
      </div>

      <div className="profile-info">
        <div className="info-item">
          <label>{t('profile.email')}</label>
          <span className="email">{user.email}</span>
        </div>
        
        <div className="info-item">
          <label>{t('profile.originalName')}</label>
          <span className="original-name">{user.displayName}</span>
        </div>
      </div>

      <div className="nickname-section">
        <div className="nickname-input-group">
          <label htmlFor="nickname">{t('profile.displayName')}</label>
          <div className="nickname-controls">
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t('profile.enterNickname')}
              maxLength={30}
              className="nickname-input"
            />
            <button 
              onClick={resetToOriginal}
              className="reset-btn"
              type="button"
            >
              {t('profile.reset')}
            </button>
          </div>
          <div className="character-count">
            {t('profile.characters', { count: nickname.length })}
          </div>
        </div>

        <div className="nickname-actions">
          <button 
            onClick={saveNickname}
            disabled={saving || nickname.trim() === currentNickname}
            className="save-btn"
          >
            {saving ? t('profile.saving') : t('profile.saveNickname')}
          </button>
        </div>

        {message && (
          <div className={`message ${message.startsWith('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </div>

      <div className="preview-section">
        <h4>{t('profile.preview')}</h4>
        <div className="name-preview">
          <span className="preview-label">{t('profile.nameWillAppear')}</span>
          <span className="preview-name">{t('fileInfo.uploadedBy')} {nickname.trim() || user.displayName}</span>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;