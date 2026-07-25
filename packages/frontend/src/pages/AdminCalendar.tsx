import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import elLocale from '@fullcalendar/core/locales/el';
import type { EventContentArg } from '@fullcalendar/core';
import type { Ride } from '@cts/shared';
import * as adminService from '../services/admin.service';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import ThemeToggle from '../components/common/ThemeToggle';
import { isAirportAddress, isTransportHub } from '../utils/airport';
import { estimateRoadDistanceFromCoords } from '../utils/distance';
import '../styles/calendar-custom.css';
import Logo from '../components/common/Logo';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';


const statusColors: Record<string, string> = {
  pending: '#f59e0b', // amber
  accepted: '#10b981', // emerald
  completed: '#6366f1', // indigo
  cancelled: '#9ca3af', // gray
};

// Shorten a location name for display in calendar events
const shortLocation = (address: string) => {
  const s = address.replace(/\(.*\)/, '').trim();
  if (s.length <= 18) return s;
  const cut = s.slice(0, 18);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 8 ? cut.slice(0, lastSpace) : cut) + '…';
};

// Very short location — first word only, for mobile
const tinyLocation = (address: string) => {
  const s = address.replace(/\(.*\)/, '').trim();
  return s.split(' ')[0].slice(0, 6);
};

const AdminCalendar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{ ride: Ride; isReturn: boolean } | null>(null);
  const [dayRides, setDayRides] = useState<{ ride: Ride; isReturn: boolean }[]>([]);
  const [dayRideIndex, setDayRideIndex] = useState(0);
  const [slideDir, setSlideDir] = useState<'exit-left' | 'exit-right' | 'enter-left' | 'enter-right' | null>(null);
  const [touchStartX, setTouchStartX] = useState(0);
  const [visibleStatuses, setVisibleStatuses] = useState<Set<string>>(new Set(['pending', 'accepted', 'completed', 'cancelled']));
  const calendarRef = useRef<FullCalendar>(null);
  const calTouchStartX = useRef(0);
  const isMobile = useCallback(() => window.innerWidth < 640, []);

  const toggleStatus = (status: string) => {
    setVisibleStatuses(prev => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  useEffect(() => {
    adminService.getAllRides({}).then(res => {
      setRides(res.items);
      setLoading(false);
    });
  }, []);

  // Map rides to FullCalendar events (filtered by visible statuses)
  const events = rides.filter(ride => visibleStatuses.has(ride.status)).flatMap((ride) => {
    const isTour = ride.pickup.address.startsWith('TOUR:');
    const color = statusColors[ride.status] || '#e5e7eb';
    const route = isTour
      ? `[T] ${ride.pickup.address.replace('TOUR: ', '')}`
      : `${shortLocation(ride.pickup.address)} → ${shortLocation(ride.dropoff.address)}`;
    const startStr = ride.scheduledFor || ride.createdAt;

    // Estimate travel duration from coordinates (min 30 min, ~50 km/h avg)
    // Use stored values or estimate from coordinates
    const distKm = ride.distance ?? (() => {
      const pickupCoords = ride.pickup.coordinates?.coordinates || [0, 0];
      const dropoffCoords = ride.dropoff.coordinates?.coordinates || [0, 0];
      return estimateRoadDistanceFromCoords(pickupCoords[1], pickupCoords[0], dropoffCoords[1], dropoffCoords[0]);
    })();
    const durationMin = ride.estimatedDuration ?? (distKm ? Math.max(30, Math.round((distKm / 50) * 60)) : 60);
    const endStr = startStr ? new Date(new Date(startStr).getTime() + durationMin * 60000).toISOString() : undefined;

    const isAirportPickup = isTransportHub(ride.pickup.address, ride.pickup.coordinates);
    const isAirportDropoff = !isTour && isTransportHub(ride.dropoff.address, ride.dropoff.coordinates);
    const mainEvent = {
      id: ride._id,
      title: `${ride.customerName} (${ride.people ?? 1})`,
      start: startStr,
      end: endStr,
      backgroundColor: color,
      borderColor: color,
      classNames: isTour ? ['fc-tour-event'] : (isAirportDropoff && ride.status !== 'cancelled' && ride.status !== 'completed') ? ['fc-airport-event'] : [],
      extendedProps: { ride, isReturn: false, route, isAirportPickup, isAirportDropoff, isTour, distKm, durationMin },
    };

    // If roundtrip, add return event with same status color
    if (ride.isRoundtrip && ride.returnScheduledFor) {
      const returnRoute = `${shortLocation(ride.dropoff.address)} → ${shortLocation(ride.pickup.address)}`;
      const returnIsAirportPickup = isTransportHub(ride.dropoff.address, ride.dropoff.coordinates);
      const returnIsAirportDropoff = isTransportHub(ride.pickup.address, ride.pickup.coordinates);
      const returnEndStr = ride.returnScheduledFor ? new Date(new Date(ride.returnScheduledFor).getTime() + durationMin * 60000).toISOString() : undefined;
      const returnEvent = {
        id: `${ride._id}-return`,
        title: `↩ ${ride.customerName} (${ride.returnPeople ?? 1})`,
        start: ride.returnScheduledFor,
        end: returnEndStr,
        backgroundColor: color,
        borderColor: color,
        classNames: (returnIsAirportDropoff && ride.status !== 'cancelled' && ride.status !== 'completed') ? ['fc-airport-event'] : [],
        extendedProps: { ride, isReturn: true, route: returnRoute, isAirportPickup: returnIsAirportPickup, isAirportDropoff: returnIsAirportDropoff, distKm, durationMin },
      };
      return [mainEvent, returnEvent];
    }

    return [mainEvent];
  });

  const goToSlide = (next: number, dir: 'left' | 'right') => {
    setSlideDir(dir === 'left' ? 'exit-left' : 'exit-right');
    setTimeout(() => {
      setDayRideIndex(next);
      setSlideDir(dir === 'left' ? 'enter-right' : 'enter-left');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setSlideDir(null);
        });
      });
    }, 80);
  };

  const openDayCarousel = (date: Date, startEventId?: string) => {
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    const dayEvts = events.filter(e => {
      if (!e.start) return false;
      const d = new Date(e.start as string);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === target.getTime();
    });
    if (dayEvts.length > 0) {
      const items = dayEvts.map(e => ({ ride: e.extendedProps.ride as Ride, isReturn: e.extendedProps.isReturn as boolean }));
      setDayRides(items);
      const idx = startEventId ? dayEvts.findIndex(e => e.id === startEventId) : 0;
      setDayRideIndex(idx >= 0 ? idx : 0);
    }
  };

  // Custom event content for time grid views
  const renderEventContent = (eventInfo: EventContentArg) => {
    const { ride, isReturn, route, isAirportPickup, isAirportDropoff, isTour, distKm, durationMin } = eventInfo.event.extendedProps;
    const people = isReturn ? (ride.returnPeople ?? 1) : (ride.people ?? 1);
    const viewType = eventInfo.view.type;
    const tourName = isTour ? ride.pickup.address.replace('TOUR: ', '') : '';

    // For list view, show name + route + flight info
    if (viewType === 'listWeek') {
      return (
        <div className="fc-custom-event-list">
          <span className="font-semibold">{isReturn ? '↩ ' : ''}{ride.customerName}</span>
          <span className="fc-custom-event-list-people">{people}</span>
          {isTour ? (
            <span className="fc-tour-badge">TOUR</span>
          ) : ride.flightNumber ? (
            <span className="fc-flight-badge">✈ {ride.flightNumber}{ride.flightTime ? ` · ${ride.flightTime}` : ''}{ride.luggageCount ? ` · ${ride.luggageCount} αποσκ.` : ''}</span>
          ) : (isAirportPickup || isAirportDropoff) ? (
            <span className="fc-airport-badge">{(() => {
              const hubAddress = isReturn ? ride.pickup.address : ride.dropoff.address;
              const hubCoords = isReturn ? ride.pickup.coordinates : ride.dropoff.coordinates;
              const pickupAddr = isReturn ? ride.dropoff.address : ride.pickup.address;
              const pickupCoords = isReturn ? ride.dropoff.coordinates : ride.pickup.coordinates;
              if (isAirportDropoff) return isAirportAddress(hubAddress, hubCoords) ? '✈ ΑΕΡΟΔΡΟΜΙΟ' : '⚓ ΛΙΜΑΝΙ';
              return isAirportAddress(pickupAddr, pickupCoords) ? '✈ ΑΕΡΟΔΡΟΜΙΟ' : '⚓ ΛΙΜΑΝΙ';
            })()}</span>
          ) : null}
          <span className="fc-custom-event-list-route">{isTour ? tourName : route}</span>
          {distKm > 0 && !isTour ? <span className="fc-custom-event-list-duration">~{distKm}km · ~{durationMin}λ</span> : null}
        </div>
      );
    }

    // For dayGrid (month), show compact: people + last name
    if (viewType === 'dayGridMonth') {
      const parts = ride.customerName.trim().split(' ');
      const lastName = parts.length > 1 ? parts[parts.length - 1] : parts[0];
      return (
        <div className="fc-custom-event-month">
          <span className="fc-month-people">{people}</span>
          {isTour ? <span className="fc-month-tour-badge">T</span> : (isAirportPickup || isAirportDropoff) ? <span>{(() => {
            const addr = isAirportDropoff ? (isReturn ? ride.pickup.address : ride.dropoff.address) : (isReturn ? ride.dropoff.address : ride.pickup.address);
            const coords = isAirportDropoff ? (isReturn ? ride.pickup.coordinates : ride.dropoff.coordinates) : (isReturn ? ride.dropoff.coordinates : ride.pickup.coordinates);
            return isAirportAddress(addr, coords) ? '✈' : '⚓';
          })()}</span> : null}
          <span className="fc-month-name">{isReturn ? '↩' : ''}{lastName}</span>
        </div>
      );
    }

    // For timeGrid week — compact: people + icon + name only
    if (viewType === 'timeGridWeek') {
      const parts = ride.customerName.trim().split(' ');
      const lastName = parts.length > 1 ? parts[parts.length - 1] : parts[0];
      return (
        <div className="fc-gcal-event">
          <span className="fc-gcal-people">{people}</span>
          {isTour ? <span className="fc-gcal-name">T {lastName}</span> : (
            <span className="fc-gcal-name">
              {isAirportDropoff ? '✈ ' : ''}{isReturn ? '↩ ' : ''}{lastName}
            </span>
          )}
        </div>
      );
    }

    // For timeGrid day (or desktop week) — full details, horizontal route
    if (isTour) {
      const stops = ride.dropoff.address.split(' -> ').map((s: string) => s.trim());
      return (
        <div className="fc-day-event">
          <div className="fc-day-event-top">
            <span className="fc-day-event-people">{people}</span>
            <span className="fc-day-event-name">
              {ride.customerName}
              <span className="fc-day-event-badge" style={{ background: '#f59e0b', color: '#fff' }}>TOUR</span>
            </span>
          </div>
          <div className="fc-day-event-route">{tourName}</div>
          <div className="fc-day-event-route" style={{ opacity: 0.8 }}>{stops.join(' → ')}</div>
          <div className="fc-day-event-info">
            <svg className="fc-day-event-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            {ride.customerPhone}
          </div>
        </div>
      );
    }

    const fromFull = isReturn ? ride.dropoff.address : ride.pickup.address;
    const toFull = isReturn ? ride.pickup.address : ride.dropoff.address;
    return (
      <div className="fc-day-event">
        <div className="fc-day-event-top">
          <span className="fc-day-event-people">{people}</span>
          <span className="fc-day-event-name">
            {isReturn ? '↩ ' : ''}{ride.customerName}
            {ride.isRoundtrip && !isReturn && <span className="fc-day-event-badge">↔</span>}
          </span>
        </div>
        <div className="fc-day-event-route">{isAirportDropoff && '✈ '}{fromFull} → {toFull}</div>
        {distKm > 0 && <div className="fc-day-event-distance">~{distKm}km · ~{durationMin}λ</div>}
        <div className="fc-day-event-info">
          <svg className="fc-day-event-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
          {ride.customerPhone}
        </div>
      </div>
    );
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Σε αναμονή';
      case 'accepted': return 'Αποδεκτές';
      case 'completed': return 'Ολοκληρωμένες';
      case 'cancelled': return 'Ακυρωμένες';
      default: return status;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'accepted': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'completed': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
    <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 relative flex items-center justify-between">
          <button onClick={() => navigate('/')}>
            <Logo className="h-10 sm:h-12 md:h-14" />
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Ημερολόγιο</h1>
          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => navigate('/admin')}>
              Dashboard
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
              <button onClick={() => { navigate('/admin'); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                Dashboard
              </button>
              <button onClick={() => { navigate('/admin/calendar'); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
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
      <div className="p-3 sm:p-6 max-w-7xl mx-auto">
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* Status filters */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-5 mb-4 px-1">
            {([
              { status: 'pending', color: statusColors.pending },
              { status: 'accepted', color: statusColors.accepted },
              { status: 'completed', color: statusColors.completed },
              { status: 'cancelled', color: statusColors.cancelled },
            ] as const).map(({ status, color }) => (
              <label key={status} className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={visibleStatuses.has(status)}
                  onChange={() => toggleStatus(status)}
                  className="sr-only"
                />
                <div
                  className="w-4 h-4 rounded flex items-center justify-center border-2 transition-colors"
                  style={{
                    backgroundColor: visibleStatuses.has(status) ? color : 'transparent',
                    borderColor: color,
                  }}
                >
                  {visibleStatuses.has(status) && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-xs sm:text-sm font-medium transition-colors ${visibleStatuses.has(status) ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600 line-through'}`}>
                  {getStatusLabel(status)}
                </span>
              </label>
            ))}
          </div>

          <div
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-2 sm:p-5"
            onTouchStart={e => { calTouchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={e => {
              const diff = calTouchStartX.current - e.changedTouches[0].clientX;
              if (Math.abs(diff) > 80) {
                const api = calendarRef.current?.getApi();
                if (api) { diff > 0 ? api.next() : api.prev(); }
              }
            }}
          >
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView="listWeek"
              timeZone="Europe/Athens"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'listWeek,timeGridDay,timeGridWeek,dayGridMonth',
              }}
              buttonText={{
                today: 'Σήμερα',
                month: 'Μήνας',
                week: 'Εβδομάδα',
                day: 'Ημέρα',
                list: 'Λίστα',
              }}
              height="auto"
              contentHeight={550}
              locale={elLocale}
              events={events}
              eventContent={renderEventContent}
              eventClick={info => {
                if (info.view.type === 'listWeek') {
                  setSelected({
                    ride: info.event.extendedProps.ride,
                    isReturn: info.event.extendedProps.isReturn,
                  });
                  return;
                }
                if (info.event.start) openDayCarousel(info.event.start, info.event.id);
              }}
              dateClick={info => {
                if (info.view.type !== 'listWeek') {
                  openDayCarousel(info.date);
                }
              }}
              defaultTimedEventDuration="00:30:00"
              slotEventOverlap={false}
              nowIndicator={true}
              dayMaxEvents={3}
              moreLinkClick={(info) => { openDayCarousel(info.date); }}
              eventDisplay="block"
              eventDidMount={(info) => {
                if (info.event.classNames.includes('fc-airport-event')) {
                  info.el.style.setProperty('--status-color', info.event.backgroundColor);
                }
              }}
              slotMinTime="00:00:00"
              slotMaxTime="24:00:00"
              allDaySlot={false}
              nextDayThreshold="06:00:00"
            />
          </div>
        </>
      )}
      {(() => {
        const activeData = dayRides.length > 0 ? dayRides[dayRideIndex] : selected;
        const isCarousel = dayRides.length > 0;
        return (
      <Modal isOpen={!!activeData} onClose={() => { setSelected(null); setDayRides([]); }}>
        {activeData && (() => {
          const selected = activeData;
          const selIsTour = selected.ride.pickup.address.startsWith('TOUR:');
          const selTourName = selIsTour ? selected.ride.pickup.address.replace('TOUR: ', '') : '';
          const selTourStops = selIsTour ? selected.ride.dropoff.address.split(' -> ') : [];

          return (
          <div
            className="p-5 sm:p-6 space-y-5"
            onTouchStart={isCarousel ? (e) => setTouchStartX(e.touches[0].clientX) : undefined}
            onTouchEnd={isCarousel ? (e) => {
              const diff = touchStartX - e.changedTouches[0].clientX;
              if (Math.abs(diff) > 50) {
                if (diff > 0 && dayRideIndex < dayRides.length - 1) goToSlide(dayRideIndex + 1, 'left');
                else if (diff < 0 && dayRideIndex > 0) goToSlide(dayRideIndex - 1, 'right');
              }
            } : undefined}
          >
            {/* Carousel navigation */}
            {isCarousel && dayRides.length > 1 && (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => dayRideIndex > 0 && goToSlide(dayRideIndex - 1, 'right')}
                  disabled={dayRideIndex === 0}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex items-center gap-1.5">
                  {dayRides.map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-full transition-all duration-200 ${i === dayRideIndex ? 'w-5 h-2 bg-gray-600 dark:bg-gray-300' : 'w-2 h-2 bg-gray-300 dark:bg-gray-600'}`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => dayRideIndex < dayRides.length - 1 && goToSlide(dayRideIndex + 1, 'left')}
                  disabled={dayRideIndex === dayRides.length - 1}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
            <div
              style={{
                perspective: '1200px',
                transformStyle: 'preserve-3d' as const,
                overflow: 'hidden',
              }}
            >
            <div
              style={{
                transition: slideDir?.startsWith('enter') ? 'none' : 'transform 80ms cubic-bezier(.22,1,.36,1)',
                transform: slideDir === 'exit-left'
                  ? 'translateX(-110%) rotateY(25deg)'
                  : slideDir === 'exit-right'
                  ? 'translateX(110%) rotateY(-25deg)'
                  : slideDir === 'enter-right'
                  ? 'translateX(110%) rotateY(-25deg)'
                  : slideDir === 'enter-left'
                  ? 'translateX(-110%) rotateY(25deg)'
                  : 'translateX(0) rotateY(0deg)',
                transformOrigin: slideDir === 'exit-left' || slideDir === 'enter-left' ? 'left center' : slideDir === 'exit-right' || slideDir === 'enter-right' ? 'right center' : 'center center',
              }}
              className="space-y-5"
            >
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selIsTour ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                  {selIsTour ? (
                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">{selected.ride.customerName}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    {selIsTour && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                        TOUR
                      </span>
                    )}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getStatusBadge(selected.ride.status)}`}>
                      {getStatusLabel(selected.ride.status)}
                    </span>
                    {selected.ride.isRoundtrip && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {selected.isReturn ? 'Επιστροφή' : 'Μετάβαση'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Route / Tour Info */}
            {selIsTour ? (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3.5">
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-2.5">{selTourName}</p>
              <div className="space-y-1.5">
                {selTourStops.map((stop, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-800/50 text-amber-800 dark:text-amber-300 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <span className="text-sm text-gray-800 dark:text-gray-200">{stop.trim()}</span>
                  </div>
                ))}
              </div>
            </div>
            ) : (
            <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-3.5">
              <div className="flex items-stretch gap-3">
                <div className="flex flex-col items-center py-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-800 flex-shrink-0" />
                  <div className="w-px flex-1 bg-gray-300 dark:bg-gray-600" />
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-200 dark:ring-red-800 flex-shrink-0" />
                </div>
                <div className="flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-semibold">Αφετηρία</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selected.isReturn ? selected.ride.dropoff.address : selected.ride.pickup.address}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-semibold">Προορισμός</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selected.isReturn ? selected.ride.pickup.address : selected.ride.dropoff.address}</p>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Date/Time + People */}
            <div className="flex gap-3">
              <div className="flex-1 rounded-xl bg-gray-50 dark:bg-gray-700/50 p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-semibold">
                    {selected.isReturn ? 'Επιστροφή' : (selected.ride.isRoundtrip ? 'Μετάβαση' : 'Ημερομηνία')}
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {selected.isReturn
                    ? (selected.ride.returnScheduledFor ? new Date(selected.ride.returnScheduledFor).toLocaleString('el-GR', { day: '2-digit', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Athens' }) : '-')
                    : (selected.ride.scheduledFor ? new Date(selected.ride.scheduledFor).toLocaleString('el-GR', { day: '2-digit', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Athens' }) : '-')
                  }
                </p>
              </div>
              <div className="w-20 rounded-xl bg-gray-50 dark:bg-gray-700/50 p-3.5 flex flex-col items-center justify-center">
                <svg className="w-4 h-4 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {selected.isReturn ? (selected.ride.returnPeople ?? 1) : (selected.ride.people ?? 1)}
                </p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2">
              <a href={`tel:${selected.ride.customerPhone}`} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-sm text-gray-700 dark:text-gray-300">{selected.ride.customerPhone}</span>
              </a>
              <a href={`mailto:${selected.ride.customerEmail}`} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group break-all">
                <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-gray-700 dark:text-gray-300">{selected.ride.customerEmail}</span>
              </a>
            </div>

            {/* Flight Info — show outbound or return depending on which event was clicked */}
            {(() => {
              const fn = selected.isReturn ? selected.ride.returnFlightNumber : selected.ride.flightNumber;
              const ft = selected.isReturn ? selected.ride.returnFlightTime : selected.ride.flightTime;
              const lc = selected.isReturn ? selected.ride.returnLuggageCount : selected.ride.luggageCount;
              if (!fn) return null;
              return (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3.5">
                  <p className="text-[10px] uppercase tracking-wider text-red-500 dark:text-red-400 font-semibold mb-2">Στοιχεία Πτήσης</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-800/40 text-sm font-semibold text-red-900 dark:text-red-200">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" /></svg>
                      {fn}
                    </span>
                    {ft && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-800/40 text-sm font-medium text-red-800 dark:text-red-300">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {ft}
                      </span>
                    )}
                    {lc != null && lc > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-800/40 text-sm font-medium text-red-800 dark:text-red-300">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        {lc} αποσκ.
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Distance & Duration */}
            {(() => {
              const r = selected.ride;
              const distKm = r.distance ?? (() => {
                const pc = r.pickup.coordinates?.coordinates || [0, 0];
                const dc = r.dropoff.coordinates?.coordinates || [0, 0];
                return estimateRoadDistanceFromCoords(pc[1], pc[0], dc[1], dc[0]);
              })();
              const durationMin = r.estimatedDuration ?? (distKm ? Math.max(30, Math.round((distKm / 50) * 60)) : 0);
              if (!distKm) return null;
              return (
                <div className="flex gap-3">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700/60">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">~{distKm} km</span>
                  </div>
                  <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700/60">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">~{durationMin >= 60 ? `${Math.floor(durationMin / 60)}ω ${durationMin % 60}λ` : `${durationMin} λεπτά`}</span>
                  </div>
                </div>
              );
            })()}

            {/* Action Button */}
            <button
              className="w-full mt-2 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              onClick={() => {
                setSelected(null);
                navigate(`/admin?ride=${selected.ride._id}`);
              }}
            >
              Διαχείριση Κράτησης
            </button>
            </div>
            </div>
          </div>
          );
        })()}
      </Modal>
        );
      })()}
      </div>
    </div>
    </>
  );
}

export default AdminCalendar;
