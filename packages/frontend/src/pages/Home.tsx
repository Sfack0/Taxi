import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';
import LanguageSelector from '../components/common/LanguageSelector';
import ThemeToggle from '../components/common/ThemeToggle';
import HeroCarousel from '../components/home/HeroCarousel';
import ServicesSection from '../components/home/ServicesSection';
import AboutSection from '../components/home/AboutSection';
import VehicleInfo from '../components/home/VehicleInfo';
import ContactSection from '../components/home/ContactSection';
import PopularDestinations from '../components/home/PopularDestinations';
import Footer from '../components/home/Footer';
import Logo from '../components/common/Logo';


const Home = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();

  // Check if user is admin (role === 'admin' or email matches admin email)
  const isAdmin = user?.role === 'admin' || user?.email === 'giannis2001.gs@gmail.com';

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-sm">
        <div className="container-custom py-3 sm:py-4 flex items-center justify-between">
          {/* Logo */}
          <Logo className="h-14 sm:h-16 md:h-20" />

          {/* Nav */}
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <LanguageSelector />
            {isAuthenticated ? (
              <>
                {isAdmin ? (
                  <Button className="bg-amber-500 hover:bg-amber-600 text-xs sm:text-sm" size="sm" onClick={() => navigate('/admin')}>
                    Admin
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" className="text-xs sm:text-sm" onClick={() => navigate('/rides')}>
                    {t('common.myRides')}
                  </Button>
                )}
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
        </div>
      </header>

      {/* Hero Section with Carousel */}
      <HeroCarousel>
        <h1 className="font-heading text-white font-bold mb-3 sm:mb-4 drop-shadow-lg text-center">
          <span className="block text-3xl sm:text-4xl md:text-5xl">{t('home.tagline')}</span>
          <span className="block text-base sm:text-lg md:text-xl mt-1 tracking-widest uppercase text-white/80">Heraklion · Crete</span>
        </h1>
        <p className="text-base sm:text-lg text-white/70 mb-2 max-w-xl text-center">
          {t('home.subtitle')}
        </p>
        <p className="flex items-center justify-center gap-1.5 text-sm text-white/50 mb-8 sm:mb-10">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Based in Heraklion
        </p>
        <Button
          onClick={() => navigate('/book')}
          size="lg"
          className="text-lg sm:text-xl px-10 sm:px-14 py-4 sm:py-6 shadow-lg"
        >
          {t('home.bookRide')}
        </Button>
        {/* Highlights */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-8 sm:mt-10">
          <div className="flex items-center gap-2 text-white/80 text-sm sm:text-base">
            <svg className="w-5 h-5 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('home.highlight24')}
          </div>
          <div className="flex items-center gap-2 text-white/80 text-sm sm:text-base">
            <svg className="w-5 h-5 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {t('home.highlightSeats')}
          </div>
          <div className="flex items-center gap-2 text-white/80 text-sm sm:text-base">
            <svg className="w-5 h-5 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('home.highlightCancel')}
          </div>
        </div>
      </HeroCarousel>

      {/* Services */}
      <ServicesSection />

      {/* Vehicle Info */}
      <VehicleInfo />

      {/* Popular Destinations */}
      <PopularDestinations />

      {/* Contact */}
      <ContactSection />

      {/* About Us */}
      <AboutSection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
