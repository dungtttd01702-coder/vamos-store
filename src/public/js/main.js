// ══════════════════════════════════════════════════════════
// VAMOS STORE - Modern Kinetic UI Micro-Interactions (Stitch)
// ══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile navigation toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // 2. Sticky Navbar scroll shadow
  const headerNav = document.querySelector('header nav');
  if (headerNav) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        headerNav.classList.add('shadow-md', 'bg-white/95');
      } else {
        headerNav.classList.remove('shadow-md');
      }
    }, { passive: true });
  }

  // 3. Auto-dismiss notification alerts
  const alerts = document.querySelectorAll('.alert-dismissible');
  alerts.forEach(alert => {
    setTimeout(() => {
      alert.style.opacity = '0';
      alert.style.transform = 'translateY(-8px)';
      alert.style.transition = 'all 0.4s ease';
      setTimeout(() => alert.remove(), 400);
    }, 4500);
  });

  // 4. Product Detail Live Color & Size Selection Label Updates
  const colorRadios = document.querySelectorAll('input[name="color"]');
  const selectedColorLabel = document.getElementById('selected-color-label');
  if (colorRadios.length > 0 && selectedColorLabel) {
    colorRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          selectedColorLabel.textContent = `: ${radio.value}`;
        }
      });
    });
  }

  const sizeRadios = document.querySelectorAll('input[name="size"]');
  const selectedSizeLabel = document.getElementById('selected-size-label');
  if (sizeRadios.length > 0 && selectedSizeLabel) {
    sizeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          selectedSizeLabel.textContent = `: ${radio.value}`;
        }
      });
    });
  }

  // 5. One-click Voucher Copy with Toast Notification
  window.copyVoucher = function(code, buttonElement) {
    if (!navigator.clipboard) {
      prompt('Mã voucher của bạn:', code);
      return;
    }
    navigator.clipboard.writeText(code).then(() => {
      showToast(`Đã sao chép mã voucher ${code}!`);
      if (buttonElement) {
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = 'ĐÃ SAO CHÉP ✓';
        buttonElement.classList.add('bg-green-600', 'hover:bg-green-700');
        setTimeout(() => {
          buttonElement.innerHTML = originalText;
          buttonElement.classList.remove('bg-green-600', 'hover:bg-green-700');
        }, 2000);
      }
    });
  };

  // 6. Global Lightweight Toast Notification
  window.showToast = function(message, type = 'success') {
    let container = document.getElementById('vamos-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'vamos-toast-container';
      container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-xs font-bold text-white transition-all duration-300 transform translate-y-4 opacity-0 ${
      type === 'error' ? 'bg-red-600' : 'bg-vamos-dark border border-gray-700'
    }`;
    toast.innerHTML = `<span>${type === 'error' ? '⚠️' : '🎉'}</span><span>${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('translate-y-4', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  };

  // 7. Auto-trim email inputs on blur & form submission for consistent client/server validation
  const emailInputs = document.querySelectorAll('input[type="email"]');
  emailInputs.forEach(input => {
    input.addEventListener('blur', () => {
      if (typeof input.value === 'string') {
        input.value = input.value.trim();
      }
    });
  });

  // 8. Prevent duplicate order submissions on checkout form (rapid double-click defense)
  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      const submitBtn = checkoutForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        if (submitBtn.dataset.submitted === 'true') {
          e.preventDefault();
          return false;
        }
        submitBtn.dataset.submitted = 'true';
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Đang xử lý đặt hàng COD...';
        submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
        // Let form submit normally
        checkoutForm.submit();
      }
    });
  }
});
