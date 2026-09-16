// Mobile nav toggle
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');
burger.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

// Scroll-triggered reveal animations (cards, text blocks, service lists, product blocks)
const revealEls = document.querySelectorAll('.reveal, .service-list, .products-block');
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
revealEls.forEach(el => io.observe(el));

// Header background state + scroll progress bar
const header = document.querySelector('header');
const progress = document.getElementById('progress');

function onScroll() {
  const y = window.scrollY || document.documentElement.scrollTop;
  header.classList.toggle('scrolled', y > 40);

  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (y / docHeight) * 100 : 0;
  if (progress) progress.style.width = pct + '%';

  const toTop = document.getElementById('toTop');
  if (toTop) toTop.classList.toggle('show', y > 600);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Back to top button
const toTopBtn = document.getElementById('toTop');
if (toTopBtn) {
  toTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// Contact form (front-end only placeholder)
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    this.reset();
    const note = document.getElementById('formNote');
    if (note) note.style.display = 'block';
  });
}

/* ================= CART ================= */
const CART_KEY = 'eaziziCart';

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}
function saveCart() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* ignore */ }
}

let cart = loadCart();

function fmtMoney(n) {
  return '\u09F3' + n.toLocaleString('en-IN');
}

function addToCart(id, name, price, division) {
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, name, price, division, qty: 1 });
  }
  saveCart();
  renderCart();
  openCart();
}

function buyNow(id, name, price, division) {
  addToCart(id, name, price, division);
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }
  saveCart();
  renderCart();
}

function removeItem(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCart();
}

function renderCart() {
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = totalQty;
    el.style.display = totalQty > 0 ? 'flex' : 'none';
  });

  const list = document.getElementById('cartItems');
  if (list) {
    if (cart.length === 0) {
      list.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
    } else {
      list.innerHTML = cart.map(i => `
        <div class="cart-item">
          <div class="ci-info">
            <div class="ci-name">${i.name}</div>
            <div class="ci-meta">
              <button class="qty-btn" onclick="changeQty('${i.id}',-1)">\u2212</button>
              <span>${i.qty}</span>
              <button class="qty-btn" onclick="changeQty('${i.id}',1)">+</button>
              <span>${fmtMoney(i.price * i.qty)}</span>
              <button class="ci-remove" onclick="removeItem('${i.id}')">Remove</button>
            </div>
          </div>
        </div>`).join('');
    }
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const subtotalEl = document.getElementById('cartSubtotal');
  if (subtotalEl) subtotalEl.textContent = fmtMoney(subtotal);
}

function openCart() {
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartOverlay').classList.add('show');
}
function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('show');
}

document.getElementById('cartToggle').addEventListener('click', openCart);
document.getElementById('cartClose').addEventListener('click', closeCart);
document.getElementById('cartOverlay').addEventListener('click', closeCart);

document.getElementById('checkoutBtn').addEventListener('click', () => {
  if (cart.length === 0) return;
  alert('This is a demo checkout. To accept real payments, connect a payment gateway such as bKash, SSLCommerz, or Stripe to this button.');
});

renderCart();

/* ================= PRODUCT CAROUSEL ARROWS + DRAG-SWIPE ================= */
document.querySelectorAll('.carousel-arrows').forEach(nav => {
  const targetId = nav.getAttribute('data-target');
  const track = document.getElementById(targetId);
  if (!track) return;
  const left = nav.querySelector('.arrow-left');
  const right = nav.querySelector('.arrow-right');
  if (left) left.addEventListener('click', () => track.scrollBy({ left: -220, behavior: 'smooth' }));
  if (right) right.addEventListener('click', () => track.scrollBy({ left: 220, behavior: 'smooth' }));
});

// Pointer-drag swipe for mouse/trackpad users (touch already scrolls natively)
document.querySelectorAll('.product-carousel').forEach(track => {
  let isDown = false;
  let startX = 0;
  let scrollStart = 0;
  let moved = false;

  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return; // native touch scrolling handles this
    isDown = true;
    moved = false;
    startX = e.clientX;
    scrollStart = track.scrollLeft;
    track.classList.add('dragging');
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 4) moved = true;
    track.scrollLeft = scrollStart - dx;
  });

  window.addEventListener('pointerup', () => {
    isDown = false;
    track.classList.remove('dragging');
  });

  // Prevent accidental click-through on cards right after a drag
  track.addEventListener('click', (e) => {
    if (moved) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);
});
