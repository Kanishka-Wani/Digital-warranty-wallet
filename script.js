(function() {
    'use strict';

    // ============================================================
    // AUTH HELPERS
    // ============================================================
    function getCurrentUser() {
        return JSON.parse(localStorage.getItem('warrantyUser') || 'null');
    }

    function getUserProductsKey() {
        const user = getCurrentUser();
        return user ? 'warrantyProducts_' + user.email : null;
    }

    function getUserProducts() {
        const key = getUserProductsKey();
        if (!key) return [];
        return JSON.parse(localStorage.getItem(key) || '[]');
    }

    function saveUserProducts(products) {
        const key = getUserProductsKey();
        if (!key) return;
        localStorage.setItem(key, JSON.stringify(products));
    }

    function isLoggedIn() {
        return !!getCurrentUser();
    }

    function isProtectedPage() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const publicPages = ['index.html', 'about.html', ''];
        return !publicPages.includes(currentPage);
    }

    function openSignInModal() {
        const signinModal = document.getElementById('signinModal');
        const overlay = document.getElementById('authOverlay');
        if (signinModal && overlay) {
            const registerModal = document.getElementById('registerModal');
            if (registerModal) registerModal.classList.remove('active');
            signinModal.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

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
    // 2. SEARCH (user-specific)
    // ============================================================
    function initSearch() {
        if (!isLoggedIn()) return;

        const searchToggle = document.getElementById('searchToggle');
        const searchOverlay = document.getElementById('searchOverlay');
        const searchInput = searchOverlay ? searchOverlay.querySelector('input') : null;
        const notifDropdown = document.getElementById('notifDropdown');

        if (!searchToggle || !searchOverlay || !searchInput) return;

        let resultsContainer = document.createElement('div');
        resultsContainer.className = 'search-results';
        resultsContainer.style.display = 'none';
        searchOverlay.appendChild(resultsContainer);

        searchToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            const isActive = searchOverlay.classList.toggle('active');
            if (isActive) {
                setTimeout(function() { searchInput.focus(); }, 100);
                resultsContainer.innerHTML = '';
                resultsContainer.style.display = 'none';
                searchInput.value = '';
            }
            if (notifDropdown) notifDropdown.classList.remove('active');
        });

        searchInput.addEventListener('input', function(e) {
            const query = this.value.trim().toLowerCase();
            if (query.length === 0) {
                resultsContainer.innerHTML = '';
                resultsContainer.style.display = 'none';
                return;
            }

            const products = getUserProducts();
            const matches = products.filter(function(product) {
                return product.productName.toLowerCase().includes(query) ||
                       product.brandName.toLowerCase().includes(query);
            });

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
                    const purchaseDate = new Date(product.purchaseDate);
                    const warrantyMonths = product.warrantyUnit === 'years'
                        ? parseInt(product.warrantyPeriod) * 12
                        : parseInt(product.warrantyPeriod);
                    const expiryDate = new Date(purchaseDate);
                    expiryDate.setMonth(expiryDate.getMonth() + warrantyMonths);
                    const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
                    let statusText = '✅ Active';
                    let statusColor = '#14b8a6';
                    if (daysLeft < 0) { statusText = '❌ Expired'; statusColor = '#dc2626'; }
                    else if (daysLeft <= 30) { statusText = '⚠️ Expiring soon'; statusColor = '#f59e0b'; }

                    html += `
                        <div class="search-result-item" data-id="${product.id}">
                            <div class="search-result-icon"><i class="fas fa-box"></i></div>
                            <div class="search-result-info">
                                <div class="search-result-name">${product.productName}</div>
                                <div class="search-result-brand">${product.brandName}</div>
                            </div>
                            <div class="search-result-status" style="color:${statusColor}">${statusText}</div>
                        </div>
                    `;
                });
                resultsContainer.innerHTML = html;
                resultsContainer.style.display = 'block';

                resultsContainer.querySelectorAll('.search-result-item').forEach(function(item) {
                    item.addEventListener('click', function() {
                        const productId = this.getAttribute('data-id');
                        const products = getUserProducts();
                        const product = products.find(function(p) { return p.id === productId; });
                        if (product) {
                            alert(
                                '📦 Product: ' + product.productName + '\n' +
                                '🏷️ Brand: ' + product.brandName + '\n' +
                                '🏪 Retailer: ' + product.retailerName + '\n' +
                                '📅 Purchased: ' + product.purchaseDate + '\n' +
                                '⏱️ Warranty: ' + product.warrantyPeriod + ' ' + product.warrantyUnit
                            );
                            searchOverlay.classList.remove('active');
                            resultsContainer.style.display = 'none';
                            searchInput.value = '';
                        }
                    });
                });
            }
        });

        document.addEventListener('click', function(e) {
            if (!searchToggle.contains(e.target) && !searchOverlay.contains(e.target)) {
                searchOverlay.classList.remove('active');
                resultsContainer.style.display = 'none';
                searchInput.value = '';
            }
        });

        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                searchOverlay.classList.remove('active');
                resultsContainer.style.display = 'none';
                this.value = '';
            }
        });
    }

    // ============================================================
    // 3. NOTIFICATIONS (user-specific)
    // ============================================================
    function loadNotifications() {
        const notifList = document.getElementById('notificationList');
        const emptyMsg = document.getElementById('notificationEmpty');
        const badge = document.getElementById('notifBadge');

        if (!notifList) return;

        const products = getUserProducts();
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

        notifications.sort(function(a, b) { return a.daysLeft - b.daysLeft; });

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
        if (!isLoggedIn()) return;

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
    // 4. ADD PRODUCT FORM (user-specific save)
    // ============================================================
    function initAddProductForm() {
        if (!isLoggedIn()) return;

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
            area.addEventListener('dragover', function(e) { e.preventDefault(); area.classList.add('drag-over'); });
            area.addEventListener('dragleave', function() { area.classList.remove('drag-over'); });
            area.addEventListener('drop', function(e) {
                e.preventDefault();
                area.classList.remove('drag-over');
                handleFiles(e.dataTransfer.files);
            });
            input.addEventListener('change', function() { handleFiles(input.files); });

            function handleFiles(fileList) {
                var incoming = Array.from(fileList).filter(function(f) { return f.type.startsWith('image/'); });
                if (maxFiles === 1) files = incoming.slice(0, 1);
                else files = files.concat(incoming).slice(0, maxFiles);
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
                        item.innerHTML = `
                            <img src="${e.target.result}" alt="Preview" />
                            <button type="button" class="preview-remove" aria-label="Remove image">
                                <i class="fas fa-times"></i>
                            </button>
                        `;
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
                if (countEl) countEl.textContent = files.length + ' / ' + maxFiles;
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

        var productUpload = setupFileUpload('productImagesArea', 'productImages', 'productImagesPreview', 'productCount', 5, 'clearProductImages');
        var invoiceUpload = setupFileUpload('invoiceImageArea', 'invoiceImage', 'invoiceImagePreview', 'invoiceCount', 1, null);

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

        form.addEventListener('submit', function(e) {
            e.preventDefault();

            // ---- Custom validation ----
            let isValid = true;
            const productName = document.getElementById('productName').value.trim();
            const brandName = document.getElementById('brandName').value.trim();
            const retailerName = document.getElementById('retailerName').value.trim();
            const purchaseDate = document.getElementById('purchaseDate').value;
            const warrantyPeriod = document.getElementById('warrantyPeriod').value;

            // Clear previous custom errors
            form.querySelectorAll('.custom-error').forEach(function(el) { el.remove(); });
            form.querySelectorAll('.form-input.is-invalid').forEach(function(el) { el.classList.remove('is-invalid'); });

            function showCustomError(inputId, message) {
                const input = document.getElementById(inputId);
                if (input) {
                    input.classList.add('is-invalid');
                    const error = document.createElement('div');
                    error.className = 'custom-error';
                    error.style.cssText = 'color: #ef4444; font-size: 0.8rem; margin-top: 4px;';
                    error.textContent = message;
                    input.parentNode.appendChild(error);
                }
                isValid = false;
            }

            if (!productName) showCustomError('productName', 'Please enter a product name.');
            if (!brandName) showCustomError('brandName', 'Please enter a brand name.');
            if (!retailerName) showCustomError('retailerName', 'Please enter a retailer name.');
            if (!purchaseDate) showCustomError('purchaseDate', 'Please select a purchase date.');
            else {
                const selectedDate = new Date(purchaseDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (selectedDate > today) {
                    showCustomError('purchaseDate', 'Purchase date cannot be in the future.');
                }
            }
            if (!warrantyPeriod || parseInt(warrantyPeriod) < 1) {
                showCustomError('warrantyPeriod', 'Please enter a valid warranty period (minimum 1).');
            }

            if (!isValid) {
                const firstError = form.querySelector('.is-invalid');
                if (firstError) {
                    firstError.focus();
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return;
            }

            // ---- Process images and save ----
            var productImages = productUpload ? productUpload.getFiles() : [];
            var invoiceFiles = invoiceUpload ? invoiceUpload.getFiles() : [];

            var imageData = '';
            var invoiceData = '';
            var filesToProcess = 0;
            var processedCount = 0;

            function finalizeSave() {
                var productData = {
                    productName: productName,
                    brandName: brandName,
                    retailerName: retailerName,
                    purchaseDate: purchaseDate,
                    warrantyPeriod: warrantyPeriod,
                    warrantyUnit: document.getElementById('warrantyUnit').value,
                    productImages: productUpload ? productUpload.getFiles().length : 0,
                    hasInvoice: invoiceUpload ? invoiceUpload.getFiles().length > 0 : false,
                    imageData: imageData,
                    invoiceData: invoiceData
                };

                var products = getUserProducts();
                productData.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
                productData.createdAt = new Date().toISOString();
                products.push(productData);
                saveUserProducts(products);

                localStorage.setItem('warrantySuccess', '✅ Product "' + productName + '" saved successfully!');
                window.location.href = 'products.html';
            }

            function onFileProcessed() {
                processedCount++;
                if (processedCount === filesToProcess) {
                    finalizeSave();
                }
            }

            if (productImages.length > 0) filesToProcess++;
            if (invoiceFiles.length > 0) filesToProcess++;

            if (filesToProcess === 0) {
                finalizeSave();
                return;
            }

            if (productImages.length > 0) {
                var reader1 = new FileReader();
                reader1.onload = function(e) {
                    imageData = e.target.result;
                    onFileProcessed();
                };
                reader1.readAsDataURL(productImages[0]);
            }

            if (invoiceFiles.length > 0) {
                var reader2 = new FileReader();
                reader2.onload = function(e) {
                    invoiceData = e.target.result;
                    onFileProcessed();
                };
                reader2.readAsDataURL(invoiceFiles[0]);
            }
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

        if (!grid) return;

        // Show success message if present
        const successMsg = localStorage.getItem('warrantySuccess');
        if (successMsg) {
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #065f46;
                color: #d1fae5;
                padding: 16px 24px;
                border-radius: 12px;
                font-weight: 600;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                z-index: 99999;
                border-left: 4px solid #34d399;
                animation: slideInRight 0.5s ease;
                max-width: 380px;
            `;
            toast.textContent = successMsg;
            document.body.appendChild(toast);
            setTimeout(function() {
                toast.style.transition = 'opacity 0.5s ease';
                toast.style.opacity = '0';
                setTimeout(function() { toast.remove(); }, 500);
            }, 4000);
            localStorage.removeItem('warrantySuccess');
        }

        const products = getUserProducts();
        const today = new Date();

        let activeCount = 0, expiringCount = 0, expiredCount = 0;

        const processedProducts = products.map(function(product) {
            const purchaseDate = new Date(product.purchaseDate);
            const warrantyMonths = product.warrantyUnit === 'years'
                ? parseInt(product.warrantyPeriod) * 12
                : parseInt(product.warrantyPeriod);
            const expiryDate = new Date(purchaseDate);
            expiryDate.setMonth(expiryDate.getMonth() + warrantyMonths);
            const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

            let status, statusClass;
            if (daysLeft < 0) { status = 'Expired'; statusClass = 'expired'; expiredCount++; }
            else if (daysLeft <= 30) { status = 'Expiring Soon'; statusClass = 'expiring'; expiringCount++; }
            else { status = 'Active'; statusClass = 'active'; activeCount++; }

            return { ...product, expiryDate, daysLeft, status, statusClass };
        });

        if (totalEl) totalEl.textContent = products.length;
        if (activeEl) activeEl.textContent = activeCount;
        if (expiringEl) expiringEl.textContent = expiringCount;
        if (expiredEl) expiredEl.textContent = expiredCount;

        if (products.length === 0) {
            grid.innerHTML = '';
            empty.style.display = 'block';
            return;
        }
        empty.style.display = 'none';

        const filter = document.querySelector('.filter-btn.active')?.getAttribute('data-filter') || 'all';
        const sort = document.getElementById('sortProducts')?.value || 'newest';

        let filtered = processedProducts;
        if (filter === 'active') filtered = filtered.filter(function(p) { return p.statusClass === 'active'; });
        else if (filter === 'expiring') filtered = filtered.filter(function(p) { return p.statusClass === 'expiring'; });
        else if (filter === 'expired') filtered = filtered.filter(function(p) { return p.statusClass === 'expired'; });

        filtered.sort(function(a, b) {
            if (sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
            if (sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
            if (sort === 'expiring') return a.daysLeft - b.daysLeft;
            if (sort === 'name') return a.productName.localeCompare(b.productName);
            return 0;
        });

        let html = '';
        filtered.forEach(function(product) {
            const formattedDate = new Date(product.purchaseDate).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
            const expiryFormatted = new Date(product.expiryDate).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });

            let imageHtml = '';
            if (product.imageData) {
                imageHtml = `<img src="${product.imageData}" alt="${product.productName}" />`;
            } else {
                imageHtml = `<i class="fas fa-box image-placeholder"></i>`;
            }

            html += `
                <div class="product-card" data-id="${product.id}">
                    <div class="product-card-image">
                        ${imageHtml}
                        <span class="image-status-badge ${product.statusClass}">${product.status}</span>
                    </div>
                    <div class="product-card-body">
                        <div class="product-card-name">${product.productName}</div>
                        <div class="product-card-brand"><i class="fas fa-tag"></i> ${product.brandName}</div>
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
                </div>
            `;
        });

        grid.innerHTML = html;

        grid.querySelectorAll('.btn-view').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const product = processedProducts.find(function(p) { return p.id === id; });
                if (product) {
                    openProductDetail(product);
                }
            });
        });

        grid.querySelectorAll('.btn-delete').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                if (confirm('Delete this product permanently?')) {
                    let products = getUserProducts();
                    products = products.filter(function(p) { return p.id !== id; });
                    saveUserProducts(products);
                    loadDashboard();
                    loadNotifications();
                }
            });
        });
    }

    function initDashboardControls() {
        if (!isLoggedIn()) return;

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
            sortSelect.addEventListener('change', function() { loadDashboard(); });
        }
    }

    // ============================================================
    // 6. OPEN PRODUCT DETAIL
    // ============================================================
    function openProductDetail(product) {
        const modal = document.getElementById('productDetailModal');
        const body = document.getElementById('detailBody');
        if (!modal || !body) return;

        const statusClass = product.statusClass;
        const purchaseDate = new Date(product.purchaseDate).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        const expiryDate = new Date(product.expiryDate).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        let imageHtml = '';
        if (product.imageData) {
            imageHtml = `<img src="${product.imageData}" alt="${product.productName}" />`;
        } else {
            imageHtml = `<i class="fas fa-box detail-placeholder"></i>`;
        }

        let daysLeftText = '';
        if (statusClass === 'expiring') {
            daysLeftText = `<span style="color:#f59e0b; font-size:0.9rem;">(${product.daysLeft} days left)</span>`;
        } else if (statusClass === 'expired') {
            daysLeftText = `<span style="color:#dc2626; font-size:0.9rem;">(Expired ${Math.abs(product.daysLeft)} days ago)</span>`;
        }

        let invoiceHtml = '';
        if (product.invoiceData) {
            invoiceHtml = `
                <div style="margin-top:16px; text-align:center;">
                    <button class="btn btn-primary" id="downloadInvoiceBtn" style="width:100%; justify-content:center; padding:12px;">
                        <i class="fas fa-file-invoice"></i> Download Invoice
                    </button>
                </div>
            `;
        } else if (product.hasInvoice) {
            invoiceHtml = `
                <div style="margin-top:16px; text-align:center; color:#6b7280; font-size:0.9rem;">
                    <i class="fas fa-file-invoice"></i> Invoice was uploaded but data not available
                </div>
            `;
        }

        body.innerHTML = `
            <div class="detail-product-image">${imageHtml}</div>
            <div class="detail-title">${product.productName}</div>
            <div class="detail-subtitle"><i class="fas fa-tag"></i> ${product.brandName}</div>
            <div>
                <span class="detail-status-badge ${statusClass}">${product.status}</span>
                ${daysLeftText}
            </div>
            <div style="margin-top:12px;">
                <div class="detail-row"><span class="label">Retailer</span><span class="value">${product.retailerName}</span></div>
                <div class="detail-row"><span class="label">Purchase Date</span><span class="value">${purchaseDate}</span></div>
                <div class="detail-row"><span class="label">Warranty Period</span><span class="value">${product.warrantyPeriod} ${product.warrantyUnit}</span></div>
                <div class="detail-row"><span class="label">Expiry Date</span><span class="value">${expiryDate}</span></div>
                ${product.productImages ? `<div class="detail-row"><span class="label">Images</span><span class="value">${product.productImages} uploaded</span></div>` : ''}
                ${product.hasInvoice ? `<div class="detail-row"><span class="label">Invoice</span><span class="value">✅ Uploaded</span></div>` : ''}
            </div>
            ${invoiceHtml}
        `;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        const downloadBtn = document.getElementById('downloadInvoiceBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', function() {
                downloadInvoice(product.invoiceData, product.productName);
            });
        }
    }

    // ============================================================
    // 7. DOWNLOAD INVOICE
    // ============================================================
    function downloadInvoice(base64Data, productName) {
        if (!base64Data) {
            alert('No invoice found for this product.');
            return;
        }

        try {
            const link = document.createElement('a');
            link.href = base64Data;
            const mimeType = base64Data.match(/data:([^;]+)/);
            const ext = mimeType && mimeType[1] ? mimeType[1].split('/')[1] : 'png';
            const date = new Date().toISOString().split('T')[0];
            const fileName = `${productName.replace(/\s+/g, '_')}_invoice_${date}.${ext}`;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading invoice:', error);
            alert('❌ Failed to download invoice. Please try again.');
        }
    }

    // ---- Close Detail Modal ----
    document.addEventListener('DOMContentLoaded', function() {
        const closeBtn = document.getElementById('detailClose');
        const overlay = document.getElementById('detailOverlay');

        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                document.getElementById('productDetailModal').classList.remove('active');
                document.body.style.overflow = '';
            });
        }
        if (overlay) {
            overlay.addEventListener('click', function() {
                document.getElementById('productDetailModal').classList.remove('active');
                document.body.style.overflow = '';
            });
        }
    });

    // ============================================================
    // 8. NAVIGATION – Dynamic based on login state
    // ============================================================
   // ============================================================
// SIDEBAR CONTROLS
// ============================================================
function initSidebar() {
    const hamburger = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('mobileSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const closeBtn = document.getElementById('sidebarClose');

    function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (hamburger) hamburger.classList.add('active');
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        if (hamburger) hamburger.classList.remove('active');
    }

    if (hamburger) {
        hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            if (sidebar.classList.contains('open')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
    }
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);

    // Close sidebar on nav link click (mobile)
    document.querySelectorAll('.sidebar-nav a').forEach(function(link) {
        link.addEventListener('click', closeSidebar);
    });

    // Sidebar signin/register buttons
    const sidebarSignin = document.getElementById('sidebarSigninBtn');
    const sidebarRegister = document.getElementById('sidebarRegisterBtn');
    if (sidebarSignin) {
        sidebarSignin.addEventListener('click', function() {
            closeSidebar();
            const signinBtn = document.getElementById('signinBtn');
            if (signinBtn) signinBtn.click();
        });
    }
    if (sidebarRegister) {
        sidebarRegister.addEventListener('click', function() {
            closeSidebar();
            const registerBtn = document.getElementById('registerBtn');
            if (registerBtn) registerBtn.click();
        });
    }
}

// ============================================================
// UPDATE NAVIGATION (desktop + sidebar)
// ============================================================
function updateNavForAuth() {
    const loggedIn = isLoggedIn();

    // 1. Desktop navigation (menu)
    const desktopLinks = document.querySelectorAll('.menu li a');
    desktopLinks.forEach(function(link) {
        const text = link.textContent.trim();
        const parentLi = link.closest('li');
        if (!parentLi) return;
        if (loggedIn) {
            parentLi.style.display = '';
        } else {
            if (text === 'Home' || text === 'About') {
                parentLi.style.display = '';
            } else {
                parentLi.style.display = 'none';
            }
        }
    });

    // 2. Sidebar navigation (mobile)
    const sidebarLinks = document.querySelectorAll('.sidebar-nav li a');
    sidebarLinks.forEach(function(link) {
        const text = link.textContent.trim();
        const parentLi = link.closest('li');
        if (!parentLi) return;
        if (loggedIn) {
            parentLi.style.display = '';
        } else {
            if (text === 'Home' || text === 'About') {
                parentLi.style.display = '';
            } else {
                parentLi.style.display = 'none';
            }
        }
    });

    // 3. Footer links (NEW)
    const footerLinks = document.querySelectorAll('.footer-links li');
    footerLinks.forEach(function(item) {
        const link = item.querySelector('a');
        if (!link) return;
        const text = link.textContent.trim();
        if (loggedIn) {
            item.style.display = '';
        } else {
            // Only show Home and About in footer when logged out
            if (text === 'Home' || text === 'About') {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        }
    });

    // 4. Sidebar auth buttons (show when logged out, hide when logged in)
    const sidebarAuth = document.querySelector('.sidebar-auth');
    if (sidebarAuth) {
        sidebarAuth.style.display = loggedIn ? 'none' : 'flex';
    }

    // 5. Header auth buttons / profile
    const authButtons = document.getElementById('authButtons');
    const profileContainer = document.getElementById('profileContainer');
    if (authButtons) authButtons.style.display = loggedIn ? 'none' : 'flex';
    if (profileContainer) profileContainer.style.display = loggedIn ? 'block' : 'none';

    // 6. Search & Notification visibility (only when logged in)
    const searchToggle = document.getElementById('searchToggle');
    const notifToggle = document.getElementById('notificationToggle');
    if (searchToggle) searchToggle.style.display = loggedIn ? 'flex' : 'none';
    if (notifToggle) notifToggle.style.display = loggedIn ? 'flex' : 'none';
}

    // ============================================================
    // 9. AUTH SYSTEM
    // ============================================================
    function initAuth() {
        const signinBtn = document.getElementById('signinBtn');
        const registerBtn = document.getElementById('registerBtn');
        const signinModal = document.getElementById('signinModal');
        const registerModal = document.getElementById('registerModal');
        const overlay = document.getElementById('authOverlay');
        const closeSignin = document.getElementById('closeSignin');
        const closeRegister = document.getElementById('closeRegister');
        const switchToRegister = document.getElementById('switchToRegister');
        const switchToSignin = document.getElementById('switchToSignin');
        const signinForm = document.getElementById('signinForm');
        const registerForm = document.getElementById('registerForm');
        const authButtons = document.getElementById('authButtons');
        const profileContainer = document.getElementById('profileContainer');
        const profileAvatar = document.getElementById('profileAvatar');
        const profileDropdown = document.getElementById('profileDropdown');
        const profileInitials = document.getElementById('profileInitials');
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const logoutBtn = document.getElementById('logoutBtn');

        function openModal(modal) {
            if (!modal || !overlay) return;
            modal.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeAllModals() {
            if (signinModal) signinModal.classList.remove('active');
            if (registerModal) registerModal.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
            document.body.style.overflow = '';
            updateAuthBlocker();
        }

        function checkAuthState() {
            const user = getCurrentUser();
            if (user && authButtons && profileContainer && profileInitials && profileName && profileEmail) {
                authButtons.style.display = 'none';
                profileContainer.style.display = 'block';
                const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                profileInitials.textContent = initials;
                profileName.textContent = user.name;
                profileEmail.textContent = user.email;
            } else if (authButtons && profileContainer) {
                authButtons.style.display = 'flex';
                profileContainer.style.display = 'none';
            }
            updateNavForAuth();
        }

        if (profileAvatar && profileDropdown) {
            profileAvatar.addEventListener('click', function(e) {
                e.stopPropagation();
                profileDropdown.classList.toggle('active');
            });

            document.addEventListener('click', function(e) {
                if (profileContainer && !profileContainer.contains(e.target)) {
                    profileDropdown.classList.remove('active');
                }
            });
        }

        if (signinBtn && signinModal) {
            signinBtn.addEventListener('click', function() {
                closeAllModals();
                openModal(signinModal);
            });
        }
        if (registerBtn && registerModal) {
            registerBtn.addEventListener('click', function() {
                closeAllModals();
                openModal(registerModal);
            });
        }
        if (closeSignin) closeSignin.addEventListener('click', closeAllModals);
        if (closeRegister) closeRegister.addEventListener('click', closeAllModals);
        if (overlay) overlay.addEventListener('click', closeAllModals);

        if (switchToRegister && registerModal) {
            switchToRegister.addEventListener('click', function(e) {
                e.preventDefault();
                closeAllModals();
                openModal(registerModal);
            });
        }
        if (switchToSignin && signinModal) {
            switchToSignin.addEventListener('click', function(e) {
                e.preventDefault();
                closeAllModals();
                openModal(signinModal);
            });
        }

        // ---- Sign In ----
        if (signinForm) {
            signinForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const email = document.getElementById('signinEmail').value.trim();
                const password = document.getElementById('signinPassword').value;

                // Get users from localStorage
                let users = JSON.parse(localStorage.getItem('warrantyUsers') || '[]');

                // If no users exist yet, create a default admin for testing
                if (users.length === 0) {
                    users = [
                        { name: 'Demo User', email: 'demo@warranty.com', password: 'demo123' }
                    ];
                    localStorage.setItem('warrantyUsers', JSON.stringify(users));
                }

                const user = users.find(function(u) {
                    return u.email === email && u.password === password;
                });

                if (user) {
                    localStorage.setItem('warrantyUser', JSON.stringify({ name: user.name, email: user.email }));
                    closeAllModals();
                    checkAuthState();
                    updateAuthBlocker();
                    // Reload to refresh the page
                    location.reload();
                    signinForm.reset();
                } else {
                    alert('❌ Invalid email or password. Please try again.');
                }
            });
        }

        // ---- Register ----
        if (registerForm) {
            registerForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const name = document.getElementById('registerName').value.trim();
                const email = document.getElementById('registerEmail').value.trim();
                const password = document.getElementById('registerPassword').value;
                const confirm = document.getElementById('registerConfirm').value;

                if (password !== confirm) {
                    alert('❌ Passwords do not match.');
                    return;
                }
                if (password.length < 6) {
                    alert('❌ Password must be at least 6 characters.');
                    return;
                }

                let users = JSON.parse(localStorage.getItem('warrantyUsers') || '[]');

                if (users.some(function(u) { return u.email === email; })) {
                    alert('❌ An account with this email already exists.');
                    return;
                }

                const newUser = { name, email, password };
                users.push(newUser);
                localStorage.setItem('warrantyUsers', JSON.stringify(users));

                // Auto-login after registration
                localStorage.setItem('warrantyUser', JSON.stringify({ name, email }));
                closeAllModals();
                checkAuthState();
                updateAuthBlocker();
                alert('✅ Account created! Welcome, ' + name + '!');
                location.reload();
                registerForm.reset();
            });
        }

        // ---- Logout ----
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                localStorage.removeItem('warrantyUser');
                if (profileDropdown) profileDropdown.classList.remove('active');
                checkAuthState();
                updateAuthBlocker();
                // Redirect to home if on protected page
                if (isProtectedPage()) {
                    window.location.href = 'index.html';
                } else {
                    location.reload();
                }
            });
        }

        checkAuthState();

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeAllModals();
        });
    }

    // ============================================================
    // 10. PAGE PROTECTION – Full-page blocker
    // ============================================================
    function createAuthBlocker() {
        const existing = document.getElementById('authBlocker');
        if (existing) existing.remove();

        const blocker = document.createElement('div');
        blocker.id = 'authBlocker';
        blocker.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(17, 24, 39, 0.97);
            backdrop-filter: blur(8px);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            padding: 24px;
            box-sizing: border-box;
            margin: 0;
        `;
        blocker.innerHTML = `
            <div style="background: #1f2937; border-radius: 16px; padding: 48px 40px; max-width: 400px; width: 100%; text-align: center; border: 1px solid #374151; box-shadow: 0 20px 60px rgba(0,0,0,0.6);">
                <i class="fas fa-lock" style="font-size: 3rem; color: #f97316; margin-bottom: 16px;"></i>
                <h2 style="font-size: 1.6rem; font-weight: 700; color: #fff; margin-bottom: 8px;">Sign In Required</h2>
                <p style="color: #9ca3af; font-size: 1rem; margin-bottom: 24px;">Please sign in to access this page.</p>
                <button id="blockerSigninBtn" class="btn btn-primary" style="padding: 12px 32px; font-size: 1rem; cursor:pointer;">
                    <i class="fas fa-sign-in-alt"></i> Sign In
                </button>
                <br>
                <a href="index.html" style="display: inline-block; margin-top: 14px; color: #6b7280; text-decoration: underline; font-size: 0.9rem;">Go to Home</a>
            </div>
        `;
        document.body.appendChild(blocker);

        document.getElementById('blockerSigninBtn').addEventListener('click', function() {
            openSignInModal();
        });

        // Hide all other content
        const keepVisibleIds = ['authBlocker', 'signinModal', 'registerModal', 'authOverlay'];
        const bodyChildren = document.body.children;
        for (let i = 0; i < bodyChildren.length; i++) {
            const child = bodyChildren[i];
            if (!keepVisibleIds.includes(child.id)) {
                child.style.display = 'none';
            }
        }

        [document.getElementById('signinModal'), document.getElementById('registerModal'), document.getElementById('authOverlay')].forEach(function(el) {
            if (el) el.style.zIndex = '1000000';
        });

        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
    }

    function removeAuthBlocker() {
        const blocker = document.getElementById('authBlocker');
        if (blocker) blocker.remove();

        const bodyChildren = document.body.children;
        for (let i = 0; i < bodyChildren.length; i++) {
            const child = bodyChildren[i];
            child.style.display = '';
        }

        [document.getElementById('signinModal'), document.getElementById('registerModal'), document.getElementById('authOverlay')].forEach(function(el) {
            if (el) el.style.zIndex = '';
        });

        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
    }

    function updateAuthBlocker() {
        if (isProtectedPage() && !isLoggedIn()) {
            createAuthBlocker();
        } else {
            removeAuthBlocker();
        }
    }

    function requireAuth() {
        updateAuthBlocker();
        updateNavForAuth();
    }

    // ============================================================
    // 11. INITIALIZE EVERYTHING
    // ============================================================
    document.addEventListener('DOMContentLoaded', function() {
        initAuth();
        requireAuth();
        initSlider();
        initSearch();
        initNotifications();
        initAddProductForm();
        loadDashboard();
        initDashboardControls();
        
    });

})();