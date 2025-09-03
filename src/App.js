import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';
import UploadForm from './components/UploadForm';
import FileListOptimized from './components/FileListOptimized';
import InviteSystem from './components/InviteSystem';
import UserProfile from './components/UserProfile';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useUserProfileOptimized } from './hooks/useUserProfileOptimized';
import { useTranslation } from 'react-i18next';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [isAllowed, setIsAllowed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('files'); // 'files', 'invites', 'profile'
  const [filter, setFilter] = useState({ type: 'all', userId: 'all', dateRange: 7 });
  
  const { displayName, updateDisplayName } = useUserProfileOptimized(user);
  const { t } = useTranslation();

  // Check for invite token in URL
  const checkInviteToken = async (user) => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteToken = urlParams.get('invite');
    
    if (inviteToken) {
      try {
        // Check if invite token exists and is unused
        const inviteRef = doc(db, 'invites', inviteToken);
        const inviteSnap = await getDoc(inviteRef);
        
        if (inviteSnap.exists() && !inviteSnap.data().used) {
          // Mark invite as used
          await updateDoc(inviteRef, {
            used: true,
            usedBy: user.uid,
            usedByEmail: user.email,
            usedByName: user.displayName,
            usedAt: serverTimestamp()
          });

          // Add user to allowlist
          await setDoc(doc(db, 'allowlist', user.email), {
            invited: true,
            invitedBy: inviteSnap.data().createdByEmail,
            inviteToken: inviteToken,
            timestamp: serverTimestamp()
          });

          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          return true;
        }
      } catch (error) {
        console.error('Error processing invite:', error);
      }
    }
    
    return false;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // First check if there's an invite token
        const inviteProcessed = await checkInviteToken(user);
        
        // Then check if user is in allowlist
        const allowlistRef = doc(db, 'allowlist', user.email);
        try {
          const allowlistSnap = await getDoc(allowlistRef);
          if (allowlistSnap.exists() || inviteProcessed) {
            setUser(user);
            setIsAllowed(true);
          } else {
            setIsAllowed(false);
            await signOut(auth);
          }
        } catch (error) {
          console.error('Error checking allowlist:', error);
          setIsAllowed(false);
          await signOut(auth);
        }
      } else {
        setUser(null);
        setIsAllowed(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = () => signInWithPopup(auth, googleProvider);
  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="login-container">
        <LanguageSwitcher />
        <h1>{t('appTitle')}</h1>
        <p>{t('auth.loading')}</p>
      </div>
    );
  }

  if (isAllowed === false) {
    return (
      <div className="login-container">
        <LanguageSwitcher />
        <h1>{t('appTitle')}</h1>
        <div className="error-message">
          <p>{t('auth.accessDenied')}</p>
          <p>{t('auth.needInvitation')}</p>
          <p>{t('auth.contactAdmin')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="login-container">
        <LanguageSwitcher />
        <h1>{t('appTitle')}</h1>
        <button onClick={handleLogin} className="login-btn">
          {t('auth.signInWithGoogle')}
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <h1>{t('appTitle')}</h1>
        <div className="user-info">
          <LanguageSwitcher />
          <div className="nav-buttons">
            <button 
              onClick={() => setCurrentView('files')}
              className={`nav-btn ${currentView === 'files' ? 'active' : ''}`}
            >
              {t('navigation.files')}
            </button>
            <button 
              onClick={() => setCurrentView('invites')}
              className={`nav-btn ${currentView === 'invites' ? 'active' : ''}`}
            >
              {t('navigation.invites')}
            </button>
            <button 
              onClick={() => setCurrentView('profile')}
              className={`nav-btn ${currentView === 'profile' ? 'active' : ''}`}
            >
              {t('navigation.profile')}
            </button>
          </div>
          <span className="user-name">{displayName}</span>
          <button onClick={handleLogout} className="logout-btn">{t('auth.logout')}</button>
        </div>
      </header>
      
      {currentView === 'files' && (
        <>
          <UploadForm user={user} />
          <FileListOptimized filter={filter} setFilter={setFilter} user={user} />
        </>
      )}
      
      {currentView === 'invites' && (
        <InviteSystem user={user} />
      )}
      
      {currentView === 'profile' && (
        <UserProfile user={user} onNicknameUpdate={updateDisplayName} />
      )}
    </div>
  );
}

export default App;