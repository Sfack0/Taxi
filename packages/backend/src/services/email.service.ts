import nodemailer from 'nodemailer';
import type { Ride, SupportedLanguage } from '@cts/shared';
import logger from '../utils/logger';
import { EmailLog, EmailLogStatus } from '../models/EmailLog.model';

// Check if emails are enabled
const isEmailEnabled = () => process.env.EMAIL_ENABLED === 'true';

// Check if Brevo is configured (HTTP-based, works on Render free tier)
const isBrevoEnabled = () => !!process.env.BREVO_API_KEY;

// Email transporter configuration (SMTP - for local development)
const createTransporter = () => {
  if (!isEmailEnabled() || isBrevoEnabled()) {
    return null;
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const transporter = createTransporter();

// Records every email attempt in MongoDB; must never break the sending flow
const logEmail = async (entry: {
  to: string;
  subject: string;
  text: string;
  html: string;
  type: string;
  provider: 'brevo' | 'smtp' | 'none';
  status: EmailLogStatus;
  error?: string;
  rideId?: string;
}) => {
  try {
    await EmailLog.create({
      to: entry.to,
      subject: entry.subject,
      text: entry.text,
      html: entry.html,
      type: entry.type,
      provider: entry.provider,
      status: entry.status,
      error: entry.error,
      ride: entry.rideId || undefined,
    });
  } catch (error) {
    logger.error('Failed to write email log:', error);
  }
};

// Unified email sender - uses Brevo HTTP API or nodemailer SMTP
// `to` can be a single email or comma-separated list
const sendEmail = async (options: {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  type?: string;
  rideId?: string;
}) => {
  const recipients = options.to.split(',').map((e) => e.trim()).filter(Boolean);
  const provider: 'brevo' | 'smtp' | 'none' = isBrevoEnabled() ? 'brevo' : transporter ? 'smtp' : 'none';
  const logBase = {
    to: recipients.join(', '),
    subject: options.subject,
    text: options.text,
    html: options.html,
    type: options.type || 'other',
    provider,
    rideId: options.rideId,
  };

  try {
    let result = null;

    if (provider === 'brevo') {
      const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@crete-taxivan.gr';
      const replyToEmail = process.env.EMAIL_USER || senderEmail;
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Comfort Transfer Services', email: senderEmail },
          to: recipients.map((email) => ({ email })),
          replyTo: { email: replyToEmail },
          subject: options.subject,
          htmlContent: options.html,
          textContent: options.text,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Brevo error: ${JSON.stringify(error)}`);
      }
      result = await response.json();
    } else if (provider === 'smtp') {
      result = await transporter!.sendMail({ ...options, to: recipients.join(', ') });
    } else {
      await logEmail({ ...logBase, status: 'skipped' });
      return null;
    }

    await logEmail({ ...logBase, status: 'sent' });
    return result;
  } catch (error) {
    await logEmail({
      ...logBase,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

// ============================================================================
// TRANSLATIONS
// ============================================================================

type EmailTranslations = {
  subject: string;
  bookingConfirmation: string;
  withReturn: string;
  route: string;
  from: string;
  to: string;
  outbound: string;
  return: string;
  date: string;
  person: string;
  people: string;
  details: string;
  name: string;
  phone: string;
  payment: string;
  cash: string;
  card: string;
  childSeat: string;
  yes: string;
  notes: string;
  flightInfo: string;
  returnFlightInfo: string;
  flightNumber: string;
  flightTime: string;
  luggageCount: string;
  willContact: string;
};

const translations: Record<SupportedLanguage, EmailTranslations> = {
  el: {
    subject: 'Επιβεβαίωση Κράτησης',
    bookingConfirmation: 'Επιβεβαίωση Κράτησης',
    withReturn: 'με επιστροφή',
    route: 'Διαδρομή',
    from: 'Από',
    to: 'Προς',
    outbound: 'Μετάβαση',
    return: 'Επιστροφή',
    date: 'Ημερομηνία',
    person: 'άτομο',
    people: 'άτομα',
    details: 'Στοιχεία',
    name: 'Όνομα',
    phone: 'Τηλέφωνο',
    payment: 'Πληρωμή',
    cash: 'Μετρητά',
    card: 'Κάρτα',
    childSeat: 'Παιδικό Κάθισμα',
    yes: 'Ναι',
    notes: 'Σημειώσεις',
    flightInfo: 'Στοιχεία Πτήσης',
    returnFlightInfo: 'Στοιχεία Πτήσης Επιστροφής',
    flightNumber: 'Αρ. Πτήσης',
    flightTime: 'Ώρα Πτήσης',
    luggageCount: 'Αποσκευές',
    willContact: 'Θα επικοινωνήσουμε μαζί σας για επιβεβαίωση.',
  },
  en: {
    subject: 'Booking Confirmation',
    bookingConfirmation: 'Booking Confirmation',
    withReturn: 'round trip',
    route: 'Route',
    from: 'From',
    to: 'To',
    outbound: 'Outbound',
    return: 'Return',
    date: 'Date',
    person: 'person',
    people: 'people',
    details: 'Details',
    name: 'Name',
    phone: 'Phone',
    payment: 'Payment',
    cash: 'Cash',
    card: 'Card',
    childSeat: 'Child Seat',
    yes: 'Yes',
    notes: 'Notes',
    flightInfo: 'Flight Info',
    returnFlightInfo: 'Return Flight Info',
    flightNumber: 'Flight Number',
    flightTime: 'Flight Time',
    luggageCount: 'Luggage',
    willContact: 'We will contact you to confirm your booking.',
  },
  fr: {
    subject: 'Confirmation de Réservation',
    bookingConfirmation: 'Confirmation de Réservation',
    withReturn: 'aller-retour',
    route: 'Itinéraire',
    from: 'De',
    to: 'À',
    outbound: 'Aller',
    return: 'Retour',
    date: 'Date',
    person: 'personne',
    people: 'personnes',
    details: 'Détails',
    name: 'Nom',
    phone: 'Téléphone',
    payment: 'Paiement',
    cash: 'Espèces',
    card: 'Carte',
    childSeat: 'Siège Enfant',
    yes: 'Oui',
    notes: 'Notes',
    flightInfo: 'Info Vol',
    returnFlightInfo: 'Info Vol Retour',
    flightNumber: 'N° de Vol',
    flightTime: 'Heure du Vol',
    luggageCount: 'Bagages',
    willContact: 'Nous vous contacterons pour confirmer votre réservation.',
  },
  de: {
    subject: 'Buchungsbestätigung',
    bookingConfirmation: 'Buchungsbestätigung',
    withReturn: 'Hin und zurück',
    route: 'Route',
    from: 'Von',
    to: 'Nach',
    outbound: 'Hinfahrt',
    return: 'Rückfahrt',
    date: 'Datum',
    person: 'Person',
    people: 'Personen',
    details: 'Details',
    name: 'Name',
    phone: 'Telefon',
    payment: 'Zahlung',
    cash: 'Bargeld',
    card: 'Karte',
    childSeat: 'Kindersitz',
    yes: 'Ja',
    notes: 'Anmerkungen',
    flightInfo: 'Flugdaten',
    returnFlightInfo: 'Rückflugdaten',
    flightNumber: 'Flugnummer',
    flightTime: 'Flugzeit',
    luggageCount: 'Gepäck',
    willContact: 'Wir werden Sie kontaktieren, um Ihre Buchung zu bestätigen.',
  },
  it: {
    subject: 'Conferma Prenotazione',
    bookingConfirmation: 'Conferma Prenotazione',
    withReturn: 'andata e ritorno',
    route: 'Percorso',
    from: 'Da',
    to: 'A',
    outbound: 'Andata',
    return: 'Ritorno',
    date: 'Data',
    person: 'persona',
    people: 'persone',
    details: 'Dettagli',
    name: 'Nome',
    phone: 'Telefono',
    payment: 'Pagamento',
    cash: 'Contanti',
    card: 'Carta',
    childSeat: 'Seggiolino',
    yes: 'Sì',
    notes: 'Note',
    flightInfo: 'Info Volo',
    returnFlightInfo: 'Info Volo Ritorno',
    flightNumber: 'N° Volo',
    flightTime: 'Ora del Volo',
    luggageCount: 'Bagagli',
    willContact: 'Vi contatteremo per confermare la vostra prenotazione.',
  },
  es: {
    subject: 'Confirmación de Reserva',
    bookingConfirmation: 'Confirmación de Reserva',
    withReturn: 'ida y vuelta',
    route: 'Ruta',
    from: 'Desde',
    to: 'Hasta',
    outbound: 'Ida',
    return: 'Vuelta',
    date: 'Fecha',
    person: 'persona',
    people: 'personas',
    details: 'Datos',
    name: 'Nombre',
    phone: 'Teléfono',
    payment: 'Pago',
    cash: 'Efectivo',
    card: 'Tarjeta',
    childSeat: 'Silla Infantil',
    yes: 'Sí',
    notes: 'Notas',
    flightInfo: 'Info del Vuelo',
    returnFlightInfo: 'Info del Vuelo de Regreso',
    flightNumber: 'N° de Vuelo',
    flightTime: 'Hora del Vuelo',
    luggageCount: 'Equipaje',
    willContact: 'Nos pondremos en contacto con usted para confirmar su reserva.',
  },
};

// Locale mapping for date formatting
const localeMap: Record<SupportedLanguage, string> = {
  el: 'el-GR',
  en: 'en-US',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  es: 'es-ES',
};

// ============================================================================
// LOCATION TRANSLATIONS
// ============================================================================

type LocationTranslations = Record<string, Record<SupportedLanguage, string>>;

const locationTranslations: LocationTranslations = {
  'Αεροδρόμιο Ηρακλείου (HER)': {
    el: 'Αεροδρόμιο Ηρακλείου (HER)',
    en: 'Heraklion Airport (HER)',
    fr: 'Aéroport d\'Héraklion (HER)',
    de: 'Flughafen Heraklion (HER)',
    it: 'Aeroporto di Heraklion (HER)',
    es: 'Aeropuerto de Heraklion (HER)',
  },
  'Αεροδρόμιο Χανίων (CHQ)': {
    el: 'Αεροδρόμιο Χανίων (CHQ)',
    en: 'Chania Airport (CHQ)',
    fr: 'Aéroport de La Canée (CHQ)',
    de: 'Flughafen Chania (CHQ)',
    it: 'Aeroporto di Chania (CHQ)',
    es: 'Aeropuerto de Chania (CHQ)',
  },
  'Κέντρο Ηρακλείου': {
    el: 'Κέντρο Ηρακλείου',
    en: 'Heraklion Center',
    fr: 'Centre d\'Héraklion',
    de: 'Heraklion Zentrum',
    it: 'Centro di Heraklion',
    es: 'Centro de Heraklion',
  },
  'Χερσόνησος': {
    el: 'Χερσόνησος',
    en: 'Hersonissos',
    fr: 'Hersonissos',
    de: 'Chersonissos',
    it: 'Hersonissos',
    es: 'Hersonissos',
  },
  'Μάλια': {
    el: 'Μάλια',
    en: 'Malia',
    fr: 'Malia',
    de: 'Malia',
    it: 'Malia',
    es: 'Malia',
  },
  'Άγιος Νικόλαος': {
    el: 'Άγιος Νικόλαος',
    en: 'Agios Nikolaos',
    fr: 'Agios Nikolaos',
    de: 'Agios Nikolaos',
    it: 'Agios Nikolaos',
    es: 'Agios Nikolaos',
  },
  'Ελούντα': {
    el: 'Ελούντα',
    en: 'Elounda',
    fr: 'Elounda',
    de: 'Elounda',
    it: 'Elounda',
    es: 'Elounda',
  },
  'Ρέθυμνο': {
    el: 'Ρέθυμνο',
    en: 'Rethymno',
    fr: 'Réthymnon',
    de: 'Rethymno',
    it: 'Rethymno',
    es: 'Rethymno',
  },
  'Παλιά Πόλη Χανίων': {
    el: 'Παλιά Πόλη Χανίων',
    en: 'Chania Old Town',
    fr: 'Vieille ville de La Canée',
    de: 'Chania Altstadt',
    it: 'Città vecchia di Chania',
    es: 'Casco Antiguo de Chania',
  },
  'Σταλίδα': {
    el: 'Σταλίδα',
    en: 'Stalida',
    fr: 'Stalida',
    de: 'Stalida',
    it: 'Stalida',
    es: 'Stalida',
  },
  'Γούβες': {
    el: 'Γούβες',
    en: 'Gouves',
    fr: 'Gouves',
    de: 'Gouves',
    it: 'Gouves',
    es: 'Gouves',
  },
  'Κοκκίνη Χάνι': {
    el: 'Κοκκίνη Χάνι',
    en: 'Kokkini Hani',
    fr: 'Kokkini Hani',
    de: 'Kokkini Hani',
    it: 'Kokkini Hani',
    es: 'Kokkini Hani',
  },
  'Αμμουδάρα': {
    el: 'Αμμουδάρα',
    en: 'Ammoudara',
    fr: 'Ammoudara',
    de: 'Ammoudara',
    it: 'Ammoudara',
    es: 'Ammoudara',
  },
  'Αγία Πελαγία': {
    el: 'Αγία Πελαγία',
    en: 'Agia Pelagia',
    fr: 'Agia Pelagia',
    de: 'Agia Pelagia',
    it: 'Agia Pelagia',
    es: 'Agia Pelagia',
  },
  'Μπαλί': {
    el: 'Μπαλί',
    en: 'Bali',
    fr: 'Bali',
    de: 'Bali',
    it: 'Bali',
    es: 'Bali',
  },
  'Πλακιάς': {
    el: 'Πλακιάς',
    en: 'Plakias',
    fr: 'Plakias',
    de: 'Plakias',
    it: 'Plakias',
    es: 'Plakias',
  },
  'Μάταλα': {
    el: 'Μάταλα',
    en: 'Matala',
    fr: 'Matala',
    de: 'Matala',
    it: 'Matala',
    es: 'Matala',
  },
  'Ιεράπετρα': {
    el: 'Ιεράπετρα',
    en: 'Ierapetra',
    fr: 'Iérapétra',
    de: 'Ierapetra',
    it: 'Ierapetra',
    es: 'Ierapetra',
  },
  'Σητεία': {
    el: 'Σητεία',
    en: 'Sitia',
    fr: 'Sitia',
    de: 'Sitia',
    it: 'Sitia',
    es: 'Sitia',
  },
};

// Translate a location from Greek to the target language
const translateLocation = (greekLocation: string, lang: SupportedLanguage): string => {
  const translations = locationTranslations[greekLocation];
  if (translations && translations[lang]) {
    return translations[lang];
  }
  // If no translation found, return the original (Greek) value
  return greekLocation;
};

// Format date in specific language
const formatDate = (date: Date | string, lang: SupportedLanguage = 'el') => {
  return new Date(date).toLocaleString(localeMap[lang], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    // Emails render server-side (UTC on Netlify) — pin to Crete's timezone so
    // the pickup time matches what the customer picked and what admin sees.
    timeZone: 'Europe/Athens',
  });
};

// Format people text (singular/plural)
const formatPeople = (count: number, lang: SupportedLanguage = 'el') => {
  const t = translations[lang];
  return count === 1 ? `1 ${t.person}` : `${count} ${t.people}`;
};

// ============================================================================
// CUSTOMER EMAIL (Multi-language)
// ============================================================================

const getBookingConfirmationHTML = (ride: Ride) => {
  const rawLang = ride.customerLanguage || 'el';
  const lang = (translations[rawLang as SupportedLanguage] ? rawLang : 'el') as SupportedLanguage;
  const t = translations[lang];
  const scheduledDate = ride.scheduledFor ? formatDate(ride.scheduledFor, lang) : null;
  const returnDate = ride.returnScheduledFor ? formatDate(ride.returnScheduledFor, lang) : null;

  // Translate locations for customer email
  const pickupTranslated = translateLocation(ride.pickup.address, lang);
  const dropoffTranslated = translateLocation(ride.dropoff.address, lang);

  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 500px; margin: 0 auto; padding: 20px;">
  <div style="background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 24px;">
    <div style="text-align: center; border-bottom: 1px solid #eee; padding-bottom: 16px; margin-bottom: 20px;">
      <h1 style="color: #0ea5e9; margin: 0 0 4px 0; font-size: 24px;">Comfort Transfer Services</h1>
      <p style="color: #666; margin: 0; font-size: 14px;">${t.bookingConfirmation}${ride.isRoundtrip ? ` (${t.withReturn})` : ''}</p>
    </div>

    <div style="margin-bottom: 16px;">
      <div style="font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 8px;">${t.route}</div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 50%; padding-right: 8px; vertical-align: top;">
            <div style="font-weight: 600; color: #333; font-size: 12px;">${t.from}</div>
            <div style="color: #666; font-size: 14px;">${pickupTranslated}</div>
          </td>
          <td style="width: 50%; padding-left: 8px; vertical-align: top;">
            <div style="font-weight: 600; color: #333; font-size: 12px;">${t.to}</div>
            <div style="color: #666; font-size: 14px;">${dropoffTranslated}</div>
          </td>
        </tr>
      </table>
    </div>

    ${scheduledDate ? `
    <div style="margin-bottom: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px;">
      <div style="font-size: 11px; color: #166534; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">${ride.isRoundtrip ? t.outbound : t.date}</div>
      <div style="color: #166534; font-weight: 500;">${scheduledDate}</div>
      ${ride.people ? `<div style="color: #166534; font-size: 13px;">${formatPeople(ride.people, lang)}</div>` : ''}
    </div>
    ` : ''}

    ${ride.isRoundtrip && returnDate ? `
    <div style="margin-bottom: 16px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px;">
      <div style="font-size: 11px; color: #1e40af; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">${t.return}</div>
      <div style="color: #1e40af; font-weight: 500;">${returnDate}</div>
      ${ride.returnPeople ? `<div style="color: #1e40af; font-size: 13px;">${formatPeople(ride.returnPeople, lang)}</div>` : ''}
    </div>
    ` : ''}

    <div style="margin-bottom: 16px;">
      <div style="font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 8px;">${t.details}</div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; border-bottom: 1px solid #f0f0f0; color: #666; width: 100px;">${t.name}</td>
          <td style="padding: 6px 0; border-bottom: 1px solid #f0f0f0; color: #333; font-weight: 500; text-align: right;">${ride.customerName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; border-bottom: 1px solid #f0f0f0; color: #666;">${t.phone}</td>
          <td style="padding: 6px 0; border-bottom: 1px solid #f0f0f0; color: #333; font-weight: 500; text-align: right;">${ride.customerPhone}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; border-bottom: 1px solid #f0f0f0; color: #666;">${t.payment}</td>
          <td style="padding: 6px 0; border-bottom: 1px solid #f0f0f0; color: #333; font-weight: 500; text-align: right;">${ride.paymentMethod === 'card' ? t.card : t.cash}</td>
        </tr>
        ${ride.childSeat ? `
        <tr>
          <td style="padding: 6px 0; border-bottom: 1px solid #f0f0f0; color: #666;">${t.childSeat}</td>
          <td style="padding: 6px 0; border-bottom: 1px solid #f0f0f0; color: #333; font-weight: 500; text-align: right;">${t.yes}</td>
        </tr>
        ` : ''}
        ${ride.notes ? `
        <tr>
          <td style="padding: 6px 0; color: #666; vertical-align: top;">${t.notes}</td>
          <td style="padding: 6px 0; color: #333; font-weight: 500; text-align: right;">${ride.notes.replace(/\n/g, '<br>')}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    ${ride.flightNumber ? `
    <div style="margin-bottom: 16px; background: #e0f2fe; border: 1px solid #7dd3fc; border-radius: 8px; padding: 12px;">
      <div style="font-size: 11px; color: #0369a1; text-transform: uppercase; font-weight: 600; margin-bottom: 8px;">${t.flightInfo}</div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 4px 0; color: #0369a1;">${t.flightNumber}</td>
          <td style="padding: 4px 0; color: #0c4a6e; font-weight: 600; text-align: right;">${ride.flightNumber}</td>
        </tr>
        ${ride.flightTime ? `
        <tr>
          <td style="padding: 4px 0; color: #0369a1;">${t.flightTime}</td>
          <td style="padding: 4px 0; color: #0c4a6e; font-weight: 600; text-align: right;">${ride.flightTime}</td>
        </tr>
        ` : ''}
        ${ride.luggageCount != null && ride.luggageCount > 0 ? `
        <tr>
          <td style="padding: 4px 0; color: #0369a1;">${t.luggageCount}</td>
          <td style="padding: 4px 0; color: #0c4a6e; font-weight: 600; text-align: right;">${ride.luggageCount}</td>
        </tr>
        ` : ''}
      </table>
    </div>
    ` : ''}

    ${ride.returnFlightNumber ? `
    <div style="margin-bottom: 16px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px;">
      <div style="font-size: 11px; color: #92400e; text-transform: uppercase; font-weight: 600; margin-bottom: 8px;">${t.returnFlightInfo}</div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 4px 0; color: #92400e;">${t.flightNumber}</td>
          <td style="padding: 4px 0; color: #78350f; font-weight: 600; text-align: right;">${ride.returnFlightNumber}</td>
        </tr>
        ${ride.returnFlightTime ? `
        <tr>
          <td style="padding: 4px 0; color: #92400e;">${t.flightTime}</td>
          <td style="padding: 4px 0; color: #78350f; font-weight: 600; text-align: right;">${ride.returnFlightTime}</td>
        </tr>
        ` : ''}
        ${ride.returnLuggageCount != null && ride.returnLuggageCount > 0 ? `
        <tr>
          <td style="padding: 4px 0; color: #92400e;">${t.luggageCount}</td>
          <td style="padding: 4px 0; color: #78350f; font-weight: 600; text-align: right;">${ride.returnLuggageCount}</td>
        </tr>
        ` : ''}
      </table>
    </div>
    ` : ''}

    <div style="text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
      <p style="margin: 0 0 4px 0;">${t.willContact}</p>
      <p style="margin: 0;">Comfort Transfer Services</p>
    </div>
  </div>
</body>
</html>
  `;
};

const getBookingConfirmationText = (ride: Ride) => {
  const rawLang = ride.customerLanguage || 'el';
  const lang = (translations[rawLang as SupportedLanguage] ? rawLang : 'el') as SupportedLanguage;
  const t = translations[lang];
  const scheduledDate = ride.scheduledFor ? formatDate(ride.scheduledFor, lang) : null;
  const returnDate = ride.returnScheduledFor ? formatDate(ride.returnScheduledFor, lang) : null;

  // Translate locations for customer email
  const pickupTranslated = translateLocation(ride.pickup.address, lang);
  const dropoffTranslated = translateLocation(ride.dropoff.address, lang);

  return `
Comfort Transfer Services - ${t.bookingConfirmation}${ride.isRoundtrip ? ` (${t.withReturn})` : ''}

${t.route}: ${pickupTranslated} → ${dropoffTranslated}
${scheduledDate ? `\n${ride.isRoundtrip ? t.outbound : t.date}: ${scheduledDate}${ride.people ? ` (${formatPeople(ride.people, lang)})` : ''}` : ''}
${ride.isRoundtrip && returnDate ? `${t.return}: ${returnDate}${ride.returnPeople ? ` (${formatPeople(ride.returnPeople, lang)})` : ''}` : ''}

${t.details}:
- ${t.name}: ${ride.customerName}
- ${t.phone}: ${ride.customerPhone}
- ${t.payment}: ${ride.paymentMethod === 'card' ? t.card : t.cash}${ride.childSeat ? `\n- ${t.childSeat}: ${t.yes}` : ''}${ride.notes ? `\n- ${t.notes}: ${ride.notes}` : ''}
${ride.flightNumber ? `\n${t.flightInfo}:\n- ${t.flightNumber}: ${ride.flightNumber}${ride.flightTime ? `\n- ${t.flightTime}: ${ride.flightTime}` : ''}${ride.luggageCount ? `\n- ${t.luggageCount}: ${ride.luggageCount}` : ''}` : ''}
${ride.returnFlightNumber ? `\n${t.returnFlightInfo}:\n- ${t.flightNumber}: ${ride.returnFlightNumber}${ride.returnFlightTime ? `\n- ${t.flightTime}: ${ride.returnFlightTime}` : ''}${ride.returnLuggageCount ? `\n- ${t.luggageCount}: ${ride.returnLuggageCount}` : ''}` : ''}

${t.willContact}

Comfort Transfer Services
  `;
};

export const sendBookingConfirmation = async (ride: Ride): Promise<void> => {
  if (!isEmailEnabled()) return;

  const rawLang = ride.customerLanguage || 'el';
  const lang = (translations[rawLang as SupportedLanguage] ? rawLang : 'el') as SupportedLanguage;
  logger.info('Sending booking confirmation email, customerLanguage:', ride.customerLanguage, '-> using:', lang);
  const t = translations[lang];

  try {
    await sendEmail({
      from: `"Comfort Transfer Services" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: ride.customerEmail,
      subject: t.subject,
      text: getBookingConfirmationText(ride),
      html: getBookingConfirmationHTML(ride),
      type: 'booking_confirmation',
      rideId: String(ride._id),
    });
  } catch (error) {
    logger.error('Failed to send booking confirmation email:', error);
  }
};

// ============================================================================
// OTP VERIFICATION EMAIL (Multi-language)
// ============================================================================

type OtpTranslations = {
  subject: string;
  title: string;
  greeting: string;
  message: string;
  codeLabel: string;
  expiresIn: string;
  ignore: string;
};

const otpTranslations: Record<SupportedLanguage, OtpTranslations> = {
  el: {
    subject: 'Κωδικός Επαλήθευσης - Comfort Transfer Services',
    title: 'Επαλήθευση Email',
    greeting: 'Γεια σου',
    message: 'Χρησιμοποίησε τον παρακάτω κωδικό για να επαληθεύσεις το email σου:',
    codeLabel: 'Ο κωδικός σου',
    expiresIn: 'Ο κωδικός λήγει σε 5 λεπτά.',
    ignore: 'Αν δεν ζήτησες αυτόν τον κωδικό, αγνόησε αυτό το email.',
  },
  en: {
    subject: 'Verification Code - Comfort Transfer Services',
    title: 'Email Verification',
    greeting: 'Hi',
    message: 'Use the code below to verify your email address:',
    codeLabel: 'Your code',
    expiresIn: 'This code expires in 5 minutes.',
    ignore: 'If you didn\'t request this code, please ignore this email.',
  },
  fr: {
    subject: 'Code de Vérification - Comfort Transfer Services',
    title: 'Vérification Email',
    greeting: 'Bonjour',
    message: 'Utilisez le code ci-dessous pour vérifier votre adresse email :',
    codeLabel: 'Votre code',
    expiresIn: 'Ce code expire dans 5 minutes.',
    ignore: 'Si vous n\'avez pas demandé ce code, veuillez ignorer cet email.',
  },
  de: {
    subject: 'Bestätigungscode - Comfort Transfer Services',
    title: 'E-Mail-Verifizierung',
    greeting: 'Hallo',
    message: 'Verwenden Sie den folgenden Code, um Ihre E-Mail-Adresse zu bestätigen:',
    codeLabel: 'Ihr Code',
    expiresIn: 'Dieser Code läuft in 5 Minuten ab.',
    ignore: 'Wenn Sie diesen Code nicht angefordert haben, ignorieren Sie bitte diese E-Mail.',
  },
  it: {
    subject: 'Codice di Verifica - Comfort Transfer Services',
    title: 'Verifica Email',
    greeting: 'Ciao',
    message: 'Usa il codice qui sotto per verificare il tuo indirizzo email:',
    codeLabel: 'Il tuo codice',
    expiresIn: 'Questo codice scade tra 5 minuti.',
    ignore: 'Se non hai richiesto questo codice, ignora questa email.',
  },
  es: {
    subject: 'Código de Verificación - Comfort Transfer Services',
    title: 'Verificación de Email',
    greeting: 'Hola',
    message: 'Usa el código de abajo para verificar tu dirección de email:',
    codeLabel: 'Tu código',
    expiresIn: 'Este código expira en 5 minutos.',
    ignore: 'Si no solicitaste este código, ignora este email.',
  },
};

const getOtpEmailHTML = (otp: string, firstName: string, lang: SupportedLanguage) => {
  const t = otpTranslations[lang] || otpTranslations.en;

  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 500px; margin: 0 auto; padding: 20px;">
  <div style="background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 24px;">
    <div style="text-align: center; border-bottom: 1px solid #eee; padding-bottom: 16px; margin-bottom: 20px;">
      <h1 style="color: #0ea5e9; margin: 0 0 4px 0; font-size: 24px;">Comfort Transfer Services</h1>
      <p style="color: #666; margin: 0; font-size: 14px;">${t.title}</p>
    </div>

    <p style="margin: 0 0 16px 0;">${t.greeting} ${firstName},</p>
    <p style="margin: 0 0 20px 0;">${t.message}</p>

    <div style="text-align: center; margin: 24px 0;">
      <div style="font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 8px;">${t.codeLabel}</div>
      <div style="display: inline-block; background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 16px 32px; letter-spacing: 8px; font-size: 32px; font-weight: 700; color: #166534;">
        ${otp}
      </div>
    </div>

    <p style="text-align: center; color: #666; font-size: 13px; margin: 16px 0 0 0;">${t.expiresIn}</p>

    <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
      <p style="margin: 0 0 4px 0;">${t.ignore}</p>
      <p style="margin: 0;">Comfort Transfer Services</p>
    </div>
  </div>
</body>
</html>
  `;
};

export const sendOtpEmail = async (email: string, otp: string, firstName: string, language: SupportedLanguage = 'en'): Promise<void> => {
  if (!isEmailEnabled()) return;

  const lang = (otpTranslations[language] ? language : 'en') as SupportedLanguage;
  const t = otpTranslations[lang];

  try {
    await sendEmail({
      from: `"Comfort Transfer Services" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: t.subject,
      text: `${t.greeting} ${firstName},\n\n${t.message}\n\n${otp}\n\n${t.expiresIn}\n\n${t.ignore}\n\nComfort Transfer Services`,
      html: getOtpEmailHTML(otp, firstName, lang),
      type: 'otp',
    });
  } catch (error) {
    logger.error('Failed to send OTP email:', error);
  }
};

