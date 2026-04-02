/**
 * form.js — Reservation Form Logic
 * Parmagam Shravak Trust Awas Reservation System
 * v2 — Fixed: scroll-to-top bug, payment screenshot optional,
 *             clearer validation errors, robust submit flow
 */

// ── STATE ──
const formState = {
  gender: '',
  occupation: '',
  transport: '',
  needTransport: '',
  needPooja: '',
  rooms: { ac: 0, nonAc: 0, guestHouse: 0 },
  members: []
};

const ROOM_RATES = { ac: 1200, nonAc: 700, guestHouse: 2000 };

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('checkIn').min = today;
  document.getElementById('checkOut').min = today;

  renderMembers();

  // ── Email match check ──
// Email-1: password type (hidden/asterisk) — visitor cannot see what they type
// Email-2: email type (visible) — visitor sees what they type
// Both must match exactly before cursor moves to next field

function validateEmail1() {
  // Validate format of Email-1 on blur
  var email1 = document.getElementById('email')?.value?.trim() || '';
  var errEl  = document.getElementById('err-email');
  var valid  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email1);
  if (errEl) errEl.style.display = valid ? 'none' : 'block';
  return valid;
}

function checkEmailMatch() {
  var email1 = document.getElementById('email')?.value?.trim() || '';
  var email2 = document.getElementById('emailConfirm')?.value?.trim() || '';
  var okEl   = document.getElementById('emailMatchOk');
  var errEl  = document.getElementById('err-emailConfirm');

  // Don't show anything until Email-2 has some input
  if (!email2) {
    if (okEl)  okEl.style.display  = 'none';
    if (errEl) errEl.style.display = 'none';
    return;
  }

  // Both must be identical AND valid email format
  var bothMatch = (email1 === email2) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email1);

  if (bothMatch) {
    if (okEl)  okEl.style.display  = 'inline-block';
    if (errEl) errEl.style.display = 'none';
    // Remove error styling from confirm field
    document.getElementById('emailConfirm')?.classList.remove('error');
  } else {
    if (okEl)  okEl.style.display  = 'none';
    if (errEl) {
      errEl.style.display = 'block';
      // Specific messages
      if (email1 && email2 && email1 !== email2) {
        errEl.textContent = '⚠️ Please re-enter your correct email address / कृपया सही ईमेल पता पुनः दर्ज करें';
      } else if (email2 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email2)) {
        errEl.textContent = '⚠️ Please enter a valid email address / कृपया वैध ईमेल पता दर्ज करें';
      }
    }
    document.getElementById('emailConfirm')?.classList.add('error');
  }
}

['fullName','address','city','mobile','email','age'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('blur', () => validateField(id));
  });

  document.getElementById('mobile').addEventListener('input', function() {
    this.value = this.value.replace(/\D/g,'').slice(0,10);
  });

  updateStepIndicator();
  window.addEventListener('scroll', updateStepIndicator);
});

