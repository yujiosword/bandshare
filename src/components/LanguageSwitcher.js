import React from 'react';
import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const getCurrentLanguage = () => {
    return i18n.language || 'en';
  };

  return (
    <div className="language-switcher">
      <button 
        className="language-btn"
        onClick={() => changeLanguage(getCurrentLanguage() === 'en' ? 'zh-TW' : 'en')}
        title={getCurrentLanguage() === 'en' ? t('language.traditionalChinese') : t('language.english')}
      >
        {t('language.switch')} {getCurrentLanguage() === 'en' ? '中' : 'EN'}
      </button>
    </div>
  );
}

export default LanguageSwitcher;