// ============================================================================
// ADMIN EMAIL (Always in Greek)
// ============================================================================

// Format date in Greek (always for admin)
const formatDateGreek = (date: Date | string) => {
  return new Date(date).toLocaleString('el-GR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Athens',
  });
};

// Format people text in Greek
const formatPeopleGreek = (count: number) => {
  return count === 1 ? '1 άτομο' : `${count} άτομα`;
};

const getAdminNotificationHTML = (ride: Ride) => {
  const scheduledDate = ride.scheduledFor ? formatDateGreek(ride.scheduledFor) : null;
  const returnDate = ride.returnScheduledFor ? formatDateGreek(ride.returnScheduledFor) : null;

  return `
<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 500px; margin: 0 auto; padding: 20px;">
  <div style="background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 24px;">
    <div style="background: #f59e0b; color: white; padding: 16px; border-radius: 6px; text-align: center; margin-bottom: 20px;">
      <h1 style="margin: 0; font-size: 18px;">Νέα Κράτηση${ride.isRoundtrip ? ' (με επιστροφή)' : ''}</h1>
    </div>

    <div style="margin-bottom: 16px;">
      <div style="font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 8px; font-weight: 600;">Διαδρομή</div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 50%; padding-right: 8px; vertical-align: top;">
            <div style="font-weight: 600; color: #333; font-size: 12px;">Από</div>
            <div style="color: #666; font-size: 14px;">${ride.pickup.address}</div>
          </td>
          <td style="width: 50%; padding-left: 8px; vertical-align: top;">
            <div style="font-weight: 600; color: #333; font-size: 12px;">Προς</div>
            <div style="color: #666; font-size: 14px;">${ride.dropoff.address}</div>
          </td>
        </tr>
      </table>
    </div>

    ${scheduledDate ? `
    <div style="margin-bottom: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px;">
      <div style="font-size: 11px; color: #166534; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">${ride.isRoundtrip ? 'Μετάβαση' : 'Ημερομηνία'}</div>
      <div style="color: #166534; font-weight: 500;">${scheduledDate}</div>
      ${ride.people ? `<div style="color: #166534; font-size: 13px;">${formatPeopleGreek(ride.people)}</div>` : ''}
    </div>
    ` : ''}

    ${ride.isRoundtrip && returnDate ? `
    <div style="margin-bottom: 16px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px;">
      <div style="font-size: 11px; color: #1e40af; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Επιστροφή</div>
      <div style="color: #1e40af; font-weight: 500;">${returnDate}</div>
      ${ride.returnPeople ? `<div style="color: #1e40af; font-size: 13px;">${formatPeopleGreek(ride.returnPeople)}</div>` : ''}
    </div>
    ` : ''}

    <div style="margin-bottom: 16px;">
      <div style="font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 8px; font-weight: 600;">Πελάτης</div>
      <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 12px;">
        <div style="margin-bottom: 8px;"><strong>${ride.customerName}</strong></div>
        <div style="margin-bottom: 4px;">Τηλ: <a href="tel:${ride.customerPhone}" style="color: #92400e; text-decoration: none;">${ride.customerPhone}</a></div>
        <div>Email: <a href="mailto:${ride.customerEmail}" style="color: #92400e; text-decoration: none;">${ride.customerEmail}</a></div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #fcd34d;">
          <div>Πληρωμή: <strong>${ride.paymentMethod === 'card' ? 'Κάρτα' : 'Μετρητά'}</strong></div>
          ${ride.childSeat ? '<div>Παιδικό Κάθισμα: <strong>Ναι</strong></div>' : ''}
          ${ride.notes ? `<div style="margin-top: 4px;">Σημειώσεις: <strong>${ride.notes.replace(/\n/g, '<br>')}</strong></div>` : ''}
        </div>
      </div>
    </div>

    ${ride.flightNumber ? `
    <div style="margin-bottom: 16px;">
      <div style="font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 8px; font-weight: 600;">Στοιχεία Πτήσης</div>
      <div style="background: #e0f2fe; border: 1px solid #7dd3fc; border-radius: 6px; padding: 12px;">
        <div style="margin-bottom: 4px;">Αρ. Πτήσης: <strong>${ride.flightNumber}</strong></div>
        ${ride.flightTime ? `<div style="margin-bottom: 4px;">Ώρα Πτήσης: <strong>${ride.flightTime}</strong></div>` : ''}
        ${ride.luggageCount != null && ride.luggageCount > 0 ? `<div>Αποσκευές: <strong>${ride.luggageCount}</strong></div>` : ''}
      </div>
    </div>
    ` : ''}

    ${ride.returnFlightNumber ? `
    <div style="margin-bottom: 16px;">
      <div style="font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 8px; font-weight: 600;">Στοιχεία Πτήσης Επιστροφής</div>
      <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 12px;">
        <div style="margin-bottom: 4px;">Αρ. Πτήσης: <strong>${ride.returnFlightNumber}</strong></div>
        ${ride.returnFlightTime ? `<div style="margin-bottom: 4px;">Ώρα Πτήσης: <strong>${ride.returnFlightTime}</strong></div>` : ''}
        ${ride.returnLuggageCount != null && ride.returnLuggageCount > 0 ? `<div>Αποσκευές: <strong>${ride.returnLuggageCount}</strong></div>` : ''}
      </div>
    </div>
    ` : ''}

    <div style="text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
      <p style="margin: 0;">Comfort Transfer Services Admin</p>
    </div>
  </div>
</body>
</html>
  `;
};

