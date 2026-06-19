
(function() {
    'use strict';
    
    // 1. SLIDER (Home page)
  
    function initSlider() {
        const slides = document.querySelectorAll('.hero-slide');
        const dots = document.querySelectorAll('.dot');
        const prevBtn = document.getElementById('prevSlide');
        const nextBtn = document.getElementById('nextSlide');

        if (!slides.length) return; // Not on home page

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

        // Event listeners
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
                let index = parseInt(this.getAttribute('data-index'), 10);
                if (!isNaN(index) && index !== currentIndex) {
                    stopAutoPlay();
                    goToSlide(index);
                    startAutoPlay();
                }
            });
        });

        let hero = document.querySelector('.hero-section');
        if (hero) {
            hero.addEventListener('mouseenter', stopAutoPlay);
            hero.addEventListener('mouseleave', startAutoPlay);
        }

        startAutoPlay();
    }
    // 2. HEADER: SEARCH TOGGLE (Shared)
    function initSearch() {
        const searchToggle = document.getElementById('searchToggle');
        const searchOverlay = document.getElementById('searchOverlay');
        const notifDropdown = document.getElementById('notifDropdown');

        if (!searchToggle || !searchOverlay) return;

        searchToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            searchOverlay.classList.toggle('active');
            if (notifDropdown) notifDropdown.classList.remove('active');
        });

        document.addEventListener('click', function(e) {
            if (!searchToggle.contains(e.target) && !searchOverlay.contains(e.target)) {
                searchOverlay.classList.remove('active');
            }
        });
    }
    // 3. HEADER: NOTIFICATION TOGGLE (Shared)
    function initNotifications() {
        const notifToggle = document.getElementById('notificationToggle');
        const notifDropdown = document.getElementById('notifDropdown');
        const notifBadge = document.getElementById('notifBadge');

        if (!notifToggle || !notifDropdown) return;

        notifToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            notifDropdown.classList.toggle('active');
           let searchOverlay = document.getElementById('searchOverlay');
            if (searchOverlay) searchOverlay.classList.remove('active');
        });

        document.addEventListener('click', function(e) {
            if (!notifToggle.contains(e.target) && !notifDropdown.contains(e.target)) {
                notifDropdown.classList.remove('active');
            }
        });

        // Click on notification item: remove it and update badge
        let notifItems = notifDropdown.querySelectorAll('.notif-item');
        notifItems.forEach(function(item) {
            item.addEventListener('click', function() {
                this.remove();
                let remaining = notifDropdown.querySelectorAll('.notif-item').length;
                if (remaining === 0) {
                    if (notifBadge) notifBadge.style.display = 'none';
                } else {
                    if (notifBadge) notifBadge.textContent = remaining;
                }
                notifDropdown.classList.remove('active');
            });
        });
    }

    // 4. ADD PRODUCT FORM
    
    function initAddProductForm() {
        let form = document.getElementById('addProductForm');
        if (!form) return; // Not on add product page

        // ---- File Upload Setup ----
        function setupFileUpload(areaId, inputId, previewId, countId, maxFiles, clearBtnId) {
            let area = document.getElementById(areaId);
            let input = document.getElementById(inputId);
            let preview = document.getElementById(previewId);
            let countEl = document.getElementById(countId);
            let clearBtn = document.getElementById(clearBtnId);
            let files = [];

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
                let incoming = Array.from(fileList).filter(function(f) {
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
                    let reader = new FileReader();
                    reader.onload = function(e) {
                        let item = document.createElement('div');
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

        let productUpload = setupFileUpload(
            'productImagesArea', 'productImages',
            'productImagesPreview', 'productCount', 5, 'clearProductImages'
        );
        let invoiceUpload = setupFileUpload(
            'invoiceImageArea', 'invoiceImage',
            'invoiceImagePreview', 'invoiceCount', 1, null
        );

        // ---- Warranty Input: block non-numeric ----
        let warrantyInput = document.getElementById('warrantyPeriod');
        if (warrantyInput) {
            warrantyInput.addEventListener('input', function() {
                if (this.value < 1 && this.value !== '') this.value = '';
            });
        }

        // ---- Real-time validation feedback ----
        let formInputs = form.querySelectorAll('.form-input');
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

        // ---- Save to LocalStorage ----
        function saveProduct(data) {
            let products = JSON.parse(localStorage.getItem('warrantyProducts') || '[]');
            data.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
            data.createdAt = new Date().toISOString();
            products.push(data);
            localStorage.setItem('warrantyProducts', JSON.stringify(products));
        }

        // ---- Form Submit ----
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            if (!this.checkValidity()) {
                this.reportValidity();
                return;
            }

            // Gather form data
            let productData = {
                productName: document.getElementById('productName').value.trim(),
                brandName: document.getElementById('brandName').value.trim(),
                retailerName: document.getElementById('retailerName').value.trim(),
                purchaseDate: document.getElementById('purchaseDate').value,
                warrantyPeriod: document.getElementById('warrantyPeriod').value,
                warrantyUnit: document.getElementById('warrantyUnit').value,
                // Note: File data is stored separately via URL.createObjectURL
                // For a production app, you'd upload to a server
                productImages: (productUpload ? productUpload.getFiles().length : 0),
                hasInvoice: (invoiceUpload ? invoiceUpload.getFiles().length > 0 : false)
            };

            // Save to LocalStorage
            saveProduct(productData);

            // Show success message
            alert('✅ Product saved successfully!');

            // ---- RESET THE FORM ----
            form.reset();
            if (productUpload) productUpload.reset();
            if (invoiceUpload) invoiceUpload.reset();
            // Remove validation styles
            form.querySelectorAll('.form-input').forEach(function(el) {
                el.classList.remove('is-valid', 'is-invalid');
            });
            // Reset warranty input if it has a default
            if (warrantyInput) warrantyInput.value = '';
        });

        // ---- Reset Button ----
        let resetBtn = document.getElementById('resetForm');
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
    // 5. INITIALIZE EVERYTHING
    // ============================================================
    document.addEventListener('DOMContentLoaded', function() {
        // Home page: slider
        initSlider();

        // Shared: search & notifications
        initSearch();
        initNotifications();

        // Add product page: form logic
        initAddProductForm();
    });

})();
