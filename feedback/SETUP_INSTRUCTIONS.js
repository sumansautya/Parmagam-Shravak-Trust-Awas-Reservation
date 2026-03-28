/**
 * feedback-setup.js
 * ══════════════════════════════════════════════════════════════
 * STEP 1 — Add this to your existing Apps Script (sheets.js ★ section)
 * Add BOTH the doGet handler AND the doPost handler additions below.
 * ══════════════════════════════════════════════════════════════
 *
 * ADD to your Google Sheet:
 * A new tab called "Feedback" with these headers in Row 1:
 *
 * Timestamp | Ref ID | Name | Mobile | City | State | Email |
 * Occupation | Organisation | Designation |
 * Check-In | Check-Out |
 * Last Visit | Visit Count |
 * Overall | Room Clean | Bathroom Clean | Food Quality | Staff Behaviour |
 * Temple Premises | Pooja Arrangement | Value for Money |
 * Suggestions | Liked Most | Recommend | Overall Score %
 *
 * ══════════════════════════════════════════════════════════════
 * ADD inside doGet() — after existing getReservations/getRooms blocks:
 * ══════════════════════════════════════════════════════════════

    if (action === 'getFeedback') {
      const sheet = ss.getSheetByName('Feedback');
      if (!sheet) return ok({feedback:[]});
      const rows = sheet.getDataRange().getValues();
      if (rows.length <= 1) return ok({feedback:[]});
      const hdrs = rows[0];
      const feedback = rows.slice(1).map(r => {
        const obj = {};
        hdrs.forEach((h,i) => obj[String(h).trim()] = r[i] !== undefined ? String(r[i]) : '');
        return obj;
      });
      return ok({feedback});
    }

 * ══════════════════════════════════════════════════════════════
 * ADD inside doPost() — after existing submitReservation/allocateRoom blocks:
 * ══════════════════════════════════════════════════════════════

    if (action === 'submitFeedback') {
      const sheet = ss.getSheetByName('Feedback');
      const f = payload.feedback;
      sheet.appendRow([
        f.timestamp, f.refId, f.name, f.mobile, f.city, f.state, f.email,
        f.occupation, f.organisation, f.designation,
        f.checkIn, f.checkOut,                        // Stay dates from reservation
        f.lastVisit, f.visitCount,
        f.rOverall, f.rRoom, f.rBath, f.rFood, f.rStaff, f.rTemple, f.rPooja, f.rValue,
        f.suggestions, f.liked, f.recommend, f.overallScore
      ]);
      return ok({success:true});
    }

    if (action === 'checkFeedbackTrigger') {
      // Called by a time-based trigger to find reservations checking out today
      // and send feedback email at 6:00 AM
      const resSheet  = ss.getSheetByName('Reservations');
      const rows      = resSheet.getDataRange().getValues();
      const hdrs      = rows[0];
      const today     = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd');

      const checkouts = rows.slice(1).filter(r => {
        const coIdx = hdrs.indexOf('Check-Out');
        const stIdx = hdrs.indexOf('Status');
        if (coIdx < 0) return false;
        const co = r[coIdx];
        let coStr = '';
        if (co instanceof Date) {
          coStr = Utilities.formatDate(co, 'Asia/Kolkata', 'yyyy-MM-dd');
        } else {
          try { coStr = Utilities.formatDate(new Date(co), 'Asia/Kolkata', 'yyyy-MM-dd'); } catch(e) {}
        }
        return coStr === today && String(r[stIdx] || '').toLowerCase() !== 'cancelled';
      });

      checkouts.forEach(r => {
        const nameIdx  = hdrs.indexOf('Full Name');
        const emailIdx = hdrs.indexOf('Email');
        const idIdx    = hdrs.indexOf('ID');
        const mobIdx   = hdrs.indexOf('Mobile');
        const addrIdx  = hdrs.indexOf('Address');
        const cityIdx  = hdrs.indexOf('City');
        const stateIdx = hdrs.indexOf('State');
        const occIdx   = hdrs.indexOf('Occupation');
        const orgIdx   = hdrs.indexOf('Organization');
        const desigIdx = hdrs.indexOf('Designation');
        const coInIdx  = hdrs.indexOf('Check-In');
        const coOutIdx = hdrs.indexOf('Check-Out');

        const name     = r[nameIdx]  || '';
        const email    = r[emailIdx] || '';
        const refId    = r[idIdx]    || '';
        const mobile   = r[mobIdx]   || '';
        const address  = r[addrIdx]  || '';
        const city     = r[cityIdx]  || '';
        const state    = r[stateIdx] || '';
        const occ      = r[occIdx]   || '';
        const org      = r[orgIdx]   || '';
        const desig    = r[desigIdx] || '';

        // Format dates for display
        let checkIn='', checkOut='';
        try {
          const ci = r[coInIdx];
          const co = r[coOutIdx];
          if (ci instanceof Date) checkIn  = Utilities.formatDate(ci,  'Asia/Kolkata', 'yyyy-MM-dd');
          else checkIn  = String(ci).slice(0,10);
          if (co instanceof Date) checkOut = Utilities.formatDate(co,  'Asia/Kolkata', 'yyyy-MM-dd');
          else checkOut = String(co).slice(0,10);
        } catch(e) {}

        if (!email) return;

        // Build URL with all fields as query params — form will auto-fill & lock them
        const feedbackUrl = 'https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO_NAME/feedback/?' +
          'ref='     + encodeURIComponent(refId)        +
          '&name='   + encodeURIComponent(name)         +
          '&mobile=' + encodeURIComponent(mobile)       +
          '&email='  + encodeURIComponent(email)        +
          '&addr='   + encodeURIComponent(address)      +
          '&city='   + encodeURIComponent(city)         +
          '&state='  + encodeURIComponent(state)        +
          '&occ='    + encodeURIComponent(occ)          +
          '&org='    + encodeURIComponent(org)          +
          '&desig='  + encodeURIComponent(desig)        +
          '&cin='    + encodeURIComponent(checkIn)      +
          '&cout='   + encodeURIComponent(checkOut);

        const subject = '🙏 Share Your Feedback — Shri Parmagam Shravak Trust, Sonagir';
        const body = `🕉 ॐ नमः सिद्धेभ्यः 🕉\n\nDear ${name},\n\nJai Jinendra! 🙏\n\nThank you for staying with us at Shri Kund Kund Nagar, Sonagir. We hope your visit was spiritually fulfilling and comfortable.\n\nAs you prepare to check out today, we would truly appreciate your valuable feedback. It takes only 2 minutes and helps us serve all future pilgrims better.\n\n👉 Click here to fill the Feedback Form:\n${feedbackUrl}\n\nRef ID: ${refId}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nFor any assistance, please contact:\n📞 8887417076 / 7987164958\n\nShri Parmagam Shravak Trust\nShri Kund Kund Nagar, Sonagir — 473885\nDistrict Datia, Madhya Pradesh\n\n🕉 Jai Jinendra — Safe Journey! 🕉\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

        try {
          GmailApp.sendEmail(email, subject, body);
          Logger.log('Feedback email sent to: ' + email);
        } catch(err) {
          Logger.log('Failed to send to ' + email + ': ' + err.message);
        }
      });

      return ok({ success: true, sent: checkouts.length });
    }

 * ══════════════════════════════════════════════════════════════
 * STEP 2 — Set up the 6:00 AM daily trigger in Apps Script:
 *
 * 1. In Apps Script → click ⏰ Triggers (left sidebar clock icon)
 * 2. Click "+ Add Trigger" (bottom right)
 * 3. Fill in:
 *    - Function to run: checkFeedbackTrigger
 *    - Deployment: Head
 *    - Event source: Time-driven
 *    - Type: Day timer
 *    - Time: 6am to 7am
 * 4. Click Save
 * 5. Authorize when prompted
 *
 * The trigger will now run every day at 6:00 AM and automatically
 * send a feedback form link to every guest checking out that day!
 * ══════════════════════════════════════════════════════════════
 *
 * STEP 3 — Update feedback/index.html:
 * Replace YOUR_SCRIPT_ID_HERE with your actual Apps Script URL
 * (same URL as in sheets.js APPS_SCRIPT_URL)
 *
 * STEP 4 — Update the feedbackUrl in checkFeedbackTrigger above:
 * Replace YOUR_GITHUB_USERNAME and YOUR_REPO_NAME with your actual values
 * e.g. https://kahannagarsonagir.github.io/Parmagam-Shravak-Trust-Awas-Reservation/feedback/
 * ══════════════════════════════════════════════════════════════
 */