const getAdminNotificationText = (ride: Ride) => {
  const scheduledDate = ride.scheduledFor ? formatDateGreek(ride.scheduledFor) : null;
  const returnDate = ride.returnScheduledFor ? formatDateGreek(ride.returnScheduledFor) : null;

  return `
Comfort Transfer Services - Νέα Κράτηση${ride.isRoundtrip ? ' (με επιστροφή)' : ''}

Διαδρομή: ${ride.pickup.address} → ${ride.dropoff.address}
${scheduledDate ? `\n${ride.isRoundtrip ? 'Μετάβαση' : 'Ημερομηνία'}: ${scheduledDate}${ride.people ? ` (${formatPeopleGreek(ride.people)})` : ''}` : ''}
${ride.isRoundtrip && returnDate ? `Επιστροφή: ${returnDate}${ride.returnPeople ? ` (${formatPeopleGreek(ride.returnPeople)})` : ''}` : ''}

Πελάτης:
- Όνομα: ${ride.customerName}
- Τηλέφωνο: ${ride.customerPhone}
- Email: ${ride.customerEmail}
- Πληρωμή: ${ride.paymentMethod === 'card' ? 'Κάρτα' : 'Μετρητά'}${ride.childSeat ? '\n- Παιδικό Κάθισμα: Ναι' : ''}${ride.notes ? `\n- Σημειώσεις: ${ride.notes}` : ''}
${ride.flightNumber ? `\nΣτοιχεία Πτήσης:\n- Αρ. Πτήσης: ${ride.flightNumber}${ride.flightTime ? `\n- Ώρα Πτήσης: ${ride.flightTime}` : ''}${ride.luggageCount ? `\n- Αποσκευές: ${ride.luggageCount}` : ''}` : ''}
${ride.returnFlightNumber ? `\nΣτοιχεία Πτήσης Επιστροφής:\n- Αρ. Πτήσης: ${ride.returnFlightNumber}${ride.returnFlightTime ? `\n- Ώρα Πτήσης: ${ride.returnFlightTime}` : ''}${ride.returnLuggageCount ? `\n- Αποσκευές: ${ride.returnLuggageCount}` : ''}` : ''}

Comfort Transfer Services Admin
  `;
};

