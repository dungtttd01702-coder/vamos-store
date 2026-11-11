// ══════════════════════════════════════════════════════════
// VAMOS STORE - Modern Kinetic UI Micro-Interactions (Stitch)
// Real-time Live Validation & Real-time Live Search Engine
// ══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  // ── 1. MOBILE NAVIGATION TOGGLE ──
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // ── 2. STICKY NAVBAR SCROLL SHADOW ──
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

  // ── 3. AUTO-DISMISS NOTIFICATION ALERTS ──
  const alerts = document.querySelectorAll('.alert-dismissible');
  alerts.forEach(alert => {
    setTimeout(() => {
      alert.style.opacity = '0';
      alert.style.transform = 'translateY(-8px)';
      alert.style.transition = 'all 0.4s ease';
      setTimeout(() => alert.remove(), 400);
    }, 4500);
  });

  // ── 4. GLOBAL TOAST NOTIFICATION ──
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

  // ── 5. ONE-CLICK VOUCHER COPY ──
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

  // ── 6. CURRENCY FORMATTER UTILITY ──
  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount) || 0);
  };

  // ── 7. PRODUCT DETAIL: REAL-TIME QUANTITY & STOCK LIVE VALIDATION ──
  initProductDetailQuantityAndStock();

  // ── 8. REAL-TIME LIVE SEARCH ENGINE (DESKTOP & MOBILE) ──
  initRealtimeLiveSearch('desktop-search-input', 'desktop-search-dropdown', 'desktop-search-clear', 'desktop-search-form');
  initRealtimeLiveSearch('mobile-search-input', 'mobile-search-dropdown', 'mobile-search-clear', 'mobile-search-form');

  // ── 9. GLOBAL REAL-TIME FORM FIELD VALIDATORS ──
  initGlobalRealtimeValidators();

  // ── 10. PREVENT DOUBLE SUBMISSIONS ON CHECKOUT ──
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
      }
    });
  }
});

