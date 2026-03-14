import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-gray-300 py-8">
      <div className="container-custom px-4 text-center">
        <img src="/cts-logo.png" alt="Comfort Transfer Services" className="h-16 mx-auto mb-3" />
        <p className="text-sm text-gray-400 mb-6">{t('home.footerTagline')}</p>
        <div className="border-t border-gray-800 pt-4 text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Comfort Transfer Services. {t('home.allRightsReserved')}.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
