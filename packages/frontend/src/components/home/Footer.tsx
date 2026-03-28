import { useTranslation } from 'react-i18next';
import Logo from '../common/Logo';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-gray-300 py-8">
      <div className="container-custom px-4 text-center">
        <Logo className="h-16 mx-auto mb-3" />
        <p className="text-sm text-gray-400 mb-1">{t('home.footerTagline')}</p>
        <p className="text-xs text-gray-500 mb-6 flex items-center justify-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Based in Heraklion
        </p>
        <div className="border-t border-gray-800 pt-4 text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Comfort Transfer Services. {t('home.allRightsReserved')}.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
