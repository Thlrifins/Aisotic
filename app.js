// app.js - จัดการ localStorage, session, validation
const STORAGE_KEY = 'myapp_users_v1';
const SESSION_KEY = 'myapp_session_v1';

// helper
function qs(selector, root=document){ return root.querySelector(selector); }
function qsa(selector, root=document){ return Array.from(root.querySelectorAll(selector)); }

function loadUsers(){
  try{
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  }catch(e){ return []; }
}
function saveUsers(users){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}
function setSession(nickname){
  localStorage.setItem(SESSION_KEY, JSON.stringify({nick:nickname, at:Date.now()}));
}
function clearSession(){
  localStorage.removeItem(SESSION_KEY);
}
function getSession(){
  try{ return JSON.parse(localStorage.getItem(SESSION_KEY)); }catch(e){ return null; }
}
function findUserByNick(nick){
  const users = loadUsers();
  return users.find(u => u.nickname === nick);
}
function updateUser(nick, newData){
  const users = loadUsers();
  const idx = users.findIndex(u => u.nickname === nick);
  if(idx>=0){
    users[idx] = {...users[idx], ...newData};
    saveUsers(users);
    return true;
  }
  return false;
}

// count display (registered users)
function updateUserCountDisplay(){
  const el = document.getElementById('user-count-display');
  if(!el) return;
  const users = loadUsers();
  el.textContent = `${users.length} ผู้ใช้`;
}

// Register page logic
function initRegister(){
  const form = qs('#register-form');
  if(!form) return;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const nickname = qs('#reg-nick').value.trim();
    const password = qs('#reg-pass').value;
    const gender = qs('#reg-gender').value;
    const day = qs('#reg-day').value;
    const month = qs('#reg-month').value;
    const year = qs('#reg-year').value;
    const status = qs('#reg-status').value.trim();
    const err = qs('#reg-err');
    err.textContent = '';
    if(!nickname || !password){ err.textContent = 'กรุณากรอกชื่อเล่นและรหัสผ่าน'; return; }
    if(findUserByNick(nickname)){ err.textContent = 'ชื่อนี้มีคนใช้แล้ว ลองชื่ออื่น'; return; }
    const dob = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const users = loadUsers();
    users.push({
      nickname,
      password, // NOTE: ในระบบโปรดักชันต้องเข้ารหัส แต่ตัวอย่างนี้เก็บ plaintext เพื่อเดโม
      gender, dob, status,
      createdAt: Date.now()
    });
    saveUsers(users);
    qs('#reg-success').textContent = 'สมัครเรียบร้อย! กลับไปที่หน้า Login';
    updateUserCountDisplay();
    form.reset();
  });
}

// Login page logic
function initLogin(){
  const form = qs('#login-form');
  if(!form) return;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const nick = qs('#login-nick').value.trim();
    const pass = qs('#login-pass').value;
    const err = qs('#login-err');
    err.textContent = '';
    const u = findUserByNick(nick);
    if(!u || u.password !== pass){ err.textContent = 'รหัสหรือชื่อเล่นไม่ถูกต้อง'; return; }
    setSession(nick);
    // redirect to profile
    window.location.href = 'profile.html';
  });
}

// Profile page logic
function initProfile(){
  const session = getSession();
  if(!session){ window.location.href = 'login.html'; return; }
  const user = findUserByNick(session.nick);
  if(!user){ clearSession(); window.location.href='login.html'; return; }
  // fill fields
  qs('#profile-nick').textContent = user.nickname;
  qs('#profile-gender').value = user.gender || '';
  const [y,m,d] = (user.dob || '').split('-');
  qs('#profile-day').value = d || '';
  qs('#profile-month').value = m || '';
  qs('#profile-year').value = y || '';
  qs('#profile-status').value = user.status || '';
  const msg = qs('#profile-msg');
  msg.textContent = '';
  qs('#profile-form').addEventListener('submit', (e)=>{
    e.preventDefault();
    const gender = qs('#profile-gender').value;
    const day = qs('#profile-day').value;
    const month = qs('#profile-month').value;
    const year = qs('#profile-year').value;
    const status = qs('#profile-status').value.trim();
    const dob = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    updateUser(user.nickname, {gender, dob, status});
    msg.textContent = 'บันทึกเรียบร้อย';
    setTimeout(()=>msg.textContent='',2500);
  });
  qs('#logout-btn').addEventListener('click', ()=>{
    clearSession();
    window.location.href = 'login.html';
  });
}

// Index page small user info and nav
function initIndex(){
  const session = getSession();
  const el = qs('#whoami');
  if(el){
    if(session){
      el.innerHTML = `ล็อกอินด้วย <strong>${session.nick}</strong> | <button id="quick-logout" class="logout">ออก</button>`;
      qs('#quick-logout').addEventListener('click', ()=>{
        clearSession();
        window.location.reload();
      });
    } else {
      el.innerHTML = `<a href="login.html">เข้าสู่ระบบ</a> · <a href="register.html">สมัครสมาชิก</a>`;
    }
  }
}

// populate day/month/year selects
function fillDateSelects(root){
  const day = qs('.sel-day', root);
  const month = qs('.sel-month', root);
  const year = qs('.sel-year', root);
  if(day && day.children.length===0){
    for(let i=1;i<=31;i++){ const o = document.createElement('option'); o.value = i; o.textContent = i; day.appendChild(o); }
  }
  if(month && month.children.length===0){
    for(let i=1;i<=12;i++){ const o = document.createElement('option'); o.value = i; o.textContent = i; month.appendChild(o); }
  }
  if(year && year.children.length===0){
    const now = new Date().getFullYear();
    for(let y = now; y>=1900; y--){ const o = document.createElement('option'); o.value = y; o.textContent = y; year.appendChild(o); }
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', ()=>{
  updateUserCountDisplay();
  fillDateSelects(document);
  initRegister();
  initLogin();
  initProfile();
  initIndex();
});