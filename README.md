# ☪️ My Amal — আমার আমল ট্র্যাকার

> A full-featured Islamic Daily Amal Tracker built with MERN Stack + MVC Architecture

**Developed by:** Zahid Hasan • 01745940065  
**Version:** 1.0.0

---

## 📦 Features

### 🏠 Dashboard
- আমলের সার্বিক রিপোর্ট ও statistics
- Daily streak badge 🔥
- আজকের নামাজের status
- নামাজের ধারাবাহিকতার progress bar
- আসন্ন রোজার দিন (Sunnah + Ayyam al-Beed)
- Hijri date প্রদর্শন

### ✏️ Amal Post
- ৫ ওয়াক্ত ফরয নামাজ (checkbox)
- নফল ইবাদত: তাহাজ্জুদ, সকালের দোয়া, তওবা, সন্ধ্যার দোয়া
- কুরআন তেলাওয়াত (পৃষ্ঠা + আয়াত)
- যিকির counter
- রোজা tracker (সোম/বৃহস্পতি/আইয়্যামুল বীয/অন্যান্য)
- সাদাকাহ tracker (পরিমাণ সহ)
- খাবারের মান (Low/Medium/High)
- ঘুমের সময় (মিনিটে)
- অসীমিত নোট
- একই তারিখে দুইবার save হয় না (auto-detect + update)

### 📋 Amal View
- সব record তারিখ অনুযায়ী দেখুন
- Filter: Start Date, End Date, Month, Year
- Search: তারিখ বা নোট দিয়ে খুঁজুন
- PDF ও Excel export (সব data বা নির্দিষ্ট record)
- Per-record detail modal
- Delete option

### 📊 Amal Analytics
- Weekly progress line chart
- Namaz consistency doughnut chart
- Activity heatmap calendar
- কুরআন তেলাওয়াত bar chart
- ঘুমের pattern line chart
- নামাজ সংখ্যা bar chart
- Monthly trend chart
- Period filter: ৭ দিন / মাস / বছর

### ⚙️ Settings
- Light / Dark mode toggle
- পাসওয়ার্ড পরিবর্তন
- Reminder time সেটিংস (প্রতিটি আমলের জন্য)
- JSON Export (full backup)
- JSON Import (restore)
- App info & developer credits

### 🛡️ Admin Panel (Admin only)
- সকল users দেখুন (stats সহ)
- User ban / unban (কারণ সহ)
- User delete (সব data সহ)
- User এর আমল data দেখুন
- Platform-wide statistics

### 🌙 Fasting System
- সোম ও বৃহস্পতির সুন্নাহ রোজা
- আইয়্যামুল বীয: ১৩, ১৪, ১৫ হিজরী
- ২ দিন আগে notification/alert
- Dashboard এ upcoming fasting days

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 বা তার বেশি)
- MongoDB (local অথবা MongoDB Atlas)
- npm

### Step 1: MongoDB Setup
**Option A: Local MongoDB**
```bash
# MongoDB install করুন এবং চালু করুন
mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. https://cloud.mongodb.com তে account করুন
2. Cluster তৈরি করুন
3. Connection string নিন

### Step 2: Backend Setup
```bash
cd backend

# Dependencies install
npm install

# .env file তৈরি করুন
cp .env.example .env
```

**.env file edit করুন:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/my-amal
JWT_SECRET=your_super_secret_key_minimum_32_chars
JWT_EXPIRE=30d
NODE_ENV=development
```

```bash
# Backend চালু করুন
npm run dev
```

### Step 3: Frontend Setup
```bash
cd frontend

# Dependencies install
npm install

# Frontend চালু করুন
npm start
```

### Step 4: Browser এ Open করুন
```
http://localhost:3000
```

---

## 👤 First User = Admin

- প্রথম যে account register করবেন সে **Admin** হবে
- বাকি সব user সাধারণ user হবে
- Admin panel: `/admin`

---

## 📁 Project Structure

```
my-amal/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # Login, Register, Password
│   │   ├── amalController.js      # CRUD + Analytics + Export
│   │   ├── adminController.js     # User management
│   │   └── reminderController.js  # Reminder + Fasting dates
│   ├── middleware/
│   │   └── auth.js                # JWT + Admin guard
│   ├── models/
│   │   ├── User.js                # User model
│   │   ├── Amal.js                # Amal model (full)
│   │   └── Reminder.js            # Reminder model
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── amalRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── reminderRoutes.js
│   │   └── settingsRoutes.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   └── common/
    │   │       ├── Layout.js      # Main layout wrapper
    │   │       ├── Sidebar.js     # Navigation sidebar
    │   │       └── Topbar.js      # Top header
    │   ├── context/
    │   │   ├── AuthContext.js     # Auth state management
    │   │   └── ThemeContext.js    # Dark/Light mode
    │   ├── pages/
    │   │   ├── AuthPage.js        # Login + Register
    │   │   ├── Dashboard.js       # Main dashboard
    │   │   ├── AmalPost.js        # Post daily amal
    │   │   ├── AmalView.js        # View + filter + export
    │   │   ├── Analytics.js       # Charts & analytics
    │   │   ├── Settings.js        # Settings page
    │   │   └── Admin.js           # Admin panel
    │   ├── utils/
    │   │   ├── api.js             # Axios config
    │   │   ├── hijri.js           # Hijri date utils
    │   │   └── exportUtils.js     # PDF + Excel + JSON
    │   ├── styles/
    │   │   └── global.css         # Global CSS + themes
    │   ├── App.js                 # Router + providers
    │   └── index.js               # Entry point
    └── package.json
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | নতুন account |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |
| PUT | /api/auth/change-password | Password change |
| GET | /api/amal/dashboard | Dashboard stats |
| GET | /api/amal/analytics | Analytics data |
| GET | /api/amal/check/:date | Date exists? |
| POST | /api/amal | New amal |
| GET | /api/amal | List with filters |
| PUT | /api/amal/:id | Update |
| DELETE | /api/amal/:id | Delete |
| GET | /api/amal/export | Export all |
| POST | /api/amal/import | Import JSON |
| GET | /api/reminder/fasting-upcoming | Upcoming fasting |
| GET | /api/admin/users | All users (admin) |
| PUT | /api/admin/users/:id/ban | Ban user (admin) |
| PUT | /api/admin/users/:id/unban | Unban (admin) |
| DELETE | /api/admin/users/:id | Delete user (admin) |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| State | Context API |
| Charts | Chart.js + react-chartjs-2 |
| HTTP | Axios |
| Export | jsPDF + jspdf-autotable + xlsx |
| Toast | react-hot-toast |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (JSON Web Token) |
| Password | bcryptjs |
| Architecture | MVC Pattern |

---

## 📞 Support

**Developer:** Zahid Hasan  
**Phone:** 01745940065  
**App:** My Amal v1.0.0

---

*বারাকাল্লাহু ফিকুম। আল্লাহ আমাদের সকলের আমল কবুল করুন। আমীন।* 🤲
