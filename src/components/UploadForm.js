import React, { useState } from 'react';
import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { fetchUrlPreview } from '../services/urlPreview';

// File type classification
const FILE_TYPES = {
  audio: {
    extensions: ['.mp3', '.wav', '.m4a', '.flac', '.aac'],
    color: '#FF6B6B',
    icon: '🎵',
    label: 'Audio',
    maxSize: 20 * 1024 * 1024
  },
  link: {
    color: '#4ECDC4',
    icon: '🔗',
    label: 'Link'
  },
  video: {
    extensions: ['.mp4', '.mov', '.avi'],
    color: '#95E77E',
    icon: '🎬',
    label: 'Video',
    maxSize: 10 * 1024 * 1024
  },
  image: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif'],
    color: '#FFE66D',
    icon: '📷',
    label: 'Image',
    maxSize: 10 * 1024 * 1024
  },
  document: {
    extensions: ['.pdf', '.doc', '.docx', '.txt'],
    color: '#A8E6CF',
    icon: '📄',
    label: 'Document',
    maxSize: 10 * 1024 * 1024
  },
  other: {
    color: '#C7CEEA',
    icon: '📁',
    label: 'Other',
    maxSize: 10 * 1024 * 1024
  }
};

function getFileType(fileName) {
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  for (const [type, config] of Object.entries(FILE_TYPES)) {
    if (config.extensions?.includes(ext)) return type;
  }
  return 'other';
}

function UploadForm({ user }) {
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState('file');
  const [linkPreview, setLinkPreview] = useState(null);
  const [fetchingPreview, setFetchingPreview] = useState(false);
  const { t } = useTranslation();

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = getFileType(file.name);
    const maxSize = FILE_TYPES[fileType].maxSize;

    if (file.size > maxSize) {
      alert(t('upload.fileTooLarge', { maxSize: maxSize / 1024 / 1024, fileType: t(`fileTypes.${fileType}`) }));
      return;
    }

    setUploading(true);
    try {
      // Upload to Storage
      const timestamp = Date.now();
      const storageRef = ref(storage, `uploads/${user.uid}/${timestamp}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(snapshot.ref);

      // Save metadata to Firestore
      await addDoc(collection(db, 'uploads'), {
        userId: user.uid,
        userName: user.displayName,
        timestamp: serverTimestamp(),
        type: fileType,
        fileName: file.name,
        fileUrl: fileUrl,
        fileSize: file.size,
        reactions: { '👍': 0, '🔥': 0, '❤️': 0, '🎵': 0, '💩': 0 }
      });

      e.target.value = ''; // Reset input
    } catch (error) {
      alert(t('upload.uploadFailed') + error.message);
    }
    setUploading(false);
  };

  const handleLinkPreview = async (url) => {
    if (!url) {
      setLinkPreview(null);
      return;
    }

    setFetchingPreview(true);
    try {
      const preview = await fetchUrlPreview(url);
      setLinkPreview(preview);
    } catch (error) {
      console.error('Preview fetch failed:', error);
      setLinkPreview(null);
    }
    setFetchingPreview(false);
  };

  const handleLinkInputChange = (e) => {
    const url = e.target.value;
    if (url.length > 10 && url.includes('.')) {
      // Debounce preview fetching
      clearTimeout(window.previewTimeout);
      window.previewTimeout = setTimeout(() => {
        handleLinkPreview(url);
      }, 1000);
    } else {
      setLinkPreview(null);
    }
  };

  const handleLinkUpload = async (e) => {
    e.preventDefault();
    const linkUrl = e.target.link.value;
    if (!linkUrl) return;

    setUploading(true);
    try {
      const uploadData = {
        userId: user.uid,
        userName: user.displayName,
        timestamp: serverTimestamp(),
        type: 'link',
        linkUrl: linkUrl,
        reactions: { '👍': 0, '🔥': 0, '❤️': 0, '🎵': 0, '💩': 0 }
      };

      // Add preview data if available
      if (linkPreview) {
        uploadData.linkTitle = linkPreview.title;
        uploadData.linkDescription = linkPreview.description;
        uploadData.linkImage = linkPreview.image;
        uploadData.linkDomain = linkPreview.domain;
        uploadData.linkType = linkPreview.type;
      } else {
        uploadData.linkTitle = new URL(linkUrl).hostname;
      }

      await addDoc(collection(db, 'uploads'), uploadData);
      e.target.reset();
      setLinkPreview(null);
    } catch (error) {
      alert(t('upload.invalidUrl'));
    }
    setUploading(false);
  };

  return (
    <div className="upload-form">
      <div className="upload-tabs">
        <button 
          className={uploadType === 'file' ? 'active' : ''}
          onClick={() => setUploadType('file')}
        >
          {t('upload.uploadFile')}
        </button>
        <button 
          className={uploadType === 'link' ? 'active' : ''}
          onClick={() => setUploadType('link')}
        >
          {t('upload.shareLink')}
        </button>
      </div>

      {uploadType === 'file' ? (
        <input
          type="file"
          onChange={handleFileUpload}
          disabled={uploading}
          accept="audio/*,video/*,image/*,.pdf,.doc,.docx,.txt"
        />
      ) : (
        <form onSubmit={handleLinkUpload}>
          <input
            type="url"
            name="link"
            placeholder={t('upload.placeholder')}
            onChange={handleLinkInputChange}
            disabled={uploading}
          />
          
          {/* URL Preview */}
          {fetchingPreview && (
            <div className="link-preview-loading">
              ⏳ {t('upload.fetchingPreview')}
            </div>
          )}
          
          {linkPreview && (
            <div className="link-preview">
              <div className="link-preview-content">
                {linkPreview.image && (
                  <div className="link-preview-image">
                    <img src={linkPreview.image} alt="" onError={(e) => e.target.style.display = 'none'} />
                  </div>
                )}
                <div className="link-preview-text">
                  <div className="link-preview-title">{linkPreview.title}</div>
                  {linkPreview.description && (
                    <div className="link-preview-description">{linkPreview.description}</div>
                  )}
                  <div className="link-preview-domain">{linkPreview.domain}</div>
                </div>
              </div>
            </div>
          )}
          
          <button type="submit" disabled={uploading || fetchingPreview}>
            {t('upload.shareButton')}
          </button>
        </form>
      )}
      
      {uploading && <p>{t('upload.uploading')}</p>}
    </div>
  );
}

export default UploadForm;