import { useTranslation } from 'react-i18next';
import { DESTINATIONS } from '../../data/destinations';

interface DestinationDescriptionProps {
  toKey: string;
}

const DestinationDescription = ({ toKey }: DestinationDescriptionProps) => {
  const { t, i18n } = useTranslation();

  const destination = DESTINATIONS.find((d) => d.locationKey === toKey);
  if (!destination) return null;

  const nameKey = `destinations.${destination.id}.name`;
  const descKey = `destinations.${destination.id}.description`;

  // Check if translation exists
  if (!i18n.exists(descKey)) return null;

  return (
    <section className="py-12 sm:py-16 bg-white dark:bg-gray-900">
      <div className="container-custom px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {t(nameKey)}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg leading-relaxed">
            {t(descKey)}
          </p>
        </div>
      </div>
    </section>
  );
};

export default DestinationDescription;
