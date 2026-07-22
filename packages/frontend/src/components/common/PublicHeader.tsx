import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';
import Button from './Button';

const PublicHeader = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.email === 'giannis2001.gs@gmail.com';

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-sm">
        <div className="container-custom py-3 sm:py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')}>
            <Logo className="h-10 sm:h-12 md:h-16" />
          </button>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <LanguageSelector />
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Button className="bg-amber-500 hover:bg-amber-600 text-xs sm:text-sm" size="sm" onClick={() => navigate('/admin')}>
                    Admin
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm" onClick={() => navigate('/rides')}>
                  {t('common.myRides')}
                </Button>
                <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={logout}>
                  {t('common.logout')}
                </Button>
              </>
            ) : (
              <Button size="sm" className="text-xs sm:text-sm" onClick={() => navigate('/login')}>
                {t('common.login')}
              </Button>
            )}
          </div>

          {/* Mobile */}
          <div className="flex sm:hidden items-center gap-2">
            <ThemeToggle />
            <LanguageSelector />
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 text-gray-600 dark:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile sidebar */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 sm:hidden" onClick={() => setMenuOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-64 bg-white dark:bg-gray-800 shadow-2xl z-50 sm:hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <span className="font-bold text-gray-900 dark:text-white">{t('common.menu')}</span>
              <button onClick={() => setMenuOpen(false)} className="p-1 text-gray-500 dark:text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              <button onClick={() => { navigate('/'); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" /></svg>
                {t('common.home')}
              </button>
              <button onClick={() => { navigate('/book'); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {t('home.bookRide')}
              </button>
              <button onClick={() => { navigate('/tours'); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {t('home.services.tours.title')}
              </button>
              {isAuthenticated && (
                <button onClick={() => { navigate('/rides'); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  {t('common.myRides')}
                </button>
              )}
              {isAdmin && (
                <button onClick={() => { navigate('/admin'); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Admin
                </button>
              )}
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              {isAuthenticated ? (
                <button onClick={() => { logout(); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  {t('common.logout')}
                </button>
              ) : (
                <button onClick={() => { navigate('/login'); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  {t('common.login')}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default PublicHeader;
