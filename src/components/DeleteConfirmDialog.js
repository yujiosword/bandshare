import React from 'react';
import { useTranslation } from 'react-i18next';

function DeleteConfirmDialog({ isOpen, onConfirm, onCancel, itemType }) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="delete-dialog-overlay" onClick={onCancel}>
      <div className="delete-dialog" onClick={e => e.stopPropagation()}>
        <div className="delete-dialog-header">
          <h3>{t('delete.confirmTitle')}</h3>
        </div>
        
        <div className="delete-dialog-body">
          <p>{t('delete.confirm')}</p>
          <p className="delete-warning">
            ⚠️ {itemType === 'link' ? 'This link' : 'This file and its data'} will be permanently removed.
          </p>
        </div>
        
        <div className="delete-dialog-actions">
          <button 
            onClick={onCancel}
            className="delete-cancel-btn"
          >
            {t('delete.cancel')}
          </button>
          <button 
            onClick={onConfirm}
            className="delete-confirm-btn"
          >
            {t('delete.yes')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmDialog;