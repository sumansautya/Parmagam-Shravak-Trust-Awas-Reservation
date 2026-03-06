/**
 * email.js — EmailJS Integration for Room Allocation Notifications
 * Parmagam Shravak Trust Awas Reservation System
 *
 * SETUP:
 * 1. Sign up at https://www.emailjs.com (free tier: 200 emails/month)
 * 2. Create an Email Service (Gmail recommended)
 * 3. Create an Email Template using the template below
 * 4. Replace the IDs below with your actual values
 */

const EMAIL_CONFIG = {
  SERVICE_ID:  'YOUR_EMAILJS_SERVICE_ID',   // e.g. 'service_abc123'
  TEMPLATE_ID: 'YOUR_EMAILJS_TEMPLATE_ID',  // e.g. 'template_xyz789'
  PUBLIC_KEY:  'YOUR_EMAILJS_PUBLIC_KEY'    // e.g. 'abcDEFghiJKL'
};

/**
 * Send room allocation confirmation email to visitor
 * @param {Object} reservationData - Full reservation details
 * @param {Array}  members         - All members array
 * @param {string} allocatedRooms  - Room numbers allocated
 */
async function sendAllocationEmail(reservationData, members, allocatedRooms) {
  try {
    // Build member table text
    const memberRows = members.map((m, i) =>
      `${i + 1}. ${m.name} | ${m.gender} | Age: ${m.age} | ${i === 0 ? 'Primary Visitor' : m.relation}`
    ).join('\n');

    // Count demographics
    const male   = members.filter(m => m.gender === 'Male').length;
    const female = members.filter(m => m.gender === 'Female').length;
    const children = members.filter(m => parseInt(m.age) < 18).length;
    const seniors  = members.filter(m => parseInt(m.age) >= 60).length;
    const seniorMale   = members.filter(m => parseInt(m.age) >= 60 && m.gender === 'Male').length;
    const seniorFemale = members.filter(m => parseInt(m.age) >= 60 && m.gender === 'Female').length;

    const templateParams = {
      to_name:         reservationData.fullName,
      to_email:        reservationData.email,
      reservation_id:  reservationData.id,
      check_in:        formatDate(reservationData.checkIn),
      check_out:       formatDate(reservationData.checkOut),
      total_nights:    reservationData.totalNights,
      allocated_rooms: allocatedRooms,
      member_list:     memberRows,
      total_members:   members.length,
      male_count:      male,
      female_count:    female,
      children_count:  children,
      senior_count:    seniors,
      senior_male:     seniorMale,
      senior_female:   seniorFemale,
      need_transport:  reservationData.needTransport,
      need_pooja:      reservationData.needPooja,
      trust_mobile1:   '8887417076',
      trust_mobile2:   '7987164958'
    };

    await emailjs.send(
      EMAIL_CONFIG.SERVICE_ID,
      EMAIL_CONFIG.TEMPLATE_ID,
      templateParams,
      EMAIL_CONFIG.PUBLIC_KEY
    );

    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

/* ══════════════════════════════════════════════════════
   EMAILJS TEMPLATE (create at emailjs.com)
   Subject: Room Confirmed — Shri Parmagam Shravak Trust

   🕉 ॐ नमः सिद्धेभ्यः 🕉

   Dear {{to_name}},

   Jai Jinendra! Your room reservation at Shri Kund Kund Nagar, Sonagir has been CONFIRMED.

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━
   RESERVATION ID: {{reservation_id}}
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Check-In  : {{check_in}}
   Check-Out : {{check_out}}
   Nights    : {{total_nights}}
   Room(s)   : {{allocated_rooms}}
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MEMBER DETAILS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━
   {{member_list}}

   Total Members  : {{total_members}}
   Male           : {{male_count}}
   Female         : {{female_count}}
   Children (<18) : {{children_count}}
   Senior Citizens: {{senior_count}} (Male: {{senior_male}}, Female: {{senior_female}})
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Transport Required : {{need_transport}}
   Pooja Arrangement  : {{need_pooja}}
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━

   For queries, please contact:
   📞 {{trust_mobile1}} / {{trust_mobile2}}

   Shri Parmagam Shravak Trust
   Shri Kund Kund Nagar, Sonagir — 473885
   District Datia, Madhya Pradesh

   🕉 Jai Jinendra 🕉
   ══════════════════════════════════════════════════════ */
