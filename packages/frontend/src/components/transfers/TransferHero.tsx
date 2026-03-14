import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../common/Button';

interface TransferHeroProps {
  fromName: string;
  toName: string;
  bookingUrl: string;
}

const TransferHero = ({ fromName, toName, bookingUrl }: TransferHeroProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-800 dark:to-gray-900 text-white py-16 sm:py-24">
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative container-custom text-center">
        <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 drop-shadow-md">
          {t('transfers.heroTitle', { from: fromName, to: toName })}
        </h1>
        <p className="text-lg sm:text-xl text-white/80 mb-8 sm:mb-10 max-w-2xl mx-auto">
          {t('transfers.heroSubtitle', { from: fromName, to: toName })}
        </p>
        <Button
          onClick={() => navigate(bookingUrl)}
          size="lg"
          className="text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6"
        >
          {t('transfers.bookNow')}
        </Button>
      </div>
    </section>
  );
};

export default TransferHero;
