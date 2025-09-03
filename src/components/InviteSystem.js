import React, { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useTranslation } from 'react-i18next';

function InviteSystem({ user }) {
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  const generateInviteLink = async () => {
    setLoading(true);
    try {
      // Generate unique invite token
      const inviteToken = Math.random().toString(36).substr(2, 15) + Date.now().toString(36);
      
      // Save invite token to Firestore
      await setDoc(doc(db, 'invites', inviteToken), {
        createdBy: user.uid,
        createdByEmail: user.email,
        createdByName: user.displayName,
        timestamp: serverTimestamp(),
        used: false,
        usedBy: null,
        usedAt: null
      });

      // Create invite link
      const link = `${window.location.origin}?invite=${inviteToken}`;
      setInviteLink(link);
    } catch (error) {
      alert(t('invites.generateFailed') + error.message);
    }
    setLoading(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="invite-system">
      <div className="invite-header">
        <h3>{t('invites.title')}</h3>
        <p>{t('invites.description')}</p>
      </div>

      <div className="invite-actions">
        <button 
          onClick={generateInviteLink} 
          disabled={loading}
          className="generate-btn"
        >
          {loading ? t('invites.generating') : t('invites.generateLink')}
        </button>
      </div>

      {inviteLink && (
        <div className="invite-link-container">
          <div className="invite-link">
            <input 
              type="text" 
              value={inviteLink} 
              readOnly 
              className="link-input"
            />
            <button 
              onClick={copyToClipboard}
              className="copy-btn"
            >
              {copied ? t('invites.copied') : t('invites.copy')}
            </button>
          </div>
          <p className="invite-instructions">
            {t('invites.instructions')}
          </p>
        </div>
      )}
    </div>
  );
}

export default InviteSystem;