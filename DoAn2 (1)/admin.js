/* ===== Auth Guard: chặn vào admin nếu chưa đăng nhập ===== */
(function authGuard(){
  const SESSION_KEY = 'tg.session.v1';
  let sess = null;
  try { sess = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch {}
  const expired = !!(sess && sess.exp && Date.now() > sess.exp);

  if (!sess || expired) {
    localStorage.removeItem(SESSION_KEY);
    // Điều hướng về trang login, giữ tham số next để quay lại
    const next = 'admin.html';
    window.location.replace(`loginadmin.html?next=${encodeURIComponent(next)}`);
    // chặn các script admin tiếp tục chạy
    throw new Error('AuthRequired');
  }

  // Xuất nhẹ session cho các đoạn dưới dùng
  window.__TG_SESSION__ = sess;
})();
// ==== Header bind session + Logout ====
const SESSION_KEY = 'tg.session.v1';
const sess = window.__TG_SESSION__ || JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');

try {
  const nm = document.getElementById('userName');
  const rl = document.getElementById('userRole');
  if (nm) nm.textContent = (sess?.name || sess?.email || 'Admin');
  if (rl) rl.textContent = (sess?.role || 'staff');

  // chèn nút Logout nếu chưa có
  const menu = document.getElementById('accountMenu');
  if (menu && !menu.querySelector('#logoutLink')) {
    menu.insertAdjacentHTML('beforeend',
      `<a href="#" id="logoutLink" role="menuitem"><i class="fa fa-right-from-bracket"></i> Đăng xuất</a>`);
  }
  document.getElementById('logoutLink')?.addEventListener('click', (e)=>{
    e.preventDefault();
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('ticketgoUser'); // cho Home
    window.location.replace('loginadmin.html');
  });

  // Ẩn/hiện mục chỉ dành cho superadmin
  document.querySelectorAll('.only-super').forEach(el=>{
    el.style.display = (sess?.role === 'superadmin') ? '' : 'none';
  });
} catch {}

/* TicketGo Admin — v3.1 (no-login)
   Modules: Dashboard, Products, Orders, Customers, Admins
   Data: localStorage; Passwords: SHA-256 (chỉ để quản lý admin demo) */

(() => {
  // ====== Keys & Utils ======
  const KEYS = {
    PRODUCTS: 'tg.products.v4',
    ORDERS: 'tg.orders.v4',
    CUSTOMERS: 'tg.customers.v4',
    ADMINS: 'tg.admins.v4',
    THEME: 'tg.theme'
  };

  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const uid = (p='id') => `${p}_${Math.random().toString(36).slice(2,10)}`;
  const money = v => new Intl.NumberFormat('vi-VN').format(+v||0) + ' đ';
  const fmtDT = (d) => {
    const dt = new Date(d);
    const y = dt.getFullYear(), m = String(dt.getMonth()+1).padStart(2,'0'), day = String(dt.getDate()).padStart(2,'0');
    const hh = String(dt.getHours()).padStart(2,'0'), mm = String(dt.getMinutes()).padStart(2,'0');
    return `${day}/${m}/${y} ${hh}:${mm}`;
  };
  async function sha256(str){
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  const store = {
    get: (k, d=[]) => { try{ return JSON.parse(localStorage.getItem(k)) ?? d; } catch{ return d; } },
    set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
  };
  const toast = $('#toast');
  function showToast(msg, type='info'){
    if (!toast) return;
    toast.textContent = msg;
    toast.style.borderColor = type === 'error' ? '#e5484d55' : '#ffffff1a';
    toast.classList.add('is-show');
    setTimeout(()=>toast.classList.remove('is-show'), 1800);
  }

  // ====== Seed demo data ======
  (async function seed(){
    if (!localStorage.getItem(KEYS.ADMINS)) {
      const adminHash = await sha256('admin123');
      const staffHash = await sha256('staff123');
      store.set(KEYS.ADMINS, [
        { id: uid('adm'), name:'Super Admin', email:'admin@demo.io', role:'superadmin', status:'active', passwordHash: adminHash, createdAt: Date.now() },
        { id: uid('adm'), name:'Support Staff', email:'staff@demo.io', role:'staff', status:'active', passwordHash: staffHash, createdAt: Date.now() }
      ]);
    }
    if (!localStorage.getItem(KEYS.PRODUCTS)) {
      store.set(KEYS.PRODUCTS, [
        { id: uid('prd'), name:'Concert Indie Night', category:'Concert', price:350000, stock:120, status:'active', image:'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1400&auto=format&fit=crop', desc:'Đêm nhạc Indie ấm áp.' },
        { id: uid('prd'), name:'Workshop Gốm cơ bản', category:'Workshop', price:250000, stock:40, status:'active', image:'https://images.unsplash.com/photo-1589985270826-4b5b3a2b2445?q=80&w=1400&auto=format&fit=crop', desc:'Làm gốm cuối tuần.' },
        { id: uid('prd'), name:'Tour Phú Quốc 3N2Đ', category:'Travel', price:2890000, stock:20, status:'draft', image:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1400&auto=format&fit=crop', desc:'Biển xanh cát trắng.' },
        { id: uid('prd'), name:'Vé Bóng đá Derby', category:'Sport', price:450000, stock:60, status:'active', image:'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1400&auto=format&fit=crop', desc:'Trận cầu nảy lửa.' }
      ]);
    }
    if (!localStorage.getItem(KEYS.CUSTOMERS)) {
      store.set(KEYS.CUSTOMERS, [
        { id: uid('cus'), name:'Nguyễn Minh', email:'minh@example.com', phone:'0901234567', status:'active', note:'' },
        { id: uid('cus'), name:'Trần Hoa', email:'hoa@example.com', phone:'0902223344', status:'active', note:'' },
        { id: uid('cus'), name:'Lê Tuấn', email:'tuan@example.com', phone:'0909988776', status:'blocked', note:'Spam nhiều' },
        { id: uid('cus'), name:'Phạm Linh', email:'linh@example.com', phone:'0905554443', status:'active', note:'' }
      ]);
    }
    if (!localStorage.getItem(KEYS.ORDERS)) {
      const prods = store.get(KEYS.PRODUCTS);
      const custs = store.get(KEYS.CUSTOMERS);
      const pick = (arr,i) => arr[i % arr.length];
      const now = new Date();
      const mk = (i, st='paid') => {
        const p = pick(prods,i);
        const c = pick(custs,i+1);
        const qty = (i%3)+1;
        const dt = new Date(now.getFullYear(), now.getMonth()-i, 4+i, 10+i, 20);
        return {
          id: uid('ord'),
          code: `ORD-${(100000+i)}`,
          customerId: c.id, productId: p.id, qty,
          unitPrice: p.price, amount: p.price*qty,
          status: st, createdAt: dt.getTime()
        };
      };
      store.set(KEYS.ORDERS, [
        mk(0,'paid'), mk(1,'paid'), mk(2,'pending'), mk(3,'paid'),
        mk(4,'paid'), mk(5,'refunded'), mk(6,'cancelled'), mk(7,'paid')
      ]);
    }
  })();

  // ====== Theme ======
  const themeToggle = $('#themeToggle');
  function setTheme(mode){
    const isLight = mode==='light';
    document.documentElement.classList.toggle('light', isLight);
    const i = themeToggle?.querySelector('i'); if (i){ i.className = 'fa ' + (isLight?'fa-sun':'fa-moon'); }
    localStorage.setItem(KEYS.THEME, isLight?'light':'dark');
  }
  setTheme(localStorage.getItem(KEYS.THEME) || 'dark');
  themeToggle?.addEventListener('click', ()=> setTheme(document.documentElement.classList.contains('light')?'dark':'light'));

  // ====== Navigation ======
  const navItems = $$('.nav__item');
  function currentView(){ return location.hash.replace('#',''); }
  function activateView(view){
    navItems.forEach(a => a.classList.toggle('is-active', a.dataset.view===view));
    $$('.view').forEach(v => v.classList.toggle('is-show', v.id === `view-${view}`));
    switch(view){
      case 'dashboard': renderDashboard(); break;
      case 'events': renderProducts(); break;
      case 'orders': renderOrders(); break;
      case 'customers': renderCustomers(); break;
      case 'admins': renderAdmins(); break;
    }
    location.hash = view;
  }
  navItems.forEach(a => a.addEventListener('click', ()=> activateView(a.dataset.view)));
  window.addEventListener('hashchange', ()=> activateView(currentView()||'dashboard'));

  // ====== Header user menu (giữ dropdown cơ bản) ======
  const userMenu = $('#userMenu'); const avatarBtn = $('#avatarBtn');
  avatarBtn?.addEventListener('click', (e)=>{ e.stopPropagation(); userMenu.classList.toggle('open'); });
  document.addEventListener('click', (e)=>{ if(!userMenu.contains(e.target)) userMenu.classList.remove('open'); });

  // Hiển thị luôn mục chỉ-superadmin
  $$('.only-super').forEach(el => el.style.display = '');

  // ====== Data helpers ======
  const DB = {
    products: () => store.get(KEYS.PRODUCTS),
    setProducts: (v) => store.set(KEYS.PRODUCTS, v),
    orders: () => store.get(KEYS.ORDERS),
    setOrders: (v) => store.set(KEYS.ORDERS, v),
    customers: () => store.get(KEYS.CUSTOMERS),
    setCustomers: (v) => store.set(KEYS.CUSTOMERS, v),
    admins: () => store.get(KEYS.ADMINS),
    setAdmins: (v) => store.set(KEYS.ADMINS, v),
  };

  // ====== Modal engine ======
  const modal = $('#modal'); const modalTitle = $('#modalTitle');
  const modalForm = $('#modalForm');
  function openModal(title, html, onSubmit){
    modalTitle.textContent = title;
    modalForm.innerHTML = html;
    modal.classList.add('is-open'); modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    setTimeout(()=> $('input,select,textarea', modalForm)?.focus(), 0);
    modalForm.onsubmit = async (e) => { e.preventDefault(); await onSubmit(new FormData(modalForm)); };
  }
  function closeModal(){
    modal.classList.remove('is-open'); modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = ''; modalForm.onsubmit = null;
  }
  modal.addEventListener('click', (e)=>{ if (e.target.dataset.close==='true') closeModal(); });
  document.addEventListener('keydown', (e)=>{ if (e.key==='Escape' && modal.classList.contains('is-open')) closeModal(); });

  /* ===== Neo Dashboard: metrics + charts ===== */
function renderDashboard(){
  const orders   = DB.orders();
  const products = DB.products();
  const customers= DB.customers();

  // ---- KPIs ----
  const paid = orders.filter(o=>o.status==='paid');
  const revenue = paid.reduce((s,o)=>s+o.amount,0);
  $('#kpiRevenue').textContent  = money(revenue);
  $('#kpiOrders').textContent   = paid.length;
  $('#kpiTickets').textContent  = products.filter(p=>p.status==='active').length;
  $('#kpiCustomers').textContent= customers.length;

  // Deltas vs. tháng trước
  const now = new Date();
  const rNow  = sumMonthRevenue(orders, now.getFullYear(), now.getMonth());
  const prev  = new Date(now.getFullYear(), now.getMonth()-1, 1);
  const rPrev = sumMonthRevenue(orders, prev.getFullYear(), prev.getMonth());
  setDelta($('#kpiRevenueDelta'), rNow, rPrev, 'so với T-1');

  const countNow  = countMonthPaid(orders, now.getFullYear(), now.getMonth());
  const countPrev = countMonthPaid(orders, prev.getFullYear(), prev.getMonth());
  setDelta($('#kpiOrdersDelta'), countNow, countPrev, 'so với T-1');

  // ---- Top products table ----
  const revenueByProd = {};
  paid.forEach(o => { revenueByProd[o.productId] = (revenueByProd[o.productId]||0) + o.amount; });
  const topRows = Object.entries(revenueByProd)
    .sort((a,b)=>b[1]-a[1]).slice(0,6)
    .map(([pid,rev])=>{
      const p = products.find(x=>x.id===pid) || { name:'[Đã xoá]', category:'-' };
      return `<tr><td data-label="Tên">${p.name}</td><td data-label="Danh mục">${p.category||'-'}</td><td data-label="Doanh thu" style="text-align:right">${money(rev)}</td></tr>`;
    }).join('') || `<tr><td colspan="3" style="text-align:center;padding:18px">Chưa có dữ liệu</td></tr>`;
  $('#topProducts').innerHTML = topRows;

  // ---- Revenue last 6 months ----
  const labels = [], data = [];
  for(let i=5;i>=0;i--){
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    labels.push(`${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getFullYear()).slice(-2)}`);
    data.push(sumMonthRevenue(orders, d.getFullYear(), d.getMonth()));
  }
  drawLineAreaChart($('#chartRevenue'), labels, data);

  // ---- Order status donut ----
  const byStatus = groupBy(orders, o=>o.status);
  const donutData = [
    {label:'Đã thanh toán', key:'paid',      value:(byStatus.paid||[]).length,      color:'#22c55e'},
    {label:'Chờ thanh toán', key:'pending',  value:(byStatus.pending||[]).length,   color:'#fbbf24'},
    {label:'Đã hoàn',        key:'refunded', value:(byStatus.refunded||[]).length,  color:'#60a5fa'},
    {label:'Đã hủy',         key:'cancelled',value:(byStatus.cancelled||[]).length, color:'#ef4444'},
  ];
  drawDonutChart($('#chartOrders'), donutData, $('#legendOrders'));

  // ---- Category revenue bar ----
  const catMap = {};
  paid.forEach(o=>{
    const p = products.find(x=>x.id===o.productId);
    const cat = p?.category || 'Khác';
    catMap[cat] = (catMap[cat]||0) + o.amount;
  });
  const catLabels = Object.keys(catMap);
  const catVals   = catLabels.map(k=>catMap[k]);
  drawBarChart($('#chartCategories'), catLabels, catVals);
}

/* ===== Helpers for dashboard ===== */
function sumMonthRevenue(orders, year, monthIdx){
  return orders.filter(o=>{
    if(o.status!=='paid') return false;
    const d = new Date(o.createdAt);
    return d.getFullYear()===year && d.getMonth()===monthIdx;
  }).reduce((s,o)=>s+o.amount,0);
}
function countMonthPaid(orders, year, monthIdx){
  return orders.filter(o=>{
    if(o.status!=='paid') return false;
    const d = new Date(o.createdAt);
    return d.getFullYear()===year && d.getMonth()===monthIdx;
  }).length;
}
function setDelta(el, nowVal, prevVal, suffix){
  const diff = nowVal - prevVal;
  const pct = prevVal===0 ? (nowVal>0?100:0) : (diff/prevVal*100);
  if (diff>0){ el.className='kpi-delta up';   el.textContent = `▲ +${pct.toFixed(0)}% ${suffix}`; }
  else if (diff<0){ el.className='kpi-delta down'; el.textContent = `▼ ${pct.toFixed(0)}% ${suffix}`; }
  else { el.className='kpi-delta muted'; el.textContent = `— ${suffix}`; }
}
function groupBy(arr, fn){
  return arr.reduce((acc,x)=>{ const k=fn(x); (acc[k]||(acc[k]=[])).push(x); return acc; },{});
}

/* ===== Canvas utils (responsive, retina) ===== */
function prepCanvas(canvas, height=280){
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || canvas.parentElement.clientWidth || 600;
  const h = height;
  canvas.width  = Math.max(1, Math.floor(width * dpr));
  canvas.height = Math.max(1, Math.floor(h * dpr));
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  return { ctx, W: width, H: h };
}

/* ===== Charts ===== */
function drawLineAreaChart(canvas, labels, data){
  const {ctx,W,H} = prepCanvas(canvas, parseInt(getComputedStyle(canvas).height) || 280);
  ctx.clearRect(0,0,W,H);
  const pad = {t:18,r:16,b:28,l:44};
  const max = Math.max(...data, 1);
  const nice = Math.ceil(max / 4 / 1000) * 1000; // bậc thang
  const maxV = Math.max(nice*4, 1);
  const xStep = (W - pad.l - pad.r) / (Math.max(1,data.length-1));
  const y = v => H - pad.b - (v/maxV)*(H - pad.t - pad.b);

  // grid + y labels
  ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1;
  ctx.fillStyle = '#9aa6af'; ctx.font = '12px system-ui';
  for(let i=0;i<=4;i++){
    const gy = pad.t + i*(H-pad.t-pad.b)/4;
    ctx.beginPath(); ctx.moveTo(pad.l, gy); ctx.lineTo(W-pad.r, gy); ctx.stroke();
    const val = (maxV*(1-i/4)).toLocaleString('vi-VN');
    ctx.fillText(val, 6, gy+4);
  }

  // area gradient
  const grad = ctx.createLinearGradient(0,pad.t,0,H-pad.b);
  grad.addColorStop(0,'rgba(79,140,255,.35)');
  grad.addColorStop(1,'rgba(79,140,255,0)');

  // area path
  ctx.beginPath();
  data.forEach((v,i)=>{ const x=pad.l+i*xStep, yy=y(v); i?ctx.lineTo(x,yy):ctx.moveTo(x,yy); });
  ctx.lineTo(pad.l + (data.length-1)*xStep, H-pad.b);
  ctx.lineTo(pad.l, H-pad.b); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();

  // line
  ctx.beginPath();
  data.forEach((v,i)=>{ const x=pad.l+i*xStep, yy=y(v); i?ctx.lineTo(x,yy):ctx.moveTo(x,yy); });
  const lineGrad = ctx.createLinearGradient(0,0,W,0);
  lineGrad.addColorStop(0,'#4f8cff'); lineGrad.addColorStop(1,'#22d3ee');
  ctx.strokeStyle = lineGrad; ctx.lineWidth = 3; ctx.stroke();

  // points
  data.forEach((v,i)=>{ const x=pad.l+i*xStep, yy=y(v);
    ctx.beginPath(); ctx.arc(x,yy,4,0,Math.PI*2); ctx.fillStyle='#0b0f14'; ctx.fill();
    ctx.lineWidth=2; ctx.strokeStyle='#4f8cff'; ctx.stroke();
  });

  // x labels
  ctx.fillStyle = '#9aa6af'; ctx.font='12px system-ui';
  labels.forEach((lb,i)=>{ const x=pad.l + i*xStep; ctx.fillText(lb, x-14, H-8); });

  // re-render once when layout size changes (simple)
  let done=false; requestAnimationFrame(()=>{ if(!done){ done=true; drawLineAreaChart(canvas, labels, data); }});
}

function drawDonutChart(canvas, items, legendEl){
  const total = items.reduce((s,i)=>s+i.value,0) || 1;
  const {ctx,W,H} = prepCanvas(canvas, parseInt(getComputedStyle(canvas).height) || 260);
  ctx.clearRect(0,0,W,H);
  const cx=W/2, cy=H/2, R=Math.min(W,H)*0.38, r=R*0.62;

  let a0 = -Math.PI/2;
  items.forEach(it=>{
    const ang = (it.value/total)*Math.PI*2;
    ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,R,a0,a0+ang); ctx.closePath();
    ctx.fillStyle = it.color; ctx.globalAlpha=.92; ctx.fill(); ctx.globalAlpha=1;
    a0 += ang;
  });

  // cut inner
  ctx.globalCompositeOperation='destination-out';
  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
  ctx.globalCompositeOperation='source-over';

  // center label
  ctx.fillStyle='#e7edf2'; ctx.font='700 18px system-ui'; ctx.textAlign='center';
  ctx.fillText(total.toLocaleString('vi-VN'), cx, cy-2);
  ctx.fillStyle='#9aa6af'; ctx.font='12px system-ui'; ctx.fillText('đơn hàng', cx, cy+14);

  // legend
  if (legendEl){
    legendEl.innerHTML = items.map(i=>
      `<li><span class="dot" style="background:${i.color}"></span><span>${i.label}</span><span style="margin-left:auto;color:#9aa6af">${i.value}</span></li>`
    ).join('');
  }
}

function drawBarChart(canvas, labels, values){
  const {ctx,W,H} = prepCanvas(canvas, parseInt(getComputedStyle(canvas).height) || 280);
  ctx.clearRect(0,0,W,H);
  const pad={t:16,r:16,b:36,l:44};
  const max=Math.max(...values,1);
  const nice=Math.ceil(max/4/1000)*1000;
  const maxV=Math.max(nice*4,1);
  const barW=(W-pad.l-pad.r)/(labels.length||1)*.65;
  const x0=pad.l + ((W-pad.l-pad.r) - (labels.length*barW + (labels.length-1)*barW*.5))/2;
  const y=v=>H-pad.b - (v/maxV)*(H-pad.t-pad.b);

  // y grid
  ctx.strokeStyle='rgba(255,255,255,.08)'; ctx.lineWidth=1;
  ctx.fillStyle='#9aa6af'; ctx.font='12px system-ui';
  for(let i=0;i<=4;i++){
    const gy=pad.t + i*(H-pad.t-pad.b)/4;
    ctx.beginPath(); ctx.moveTo(pad.l, gy); ctx.lineTo(W-pad.r, gy); ctx.stroke();
    const val=(maxV*(1-i/4)).toLocaleString('vi-VN');
    ctx.fillText(val, 6, gy+4);
  }

  // bars
  for(let i=0;i<labels.length;i++){
    const v=values[i]||0; const x=x0+i*(barW*1.5); const top=y(v);
    const grad=ctx.createLinearGradient(0,top,0,H-pad.b);
    grad.addColorStop(0,'#7c3aed'); grad.addColorStop(1,'#22d3ee');
    ctx.fillStyle=grad; ctx.fillRect(x, top, barW, (H-pad.b)-top);
    // value & label
    ctx.fillStyle='#c7d0d9'; ctx.font='12px system-ui'; ctx.textAlign='center';
    ctx.fillText((v||0).toLocaleString('vi-VN'), x+barW/2, top-6);
    ctx.fillStyle='#9aa6af';
    ctx.save(); ctx.translate(x+barW/2, H-8); ctx.rotate(-Math.PI/8);
    ctx.fillText(labels[i], 0, 0); ctx.restore();
  }
}

  // ====== Products ======
  const searchProducts = $('#searchProducts');
  const filterProdCat = $('#filterProdCat');
  const filterProdStatus = $('#filterProdStatus');
  const tbodyProducts = $('#tbodyProducts');
  function badgeStatus(st){
    const map = { active:['Đang bán','badge--active'], draft:['Bản nháp','badge--draft'], hidden:['Đã ẩn','badge--hidden'] };
    const [label, cls] = map[st] || ['N/A','']; return `<span class="badge ${cls}">${label}</span>`;
  }
  function renderProducts(){
    const q = (searchProducts.value||'').toLowerCase();
    const cat = filterProdCat.value; const st = filterProdStatus.value;
    const list = DB.products().filter(p=>{
      const t = p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      const c = !cat || p.category===cat;
      const s = !st || p.status===st;
      return t && c && s;
    });
    tbodyProducts.innerHTML = list.map(p=>`
      <tr data-id="${p.id}">
        <td data-label="Vé"><div class="cell-thumb"><img src="${p.image || 'https://placehold.co/160x120?text=No+Image'}" alt=""></div></td>
        <td data-label="Tên vé">${p.name}</td>
        <td data-label="Danh mục">${p.category}</td>
        <td data-label="Giá">${money(p.price)}</td>
        <td data-label="Tồn kho">${p.stock}</td>
        <td data-label="Trạng thái">${badgeStatus(p.status)}</td>
        <td data-label="Thao tác">
          <div class="table-actions">
            <button class="icon-btn icon-btn--edit" data-action="edit"><i class="fa fa-pen"></i></button>
            <button class="icon-btn icon-btn--del" data-action="del"><i class="fa fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('') || `<tr><td colspan="7" style="text-align:center;padding:18px">Chưa có vé nào.</td></tr>`;
  }
  [searchProducts, filterProdCat, filterProdStatus].forEach(el => el?.addEventListener('input', renderProducts));
  $('#btnAddProduct')?.addEventListener('click', ()=> openProductModal());
  $('#btnClearProducts')?.addEventListener('click', ()=>{ if (confirm('Xoá TẤT CẢ vé?')) { DB.setProducts([]); renderProducts(); showToast('Đã xoá tất cả vé'); }});
  tbodyProducts?.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-action]'); if (!btn) return;
    const id = btn.closest('tr')?.dataset.id;
    const list = DB.products(); const p = list.find(x=>x.id===id);
    if (btn.dataset.action==='edit') openProductModal(p);
    if (btn.dataset.action==='del') { if (confirm('Xoá vé này?')) { DB.setProducts(list.filter(x=>x.id!==id)); renderProducts(); showToast('Đã xoá'); } }
  });
  function openProductModal(edit=null){
    const p = edit || { name:'', category:'', price:0, stock:0, status:'active', image:'', desc:'' };
    openModal(edit?'Sửa vé':'Thêm vé', `
      <input type="hidden" name="id" value="${p.id||''}">
      <div class="form-grid">
        <div class="form-field"><label>Tên vé</label><input name="name" required value="${p.name||''}"></div>
        <div class="form-field"><label>Danh mục</label>
          <select name="category" required>
            ${['','Concert','Art','Travel','Workshop','Movie','Tour','Sport'].map(c=>`<option ${p.category===c?'selected':''} value="${c}">${c||'-- Chọn --'}</option>`).join('')}
          </select>
        </div>
        <div class="form-field"><label>Giá (VND)</label><input name="price" type="number" min="0" step="1000" required value="${p.price||0}"></div>
        <div class="form-field"><label>Tồn kho</label><input name="stock" type="number" min="0" required value="${p.stock||0}"></div>
        <div class="form-field"><label>Trạng thái</label>
          <select name="status">${['active','draft','hidden'].map(s=>`<option ${p.status===s?'selected':''} value="${s}">${s}</option>`).join('')}</select>
        </div>
        <div class="form-field"><label>Ảnh (URL)</label><input name="image" type="url" value="${p.image||''}"><small class="hint">Dán URL ảnh để hiển thị thumbnail</small></div>
        <div class="form-field form-field--full"><label>Mô tả</label><textarea name="desc" rows="3">${p.desc||''}</textarea></div>
      </div>
    `, (fd)=>{
      const item = {
        id: fd.get('id') || uid('prd'),
        name: fd.get('name').trim(),
        category: fd.get('category'),
        price: Number(fd.get('price')),
        stock: Number(fd.get('stock')),
        status: fd.get('status'),
        image: fd.get('image').trim(),
        desc: (fd.get('desc')||'').trim()
      };
      const list = DB.products(); const idx = list.findIndex(x=>x.id===item.id);
      idx>=0 ? (list[idx]=item) : list.unshift(item);
      DB.setProducts(list); renderProducts(); closeModal(); showToast(idx>=0?'Đã cập nhật':'Đã thêm'); 
    });
  }

  // ====== Orders ======
  const searchOrders = $('#searchOrders'); const filterOrderStatus = $('#filterOrderStatus');
  const tbodyOrders = $('#tbodyOrders');
  function badgeOrderStatus(s){ return `<span class="badge badge--${s}">${({pending:'Chờ thanh toán',paid:'Đã thanh toán',refunded:'Đã hoàn',cancelled:'Đã hủy'})[s]||s}</span>`; }
  function renderOrders(){
    const q = (searchOrders.value||'').toLowerCase();
    const st = filterOrderStatus.value;
    const orders = DB.orders().filter(o=>{
      const cust = DB.customers().find(c=>c.id===o.customerId);
      const hit = o.code.toLowerCase().includes(q) || (cust?.name||'').toLowerCase().includes(q);
      const s = !st || o.status===st;
      return hit && s;
    });
    const prods = DB.products(); const custs = DB.customers();
    tbodyOrders.innerHTML = orders.map(o=>{
      const p = prods.find(x=>x.id===o.productId);
      const c = custs.find(x=>x.id===o.customerId);
      return `<tr data-id="${o.id}">
        <td data-label="Mã">${o.code}</td>
        <td data-label="Khách hàng">${c?c.name:'[N/A]'}</td>
        <td data-label="Vé">${p?p.name:'[N/A]'}</td>
        <td data-label="SL">${o.qty}</td>
        <td data-label="Thành tiền">${money(o.amount)}</td>
        <td data-label="Trạng thái">${badgeOrderStatus(o.status)}</td>
        <td data-label="Thời gian">${fmtDT(o.createdAt)}</td>
        <td data-label="Thao tác">
          <div class="table-actions">
            <button class="icon-btn icon-btn--edit" data-action="edit"><i class="fa fa-pen"></i></button>
            <button class="icon-btn icon-btn--del" data-action="del"><i class="fa fa-trash"></i></button>
          </div>
        </td>
      </tr>`;
    }).join('') || `<tr><td colspan="8" style="text-align:center;padding:18px">Chưa có đơn.</td></tr>`;
  }
  [searchOrders, filterOrderStatus].forEach(el=> el?.addEventListener('input', renderOrders));
  $('#btnAddOrder')?.addEventListener('click', ()=> openOrderModal());
  $('#btnClearOrders')?.addEventListener('click', ()=>{ if (confirm('Xoá TẤT CẢ đơn?')) { DB.setOrders([]); renderOrders(); showToast('Đã xoá tất cả đơn'); }});
  tbodyOrders?.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-action]'); if (!btn) return;
    const id = btn.closest('tr')?.dataset.id;
    const orders = DB.orders(); const od = orders.find(x=>x.id===id);
    if (btn.dataset.action==='edit') openOrderModal(od);
    if (btn.dataset.action==='del') { if (confirm('Xoá đơn này?')) { DB.setOrders(orders.filter(x=>x.id!==id)); renderOrders(); showToast('Đã xoá'); } }
  });
  function openOrderModal(edit=null){
    const prods = DB.products().filter(p=>p.status!=='hidden');
    const custs = DB.customers().filter(c=>c.status==='active');
    const o = edit || { customerId:'', productId:'', qty:1, status:'pending' };
    const prodOptions = prods.map(p=>`<option value="${p.id}" ${o.productId===p.id?'selected':''} data-price="${p.price}">${p.name} (${money(p.price)})</option>`).join('');
    const custOptions = custs.map(c=>`<option value="${c.id}" ${o.customerId===c.id?'selected':''}>${c.name} - ${c.email}</option>`).join('');
    const code = edit?o.code:`ORD-${Math.floor(Math.random()*900000 + 100000)}`;
    openModal(edit?'Sửa đơn':'Tạo đơn', `
      <input type="hidden" name="id" value="${o.id||''}">
      <div class="form-grid">
        <div class="form-field"><label>Mã đơn</label><input name="code" required value="${code}"></div>
        <div class="form-field"><label>Khách hàng</label><select name="customerId" required>${custOptions}</select></div>
        <div class="form-field"><label>Vé/Sự kiện</label><select id="selProd" name="productId" required>${prodOptions}</select></div>
        <div class="form-field"><label>Số lượng</label><input id="qty" name="qty" type="number" min="1" value="${o.qty||1}"></div>
        <div class="form-field"><label>Trạng thái</label>
          <select name="status">${['pending','paid','refunded','cancelled'].map(s=>`<option ${o.status===s?'selected':''} value="${s}">${({pending:'Chờ thanh toán',paid:'Đã thanh toán',refunded:'Đã hoàn',cancelled:'Đã hủy'})[s]}</option>`).join('')}</select>
        </div>
        <div class="form-field"><label>Đơn giá</label><input id="unitPrice" name="unitPrice" type="number" readonly></div>
        <div class="form-field"><label>Thành tiền</label><input id="amount" name="amount" type="number" readonly></div>
        <div class="form-field"><label>Thời gian</label><input name="createdAt" type="datetime-local" value="${edit? new Date(o.createdAt).toISOString().slice(0,16) : new Date().toISOString().slice(0,16)}"></div>
        <div class="form-field form-field--full"><span class="hint">* Đơn giá tự điền theo vé; thành tiền = đơn giá × số lượng</span></div>
      </div>
    `, (fd)=>{
      const id = fd.get('id') || uid('ord');
      const product = DB.products().find(p=>p.id===fd.get('productId'));
      const qty = Math.max(1, Number(fd.get('qty')||1));
      const unitPrice = Number(product?.price||0);
      const amount = unitPrice * qty;
      const order = {
        id, code: fd.get('code').trim(),
        customerId: fd.get('customerId'), productId: product?.id || '',
        qty, unitPrice, amount, status: fd.get('status'),
        createdAt: new Date(fd.get('createdAt')).getTime()
      };
      const list = DB.orders(); const idx = list.findIndex(x=>x.id===id);
      idx>=0 ? (list[idx]=order) : list.unshift(order);
      DB.setOrders(list); renderOrders(); renderDashboard(); closeModal(); showToast(idx>=0?'Đã cập nhật đơn':'Đã tạo đơn');
    });
    const selProd = $('#selProd', modalForm); const qtyEl = $('#qty', modalForm);
    const priceEl = $('#unitPrice', modalForm); const amtEl = $('#amount', modalForm);
    function recalc(){ const op=selProd.selectedOptions[0]; const price=Number(op?.dataset.price||0); const qty=Math.max(1, Number(qtyEl.value||1)); priceEl.value=price; amtEl.value=price*qty; }
    selProd?.addEventListener('change', recalc); qtyEl?.addEventListener('input', recalc); recalc();
  }

  // ====== Customers ======
  const searchCustomers = $('#searchCustomers'); const filterCustomerStatus = $('#filterCustomerStatus');
  const tbodyCustomers = $('#tbodyCustomers');
  function renderCustomers(){
    const q = (searchCustomers.value||'').toLowerCase();
    const st = filterCustomerStatus.value;
    const orders = DB.orders();
    const list = DB.customers().filter(c=>{
      const t = c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
      const s = !st || c.status===st;
      return t && s;
    }).map(c=>{
      const myOrders = orders.filter(o=>o.customerId===c.id && o.status==='paid');
      const spent = myOrders.reduce((s,o)=>s+o.amount,0);
      return { ...c, orders: myOrders.length, spent };
    });
    tbodyCustomers.innerHTML = list.map(c=>`
      <tr data-id="${c.id}">
        <td data-label="Tên">${c.name}</td>
        <td data-label="Email">${c.email}</td>
        <td data-label="Điện thoại">${c.phone||''}</td>
        <td data-label="Đơn">${c.orders}</td>
        <td data-label="Chi tiêu">${money(c.spent)}</td>
        <td data-label="Trạng thái"><span class="badge ${c.status==='active'?'badge--active':'badge--hidden'}">${c.status==='active'?'Hoạt động':'Chặn'}</span></td>
        <td data-label="Thao tác">
          <div class="table-actions">
            <button class="icon-btn icon-btn--edit" data-action="edit"><i class="fa fa-pen"></i></button>
            <button class="icon-btn icon-btn--del" data-action="del"><i class="fa fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('') || `<tr><td colspan="7" style="text-align:center;padding:18px">Chưa có khách hàng.</td></tr>`;
  }
  [searchCustomers, filterCustomerStatus].forEach(el=> el?.addEventListener('input', renderCustomers));
  $('#btnAddCustomer')?.addEventListener('click', ()=> openCustomerModal());
  $('#btnClearCustomers')?.addEventListener('click', ()=>{ if (confirm('Xoá TẤT CẢ khách hàng?')) { DB.setCustomers([]); renderCustomers(); showToast('Đã xoá tất cả khách'); }});
  tbodyCustomers?.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-action]'); if (!btn) return;
    const id = btn.closest('tr')?.dataset.id;
    const list = DB.customers(); const c = list.find(x=>x.id===id);
    if (btn.dataset.action==='edit') openCustomerModal(c);
    if (btn.dataset.action==='del') { if (confirm('Xoá khách này?')) { DB.setCustomers(list.filter(x=>x.id!==id)); renderCustomers(); renderDashboard(); showToast('Đã xoá'); } }
  });
  function openCustomerModal(edit=null){
    const c = edit || { name:'', email:'', phone:'', status:'active', note:'' };
    openModal(edit?'Sửa khách hàng':'Thêm khách hàng', `
      <input type="hidden" name="id" value="${c.id||''}">
      <div class="form-grid">
        <div class="form-field"><label>Tên</label><input name="name" required value="${c.name||''}"></div>
        <div class="form-field"><label>Email</label><input name="email" type="email" required value="${c.email||''}"></div>
        <div class="form-field"><label>Điện thoại</label><input name="phone" value="${c.phone||''}"></div>
        <div class="form-field"><label>Trạng thái</label>
          <select name="status"><option value="active" ${c.status==='active'?'selected':''}>Hoạt động</option><option value="blocked" ${c.status==='blocked'?'selected':''}>Chặn</option></select>
        </div>
        <div class="form-field form-field--full"><label>Ghi chú</label><textarea name="note" rows="3">${c.note||''}</textarea></div>
      </div>
    `, (fd)=>{
      const item = { id: fd.get('id') || uid('cus'),
        name: fd.get('name').trim(), email: fd.get('email').trim().toLowerCase(),
        phone: (fd.get('phone')||'').trim(), status: fd.get('status'), note: (fd.get('note')||'').trim()
      };
      const list = DB.customers(); const idx = list.findIndex(x=>x.id===item.id);
      idx>=0 ? (list[idx]=item) : list.unshift(item);
      DB.setCustomers(list); renderCustomers(); renderDashboard(); closeModal(); showToast(idx>=0?'Đã cập nhật':'Đã thêm khách');
    });
  }

  // ====== Admin accounts (không còn chặn theo role) ======
  const tbodyAdmins = $('#tbodyAdmins');
  const searchAdmins = $('#searchAdmins'); const filterAdminRole = $('#filterAdminRole'); const filterAdminStatus = $('#filterAdminStatus');

  function renderAdmins(){
    const q = (searchAdmins.value||'').toLowerCase();
    const r = filterAdminRole.value; const s = filterAdminStatus.value;
    const list = DB.admins().filter(a=>{
      const hit = a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
      const okR = !r || a.role===r; const okS = !s || a.status===s;
      return hit && okR && okS;
    });
    tbodyAdmins.innerHTML = list.map(a=>`
      <tr data-id="${a.id}">
        <td data-label="Tên">${a.name}</td>
        <td data-label="Email">${a.email}</td>
        <td data-label="Vai trò"><span class="badge ${a.role==='superadmin'?'badge--warn':'badge--ok'}">${a.role}</span></td>
        <td data-label="Trạng thái"><span class="badge ${a.status==='active'?'badge--active':'badge--hidden'}">${a.status==='active'?'Hoạt động':'Khóa'}</span></td>
        <td data-label="Thao tác">
          <div class="table-actions">
            <button class="icon-btn icon-btn--edit" data-action="edit"><i class="fa fa-pen"></i></button>
            <button class="icon-btn icon-btn--del" data-action="del"><i class="fa fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('') || `<tr><td colspan="5" style="text-align:center;padding:18px">Chưa có admin.</td></tr>`;
  }
  [searchAdmins, filterAdminRole, filterAdminStatus].forEach(el=> el?.addEventListener('input', renderAdmins));
  $('#btnAddAdmin')?.addEventListener('click', ()=> openAdminModal());
  tbodyAdmins?.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-action]'); if (!btn) return;
    const id = btn.closest('tr')?.dataset.id;
    const list = DB.admins(); const a = list.find(x=>x.id===id);
    if (btn.dataset.action==='edit') openAdminModal(a);
    if (btn.dataset.action==='del'){
      const totalSuper = list.filter(x=>x.role==='superadmin' && x.status==='active').length;
      if (a.role==='superadmin' && totalSuper<=1) { showToast('Phải còn ít nhất 1 superadmin', 'error'); return; }
      if (confirm('Xoá tài khoản admin này?')){ DB.setAdmins(list.filter(x=>x.id!==id)); renderAdmins(); showToast('Đã xoá'); }
    }
  });

  function openAdminModal(edit=null){
    const a = edit || { name:'', email:'', role:'staff', status:'active' };
    openModal(edit?'Sửa tài khoản admin':'Thêm tài khoản admin', `
      <input type="hidden" name="id" value="${a.id||''}">
      <div class="form-grid">
        <div class="form-field"><label>Tên</label><input name="name" required value="${a.name||''}"></div>
        <div class="form-field"><label>Email</label><input name="email" type="email" required value="${a.email||''}"></div>
        <div class="form-field"><label>Vai trò</label>
          <select name="role"><option value="superadmin" ${a.role==='superadmin'?'selected':''}>superadmin</option><option value="staff" ${a.role==='staff'?'selected':''}>staff</option></select>
        </div>
        <div class="form-field"><label>Trạng thái</label>
          <select name="status"><option value="active" ${a.status==='active'?'selected':''}>Hoạt động</option><option value="disabled" ${a.status==='disabled'?'selected':''}>Khóa</option></select>
        </div>
        <div class="form-field"><label>${edit?'Đặt mật khẩu mới (tuỳ chọn)':'Mật khẩu'}</label><input name="password" type="password" ${edit?'':'required'} placeholder="${edit?'Bỏ trống nếu giữ nguyên':''}"></div>
        <div class="form-field"><label>Xác nhận mật khẩu</label><input name="password2" type="password" ${edit?'':'required'}></div>
        <div class="form-field form-field--full"><span class="hint">Mật khẩu được lưu bằng SHA-256 (demo). Đừng dùng cho production.</span></div>
      </div>
    `, async (fd)=>{
      const item = {
        id: fd.get('id') || uid('adm'),
        name: fd.get('name').trim(),
        email: fd.get('email').trim().toLowerCase(),
        role: fd.get('role'),
        status: fd.get('status'),
      };
      const pass = fd.get('password'); const pass2 = fd.get('password2');
      if ((pass||pass2) && pass!==pass2){ showToast('Mật khẩu xác nhận không khớp', 'error'); return; }
      const list = DB.admins(); const idx = list.findIndex(x=>x.id===item.id);
      if (!edit && (!pass || pass.length<6)){ showToast('Mật khẩu tối thiểu 6 ký tự', 'error'); return; }
      if (pass) item.passwordHash = await sha256(pass); else if (edit) item.passwordHash = list[idx].passwordHash;
      if (idx>=0){ list[idx] = { ...list[idx], ...item }; } else { item.createdAt = Date.now(); list.unshift(item); }
      DB.setAdmins(list); renderAdmins(); closeModal(); showToast(idx>=0?'Đã cập nhật admin':'Đã thêm admin');
    });
  }

  // ====== Boot ======
  activateView(currentView() || 'dashboard');
})();
(function(){
  const sb = document.querySelector('.neo-sidebar');
  const btn = document.getElementById('sbToggle');
  const themeBtn = document.getElementById('sbTheme');

  // Thu gọn/mở rộng
  btn?.addEventListener('click', () => {
    const v = sb.getAttribute('data-collapsed') === 'true';
    sb.setAttribute('data-collapsed', v ? 'false' : 'true');
    const ic = btn.querySelector('i');
    if(ic){ ic.className = 'fa ' + (v ? 'fa-angles-left' : 'fa-angles-right'); }
  });
})();