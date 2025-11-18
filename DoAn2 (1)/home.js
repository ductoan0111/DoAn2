document.addEventListener('DOMContentLoaded', () => {
  const burger = document.querySelector('.hamburger');
  const menu = document.getElementById('accountMenu');

  if (!burger || !menu) return;

  function closeMenu() {
    menu.style.display = 'none';
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  }

  function toggleMenu() {
    const willOpen = menu.style.display !== 'block';
    menu.style.display = willOpen ? 'block' : 'none';
    burger.classList.toggle('is-open', willOpen);
    burger.setAttribute('aria-expanded', String(willOpen));
  }

  burger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Click ngoài để đóng
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !burger.contains(e.target)) closeMenu();
  });

  // Lên desktop thì ẩn menu mobile
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) closeMenu();
  });
  // ====== Xử lý nút "XEM THÊM CÁC SỰ KIỆN KHÁC" (đã sửa) ======
const seeMoreBtn = document.querySelector('.see-more-btn');
const extraEventsSection = document.getElementById('extra-events');
const extraEventsGrid = document.getElementById('extraEventsGrid');

// Key dữ liệu của Admin
const KEY_PRODUCTS = 'tg.products.v4';

// Escape HTML an toàn cho text
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));
}

// Lấy danh sách sản phẩm đang bán (active) từ localStorage của Admin
function getActiveProducts(){
  const list = JSON.parse(localStorage.getItem(KEY_PRODUCTS) || '[]');
  return list.filter(p => (p.status || '').toLowerCase() === 'active');
}

// Render lưới sự kiện bổ sung theo kiểu .cat-grid
function renderExtraEvents(){
  if (!extraEventsSection || !extraEventsGrid) return;
  const activeProducts = getActiveProducts();

  extraEventsGrid.innerHTML = activeProducts.length
    ? activeProducts.map(p => `
        <article class="cat-card">
          <img src="${(p.image || '').trim() || 'https://placehold.co/400x240?text=No+Image'}"
               alt="${escapeHtml(p.name || 'Sự kiện')}" loading="lazy">
          <p>${escapeHtml(p.name || '[Chưa đặt tên]')}</p>
        </article>
      `).join('')
    : '<p style="color:#fff;text-align:center;">Chưa có sự kiện nào đang bán.</p>';

  extraEventsSection.style.display = 'block';
}

if (seeMoreBtn && extraEventsSection && extraEventsGrid) {
  seeMoreBtn.addEventListener('click', (e) => {
    e.preventDefault();
    renderExtraEvents();
    // ẩn nút sau khi đổ
    seeMoreBtn.style.display = 'none';
    // cuộn mượt xuống khu vực mới
    extraEventsSection.scrollIntoView({ behavior: 'smooth' });
  });

  // TỰ ĐỘNG CẬP NHẬT LIVE nếu tab Admin vừa ghi đè tg.products.v3
  window.addEventListener('storage', (e) => {
    const isOpen = extraEventsSection.style.display === 'block';
    if (isOpen && e.key === KEY_PRODUCTS) {
      renderExtraEvents();
    }
  });
}

  // Hero slider auto
  const slides = document.querySelectorAll('.hero .slide');
  const dots = document.querySelectorAll('.hero .dot');
  let current = 0;
  let timer;

  function showSlide(idx) {
  slides.forEach((s, i) => s.classList.toggle('active', i === idx));
  dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  current = idx;
  }

  function nextSlide() {
    let idx = (current + 1) % slides.length;
    showSlide(idx);
  }

  function startAuto() {
    timer = setInterval(nextSlide, 1500);
  }

  function stopAuto() {
    clearInterval(timer);
  }

  if (slides.length && dots.length) {
    showSlide(0);
    startAuto();

    // Click dot để chuyển slide
    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        showSlide(idx);
        stopAuto();
        startAuto();
      });
    });

    // Dừng khi hover slider
    const slider = document.querySelector('.hero .slider');
    if (slider) {
      slider.addEventListener('mouseenter', stopAuto);
      slider.addEventListener('mouseleave', startAuto);
    }
  }
}
);
document.addEventListener('DOMContentLoaded', () => {
  const actions = document.querySelector('.actions');
  const user = localStorage.getItem('ticketgoUser');
  if (actions && user) {
    actions.innerHTML = `
      <span class="user-name" style="display: flex; align-items: center; font-size: 1rem; font-weight: 600;">
        <svg width="22" height="22" viewBox="0 0 32 32" style="vertical-align:middle;margin-right:6px;">
          <circle cx="16" cy="11" r="7" fill="#ccc"/>
          <ellipse cx="16" cy="24" rx="12" ry="7" fill="#ccc"/>
        </svg>
        ${user}
      </span>
      <a href="#" class="logout-link" style="font-size: 1rem; font-weight: 600; margin-left: 18px;">Đăng xuất</a>
    `;
    actions.querySelector('.logout-link').addEventListener('click', function(e) {
      e.preventDefault();
      localStorage.removeItem('ticketgoUser');
      window.location.href = 'login.html';
    });
  }
});