// ── RADIO SELECT ──
function selectRadio(group, value, el) {
  formState[group] = value;
  document.querySelectorAll(`[name="${group}"]`).forEach(r => r.closest('.radio-option').classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('err-' + group)?.classList.remove('visible');
}

// ── TRANSPORT SELECT ──
function selectTransport(mode, el) {
  formState.transport = mode;
  document.querySelectorAll('.transport-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('err-transport')?.classList.remove('visible');
}

// ── TOGGLE YES/NO ──
function setToggle(field, value) {
  formState[field] = value;
  const isYes = value === 'Yes';
  if (field === 'needTransport') {
    document.getElementById('transportYes').className = 'toggle-btn' + (isYes ? ' active-yes' : '');
    document.getElementById('transportNo').className  = 'toggle-btn' + (!isYes ? ' active-no' : '');
    document.getElementById('err-needTransport')?.classList.remove('visible');
  } else if (field === 'needPooja') {
    document.getElementById('poojaYes').className = 'toggle-btn' + (isYes ? ' active-yes' : '');
    document.getElementById('poojaNo').className  = 'toggle-btn' + (!isYes ? ' active-no' : '');
    document.getElementById('err-needPooja')?.classList.remove('visible');
  }
}

// ── ROOM COUNTER ──
function changeRoom(type, delta) {
  formState.rooms[type] = Math.max(0, (formState.rooms[type] || 0) + delta);
  document.getElementById(`roomCount-${type}`).textContent = formState.rooms[type];
  document.getElementById(`roomCard-${type}`).classList.toggle('selected', formState.rooms[type] > 0);
  updateCostSummary();
  document.getElementById('err-rooms').style.display = 'none';
}

// ── COST SUMMARY ──
function updateCostSummary() {
  const nights = parseInt(document.getElementById('nightsCount').textContent) || 0;
  const { ac, nonAc, guestHouse } = formState.rooms;
  const hasRoom = ac > 0 || nonAc > 0 || guestHouse > 0;
  const summary = document.getElementById('costSummary');
  if (!hasRoom || nights === 0) { summary.style.display = 'none'; return; }
  summary.style.display = 'block';
  let rows = '', grand = 0;
  if (ac > 0)         { const s = ac*ROOM_RATES.ac*nights;         grand+=s; rows+=`<div class="cost-row"><span>❄️ AC Room × ${ac} × ${nights} nights</span><span>₹${s.toLocaleString('en-IN')}</span></div>`; }
  if (nonAc > 0)      { const s = nonAc*ROOM_RATES.nonAc*nights;   grand+=s; rows+=`<div class="cost-row"><span>🌬️ Non-AC Room × ${nonAc} × ${nights} nights</span><span>₹${s.toLocaleString('en-IN')}</span></div>`; }
  if (guestHouse > 0) { const s = guestHouse*ROOM_RATES.guestHouse*nights; grand+=s; rows+=`<div class="cost-row"><span>🏡 Guest House × ${guestHouse} × ${nights} nights</span><span>₹${s.toLocaleString('en-IN')}</span></div>`; }
  document.getElementById('costRows').innerHTML = rows;
  document.getElementById('costTotal').textContent = `₹${grand.toLocaleString('en-IN')}`;
}

// ── NIGHTS CALCULATION ──
function calcNights() {
  const ci = document.getElementById('checkIn').value;
  const co = document.getElementById('checkOut').value;
  const today = new Date().toISOString().split('T')[0];
  if (ci) {
    if (ci < today) {
      document.getElementById('checkIn').classList.add('error');
      document.getElementById('err-checkIn').classList.add('visible');
    } else {
      document.getElementById('checkIn').classList.remove('error');
      document.getElementById('err-checkIn').classList.remove('visible');
      document.getElementById('checkOut').min = ci;
    }
  }
  if (ci && co) {
    if (co <= ci) {
      document.getElementById('checkOut').classList.add('error');
      document.getElementById('err-checkOut').classList.add('visible');
    } else {
      document.getElementById('checkOut').classList.remove('error');
      document.getElementById('err-checkOut').classList.remove('visible');
      const diff = Math.round((new Date(co) - new Date(ci)) / (1000*60*60*24));
      document.getElementById('nightsCount').textContent = diff;
      document.getElementById('nightsDisplay').style.display = 'block';
      updateCostSummary();
    }
  }
}

// ── FILE UPLOAD ──
// handleFileUpload removed — payment collected after confirmation

// ── MEMBERS ──
function renderMembers() {
  const container = document.getElementById('membersList');
  container.innerHTML = buildPrimaryMemberCard();
  formState.members.forEach((_, i) => {
    const div = document.createElement('div');
    div.innerHTML = buildMemberCard(i + 1);
    container.appendChild(div.firstElementChild);
  });
  updateMemberSummary();
}

function buildPrimaryMemberCard() {
  return `
  <div class="member-card" id="memberCard-0">
    <div class="member-card-header">
      <div class="member-card-title">Member 1 / सदस्य 1</div>
      <div class="member-primary-badge">⭐ Primary Visitor</div>
    </div>
    <div class="form-grid">
      <div class="field-group"><label class="field-label">Name / नाम</label>
        <input type="text" class="field-input" id="pm-name" readonly style="background:var(--ivory-dark);cursor:not-allowed;" placeholder="Auto-filled from personal info"></div>
      <div class="field-group"><label class="field-label">Gender / लिंग</label>
        <input type="text" class="field-input" id="pm-gender" readonly style="background:var(--ivory-dark);cursor:not-allowed;"></div>
      <div class="field-group"><label class="field-label">Age / आयु</label>
        <input type="text" class="field-input" id="pm-age" readonly style="background:var(--ivory-dark);cursor:not-allowed;"></div>
      <div class="field-group"><label class="field-label">Relation</label>
        <input type="text" class="field-input" value="Self (Primary Visitor)" readonly style="background:var(--ivory-dark);cursor:not-allowed;"></div>
      <div class="field-group"><label class="field-label">Mobile / मोबाइल</label>
        <input type="text" class="field-input" id="pm-mobile" readonly style="background:var(--ivory-dark);cursor:not-allowed;"></div>
      <div class="field-group"><label class="field-label">Aadhaar/PAN</label>
        <input type="text" class="field-input" id="pm-aadhaar" readonly style="background:var(--ivory-dark);cursor:not-allowed;"></div>
      <div class="field-group"><label class="field-label">Designation / पदनाम</label>
        <input type="text" class="field-input" id="pm-desig" readonly style="background:var(--ivory-dark);cursor:not-allowed;"></div>
    </div>
    <div style="font-size:0.75rem;color:var(--text-light);margin-top:8px;font-style:italic;">ℹ️ Update your details in Section 1 — Personal Information</div>
  </div>`;
}

function buildMemberCard(index) {
  return `
  <div class="member-card" id="memberCard-${index}">
    <div class="member-card-header">
      <div class="member-card-title">Member ${index + 1} / सदस्य ${index + 1}</div>
      <button type="button" class="btn-remove" onclick="removeMember(${index - 1})">✕ Remove</button>
    </div>
    <div class="form-grid">
      <div class="field-group"><label class="field-label">Member Name <span class="req">*</span></label>
        <input type="text" class="field-input" id="m${index}-name" placeholder="Full name" oninput="updateMemberData(${index-1},'name',this.value)">
        <span class="field-error" id="m${index}-err-name">Name is required</span></div>
      <div class="field-group"><label class="field-label">Gender <span class="req">*</span></label>
        <select class="field-select" id="m${index}-gender" onchange="updateMemberData(${index-1},'gender',this.value);updateMemberSummary()">
          <option value="">— Select —</option>
          <option value="Male">👨 Male / पुरुष</option>
          <option value="Female">👩 Female / महिला</option>
        </select>
        <span class="field-error" id="m${index}-err-gender">Gender is required</span></div>
      <div class="field-group"><label class="field-label">Age <span class="req">*</span></label>
        <input type="number" class="field-input" id="m${index}-age" placeholder="Age" min="0" max="120" inputmode="numeric" oninput="updateMemberData(${index-1},'age',this.value);updateMemberSummary();checkMemberMobileReq(${index})">
        <span class="field-error" id="m${index}-err-age">Valid age required</span></div>
      <div class="field-group"><label class="field-label">Relation with Head <span class="req">*</span></label>
        <select class="field-select" id="m${index}-relation" onchange="updateMemberData(${index-1},'relation',this.value)">
          <option value="">— Select —</option>
          <option>Spouse / पत्नी/पति</option><option>Child / बच्चा</option>
          <option>Parent / माता-पिता</option><option>Sibling / भाई-बहन</option>
          <option>Relative / रिश्तेदार</option><option>Friend / मित्र</option>
        </select>
        <span class="field-error" id="m${index}-err-relation">Relation is required</span></div>
      <div class="field-group">
        <label class="field-label">Mobile Number <span id="m${index}-mobile-req-label" style="display:none;" class="req">*</span> <span style="font-size:0.75rem;color:var(--text-light);">(Mandatory if Age &gt; 18)</span></label>
        <input type="tel" class="field-input" id="m${index}-mobile" placeholder="10-digit mobile" maxlength="10" inputmode="numeric"
          oninput="updateMemberData(${index-1},'mobile',this.value)"
          onchange="checkMemberMobileReq(${index})">
        <span class="field-error" id="m${index}-err-mobile">Mobile is required for members above 18 years</span>
      </div>
      <div class="field-group"><label class="field-label">Aadhaar Number <span style="font-size:0.75rem;color:var(--text-light);">(Optional)</span></label>
        <input type="text" class="field-input" id="m${index}-aadhaar" placeholder="12-digit Aadhaar (optional)" maxlength="12" inputmode="numeric" oninput="updateMemberData(${index-1},'aadhaar',this.value)"></div>
    </div>
  </div>`;
}

// Show/hide mobile req marker based on age field value
function checkMemberMobileReq(index) {
  const age = parseInt(document.getElementById(`m${index}-age`)?.value || '0');
  const lbl = document.getElementById(`m${index}-mobile-req-label`);
  if (lbl) lbl.style.display = age > 18 ? 'inline' : 'none';
}

function addMember() {
  formState.members.push({ name:'', gender:'', age:'', relation:'', aadhaar:'', mobile:'' });
  const index = formState.members.length;
  const container = document.getElementById('membersList');
  const div = document.createElement('div');
  div.innerHTML = buildMemberCard(index);
  container.appendChild(div.firstElementChild);
  updateMemberSummary();
  setTimeout(() => document.getElementById(`memberCard-${index}`)?.scrollIntoView({ behavior:'smooth', block:'center' }), 100);
}

function removeMember(i) {
  formState.members.splice(i, 1);
  renderMembersFromState();
  updateMemberSummary();
}

function renderMembersFromState() {
  const container = document.getElementById('membersList');
  container.innerHTML = buildPrimaryMemberCard();
  syncPrimaryMember();
  formState.members.forEach((m, i) => {
    const div = document.createElement('div');
    div.innerHTML = buildMemberCard(i + 1);
    container.appendChild(div.firstElementChild);
    setTimeout(() => {
      ['name','gender','age','relation','aadhaar','mobile'].forEach(f => {
        const el = document.getElementById(`m${i+1}-${f}`);
        if (el && m[f]) el.value = m[f];
      });
    }, 10);
  });
}

function updateMemberData(i, field, value) {
  if (formState.members[i]) formState.members[i][field] = value;
}

function syncPrimaryMember() {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  set('pm-name',    document.getElementById('fullName')?.value || '');
  set('pm-gender',  formState.gender || '');
  set('pm-age',     document.getElementById('age')?.value || '');
  set('pm-mobile',  document.getElementById('mobile')?.value || '');
  set('pm-aadhaar', document.getElementById('aadhaarPan')?.value || '');
  set('pm-desig',   document.getElementById('designation')?.value || '');
}

function updateMemberSummary() {
  syncPrimaryMember();
  const all = getAllMembersData();
  const male = all.filter(m=>m.gender==='Male').length;
  const female = all.filter(m=>m.gender==='Female').length;
  const children = all.filter(m=>parseInt(m.age)<18).length;
  const seniors = all.filter(m=>parseInt(m.age)>=60).length;
  const summary = document.getElementById('memberSummary');
  const text = document.getElementById('memberSummaryText');
  if (summary && text && all.length > 0) {
    summary.style.display = 'block';
    text.innerHTML = `👥 <strong>Total: ${all.length}</strong> &nbsp;|&nbsp; 👨 Male: ${male} &nbsp;|&nbsp; 👩 Female: ${female} &nbsp;|&nbsp; 👶 Children: ${children} &nbsp;|&nbsp; 🧓 Seniors: ${seniors}`;
  }
}

function getAllMembersData() {
  return [{
    name: document.getElementById('fullName')?.value?.trim() || '',
    gender: formState.gender, age: document.getElementById('age')?.value || '',
    relation: 'Self', aadhaar: document.getElementById('aadhaarPan')?.value?.trim() || '',
    mobile: document.getElementById('mobile')?.value?.trim() || '',
    designation: document.getElementById('designation')?.value?.trim() || ''
  }, ...formState.members];
}

// ════════════════════════════════════════════
// VALIDATION  — Fixed scroll-to-error logic
// ════════════════════════════════════════════
function validateField(id) {
  const el  = document.getElementById(id);
  const val = el?.value?.trim() || '';
  let valid = true;
  switch(id) {
    case 'fullName':      valid = val.length >= 2; break;
    case 'address':       valid = val.length >= 5; break;
    case 'city':          valid = val.length >= 2; break;
    case 'mobile':        valid = /^[6-9]\d{9}$/.test(val); break;
    case 'email':         valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val); break;
    case 'age':           valid = val !== '' && parseInt(val) >= 1 && parseInt(val) <= 120; break;
    case 'aadhaarPan':
      if (!val) return true;
      valid = /^\d{12}$/.test(val.replace(/\s/g,'')) || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(val.toUpperCase());
      break;
  }
  if (valid) {
    el?.classList.remove('error');
    document.getElementById('err-'+id)?.classList.remove('visible');
  } else {
    el?.classList.add('error');
    document.getElementById('err-'+id)?.classList.add('visible');
  }
  return valid;
}

function validateForm() {
  let valid = true;
  let firstErrorEl = null;

  function flag(el) {
    valid = false;
    if (!firstErrorEl && el) firstErrorEl = el;
  }
  function ok(el, errId) {
    el?.classList.remove('error');
    if (errId) document.getElementById(errId)?.classList.remove('visible');
  }
  function fail(el, errId) {
    el?.classList.add('error');
    if (errId) document.getElementById(errId)?.classList.add('visible');
    flag(el);
  }
  function chk(id, condition, errId) {
    const el = document.getElementById(id);
    if (!condition) fail(el, errId || ('err-' + id));
    else ok(el, errId || ('err-' + id));
  }

  // ── Section 1: Personal Info ──
  const name   = document.getElementById('fullName')?.value?.trim() || '';
  const addr   = document.getElementById('address')?.value?.trim()  || '';
  const city   = document.getElementById('city')?.value?.trim()     || '';
  const mob    = document.getElementById('mobile')?.value?.trim()   || '';
  const email  = document.getElementById('email')?.value?.trim()    || '';
  const age    = document.getElementById('age')?.value?.trim()      || '';
  const state  = document.getElementById('state')?.value            || '';
  const adh    = document.getElementById('aadhaarPan')?.value?.trim()|| '';

  chk('fullName',  name.length >= 2);
  chk('address',   addr.length >= 5);
  chk('city',      city.length >= 2);
  chk('mobile',    /^[6-9][0-9]{9}$/.test(mob));
  chk('email',     /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  // Confirm email must match
  const emailConfirm = document.getElementById('emailConfirm')?.value?.trim() || '';
  if (email !== emailConfirm || !emailConfirm) {
    var errConfirm = document.getElementById('err-emailConfirm');
    if (errConfirm) {
      errConfirm.textContent = '⚠️ Please re-enter your correct email address / कृपया सही ईमेल पता पुनः दर्ज करें';
      errConfirm.style.display = 'block';
    }
    if (!firstError) firstError = document.getElementById('emailConfirm');
    isValid = false;
  } else {
    document.getElementById('err-emailConfirm').style.display = 'none';
  }
  chk('age',       age !== '' && parseInt(age) >= 1 && parseInt(age) <= 120);
  chk('state',     state !== '', 'err-state');

  if (!formState.gender) {
    document.getElementById('err-gender')?.classList.add('visible');
    flag(document.getElementById('genderGroup'));
  } else {
    document.getElementById('err-gender')?.classList.remove('visible');
  }

  if (!formState.occupation) {
    document.getElementById('err-occupation')?.classList.add('visible');
    flag(document.getElementById('occupationGroup'));
  } else {
    document.getElementById('err-occupation')?.classList.remove('visible');
  }

  // Aadhaar/PAN optional — validate format only if filled
  if (adh) {
    const adhValid = /^[0-9]{12}$/.test(adh.replace(/\s/g,'')) || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(adh.toUpperCase());
    chk('aadhaarPan', adhValid);
  } else {
    ok(document.getElementById('aadhaarPan'), 'err-aadhaarPan');
  }

  // ── Section 2: Stay & Rooms ──
  const ci    = document.getElementById('checkIn')?.value  || '';
  const co    = document.getElementById('checkOut')?.value || '';
  const today = new Date().toISOString().split('T')[0];

  if (!ci || ci < today) fail(document.getElementById('checkIn'),  'err-checkIn');
  else                   ok( document.getElementById('checkIn'),   'err-checkIn');

  if (!co || co <= ci)   fail(document.getElementById('checkOut'), 'err-checkOut');
  else                   ok( document.getElementById('checkOut'),  'err-checkOut');

  const { ac, nonAc, guestHouse } = formState.rooms;
  if (ac + nonAc + guestHouse === 0) {
    document.getElementById('err-rooms').style.display = 'block';
    flag(document.getElementById('err-rooms'));
  } else {
    document.getElementById('err-rooms').style.display = 'none';
  }

  if (!formState.transport) {
    document.getElementById('err-transport')?.classList.add('visible');
    flag(document.getElementById('transportGroup'));
  } else {
    document.getElementById('err-transport')?.classList.remove('visible');
  }

  // needTransport & needPooja: valid if 'Yes' OR 'No' (any non-empty value)
  if (!formState.needTransport || formState.needTransport === '') {
    document.getElementById('err-needTransport')?.classList.add('visible');
    flag(document.getElementById('transportYes'));
  } else {
    document.getElementById('err-needTransport')?.classList.remove('visible');
  }

  if (!formState.needPooja || formState.needPooja === '') {
    document.getElementById('err-needPooja')?.classList.add('visible');
    flag(document.getElementById('poojaYes'));
  } else {
    document.getElementById('err-needPooja')?.classList.remove('visible');
  }

  // ── Section 3: Members ──
  formState.members.forEach((_, i) => {
    const idx  = i + 1;
    const nEl  = document.getElementById('m' + idx + '-name');
    const gEl  = document.getElementById('m' + idx + '-gender');
    const aEl  = document.getElementById('m' + idx + '-age');
    const rEl  = document.getElementById('m' + idx + '-relation');
    const mEl  = document.getElementById('m' + idx + '-mobile');
    const mAge = parseInt(aEl?.value || '0');

    if (!nEl?.value?.trim()) fail(nEl, 'm' + idx + '-err-name');
    else ok(nEl, 'm' + idx + '-err-name');

    if (!gEl?.value) fail(gEl, 'm' + idx + '-err-gender');
    else ok(gEl, 'm' + idx + '-err-gender');

    if (!aEl?.value || parseInt(aEl.value) < 0 || parseInt(aEl.value) > 120)
      fail(aEl, 'm' + idx + '-err-age');
    else ok(aEl, 'm' + idx + '-err-age');

    if (!rEl?.value) fail(rEl, 'm' + idx + '-err-relation');
    else ok(rEl, 'm' + idx + '-err-relation');

    // Mobile mandatory only for age > 18
    if (mAge > 18) {
      const mobVal = mEl?.value?.trim() || '';
      if (!mobVal || !/^[6-9][0-9]{9}$/.test(mobVal))
        fail(mEl, 'm' + idx + '-err-mobile');
      else ok(mEl, 'm' + idx + '-err-mobile');
    } else {
      ok(mEl, 'm' + idx + '-err-mobile');
    }
  });

  // ── Scroll to first error ──
  if (firstErrorEl) {
    firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    firstErrorEl.style.transition = 'box-shadow 0.3s';
    firstErrorEl.style.boxShadow  = '0 0 0 5px rgba(229,57,53,0.35)';
    setTimeout(() => { if(firstErrorEl) firstErrorEl.style.boxShadow = ''; }, 2500);
  }

  return valid;
}

// ════════════════════════════════════════════
// SUBMIT
// ════════════════════════════════════════════
async function submitForm() {
  syncPrimaryMember();

  const btn = document.getElementById('submitBtn');
  btn.innerHTML = '<span class="spinner"></span> Checking...';
  btn.disabled = true;

  await new Promise(r => setTimeout(r, 200));

  if (!validateForm()) {
    btn.innerHTML = 'Preview &amp; Submit &nbsp;→';
    btn.disabled = false;
    return;
  }

  btn.innerHTML = '<span class="spinner"></span> Loading Preview...';

  formState.members.forEach((m, i) => {
    const idx = i + 1;
    m.name     = document.getElementById(`m${idx}-name`)?.value?.trim() || '';
    m.gender   = document.getElementById(`m${idx}-gender`)?.value || '';
    m.age      = document.getElementById(`m${idx}-age`)?.value || '';
    m.relation = document.getElementById(`m${idx}-relation`)?.value || '';
    m.aadhaar  = document.getElementById(`m${idx}-aadhaar`)?.value || '';
    m.mobile   = document.getElementById(`m${idx}-mobile`)?.value || '';
  });

  const formData = {
    fullName:               document.getElementById('fullName').value.trim(),
    address:                document.getElementById('address').value.trim(),
    city:                   document.getElementById('city').value.trim(),
    state:                  document.getElementById('state').value,
    mobile:                 document.getElementById('mobile').value.trim(),
    email:                  document.getElementById('email').value.trim(),
    aadhaarPan:             document.getElementById('aadhaarPan').value.trim(),
    gender:                 formState.gender,
    age:                    document.getElementById('age').value,
    occupation:             formState.occupation,
    organization:           document.getElementById('organization').value.trim(),
    designation:            document.getElementById('designation')?.value.trim() || '',
    checkIn:                document.getElementById('checkIn').value,
    checkOut:               document.getElementById('checkOut').value,
    totalNights:            parseInt(document.getElementById('nightsCount').textContent) || 0,
    rooms:                  { ...formState.rooms },
    transportMode:          formState.transport,
    needTransport:          formState.needTransport,
    needPooja:              formState.needPooja,
    additionalRequirements: document.getElementById('additionalReq').value.trim(),

    members:                getAllMembersData()
  };

  sessionStorage.setItem('reservationData', JSON.stringify(formData));
  window.location.href = 'review.html';
}

// ── STEP INDICATOR ──
function updateStepIndicator() {
  [['sec1','step1dot'],['sec2','step2dot'],['sec3','step3dot']].forEach(([s,d]) => {
    const sec = document.getElementById(s), dot = document.getElementById(d);
    if (!sec || !dot) return;
    const r = sec.getBoundingClientRect();
    dot.classList.toggle('active', r.top <= 200 && r.bottom > 100);
  });
}
