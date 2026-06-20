
(function() {
    'use strict';

    // ============================================================
    // 1. SLIDER (Home page)
    // ============================================================
    function initSlider() {
        const slides = document.querySelectorAll('.hero-slide');
        const dots = document.querySelectorAll('.dot');
        const prevBtn = document.getElementById('prevSlide');
        const nextBtn = document.getElementById('nextSlide');

        if (!slides.length) return;

        let currentIndex = 0;
        let intervalId = null;

        function goToSlide(index) {
            if (index < 0) index = slides.length - 1;
            if (index >= slides.length) index = 0;
            slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
            dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
            currentIndex = index;
        }

        function nextSlide() { goToSlide(currentIndex + 1); }
        function prevSlideFn() { goToSlide(currentIndex - 1); }

        function startAutoPlay() {
            if (intervalId) clearInterval(intervalId);
            intervalId = setInterval(nextSlide, 5000);
        }

        function stopAutoPlay() {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                stopAutoPlay();
                prevSlideFn();
                startAutoPlay();
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                stopAutoPlay();
                nextSlide();
                startAutoPlay();
            });
        }

        dots.forEach(function(dot) {
            dot.addEventListener('click', function() {
                var index = parseInt(this.getAttribute('data-index'), 10);
                if (!isNaN(index) && index !== currentIndex) {
                    stopAutoPlay();
                    goToSlide(index);
                    startAutoPlay();
                }
            });
        });

        var hero = document.querySelector('.hero-section');
        if (hero) {
            hero.addEventListener('mouseenter', stopAutoPlay);
            hero.addEventListener('mouseleave', startAutoPlay);
        }

        startAutoPlay();
    }

    // ============================================================
    // 2. SEARCH — Real search logic with live filtering
    // ============================================================
    function initSearch() {
        const searchToggle = document.getElementById('searchToggle');
        const searchOverlay = document.getElementById('searchOverlay');
        const searchInput = searchOverlay ? searchOverlay.querySelector('input') : null;
        const notifDropdown = document.getElementById('notifDropdown');

        if (!searchToggle || !searchOverlay || !searchInput) return;

        // Create results container (will be appended to search overlay)
        let resultsContainer = document.createElement('div');
        resultsContainer.className = 'search-results';
        resultsContainer.style.display = 'none';
        searchOverlay.appendChild(resultsContainer);

        // ---- Toggle search overlay ----
        searchToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            const isActive = searchOverlay.classList.toggle('active');
            if (isActive) {
                // Focus input when opened
                setTimeout(function() {
                    searchInput.focus();
                }, 100);
                // Clear previous results
                resultsContainer.innerHTML = '';
                resultsContainer.style.display = 'none';
                searchInput.value = '';
            }
            if (notifDropdown) notifDropdown.classList.remove('active');
        });

        // ---- Live search as user types ----
        searchInput.addEventListener('input', function(e) {
            const query = this.value.trim().toLowerCase();
            
            if (query.length === 0) {
                resultsContainer.innerHTML = '';
                resultsContainer.style.display = 'none';
                return;
            }

            // Get products from localStorage
            const products = JSON.parse(localStorage.getItem('warrantyProducts') || '[]');
            
            // Filter products by name or brand (case-insensitive)
            const matches = products.filter(function(product) {
                const nameMatch = product.productName.toLowerCase().includes(query);
                const brandMatch = product.brandName.toLowerCase().includes(query);
                return nameMatch || brandMatch;
            });

            // Render results
            if (matches.length === 0) {
                resultsContainer.innerHTML = `
                    <div class="search-no-results">
                        <i class="fas fa-search"></i>
                        <p>No products found for "<strong>${query}</strong>"</p>
                    </div>
                `;
                resultsContainer.style.display = 'block';
            } else {
                let html = '';
                matches.forEach(function(product) {
                    // Calculate expiry status
                    const purchaseDate = new Date(product.purchaseDate);
                    const warrantyMonths = product.warrantyUnit === 'years'
                        ? parseInt(product.warrantyPeriod) * 12
                        : parseInt(product.warrantyPeriod);
                    const expiryDate = new Date(purchaseDate);
                    expiryDate.setMonth(expiryDate.getMonth() + warrantyMonths);
                    const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
                    
                    let statusText = '✅ Active';
                    let statusColor = '#14b8a6';
                    if (daysLeft < 0) {
                        statusText = '❌ Expired';
                        statusColor = '#dc2626';
                    } else if (daysLeft <= 30) {
                        statusText = '⚠️ Expiring soon';
                        statusColor = '#f59e0b';
                    }

                    html += `
                        <div class="search-result-item" data-id="${product.id}">
                            <div class="search-result-icon">
                                <i class="fas fa-box"></i>
                            </div>
                            <div class="search-result-info">
                                <div class="search-result-name">${product.productName}</div>
                                <div class="search-result-brand">${product.brandName}</div>
                            </div>
                            <div class="search-result-status" style="color:${statusColor}">
                                ${statusText}
                            </div>
                        </div>
                    `;
                });
                resultsContainer.innerHTML = html;
                resultsContainer.style.display = 'block';

                // ---- Click on a result to show product details ----
                resultsContainer.querySelectorAll('.search-result-item').forEach(function(item) {
                    item.addEventListener('click', function() {
                        const productId = this.getAttribute('data-id');
                        const products = JSON.parse(localStorage.getItem('warrantyProducts') || '[]');
                        const product = products.find(function(p) { return p.id === productId; });
                        if (product) {
                            alert(
                                '📦 Product: ' + product.productName + '\n' +
                                '🏷️ Brand: ' + product.brandName + '\n' +
                                '🏪 Retailer: ' + product.retailerName + '\n' +
                                '📅 Purchased: ' + product.purchaseDate + '\n' +
                                '⏱️ Warranty: ' + product.warrantyPeriod + ' ' + product.warrantyUnit
                            );
                            // Close search after click
                            searchOverlay.classList.remove('active');
                            resultsContainer.style.display = 'none';
                            searchInput.value = '';
                        }
                    });
                });
            }
        });

        // ---- Close search on outside click ----
        document.addEventListener('click', function(e) {
            if (!searchToggle.contains(e.target) && !searchOverlay.contains(e.target)) {
                searchOverlay.classList.remove('active');
                resultsContainer.style.display = 'none';
                searchInput.value = '';
            }
        });

        // ---- Close search on Escape key ----
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                searchOverlay.classList.remove('active');
                resultsContainer.style.display = 'none';
                this.value = '';
            }
        });
    }

    // ============================================================
    // 3. NOTIFICATIONS — Load real data from localStorage
    // ============================================================
    function loadNotifications() {
        const notifList = document.getElementById('notificationList');
        const emptyMsg = document.getElementById('notificationEmpty');
        const badge = document.getElementById('notifBadge');

        if (!notifList) return;

        const products = JSON.parse(localStorage.getItem('warrantyProducts') || '[]');
        const today = new Date();
        let notifications = [];

        products.forEach(function(product) {
            const purchaseDate = new Date(product.purchaseDate);
            const warrantyMonths = product.warrantyUnit === 'years'
                ? parseInt(product.warrantyPeriod) * 12
                : parseInt(product.warrantyPeriod);
            const expiryDate = new Date(purchaseDate);
            expiryDate.setMonth(expiryDate.getMonth() + warrantyMonths);

            const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

            if (daysLeft >= 0 && daysLeft <= 30) {
                notifications.push({
                    id: product.id,
                    icon: daysLeft <= 7 ? 'fa-exclamation-triangle' : 'fa-clock',
                    iconColor: daysLeft <= 7 ? '#ef4444' : '#f59e0b',
                    text: '<strong>' + product.productName + '</strong> expires in ' + daysLeft + ' day' + (daysLeft > 1 ? 's' : '') + '.',
                    time: daysLeft <= 7 ? '⚠️ Urgent' : 'Soon'
                });
            } else if (daysLeft < 0) {
                notifications.push({
                    id: product.id,
                    icon: 'fa-times-circle',
                    iconColor: '#dc2626',
                    text: '<strong>' + product.productName + '</strong> warranty expired!',
                    time: '❌ Expired'
                });
            }
        });

        notifications.sort(function(a, b) {
            return a.daysLeft - b.daysLeft;
        });

        if (notifications.length === 0) {
            notifList.innerHTML = '';
            emptyMsg.style.display = 'block';
            badge.textContent = '0';
            badge.style.display = 'none';
        } else {
            emptyMsg.style.display = 'none';
            badge.textContent = notifications.length;
            badge.style.display = 'flex';

            var html = '';
            notifications.forEach(function(notif) {
                html +=
                    '<div class="notification-item" data-id="' + notif.id + '">' +
                    '<div class="notification-icon" style="color:' + notif.iconColor + ';">' +
                    '<i class="fas ' + notif.icon + '"></i>' +
                    '</div>' +
                    '<div class="notification-text">' + notif.text + '</div>' +
                    '<div class="notification-time">' + notif.time + '</div>' +
                    '</div>';
            });
            notifList.innerHTML = html;

            document.querySelectorAll('.notification-item').forEach(function(item) {
                item.addEventListener('click', function() {
                    this.remove();
                    var remaining = document.querySelectorAll('.notification-item').length;
                    if (remaining === 0) {
                        badge.textContent = '0';
                        badge.style.display = 'none';
                        emptyMsg.style.display = 'block';
                    } else {
                        badge.textContent = remaining;
                    }
                });
            });
        }
    }

    function initNotifications() {
        const notifToggle = document.getElementById('notificationToggle');
        const notifDropdown = document.getElementById('notifDropdown');

        if (!notifToggle || !notifDropdown) return;

        loadNotifications();

        notifToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            notifDropdown.classList.toggle('active');
            loadNotifications();
            var searchOverlay = document.getElementById('searchOverlay');
            if (searchOverlay) searchOverlay.classList.remove('active');
        });

        document.addEventListener('click', function(e) {
            if (!notifToggle.contains(e.target) && !notifDropdown.contains(e.target)) {
                notifDropdown.classList.remove('active');
            }
        });
    }

    // ============================================================
    // 4. ADD PRODUCT FORM
    // ============================================================
    function initAddProductForm() {
        var form = document.getElementById('addProductForm');
        if (!form) return;

        function setupFileUpload(areaId, inputId, previewId, countId, maxFiles, clearBtnId) {
            var area = document.getElementById(areaId);
            var input = document.getElementById(inputId);
            var preview = document.getElementById(previewId);
            var countEl = document.getElementById(countId);
            var clearBtn = document.getElementById(clearBtnId);
            var files = [];

            if (!area || !input || !preview) return null;

            area.addEventListener('click', function() { input.click(); });

            area.addEventListener('dragover', function(e) {
                e.preventDefault();
                area.classList.add('drag-over');
            });
            area.addEventListener('dragleave', function() {
                area.classList.remove('drag-over');
            });
            area.addEventListener('drop', function(e) {
                e.preventDefault();
                area.classList.remove('drag-over');
                handleFiles(e.dataTransfer.files);
            });

            input.addEventListener('change', function() {
                handleFiles(input.files);
            });

            function handleFiles(fileList) {
                var incoming = Array.from(fileList).filter(function(f) {
                    return f.type.startsWith('image/');
                });
                if (maxFiles === 1) {
                    files = incoming.slice(0, 1);
                } else {
                    files = files.concat(incoming).slice(0, maxFiles);
                }
                renderPreviews();
                updateCount();
            }

            function renderPreviews() {
                preview.innerHTML = '';
                if (files.length === 0) {
                    if (clearBtn) clearBtn.style.display = 'none';
                    return;
                }
                if (clearBtn) clearBtn.style.display = 'inline-flex';

                files.forEach(function(file, index) {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        var item = document.createElement('div');
                        item.className = 'preview-item';
                        item.innerHTML = [
                            '<img src="' + e.target.result + '" alt="Preview" />',
                            '<button type="button" class="preview-remove" aria-label="Remove image">',
                            '<i class="fas fa-times"></i>',
                            '</button>'
                        ].join('');
                        item.querySelector('.preview-remove').addEventListener('click', function() {
                            files.splice(index, 1);
                            renderPreviews();
                            updateCount();
                        });
                        preview.appendChild(item);
                    };
                    reader.readAsDataURL(file);
                });
            }

            function updateCount() {
                if (countEl) {
                    countEl.textContent = files.length + ' / ' + maxFiles;
                }
            }

            if (clearBtn) {
                clearBtn.addEventListener('click', function() {
                    files = [];
                    renderPreviews();
                    updateCount();
                    input.value = '';
                });
            }

            return {
                reset: function() {
                    files = [];
                    renderPreviews();
                    updateCount();
                    input.value = '';
                },
                getFiles: function() { return files; }
            };
        }

        var productUpload = setupFileUpload(
            'productImagesArea', 'productImages',
            'productImagesPreview', 'productCount', 5, 'clearProductImages'
        );
        var invoiceUpload = setupFileUpload(
            'invoiceImageArea', 'invoiceImage',
            'invoiceImagePreview', 'invoiceCount', 1, null
        );

        var warrantyInput = document.getElementById('warrantyPeriod');
        if (warrantyInput) {
            warrantyInput.addEventListener('input', function() {
                if (this.value < 1 && this.value !== '') this.value = '';
            });
        }

        var formInputs = form.querySelectorAll('.form-input');
        formInputs.forEach(function(input) {
            input.addEventListener('blur', function() {
                if (this.hasAttribute('required')) {
                    if (this.value.trim() === '') {
                        this.classList.add('is-invalid');
                        this.classList.remove('is-valid');
                    } else {
                        this.classList.remove('is-invalid');
                        this.classList.add('is-valid');
                    }
                }
            });
            input.addEventListener('input', function() {
                if (this.value.trim() !== '') {
                    this.classList.remove('is-invalid');
                    this.classList.add('is-valid');
                }
            });
        });

        function saveProduct(data) {
            var products = JSON.parse(localStorage.getItem('warrantyProducts') || '[]');
            data.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
            data.createdAt = new Date().toISOString();
            products.push(data);
            localStorage.setItem('warrantyProducts', JSON.stringify(products));
        }

        form.addEventListener('submit', function(e) {
            e.preventDefault();

            if (!this.checkValidity()) {
                this.reportValidity();
                return;
            }

            var productData = {
                productName: document.getElementById('productName').value.trim(),
                brandName: document.getElementById('brandName').value.trim(),
                retailerName: document.getElementById('retailerName').value.trim(),
                purchaseDate: document.getElementById('purchaseDate').value,
                warrantyPeriod: document.getElementById('warrantyPeriod').value,
                warrantyUnit: document.getElementById('warrantyUnit').value,
                productImages: (productUpload ? productUpload.getFiles().length : 0),
                hasInvoice: (invoiceUpload ? invoiceUpload.getFiles().length > 0 : false)
            };

            saveProduct(productData);

            alert('✅ Product saved successfully!');

            form.reset();
            if (productUpload) productUpload.reset();
            if (invoiceUpload) invoiceUpload.reset();
            form.querySelectorAll('.form-input').forEach(function(el) {
                el.classList.remove('is-valid', 'is-invalid');
            });
            if (warrantyInput) warrantyInput.value = '';

            loadNotifications();
        });

        var resetBtn = document.getElementById('resetForm');
        if (resetBtn) {
            resetBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (confirm('Clear all form fields and uploaded images?')) {
                    form.reset();
                    if (productUpload) productUpload.reset();
                    if (invoiceUpload) invoiceUpload.reset();
                    form.querySelectorAll('.form-input').forEach(function(el) {
                        el.classList.remove('is-valid', 'is-invalid');
                    });
                    if (warrantyInput) warrantyInput.value = '';
                }
            });
        }
    }

    // ============================================================
