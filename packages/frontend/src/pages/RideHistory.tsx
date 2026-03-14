import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import type { Ride, RideStatus, StatusCounts } from '@cts/shared';
import DatePicker, { registerLocale } from 'react-datepicker';
import { el } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import * as bookingService from '../services/booking.service';
import * as authService from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import LanguageSelector from '../components/common/LanguageSelector';
import ThemeToggle from '../components/common/ThemeToggle';
import { LOCATIONS_DATA } from '../data/locations';
import { estimateRoadDistance } from '../utils/distance';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import SortDropdown from '../components/common/SortDropdown';

registerLocale('el', el);

type FilterType = 'all' | RideStatus;
type DatePreset = 'week' | 'month' | 'all' | 'custom';

const PAGE_SIZE = 15;

const localeMap: Record<string, string> = {
  el: 'el-GR',
  en: 'en-US',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
};

const getFirstDayOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

const getLastDayOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0);
};

const getFirstDayOfWeek = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.getFullYear(), now.getMonth(), diff);
};

const getLastDayOfWeek = () => {
  const first = getFirstDayOfWeek();
  return new Date(first.getTime() + 6 * 24 * 60 * 60 * 1000);
};

const RideHistory = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, refreshUser } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.email === 'giannis2001.gs@gmail.com';
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({ total: 0, pending: 0, accepted: 0, completed: 0, cancelled: 0 });
  const [startDate, setStartDate] = useState<Date | null>(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState<Date | null>(getLastDayOfMonth());
  const [datePreset, setDatePreset] = useState<DatePreset>('month');
  const [sortBy, setSortBy] = useState<string>('dateDesc');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);
  // Password section state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadRides = useCallback(async (pageToLoad: number, isReset: boolean) => {
    if (isReset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      const params: any = { page: pageToLoad, limit: PAGE_SIZE };
      if (filter !== 'all') {
        params.status = filter;
      }
      if (startDate) {
        params.startDate = startDate.toISOString().split('T')[0];
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        params.endDate = end.toISOString().split('T')[0];
      }
      params.sortBy = sortBy;
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      const response = await bookingService.getUserRides(params);

      if (isReset) {
        setRides(response.items);
      } else {
        setRides((prev) => [...prev, ...response.items]);
      }

      setHasMore(pageToLoad < response.totalPages);
      setPage(pageToLoad);

      if (response.statusCounts) {
        setStatusCounts(response.statusCounts as StatusCounts);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load ride history');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [filter, startDate, endDate, sortBy, debouncedSearch]);

  // Reset and load page 1 when filters change
  useEffect(() => {
    loadRides(1, true);
  }, [loadRides]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      loadRides(page + 1, false);
    }
  }, [isLoadingMore, hasMore, page, loadRides]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: isLoadingMore,
    onLoadMore: handleLoadMore,
  });

  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset === 'month') {
      setStartDate(getFirstDayOfMonth());
      setEndDate(getLastDayOfMonth());
    } else if (preset === 'week') {
      setStartDate(getFirstDayOfWeek());
      setEndDate(getLastDayOfWeek());
    } else {
      setStartDate(null);
      setEndDate(null);
    }
  };

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
    if (start === null && end === null) {
      setDatePreset('all');
    } else {
      setDatePreset('custom');
    }
  };

  const formatDate = (date: Date | string) => {
    const locale = localeMap[i18n.language] || 'el-GR';
    return new Date(date).toLocaleString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const translateLocation = (greekAddress: string) => {
    const loc = LOCATIONS_DATA.find(l => l.greek === greekAddress);
    return loc ? t(`locations.${loc.key}`) : greekAddress;
  };

  const getStatusBadgeColor = (status: RideStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusText = (status: RideStatus) => {
    switch (status) {
      case 'pending':
        return t('history.pending');
      case 'accepted':
        return t('history.accepted');
      case 'cancelled':
        return t('history.cancelled');
      case 'completed':
        return t('history.completed');
      default:
        return status.toUpperCase();
    }
  };

  const statusFilters: { labelKey: string; value: FilterType }[] = [
    { labelKey: 'history.all', value: 'all' },
    { labelKey: 'history.pending', value: 'pending' },
    { labelKey: 'history.accepted', value: 'accepted' },
    { labelKey: 'history.completed', value: 'completed' },
    { labelKey: 'history.cancelled', value: 'cancelled' },
  ];

  const handleCancelRide = async (rideId: string) => {
    setCancellingId(rideId);
    try {
      await bookingService.cancelRide(rideId);
      setRides(prev => prev.map(r => r._id === rideId ? { ...r, status: 'cancelled' as const } : r));
      setStatusCounts(prev => ({
        ...prev,
        cancelled: prev.cancelled + 1,
        pending: prev.pending - (rides.find(r => r._id === rideId)?.status === 'pending' ? 1 : 0),
        accepted: prev.accepted - (rides.find(r => r._id === rideId)?.status === 'accepted' ? 1 : 0),
      }));
    } catch {
      // error toast shown by API interceptor
    } finally {
      setCancellingId(null);
      setConfirmCancelId(null);
    }
  };

  const openProfileModal = () => {
    setProfileFirstName(user?.firstName || '');
    setProfileLastName(user?.lastName || '');
    setProfilePhone(user?.phone || '');
    setProfileError('');
    setProfileSuccess(false);
    setShowPasswordSection(isAdmin);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordError('');
    setPasswordSuccess(false);
    setShowProfileModal(true);
  };

  const handleSaveProfile = async () => {
    setProfileError('');
    if (!profileFirstName.trim() || !profileLastName.trim() || !profilePhone.trim()) {
      setProfileError(t('auth.allFieldsRequired'));
      return;
    }
    setProfileSaving(true);
    try {
      await authService.updateProfile({
        firstName: profileFirstName.trim(),
        lastName: profileLastName.trim(),
        phone: profilePhone.trim(),
      });
      await refreshUser();
      setProfileSuccess(true);
      setTimeout(() => {
        setShowProfileModal(false);
        setProfileSuccess(false);
      }, 1200);
    } catch (err: any) {
      setProfileError(err.response?.data?.error?.message || 'Error');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    if (newPassword.length < 8) {
      setPasswordError(t('auth.passwordTooShort'));
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError(t('auth.passwordMismatch'));
      return;
    }
    setChangingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      if (isAdmin) {
        setTimeout(() => {
          setShowProfileModal(false);
          setPasswordSuccess(false);
        }, 1200);
      }
    } catch (err: any) {
      const code = err.response?.data?.error?.code;
      if (code === 'WRONG_PASSWORD') {
        setPasswordError(t('auth.wrongPassword'));
      } else if (code === 'SAME_PASSWORD') {
        setPasswordError(t('auth.samePassword'));
      } else {
        setPasswordError(err.response?.data?.error?.message || 'Error');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const getEmptyMessage = () => {
    switch (filter) {
      case 'pending': return t('history.noPending');
      case 'accepted': return t('history.noAccepted');
      case 'completed': return t('history.noCompleted');
      case 'cancelled': return t('history.noCancelled');
      default: return t('history.noRides');
    }
  };

  return (
    <>
    <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <button onClick={() => navigate('/')}>
                <img src="/cts-logo.png" alt="Comfort Transfer Services" className="h-10 sm:h-12 md:h-16" />
              </button>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">{t('history.title')}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={openProfileModal}
                className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                title={isAdmin ? t('auth.changePassword') : t('auth.editProfile')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isAdmin ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  )}
                </svg>
              </button>
              <ThemeToggle />
              <LanguageSelector />
              <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => navigate('/')}>
                ← {t('common.back')}
              </Button>
            </div>
          </div>
          {/* Mobile title */}
          <h1 className="sm:hidden text-lg font-bold text-gray-900 dark:text-gray-100 mt-2">{t('history.title')}</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Filters */}
        <Card className="p-4 sm:p-6 mb-4 sm:mb-6">
          {/* Row 1: Sort dropdown */}
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold">{t('history.filters')}</h2>
            <SortDropdown
              value={sortBy}
              onChange={setSortBy}
              label={`${t('history.sortLabel')}:`}
              sheetTitle={t('history.sortLabel')}
              options={[
                { value: 'dateDesc', label: t('history.sortDateDesc') },
                { value: 'dateAsc', label: t('history.sortDateAsc') },
                { value: 'createdDesc', label: t('history.sortCreated') },
              ]}
            />
          </div>

          {/* Search bar */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('history.searchPlaceholder')}
                className="w-full sm:w-80 pl-9 pr-8 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Date range */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{i18n.language === 'el' ? 'Περίοδος' : t('history.selectDates')}</p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {([
                { key: 'week', label: 'history.thisWeek' },
                { key: 'month', label: 'history.thisMonth' },
                { key: 'all', label: 'history.allTime' },
              ] as { key: DatePreset; label: string }[]).map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => handlePresetChange(preset.key)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    datePreset === preset.key
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {t(preset.label)}
                </button>
              ))}
              <DatePicker
                selectsRange
                startDate={startDate}
                endDate={endDate}
                onChange={handleDateChange}
                locale="el"
                dateFormat="dd/MM/yyyy"
                placeholderText={t('history.selectDates')}
                className="px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 w-48 sm:w-56"
                isClearable
              />
            </div>
          </div>

        </Card>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <strong>{t('common.error')}:</strong> {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {/* Stats — clickable filters */}
            <div className="grid grid-cols-5 gap-1.5 sm:gap-3 mb-4 sm:mb-6 max-w-2xl mx-auto">
              {([
                { key: 'all' as FilterType, labelKey: 'history.all', count: statusCounts.total, color: 'text-gray-900 dark:text-gray-100', ring: 'ring-amber-400' },
                { key: 'pending' as FilterType, labelKey: 'history.pending', count: statusCounts.pending, color: 'text-amber-600', ring: 'ring-amber-400' },
                { key: 'accepted' as FilterType, labelKey: 'history.accepted', count: statusCounts.accepted, color: 'text-green-600', ring: 'ring-green-400' },
                { key: 'completed' as FilterType, labelKey: 'history.completed', count: statusCounts.completed, color: 'text-blue-500', ring: 'ring-blue-400' },
                { key: 'cancelled' as FilterType, labelKey: 'history.cancelled', count: statusCounts.cancelled, color: 'text-red-600', ring: 'ring-red-400' },
              ]).map(({ key, labelKey, count, color, ring }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`p-1.5 sm:p-3 text-center rounded-xl border transition-all cursor-pointer ${
                    filter === key
                      ? `ring-2 ${ring} border-transparent bg-white dark:bg-gray-800 shadow-sm`
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <p className={`text-[9px] sm:text-xs whitespace-nowrap ${filter === key ? color : 'text-gray-500 dark:text-gray-400'}`}>
                    {t(labelKey)}
                  </p>
                  <p className={`text-base sm:text-xl font-bold ${color}`}>{count}</p>
                </button>
              ))}
            </div>

            {/* Rides List */}
            <div className="space-y-3 sm:space-y-4">
              {rides.length === 0 ? (
                <Card className="p-8 sm:p-12 text-center">
                  <p className="text-gray-500">{getEmptyMessage()}</p>
                </Card>
              ) : (
                rides.map((ride) => {
                  const isTour = ride.pickup.address.startsWith('TOUR:');
                  const tourName = isTour ? ride.pickup.address.replace('TOUR: ', '') : '';
                  const tourStops = isTour ? ride.dropoff.address.split(' -> ') : [];

                  return (
                  <Card key={ride._id} className={`p-4 sm:p-6 ${isTour ? 'border-2 border-amber-400 dark:border-amber-600 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20' : ''}`}>
                    <div className="flex flex-col gap-4">
                      {/* Header: Status + Date */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        {isTour && (
                          <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-amber-500 text-white flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            TOUR
                          </span>
                        )}
                        {ride.isRoundtrip && (
                          <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            {t('booking.roundtripLabel')}
                          </span>
                        )}
                        <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(ride.status)}`}>
                          {getStatusText(ride.status)}
                        </span>
                        {ride.price != null && (
                          <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                            {t('booking.price')}: {ride.price}€
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 ml-auto">
                          {t('history.booking')}: {formatDate(ride.createdAt)}
                        </span>
                      </div>

                      {/* Route / Tour Info */}
                      {isTour ? (
                      <div>
                        <p className="text-sm sm:text-base font-bold text-amber-700 dark:text-amber-400 mb-2">{tourName}</p>
                        <div className="space-y-1">
                          {tourStops.map((stop, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{stop.trim()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      ) : (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">{t('confirmation.route')}</p>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0"></div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium">{t('confirmation.from')}</p>
                              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 break-words">{translateLocation(ride.pickup.address)}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-secondary-500 mt-1.5 flex-shrink-0"></div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium">{t('confirmation.to')}</p>
                              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 break-words">{translateLocation(ride.dropoff.address)}</p>
                            </div>
                          </div>
                          {(() => {
                            const dist = estimateRoadDistance(ride.pickup.address, ride.dropoff.address);
                            return dist ? (
                              <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 mt-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                                ~{dist} km
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </div>
                      )}

                      {/* Date boxes */}
                      <div className="flex flex-wrap gap-2">
                        <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                          <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <div>
                            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                              {ride.isRoundtrip ? t('confirmation.outbound') : t('confirmation.dateTime')}
                            </p>
                            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                              {ride.scheduledFor ? formatDate(ride.scheduledFor) : formatDate(ride.createdAt)}
                            </p>
                            {ride.people && (
                              <p className="text-xs text-amber-700 dark:text-amber-400">
                                {ride.people} {t('history.people')}
                              </p>
                            )}
                          </div>
                        </div>
                        {ride.isRoundtrip && ride.returnScheduledFor && (
                          <div className="inline-flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg px-3 py-2">
                            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div>
                              <p className="text-xs text-purple-700 dark:text-purple-400 font-medium">{t('confirmation.return')}</p>
                              <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                                {formatDate(ride.returnScheduledFor)}
                              </p>
                              {ride.returnPeople && (
                                <p className="text-xs text-purple-700 dark:text-purple-400">
                                  {ride.returnPeople} {t('history.people')}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Extras: Payment, Child Seat, Notes */}
                      <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-medium ${
                          ride.paymentMethod === 'card'
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                            : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                        }`}>
                          {ride.paymentMethod === 'card' ? (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                          )}
                          {ride.paymentMethod === 'card' ? t('booking.card') : t('booking.cash')}
                        </span>
                        {ride.childSeat && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg font-medium bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>
                            {t('booking.childSeat')}
                          </span>
                        )}
                      </div>

                      {/* Notes */}
                      {ride.notes && (() => {
                        const displayNotes = isTour
                          ? ride.notes.replace(/^\[TOUR\].*\n.*Στάσεις:.*\n?/i, '').replace(/^\[TOUR\].*\n.*Stops:.*\n?/i, '').trim()
                          : ride.notes;
                        return displayNotes ? (
                          <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">{t('booking.notes')}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{displayNotes}</p>
                          </div>
                        ) : null;
                      })()}

                      {/* Cancel button */}
                      {(ride.status === 'pending' || ride.status === 'accepted') && (
                        confirmCancelId === ride._id ? (
                          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-700 dark:text-red-400 flex-1">{t('history.confirmCancel')}</p>
                            <button
                              onClick={() => handleCancelRide(ride._id)}
                              disabled={cancellingId === ride._id}
                              className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                              {cancellingId === ride._id ? '...' : t('history.yesCancel')}
                            </button>
                            <button
                              onClick={() => setConfirmCancelId(null)}
                              className="px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                              {t('common.back')}
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <button
                              onClick={() => setConfirmCancelId(ride._id)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              {t('history.cancelRide')}
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </Card>
                  );
                })
              )}
            </div>

            {/* Infinite scroll sentinel */}
            {rides.length > 0 && (
              <>
                <div ref={sentinelRef} className="h-1" />
                {isLoadingMore && (
                  <div className="flex justify-center py-6">
                    <Spinner size="sm" />
                  </div>
                )}
                {!hasMore && rides.length > 0 && (
                  <p className="text-center text-sm text-gray-400 py-6">
                    {t('history.noMoreRides')}
                  </p>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Profile / Password Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowProfileModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              {isAdmin ? t('auth.changePassword') : t('auth.editProfile')}
            </h2>

            {/* Profile fields — only for non-admin */}
            {!isAdmin && (
              <>
                {profileSuccess ? (
                  <div className="flex items-center gap-2 p-3 mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-green-700 dark:text-green-400 font-medium">{t('auth.profileSaved')}</p>
                  </div>
                ) : (
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.firstName')}</label>
                      <input
                        type="text"
                        value={profileFirstName}
                        onChange={(e) => setProfileFirstName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.lastName')}</label>
                      <input
                        type="text"
                        value={profileLastName}
                        onChange={(e) => setProfileLastName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.phone')}</label>
                      <input
                        type="tel"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                      />
                    </div>

                    {profileError && (
                      <p className="text-sm text-red-600 dark:text-red-400">{profileError}</p>
                    )}

                    <button
                      onClick={handleSaveProfile}
                      disabled={profileSaving}
                      className="w-full px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                    >
                      {profileSaving ? '...' : t('auth.saveProfile')}
                    </button>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-gray-200 dark:border-gray-700 my-4" />

                {/* Toggle password section */}
                <button
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  {t('auth.changePassword')}
                  <svg className={`w-4 h-4 transition-transform ${showPasswordSection ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </>
            )}

            {/* Password fields */}
            {showPasswordSection && (
              passwordSuccess ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-green-700 dark:text-green-400 font-medium">{t('auth.passwordChanged')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.currentPassword')}</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.newPassword')}</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.confirmNewPassword')}</label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {passwordError && (
                    <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
                  )}

                  <button
                    onClick={handleChangePassword}
                    disabled={changingPassword || !currentPassword || !newPassword || !confirmNewPassword}
                    className="w-full px-4 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
                  >
                    {changingPassword ? '...' : t('auth.changePassword')}
                  </button>
                </div>
              )
            )}

            {/* Close button */}
            <button
              onClick={() => setShowProfileModal(false)}
              className="w-full mt-4 px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {t('common.back')}
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default RideHistory;
