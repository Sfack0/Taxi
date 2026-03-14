# Comfort Transfer Services - Admin System 👑

## Περιγραφή

Το σύστημα έχει τώρα **2 εκδόσεις**:

### 1. **Εκδοχή Πελάτη** (Public)
- Κράτηση χωρίς login
- 3-step booking flow
- Email επιβεβαίωση
- Track ride με ride number

### 2. **Εκδοχή Ιδιοκτήτη** (Admin Dashboard)
- Σύνδεση με admin email
- Προβολή **όλων** των κρατήσεων
- Αποδοχή/Απόρριψη κρατήσεων
- Φίλτρα και στατιστικά

---

## 🔐 Πώς Γίνεσαι Admin

Υπάρχουν **2 τρόποι** να αναγνωριστείς ως admin:

### Τρόπος 1: Email Matching (Ενεργό τώρα)
Αν το email σου είναι: **`giannis2001.gs@gmail.com`**
- Κάνε login με αυτό το email
- Αυτόματα θα έχεις admin πρόσβαση

### Τρόπος 2: Admin Role στη βάση
Αν το `role` field στο User model είναι `'admin'`
- Θα έχεις admin πρόσβαση ανεξάρτητα από email

---

## 📋 Πώς να Χρησιμοποιήσεις το Admin Dashboard

### Βήμα 1: Σύνδεση
1. Πήγαινε στο http://localhost:5173
2. Πάτα "Σύνδεση"
3. Συνδέσου με το email ιδιοκτήτη: `giannis2001.gs@gmail.com`

**ΑΝ ΔΕΝ ΕΧΕΙΣ ΛΟΓΑΡΙΑΣΜΟ:**
1. Κάνε Register με το `giannis2001.gs@gmail.com`
2. Βάλε όνομα, password, τηλέφωνο
3. Login

### Βήμα 2: Πρόσβαση στο Dashboard
Μόλις συνδεθείς:
- Θα δεις στο header: "Γεια σου, Όνομά σου! 👑"
- Κουμπί: "🎛️ Admin Dashboard" (πορτοκαλί χρώμα)
- Πάτα το για να μπεις στο dashboard

### Βήμα 3: Διαχείριση Κρατήσεων

**Φίλτρα:**
- Όλες
- ΥΠΟ ΕΠΕΞΕΡΓΑΣΙΑ (pending)
- ΑΠΟΔΕΚΤΗ (accepted)
- ΑΚΥΡΩΜΕΝΗ (cancelled)
- ΟΛΟΚΛΗΡΩΜΕΝΗ (completed)

**Στατιστικά:**
- Σύνολο Κρατήσεων
- Υπό Επεξεργασία
- Αποδεκτές
- Ακυρωμένες

**Κάθε Κράτηση Δείχνει:**
- Αριθμός κράτησης (π.χ. ER-2026-000001)
- Κατάσταση (με χρωματιστό badge)
- Διαδρομή (από → προς)
- Στοιχεία πελάτη (όνομα, τηλέφωνο clickable, email clickable)
- Ημερομηνία/ώρα

**Ενέργειες (μόνο για PENDING κρατήσεις):**
- ✅ **Αποδοχή** → Αλλάζει status σε "accepted"
- ❌ **Απόρριψη** → Ζητάει λόγο, αλλάζει status σε "cancelled"

---

## 🔄 Ροή Κράτησης

### Για τον Πελάτη:
1. Ανοίγει http://localhost:5173
2. Πατάει "Κλείσε Διαδρομή"
3. Συμπληρώνει: Pickup → Dropoff → Στοιχεία
4. Επιβεβαιώνει κράτηση
5. Λαμβάνει **2 emails**:
   - Email επιβεβαίωσης στο email του
   - (Ιδιοκτήτης λαμβάνει admin notification)

### Για τον Ιδιοκτήτη (εσένα):
1. Λαμβάνεις email: "🔔 Νέα Κράτηση - ER-2026-XXXXXX"
2. Μπαίνεις στο Admin Dashboard
3. Βλέπεις τη νέα κράτηση με status "ΥΠΟ ΕΠΕΞΕΡΓΑΣΙΑ"
4. **Επιλογές:**
   - ✅ **Αποδοχή:** Η κράτηση γίνεται "ΑΠΟΔΕΚΤΗ"
   - ❌ **Απόρριψη:** Η κράτηση γίνεται "ΑΚΥΡΩΜΕΝΗ"

---

## 🛠️ Backend API Endpoints

### Admin Endpoints (Απαιτούν Authentication + Admin Role)

#### 1. GET /api/v1/rides/admin/all
**Περιγραφή:** Φέρνει όλες τις κρατήσεις (για admin)

