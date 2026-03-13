/**
 * sheets.js — Google Sheets Integration
 * Parmagam Shravak Trust Awas Reservation System
 * v3 — Full live data: reservations, members, rooms, allocation, update status
 *
 * ══════════════════════════════════════════════════
 * SETUP: Replace the URL below with YOUR deployed
 * Google Apps Script Web App URL
 * ══════════════════════════════════════════════════
 */

// ══════════════════════════════════════════════════════════
// ⚠️  IMPORTANT: Replace s/AKfycbzEowE3jrQJypFPc5YbjRUaxKR3HIBAsVaF-zAOPU5ybfK8sokmMZy74WDig35L57_1 with your
//     actual deployed Google Apps Script Web App URL
//     Get it from: Apps Script → Deploy → Manage Deployments
//     It looks like: https://script.google.com/macros/s/AKfycbzEowE3jrQJypFPc5YbjRUaxKR3HIBAsVaF-zAOPU5ybfK8sokmMZy74WDig35L57_1/exec
// ══════════════════════════════════════════════════════════
const SHEETS_CONFIG = {
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzEowE3jrQJypFPc5YbjRUaxKR3HIBAsVaF-zAOPU5ybfK8sokmMZy74WDig35L57_1/exec'
};

// ── Submit new reservation (called from review.html) ──
async function submitReservation(formData) {
  try {
    const submissionId = generateId();
    const timestamp    = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const reservation = {
      id:                   submissionId,
      timestamp,
      fullName:             formData.fullName,
      address:              formData.address,
      city:                 formData.city,
      state:                formData.state,
      mobile:               formData.mobile,
      email:                formData.email,
      aadhaarPan:           formData.aadhaarPan || '',
      gender:               formData.gender,
      age:                  formData.age,
      occupation:           formData.occupation,
      organization:         formData.organization || '',
      designation:          formData.designation || '',
      checkIn:              formData.checkIn,
      checkOut:             formData.checkOut,
      totalNights:          formData.totalNights,
      acRooms:              formData.rooms.ac,
      nonAcRooms:           formData.rooms.nonAc,
      guestHouseRooms:      formData.rooms.guestHouse,
      transportMode:        formData.transportMode,
      needTransport:        formData.needTransport,
      needPooja:            formData.needPooja,
      additionalRequirements: formData.additionalRequirements || '',
      paymentAmount:        '',
      status:               'Pending',
      allocatedRooms:       '',
      allocationDate:       '',
      emailSent:            'No'
    };

    const members = (formData.members || []).map((m, i) => ({
      submissionId,
      name:      m.name,
      gender:    m.gender,
      age:       m.age,
      relation:  i === 0 ? 'Self (Primary)' : (m.relation || ''),
      aadhaar:   m.aadhaar || '',
      mobile:    m.mobile || '',
      isPrimary: i === 0 ? 'Yes' : 'No'
    }));

    const payload = JSON.stringify({ action: 'submitReservation', reservation, members });

    // Use POST with text/plain + no-cors (required for Apps Script cross-origin)
    // We encode data as text/plain to avoid CORS preflight
    const response = await fetch(SHEETS_CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: payload,
      mode: 'no-cors'
    });
    // no-cors always returns opaque response — cannot read status
    // Apps Script will save data if URL is correct and script is deployed
    console.log('submitReservation sent. ID:', submissionId);
    console.log('URL used:', SHEETS_CONFIG.APPS_SCRIPT_URL.slice(0,80));

    return { success: true, id: submissionId };
  } catch (error) {
    console.error('submitReservation error:', error);
    return { success: false, error: error.message };
  }
}

// ── Fetch all reservations (Admin Dashboard) ──
async function fetchReservations() {
  try {
    const url = SHEETS_CONFIG.APPS_SCRIPT_URL + '?action=getReservations&t=' + Date.now();
    console.log('Fetching reservations from:', url.slice(0,80) + '...');
    const res  = await fetch(url);
    console.log('Response status:', res.status, res.ok ? '✅' : '❌');
    const text = await res.text();
    console.log('Raw response (first 200):', text.slice(0,200));
    let data;
    try { data = JSON.parse(text); }
    catch(pe) { console.error('JSON parse error:', pe.message); throw new Error('Invalid JSON from Apps Script: ' + text.slice(0,100)); }
    if (data.error) { console.error('Apps Script error:', data.error); }
    return data.reservations || [];
  } catch (e) {
    console.error('fetchReservations error:', e.message);
    throw e;
  }
}

// ── Fetch all members for a reservation ──
async function fetchMembers(submissionId) {
  try {
    const url  = SHEETS_CONFIG.APPS_SCRIPT_URL + '?action=getMembers&id=' + submissionId + '&t=' + Date.now();
    const res  = await fetch(url);
    const data = await res.json();
    return data.members || [];
  } catch (e) {
    console.error('fetchMembers error:', e);
    return [];
  }
}

