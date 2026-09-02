import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as carouselService from '../../services/carousel.service';
import VanCoverflow from './VanCoverflow';

const VehicleInfo = () => {
  const { t } = useTranslation();
  const [vanImages, setVanImages] = useState<string[]>([]);

  useEffect(() => {
    carouselService.getActiveImages('van')
      .then((imgs) => setVanImages(imgs.map((img) => img.url)))
      .catch(() => {});
  }, []);

  return (
    <section className="py-16 sm:py-20 bg-white dark:bg-gray-800">
      <div className="container-custom px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* 3D Coverflow Gallery */}
          <div className="py-4">
            <VanCoverflow images={vanImages} />
          </div>

          {/* Info */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8">
              {t('home.vehicleTitle')}
            </h2>

            <div className="space-y-6">
              {/* Seats */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('home.vehicleSeats')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('home.vehicleSeatsDesc')}
                  </p>
                </div>
              </div>

              {/* Pricing */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('home.pricingRule')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('home.pricingRuleDesc')}
                  </p>
                </div>
              </div>

              {/* Free WiFi */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('home.vehicleWifi')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('home.vehicleWifiDesc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VehicleInfo;
