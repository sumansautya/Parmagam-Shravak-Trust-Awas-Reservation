/**
 * form.js — Reservation Form Logic
 * Parmagam Shravak Trust Awas Reservation System
 */

// ── STATE ──
const formState = {
  gender: '',
  occupation: '',
  transport: '',
  needTransport: '',
  needPooja: '',
  rooms: { ac: 0, nonAc: 0, guestHouse: 0 },
  members: [],
  paymentFile: null
};

const ROOM_RATES = { ac: 1200, nonAc: 700, guestHouse: 2000 };

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  // Set min date for check-in to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('checkIn').min = today;
  document.getElementById('checkOut').min = today;

  // Auto-fill primary visitor as Member 1 (read-only)
  renderMembers();

  // Input listeners for live validation
  ['fullName','address','city','mobile','email','age','paymentAmount'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('blur', () => validateField(id));
  });

  // Mobile: numbers only
  document.getElementById('mobile').addEventListener('input', function() {
    this.value = this.value.replace(/\D/g,'').slice(0,10);
  });

  // Step indicator update on scroll
  updateStepIndicator();
  window.addEventListener('scroll', updateStepIndicator);
});

// ── RADIO SELECT ──
function selectRadio(group, value, el) {
  formState[group] = value;
  document.querySelectorAll(`[name="${group}"]`).forEach(r => r.closest('.radio-option').classList.remove('selected'));
  el.classList.add('selected');
  hideError(`err-${group}`);
}

// ── TRANSPORT SELECT ──
function selectTransport(mode, el) {
  formState.transport = mode;
  document.querySelectorAll('.transport-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  hideError('err-transport');
}

// ── TOGGLE YES/NO ──
function setToggle(field, value) {
  formState[field] = value;
  const isYes = value === 'Yes';

  if (field === 'needTransport') {
    document.getElementById('transportYes').className = 'toggle-btn' + (isYes ? ' active-yes' : '');
    document.getElementById('transportNo').className  = 'toggle-btn' + (!isYes ? ' active-no' : '');
    hideError('err-needTransport');
  } else if (field === 'needPooja') {
    document.getElementById('poojaYes').className = 'toggle-btn' + (isYes ? ' active-yes' : '');
    document.getElementById('poojaNo').className  = 'toggle-btn' + (!isYes ? ' active-no' : '');
    hideError('err-needPooja');
  }
}

// ── ROOM COUNTER ──
function changeRoom(type, delta) {
  formState.rooms[type] = Math.max(0, (formState.rooms[type] || 0) + delta);
  document.getElementById(`roomCount-${type}`).textContent = formState.rooms[type];

  const card = document.getElementById(`roomCard-${type}`);
  card.classList.toggle('selected', formState.rooms[type] > 0);

  updateCostSummary();
  hideError('err-rooms');
}

// ── COST SUMMARY ──
function updateCostSummary() {
  const nights = parseInt(document.getElementById('nightsCount').textContent) || 0;
  const { ac, nonAc, guestHouse } = formState.rooms;
  const total = ac > 0 || nonAc > 0 || guestHouse > 0;

  const summary = document.getElementById('costSummary');
  if (!total || nights === 0) { summary.style.display = 'none'; return; }

  summary.style.display = 'block';
  let rows = '';
  let grand = 0;

  if (ac > 0) {
    const sub = ac * ROOM_RATES.ac * nights;
    grand += sub;
    rows += `<div class="cost-row"><span>❄️ AC Room × ${ac} × ${nights} nights</span><span>₹${sub.toLocaleString('en-IN')}</span></div>`;
  }
  if (nonAc > 0) {
    const sub = nonAc * ROOM_RATES.nonAc * nights;
    grand += sub;
    rows += `<div class="cost-row"><span>🌬️ Non-AC Room × ${nonAc} × ${nights} nights</span><span>₹${sub.toLocaleString('en-IN')}</span></div>`;
  }
  if (guestHouse > 0) {
    const sub = guestHouse * ROOM_RATES.guestHouse * nights;
    grand += sub;
    rows += `<div class="cost-row"><span>🏡 Guest House × ${guestHouse} × ${nights} nights</span><span>₹${sub.toLocaleString('en-IN')}</span></div>`;
  }

  document.getElementById('costRows').innerHTML = rows;
  document.getElementById('costTotal').textContent = `₹${grand.toLocaleString('en-IN')}`;
}

// ── NIGHTS CALCULATION ──
function calcNights() {
  const ci = document.getElementById('checkIn').value;
  const co = document.getElementById('checkOut').value;

  if (ci) {
    const today = new Date().toISOString().split('T')[0];
    if (ci < today) {
      showError('err-checkIn');
      document.getElementById('checkIn').classList.add('error');
      return;
    }
    hideError('err-checkIn');
    document.getElementById('checkIn').classList.remove('error');
    document.getElementById('checkOut').min = ci;
  }

  if (ci && co) {
    if (co <= ci) {
      showError('err-checkOut');
      document.getElementById('checkOut').classList.add('error');
      return;
    }
    hideError('err-checkOut');
    document.getElementById('checkOut').classList.remove('error');

    const diff = Math.round((new Date(co) - new Date(ci)) / (1000*60*60*24));
    document.getElementById('nightsCount').textContent = diff;
    document.getElementById('nightsDisplay').style.display = 'block';
    updateCostSummary();
  }
}

// ── FILE UPLOAD ──
function handleFileUpload(input) {
  const file = input.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert('File size must be under 5MB');
    return;
  }

  formState.paymentFile = file;
  const area = document.getElementById('uploadArea');
  area.classList.add('has-file');
  area.innerHTML = `
    <div class="upload-icon">✅</div>
    <p><strong>${file.name}</strong></p>
    <p style="color:var(--green);">${(file.size/1024).toFixed(1)} KB · Click to change</p>
  `;
  hideError('err-paymentFile');
}

