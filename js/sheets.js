/**
 * sheets.js — Google Sheets Integration
 * Parmagam Shravak Trust Awas Reservation System
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a Google Sheet with 3 tabs: Reservations, Members, Rooms
 * 2. Deploy a Google Apps Script as Web App (see below)
 * 3. Replace APPS_SCRIPT_URL with your deployed URL
 */

const SHEETS_CONFIG = {
  // ↓ Replace with your Google Apps Script Web App URL after deployment
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',

  // Sheet names (must match exactly in Google Sheets)
  SHEETS: {
    RESERVATIONS: 'Reservations',
    MEMBERS: 'Members',
    ROOMS: 'Rooms'
  }
};

/**
 * Submit a new reservation to Google Sheets
 * @param {Object} formData - Complete form data
 * @returns {Promise<{success: boolean, id: string}>}
 */
async function submitReservation(formData) {
  try {
    const submissionId = generateId();
    const timestamp = new Date().toISOString();

    // Build reservation row
    const reservation = {
      action: 'addReservation',
      data: {
        id: submissionId,
        timestamp,
        fullName: formData.fullName,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        mobile: formData.mobile,
        email: formData.email,
        aadhaarPan: formData.aadhaarPan || '',
        gender: formData.gender,
        age: formData.age,
        occupation: formData.occupation,
        organization: formData.organization || '',
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        totalNights: formData.totalNights,
        acRooms: formData.rooms.ac,
        nonAcRooms: formData.rooms.nonAc,
        guestHouseRooms: formData.rooms.guestHouse,
        transportMode: formData.transportMode,
        needTransport: formData.needTransport,
        needPooja: formData.needPooja,
        additionalRequirements: formData.additionalRequirements || '',
        paymentAmount: formData.paymentAmount,
        paymentScreenshotUrl: formData.paymentScreenshotUrl || '',
        status: 'Pending',
        allocatedRooms: '',
        allocationDate: '',
        emailSent: 'No'
      }
    };

    // Build members rows
    const members = formData.members.map((m, i) => ({
      submissionId,
      name: m.name,
      gender: m.gender,
      age: m.age,
      relation: i === 0 ? 'Self (Primary)' : m.relation,
      aadhaar: m.aadhaar || '',
      mobile: m.mobile || '',
      isPrimary: i === 0 ? 'Yes' : 'No'
    }));

    const payload = {
      action: 'submitReservation',
      reservation: reservation.data,
      members
    };

    const response = await fetch(SHEETS_CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      mode: 'no-cors' // required for Apps Script
    });

    // With no-cors we can't read the response, so we assume success
    return { success: true, id: submissionId };

  } catch (error) {
    console.error('Sheet submission error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch all reservations (Admin)
 */
async function fetchReservations(filters = {}) {
  try {
    const url = new URL(SHEETS_CONFIG.APPS_SCRIPT_URL);
    url.searchParams.set('action', 'getReservations');
    if (filters.status) url.searchParams.set('status', filters.status);
    if (filters.date) url.searchParams.set('date', filters.date);

    const response = await fetch(url.toString());
    const data = await response.json();
    return data.reservations || [];
  } catch (error) {
    console.error('Fetch reservations error:', error);
    return [];
  }
}

/**
 * Fetch rooms (Admin)
 */
async function fetchRooms() {
  try {
    const url = new URL(SHEETS_CONFIG.APPS_SCRIPT_URL);
    url.searchParams.set('action', 'getRooms');
    const response = await fetch(url.toString());
    const data = await response.json();
    return data.rooms || [];
  } catch (error) {
    console.error('Fetch rooms error:', error);
    return [];
  }
}

/**
 * Allocate room to reservation (Admin)
 */
async function allocateRoom(reservationId, roomNumbers) {
  try {
    const payload = {
      action: 'allocateRoom',
      reservationId,
      roomNumbers,
      allocationDate: new Date().toISOString()
    };
    const response = await fetch(SHEETS_CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      mode: 'no-cors'
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Generate unique submission ID
 */
function generateId() {
  const now = new Date();
  const date = now.toISOString().slice(0,10).replace(/-/g,'');
  const rand = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `PST-${date}-${rand}`;
}

/* ══════════════════════════════════════════════════════
   GOOGLE APPS SCRIPT CODE (deploy as Web App)
   Copy this to script.google.com → New Project
   ══════════════════════════════════════════════════════

const SPREADSHEET_ID = 'YOUR_GOOGLE_SHEET_ID';

function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  if (action === 'getRooms') {
    const sheet = ss.getSheetByName('Rooms');
    const rows = sheet.getDataRange().getValues();
    const rooms = rows.slice(1).map(r => ({
      id: r[0], number: r[1], category: r[2], rate: r[3], status: r[4], currentRes: r[5]
    }));
    return ContentService.createTextOutput(JSON.stringify({rooms}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'getReservations') {
    const sheet = ss.getSheetByName('Reservations');
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const reservations = rows.slice(1).map(r => {
      const obj = {};
      headers.forEach((h,i) => obj[h] = r[i]);
      return obj;
    });
    return ContentService.createTextOutput(JSON.stringify({reservations}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const payload = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  if (payload.action === 'submitReservation') {
    const resSheet = ss.getSheetByName('Reservations');
    const r = payload.reservation;
    resSheet.appendRow([
      r.id, r.timestamp, r.fullName, r.address, r.city, r.state,
      r.mobile, r.email, r.aadhaarPan, r.gender, r.age, r.occupation,
      r.organization, r.checkIn, r.checkOut, r.totalNights,
      r.acRooms, r.nonAcRooms, r.guestHouseRooms, r.transportMode,
      r.needTransport, r.needPooja, r.additionalRequirements,
      r.paymentAmount, r.paymentScreenshotUrl,
      r.status, r.allocatedRooms, r.allocationDate, r.emailSent
    ]);

    const memSheet = ss.getSheetByName('Members');
    payload.members.forEach(m => {
      memSheet.appendRow([
        payload.reservation.id, m.name, m.gender, m.age,
        m.relation, m.aadhaar, m.mobile, m.isPrimary
      ]);
    });

    return ContentService.createTextOutput(JSON.stringify({success:true}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (payload.action === 'allocateRoom') {
    const sheet = ss.getSheetByName('Reservations');
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === payload.reservationId) {
        sheet.getRange(i+1, 27).setValue(payload.roomNumbers.join(', '));
        sheet.getRange(i+1, 28).setValue(payload.allocationDate);
        sheet.getRange(i+1, 26).setValue('Confirmed');
        break;
      }
    }
    return ContentService.createTextOutput(JSON.stringify({success:true}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
*/
