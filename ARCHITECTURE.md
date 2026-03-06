# 🕉 Parmagam Shravak Trust — Awas Reservation System
## Project Architecture Plan

---

## 📁 Project Structure

```
parmagam/
├── index.html               ← Visitor Reservation Form (Public)
├── review.html              ← Reservation Review & Confirm Screen
├── success.html             ← Submission Success Page
├── admin/
│   ├── index.html           ← Admin Login
│   └── dashboard.html       ← Full Admin Dashboard
├── css/
│   └── style.css            ← Shared styles
├── js/
│   ├── form.js              ← Form logic, validation, multi-step
│   ├── sheets.js            ← Google Sheets API integration
│   ├── email.js             ← EmailJS integration (auto-email)
│   └── dashboard.js         ← Admin dashboard logic
└── ARCHITECTURE.md          ← This file
```

---

## 🔧 Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | HTML5 + CSS3 + Vanilla JS | GitHub Pages compatible, no build step |
| Data Storage | Google Sheets (via API) | As requested, easy management |
| Email | EmailJS | Free, no backend needed |
| Hosting | GitHub Pages | Free, reliable |
| Admin Auth | Password-based (localStorage) | Simple operator access |
| QR/UPI | Static image embed | As per document |

---

## 📋 Google Sheets Structure

### Sheet 1: `Reservations`
| Column | Field |
|---|---|
| A | Submission ID (auto) |
| B | Submission Timestamp |
| C | Full Name |
| D | Address |
| E | City/Town |
| F | State |
| G | Mobile |
| H | Email |
| I | Aadhaar/PAN |
| J | Gender |
| K | Age |
| L | Occupation |
| M | Organization |
| N | Check-In Date |
| O | Check-Out Date |
| P | Total Nights |
| Q | AC Rooms Requested |
| R | Non-AC Rooms Requested |
| S | Guest House Rooms Requested |
| T | Transport Mode |
| U | Need Transport (Y/N) |
| V | Need Pooja (Y/N) |
| W | Additional Requirements |
| X | Payment Amount |
| Y | Payment Screenshot URL |
| Z | Status (Pending/Confirmed/Cancelled) |
| AA | Allocated Room Numbers |
| AB | Allocation Date |
| AC | Notification Email Sent (Y/N) |

### Sheet 2: `Members`
| Column | Field |
|---|---|
| A | Submission ID (link to Reservations) |
| B | Member Name |
| C | Gender |
| D | Age |
| E | Relation |
| F | Aadhaar |
| G | Mobile |
| H | Is Primary Visitor (Y/N) |

### Sheet 3: `Rooms`
| Column | Field |
|---|---|
| A | Room ID |
| B | Room Number |
| C | Category (AC/Non-AC/Guest House) |
| D | Rate per Night |
| E | Status (Available/Occupied/Maintenance) |
| F | Current Reservation ID |

---

## 🔄 Workflow

```
Visitor fills Form (index.html)
    ↓
Review Screen (review.html)
    ↓
Submit → Google Sheets (Reservations + Members)
    ↓
Success Page (success.html)
    ↓
Admin Dashboard → Allocate Room
    ↓
Auto Email sent to Visitor (EmailJS)
    ↓
Reports generated from Sheets data
```

---

## 🖥 Admin Dashboard Modules

1. **Overview Cards** — Today's arrivals, departures, occupancy %, pending requests
2. **Room Management** — Add/Edit/Delete rooms, set category & rates
3. **Reservations List** — View all, filter by status/date, allocate rooms
4. **Room Allocation** — Assign room → trigger auto email
5. **Daily Reports** — Arrivals, Departures, Occupancy
6. **Monthly/YTD Reports** — Occupancy trends, revenue
7. **Transport Report** — Daily/Upcoming/Monthly
8. **Pooja Report** — Daily/Upcoming/Monthly
9. **Devotee History** — Search by name/mobile/date
10. **Member Demographics** — Male/Female/Children/Senior counts

---

## 🔐 Security Notes

- Admin dashboard protected by password (configurable in js/dashboard.js)
- Google Sheets API key restricted to domain
- Payment screenshots stored in Google Drive (linked in Sheets)
- Aadhaar/PAN shown masked in public forms

---

## 🚀 GitHub Pages Deployment

1. Push all files to GitHub repository
2. Enable GitHub Pages from Settings → Pages → main branch
3. Set Google Sheets API credentials in js/sheets.js
4. Set EmailJS credentials in js/email.js
5. Set admin password in js/dashboard.js

---

## 📧 Auto Email Template (on Room Allocation)

```
Subject: Room Allocation Confirmed — Shri Parmagam Shravak Trust, Sonagir

🕉 ॐ नमः सिद्धेभ्यः 🕉

Dear [Visitor Name],

Your room reservation at Shri Kund Kund Nagar, Sonagir has been confirmed.

━━━━━━━━━━━━━━━━━━━━━━━━
RESERVATION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━
Check-In  : [Date]
Check-Out : [Date]
Nights    : [N]
Room(s)   : [Room Numbers & Category]

MEMBER DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━
[Member list with Name, Gender, Age, Relation]

Total Members : [N]
Male          : [N]
Female        : [N]
Children      : [N]
Senior Citizens: [N]

For queries: 8887417076 / 7987164958
━━━━━━━━━━━━━━━━━━━━━━━━
Shri Parmagam Shravak Trust
Shri Kund Kund Nagar, Sonagir — 473885
District Datia, Madhya Pradesh
```

---

## 🔮 Future Enhancements (Provision Kept)

- Online payment gateway integration (Razorpay)
- WhatsApp notification via Twilio/WATI
- Multi-language toggle (Hindi/English)
- Visitor mobile app (React Native)
- QR code check-in at reception
- Automated cancellation & waitlist
- Room photo gallery for selection