// ── MEMBERS ──
let memberCount = 0;

function renderMembers() {
  const container = document.getElementById('membersList');
  container.innerHTML = '';

  // Member 0 = Primary Visitor (auto-filled, read-only)
  container.innerHTML += buildPrimaryMemberCard();

  // Additional members
  for (let i = 1; i < formState.members.length + 1; i++) {
    if (formState.members[i - 1]) continue; // already rendered
  }

  // Re-render additional members
  formState.members.forEach((_, i) => {
    container.innerHTML += buildMemberCard(i + 1);
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
      <div class="field-group">
        <label class="field-label">Name / नाम</label>
        <input type="text" class="field-input" id="pm-name" readonly style="background:var(--ivory-dark); cursor:not-allowed;" placeholder="Auto-filled from personal info">
      </div>
      <div class="field-group">
        <label class="field-label">Gender / लिंग</label>
        <input type="text" class="field-input" id="pm-gender" readonly style="background:var(--ivory-dark); cursor:not-allowed;" placeholder="Auto-filled">
      </div>
      <div class="field-group">
        <label class="field-label">Age / आयु</label>
        <input type="text" class="field-input" id="pm-age" readonly style="background:var(--ivory-dark); cursor:not-allowed;" placeholder="Auto-filled">
      </div>
      <div class="field-group">
        <label class="field-label">Relation</label>
        <input type="text" class="field-input" value="Self (Primary Visitor)" readonly style="background:var(--ivory-dark); cursor:not-allowed;">
      </div>
      <div class="field-group">
        <label class="field-label">Mobile / मोबाइल</label>
        <input type="text" class="field-input" id="pm-mobile" readonly style="background:var(--ivory-dark); cursor:not-allowed;" placeholder="Auto-filled">
      </div>
      <div class="field-group">
        <label class="field-label">Aadhaar/PAN</label>
        <input type="text" class="field-input" id="pm-aadhaar" readonly style="background:var(--ivory-dark); cursor:not-allowed;" placeholder="Auto-filled">
      </div>
    </div>
    <div style="font-size:0.75rem; color:var(--text-light); margin-top:8px; font-style:italic;">
      ℹ️ Update your details in Section 1 — Personal Information
    </div>
  </div>`;
}

function buildMemberCard(index) {
  const n = index; // display number
  return `
  <div class="member-card" id="memberCard-${index}" style="animation: fadeInUp 0.3s ease;">
    <div class="member-card-header">
      <div class="member-card-title">Member ${n + 1} / सदस्य ${n + 1}</div>
      <button type="button" class="btn-remove" onclick="removeMember(${index - 1})">✕ Remove</button>
    </div>
    <div class="form-grid">
      <div class="field-group">
        <label class="field-label">Member Name <span class="req">*</span></label>
        <input type="text" class="field-input" id="m${index}-name" placeholder="Full name" oninput="updateMemberData(${index-1},'name',this.value)">
        <span class="field-error" id="m${index}-err-name">Name is required</span>
      </div>
      <div class="field-group">
        <label class="field-label">Gender <span class="req">*</span></label>
        <select class="field-select" id="m${index}-gender" onchange="updateMemberData(${index-1},'gender',this.value); updateMemberSummary()">
          <option value="">— Select —</option>
          <option value="Male">👨 Male / पुरुष</option>
          <option value="Female">👩 Female / महिला</option>
        </select>
        <span class="field-error" id="m${index}-err-gender">Gender is required</span>
      </div>
      <div class="field-group">
        <label class="field-label">Age <span class="req">*</span></label>
        <input type="number" class="field-input" id="m${index}-age" placeholder="Age" min="0" max="120" inputmode="numeric" oninput="updateMemberData(${index-1},'age',this.value); updateMemberSummary()">
        <span class="field-error" id="m${index}-err-age">Valid age required</span>
      </div>
      <div class="field-group">
        <label class="field-label">Relation with Head <span class="req">*</span></label>
        <select class="field-select" id="m${index}-relation" onchange="updateMemberData(${index-1},'relation',this.value)">
          <option value="">— Select —</option>
          <option>Spouse / पत्नी/पति</option>
          <option>Child / बच्चा</option>
          <option>Parent / माता-पिता</option>
          <option>Sibling / भाई-बहन</option>
          <option>Relative / रिश्तेदार</option>
          <option>Friend / मित्र</option>
        </select>
        <span class="field-error" id="m${index}-err-relation">Relation is required</span>
      </div>
      <div class="field-group">
        <label class="field-label">Aadhaar Number</label>
        <input type="text" class="field-input" id="m${index}-aadhaar" placeholder="12-digit Aadhaar" maxlength="12" inputmode="numeric" oninput="updateMemberData(${index-1},'aadhaar',this.value)">
      </div>
      <div class="field-group">
        <label class="field-label">Mobile Number</label>
        <input type="tel" class="field-input" id="m${index}-mobile" placeholder="Mobile (optional)" maxlength="10" inputmode="numeric" oninput="updateMemberData(${index-1},'mobile',this.value)">
      </div>
    </div>
  </div>`;
}

function addMember() {
  formState.members.push({ name:'', gender:'', age:'', relation:'', aadhaar:'', mobile:'' });
  const index = formState.members.length;
  const container = document.getElementById('membersList');
  const div = document.createElement('div');
  div.innerHTML = buildMemberCard(index);
  container.appendChild(div.firstElementChild);
  updateMemberSummary();
  // Scroll to new member
  document.getElementById(`memberCard-${index}`)?.scrollIntoView({ behavior:'smooth', block:'center' });
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
    // Re-populate values
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
  document.getElementById('pm-name').value   = document.getElementById('fullName')?.value || '';
  document.getElementById('pm-gender').value = formState.gender || '';
  document.getElementById('pm-age').value    = document.getElementById('age')?.value || '';
  document.getElementById('pm-mobile').value = document.getElementById('mobile')?.value || '';
  document.getElementById('pm-aadhaar').value= document.getElementById('aadhaarPan')?.value || '';
}

function updateMemberSummary() {
  syncPrimaryMember();

  // Count demographics from all members (primary + additional)
  const allMembers = getAllMembersData();
  const male     = allMembers.filter(m => m.gender === 'Male').length;
  const female   = allMembers.filter(m => m.gender === 'Female').length;
  const children = allMembers.filter(m => parseInt(m.age) < 18).length;
  const seniors  = allMembers.filter(m => parseInt(m.age) >= 60).length;

  const summary = document.getElementById('memberSummary');
  const text    = document.getElementById('memberSummaryText');

  if (allMembers.length > 0) {
    summary.style.display = 'block';
    text.innerHTML = `
      👥 <strong>Total Members: ${allMembers.length}</strong> &nbsp;|&nbsp;
      👨 Male: ${male} &nbsp;|&nbsp;
      👩 Female: ${female} &nbsp;|&nbsp;
      👶 Children (&lt;18): ${children} &nbsp;|&nbsp;
      🧓 Seniors (60+): ${seniors}
    `;
  }
}

function getAllMembersData() {
  const primary = {
    name:   document.getElementById('fullName')?.value || '',
    gender: formState.gender,
    age:    document.getElementById('age')?.value || '',
    relation: 'Self',
    aadhaar: document.getElementById('aadhaarPan')?.value || '',
    mobile:  document.getElementById('mobile')?.value || ''
  };
  return [primary, ...formState.members];
}

// ── VALIDATION ──
function validateField(id) {
  const val = document.getElementById(id)?.value?.trim();
  let valid = true;

  if (id === 'fullName')    valid = val.length >= 2;
  if (id === 'address')     valid = val.length >= 5;
  if (id === 'city')        valid = val.length >= 2;
  if (id === 'mobile')      valid = /^[6-9]\d{9}$/.test(val);
  if (id === 'email')       valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  if (id === 'age')         valid = parseInt(val) >= 1 && parseInt(val) <= 120;
  if (id === 'paymentAmount') valid = parseFloat(val) > 0;

  if (id === 'aadhaarPan' && val) {
    valid = /^\d{12}$/.test(val.replace(/\s/g,'')) || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(val.toUpperCase());
  }

  const el = document.getElementById(id);
  const err = document.getElementById(`err-${id}`);
  if (valid || !val) {
    el?.classList.remove('error');
    err?.classList.remove('visible');
  } else {
    el?.classList.add('error');
    err?.classList.add('visible');
  }
  return valid;
}

function showError(id) { document.getElementById(id)?.classList.add('visible'); }
function hideError(id) { document.getElementById(id)?.classList.remove('visible'); }

// ── FULL FORM VALIDATION ──
function validateForm() {
  let valid = true;

  // Section 1
  ['fullName','address','city','mobile','email','age'].forEach(f => {
    if (!validateField(f)) { valid = false; }
  });

  if (!document.getElementById('state').value) {
    document.getElementById('state').classList.add('error');
    showError('err-state'); valid = false;
  } else {
    document.getElementById('state').classList.remove('error');
    hideError('err-state');
  }

  if (!formState.gender) { showError('err-gender'); valid = false; }
  if (!formState.occupation) { showError('err-occupation'); valid = false; }

  // Aadhaar/PAN optional but validate if filled
  const ap = document.getElementById('aadhaarPan').value.trim();
  if (ap) {
    const apValid = /^\d{12}$/.test(ap.replace(/\s/g,'')) || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(ap.toUpperCase());
    if (!apValid) { showError('err-aadhaarPan'); valid = false; }
  }

  // Section 2 — dates
  const ci = document.getElementById('checkIn').value;
  const co = document.getElementById('checkOut').value;
  const today = new Date().toISOString().split('T')[0];
  if (!ci || ci < today) { showError('err-checkIn'); valid = false; }
  if (!co || co <= ci)   { showError('err-checkOut'); valid = false; }

  // Rooms
  const { ac, nonAc, guestHouse } = formState.rooms;
  if (ac + nonAc + guestHouse === 0) {
    document.getElementById('err-rooms').style.display = 'block';
    valid = false;
  }

  if (!formState.transport)     { showError('err-transport'); valid = false; }
  if (!formState.needTransport) { showError('err-needTransport'); valid = false; }
  if (!formState.needPooja)     { showError('err-needPooja'); valid = false; }

  // Section 3 — payment
  if (!validateField('paymentAmount')) valid = false;
  if (!formState.paymentFile) { showError('err-paymentFile'); valid = false; }

  // Section 4 — validate additional members
  formState.members.forEach((_, i) => {
    const idx = i + 1;
    const name = document.getElementById(`m${idx}-name`)?.value?.trim();
    const gender = document.getElementById(`m${idx}-gender`)?.value;
    const age = document.getElementById(`m${idx}-age`)?.value;
    const rel = document.getElementById(`m${idx}-relation`)?.value;

    if (!name) { document.getElementById(`m${idx}-err-name`)?.classList.add('visible'); valid = false; }
    if (!gender) { document.getElementById(`m${idx}-err-gender`)?.classList.add('visible'); valid = false; }
    if (!age || parseInt(age) < 0) { document.getElementById(`m${idx}-err-age`)?.classList.add('visible'); valid = false; }
    if (!rel) { document.getElementById(`m${idx}-err-relation`)?.classList.add('visible'); valid = false; }
  });

  return valid;
}

// ── SUBMIT ──
async function submitForm() {
  syncPrimaryMember();

  if (!validateForm()) {
    // Scroll to first error
    const firstError = document.querySelector('.error, .visible');
    firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // Collect all members current values
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
    fullName:      document.getElementById('fullName').value.trim(),
    address:       document.getElementById('address').value.trim(),
    city:          document.getElementById('city').value.trim(),
    state:         document.getElementById('state').value,
    mobile:        document.getElementById('mobile').value.trim(),
    email:         document.getElementById('email').value.trim(),
    aadhaarPan:    document.getElementById('aadhaarPan').value.trim(),
    gender:        formState.gender,
    age:           document.getElementById('age').value,
    occupation:    formState.occupation,
    organization:  document.getElementById('organization').value.trim(),
    checkIn:       document.getElementById('checkIn').value,
    checkOut:      document.getElementById('checkOut').value,
    totalNights:   parseInt(document.getElementById('nightsCount').textContent) || 0,
    rooms:         { ...formState.rooms },
    transportMode: formState.transport,
    needTransport: formState.needTransport,
    needPooja:     formState.needPooja,
    additionalRequirements: document.getElementById('additionalReq').value.trim(),
    paymentAmount: document.getElementById('paymentAmount').value,
    members:       getAllMembersData()
  };

  // Save to sessionStorage for review page
  sessionStorage.setItem('reservationData', JSON.stringify(formData));
  sessionStorage.setItem('paymentFileName', formState.paymentFile?.name || '');

  // Navigate to review page
  window.location.href = 'review.html';
}

// ── STEP INDICATOR ──
function updateStepIndicator() {
  const sections = ['sec1','sec2','sec3','sec4'];
  const dots = ['step1dot','step2dot','step3dot','step4dot'];

  sections.forEach((id, i) => {
    const el = document.getElementById(id);
    const dot = document.getElementById(dots[i]);
    if (!el || !dot) return;
    const rect = el.getBoundingClientRect();
    dot.classList.toggle('active', rect.top <= 200 && rect.bottom > 100);
  });
}
