import { useTranslation } from 'react-i18next';

const AboutSection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-16 sm:py-20 bg-white dark:bg-gray-800">
      <div className="container-custom px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            {t('home.about.title')}
          </h2>
          <div className="space-y-4 text-gray-600 dark:text-gray-400 text-base sm:text-lg leading-relaxed">
            <p>{t('home.about.p1')}</p>
            <p>{t('home.about.p2')}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
