import { useState, useEffect, useCallback, useRef } from 'react';
import type { Ride, RideStatus, StatusCounts } from '@cts/shared';
import { Helmet } from 'react-helmet-async';
import * as adminService from '../services/admin.service';
import * as authService from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Spinner from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import ThemeToggle from '../components/common/ThemeToggle';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import DatePicker, { registerLocale } from 'react-datepicker';
import { el } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/calendar-custom.css';
import { estimateRoadDistance } from '../utils/distance';
import { calculatePrice } from '../utils/pricing';
import { isAirportAddress, isTransportHub } from '../utils/airport';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import SortDropdown from '../components/common/SortDropdown';
import Logo from '../components/common/Logo';

type ConfirmAction = 'accept' | 'reject' | 'complete' | null;

interface EditFormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledFor: Date | null;
  people: number;
  isRoundtrip: boolean;
  returnScheduledFor: Date | null;
  returnPeople: number;
  flightNumber: string;
  flightTime: string;
  luggageCount: number;
  notes: string;
}

registerLocale('el', el);

type DatePreset = 'week' | 'month' | 'all' | 'custom';

const PAGE_SIZE = 15;

// Format date as YYYY-MM-DD using local time (avoids UTC timezone shift)
const toLocalDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Helper to get first day of current month
const getFirstDayOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

// Helper to get last day of current month
const getLastDayOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0);
};

// Helper to get first day of current week (Monday)
const getFirstDayOfWeek = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.getFullYear(), now.getMonth(), diff);
};

