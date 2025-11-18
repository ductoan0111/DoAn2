/* === CART BADGE HELPER === */
window.updateCartBadge = function(){
  try{
    const badge = document.getElementById('cartBadge');
    if(!badge) return;
    const orders = JSON.parse(localStorage.getItem('ticketgoOrders') || '[]');
    const count = orders.length;  // đếm số ĐƠN (có thể đổi sang tổng vé nếu muốn)
    if(count > 0){
      badge.textContent = count;
      badge.hidden = false;
      // hiệu ứng nảy
      badge.classList.remove('bump');
      void badge.offsetWidth;
      badge.classList.add('bump');
    }else{
      badge.hidden = true;
    }
  }catch(_e){}
};

// set badge khi trang tải xong
document.addEventListener('DOMContentLoaded', () => window.updateCartBadge());

// ============ HAMBURGER / ACCOUNT MENU ============
document.addEventListener('DOMContentLoaded', () => {
  const burger = document.querySelector('.hamburger');
  const menu = document.getElementById('accountMenu');
  if (!burger || !menu) return;

  const closeMenu = () => {
    menu.style.display = 'none';
    menu.setAttribute('aria-hidden','true');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  };
  const toggleMenu = () => {
    const willOpen = menu.style.display !== 'block';
    menu.style.display = willOpen ? 'block' : 'none';
    menu.setAttribute('aria-hidden', willOpen ? 'false' : 'true');
    burger.classList.toggle('is-open', willOpen);
    burger.setAttribute('aria-expanded', String(willOpen));
  };

  burger.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(); });
  document.addEventListener('click', (e) => { if (!menu.contains(e.target) && !burger.contains(e.target)) closeMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth >= 768) closeMenu(); });
});