**Query Params:**
- `status` - φίλτρο (pending, accepted, cancelled, completed)
- `page` - σελίδα (default: 1)
- `limit` - όριο ανά σελίδα (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "rides": {
      "items": [...],
      "total": 100,
      "page": 1,
      "limit": 20,
      "totalPages": 5
    }
  }
}
```

#### 2. PATCH /api/v1/rides/:id/accept
**Περιγραφή:** Αποδοχή κράτησης

**Response:**
```json
{
  "success": true,
  "data": {
    "ride": { ...ride με status "accepted" }
  }
}
```

#### 3. PATCH /api/v1/rides/:id/reject
**Περιγραφή:** Απόρριψη κράτησης

**Body:**
```json
{
  "reason": "Δεν υπάρχουν διαθέσιμοι οδηγοί" // προαιρετικό
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ride": { ...ride με status "cancelled" }
  }
}
```

---

## 🎨 UI Features

### Admin Dashboard
- **Χρώματα Theme:** Πορτοκαλί/Amber (διαφορετικό από το customer blue)
- **Header:** Logo + Admin Dashboard title + Όνομα admin + Κουμπιά
- **Φίλτρα:** Tabs για εύκολη πλοήγηση
- **Cards:** Κάθε κράτηση σε ξεχωριστό card
- **Responsive:** Λειτουργεί σε mobile και desktop
- **Loading States:** Spinner κατά τη φόρτωση
- **Real-time Updates:** Reload μετά από κάθε action

### Home Page (για Admin)
- **Διακριτικό:** 👑 emoji δίπλα στο όνομα
- **Ειδικό Κουμπί:** "🎛️ Admin Dashboard" (πορτοκαλί)
- **Αντί για "Οι Διαδρομές μου"** → "Admin Dashboard"

---

## 📁 Νέα Αρχεία

### Backend
```
packages/backend/src/
├── middleware/
│   └── admin.middleware.ts         # Admin authentication check
├── services/
│   └── ride.service.ts             # Updated με getAllRides, acceptRide, rejectRide
└── controllers/
    └── ride.controller.ts          # Updated με admin endpoints
```

### Frontend
```
packages/frontend/src/
├── pages/
│   ├── AdminDashboard.tsx         # Admin dashboard page
│   └── Home.tsx                   # Updated για admin check
├── services/
│   └── admin.service.ts           # Admin API calls
└── App.tsx                        # Updated με /admin route
```

---

## ✅ Checklist Δοκιμής

### Test 1: Admin Access
- [ ] Register/Login με `giannis2001.gs@gmail.com`
- [ ] Δες 👑 στο header
- [ ] Πάτα "Admin Dashboard"
- [ ] Δες το dashboard να φορτώνει

### Test 2: Guest Booking
- [ ] Logout (αν είσαι logged in)
- [ ] Κάνε νέα κράτηση ως guest
- [ ] Έλεγξε email επιβεβαίωσης (στο email πελάτη)
- [ ] Έλεγξε admin notification (στο `giannis2001.gs@gmail.com`)

### Test 3: Admin Actions
- [ ] Login ως admin
- [ ] Μπες στο Admin Dashboard
- [ ] Δες τη νέα κράτηση με status "ΥΠΟ ΕΠΕΞΕΡΓΑΣΙΑ"
- [ ] Πάτα "✅ Αποδοχή"
- [ ] Δες το status να αλλάζει σε "ΑΠΟΔΕΚΤΗ"
- [ ] Φτιάξε άλλη κράτηση
- [ ] Πάτα "❌ Απόρριψη"
- [ ] Βάλε λόγο απόρριψης
- [ ] Δες το status να αλλάζει σε "ΑΚΥΡΩΜΕΝΗ"

### Test 4: Filters
- [ ] Πάτα "Υπό Επεξεργασία" filter
- [ ] Δες μόνο pending rides
- [ ] Πάτα "Αποδεκτές" filter
- [ ] Δες μόνο accepted rides
- [ ] Πάτα "Όλες"
- [ ] Δες όλες τις κρατήσεις

---

## 🔒 Security Features

1. **Role-based Access Control:**
   - Μόνο admin μπορεί να δει το `/admin` endpoint
   - Middleware check: `isAdmin`

2. **Email Matching:**
   - Hardcoded admin email: `giannis2001.gs@gmail.com`
   - Configurable via `ADMIN_EMAIL` στο .env

3. **Authentication Required:**
   - Όλα τα admin endpoints απαιτούν login
   - Χρήση JWT tokens

4. **Action Validation:**
   - Μόνο "pending" rides μπορούν να γίνουν accept/reject
   - Server-side validation

---

## 🚀 Επόμενα Βήματα (Μελλοντικά)

### Features που μπορείς να προσθέσεις:

1. **Driver Assignment:**
   - Dropdown για επιλογή οδηγού
   - Assign driver στην κράτηση

2. **SMS Notifications:**
   - Στείλε SMS στον πελάτη όταν γίνεται accept/reject
   - Twilio/Vonage integration

3. **Real-time Updates:**
   - WebSockets για live updates
   - Νέα κράτηση → instant notification

4. **Advanced Filters:**
   - Date range
   - Search by customer name/phone
   - Sort by date/status

5. **Bulk Actions:**
   - Accept multiple rides
   - Export to CSV

6. **Admin Analytics:**
   - Charts & graphs
   - Revenue tracking
   - Popular routes

---

## 💡 Tips

1. **Πολλαπλοί Admins:**
   Για να προσθέσεις άλλους admins:
   - Άλλαξε το `role` field στη MongoDB σε `'admin'`
   - Ή πρόσθεσε τα emails τους στο admin check

2. **Testing:**
   Χρησιμοποίησε 2 browsers:
   - Browser 1: Admin dashboard
   - Browser 2: Guest booking
   Κάνε booking στο Browser 2, refresh στο Browser 1

3. **Email Configuration:**
   Βεβαιώσου ότι `ADMIN_EMAIL=giannis2001.gs@gmail.com` στο .env

---

**Τελευταία Ενημέρωση:** 2026-01-03
**Version:** 2.0.0 - Admin System
