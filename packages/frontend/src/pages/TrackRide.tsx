import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Spinner from '../components/common/Spinner';

const TrackRide = () => {
  const navigate = useNavigate();
  const [rideNumber, setRideNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rideNumber.trim()) {
      setError('Παρακαλώ εισάγετε έναν αριθμό κράτησης');
      return;
    }

    setIsSearching(true);
    setError('');

    try {
      // For now, just navigate to the ride success page
      // In the future, this could search by ride number via API
      const formattedNumber = rideNumber.trim().toUpperCase();

      // Simple validation for format ER-YYYY-XXXXXX
      if (!formattedNumber.match(/^ER-\d{4}-\d{6}$/)) {
        setError('Μη έγκυρος αριθμός κράτησης. Χρησιμοποιήστε τη μορφή: ER-2026-000001');
        setIsSearching(false);
        return;
      }

      // TODO: Implement API call to search by ride number
      // For now, show error since we don't have the API endpoint
      setError('Η λειτουργία αναζήτησης θα είναι σύντομα διαθέσιμη. Χρησιμοποιήστε το link από το email επιβεβαίωσης.');

    } catch (err) {
      setError('Δεν βρέθηκε κράτηση με αυτόν τον αριθμό');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')}>
            <img src="/cts-logo.png" alt="Comfort Transfer Services" className="h-12 sm:h-16 md:h-20" />
          </button>
          <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => navigate('/')}>
            Αρχική
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-12">
        <Card className="p-4 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-3 sm:mb-4">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
              Εντοπισμός Κράτησης
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Εισάγετε τον αριθμό κράτησής σας για να δείτε τη κατάσταση
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="rideNumber" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Αριθμός Κράτησης
              </label>
              <Input
                id="rideNumber"
                type="text"
                placeholder="ER-2026-000001"
                value={rideNumber}
                onChange={(e) => {
                  setRideNumber(e.target.value);
                  setError('');
                }}
                className="text-center text-base sm:text-lg font-mono"
                disabled={isSearching}
              />
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Ο αριθμός κράτησης βρίσκεται στο email επιβεβαίωσης
              </p>
            </div>

            {error && (
              <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs sm:text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full text-sm sm:text-base"
              isLoading={isSearching}
              disabled={isSearching}
            >
              {isSearching ? 'Αναζήτηση...' : 'Εύρεση Κράτησης'}
            </Button>
          </form>

          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">Συχνές Ερωτήσεις</h3>
            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Πού βρίσκω τον αριθμό κράτησης;</p>
                <p>Ο αριθμός κράτησης σας στάλθηκε στο email σας μετά την ολοκλήρωση της κράτησης.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Δεν έλαβα email επιβεβαίωσης</p>
                <p>Ελέγξτε το φάκελο spam/junk. Αν χρειάζεστε βοήθεια, επικοινωνήστε μαζί μας.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Θέλω να ακυρώσω την κράτησή μου</p>
                <p>Χρησιμοποιήστε το link ακύρωσης στο email επιβεβαίωσης ή επικοινωνήστε μαζί μας.</p>
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 text-center">
            <button
              onClick={() => navigate('/book')}
              className="text-xs sm:text-sm text-primary-500 hover:text-primary-600 font-medium"
            >
              ← Νέα Κράτηση
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TrackRide;
