/* static/landing/landing.js */

// ---- Navbar scroll effect ----
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.lp-nav');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
});

// ---- Hamburger menu ----
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });
  // Close on link click
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });
}

// ---- Accordion (Terms) ----
function toggleAccord(btn) {
  const body = btn.nextElementSibling;
  const isOpen = btn.classList.contains('open');

  // Close all
  document.querySelectorAll('.lp-accord-btn').forEach(b => {
    b.classList.remove('open');
    b.nextElementSibling.classList.remove('open');
  });

  // Open if was closed
  if (!isOpen) {
    btn.classList.add('open');
    body.classList.add('open');
  }
}

// ---- Contact form ----
function handleContact(e) {
  e.preventDefault();
  const msg = document.getElementById('contactMsg');
  msg.textContent = "✅ Message sent! We'll be in touch soon.";
  e.target.reset();
  setTimeout(() => { msg.textContent = ''; }, 4000);
}

// ---- Scroll-in animation for sections ----
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.lp-feat-card, .lp-problem-card, .lp-member-card, .lp-step').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
  observer.observe(el);
});

// ---- Smooth scroll for anchor links ----
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});