// 5. PRODUCTS DASHBOARD
// ============================================================
function loadDashboard() {
    const grid = document.getElementById('productsGrid');
    const empty = document.getElementById('productsEmpty');
    const totalEl = document.getElementById('totalProducts');
    const activeEl = document.getElementById('activeProducts');
    const expiringEl = document.getElementById('expiringProducts');
    const expiredEl = document.getElementById('expiredProducts');

    if (!grid) return; // Not on products page

    const products = JSON.parse(localStorage.getItem('warrantyProducts') || '[]');
    const today = new Date();

    let activeCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;

    // Process each product with expiry status
    const processedProducts = products.map(function(product) {
        const purchaseDate = new Date(product.purchaseDate);
        const warrantyMonths = product.warrantyUnit === 'years'
            ? parseInt(product.warrantyPeriod) * 12
            : parseInt(product.warrantyPeriod);
        const expiryDate = new Date(purchaseDate);
        expiryDate.setMonth(expiryDate.getMonth() + warrantyMonths);

        const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

        let status, statusClass;
        if (daysLeft < 0) {
            status = 'Expired';
            statusClass = 'expired';
            expiredCount++;
        } else if (daysLeft <= 30) {
            status = 'Expiring Soon';
            statusClass = 'expiring';
            expiringCount++;
        } else {
            status = 'Active';
            statusClass = 'active';
            activeCount++;
        }

        return {
            ...product,
            expiryDate: expiryDate,
            daysLeft: daysLeft,
            status: status,
            statusClass: statusClass
        };
    });

    // Update stats
    if (totalEl) totalEl.textContent = products.length;
    if (activeEl) activeEl.textContent = activeCount;
    if (expiringEl) expiringEl.textContent = expiringCount;
    if (expiredEl) expiredEl.textContent = expiredCount;

    // Render products
    if (products.length === 0) {
        grid.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    // Get current filter and sort
    const filter = document.querySelector('.filter-btn.active')?.getAttribute('data-filter') || 'all';
    const sort = document.getElementById('sortProducts')?.value || 'newest';

    // Filter
    let filtered = processedProducts;
    if (filter === 'active') {
        filtered = filtered.filter(function(p) { return p.statusClass === 'active'; });
    } else if (filter === 'expiring') {
        filtered = filtered.filter(function(p) { return p.statusClass === 'expiring'; });
    } else if (filter === 'expired') {
        filtered = filtered.filter(function(p) { return p.statusClass === 'expired'; });
    }

    // Sort
    filtered.sort(function(a, b) {
        if (sort === 'newest') {
            return new Date(b.createdAt) - new Date(a.createdAt);
        } else if (sort === 'oldest') {
            return new Date(a.createdAt) - new Date(b.createdAt);
        } else if (sort === 'expiring') {
            return a.daysLeft - b.daysLeft;
        } else if (sort === 'name') {
            return a.productName.localeCompare(b.productName);
        }
        return 0;
    });

    let html = '';
    filtered.forEach(function(product) {
        const formattedDate = new Date(product.purchaseDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        const expiryFormatted = new Date(product.expiryDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        html += `
            <div class="product-card" data-id="${product.id}">
                <div class="product-card-header">
                    <div class="product-card-icon">
                        <i class="fas fa-box"></i>
                    </div>
                    <span class="product-status-badge ${product.statusClass}">${product.status}</span>
                </div>
                <div class="product-card-name">${product.productName}</div>
                <div class="product-card-brand">${product.brandName}</div>
                <div class="product-card-details">
                    <div class="detail-item">
                        <div class="detail-label">Retailer</div>
                        <div class="detail-value">${product.retailerName}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Purchased</div>
                        <div class="detail-value">${formattedDate}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Warranty</div>
                        <div class="detail-value">${product.warrantyPeriod} ${product.warrantyUnit}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Expires</div>
                        <div class="detail-value">${expiryFormatted}</div>
                    </div>
                </div>
                <div class="product-card-actions">
                    <button class="btn-small btn-view" data-id="${product.id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn-small btn-delete" data-id="${product.id}">
                        <i class="fas fa-trash-alt"></i> Delete
                    </button>
                </div>
            </div>
        `;
    });

    grid.innerHTML = html;

    // ---- Event listeners for product actions ----
    grid.querySelectorAll('.btn-view').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const product = processedProducts.find(function(p) { return p.id === id; });
            if (product) {
                alert(
                    '📦 ' + product.productName + '\n' +
                    '🏷️ Brand: ' + product.brandName + '\n' +
                    '🏪 Retailer: ' + product.retailerName + '\n' +
                    '📅 Purchased: ' + new Date(product.purchaseDate).toLocaleDateString() + '\n' +
                    '⏱️ Warranty: ' + product.warrantyPeriod + ' ' + product.warrantyUnit + '\n' +
                    '📊 Status: ' + product.status + ' (' + product.daysLeft + ' days left)'
                );
            }
        });
    });

    grid.querySelectorAll('.btn-delete').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            if (confirm('Delete this product permanently?')) {
                let products = JSON.parse(localStorage.getItem('warrantyProducts') || '[]');
                products = products.filter(function(p) { return p.id !== id; });
                localStorage.setItem('warrantyProducts', JSON.stringify(products));
                loadDashboard(); // Refresh
                loadNotifications(); // Update badge
            }
        });
    });
}

// ---- Dashboard filter & sort events ----
function initDashboardControls() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const sortSelect = document.getElementById('sortProducts');

    if (!filterBtns.length && !sortSelect) return;

    filterBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            filterBtns.forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
            loadDashboard();
        });
    });

    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            loadDashboard();
        });
    }
}
    // ============================================================
    // 6. INITIALIZE EVERYTHING
    // ============================================================
    document.addEventListener('DOMContentLoaded', function() {
    initSlider();
    initSearch();
    initNotifications();
    initAddProductForm();
    loadDashboard();
    initDashboardControls();
});

})();