import { useTranslation } from 'react-i18next';
import { Region } from '../../data/destinations';

const REGIONS: (Region | undefined)[] = [undefined, 'heraklion', 'rethymno', 'chania', 'lasithi'];

interface RegionFilterProps {
  selected: Region | undefined;
  onChange: (region: Region | undefined) => void;
}

const RegionFilter = ({ selected, onChange }: RegionFilterProps) => {
  const { t } = useTranslation();

  const getLabel = (region: Region | undefined) => {
    if (!region) return t('destinations.allRegions');
    return t(`destinations.${region}`);
  };

  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
      {REGIONS.map((region) => {
        const isActive = selected === region;
        return (
          <button
            key={region ?? 'all'}
            onClick={() => onChange(region)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {getLabel(region)}
          </button>
        );
      })}
    </div>
  );
};

export default RegionFilter;