// ══════════════════════════════════════════════════════════
// SECTION A: PRODUCT DETAIL QUANTITY & STOCK REAL-TIME ENGINE
// ══════════════════════════════════════════════════════════
function initProductDetailQuantityAndStock() {
  const qtyInput = document.getElementById('qty-input');
  if (!qtyInput) return;

  const minusBtn = document.getElementById('qty-minus-btn');
  const plusBtn = document.getElementById('qty-plus-btn');
  const stepperBox = document.getElementById('qty-stepper-box');
  const stockBadge = document.getElementById('stock-status-badge');
  const validationMsg = document.getElementById('qty-validation-msg');
  const addToCartBtn = document.getElementById('btn-add-to-cart');
  const buyNowBtn = document.getElementById('btn-buy-now');
  const skuDisplay = document.getElementById('product-sku-display');
  const colorRadios = document.querySelectorAll('input[name="color"]');
  const sizeRadios = document.querySelectorAll('input[name="size"]');
  const selectedColorLabel = document.getElementById('selected-color-label');
  const selectedSizeLabel = document.getElementById('selected-size-label');

  const variants = window.PRODUCT_DATA?.variants || [];
  const MAX_RETAIL_LIMIT = 10;

  // Helper: Find current active variant
  function getActiveVariant() {
    const selectedColor = document.querySelector('input[name="color"]:checked')?.value;
    const selectedSize = document.querySelector('input[name="size"]:checked')?.value;

    if (!selectedColor || !selectedSize || variants.length === 0) {
      return variants[0] || null;
    }

    return variants.find(v => v.color_name === selectedColor && v.size_name === selectedSize) || null;
  }

  // Helper: Update variant info (SKU, Stock Badge, Stock Limits)
  function updateVariantInfo() {
    const variant = getActiveVariant();
    const selectedColor = document.querySelector('input[name="color"]:checked')?.value;
    const selectedSize = document.querySelector('input[name="size"]:checked')?.value;

    if (selectedColorLabel && selectedColor) {
      selectedColorLabel.textContent = `: ${selectedColor}`;
    }
    if (selectedSizeLabel && selectedSize) {
      selectedSizeLabel.textContent = `: ${selectedSize}`;
    }

    if (variant) {
      if (skuDisplay) {
        skuDisplay.textContent = `Mã SKU: ${variant.sku}`;
      }

      const stock = variant.stock_quantity;
      if (stockBadge) {
        if (stock <= 0) {
          stockBadge.innerHTML = '<span class="px-2 py-0.5 rounded text-xs font-bold text-red-600 bg-red-50 border border-red-200">❌ Tạm hết hàng</span>';
        } else if (stock <= 5) {
          stockBadge.innerHTML = `<span class="px-2 py-0.5 rounded text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200">⚡ Sắp hết: Còn ${stock} đôi</span>`;
        } else {
          stockBadge.innerHTML = `<span class="text-xs font-semibold text-green-600">✓ Còn hàng (${stock} đôi trong kho)</span>`;
        }
      }
    }

    validateQuantity();
  }

  // Core Real-Time Validator function (Triggered on EVERY keystroke)
  function validateQuantity() {
    const variant = getActiveVariant();
    const rawVal = qtyInput.value;

    // Case 1: Variant is out of stock in DB
    if (variant && variant.stock_quantity <= 0) {
      setInvalidState(
        `⚠️ Rất tiếc, biến thể Màu ${variant.color_name} - Size ${variant.size_name} hiện đã hết hàng. Quý khách vui lòng chọn màu hoặc kích cỡ khác!`,
        'error'
      );
      if (minusBtn) minusBtn.disabled = true;
      if (plusBtn) plusBtn.disabled = true;
      qtyInput.disabled = true;
      return false;
    }

    // Re-enable input if previously disabled
    qtyInput.disabled = false;
    if (minusBtn) minusBtn.disabled = false;
    if (plusBtn) plusBtn.disabled = false;

    // Case 2: Empty or non-number
    if (rawVal === '' || rawVal === null || isNaN(rawVal)) {
      setInvalidState('⚠️ Vui lòng nhập số lượng hợp lệ (tối thiểu 1 đôi).', 'error');
      return false;
    }

    const num = parseInt(rawVal, 10);

    // Case 3: Less than 1
    if (num < 1) {
      setInvalidState('⚠️ Số lượng đặt mua tối thiểu là 1 đôi.', 'error');
      return false;
    }

    // Case 4: Retail Wholesale Limit (User enters 99, 999, or > 10)
    if (num > MAX_RETAIL_LIMIT) {
      setInvalidState(
        `⚠️ Bạn đang nhập ${num} đôi. Đơn hàng bán lẻ trên website tối đa 10 đôi/lần đặt. Nếu quý khách có nhu cầu mua sỉ số lượng lớn (${num} đôi), vui lòng liên hệ Hotline 1900 2126 để nhận báo giá sỉ ưu đãi!`,
        'warning'
      );
      return false;
    }

    // Case 5: Exceeds variant's available stock
    if (variant && num > variant.stock_quantity) {
      setInvalidState(
        `⚠️ Biến thể này hiện chỉ còn ${variant.stock_quantity} đôi trong kho. Quý khách không thể đặt vượt quá số lượng tồn khả dụng!`,
        'error'
      );
      return false;
    }

    // Valid state!
    setValidState();
    return true;
  }

  function setInvalidState(message, level = 'error') {
    if (validationMsg) {
      validationMsg.classList.remove('hidden');
      if (level === 'warning') {
        validationMsg.className = 'mt-2 p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs font-bold text-amber-900 block leading-relaxed animate-pulse';
      } else {
        validationMsg.className = 'mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-bold text-red-700 block leading-relaxed';
      }
      validationMsg.innerHTML = message;
    }

    if (stepperBox) {
      stepperBox.classList.remove('border-gray-200');
      if (level === 'warning') {
        stepperBox.classList.add('border-amber-400', 'ring-2', 'ring-amber-200', 'bg-amber-50/20');
        stepperBox.classList.remove('border-red-500', 'ring-red-200', 'bg-red-50/20');
      } else {
        stepperBox.classList.add('border-red-500', 'ring-2', 'ring-red-200', 'bg-red-50/20');
        stepperBox.classList.remove('border-amber-400', 'ring-amber-200', 'bg-amber-50/20');
      }
    }

    // Disable purchase buttons
    if (addToCartBtn) {
      addToCartBtn.disabled = true;
      addToCartBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
    if (buyNowBtn) {
      buyNowBtn.disabled = true;
      buyNowBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
  }

  function setValidState() {
    if (validationMsg) {
      validationMsg.classList.add('hidden');
      validationMsg.innerHTML = '';
    }

    if (stepperBox) {
      stepperBox.classList.remove('border-red-500', 'border-amber-400', 'ring-2', 'ring-red-200', 'ring-amber-200', 'bg-red-50/20', 'bg-amber-50/20');
      stepperBox.classList.add('border-gray-200');
    }

    // Re-enable purchase buttons
    if (addToCartBtn) {
      addToCartBtn.disabled = false;
      addToCartBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
    if (buyNowBtn) {
      buyNowBtn.disabled = false;
      buyNowBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  }

  // ── ATTACH REAL-TIME LISTENERS (Triggers immediately on typing) ──
  qtyInput.addEventListener('input', validateQuantity);
  qtyInput.addEventListener('keyup', validateQuantity);
  qtyInput.addEventListener('paste', () => setTimeout(validateQuantity, 10));
  qtyInput.addEventListener('change', validateQuantity);

  // Stepper Buttons
  if (minusBtn) {
    minusBtn.addEventListener('click', () => {
      const current = parseInt(qtyInput.value, 10) || 1;
      if (current > 1) {
        qtyInput.value = current - 1;
        validateQuantity();
      }
    });
  }

  if (plusBtn) {
    plusBtn.addEventListener('click', () => {
      const current = parseInt(qtyInput.value, 10) || 1;
      const variant = getActiveVariant();
      const maxAllowed = Math.min(variant ? variant.stock_quantity : MAX_RETAIL_LIMIT, MAX_RETAIL_LIMIT);

      if (current < maxAllowed) {
        qtyInput.value = current + 1;
        validateQuantity();
      } else if (current >= MAX_RETAIL_LIMIT) {
        setInvalidState(
          `⚠️ Đơn hàng bán lẻ tối đa 10 đôi/lần đặt. Quý khách có nhu cầu mua sỉ số lượng lớn vui lòng liên hệ Hotline 1900 2126 để nhận báo giá sỉ!`,
          'warning'
        );
      } else if (variant && current >= variant.stock_quantity) {
        setInvalidState(
          `⚠️ Đã đạt số lượng tồn kho tối đa của biến thể này (${variant.stock_quantity} đôi). Không thể tăng thêm!`,
          'error'
        );
      }
    });
  }

  // Color & Size Radio listeners
  colorRadios.forEach(r => r.addEventListener('change', updateVariantInfo));
  sizeRadios.forEach(r => r.addEventListener('change', updateVariantInfo));

  // Form Submit Interception Guard
  const form = qtyInput.closest('form');
  if (form) {
    form.addEventListener('submit', (e) => {
      if (!validateQuantity()) {
        e.preventDefault();
        window.showToast('Vui lòng kiểm tra lại số lượng sản phẩm trước khi tiếp tục!', 'error');
        qtyInput.focus();
        return false;
      }
    });
  }

  // Initial validation check on page load
  updateVariantInfo();
}

// ══════════════════════════════════════════════════════════
// SECTION B: REAL-TIME LIVE SEARCH AUTOCOMPLETE ENGINE
// ══════════════════════════════════════════════════════════
function initRealtimeLiveSearch(inputId, dropdownId, clearBtnId, formId) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  const clearBtn = document.getElementById(clearBtnId);
  const form = document.getElementById(formId);

  if (!input || !dropdown) return;

  let debounceTimer = null;
  let activeIndex = -1;
  let currentResults = [];

  // Helper: Highlight matching text
  function highlightMatch(text, query) {
    if (!text || !query) return text || '';
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return text.replace(regex, '<span class="text-vamos-red font-black underline decoration-red-300">$1</span>');
  }

  // Perform Fetch to Live Search API
  async function performSearch(query) {
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Search request failed');
      const data = await res.json();
      renderResults(data.results || [], query);
    } catch (err) {
      dropdown.innerHTML = `
        <div class="p-4 text-center text-xs text-gray-500">
          <p>⚠️ Không thể kết nối tìm kiếm. Vui lòng thử lại sau.</p>
        </div>
      `;
      dropdown.classList.remove('hidden');
    }
  }

  // Render Search Results Dropdown
  function renderResults(results, query) {
    currentResults = results;
    activeIndex = -1;

    if (results.length === 0) {
      dropdown.innerHTML = `
        <div class="p-5 text-center text-xs">
          <div class="text-2xl mb-1.5">👟</div>
          <p class="font-bold text-vamos-dark mb-1">Không tìm thấy sản phẩm khớp với "${query}"</p>
          <p class="text-gray-400 text-[11px] leading-relaxed">Gợi ý: Thử tìm theo danh mục như "Sneaker", "Sandal", "Active" hoặc mã "VM-"</p>
        </div>
      `;
      dropdown.classList.remove('hidden');
      return;
    }

    let itemsHtml = results.map((item, idx) => `
      <a href="/products/${item.slug}" data-index="${idx}" class="live-search-item flex items-center gap-3 px-4 py-2.5 hover:bg-red-50/60 transition-colors border-b border-gray-100 last:border-none group">
        <div class="w-12 h-12 rounded-lg bg-gray-50 p-1 border border-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
          <img class="w-full h-full object-contain group-hover:scale-105 transition-transform" src="${item.image_url}" alt="${item.name}">
        </div>
        <div class="flex-grow min-w-0">
          <div class="text-xs font-bold text-vamos-dark truncate group-hover:text-vamos-red">${highlightMatch(item.name, query)}</div>
          <div class="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
            <span class="font-medium text-gray-600">${item.category_name || 'VAMOS'}</span>
            <span>•</span>
            <span>${item.product_code}</span>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-xs font-black text-vamos-red font-mono">${formatVND(item.sale_price || item.base_price)}</span>
            ${item.sale_price ? `<span class="text-[10px] text-gray-400 line-through">${formatVND(item.base_price)}</span>` : ''}
          </div>
        </div>
        <div class="flex-shrink-0">
          ${item.in_stock ? '<span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">Còn hàng</span>' : '<span class="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">Hết hàng</span>'}
        </div>
      </a>
    `).join('');

    dropdown.innerHTML = `
      <div class="px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
        <span>Gợi ý sản phẩm (${results.length})</span>
        <span class="text-vamos-red">⚡ Live Search</span>
      </div>
      <div class="max-h-80 overflow-y-auto divide-y divide-gray-50">
        ${itemsHtml}
      </div>
      <a href="/products?q=${encodeURIComponent(query)}" class="block text-center py-2.5 px-4 text-xs font-bold text-vamos-red bg-red-50 hover:bg-red-100 transition-colors border-t border-red-100">
        Xem tất cả kết quả cho "${query}" ➔
      </a>
    `;

    dropdown.classList.remove('hidden');
  }

  // Keyboard navigation through suggestions
  function updateActiveItem() {
    const items = dropdown.querySelectorAll('.live-search-item');
    items.forEach((item, idx) => {
      if (idx === activeIndex) {
        item.classList.add('bg-red-50', 'ring-1', 'ring-vamos-red');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('bg-red-50', 'ring-1', 'ring-vamos-red');
      }
    });
  }

  // ── ATTACH REAL-TIME INPUT EVENT LISTENERS ──
  input.addEventListener('input', () => {
    const query = input.value.trim();

    if (clearBtn) {
      if (query.length > 0) {
        clearBtn.classList.remove('hidden');
      } else {
        clearBtn.classList.add('hidden');
      }
    }

    clearTimeout(debounceTimer);

    if (query.length === 0) {
      dropdown.classList.add('hidden');
      dropdown.innerHTML = '';
      currentResults = [];
      return;
    }

    if (query.length < 2) {
      dropdown.innerHTML = `
        <div class="p-3 text-center text-xs text-gray-400">
          Nhập từ 2 ký tự trở lên để xem gợi ý...
        </div>
      `;
      dropdown.classList.remove('hidden');
      return;
    }

    // Show loading state immediately
    dropdown.innerHTML = `
      <div class="p-4 flex items-center justify-center gap-2 text-xs text-gray-500">
        <div class="w-4 h-4 border-2 border-vamos-red border-t-transparent rounded-full animate-spin"></div>
        <span>Đang tìm kiếm "${query}"...</span>
      </div>
    `;
    dropdown.classList.remove('hidden');

    // Debounce API call by 250ms
    debounceTimer = setTimeout(() => {
      performSearch(query);
    }, 250);
  });

  // Clear button click
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.classList.add('hidden');
      dropdown.classList.add('hidden');
      dropdown.innerHTML = '';
      currentResults = [];
      input.focus();
    });
  }

  // Keyboard Navigation: ArrowDown, ArrowUp, Enter, Escape
  input.addEventListener('keydown', (e) => {
    const items = dropdown.querySelectorAll('.live-search-item');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
      updateActiveItem();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      updateActiveItem();
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < items.length) {
        e.preventDefault();
        items[activeIndex].click();
      }
    } else if (e.key === 'Escape') {
      dropdown.classList.add('hidden');
    }
  });

  // Close dropdown on click outside
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target) && (!clearBtn || !clearBtn.contains(e.target))) {
      dropdown.classList.add('hidden');
    }
  });

  // Re-open if user clicks back into input with existing text
  input.addEventListener('focus', () => {
    if (input.value.trim().length >= 2 && currentResults.length > 0) {
      dropdown.classList.remove('hidden');
    }
  });
}

