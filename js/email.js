/**
 * email.js — EmailJS Auto Email on Room Allocation
 * Parmagam Shravak Trust Awas Reservation System
 * v2 — Complete working integration
 *
 * ══════════════════════════════════════════════════
 * SETUP STEPS (done once):
 * 1. Go to https://www.emailjs.com — Sign up FREE
 * 2. Add Email Service → Connect your Gmail account
 *    → Copy the Service ID (e.g. service_abc123)
 * 3. Create Email Template → Use the template below
 *    → Copy the Template ID (e.g. template_xyz789)
 * 4. Go to Account → Copy your Public Key
 * 5. Replace the 3 values below with your actual IDs
 * ══════════════════════════════════════════════════
 */

const EMAILJS_CONFIG = {
  SERVICE_ID:  'service_dmb76ea',    // e.g. 'service_abc123'
  TEMPLATE_ID: 'template_5olugzd',   // e.g. 'template_xyz789'
  PUBLIC_KEY:  'Ef1ryuGyNj8sEMFOc'     // e.g. 'aBcDeFgHiJkLmNoP'
};

/**
 * Send room allocation confirmation email to visitor
 * Called from dashboard after admin allocates a room
 *
 * @param {Object} r             - Reservation object from Google Sheets
 * @param {Array}  members       - Members array for this reservation
 * @param {string} allocatedRooms - Room numbers allocated (e.g. "101, 102")
 * @returns {Promise<{success: boolean}>}
 */
async function sendAllocationEmail(r, members, allocatedRooms) {
  try {
    // Build member list text
    const memberLines = members.map((m, i) => {
      const tag = (i === 0) ? '★ Primary Visitor' : m.relation || '';
      return `${i+1}. ${m.name}  |  ${m.gender}  |  Age: ${m.age}  |  ${tag}`;
    }).join('\n');

    // Demographic counts
    const total    = members.length;
    const male     = members.filter(m => m.gender === 'Male' || m.Gender === 'Male').length;
    const female   = members.filter(m => m.gender === 'Female' || m.Gender === 'Female').length;
    const children = members.filter(m => parseInt(m.age || m.Age) < 18).length;
    const seniors  = members.filter(m => parseInt(m.age || m.Age) >= 60).length;
    const snrM     = members.filter(m => parseInt(m.age || m.Age) >= 60 && (m.gender === 'Male' || m.Gender === 'Male')).length;
    const snrF     = members.filter(m => parseInt(m.age || m.Age) >= 60 && (m.gender === 'Female' || m.Gender === 'Female')).length;

    // Room details for email
    const rooms = [];
    if (parseInt(r.acRooms || r['AC Rooms']) > 0)         rooms.push(`❄️ AC Room × ${r.acRooms || r['AC Rooms']} (₹1,200/night)`);
    if (parseInt(r.nonAcRooms || r['Non-AC Rooms']) > 0)  rooms.push(`🌬️ Non-AC Room × ${r.nonAcRooms || r['Non-AC Rooms']} (₹700/night)`);
    if (parseInt(r.guestHouseRooms || r['GH Rooms']) > 0) rooms.push(`🏡 Guest House × ${r.guestHouseRooms || r['GH Rooms']} (₹2,000/night)`);

    const templateParams = {
      // Visitor details
      to_name:          r.fullName   || r['Full Name']   || '',
      to_email:         r.email      || r['Email']        || '',
      visitor_mobile:   r.mobile     || r['Mobile']       || '',
      visitor_city:     r.city       || r['City']         || '',
      visitor_state:    r.state      || r['State']        || '',

      // Reservation details
      reservation_id:   r.id         || r['ID']           || '',
      check_in:         formatDateLong(r.checkIn  || r['Check-In']  || ''),
      check_out:        formatDateLong(r.checkOut || r['Check-Out'] || ''),
      total_nights:     r.totalNights || r['Nights']      || '',
      rooms_requested:  rooms.join('\n') || 'As requested',
      allocated_rooms:  allocatedRooms,
      allocation_date:  formatDateLong(new Date().toISOString().split('T')[0]),

      // Member details
      member_list:      memberLines,
      total_members:    total,
      male_count:       male,
      female_count:     female,
      children_count:   children,
      senior_count:     seniors,
      senior_male:      snrM,
      senior_female:    snrF,

      // Requirements
      need_transport:   r.needTransport || r['Need Transport'] || 'No',
      need_pooja:       r.needPooja     || r['Need Pooja']     || 'No',
      additional_req:   r.additionalRequirements || r['Additional Req'] || 'None',

      // Trust contact
      trust_mobile1:    '8887417076',
      trust_mobile2:    '7987164958',
      trust_address:    'Shri Kund Kund Nagar, Pichorkhed, Sonagir — 473885, Dist. Datia (M.P.)'
    };

    // Initialize EmailJS with public key
    emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);

    await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams
    );

    return { success: true };
  } catch (error) {
    console.error('sendAllocationEmail error:', error);
    return { success: false, error: error.message };
  }
}

function formatDateLong(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
  } catch(e) { return dateStr; }
}

/* ════════════════════════════════════════════════════════════════
   EMAILJS TEMPLATE — Copy this exactly into your EmailJS template
   ════════════════════════════════════════════════════════════════

   SUBJECT LINE:
   ✅ Room Confirmed — Ref {{reservation_id}} — Shri Parmagam Shravak Trust

   EMAIL BODY (plain text or HTML — both work):

🕉 ॐ नमः सिद्धेभ्यः 🕉

Dear {{to_name}},

Jai Jinendra! 🙏

Your room reservation at Shri Kund Kund Nagar, Sonagir has been
CONFIRMED. Please find your complete booking details below.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESERVATION CONFIRMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reference ID    : {{reservation_id}}
Allocated Room(s): {{allocated_rooms}}
Confirmation Date: {{allocation_date}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STAY DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Check-In  : {{check_in}}
Check-Out : {{check_out}}
Nights    : {{total_nights}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MEMBER DETAILS ({{total_members}} Members)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{member_list}}

Summary:
  Total Members  : {{total_members}}
  Male           : {{male_count}}
  Female         : {{female_count}}
  Children (<18) : {{children_count}}
  Senior Citizens: {{senior_count}} (Male: {{senior_male}}, Female: {{senior_female}})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ARRANGEMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Transport Required  : {{need_transport}}
Pooja Arrangement   : {{need_pooja}}
Additional Requests : {{additional_req}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
For any queries, please contact us:
📞 {{trust_mobile1}} / {{trust_mobile2}}

Shri Parmagam Shravak Trust
{{trust_address}}

🕉 Jai Jinendra — Safe Journey! 🕉
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ════════════════════════════════════════════════════════════════ */