// ── Fetch all rooms (Admin Dashboard) ──
async function fetchRooms() {
  try {
    const url  = SHEETS_CONFIG.APPS_SCRIPT_URL + '?action=getRooms&t=' + Date.now();
    const res  = await fetch(url);
    const data = await res.json();
    return data.rooms || [];
  } catch (e) {
    console.error('fetchRooms error:', e);
    return [];
  }
}

// ── Save / update a room ──
async function saveRoomToSheet(room) {
  try {
    await fetch(SHEETS_CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'saveRoom', room }),
      mode: 'no-cors'
    });
    return { success: true };
  } catch (e) { return { success: false }; }
}

// ── Delete a room ──
async function deleteRoomFromSheet(roomId) {
  try {
    await fetch(SHEETS_CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'deleteRoom', roomId }),
      mode: 'no-cors'
    });
    return { success: true };
  } catch (e) { return { success: false }; }
}

// ── Allocate room + update status ──
async function allocateRoom(reservationId, roomNumbers) {
  try {
    const allocationDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    await fetch(SHEETS_CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'allocateRoom', reservationId, roomNumbers, allocationDate }),
      mode: 'no-cors'
    });
    return { success: true };
  } catch (e) { return { success: false }; }
}

// ── Update reservation status ──
async function updateStatus(reservationId, status) {
  try {
    await fetch(SHEETS_CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'updateStatus', reservationId, status }),
      mode: 'no-cors'
    });
    return { success: true };
  } catch (e) { return { success: false }; }
}

// ── Mark email sent ──
async function markEmailSent(reservationId) {
  try {
    await fetch(SHEETS_CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'markEmailSent', reservationId }),
      mode: 'no-cors'
    });
    return { success: true };
  } catch (e) { return { success: false }; }
}

// ── Generate unique ID ──
function generateId() {
  const d    = new Date();
  const date = d.toISOString().slice(0,10).replace(/-/g,'');
  const rand = Math.random().toString(36).substr(2,5).toUpperCase();
  return 'PST-' + date + '-' + rand;
}