// ============ CHECKOUT + PAYMENT ============
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('checkout');
  const openBtn = document.getElementById('btnOpenCheckout');

  // Map & tính toán
  const cart = document.getElementById('cartList');
  const totalEl = document.getElementById('cartTotal');
  const coForm = document.getElementById('coForm');

  // Nút & Result modal
  const payBtn = modal?.querySelector('.btn--primary');
  const result = document.getElementById('payResult');
  const resultMsg = document.getElementById('payResultMsg');

  // ===== Utils =====
  const fmt = (n) => n.toLocaleString('vi-VN') + ' VNĐ';
  const toast = (msg, type='success') => {
    const t = document.createElement('div');
    t.className = `toast toast--${type}`;
    t.setAttribute('role','status');
    t.setAttribute('aria-live','polite');
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('is-in'));
    setTimeout(() => {
      t.classList.remove('is-in');
      t.addEventListener('transitionend', () => t.remove(), { once:true });
    }, 2800);
  };

  const open = () => {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    updateTotal();
  };
  const close = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  };

  const getCartSummary = () => {
    let total = 0, qty = 0, items = [];
    cart.querySelectorAll('.item').forEach(item=>{
      const price = +item.dataset.price || 0;
      const q = +item.querySelector('.qty-input').value || 0;
      if(q>0){
        items.push({
          name: item.querySelector('.item__name')?.textContent?.trim() || 'Vé',
          qty: q,
          price
        });
        total += price * q;
        qty += q;
      }
      // enable/disable nút
      const dec = item.querySelector('[data-dec]');
      const inc = item.querySelector('[data-inc]');
      if (dec) dec.disabled = q <= 0;
      if (inc) inc.disabled = q >= 10; // giới hạn tối đa 10/vé
    });
    return { total, qty, items };
  };

  const updateTotal = () => { totalEl.textContent = fmt(getCartSummary().total); };

  // Mở/đóng modal checkout
  openBtn?.addEventListener('click', open);
  modal?.addEventListener('click', (e)=>{
    if (e.target.matches('[data-close], [data-close] *') || e.target.classList.contains('checkout__overlay')) close();
  });
  window.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && modal.classList.contains('is-open')) close(); });

  // Giỏ hàng: +/- số lượng
  cart.addEventListener('click', (e)=>{
    const btn = e.target.closest('.qty-btn');
    if(!btn) return;
    const item = btn.closest('.item');
    const input = item.querySelector('.qty-input');
    let val = +input.value || 0;
    if(btn.hasAttribute('data-inc')) val++;
    if(btn.hasAttribute('data-dec')) val = Math.max(0, val-1);
    input.value = val;
    updateTotal();
  });

  // ====== PAYMENT FLOW ======
  const setPayLoading = (loading) => {
    if(!payBtn) return;
    if(loading){
      payBtn.disabled = true;
      payBtn.dataset._txt = payBtn.textContent;
      payBtn.textContent = 'Đang xử lý...';
    }else{
      payBtn.disabled = false;
      payBtn.textContent = payBtn.dataset._txt || 'Thanh toán';
    }
  };

  const openResult = (orderId, total, qty) => {
    if(!result){ 
      alert(`Thanh toán thành công!\nMã đơn: ${orderId}\nTổng: ${fmt(total)}\nSố vé: ${qty}`);
      return;
    }
    resultMsg.innerHTML = `Mã đơn: <b>${orderId}</b><br>Tổng tiền: <b>${fmt(total)}</b><br>Số vé: <b>${qty}</b>`;
    result.classList.add('is-open');
    result.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  };

  result?.addEventListener('click', (e)=>{
    if (e.target.matches('[data-close], [data-close] *') || e.target.classList.contains('result__overlay')){
      result.classList.remove('is-open');
      result.setAttribute('aria-hidden','true');
      document.body.style.overflow = '';
    }
  });

  // Click Thanh toán
  payBtn?.addEventListener('click', () => {
    // 1) Form hợp lệ?
    if (!coForm.reportValidity()){
      toast('Vui lòng điền đầy đủ thông tin khách hàng.', 'error');
      return;
    }

    // 2) Có chọn vé?
    const summary = getCartSummary();
    if (summary.qty <= 0){
      toast('Bạn chưa chọn vé nào.', 'error');
      return;
    }

    // 3) Giả lập xử lý thanh toán
    setPayLoading(true);
    setTimeout(() => {
      const orderId = 'TG' + Math.random().toString(36).slice(2, 8).toUpperCase();

      // 4) LƯU ĐƠN HÀNG VÀO localStorage
      try {
        const key = 'ticketgoOrders';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');

        const fd = new FormData(coForm);
        const customer = {
          fullName: fd.get('fullName') || '',
          phone: fd.get('phone') || '',
          email: fd.get('email') || '',
          address: fd.get('address') || ''
        };

        const order = {
          id: orderId,
          createdAt: new Date().toISOString(),
          total: summary.total,
          qty: summary.qty,
          items: summary.items,
          customer
        };
        existing.unshift(order);
        localStorage.setItem(key, JSON.stringify(existing));
        // >>> CẬP NHẬT BADGE GIỎ HÀNG <<<
        window.updateCartBadge && window.updateCartBadge();
      } catch (e) {
        console.warn('Cannot persist order to localStorage', e);
      }

      // 5) Đóng checkout, mở Result + reset giỏ
      close();
      openResult(orderId, summary.total, summary.qty);
      toast('Thanh toán thành công!', 'success');
      cart.querySelectorAll('.qty-input').forEach(inp => inp.value = 0);
      updateTotal();
      setPayLoading(false);
    }, 1100);
  });
});


// ============ ACCOUNT AREA (hiện icon giỏ hàng khi đã đăng nhập) ============
document.addEventListener('DOMContentLoaded', () => {
  const actions = document.querySelector('.actions');
  const user = localStorage.getItem('ticketgoUser');
  if (actions && user) {
    actions.innerHTML = `
      <a class="cart-icon" href="orders.html" aria-label="Đơn hàng" title="Đơn hàng">
        <i class="fa-solid fa-cart-shopping" aria-hidden="true"></i>
        <span id="cartBadge" class="cart-badge" hidden>0</span>
      </a>
      <span class="user-name" style="display:flex; align-items:center; font-size: 1rem; font-weight:600;">
        <svg width="22" height="22" viewBox="0 0 32 32" style="vertical-align:middle;margin-right:6px;">
          <circle cx="16" cy="11" r="7" fill="#ccc"/>
          <ellipse cx="16" cy="24" rx="12" ry="7" fill="#ccc"/>
        </svg>
        ${user}
      </span>
      <a href="#" class="logout-link" style="font-size:1rem; font-weight:600; margin-left:18px;">Đăng xuất</a>
    `;

    // logout
    actions.querySelector('.logout-link').addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('ticketgoUser');
      window.location.href = 'login.html';
    });

    // cập nhật badge sau khi render
    window.updateCartBadge && window.updateCartBadge();
  }
});

