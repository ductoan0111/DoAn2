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
});
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