/* ════════════════════════════════════════════════════════════════
   GOOGLE APPS SCRIPT — COMPLETE CODE
   ════════════════════════════════════════════════════════════════
   HOW TO DEPLOY:
   1. Open your Google Sheet
   2. Click Extensions → Apps Script
   3. Delete all existing code
   4. Paste the code below (everything between the stars)
   5. Click Save (💾), name project "PST-Reservation"
   6. Click Deploy → New Deployment
   7. Type: Web App
   8. Execute as: Me
   9. Who has access: Anyone
   10. Click Deploy → Authorize → Copy the URL
   11. Paste the URL into APPS_SCRIPT_URL above
   12. Also paste it in admin/dashboard.html where it says s/AKfycbzEowE3jrQJypFPc5YbjRUaxKR3HIBAsVaF-zAOPU5ybfK8sokmMZy74WDig35L57_1

★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

const SS_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doGet(e) {
  const action = e.parameter.action;
  const ss     = SpreadsheetApp.openById(SS_ID);

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {

    if (action === 'getReservations') {
      const sheet = ss.getSheetByName('Reservations');
      const rows  = sheet.getDataRange().getValues();
      if (rows.length <= 1) return ok({reservations:[]});
      const hdrs  = rows[0];
      const reservations = rows.slice(1).map(r => {
        const obj = {};
        hdrs.forEach((h,i) => {
          let v = r[i];
          const hdr = String(h).trim();
          // Convert Date objects or long date strings to YYYY-MM-DD
          if (v instanceof Date) {
            const yr = v.getFullYear();
            const mo = String(v.getMonth()+1).padStart(2,'0');
            const dy = String(v.getDate()).padStart(2,'0');
            v = yr+'-'+mo+'-'+dy;
          } else if (typeof v === 'string' && v.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/)) {
            const d = new Date(v);
            if (!isNaN(d)) {
              const yr = d.getFullYear();
              const mo = String(d.getMonth()+1).padStart(2,'0');
              const dy = String(d.getDate()).padStart(2,'0');
              v = yr+'-'+mo+'-'+dy;
            }
          }
          obj[hdr] = (v !== undefined && v !== null) ? String(v) : '';
        });
        // Fix Status — if blank, derive from Allocated Rooms
        if (!obj['Status'] || obj['Status'].trim() === '' || obj['Status'] === 'No') {
          const alloc = (obj['Allocated Rooms'] || '').trim();
          obj['Status'] = (alloc && alloc !== '' && alloc !== 'Pending') ? 'Confirmed' : 'Pending';
        }
        return obj;
      });
      return ok({reservations});
    }

    if (action === 'getMembers') {
      const id    = e.parameter.id;
      const sheet = ss.getSheetByName('Members');
      const rows  = sheet.getDataRange().getValues();
      const hdrs  = rows[0];
      const members = rows.slice(1)
        .filter(r => String(r[0]) === id)
        .map(r => {
          const obj = {};
          hdrs.forEach((h,i) => obj[h] = String(r[i]));
          return obj;
        });
      return ok({members});
    }

    if (action === 'getRooms') {
      const sheet = ss.getSheetByName('Rooms');
      const rows  = sheet.getDataRange().getValues();
      if (rows.length <= 1) return ok({rooms:[]});
      const hdrs  = rows[0];
      const rooms = rows.slice(1).map(r => {
        const obj = {};
        hdrs.forEach((h,i) => obj[h] = String(r[i]));
        return obj;
      });
      return ok({rooms});
    }

  } catch(err) {
    return ok({error: err.message});
  }
}

function doPost(e) {
  const payload = JSON.parse(e.postData.contents);
  const ss      = SpreadsheetApp.openById(SS_ID);
  const action  = payload.action;

  try {

    if (action === 'submitReservation') {
      const resSheet = ss.getSheetByName('Reservations');
      const r = payload.reservation;
      resSheet.appendRow([
        r.id, r.timestamp, r.fullName, r.address, r.city, r.state,
        r.mobile, r.email, r.aadhaarPan, r.gender, r.age, r.occupation,
        r.organization, r.designation, r.checkIn, r.checkOut, r.totalNights,
        r.acRooms, r.nonAcRooms, r.guestHouseRooms, r.transportMode,
        r.needTransport, r.needPooja, r.additionalRequirements,
        r.paymentAmount, r.status, r.allocatedRooms, r.allocationDate, r.emailSent
      ]);

      const memSheet = ss.getSheetByName('Members');
      payload.members.forEach(m => {
        memSheet.appendRow([
          m.submissionId, m.name, m.gender, m.age,
          m.relation, m.aadhaar, m.mobile, m.isPrimary
        ]);
      });
      return ok({success:true, id:r.id});
    }

    if (action === 'allocateRoom') {
      const sheet = ss.getSheetByName('Reservations');
      const data  = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === payload.reservationId) {
          sheet.getRange(i+1, 25).setValue('Confirmed');
          sheet.getRange(i+1, 26).setValue(payload.roomNumbers.join(', '));
          sheet.getRange(i+1, 27).setValue(payload.allocationDate);
          break;
        }
      }
      // Update room statuses
      const roomSheet = ss.getSheetByName('Rooms');
      const roomData  = roomSheet.getDataRange().getValues();
      payload.roomNumbers.forEach(num => {
        for (let i = 1; i < roomData.length; i++) {
          if (String(roomData[i][1]) === String(num)) {
            roomSheet.getRange(i+1, 5).setValue('Occupied');
            roomSheet.getRange(i+1, 6).setValue(payload.reservationId);
            break;
          }
        }
      });
      return ok({success:true});
    }

    if (action === 'updateStatus') {
      const sheet = ss.getSheetByName('Reservations');
      const data  = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === payload.reservationId) {
          sheet.getRange(i+1, 25).setValue(payload.status);
          break;
        }
      }
      return ok({success:true});
    }

    if (action === 'markEmailSent') {
      const sheet = ss.getSheetByName('Reservations');
      const data  = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === payload.reservationId) {
          sheet.getRange(i+1, 28).setValue('Yes');
          break;
        }
      }
      return ok({success:true});
    }

    if (action === 'saveRoom') {
      const sheet = ss.getSheetByName('Rooms');
      const data  = sheet.getDataRange().getValues();
      const rm    = payload.room;
      if (rm.id) {
        // Update existing
        for (let i = 1; i < data.length; i++) {
          if (String(data[i][0]) === String(rm.id)) {
            sheet.getRange(i+1, 1, 1, 6).setValues([[rm.id, rm.number, rm.category, rm.rate, rm.status, rm.currentRes||'']]);
            break;
          }
        }
      } else {
        // Add new
        const newId = 'R' + Date.now();
        sheet.appendRow([newId, rm.number, rm.category, rm.rate, rm.status || 'Available', '']);
      }
      return ok({success:true});
    }

    if (action === 'deleteRoom') {
      const sheet = ss.getSheetByName('Rooms');
      const data  = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(payload.roomId)) {
          sheet.deleteRow(i+1);
          break;
        }
      }
      return ok({success:true});
    }

  } catch(err) {
    return ok({error: err.message});
  }
}

function ok(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
*/
