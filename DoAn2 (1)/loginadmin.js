// loginadmin.js — Bắt buộc đăng nhập bằng kho tg.admins.v3 (SHA-256)
document.addEventListener('DOMContentLoaded', () => {
  const KEYS = { ADMINS: 'tg.admins.v3', SESSION: 'tg.session.v1' };

  // SHA-256 để so khớp với passwordHash đã lưu
  async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  // Seed tài khoản demo nếu kho chưa có (khớp với admin.js)
  async function ensureAdmins() {
    if (!localStorage.getItem(KEYS.ADMINS)) {
      const adminHash = await sha256('admin123');
      const staffHash = await sha256('staff123');
      const uid = (p='id') => `${p}_${Math.random().toString(36).slice(2,10)}`;
      localStorage.setItem(KEYS.ADMINS, JSON.stringify([
        { id: uid('adm'), name:'Super Admin',  email:'admin@demo.io', role:'superadmin', status:'active',  passwordHash: adminHash, createdAt: Date.now() },
        { id: uid('adm'), name:'Support Staff',email:'staff@demo.io',  role:'staff',      status:'active',  passwordHash: staffHash, createdAt: Date.now() }
      ]));
    }
  }

  function getAdmins() {
    try { return JSON.parse(localStorage.getItem(KEYS.ADMINS)) || []; }
    catch { return []; }
  }

  function setSession(admin) {
    // session 2 giờ
    const sess = {
      userId: admin.id, name: admin.name, email: admin.email, role: admin.role,
      loginAt: Date.now(), exp: Date.now() + 2*60*60*1000
    };
    localStorage.setItem(KEYS.SESSION, JSON.stringify(sess));
    // Giữ tương thích với home.js đang hiển thị tên bằng ticketgoUser
    localStorage.setItem('ticketgoUser', admin.name || admin.email);
  }

  function getNext() {
    const p = new URLSearchParams(location.search);
    return p.get('next') || 'admin.html';
    }

  // --- handle submit ---
  document.querySelector('.admin-login-box').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value.trim().toLowerCase();
    const password = document.getElementById('admin-password').value;
    const errorMsg = document.getElementById('errorMsg');

    await ensureAdmins();
    const admins = getAdmins();
    const acc = admins.find(a => a.email.toLowerCase() === email);

    if (!acc || acc.status !== 'active') {
      errorMsg.textContent = 'Tài khoản không tồn tại hoặc đã bị khoá.';
      errorMsg.style.display = 'block';
      return;
    }

    const ok = (await sha256(password)) === acc.passwordHash;
    if (!ok) {
      errorMsg.textContent = 'Email hoặc mật khẩu không đúng!';
      errorMsg.style.display = 'block';
      return;
    }

    setSession(acc);
    // Login xong -> về admin
    window.location.replace(getNext());
  });
});
