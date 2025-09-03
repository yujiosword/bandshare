import React, { useState } from 'react';
import { doc, updateDoc, setDoc, increment, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useUserDisplayName } from '../hooks/useUserProfileOptimized';
import { useTranslation } from 'react-i18next';
import DeleteConfirmDialog from './DeleteConfirmDialog';

const FILE_TYPES = {
  audio: { color: '#FF6B6B', icon: '🎵', label: 'Audio' },
  link: { color: '#4ECDC4', icon: '🔗', label: 'Link' },
  video: { color: '#95E77E', icon: '🎬', label: 'Video' },
  image: { color: '#FFE66D', icon: '📷', label: 'Image' },
  document: { color: '#A8E6CF', icon: '📄', label: 'Document' },
  other: { color: '#C7CEEA', icon: '📁', label: 'Other' }
};

const REACTIONS = ['👍', '🔥', '❤️', '🎵', '💩'];

function FileCard({ upload, currentUser }) {
  const [userReaction, setUserReaction] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const typeConfig = FILE_TYPES[upload.type] || FILE_TYPES.other;
  const { t } = useTranslation();
  
  // Get display name for the uploader
  const { displayName: uploaderDisplayName } = useUserDisplayName(
    upload.userId, 
    upload.userName
  );

  // Check if current user can delete this item
  const canDelete = currentUser && upload.userId === currentUser.uid;

  const handleReaction = async (emoji) => {
    const uploadRef = doc(db, 'uploads', upload.id);
    const reactionRef = doc(db, 'uploads', upload.id, 'reactions', currentUser.uid);

    try {
      // Remove previous reaction if exists
      if (userReaction && userReaction !== emoji) {
        await updateDoc(uploadRef, {
          [`reactions.${userReaction}`]: increment(-1)
        });
      }

      // Toggle or add new reaction
      if (userReaction === emoji) {
        // Remove reaction
        await updateDoc(uploadRef, {
          [`reactions.${emoji}`]: increment(-1)
        });
        setUserReaction(null);
      } else {
        // Add reaction
        await updateDoc(uploadRef, {
          [`reactions.${emoji}`]: increment(1)
        });
        await setDoc(reactionRef, {
          emoji: emoji,
          timestamp: new Date(),
          userName: currentUser.displayName
        });
        setUserReaction(emoji);
      }
    } catch (error) {
      console.error('Reaction failed:', error);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'uploads', upload.id));
      
      // Delete file from Storage if it's not a link
      if (upload.type !== 'link' && upload.fileUrl) {
        try {
          // Extract file path from URL
          const fileRef = ref(storage, upload.fileUrl);
          await deleteObject(fileRef);
        } catch (storageError) {
          console.warn('File may already be deleted from storage:', storageError);
        }
      }

      setShowDeleteDialog(false);
      // Show success message briefly
      alert(t('delete.success'));
    } catch (error) {
      console.error('Delete failed:', error);
      alert(t('delete.failed') + error.message);
    }
    setDeleting(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="file-card">
      <div className="file-header">
        <span 
          className="file-type-badge" 
          style={{ backgroundColor: typeConfig.color }}
        >
          {typeConfig.icon} {typeConfig.label}
        </span>
        <div className="file-header-right">
          <span className="file-time">
            {upload.timestamp?.toDate().toLocaleDateString()}
          </span>
          {canDelete && (
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="delete-btn"
              disabled={deleting}
              title={t('delete.button')}
            >
              {deleting ? '⏳' : '🗑️'}
            </button>
          )}
        </div>
      </div>

      <div className="file-content">
        {upload.type === 'link' ? (
          <div className="link-card">
            <a href={upload.linkUrl} target="_blank" rel="noopener noreferrer" className="link-card-link">
              {upload.linkImage && (
                <div className="link-card-image">
                  <img src={upload.linkImage} alt="" onError={(e) => e.target.style.display = 'none'} />
                </div>
              )}
              <div className="link-card-content">
                <div className="link-card-title">
                  🔗 {upload.linkTitle || upload.linkUrl}
                </div>
                {upload.linkDescription && (
                  <div className="link-card-description">
                    {upload.linkDescription}
                  </div>
                )}
                <div className="link-card-domain">
                  {upload.linkDomain || new URL(upload.linkUrl).hostname}
                </div>
              </div>
            </a>
          </div>
        ) : (
          <>
            <div className="file-name">{upload.fileName}</div>
            {upload.type === 'audio' && (
              <audio controls src={upload.fileUrl} className="audio-player" />
            )}
            {upload.type === 'image' && (
              <img src={upload.fileUrl} alt={upload.fileName} className="image-preview" />
            )}
            <div className="file-meta">
              {formatFileSize(upload.fileSize)}
            </div>
          </>
        )}
      </div>

      <div className="file-footer">
        <div className="uploader">
          👤 {uploaderDisplayName}
        </div>
        <div className="reactions">
          {REACTIONS.map(emoji => (
            <button
              key={emoji}
              className={`reaction-btn ${userReaction === emoji ? 'active' : ''}`}
              onClick={() => handleReaction(emoji)}
            >
              {emoji} {upload.reactions?.[emoji] || 0}
            </button>
          ))}
        </div>
      </div>

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        itemType={upload.type}
      />
    </div>
  );
}

export default FileCard;