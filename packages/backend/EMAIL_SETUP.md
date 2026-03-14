# Email Configuration για Comfort Transfer Services

## Περιγραφή

Το σύστημα στέλνει αυτόματα email επιβεβαίωσης στους πελάτες μετά από κάθε κράτηση.

## Ρύθμιση Email (Προαιρετική)

Αν ΔΕΝ ρυθμίσεις email, το σύστημα θα λειτουργεί κανονικά αλλά δεν θα στέλνονται emails.

### Gmail Setup (Προτεινόμενο)

1. Ενεργοποίησε **2-Step Verification** στο Google Account σου
2. Δημιούργησε ένα **App Password**:
   - Πήγαινε στο https://myaccount.google.com/apppasswords
   - Επίλεξε "Mail" και "Other"
   - Αντίγραψε το password που δημιουργήθηκε

3. Πρόσθεσε στο `.env` file:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here
EMAIL_FROM=Comfort Transfer Services <your_email@gmail.com>
```

### Άλλοι Email Providers

#### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@outlook.com
EMAIL_PASSWORD=your_password
```

#### Yahoo
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your_email@yahoo.com
EMAIL_PASSWORD=your_app_password
```

#### Custom SMTP Server
```env
EMAIL_HOST=smtp.yourserver.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_smtp_username
EMAIL_PASSWORD=your_smtp_password
EMAIL_FROM=noreply@crete-taxivan.gr
```

## Email Templates

### 1. Booking Confirmation
Στέλνεται αυτόματα μετά από κάθε επιτυχημένη κράτηση.

**Περιεχόμενο:**
- Αριθμός κράτησης
- Διαδρομή (pickup → dropoff)
- Στοιχεία επικοινωνίας
- Κατάσταση κράτησης
- Επόμενα βήματα

### 2. Status Updates (Μελλοντικά)
Θα στέλνονται όταν αλλάζει η κατάσταση του ταξιδιού:
- Οδηγός ανατέθηκε
- Οδηγός έφτασε
- Ταξίδι ξεκίνησε
- Ταξίδι ολοκληρώθηκε

## Testing

### Local Testing με Ethereal (Development)

Αν δεν έχεις πραγματικό email account για testing:

1. Πήγαινε στο https://ethereal.email
2. Δημιούργησε ένα test account
3. Χρησιμοποίησε τα credentials στο `.env`:
```env
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=ethereal_username
EMAIL_PASSWORD=ethereal_password
```

Τα emails θα εμφανίζονται στο Ethereal inbox, όχι σε πραγματικά mailboxes.

## Troubleshooting

### Email δεν στέλνεται

1. **Έλεγξε τα credentials:**
   ```bash
   # Στο backend console θα δεις:
   ⚠️  Email credentials not configured. Email notifications disabled.
   ```

2. **Έλεγξε το App Password (Gmail):**
   - Βεβαιώσου ότι χρησιμοποιείς App Password, όχι το κανονικό password
   - Το App Password είναι 16 χαρακτήρες χωρίς κενά

3. **Έλεγξε το port και security:**
   - Port 587: `EMAIL_SECURE=false`
   - Port 465: `EMAIL_SECURE=true`

4. **Firewall/Antivirus:**
   - Μερικά antivirus μπλοκάρουν SMTP connections
   - Δοκίμασε να απενεργοποιήσεις προσωρινά

### Email πηγαίνει στο Spam

1. Χρησιμοποίησε verified domain στο `EMAIL_FROM`
2. Για production, χρησιμοποίησε dedicated email service (SendGrid, Mailgun, AWS SES)

## Production Best Practices

Για production περιβάλλον, προτείνεται να χρησιμοποιήσεις:

1. **SendGrid** (12,000 free emails/month)
2. **Mailgun** (5,000 free emails/month)
3. **AWS SES** (62,000 free emails/month αν είσαι στο AWS)

Αυτά τα services προσφέρουν:
- Καλύτερη deliverability
- Email analytics
- Template management
- Μαζική αποστολή

## Code Reference

- **Email Service**: `src/services/email.service.ts`
- **Integration**: `src/services/ride.service.ts` (createRide function)
- **Templates**: HTML + Plain text versions included

## Disable Emails

Αν θέλεις να απενεργοποιήσεις εντελώς τα emails:

1. Απλά μην ορίσεις τα `EMAIL_USER` και `EMAIL_PASSWORD` στο `.env`
2. Ή σβήσε αυτές τις γραμμές από το `.env` file

Το σύστημα θα λειτουργεί κανονικά χωρίς να στέλνει emails.