export const sendAdminNotification = async (ride: Ride): Promise<void> => {
  if (!isEmailEnabled()) return;

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  try {
    await sendEmail({
      from: `"Comfort Transfer Services" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `Νέα Κράτηση`,
      text: getAdminNotificationText(ride),
      html: getAdminNotificationHTML(ride),
      type: 'admin_notification',
      rideId: String(ride._id),
    });
  } catch (error) {
    logger.error('Failed to send admin notification email:', error);
  }
};

// ============================================================================
// CANCELLATION EMAIL (Customer + Admin)
// ============================================================================

type CancellationTranslations = {
  subject: string;
  title: string;
  message: string;
  route: string;
  from: string;
  to: string;
  date: string;
  people: string;
  person: string;
  contact: string;
};

const cancellationTranslations: Record<SupportedLanguage, CancellationTranslations> = {
  el: {
    subject: 'Ακύρωση Κράτησης',
    title: 'Η κράτησή σας ακυρώθηκε',
    message: 'Η κράτησή σας έχει ακυρωθεί επιτυχώς.',
    route: 'Διαδρομή',
    from: 'Από',
    to: 'Προς',
    date: 'Ημερομηνία',
    people: 'άτομα',
    person: 'άτομο',
    contact: 'Αν χρειάζεστε βοήθεια, επικοινωνήστε μαζί μας.',
  },
  en: {
    subject: 'Booking Cancelled',
    title: 'Your booking has been cancelled',
    message: 'Your booking has been successfully cancelled.',
    route: 'Route',
    from: 'From',
    to: 'To',
    date: 'Date',
    people: 'people',
    person: 'person',
    contact: 'If you need assistance, please contact us.',
  },
  fr: {
    subject: 'Réservation Annulée',
    title: 'Votre réservation a été annulée',
    message: 'Votre réservation a été annulée avec succès.',
    route: 'Itinéraire',
    from: 'De',
    to: 'À',
    date: 'Date',
    people: 'personnes',
    person: 'personne',
    contact: 'Si vous avez besoin d\'aide, contactez-nous.',
  },
  de: {
    subject: 'Buchung Storniert',
    title: 'Ihre Buchung wurde storniert',
    message: 'Ihre Buchung wurde erfolgreich storniert.',
    route: 'Route',
    from: 'Von',
    to: 'Nach',
    date: 'Datum',
    people: 'Personen',
    person: 'Person',
    contact: 'Wenn Sie Hilfe benötigen, kontaktieren Sie uns.',
  },
  it: {
    subject: 'Prenotazione Cancellata',
    title: 'La sua prenotazione è stata cancellata',
    message: 'La sua prenotazione è stata cancellata con successo.',
    route: 'Percorso',
    from: 'Da',
    to: 'A',
    date: 'Data',
    people: 'persone',
    person: 'persona',
    contact: 'Se ha bisogno di assistenza, ci contatti.',
  },
  es: {
    subject: 'Reserva Cancelada',
    title: 'Su reserva ha sido cancelada',
    message: 'Su reserva ha sido cancelada exitosamente.',
    route: 'Ruta',
    from: 'Desde',
    to: 'Hasta',
    date: 'Fecha',
    people: 'personas',
    person: 'persona',
    contact: 'Si necesita ayuda, contáctenos.',
  },
};

const getCancellationCustomerHTML = (ride: Ride) => {
  const rawLang = ride.customerLanguage || 'el';
  const lang = (cancellationTranslations[rawLang as SupportedLanguage] ? rawLang : 'el') as SupportedLanguage;
  const ct = cancellationTranslations[lang];
  const scheduledDate = ride.scheduledFor ? formatDate(ride.scheduledFor, lang) : null;
  const pickupTranslated = translateLocation(ride.pickup.address, lang);
  const dropoffTranslated = translateLocation(ride.dropoff.address, lang);
  const peopleText = ride.people ? (ride.people === 1 ? `1 ${ct.person}` : `${ride.people} ${ct.people}`) : '';

  return `
<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 500px; margin: 0 auto; padding: 20px;">
  <div style="background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 24px;">
    <div style="text-align: center; border-bottom: 1px solid #eee; padding-bottom: 16px; margin-bottom: 20px;">
      <h1 style="color: #0ea5e9; margin: 0 0 4px 0; font-size: 24px;">Comfort Transfer Services</h1>
      <p style="color: #ef4444; margin: 0; font-size: 14px; font-weight: 600;">${ct.title}</p>
    </div>

    <div style="margin-bottom: 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px;">
      <p style="margin: 0; color: #991b1b;">${ct.message}</p>
    </div>

    <div style="margin-bottom: 16px;">
      <div style="font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 8px;">${ct.route}</div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 50%; padding-right: 8px; vertical-align: top;">
            <div style="font-weight: 600; color: #333; font-size: 12px;">${ct.from}</div>
            <div style="color: #666; font-size: 14px;">${pickupTranslated}</div>
          </td>
          <td style="width: 50%; padding-left: 8px; vertical-align: top;">
            <div style="font-weight: 600; color: #333; font-size: 12px;">${ct.to}</div>
            <div style="color: #666; font-size: 14px;">${dropoffTranslated}</div>
          </td>
        </tr>
      </table>
    </div>

    ${scheduledDate ? `
    <div style="margin-bottom: 12px;">
      <div style="font-size: 12px; color: #666; font-weight: 600;">${ct.date}</div>
      <div style="color: #333;">${scheduledDate}${peopleText ? ` (${peopleText})` : ''}</div>
    </div>
    ` : ''}

    <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #eee; color: #666; font-size: 13px;">
      <p style="margin: 0;">${ct.contact}</p>
    </div>

    <div style="text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
      <p style="margin: 0;">Comfort Transfer Services</p>
    </div>
  </div>
</body>
</html>
  `;
};

const getCancellationAdminHTML = (ride: Ride) => {
  const scheduledDate = ride.scheduledFor ? formatDateGreek(ride.scheduledFor) : null;

  return `
<!DOCTYPE html>
<html lang="el">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 500px; margin: 0 auto; padding: 20px;">
  <div style="background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 24px;">
    <div style="text-align: center; border-bottom: 1px solid #eee; padding-bottom: 16px; margin-bottom: 20px;">
      <h1 style="color: #0ea5e9; margin: 0 0 4px 0; font-size: 24px;">Comfort Transfer Services</h1>
      <p style="color: #ef4444; margin: 0; font-size: 14px; font-weight: 600;">Ακύρωση Κράτησης</p>
    </div>

    <div style="margin-bottom: 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px;">
      <p style="margin: 0; color: #991b1b;">Ο πελάτης <strong>${ride.customerName}</strong> ακύρωσε την κράτησή του.</p>
    </div>

    <div style="margin-bottom: 12px;">
      <div style="font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 4px;">Διαδρομή</div>
      <div style="color: #333;">${ride.pickup.address} → ${ride.dropoff.address}</div>
    </div>

    ${scheduledDate ? `
    <div style="margin-bottom: 12px;">
      <div style="font-size: 12px; color: #666; font-weight: 600;">Ημερομηνία</div>
      <div style="color: #333;">${scheduledDate}${ride.people ? ` (${formatPeopleGreek(ride.people)})` : ''}</div>
    </div>
    ` : ''}

    <div style="margin-bottom: 12px;">
      <div style="font-size: 12px; color: #666; font-weight: 600;">Πελάτης</div>
      <div>${ride.customerName} — ${ride.customerPhone}</div>
      <div style="color: #666; font-size: 13px;">${ride.customerEmail}</div>
    </div>

    <div style="text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
      <p style="margin: 0;">Comfort Transfer Services Admin</p>
    </div>
  </div>
</body>
</html>
  `;
};

export const sendCancellationNotification = async (ride: Ride): Promise<void> => {
  if (!isEmailEnabled()) return;

  const rawLang = ride.customerLanguage || 'el';
  const lang = (cancellationTranslations[rawLang as SupportedLanguage] ? rawLang : 'el') as SupportedLanguage;
  const ct = cancellationTranslations[lang];
  const fromAddr = `"Comfort Transfer Services" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`;

  // Send to customer
  sendEmail({
    from: fromAddr,
    to: ride.customerEmail,
    subject: ct.subject,
    text: `${ct.title}\n\n${ct.message}\n\n${ride.pickup.address} → ${ride.dropoff.address}\n\nComfort Transfer Services`,
    html: getCancellationCustomerHTML(ride),
    type: 'cancellation_customer',
    rideId: String(ride._id),
  }).catch((error) => {
    logger.error('Failed to send cancellation email to customer:', error);
  });

  // Send to admin
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    sendEmail({
      from: fromAddr,
      to: adminEmail,
      subject: `Ακύρωση Κράτησης — ${ride.customerName}`,
      text: `Ακύρωση Κράτησης\n\nΟ πελάτης ${ride.customerName} ακύρωσε την κράτησή του.\n${ride.pickup.address} → ${ride.dropoff.address}\nΤηλ: ${ride.customerPhone}\nEmail: ${ride.customerEmail}\n\nComfort Transfer Services Admin`,
      html: getCancellationAdminHTML(ride),
      type: 'cancellation_admin',
      rideId: String(ride._id),
    }).catch((error) => {
      logger.error('Failed to send cancellation email to admin:', error);
    });
  }
};

export const sendRideStatusUpdate = async (
  ride: Ride,
  statusMessage: string
): Promise<void> => {
  if (!isEmailEnabled()) {
    logger.warn('Email service not configured - skipping status update email');
    return;
  }

  try {
    await sendEmail({
      from: `"Comfort Transfer Services" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: ride.customerEmail,
      subject: `Ενημέρωση Κράτησης`,
      type: 'status_update',
      rideId: String(ride._id),
      text: `
Comfort Transfer Services - Ενημέρωση Κράτησης

${statusMessage}

Comfort Transfer Services
      `,
      html: `
<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 500px; margin: 0 auto; padding: 20px;">
  <div style="background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 24px;">
    <div style="text-align: center; border-bottom: 1px solid #eee; padding-bottom: 16px; margin-bottom: 20px;">
      <h1 style="color: #0ea5e9; margin: 0; font-size: 20px;">Comfort Transfer Services</h1>
    </div>
    <div style="padding: 16px; background: #f9fafb; border-radius: 6px;">
      <p style="margin: 0;">${statusMessage}</p>
    </div>
    <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
      <p style="margin: 0;">Comfort Transfer Services</p>
    </div>
  </div>
</body>
</html>
      `,
    });
    logger.success('Status update email sent');
  } catch (error) {
    logger.error('Failed to send status update email:', error);
  }
};