// Helper to get last day of current week (Sunday)
const getLastDayOfWeek = () => {
  const first = getFirstDayOfWeek();
  return new Date(first.getTime() + 6 * 24 * 60 * 60 * 1000);
};

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filterStatus, setFilterStatus] = useState<RideStatus | 'all'>('all');
  const [startDate, setStartDate] = useState<Date | null>(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState<Date | null>(getLastDayOfMonth());
  const [datePreset, setDatePreset] = useState<DatePreset>('month');
  const [customerSearch, setCustomerSearch] = useState('');
  const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [highlightedRide, setHighlightedRide] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({ total: 0, pending: 0, accepted: 0, completed: 0, cancelled: 0 });
  const [sortBy, setSortBy] = useState<string>('dateDesc');
  const [hubFilter, setHubFilter] = useState<'all' | 'arrivals' | 'departures'>('all');
  const [menuOpen, setMenuOpen] = useState(false);

  // Confirmation modal state
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [completePrice, setCompletePrice] = useState('');

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRide, setEditingRide] = useState<Ride | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    pickupAddress: '',
    dropoffAddress: '',
    scheduledFor: null,
    people: 1,
    isRoundtrip: false,
    returnScheduledFor: null,
    returnPeople: 1,
    flightNumber: '',
    flightTime: '',
    luggageCount: 0,
    notes: '',
  });

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const openPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordError('');
    setPasswordSuccess(false);
    setShowPasswordModal(true);
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    if (newPassword.length < 8) {
      setPasswordError('Ο κωδικός πρέπει να είναι τουλάχιστον 8 χαρακτήρες');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Οι κωδικοί δεν ταιριάζουν');
      return;
    }
    setChangingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setTimeout(() => setShowPasswordModal(false), 1200);
    } catch (err: any) {
      const code = err.response?.data?.error?.code;
      if (code === 'WRONG_PASSWORD') {
        setPasswordError('Λάθος τρέχων κωδικός');
      } else if (code === 'SAME_PASSWORD') {
        setPasswordError('Ο νέος κωδικός πρέπει να είναι διαφορετικός');
      } else {
        setPasswordError(err.response?.data?.error?.message || 'Σφάλμα');
      }
    } finally {
      setChangingPassword(false);
    }
  };

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

  // Debounce customer search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCustomerSearch(customerSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const loadRides = useCallback(async (pageToLoad: number, isReset: boolean) => {
    if (isReset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    try {
      const params: any = { page: pageToLoad, limit: PAGE_SIZE };
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      if (startDate) {
        params.startDate = toLocalDateString(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        params.endDate = toLocalDateString(end);
      }
      if (debouncedCustomerSearch.trim()) {
        params.customer = debouncedCustomerSearch.trim();
      }
      params.sortBy = sortBy;
      const response = await adminService.getAllRides(params);

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
    } catch {
      // Toast shown automatically by API interceptor
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [filterStatus, startDate, endDate, debouncedCustomerSearch, sortBy]);

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

  // Refresh just statusCounts (page 1, limit 1)
  const refreshStatusCounts = async () => {
    try {
      const params: any = { page: 1, limit: 1 };
      if (startDate) {
        params.startDate = toLocalDateString(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        params.endDate = toLocalDateString(end);
      }
      if (debouncedCustomerSearch.trim()) {
        params.customer = debouncedCustomerSearch.trim();
      }
      const response = await adminService.getAllRides(params);
      if (response.statusCounts) {
        setStatusCounts(response.statusCounts as StatusCounts);
      }
    } catch {
      // ignore
    }
  };

  // When ride param present, clear filters so the ride is always visible
  const pendingScrollRideId = useRef<string | null>(null);
  useEffect(() => {
    const rideId = searchParams.get('ride');
    if (rideId) {
      pendingScrollRideId.current = rideId;
      setStartDate(null);
      setEndDate(null);
      setDatePreset('all');
      setFilterStatus('all');
    }
  }, [searchParams]);

  // Scroll to ride after filters applied and rides loaded
  // If not in current page, keep loading more until found or no more pages
  useEffect(() => {
    const rideId = pendingScrollRideId.current;
    if (!rideId || isLoading || isLoadingMore || rides.length === 0) return;
    const element = document.getElementById(`ride-${rideId}`);
    if (element) {
      pendingScrollRideId.current = null;
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedRide(rideId);
        setTimeout(() => setHighlightedRide(null), 3000);
        setSearchParams({});
      }, 100);
    } else if (hasMore) {
      // Ride not in current page, load next page
      loadRides(page + 1, false);
    }
  }, [isLoading, isLoadingMore, rides]);

  // Open confirmation modal
  const openConfirmModal = (action: ConfirmAction, ride: Ride) => {
    setConfirmAction(action);
    setSelectedRide(ride);
    setRejectReason('');
    if (action === 'complete') {
      const basePrice = ride.price ?? (() => {
        if (ride.pickup.address.startsWith('TOUR:')) return null;
        const dist = estimateRoadDistance(ride.pickup.address, ride.dropoff.address);
        return dist ? calculatePrice(dist, ride.people ?? 1) : null;
      })();
      const totalPrice = basePrice != null && ride.isRoundtrip ? basePrice * 2 : basePrice;
      setCompletePrice(totalPrice != null ? String(totalPrice) : '');
    } else {
      setCompletePrice('');
    }
  };

  // Close confirmation modal
  const closeConfirmModal = () => {
    setConfirmAction(null);
    setSelectedRide(null);
    setRejectReason('');
  };

  // Open edit modal
  const openEditModal = (ride: Ride) => {
    setEditingRide(ride);
    setEditFormData({
      customerName: ride.customerName,
      customerPhone: ride.customerPhone,
      customerEmail: ride.customerEmail,
      pickupAddress: ride.pickup.address,
      dropoffAddress: ride.dropoff.address,
      scheduledFor: ride.scheduledFor ? new Date(ride.scheduledFor) : null,
      people: ride.people || 1,
      isRoundtrip: ride.isRoundtrip || false,
      returnScheduledFor: ride.returnScheduledFor ? new Date(ride.returnScheduledFor) : null,
      returnPeople: ride.returnPeople || 1,
      flightNumber: ride.flightNumber || '',
      flightTime: ride.flightTime || '',
      luggageCount: ride.luggageCount || 0,
      notes: ride.notes || '',
    });
    setIsEditModalOpen(true);
  };

  // Close edit modal
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingRide(null);
  };

  // Handle edit form submission
  const handleEditSubmit = async () => {
    if (!editingRide) return;

    const scrollPosition = window.scrollY;
    setActionLoading(editingRide._id);
    try {
      const updatedRide = await adminService.updateRide(editingRide._id, {
        customerName: editFormData.customerName,
        customerPhone: editFormData.customerPhone,
        customerEmail: editFormData.customerEmail,
        pickup: { address: editFormData.pickupAddress },
        dropoff: { address: editFormData.dropoffAddress },
        scheduledFor: editFormData.scheduledFor?.toISOString(),
        people: editFormData.people,
        isRoundtrip: editFormData.isRoundtrip,
        returnScheduledFor: editFormData.isRoundtrip ? editFormData.returnScheduledFor?.toISOString() : undefined,
        returnPeople: editFormData.isRoundtrip ? editFormData.returnPeople : undefined,
        flightNumber: editFormData.flightNumber || undefined,
        flightTime: editFormData.flightTime || undefined,
        luggageCount: editFormData.luggageCount || undefined,
        notes: editFormData.notes,
      });
      // In-place update
      setRides((prev) => prev.map((r) => (r._id === updatedRide._id ? updatedRide : r)));
      closeEditModal();
      refreshStatusCounts();
      setTimeout(() => window.scrollTo(0, scrollPosition), 0);
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Αποτυχία ενημέρωσης');
    } finally {
      setActionLoading(null);
    }
  };

  // Execute confirmed action
  const handleConfirmAction = async () => {
    if (!selectedRide || !confirmAction) return;

    const scrollPosition = window.scrollY;
    setActionLoading(selectedRide._id);
    try {
      let updatedRide: Ride;
      if (confirmAction === 'accept') {
        updatedRide = await adminService.acceptRide(selectedRide._id);
      } else if (confirmAction === 'reject') {
        updatedRide = await adminService.rejectRide(selectedRide._id, rejectReason || undefined);
      } else {
        updatedRide = await adminService.completeRide(selectedRide._id, parseFloat(completePrice));
      }
      // In-place update
      setRides((prev) => prev.map((r) => (r._id === updatedRide._id ? updatedRide : r)));
      closeConfirmModal();
      refreshStatusCounts();
      // Restore scroll position after re-render
      setTimeout(() => window.scrollTo(0, scrollPosition), 0);
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Αποτυχία ενέργειας');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadgeColor = (status: RideStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: RideStatus) => {
    switch (status) {
      case 'pending':
        return 'ΥΠΟ ΕΠΕΞΕΡΓΑΣΙΑ';
      case 'accepted':
        return 'ΑΠΟΔΕΚΤΗ';
      case 'cancelled':
        return 'ΑΚΥΡΩΜΕΝΗ';
      case 'completed':
        return 'ΟΛΟΚΛΗΡΩΜΕΝΗ';
      default:
        return status.toUpperCase();
    }
  };

  const getStatusTextPlural = (status: RideStatus) => {
    switch (status) {
      case 'pending':
        return 'ΥΠΟ ΕΠΕΞΕΡΓΑΣΙΑ';
      case 'accepted':
        return 'ΑΠΟΔΕΚΤΕΣ';
      case 'cancelled':
        return 'ΑΚΥΡΩΜΕΝΕΣ';
      case 'completed':
        return 'ΟΛΟΚΛΗΡΩΜΕΝΕΣ';
      default:
        return status.toUpperCase();
    }
  };

  return (
    <>
    <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Logo className="h-10 sm:h-12 md:h-16" />
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
              </div>
            </div>
            {/* Desktop nav */}
            <div className="hidden sm:flex items-center gap-2 sm:gap-3">
              <button
                onClick={openPasswordModal}
                className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                title="Αλλαγή Κωδικού"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              <ThemeToggle />
              <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => navigate('/admin/calendar')}>
                Ημερολόγιο
              </Button>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => navigate('/admin/settings')}>
                Ρυθμίσεις
              </Button>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={logout}>
                Έξοδος
              </Button>
            </div>
            {/* Mobile hamburger */}
            <div className="flex sm:hidden items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 text-gray-600 dark:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
          {/* Mobile title */}
          <h1 className="sm:hidden text-lg font-bold text-gray-900 dark:text-gray-100 mt-2">Admin Dashboard</h1>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 sm:hidden" onClick={() => setMenuOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-64 bg-white dark:bg-gray-800 shadow-2xl z-50 sm:hidden flex flex-col animate-[slideIn_0.2s_ease-out]">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <span className="font-bold text-gray-900 dark:text-white">Μενού</span>
              <button onClick={() => setMenuOpen(false)} className="p-1 text-gray-500 dark:text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              <button onClick={() => { navigate('/admin'); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                Dashboard
              </button>
              <button onClick={() => { navigate('/admin/calendar'); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Ημερολόγιο
              </button>
              <button onClick={() => { navigate('/admin/settings'); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Ρυθμίσεις
              </button>
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Έξοδος
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Filters */}
        <Card className="p-4 sm:p-6 mb-4 sm:mb-6 space-y-4">
          {/* Row 1: Search + Sort dropdown */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 sm:max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Αναζήτηση πελάτη ή τοποθεσίας..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
              />
              {customerSearch && (
                <button
                  onClick={() => setCustomerSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <SortDropdown
              value={sortBy}
              onChange={setSortBy}
              sheetTitle="Ταξινόμηση"
              options={[
                { value: 'dateDesc', label: 'Ημ. διαδρομής ↓' },
                { value: 'dateAsc', label: 'Ημ. διαδρομής ↑' },
                { value: 'createdDesc', label: 'Πρόσφατα κρατημένες' },
              ]}
            />
          </div>

          {/* Row 2: Date range */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Περίοδος</p>
            <div className="flex flex-wrap items-center gap-2">
              {([
                { key: 'week' as DatePreset, label: 'Εβδομάδα' },
                { key: 'month' as DatePreset, label: 'Μήνας' },
                { key: 'all' as DatePreset, label: 'Όλα' },
              ]).map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => handlePresetChange(preset.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    datePreset === preset.key
                      ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
              <DatePicker
                selectsRange
                startDate={startDate}
                endDate={endDate}
                onChange={handleDateChange}
                locale="el"
                dateFormat="dd/MM/yyyy"
                placeholderText="Εύρος ημερομηνιών"
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 w-48 sm:w-52"
                isClearable
              />
            </div>
          </div>

        </Card>

        {/* Loading */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {/* Stats — clickable filters */}
            <div className="grid grid-cols-5 gap-1.5 sm:gap-3 mb-4 sm:mb-6 max-w-2xl mx-auto">
              {([
                { key: 'all' as const, label: 'Όλες', shortLabel: 'Όλες', count: statusCounts.total, color: 'text-gray-900 dark:text-gray-100', ring: 'ring-gray-400 dark:ring-gray-500' },
                { key: 'pending' as const, label: 'Αναμονή', shortLabel: 'Αναμονή', count: statusCounts.pending, color: 'text-amber-600', ring: 'ring-amber-400' },
                { key: 'accepted' as const, label: 'Αποδεκτές', shortLabel: 'Αποδ.', count: statusCounts.accepted, color: 'text-green-600', ring: 'ring-green-400' },
                { key: 'completed' as const, label: 'Ολοκληρωμένες', shortLabel: 'Ολοκλ.', count: statusCounts.completed, color: 'text-blue-500', ring: 'ring-blue-400' },
                { key: 'cancelled' as const, label: 'Ακυρωμένες', shortLabel: 'Ακυρ.', count: statusCounts.cancelled, color: 'text-gray-500 dark:text-gray-400', ring: 'ring-gray-400 dark:ring-gray-500' },
              ]).map(({ key, label, shortLabel, count, color, ring }) => (
                <button
                  key={key}
                  onClick={() => setFilterStatus(key)}
                  className={`p-1.5 sm:p-3 text-center rounded-xl border transition-all cursor-pointer ${
                    filterStatus === key
                      ? `ring-2 ${ring} border-transparent bg-white dark:bg-gray-800 shadow-sm`
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <p className={`text-[9px] sm:text-xs whitespace-nowrap ${filterStatus === key ? color : 'text-gray-500 dark:text-gray-400'}`}>
                    <span className="sm:hidden">{shortLabel}</span>
                    <span className="hidden sm:inline">{label}</span>
                  </p>
                  <p className={`text-base sm:text-xl font-bold ${color}`}>{count}</p>
                </button>
              ))}
            </div>

            {/* Hub filter */}
            <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
              {([
                { key: 'all' as const, label: 'Όλες οι διαδρομές' },
                { key: 'arrivals' as const, label: 'Αφίξεις' },
                { key: 'departures' as const, label: 'Αναχωρήσεις' },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setHubFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    hubFilter === key
                      ? 'bg-red-500 text-white'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Rides List */}
            <div className="space-y-3 sm:space-y-4">
              {(() => {
                const filteredRides = hubFilter === 'all'
                  ? rides
                  : rides.filter((ride) =>
                      hubFilter === 'arrivals'
                        ? isTransportHub(ride.pickup.address, ride.pickup.coordinates)
                        : isTransportHub(ride.dropoff.address, ride.dropoff.coordinates)
                    );
                return filteredRides.length === 0 ? (
                <Card className="p-8 sm:p-12 text-center">
                  <p className="text-gray-500 dark:text-gray-400">Δεν βρέθηκαν κρατήσεις</p>
                </Card>
              ) : (
                filteredRides.map((ride) => {
                  const isTour = ride.pickup.address.startsWith('TOUR:');
                  const tourName = isTour ? ride.pickup.address.replace('TOUR: ', '') : '';
                  const tourStops = isTour ? ride.dropoff.address.split(' -> ') : [];

                  // Show stored price, or calculate from distance
                  const displayPrice = ride.price ?? (() => {
                    if (isTour) return null;
                    const dist = estimateRoadDistance(ride.pickup.address, ride.dropoff.address);
                    return dist ? calculatePrice(dist, ride.people ?? 1) : null;
                  })();

                  return (
                  <Card
                    key={ride._id}
                    id={`ride-${ride._id}`}
                    className={`p-4 sm:p-6 transition-all duration-500 relative ${
                      highlightedRide === ride._id
                        ? 'ring-4 ring-amber-400 ring-offset-2 bg-amber-50'
                        : ''
                    } ${isTour ? 'border-2 border-amber-400 dark:border-amber-600 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20' : (ride.status !== 'cancelled' && isTransportHub(ride.dropoff.address, ride.dropoff.coordinates)) ? 'border-2 border-red-500 bg-red-50/50 dark:bg-red-950/20' : ''}`}
                  >
                    {/* Created date and edit button - always top right */}
                    <div className="absolute top-1 right-3 sm:top-4 sm:right-6 flex flex-col items-end gap-0.5">
                      {(ride.status === 'pending' || ride.status === 'accepted') && (
                        <button
                          onClick={() => openEditModal(ride)}
                          className="p-1 -mr-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          title="Επεξεργασία"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                      <span className="text-[9px] text-gray-400">
                        {isTour ? 'Tour: ' : 'Κράτηση: '}{new Date(ride.createdAt).toLocaleDateString('el-GR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Ride Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 pr-28 sm:pr-36">
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
                              ΜΕ ΕΠΙΣΤΡΟΦΗ
                            </span>
                          )}
                          <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(ride.status)}`}>
                            {getStatusText(ride.status)}
                          </span>
                          {displayPrice != null && (
                            <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                              ride.price != null
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                              {ride.price == null && '~'}{displayPrice}€
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          {/* Route / Tour Info */}
                          {isTour ? (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Tour</p>
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
                            <div className="flex items-center gap-2 mb-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Διαδρομή</p>
                              <a
                                href={(() => {
                                  // DB stores GeoJSON: coordinates.coordinates = [lng, lat]
                                  const pCoords = ride.pickup.coordinates?.coordinates;
                                  const dCoords = ride.dropoff.coordinates?.coordinates;
                                  const origin = pCoords?.length === 2 && (pCoords[0] !== 0 || pCoords[1] !== 0)
                                    ? `${pCoords[1]},${pCoords[0]}`
                                    : encodeURIComponent(ride.pickup.address);
                                  const dest = dCoords?.length === 2 && (dCoords[0] !== 0 || dCoords[1] !== 0)
                                    ? `${dCoords[1]},${dCoords[0]}`
                                    : encodeURIComponent(ride.dropoff.address);
                                  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`;
                                })()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                title="Άνοιγμα στο Google Maps"
                              >
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                </svg>
                                Maps
                              </a>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-start gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0"></div>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium">Από</p>
                                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 break-words">
                                    {ride.pickup.address}
                                    {isTransportHub(ride.pickup.address, ride.pickup.coordinates) && (
                                      <span className="ml-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-500 text-white shadow-sm">
                                        {isAirportAddress(ride.pickup.address, ride.pickup.coordinates) ? '✈ ΑΕΡΟΔΡΟΜΙΟ' : '⚓ ΛΙΜΑΝΙ'}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="w-2 h-2 rounded-full bg-secondary-500 mt-1.5 flex-shrink-0"></div>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium">Προς</p>
                                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 break-words">
                                    {ride.dropoff.address}
                                    {isTransportHub(ride.dropoff.address, ride.dropoff.coordinates) && (
                                      <span className="ml-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-500 text-white shadow-sm">
                                        {isAirportAddress(ride.dropoff.address, ride.dropoff.coordinates) ? '✈ ΑΕΡΟΔΡΟΜΙΟ' : '⚓ ΛΙΜΑΝΙ'}
                                      </span>
                                    )}
                                  </p>
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

                          {/* Customer Info + Schedule + Extras */}
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Πελάτης</p>
                              <div className="space-y-1 text-xs sm:text-sm">
                                <p className="text-gray-700 dark:text-gray-300">
                                  <strong>Όνομα:</strong> {ride.customerName}
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 break-all">
                                  <strong>Τηλ:</strong>{' '}
                                  <a href={`tel:${ride.customerPhone}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                                    {ride.customerPhone}
                                  </a>
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 break-all">
                                  <strong>Email:</strong>{' '}
                                  <a href={`mailto:${ride.customerEmail}`} className="text-primary-600 dark:text-primary-400 hover:underline truncate block sm:inline">
                                    {ride.customerEmail}
                                  </a>
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                                <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <div>
                                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">{ride.isRoundtrip ? 'Μετάβαση' : 'Ημερομηνία'}</p>
                                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                                    {ride.scheduledFor
                                      ? new Date(ride.scheduledFor).toLocaleString('el-GR')
                                      : new Date(ride.createdAt).toLocaleString('el-GR')}
                                  </p>
                                  {ride.people && <p className="text-xs text-amber-700 dark:text-amber-400">{ride.people} {ride.people === 1 ? 'άτομο' : 'άτομα'}</p>}
                                </div>
                              </div>
                              {ride.isRoundtrip && ride.returnScheduledFor && (
                                <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg px-3 py-2">
                                  <svg className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <div>
                                    <p className="text-xs text-purple-700 dark:text-purple-400 font-medium">Επιστροφή</p>
                                    <p className="text-sm font-semibold text-purple-900 dark:text-purple-300">
                                      {new Date(ride.returnScheduledFor).toLocaleString('el-GR')}
                                    </p>
                                    {ride.returnPeople && <p className="text-xs text-purple-700 dark:text-purple-400">{ride.returnPeople} {ride.returnPeople === 1 ? 'άτομο' : 'άτομα'}</p>}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Extras: Payment, Child Seat */}
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
                                {ride.paymentMethod === 'card' ? 'Κάρτα' : 'Μετρητά'}
                              </span>
                              {ride.childSeat && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg font-medium bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>
                                  Παιδικό Κάθισμα
                                </span>
                              )}
                            </div>

                            {/* Flight Info */}
                            {ride.flightNumber && (
                              <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg px-3 py-2">
                                <p className="text-xs text-sky-600 dark:text-sky-400 font-medium mb-1.5">Στοιχεία Πτήσης</p>
                                <div className="flex flex-wrap gap-2">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-800/40 text-xs sm:text-sm font-semibold text-sky-900 dark:text-sky-200">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" /></svg>
                                    {ride.flightNumber}
                                  </span>
                                  {ride.flightTime && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-800/40 text-xs sm:text-sm font-medium text-sky-800 dark:text-sky-300">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                      {ride.flightTime}
                                    </span>
                                  )}
                                  {ride.luggageCount != null && ride.luggageCount > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-800/40 text-xs sm:text-sm font-medium text-sky-800 dark:text-sky-300">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                      {ride.luggageCount} αποσκ.
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                            {ride.returnFlightNumber && (
                              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg px-3 py-2">
                                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-1.5">Στοιχεία Πτήσης Επιστροφής</p>
                                <div className="flex flex-wrap gap-2">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-800/40 text-xs sm:text-sm font-semibold text-orange-900 dark:text-orange-200">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" /></svg>
                                    {ride.returnFlightNumber}
                                  </span>
                                  {ride.returnFlightTime && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-800/40 text-xs sm:text-sm font-medium text-orange-800 dark:text-orange-300">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                      {ride.returnFlightTime}
                                    </span>
                                  )}
                                  {ride.returnLuggageCount != null && ride.returnLuggageCount > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-800/40 text-xs sm:text-sm font-medium text-orange-800 dark:text-orange-300">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                      {ride.returnLuggageCount} αποσκ.
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Notes - full width below grid */}
                        {ride.notes && (() => {
                          // For tour rides, strip auto-generated prefix and only show user notes
                          const displayNotes = isTour
                            ? ride.notes.replace(/^\[TOUR\].*\n.*Στάσεις:.*\n?/i, '').replace(/^\[TOUR\].*\n.*Stops:.*\n?/i, '').trim()
                            : ride.notes;
                          return displayNotes ? (
                            <div className="mt-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Σημειώσεις</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{displayNotes}</p>
                            </div>
                          ) : null;
                        })()}
                      </div>

                      {/* Actions */}
                      {ride.status === 'pending' && (
                        <div className="flex flex-row sm:flex-col gap-2 lg:w-48">
                          <Button
                            onClick={() => openConfirmModal('accept', ride)}
                            className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none text-sm"
                          >
                            Αποδοχή
                          </Button>
                          <Button
                            onClick={() => openConfirmModal('reject', ride)}
                            variant="outline"
                            className="border-red-500 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 dark:border-red-400 flex-1 sm:flex-none text-sm"
                          >
                            Απόρριψη
                          </Button>
                        </div>
                      )}
                      {ride.status === 'accepted' && (
                        <div className="flex justify-end lg:justify-start lg:w-48">
                          <Button
                            onClick={() => openConfirmModal('complete', ride)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 lg:w-full"
                          >
                            Ολοκλήρωση
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                  );
                })
              );
              })()}
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
                    Δεν υπάρχουν άλλες κρατήσεις
                  </p>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmAction !== null}
        onClose={closeConfirmModal}
        title={
          confirmAction === 'accept' ? 'Αποδοχή Κράτησης' :
          confirmAction === 'reject' ? 'Απόρριψη Κράτησης' :
          confirmAction === 'complete' ? 'Ολοκλήρωση Διαδρομής' : ''
        }
        size="sm"
      >
        {selectedRide && (
          <div className="space-y-4">
            {/* Ride summary */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-sm">
              <p className="font-medium text-gray-900 dark:text-gray-100">{selectedRide.customerName}</p>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {selectedRide.pickup.address} → {selectedRide.dropoff.address}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                {selectedRide.scheduledFor
                  ? new Date(selectedRide.scheduledFor).toLocaleString('el-GR')
                  : new Date(selectedRide.createdAt).toLocaleString('el-GR')
                }
              </p>
            </div>

            {/* Confirmation message */}
            <p className="text-gray-700 dark:text-gray-300">
              {confirmAction === 'accept' && 'Είστε σίγουροι ότι θέλετε να αποδεχτείτε αυτή την κράτηση;'}
              {confirmAction === 'reject' && 'Είστε σίγουροι ότι θέλετε να απορρίψετε αυτή την κράτηση;'}
              {confirmAction === 'complete' && 'Είστε σίγουροι ότι θέλετε να ολοκληρώσετε αυτή τη διαδρομή;'}
            </p>

            {/* Complete price input */}
            {confirmAction === 'complete' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ποσό (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={completePrice}
                  onChange={(e) => setCompletePrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="π.χ. 45"
                  autoFocus
                />
              </div>
            )}

            {/* Reject reason input */}
            {confirmAction === 'reject' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Λόγος απόρριψης (προαιρετικά)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={2}
                  placeholder="π.χ. Δεν είμαι διαθέσιμος αυτή την ημερομηνία"
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={closeConfirmModal}
                className="flex-1"
                disabled={actionLoading !== null}
              >
                Άκυρο
              </Button>
              <Button
                onClick={handleConfirmAction}
                className={`flex-1 ${
                  confirmAction === 'accept' ? 'bg-green-600 hover:bg-green-700' :
                  confirmAction === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}
                isLoading={actionLoading !== null}
                disabled={actionLoading !== null || (confirmAction === 'complete' && (!completePrice || parseFloat(completePrice) <= 0))}
              >
                {confirmAction === 'accept' && 'Αποδοχή'}
                {confirmAction === 'reject' && 'Απόρριψη'}
                {confirmAction === 'complete' && 'Ολοκλήρωση'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title="Επεξεργασία Κράτησης"
        size="md"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Customer Info Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Στοιχεία Πελάτη</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Όνομα</label>
                <input
                  type="text"
                  value={editFormData.customerName}
                  onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Τηλέφωνο</label>
                <input
                  type="tel"
                  value={editFormData.customerPhone}
                  onChange={(e) => setEditFormData({ ...editFormData, customerPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={editFormData.customerEmail}
                onChange={(e) => setEditFormData({ ...editFormData, customerEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Route Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Διαδρομή</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Από</label>
              <input
                type="text"
                value={editFormData.pickupAddress}
                onChange={(e) => setEditFormData({ ...editFormData, pickupAddress: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Προς</label>
              <input
                type="text"
                value={editFormData.dropoffAddress}
                onChange={(e) => setEditFormData({ ...editFormData, dropoffAddress: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Schedule Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Χρονοδιάγραμμα</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Ημερομηνία & Ώρα</label>
                <DatePicker
                  selected={editFormData.scheduledFor}
                  onChange={(date: Date | null) => setEditFormData({ ...editFormData, scheduledFor: date })}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="dd/MM/yyyy HH:mm"
                  locale="el"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Άτομα</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={editFormData.people}
                  onChange={(e) => setEditFormData({ ...editFormData, people: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Roundtrip Toggle */}
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={editFormData.isRoundtrip}
                  onChange={(e) => setEditFormData({ ...editFormData, isRoundtrip: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
              <span className="text-sm text-gray-700 dark:text-gray-300">Με επιστροφή</span>
            </div>

            {/* Return fields (shown only if roundtrip) */}
            {editFormData.isRoundtrip && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Επιστροφή - Ημερομηνία & Ώρα</label>
                  <DatePicker
                    selected={editFormData.returnScheduledFor}
                    onChange={(date: Date | null) => setEditFormData({ ...editFormData, returnScheduledFor: date })}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="dd/MM/yyyy HH:mm"
                    locale="el"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Επιστροφή - Άτομα</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={editFormData.returnPeople}
                    onChange={(e) => setEditFormData({ ...editFormData, returnPeople: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Flight Info Section (shown if pickup is airport) */}
          {isAirportAddress(editFormData.pickupAddress) && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Στοιχεία Πτήσης</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Αρ. Πτήσης</label>
                  <input
                    type="text"
                    value={editFormData.flightNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, flightNumber: e.target.value.toUpperCase() })}
                    placeholder="FR1234"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Ώρα Πτήσης</label>
                  <input
                    type="time"
                    value={editFormData.flightTime}
                    onChange={(e) => setEditFormData({ ...editFormData, flightTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Αποσκευές</label>
                  <input
                    type="number"
                    min={0}
                    value={editFormData.luggageCount}
                    onChange={(e) => setEditFormData({ ...editFormData, luggageCount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Σημειώσεις</h3>
            <textarea
              value={editFormData.notes}
              onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Προσθέστε σημειώσεις για την κράτηση..."
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={closeEditModal}
              className="flex-1"
              disabled={actionLoading !== null}
            >
              Άκυρο
            </Button>
            <Button
              onClick={handleEditSubmit}
              className="flex-1"
              isLoading={actionLoading !== null}
              disabled={actionLoading !== null}
            >
              Αποθήκευση
            </Button>
          </div>
        </div>
      </Modal>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Αλλαγή Κωδικού</h2>

            {passwordSuccess ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-green-700 dark:text-green-400 font-medium">Ο κωδικός άλλαξε επιτυχώς!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Τρέχων Κωδικός</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Νέος Κωδικός</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Επιβεβαίωση Νέου Κωδικού</label>
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

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Πίσω
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={changingPassword || !currentPassword || !newPassword || !confirmNewPassword}
                    className="flex-1 px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    {changingPassword ? '...' : 'Αλλαγή'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default AdminDashboard;
