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
    const iconSpan = document.createElement('span');
    iconSpan.textContent = type === 'error' ? '⚠️' : '🎉';
    const textSpan = document.createElement('span');
    textSpan.textContent = message;
    toast.appendChild(iconSpan);
    toast.appendChild(textSpan);
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

  // ── 10. PRODUCT DETAIL: SAFE GALLERY THUMBNAIL SWITCHER ──
  const thumbBtns = document.querySelectorAll('.gallery-thumb-btn');
  const mainImage = document.getElementById('main-image');
  if (thumbBtns.length > 0 && mainImage) {
    thumbBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.getAttribute('data-image-url');
        if (url) {
          mainImage.src = url;
          thumbBtns.forEach(b => {
            b.classList.remove('border-vamos-red');
            b.classList.add('border-gray-200');
          });
          btn.classList.remove('border-gray-200');
          btn.classList.add('border-vamos-red');
        }
      });
    });
  }

  // ── 11. PREVENT DOUBLE SUBMISSIONS ON CHECKOUT ──
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
        submitBtn.textContent = 'Đang xử lý đặt hàng COD...';
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
      return null;
    }

    return variants.find(v => v.color_name === selectedColor && v.size_name === selectedSize) || null;
  }

  // Helper: Update variant info (SKU, Stock Badge, Stock Limits)
  function updateVariantInfo() {
    const variant = getActiveVariant();
    const selectedColor = document.querySelector('input[name="color"]:checked')?.value;
    const selectedSize = document.querySelector('input[name="size"]:checked')?.value;

    if (selectedColorLabel) {
      selectedColorLabel.textContent = selectedColor ? `: ${selectedColor}` : ': Chưa chọn';
    }
    if (selectedSizeLabel) {
      selectedSizeLabel.textContent = selectedSize ? `: ${selectedSize}` : ': Chưa chọn';
    }

    if (variant) {
      if (skuDisplay) {
        skuDisplay.textContent = `Mã SKU: ${variant.sku}`;
      }

      const stock = variant.stock_quantity;
      if (stockBadge) {
        stockBadge.textContent = '';
        const badgeSpan = document.createElement('span');
        if (stock <= 0) {
          badgeSpan.className = 'px-2 py-0.5 rounded text-xs font-bold text-red-600 bg-red-50 border border-red-200';
          badgeSpan.textContent = '❌ Tạm hết hàng';
        } else if (stock <= 5) {
          badgeSpan.className = 'px-2 py-0.5 rounded text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200';
          badgeSpan.textContent = `⚡ Sắp hết: Còn ${stock} đôi`;
        } else {
          badgeSpan.className = 'text-xs font-semibold text-green-600';
          badgeSpan.textContent = `✓ Còn hàng (${stock} đôi trong kho)`;
        }
        stockBadge.appendChild(badgeSpan);
      }
    } else {
      if (skuDisplay) {
        skuDisplay.textContent = 'Mã SKU: Chưa chọn biến thể';
      }
      if (stockBadge) {
        stockBadge.textContent = '';
        const badgeSpan = document.createElement('span');
        badgeSpan.className = 'text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded';
        badgeSpan.textContent = '⚠️ Vui lòng chọn Màu và Kích cỡ phù hợp';
        stockBadge.appendChild(badgeSpan);
      }
    }

    validateQuantity();
  }

  // Core Real-Time Validator function (Triggered on EVERY keystroke)
  function validateQuantity() {
    const variant = getActiveVariant();
    const rawVal = qtyInput.value;

    // Case 0: No valid variant matched
    if (!variant) {
      setInvalidState('⚠️ Quý khách vui lòng chọn đầy đủ Màu sắc và Kích cỡ phù hợp trước khi tiếp tục.', 'warning');
      if (minusBtn) minusBtn.disabled = true;
      if (plusBtn) plusBtn.disabled = true;
      qtyInput.disabled = true;
      return false;
    }

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

    // Case 2: Strict format check - rejects empty, non-integers, decimals (1.5), scientific notation (1e1), negatives
    const trimmedVal = typeof rawVal === 'string' ? rawVal.trim() : String(rawVal ?? '').trim();
    if (!/^[1-9]\d*$/.test(trimmedVal)) {
      setInvalidState('⚠️ Vui lòng nhập số lượng hợp lệ (phải là số nguyên dương từ 1 đến 10, không nhập số âm, số thập phân hay ký tự).', 'error');
      return false;
    }

    const num = Number(trimmedVal);
    if (!Number.isSafeInteger(num) || num < 1) {
      setInvalidState('⚠️ Số lượng đặt mua tối thiểu là 1 đôi.', 'error');
      return false;
    }

    // Case 4: Retail Wholesale Limit (User enters 99, 999, or > 10)
    if (num > MAX_RETAIL_LIMIT) {
      setInvalidState(
        `⚠️ Bạn đang nhập ${num} đôi. Có ai đặt ${num} đôi cho một đơn hàng bán lẻ không? Đơn hàng bán lẻ trên website tối đa 10 đôi/lần đặt để đảm bảo công bằng cho mọi khách hàng. Nếu quý khách có nhu cầu mua sỉ số lượng lớn (${num} đôi), vui lòng liên hệ Hotline 1900 2126 để nhận báo giá sỉ ưu đãi!`,
        'warning',
        '⚠️ Quá giới hạn lẻ (tối đa 10 đôi)'
      );
      return false;
    }

    // Case 5: Exceeds variant's available stock
    if (variant && num > variant.stock_quantity) {
      setInvalidState(
        `⚠️ Biến thể này hiện chỉ còn ${variant.stock_quantity} đôi trong kho. Quý khách không thể đặt vượt quá số lượng tồn khả dụng!`,
        'error',
        `❌ Vượt quá tồn kho (${variant.stock_quantity} đôi)`
      );
      return false;
    }

    // Valid state! Update stepper button disabled states accurately
    if (minusBtn) minusBtn.disabled = num <= 1;
    if (plusBtn) {
      const maxAllowed = Math.min(variant.stock_quantity, MAX_RETAIL_LIMIT);
      plusBtn.disabled = num >= maxAllowed;
    }

    setValidState(variant);
    return true;
  }

  function setInvalidState(message, level = 'error', badgeText = null) {
    if (validationMsg) {
      validationMsg.classList.remove('hidden');
      if (level === 'warning') {
        validationMsg.className = 'mt-2 p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs font-bold text-amber-900 block leading-relaxed animate-pulse';
      } else {
        validationMsg.className = 'mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-bold text-red-700 block leading-relaxed';
      }
      validationMsg.textContent = message;
    }

    if (stockBadge && badgeText) {
      stockBadge.textContent = '';
      const badgeSpan = document.createElement('span');
      if (level === 'warning') {
        badgeSpan.className = 'px-2 py-0.5 rounded text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200';
      } else {
        badgeSpan.className = 'px-2 py-0.5 rounded text-xs font-bold text-red-600 bg-red-50 border border-red-200';
      }
      badgeSpan.textContent = badgeText;
      stockBadge.appendChild(badgeSpan);
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

  function setValidState(variant) {
    if (validationMsg) {
      validationMsg.classList.add('hidden');
      validationMsg.textContent = '';
    }

    if (stockBadge && variant) {
      stockBadge.textContent = '';
      const badgeSpan = document.createElement('span');
      const stock = variant.stock_quantity;
      if (stock <= 0) {
        badgeSpan.className = 'px-2 py-0.5 rounded text-xs font-bold text-red-600 bg-red-50 border border-red-200';
        badgeSpan.textContent = '❌ Tạm hết hàng';
      } else if (stock <= 5) {
        badgeSpan.className = 'px-2 py-0.5 rounded text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200';
        badgeSpan.textContent = `⚡ Sắp hết: Còn ${stock} đôi`;
      } else {
        badgeSpan.className = 'text-xs font-semibold text-green-600';
        badgeSpan.textContent = `✓ Còn hàng (${stock} đôi trong kho)`;
      }
      stockBadge.appendChild(badgeSpan);
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
  // Block non-digit keys: exponential 'e', minus '-', plus '+', decimal '.', ','
  qtyInput.addEventListener('keydown', (e) => {
    if (['e', 'E', '+', '-', '.', ','].includes(e.key)) {
      e.preventDefault();
    }
  });

  qtyInput.addEventListener('input', validateQuantity);
  qtyInput.addEventListener('keyup', validateQuantity);
  qtyInput.addEventListener('paste', () => setTimeout(validateQuantity, 10));
  qtyInput.addEventListener('change', validateQuantity);
  window.handleDetailQtyChange = validateQuantity;

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
  let abortController = null;
  let activeRequestId = 0;

  // Helper: Safely append highlighted text nodes without dangerous innerHTML injection (XSS Immune)
  function safeAppendHighlightedText(targetElement, fullText, query) {
    const textStr = String(fullText || '');
    const queryStr = String(query || '').trim();

    if (!queryStr) {
      targetElement.textContent = textStr;
      return;
    }

    const lowerText = textStr.toLowerCase();
    const lowerQuery = queryStr.toLowerCase();

    let currentIndex = 0;
    let matchIndex = lowerText.indexOf(lowerQuery, currentIndex);

    if (matchIndex === -1) {
      targetElement.textContent = textStr;
      return;
    }

    while (matchIndex !== -1) {
      if (matchIndex > currentIndex) {
        targetElement.appendChild(document.createTextNode(textStr.substring(currentIndex, matchIndex)));
      }

      const highlightSpan = document.createElement('span');
      highlightSpan.className = 'text-vamos-red font-black underline decoration-red-300';
      highlightSpan.textContent = textStr.substring(matchIndex, matchIndex + queryStr.length);
      targetElement.appendChild(highlightSpan);

      currentIndex = matchIndex + queryStr.length;
      matchIndex = lowerText.indexOf(lowerQuery, currentIndex);
    }

    if (currentIndex < textStr.length) {
      targetElement.appendChild(document.createTextNode(textStr.substring(currentIndex)));
    }
  }

  // Safe Image URL validator (restricts to safe paths: http, https, /images)
  function getSafeImageUrl(url) {
    if (!url || typeof url !== 'string') return '/images/placeholder-shoe.png';
    const trimmed = url.trim();
    if (trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('/')) {
      return trimmed;
    }
    return '/images/placeholder-shoe.png';
  }

  // Perform Fetch to Live Search API with AbortController to prevent race condition
  async function performSearch(query) {
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();
    const requestId = ++activeRequestId;

    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`, {
        signal: abortController.signal,
      });

      if (!res.ok) throw new Error('Search request failed');
      const data = await res.json();

      // Guard: Discard stale response if input or requestId changed
      if (requestId !== activeRequestId || input.value.trim() !== query) {
        return;
      }

      renderResults(data.results || [], query);
    } catch (err) {
      if (err.name === 'AbortError') {
        // Stale fetch aborted cleanly
        return;
      }
      if (requestId !== activeRequestId) return;

      dropdown.replaceChildren();
      const errBox = document.createElement('div');
      errBox.className = 'p-4 text-center text-xs text-gray-500';
      const errP = document.createElement('p');
      errP.textContent = '⚠️ Không thể kết nối tìm kiếm. Vui lòng thử lại sau.';
      errBox.appendChild(errP);
      dropdown.appendChild(errBox);
      dropdown.classList.remove('hidden');
    }
  }

  // Render Search Results Dropdown Safely using 100% DOM APIs
  function renderResults(results, query) {
    currentResults = results;
    activeIndex = -1;
    dropdown.replaceChildren();

    if (results.length === 0) {
      const emptyContainer = document.createElement('div');
      emptyContainer.className = 'p-5 text-center text-xs';

      const iconDiv = document.createElement('div');
      iconDiv.className = 'text-2xl mb-1.5';
      iconDiv.textContent = '👟';

      const titleP = document.createElement('p');
      titleP.className = 'font-bold text-vamos-dark mb-1';
      titleP.textContent = `Không tìm thấy sản phẩm khớp với "${query}"`;

      const tipP = document.createElement('p');
      tipP.className = 'text-gray-400 text-[11px] leading-relaxed';
      tipP.textContent = 'Gợi ý: Thử tìm theo danh mục như "Sneaker", "Sandal", "Active" hoặc mã "VM-"';

      emptyContainer.appendChild(iconDiv);
      emptyContainer.appendChild(titleP);
      emptyContainer.appendChild(tipP);
      dropdown.appendChild(emptyContainer);
      dropdown.classList.remove('hidden');
      return;
    }

    // Header bar
    const headerBar = document.createElement('div');
    headerBar.className = 'px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-wider';
    const headerTitle = document.createElement('span');
    headerTitle.textContent = `Gợi ý sản phẩm (${results.length})`;
    const headerBadge = document.createElement('span');
    headerBadge.className = 'text-vamos-red';
    headerBadge.textContent = '⚡ Live Search';
    headerBar.appendChild(headerTitle);
    headerBar.appendChild(headerBadge);
    dropdown.appendChild(headerBar);

    // Items list container
    const listContainer = document.createElement('div');
    listContainer.className = 'max-h-80 overflow-y-auto divide-y divide-gray-50';

    results.forEach((item, idx) => {
      const a = document.createElement('a');
      a.href = `/products/${encodeURIComponent(item.slug)}`;
      a.dataset.index = String(idx);
      a.className = 'live-search-item flex items-center gap-3 px-4 py-2.5 hover:bg-red-50/60 transition-colors border-b border-gray-100 last:border-none group';

      // Thumbnail
      const thumbBox = document.createElement('div');
      thumbBox.className = 'w-12 h-12 rounded-lg bg-gray-50 p-1 border border-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden';
      const img = document.createElement('img');
      img.className = 'w-full h-full object-contain group-hover:scale-105 transition-transform';
      img.src = getSafeImageUrl(item.image_url);
      img.alt = String(item.name || 'Sản phẩm');
      img.loading = 'lazy';
      thumbBox.appendChild(img);
      a.appendChild(thumbBox);

      // Info Box
      const infoBox = document.createElement('div');
      infoBox.className = 'flex-grow min-w-0';

      const nameDiv = document.createElement('div');
      nameDiv.className = 'text-xs font-bold text-vamos-dark truncate group-hover:text-vamos-red';
      safeAppendHighlightedText(nameDiv, item.name, query);
      infoBox.appendChild(nameDiv);

      const metaDiv = document.createElement('div');
      metaDiv.className = 'text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5';
      const catSpan = document.createElement('span');
      catSpan.className = 'font-medium text-gray-600';
      catSpan.textContent = item.category_name || 'VAMOS';
      const dotSpan = document.createElement('span');
      dotSpan.textContent = '•';
      const skuSpan = document.createElement('span');
      skuSpan.textContent = item.product_code || '';
      metaDiv.appendChild(catSpan);
      metaDiv.appendChild(dotSpan);
      metaDiv.appendChild(skuSpan);
      infoBox.appendChild(metaDiv);

      const priceDiv = document.createElement('div');
      priceDiv.className = 'flex items-center gap-2 mt-1';
      const priceVal = Number(item.sale_price || item.base_price) || 0;
      const priceSpan = document.createElement('span');
      priceSpan.className = 'text-xs font-black text-vamos-red font-mono';
      priceSpan.textContent = formatVND(priceVal);
      priceDiv.appendChild(priceSpan);

      if (item.sale_price) {
        const oldPriceSpan = document.createElement('span');
        oldPriceSpan.className = 'text-[10px] text-gray-400 line-through';
        oldPriceSpan.textContent = formatVND(item.base_price);
        priceDiv.appendChild(oldPriceSpan);
      }
      infoBox.appendChild(priceDiv);
      a.appendChild(infoBox);

      // Stock status badge
      const badgeBox = document.createElement('div');
      badgeBox.className = 'flex-shrink-0';
      const stockBadge = document.createElement('span');
      if (item.in_stock) {
        stockBadge.className = 'text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded';
        stockBadge.textContent = 'Còn hàng';
      } else {
        stockBadge.className = 'text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded';
        stockBadge.textContent = 'Hết hàng';
      }
      badgeBox.appendChild(stockBadge);
      a.appendChild(badgeBox);

      listContainer.appendChild(a);
    });

    dropdown.appendChild(listContainer);

    // "Xem tất cả kết quả" Footer
    const footerLink = document.createElement('a');
    footerLink.href = `/products?q=${encodeURIComponent(query)}`;
    footerLink.className = 'block text-center py-2.5 px-4 text-xs font-bold text-vamos-red bg-red-50 hover:bg-red-100 transition-colors border-t border-red-100';
    footerLink.textContent = `Xem tất cả kết quả cho "${query}" ➔`;
    dropdown.appendChild(footerLink);

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
      dropdown.replaceChildren();
      currentResults = [];
      return;
    }

    if (query.length < 2) {
      dropdown.replaceChildren();
      const tipDiv = document.createElement('div');
      tipDiv.className = 'p-3 text-center text-xs text-gray-400';
      tipDiv.textContent = 'Nhập từ 2 ký tự trở lên để xem gợi ý...';
      dropdown.appendChild(tipDiv);
      dropdown.classList.remove('hidden');
      return;
    }

    // Show loading state safely with DOM API
    dropdown.replaceChildren();
    const loadBox = document.createElement('div');
    loadBox.className = 'p-4 flex items-center justify-center gap-2 text-xs text-gray-500';
    const spinner = document.createElement('div');
    spinner.className = 'w-4 h-4 border-2 border-vamos-red border-t-transparent rounded-full animate-spin';
    const loadText = document.createElement('span');
    loadText.textContent = `Đang tìm kiếm "${query}"...`;
    loadBox.appendChild(spinner);
    loadBox.appendChild(loadText);
    dropdown.appendChild(loadBox);
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
      dropdown.replaceChildren();
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

        // Case: User is still typing domain after @
        if (!domain.includes('.')) {
          if (domain.length < 3) {
            helper.textContent = 'Đang nhập tên miền (ví dụ: gmail.com, vamos.vn)...';
            helper.className = 'email-live-helper text-[11px] font-medium mt-1 text-gray-500 block';
            input.classList.remove('border-red-500');
          } else {
            helper.textContent = '⚠️ Email cần có phần mở rộng tên miền (ví dụ: .com, .vn, .net, .org)';
            helper.className = 'email-live-helper text-[11px] font-bold mt-1 text-amber-600 block';
            input.classList.add('border-amber-400');
            input.classList.remove('border-red-500');
          }
        } else if (domain.split('.')[1]?.length < 2) {
          helper.textContent = '⚠️ Phần mở rộng tên miền phải có ít nhất 2 ký tự (ví dụ: .vn, .com)';
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