// ══════════════════════════════════════════════════════════
// SECTION C: GLOBAL REAL-TIME FORM FIELD VALIDATION ENGINE
// ══════════════════════════════════════════════════════════
function initGlobalRealtimeValidators() {
  // ── 1. REAL-TIME EMAIL VALIDATION ON EVERY KEYSTROKE ──
  const emailInputs = document.querySelectorAll('input[type="email"]');
  emailInputs.forEach(input => {
    // Container for inline real-time feedback
    let helper = input.parentElement.querySelector('.email-live-helper');
    if (!helper) {
      helper = document.createElement('div');
      helper.className = 'email-live-helper text-[11px] font-bold mt-1 transition-all duration-200 hidden';
      input.parentElement.appendChild(helper);
    }

    const validateEmailField = () => {
      const val = (input.value || '').trim();
      if (!val) {
        helper.classList.add('hidden');
        input.classList.remove('border-red-500', 'border-amber-400', 'ring-2', 'ring-red-100');
        return;
      }

      // Check standard RFC email format
      const fullEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const hasAt = val.includes('@');

      if (!hasAt) {
        if (val.length >= 3) {
          helper.textContent = "⚠️ Địa chỉ email phải chứa ký tự '@' (ví dụ: user@gmail.com)";
          helper.className = 'email-live-helper text-[11px] font-bold mt-1 text-amber-700 block';
          input.classList.add('border-amber-400');
          input.classList.remove('border-red-500');
        } else {
          helper.classList.add('hidden');
        }
      } else {
        const parts = val.split('@');
        const domain = parts[1] || '';

        // Case: User entered 123@gmail without .com
        if (!domain.includes('.') || domain.split('.')[1]?.length < 2) {
          helper.textContent = '⚠️ Email chưa có đuôi tên miền hợp lệ (ví dụ: .com, .vn, .edu.vn)';
          helper.className = 'email-live-helper text-[11px] font-bold mt-1 text-red-600 block';
          input.classList.add('border-red-500', 'ring-2', 'ring-red-100');
        } else if (fullEmailRegex.test(val)) {
          helper.textContent = '✓ Định dạng email hợp lệ';
          helper.className = 'email-live-helper text-[11px] font-bold mt-1 text-emerald-600 block';
          input.classList.remove('border-red-500', 'border-amber-400', 'ring-2', 'ring-red-100');
        } else {
          helper.textContent = '⚠️ Địa chỉ email không đúng định dạng';
          helper.className = 'email-live-helper text-[11px] font-bold mt-1 text-red-600 block';
          input.classList.add('border-red-500');
        }
      }
    };

    input.addEventListener('input', validateEmailField);
    input.addEventListener('keyup', validateEmailField);
    input.addEventListener('blur', () => {
      input.value = (input.value || '').trim();
      validateEmailField();
    });
  });

  // ── 2. REAL-TIME PHONE NUMBER VALIDATION ON KEYSTROKE ──
  const phoneInputs = document.querySelectorAll('input[type="tel"], input[name="phone"], input[name="recipient_phone"]');
  phoneInputs.forEach(input => {
    let helper = input.parentElement.querySelector('.phone-live-helper');
    if (!helper) {
      helper = document.createElement('div');
      helper.className = 'phone-live-helper text-[11px] font-bold mt-1 transition-all duration-200 hidden';
      input.parentElement.appendChild(helper);
    }

    const validatePhoneField = () => {
      const val = (input.value || '').trim();
      if (!val) {
        helper.classList.add('hidden');
        input.classList.remove('border-red-500', 'border-emerald-500', 'ring-2', 'ring-red-100');
        return;
      }

      const vnPhoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;

      if (vnPhoneRegex.test(val)) {
        helper.textContent = '✓ Số điện thoại hợp lệ (10 chữ số)';
        helper.className = 'phone-live-helper text-[11px] font-bold mt-1 text-emerald-600 block';
        input.classList.remove('border-red-500');
      } else if (val.length === 10) {
        helper.textContent = '⚠️ Đầu số không đúng (chỉ hỗ trợ đầu 03, 05, 07, 08, 09)';
        helper.className = 'phone-live-helper text-[11px] font-bold mt-1 text-red-600 block';
        input.classList.add('border-red-500');
      } else if (val.length < 10) {
        helper.textContent = `Đang nhập... (${val.length}/10 số)`;
        helper.className = 'phone-live-helper text-[11px] font-medium mt-1 text-gray-400 block';
        input.classList.remove('border-red-500');
      } else {
        helper.textContent = '⚠️ Số điện thoại không được vượt quá 10 chữ số';
        helper.className = 'phone-live-helper text-[11px] font-bold mt-1 text-red-600 block';
        input.classList.add('border-red-500');
      }
    };

    input.addEventListener('input', validatePhoneField);
    input.addEventListener('keyup', validatePhoneField);
  });

  // ── 3. REAL-TIME PASSWORD & CONFIRM PASSWORD MATCHING ──
  const pwdInput = document.getElementById('password');
  const confirmPwdInput = document.getElementById('confirm_password');

  if (pwdInput && confirmPwdInput) {
    let helper = confirmPwdInput.parentElement.querySelector('.confirm-pwd-live-helper');
    if (!helper) {
      helper = document.createElement('div');
      helper.className = 'confirm-pwd-live-helper text-[11px] font-bold mt-1 transition-all duration-200 hidden';
      confirmPwdInput.parentElement.appendChild(helper);
    }

    const checkMatch = () => {
      const p = pwdInput.value;
      const c = confirmPwdInput.value;

      if (!c) {
        helper.classList.add('hidden');
        confirmPwdInput.classList.remove('border-red-500', 'border-emerald-500');
        return;
      }

      if (p === c) {
        helper.textContent = '✓ Mật khẩu xác nhận hoàn toàn trùng khớp';
        helper.className = 'confirm-pwd-live-helper text-[11px] font-bold mt-1 text-emerald-600 block';
        confirmPwdInput.classList.remove('border-red-500');
        confirmPwdInput.classList.add('border-emerald-500');
      } else {
        helper.textContent = '⚠️ Mật khẩu xác nhận chưa khớp với mật khẩu trên';
        helper.className = 'confirm-pwd-live-helper text-[11px] font-bold mt-1 text-red-600 block';
        confirmPwdInput.classList.add('border-red-500');
        confirmPwdInput.classList.remove('border-emerald-500');
      }
    };

    pwdInput.addEventListener('input', checkMatch);
    confirmPwdInput.addEventListener('input', checkMatch);
  }

  // ── 4. AUTO-UPPERCASE VOUCHER CODE ON TYPING ──
  const voucherInputs = document.querySelectorAll('input[name="voucher_code"], #voucher_code');
  voucherInputs.forEach(input => {
    input.addEventListener('input', () => {
      if (typeof input.value === 'string') {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        input.value = input.value.toUpperCase();
        input.setSelectionRange(start, end);
      }
    });
  });
}
