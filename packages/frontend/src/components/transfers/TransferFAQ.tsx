import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { calculatePrice } from '../../utils/pricing';

interface TransferFAQProps {
  fromName: string;
  toName: string;
  estimatedMinutes: number;
  estimatedKm: number;
}

const TransferFAQ = ({ fromName, toName, estimatedMinutes, estimatedKm }: TransferFAQProps) => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: t('transfers.faq.howLong', { from: fromName, to: toName }),
      answer: t('transfers.faq.howLongAnswer', { from: fromName, to: toName, minutes: estimatedMinutes, km: estimatedKm }),
    },
    {
      question: t('transfers.faq.howMuch', { from: fromName, to: toName }),
      answer: t('transfers.faq.howMuchAnswer', {
        from: fromName,
        to: toName,
        price: calculatePrice(estimatedKm, 1),
        priceVan: calculatePrice(estimatedKm, 5),
      }),
    },
    {
      question: t('transfers.faq.howBook'),
      answer: t('transfers.faq.howBookAnswer'),
    },
    {
      question: t('transfers.faq.passengers'),
      answer: t('transfers.faq.passengersAnswer'),
    },
    {
      question: t('transfers.faq.cancellation'),
      answer: t('transfers.faq.cancellationAnswer'),
    },
  ];

  return (
    <section className="py-12 sm:py-16">
      <div className="container-custom">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white mb-8 sm:mb-12">
          {t('transfers.faqTitle')}
        </h2>
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <span className="font-medium text-gray-900 dark:text-white pr-4">{faq.question}</span>
                <svg
                  className={`w-5 h-5 flex-shrink-0 text-gray-500 transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TransferFAQ;
