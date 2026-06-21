// ============================================
// J4S Dashboard — Complete Interactive Frontend
// ALL features with mock data
// ============================================

(function () {
    'use strict';

    // --- State ---
    let allJobs = [];
    let currentFilter = 'all';
    let currentSidebarMode = 'home';
    let originalMainHTML = '';
    let originalBannerHTML = '';
    let originalCategoriesHTML = '';

    let profileState = {
        avatar: '',
        cover: '',
        bio: 'Sinh viên năm 3 ngành Thiết kế Đồ họa tại ĐH FPT HCM. Đam mê sáng tạo, chuyên thiết kế poster, slide thuyết trình và dịch thuật Anh-Việt. Luôn giao bài đúng hạn và sẵn sàng chỉnh sửa theo yêu cầu.',
        skills: ['Photoshop', 'Illustrator', 'Figma', 'PowerPoint', 'Canva', 'Dịch thuật EN-VI', 'Viết content', 'HTML/CSS'],
        portfolio: [
            { title: '🎨 Poster TEDx', link: '#' },
            { title: '📊 Slide Marketing', link: '#' },
            { title: '🌐 Landing Page', link: '#' },
            { title: '📝 Content Blog', link: '#' }
        ],
        cvName: '',
        cvUrl: ''
    };

    function syncTopNavAvatar() {
        const topNavAvatar = document.querySelector('#userProfile .user-avatar');
        const initialsEl = document.querySelector('#userProfile .user-avatar span');
        if (topNavAvatar) {
            if (profileState.avatar) {
                topNavAvatar.innerHTML = `<img src="${profileState.avatar}" style="width: 100%; height: 100%; object-fit: cover;" />`;
            } else if (initialsEl) {
                topNavAvatar.innerHTML = `<span>${initialsEl.textContent.trim()}</span>`;
            }
        }
    }

    // --- DOM References ---
    const jobFeedContainer = document.getElementById('jobFeedContainer');
    const searchInput = document.getElementById('searchInput');
    const categoryCards = document.querySelectorAll('.category-card[data-category]');
    const sidebarItems = document.querySelectorAll('.sidebar-item[data-nav]');
    const filterCategorySelect = document.getElementById('filterCategory');
    const mainContent = document.getElementById('mainContent');

    // ============================================
    // MOCK DATA — All Sections (Cleared)
    // ============================================

    const mockProjects = [];
    const mockMessages = [];
    const mockReviews = [];
    const mockWalletTransactions = [];
    const mockFeaturedFreelancers = [];
    const mockLeaderboard = [];
    const mockBlogPosts = [];
    const mockNotifications = [];

    // ============================================
    // INITIALIZE
    // ============================================
    function init() {
        const dataEl = document.getElementById('initialJobsData');
        if (dataEl) {
            try {
                allJobs = JSON.parse(dataEl.textContent);
            } catch (e) {
                console.warn('Could not parse initial jobs data:', e);
            }
        }

        // Load custom profile state if exists
        const storedProfile = localStorage.getItem('j4s_user_profile');
        if (storedProfile) {
            try {
                profileState = JSON.parse(storedProfile);
            } catch (e) {
                console.warn('Could not parse stored profile state:', e);
            }
        }
        syncTopNavAvatar();

        // Save original main content for restoration
        if (mainContent) {
            originalMainHTML = mainContent.innerHTML;
        }

        bindSearchInput();
        bindCategoryCards();
        bindSidebarNav();
        bindFilterSelect();
        bindFinancialButtons();
        bindJobFeedEvents();
        bindNotificationBtn();
        bindUserProfileDropdown();
        bindBannerButtons();
        bindViewMoreBtn();
        bindViewProfileButtons();
        bindPostJobButtons();
        bindFindFreelancerBtn();
    }

    // ============================================
    // SEARCH — Debounced AJAX
    // ============================================
    let searchTimeout = null;
    function bindSearchInput() {
        if (!searchInput) return;
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            const term = this.value.trim();

            // Make sure we're on home view
            if (currentSidebarMode !== 'home' && currentSidebarMode !== 'find') {
                restoreHomeView();
                setActiveSidebar('home');
            }

            searchTimeout = setTimeout(() => {
                clearCategoryActive();
                if (term.length === 0) {
                    renderJobs(allJobs);
                    return;
                }
                fetch(`/Home/SearchJobs?searchTerm=${encodeURIComponent(term)}`)
                    .then(r => r.json())
                    .then(jobs => renderJobs(jobs))
                    .catch(err => {
                        console.error('Search error:', err);
                        showToast('Lỗi khi tìm kiếm. Vui lòng thử lại.', 'error');
                    });
            }, 300);
        });
    }

    // ============================================
    // CATEGORY FILTER — Click cards
    // ============================================
    function bindCategoryCards() {
        categoryCards.forEach(card => {
            card.addEventListener('click', function () {
                const cat = this.dataset.category;
                if (this.classList.contains('active')) {
                    this.classList.remove('active');
                    currentFilter = 'all';
                    renderJobs(allJobs);
                    return;
                }
                clearCategoryActive();
                this.classList.add('active');
                currentFilter = cat;
                searchInput.value = '';

                fetch(`/Home/FilterByCategory?category=${encodeURIComponent(cat)}`)
                    .then(r => r.json())
                    .then(jobs => renderJobs(jobs))
                    .catch(err => {
                        console.error('Filter error:', err);
                        showToast('Lỗi khi lọc danh mục.', 'error');
                    });
            });
        });
    }

    function clearCategoryActive() {
        document.querySelectorAll('.category-card[data-category]').forEach(c => c.classList.remove('active'));
        currentFilter = 'all';
    }

    // ============================================
    // DROPDOWN FILTER SELECT
    // ============================================
    function bindFilterSelect() {
        if (!filterCategorySelect) return;
        filterCategorySelect.addEventListener('change', function () {
            const val = this.value;
            clearCategoryActive();
            searchInput.value = '';

            if (val === 'Tất cả danh mục') {
                renderJobs(allJobs);
                return;
            }
            fetch(`/Home/FilterByCategory?category=${encodeURIComponent(val)}`)
                .then(r => r.json())
                .then(jobs => renderJobs(jobs))
                .catch(err => console.error('Dropdown filter error:', err));
        });
    }

    // ============================================
    // SIDEBAR NAVIGATION — All sections
    // ============================================
    function bindSidebarNav() {
        sidebarItems.forEach(item => {
            item.addEventListener('click', function (e) {
                e.preventDefault();
                const nav = this.dataset.nav;
                setActiveSidebar(nav);
                clearCategoryActive();
                searchInput.value = '';
                currentSidebarMode = nav;

                switch (nav) {
                    case 'home':
                        restoreHomeView();
                        renderJobs(allJobs);
                        break;
                    case 'find':
                        restoreHomeView();
                        renderJobs(allJobs);
                        searchInput.focus();
                        break;
                    case 'saved':
                        restoreHomeView();
                        renderJobs(allJobs.filter(j => j.isSaved));
                        updateSectionTitle('Việc đã lưu');
                        break;
                    case 'applied':
                        restoreHomeView();
                        renderJobs(allJobs.filter(j => j.isApplied));
                        updateSectionTitle('Đã ứng tuyển');
                        break;
                    case 'projects':
                        renderProjectsView();
                        break;
                    case 'profile':
                        renderProfileView();
                        break;
                    case 'messages':
                        renderMessagesView();
                        break;
                    case 'reviews':
                        renderReviewsView();
                        break;
                    case 'wallet':
                        renderWalletView();
                        break;
                    case 'topFreelancer':
                        renderFeaturedFreelancersView();
                        break;
                    case 'leaderboard':
                        renderLeaderboardView();
                        break;
                    case 'blog':
                        renderBlogView();
                        break;
                    default:
                        restoreHomeView();
                        renderJobs(allJobs);
                        break;
                }
            });
        });
    }

    function setActiveSidebar(nav) {
        sidebarItems.forEach(i => i.classList.remove('active'));
        const target = document.querySelector(`.sidebar-item[data-nav="${nav}"]`);
        if (target) target.classList.add('active');
    }

    function updateSectionTitle(title) {
        const t = mainContent.querySelector('.section-title');
        if (t) t.textContent = title;
    }

    function restoreHomeView() {
        if (mainContent && originalMainHTML) {
            mainContent.innerHTML = originalMainHTML;
            // Re-bind events on restored elements
            rebindHomeEvents();
        }
    }

    function rebindHomeEvents() {
        bindJobFeedEvents();
        bindFinancialButtons();
        bindViewMoreBtn();
        bindViewProfileButtons();
        // Re-bind category cards
        document.querySelectorAll('.category-card[data-category]').forEach(card => {
            card.addEventListener('click', function () {
                const cat = this.dataset.category;
                if (this.classList.contains('active')) {
                    this.classList.remove('active');
                    currentFilter = 'all';
                    renderJobs(allJobs);
                    return;
                }
                clearCategoryActive();
                this.classList.add('active');
                currentFilter = cat;
                searchInput.value = '';
                fetch(`/Home/FilterByCategory?category=${encodeURIComponent(cat)}`)
                    .then(r => r.json())
                    .then(jobs => renderJobs(jobs))
                    .catch(err => console.error('Filter error:', err));
            });
        });
        // Re-bind filter select
        const fs = document.getElementById('filterCategory');
        if (fs) {
            fs.addEventListener('change', function () {
                const val = this.value;
                clearCategoryActive();
                if (val === 'Tất cả danh mục') { renderJobs(allJobs); return; }
                fetch(`/Home/FilterByCategory?category=${encodeURIComponent(val)}`)
                    .then(r => r.json())
                    .then(jobs => renderJobs(jobs))
                    .catch(err => console.error(err));
            });
        }
    }

    // ============================================
    // RENDER: Dự án đang làm
    // ============================================
    function renderProjectsView() {
        mainContent.innerHTML = `
            <div class="page-header">
                <h1 class="page-title"><i data-lucide="folder-open" style="width:24px;height:24px;"></i> Dự án đang làm</h1>
                <p class="page-subtitle">Quản lý các dự án bạn đang thực hiện</p>
            </div>
            <div class="projects-list">
                ${mockProjects.map(p => `
                    <div class="project-card">
                        <div class="project-header">
                            <h3>${escapeHtml(p.title)}</h3>
                            <span class="project-status status-${p.progress >= 80 ? 'almost' : 'active'}">${p.status}</span>
                        </div>
                        <div class="project-client">
                            <i data-lucide="user" style="width:14px;height:14px;"></i>
                            Khách hàng: <strong>${escapeHtml(p.client)}</strong>
                        </div>
                        <div class="project-progress">
                            <div class="progress-info">
                                <span>Tiến độ</span>
                                <span class="progress-pct">${p.progress}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width:${p.progress}%"></div>
                            </div>
                        </div>
                        <div class="project-footer">
                            <span class="project-deadline"><i data-lucide="calendar" style="width:14px;height:14px;"></i> Hạn: ${p.deadline}</span>
                            <span class="project-budget">${formatVND(p.budget)}</span>
                        </div>
                        <div class="project-actions">
                            <button class="btn-sm btn-primary" onclick="document.dispatchEvent(new CustomEvent('updateProgress', {detail:'${p.id}'}))">Cập nhật tiến độ</button>
                            <button class="btn-sm btn-outline" onclick="document.dispatchEvent(new CustomEvent('submitProject', {detail:'${p.id}'}))">Nộp bài</button>
                            <button class="btn-sm btn-ghost" onclick="document.dispatchEvent(new CustomEvent('chatClient', {detail:'${p.id}'}))"><i data-lucide="message-circle" style="width:14px;height:14px;"></i> Nhắn tin</button>
                        </div>
                    </div>
                `).join('')}
            </div>`;
        if (window.lucide) lucide.createIcons();
        bindProjectActions();
    }

    function bindProjectActions() {
        document.addEventListener('updateProgress', (e) => {
            const p = mockProjects.find(p => p.id === e.detail);
            if (p && p.progress < 100) {
                p.progress = Math.min(100, p.progress + 10);
                if (p.progress >= 100) p.status = 'Hoàn thành';
                else if (p.progress >= 80) p.status = 'Sắp hoàn thành';
                renderProjectsView();
                showToast(`Đã cập nhật tiến độ: ${p.progress}%`, 'success');
            }
        }, { once: true });
        document.addEventListener('submitProject', (e) => {
            showToast('📤 Đã nộp bài thành công! Đang chờ khách hàng xác nhận.', 'success');
        }, { once: true });
        document.addEventListener('chatClient', (e) => {
            showToast('💬 Đang mở cửa sổ chat...', 'info');
            setTimeout(() => {
                setActiveSidebar('messages');
                currentSidebarMode = 'messages';
                renderMessagesView();
            }, 500);
        }, { once: true });
    }

    // ============================================
    // RENDER: Hồ sơ của tôi
    // ============================================
    function renderProfileView() {
        mainContent.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 350px; flex-direction: column; gap: 16px;">
                <div class="spinner-border text-info" role="status" style="width: 3rem; height: 3rem;"></div>
                <span style="color: var(--text-secondary); font-weight: 500; font-family: 'Inter', sans-serif;">Đang tải thông tin hồ sơ...</span>
            </div>
        `;

        fetch('/Home/GetProfile')
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    showToast(data.message || 'Lỗi khi tải thông tin hồ sơ.', 'error');
                    mainContent.innerHTML = `<div class="alert alert-danger m-4" style="border-radius:12px; font-family:'Inter';">${escapeHtml(data.message)}</div>`;
                    return;
                }
                renderProfileData(data);
            })
            .catch(err => {
                console.error(err);
                showToast('Không thể kết nối đến máy chủ.', 'error');
                mainContent.innerHTML = `<div class="alert alert-danger m-4" style="border-radius:12px; font-family:'Inter';">Không thể kết nối đến máy chủ.</div>`;
            });
    }

    function renderProfileData(data) {
        let initials = 'US';
        if (data.role === 'Student' && data.fullName) {
            initials = data.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        } else if (data.role === 'Business' && data.companyName) {
            initials = data.companyName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        }

        // Calculate average rating from reviews
        const avgRating = data.reviews && data.reviews.length > 0
            ? (data.reviews.reduce((sum, r) => sum + r.rating, 0) / data.reviews.length).toFixed(1)
            : "5.0";
        const reviewsCount = data.reviews ? data.reviews.length : 0;

        const reviewsHTML = data.reviews && data.reviews.length > 0
            ? `<div class="reviews-modern-container">` + data.reviews.map(r => {
                const revInitials = r.reviewerName ? r.reviewerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'KH';
                return `
                <div class="review-modern-item">
                    <div class="review-avatar-box">
                        ${r.reviewerAvatar 
                            ? `<img src="${r.reviewerAvatar}" alt="${escapeHtml(r.reviewerName)}" />` 
                            : `<span>${escapeHtml(revInitials)}</span>`
                        }
                    </div>
                    <div class="review-body-box">
                        <div class="review-header-box">
                            <span class="reviewer-name">${escapeHtml(r.reviewerName)}</span>
                            <span class="review-date">${escapeHtml(r.createdAt)}</span>
                        </div>
                        <div class="review-stars">
                            ${'★'.repeat(Math.round(r.rating))}${'☆'.repeat(5 - Math.round(r.rating))}
                        </div>
                        <p class="review-comment-text">${escapeHtml(r.comment || 'Không có nhận xét.')}</p>
                    </div>
                </div>
                `;
            }).join('') + `</div>`
            : '<p style="color: var(--text-muted); font-style: italic; font-size: 13px;">Chưa có đánh giá nào từ khách hàng.</p>';

        if (data.role === 'Student') {
            const tagline = 'Freelancer chuyên nghiệp | Sinh viên';
            
            const skillsHTML = data.skills && data.skills.length > 0
                ? data.skills.map(s => `<span class="skill-modern-tag">${escapeHtml(s)}</span>`).join('')
                : '<p style="color: var(--text-muted); font-style: italic; font-size: 13px;">Chưa cập nhật kỹ năng chuyên môn.</p>';

            const portfolioHTML = data.portfolio && data.portfolio.length > 0
                ? data.portfolio.map(p => `
                    <div class="portfolio-modern-card">
                        <div>
                            <h4>${escapeHtml(p.title)}</h4>
                            <p>${escapeHtml(p.description)}</p>
                        </div>
                        ${p.projectUrl ? `<a href="${escapeHtml(p.projectUrl)}" target="_blank" class="portfolio-modern-link">Xem chi tiết <i data-lucide="external-link" style="width:12px;height:12px;"></i></a>` : ''}
                    </div>
                `).join('')
                : '<p style="color: var(--text-muted); font-style: italic; font-size: 13px; grid-column: span 2;">Chưa có dự án portfolio nào.</p>';

            const certificatesHTML = data.certificates && data.certificates.length > 0
                ? `<div class="certificates-modern-list">` + data.certificates.map(c => `
                    <div class="certificate-modern-card">
                        <div class="cert-info-main">
                            <span class="cert-name">${escapeHtml(c.certificateName)}</span>
                            <span class="cert-org">${escapeHtml(c.organization)}</span>
                            <span class="cert-date">Ngày cấp: ${formatDate(c.issuedDate)} ${c.expiryDate ? ` - Hết hạn: ${formatDate(c.expiryDate)}` : ''}</span>
                        </div>
                        ${c.credentialUrl ? `<a href="${escapeHtml(c.credentialUrl)}" target="_blank" class="portfolio-modern-link">Xem chứng chỉ <i data-lucide="external-link" style="width:12px;height:12px;"></i></a>` : ''}
                    </div>
                `).join('') + `</div>`
                : '<p style="color: var(--text-muted); font-style: italic; font-size: 13px;">Chưa cập nhật chứng chỉ & bằng cấp.</p>';

            mainContent.innerHTML = `
                <div class="profile-modern-container">
                    <div class="profile-cover-modern">
                        ${data.coverImageUrl 
                            ? `<img src="${data.coverImageUrl}" class="profile-cover-image" alt="Cover Photo" />` 
                            : ''
                        }
                    </div>

                    <div class="profile-header-card animate-in">
                        <div class="profile-header-info">
                            <div class="profile-avatar-frame">
                                ${data.avatarUrl 
                                    ? `<img src="${data.avatarUrl}" alt="${escapeHtml(data.fullName)}" id="profileAvatarImg" />` 
                                    : `<span>${escapeHtml(initials)}</span>`
                                }
                            </div>
                            <div class="profile-meta-text">
                                <h2>${escapeHtml(data.fullName)}</h2>
                                <div class="tagline">${escapeHtml(tagline)}</div>
                                <div class="badge-row">
                                    <span class="badge-modern badge-modern-blue"><i data-lucide="check-circle" style="width:13px;height:13px;"></i> Đã xác minh</span>
                                    <span class="badge-modern badge-modern-gray"><i data-lucide="graduation-cap" style="width:13px;height:13px;"></i> Level 3</span>
                                    <span class="badge-modern badge-modern-orange">★ ${avgRating} (${reviewsCount} đánh giá)</span>
                                </div>
                            </div>
                        </div>
                        <button class="btn-modern-primary" id="btnEditProfile">
                            <i data-lucide="edit-3" style="width:16px;height:16px;"></i> Chỉnh sửa hồ sơ
                        </button>
                    </div>

                    <div class="profile-stats-modern-grid">
                        <div class="stat-modern-card animate-in">
                            <div class="stat-modern-icon"><i data-lucide="check-square" style="width:20px;height:20px;"></i></div>
                            <div class="stat-modern-info">
                                <span class="stat-modern-value">${data.completedJobsCount}</span>
                                <span class="stat-modern-title">Đã hoàn thành</span>
                            </div>
                        </div>
                        <div class="stat-modern-card animate-in">
                            <div class="stat-modern-icon"><i data-lucide="star" style="width:20px;height:20px;"></i></div>
                            <div class="stat-modern-info">
                                <span class="stat-modern-value">${avgRating} ★</span>
                                <span class="stat-modern-title">Đánh giá trung bình</span>
                            </div>
                        </div>
                        <div class="stat-modern-card animate-in">
                            <div class="stat-modern-icon"><i data-lucide="award" style="width:20px;height:20px;"></i></div>
                            <div class="stat-modern-info">
                                <span class="stat-modern-value">${data.completionRate}%</span>
                                <span class="stat-modern-title">Tỷ lệ hoàn thành</span>
                            </div>
                        </div>
                        <div class="stat-modern-card animate-in">
                            <div class="stat-modern-icon"><i data-lucide="wallet" style="width:20px;height:20px;"></i></div>
                            <div class="stat-modern-info">
                                <span class="stat-modern-value">${formatVND(data.balance)}</span>
                                <span class="stat-modern-title">Số dư khả dụng</span>
                            </div>
                        </div>
                    </div>

                    <div class="profile-content-grid">
                        <div style="display: flex; flex-direction: column; gap: 24px;">
                            <div class="profile-card-modern animate-in">
                                <h3><i data-lucide="info" style="width:16px;height:16px;"></i> Giới thiệu</h3>
                                <p style="font-size:14px; color: var(--text-secondary); margin:0; line-height: 1.6; white-space: pre-line;">
                                    ${escapeHtml(data.bio || 'Chưa cập nhật giới thiệu bản thân.')}
                                </p>
                            </div>

                            <div class="profile-card-modern animate-in">
                                <h3><i data-lucide="briefcase" style="width:16px;height:16px;"></i> Kinh nghiệm làm việc</h3>
                                <div class="experience-block">
                                    <p class="experience-modern-content">${escapeHtml(data.experience || 'Chưa cập nhật kinh nghiệm làm việc.')}</p>
                                </div>
                            </div>

                            <div class="profile-card-modern animate-in">
                                <h3><i data-lucide="book-open" style="width:16px;height:16px;"></i> Thông tin học vấn</h3>
                                <div class="info-list-modern">
                                    <div class="info-item-modern">
                                        <i data-lucide="school" style="width:16px;height:16px;"></i>
                                        <span class="label">Trường học:</span>
                                        <span class="value">${escapeHtml(data.university || 'Chưa cập nhật')}</span>
                                    </div>
                                    <div class="info-item-modern">
                                        <i data-lucide="award" style="width:16px;height:16px;"></i>
                                        <span class="label">Chuyên ngành:</span>
                                        <span class="value">${escapeHtml(data.major || 'Chưa cập nhật')}</span>
                                    </div>
                                    <div class="info-item-modern">
                                        <i data-lucide="percent" style="width:16px;height:16px;"></i>
                                        <span class="label">Điểm GPA:</span>
                                        <span class="value">${data.gpa ? data.gpa.toFixed(2) : 'Chưa cập nhật'}</span>
                                    </div>
                                    <div class="info-item-modern">
                                        <i data-lucide="calendar" style="width:16px;height:16px;"></i>
                                        <span class="label">Tốt nghiệp:</span>
                                        <span class="value">${data.graduationYear ? data.graduationYear : 'Chưa cập nhật'}</span>
                                    </div>
                                    <div class="info-item-modern">
                                        <i data-lucide="user-2" style="width:16px;height:16px;"></i>
                                        <span class="label">Giới tính:</span>
                                        <span class="value">${escapeHtml(data.gender || 'Khác')}</span>
                                    </div>
                                    <div class="info-item-modern">
                                        <i data-lucide="gift" style="width:16px;height:16px;"></i>
                                        <span class="label">Ngày sinh:</span>
                                        <span class="value">${data.dateOfBirth ? formatDate(data.dateOfBirth) : 'Chưa cập nhật'}</span>
                                    </div>
                                    <div class="info-item-modern">
                                        <i data-lucide="phone" style="width:16px;height:16px;"></i>
                                        <span class="label">Điện thoại:</span>
                                        <span class="value">${escapeHtml(data.phone || 'Chưa cập nhật')}</span>
                                    </div>
                                    <div class="info-item-modern">
                                        <i data-lucide="mail" style="width:16px;height:16px;"></i>
                                        <span class="label">Email:</span>
                                        <span class="value" style="word-break: break-all;">${escapeHtml(data.email)}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="profile-card-modern animate-in">
                                <h3><i data-lucide="star" style="width:16px;height:16px;"></i> Đánh giá từ khách hàng</h3>
                                ${reviewsHTML}
                            </div>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 24px;">
                            <div class="profile-card-modern animate-in">
                                <h3><i data-lucide="zap" style="width:16px;height:16px;"></i> Kỹ năng chuyên môn</h3>
                                <div class="skills-modern-list">
                                    ${skillsHTML}
                                </div>
                            </div>

                            <div class="profile-card-modern animate-in">
                                <h3><i data-lucide="award" style="width:16px;height:16px;"></i> Chứng chỉ & Bằng cấp</h3>
                                ${certificatesHTML}
                            </div>

                            <div class="profile-card-modern animate-in">
                                <h3><i data-lucide="folder" style="width:16px;height:16px;"></i> Portfolio dự án</h3>
                                <div class="portfolio-modern-grid">
                                    ${portfolioHTML}
                                </div>
                            </div>

                            <div class="profile-card-modern animate-in">
                                <h3><i data-lucide="file-text" style="width:16px;height:16px;"></i> CV ứng tuyển</h3>
                                ${data.cvName ? `
                                    <div class="cv-modern-card">
                                        <div class="cv-modern-info">
                                            <div class="cv-modern-icon">📄</div>
                                            <div class="cv-modern-details">
                                                <span class="filename">${escapeHtml(data.cvName)}</span>
                                                <span class="status">Đã tải lên hệ thống</span>
                                            </div>
                                        </div>
                                        <button class="btn-cv-view" onclick="window.open('${data.cvUrl || '#'}', '_blank')">
                                            <i data-lucide="external-link" style="width:14px;height:14px;"></i> Xem CV
                                        </button>
                                    </div>
                                ` : `
                                    <div class="cv-modern-card" style="justify-content: center; border-style: dashed;">
                                        <span style="color: var(--text-muted); font-style: italic; font-size:13px;">Chưa tải hồ sơ CV lên.</span>
                                    </div>
                                `}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            mainContent.innerHTML = `
                <div class="profile-modern-container">
                    <div class="profile-cover-modern" style="height: 180px;"></div>

                    <div class="profile-header-card animate-in">
                        <div class="profile-header-info">
                            <div class="profile-avatar-frame">
                                ${data.logoUrl 
                                    ? `<img src="${data.logoUrl}" alt="${escapeHtml(data.companyName)}" />` 
                                    : `<span>${escapeHtml(initials)}</span>`
                                }
                            </div>
                            <div class="profile-meta-text">
                                <h2>${escapeHtml(data.companyName)}</h2>
                                <div class="tagline">${escapeHtml(data.industry || 'Lĩnh vực kinh doanh')}</div>
                                <div class="badge-row">
                                    <span class="badge-modern badge-modern-blue"><i data-lucide="shield-check" style="width:13px;height:13px;"></i> Doanh nghiệp</span>
                                    ${data.isVerified 
                                        ? `<span class="badge-modern badge-modern-green"><i data-lucide="check-circle" style="width:13px;height:13px;"></i> Đã xác thực</span>` 
                                        : `<span class="badge-modern badge-modern-gray"><i data-lucide="alert-circle" style="width:13px;height:13px;"></i> Chưa xác thực</span>`
                                    }
                                    <span class="badge-modern badge-modern-orange">★ ${avgRating} (${reviewsCount} đánh giá)</span>
                                </div>
                            </div>
                        </div>
                        <button class="btn-modern-primary" id="btnEditProfile">
                            <i data-lucide="edit-3" style="width:16px;height:16px;"></i> Chỉnh sửa hồ sơ
                        </button>
                    </div>

                    <div class="profile-stats-modern-grid">
                        <div class="stat-modern-card animate-in">
                            <div class="stat-modern-icon"><i data-lucide="building" style="width:20px;height:20px;"></i></div>
                            <div class="stat-modern-info">
                                <span class="stat-modern-value">${escapeHtml(data.companySize || 'Chưa cập nhật')}</span>
                                <span class="stat-modern-title">Quy mô nhân sự</span>
                            </div>
                        </div>
                        <div class="stat-modern-card animate-in">
                            <div class="stat-modern-icon"><i data-lucide="check-square" style="width:20px;height:20px;"></i></div>
                            <div class="stat-modern-info">
                                <span class="stat-modern-value">${data.completedJobsCount}</span>
                                <span class="stat-modern-title">Dự án hoàn thành</span>
                            </div>
                        </div>
                        <div class="stat-modern-card animate-in">
                            <div class="stat-modern-icon"><i data-lucide="star" style="width:20px;height:20px;"></i></div>
                            <div class="stat-modern-info">
                                <span class="stat-modern-value">${avgRating} ★</span>
                                <span class="stat-modern-title">Đánh giá trung bình</span>
                            </div>
                        </div>
                        <div class="stat-modern-card animate-in">
                            <div class="stat-modern-icon"><i data-lucide="wallet" style="width:20px;height:20px;"></i></div>
                            <div class="stat-modern-info">
                                <span class="stat-modern-value">${formatVND(data.balance)}</span>
                                <span class="stat-modern-title">Số dư tài khoản</span>
                            </div>
                        </div>
                    </div>

                    <div class="profile-content-grid" style="grid-template-columns: 1fr;">
                        <div class="profile-card-modern animate-in">
                            <h3><i data-lucide="info" style="width:16px;height:16px;"></i> Thông tin liên hệ & doanh nghiệp</h3>
                            <div class="info-list-modern">
                                <div class="info-item-modern">
                                    <i data-lucide="hash" style="width:16px;height:16px;"></i>
                                    <span class="label">Mã số thuế:</span>
                                    <span class="value">${escapeHtml(data.taxCode || 'Chưa cập nhật')}</span>
                                </div>
                                <div class="info-item-modern">
                                    <i data-lucide="globe" style="width:16px;height:16px;"></i>
                                    <span class="label">Website:</span>
                                    <span class="value">${data.websiteUrl ? `<a href="${escapeHtml(data.websiteUrl)}" target="_blank" style="color: #0ea5e9; text-decoration: underline;">${escapeHtml(data.websiteUrl)}</a>` : 'Chưa cập nhật'}</span>
                                </div>
                                <div class="info-item-modern">
                                    <i data-lucide="map-pin" style="width:16px;height:16px;"></i>
                                    <span class="label">Địa chỉ:</span>
                                    <span class="value">${escapeHtml(data.address || 'Chưa cập nhật')}</span>
                                </div>
                                <div class="info-item-modern">
                                    <i data-lucide="phone" style="width:16px;height:16px;"></i>
                                    <span class="label">Điện thoại:</span>
                                    <span class="value">${escapeHtml(data.phone || 'Chưa cập nhật')}</span>
                                </div>
                                <div class="info-item-modern">
                                    <i data-lucide="mail" style="width:16px;height:16px;"></i>
                                    <span class="label">Email:</span>
                                    <span class="value">${escapeHtml(data.email)}</span>
                                </div>
                            </div>
                        </div>

                        <div class="profile-card-modern animate-in" style="margin-top: 24px;">
                            <h3><i data-lucide="star" style="width:16px;height:16px;"></i> Đánh giá từ ứng viên</h3>
                            ${reviewsHTML}
                        </div>
                    </div>
                </div>
            `;
        }

        if (window.lucide) lucide.createIcons();

        const topNavAvatar = document.querySelector('#userProfile .user-avatar');
        if (topNavAvatar) {
            const currentImgUrl = data.role === 'Student' ? data.avatarUrl : data.logoUrl;
            if (currentImgUrl) {
                topNavAvatar.innerHTML = `<img src="${currentImgUrl}" style="width: 100%; height: 100%; object-fit: cover;" />`;
            } else {
                topNavAvatar.innerHTML = `<span>${escapeHtml(initials)}</span>`;
            }
        }

        document.getElementById('btnEditProfile').addEventListener('click', () => {
            openEditProfileModal(data);
        });
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        try {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch (e) {
            return dateStr;
        }
    }

    function openEditProfileModal(data) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        
        let tempPortfolio = data.portfolio ? [...data.portfolio] : [];
        let tempCertificates = data.certificates ? [...data.certificates] : [];
        let uploadedAvatarBase64 = data.role === 'Student' ? data.avatarUrl : data.logoUrl;
        let uploadedCoverBase64 = data.coverImageUrl || '';
        let uploadedCvName = data.cvName || '';
        let uploadedCvUrl = data.cvUrl || '';

        const isStudent = data.role === 'Student';

        let modalHTML = `
            <div class="modal-content" style="max-width: 700px; max-height: 85vh; overflow-y: auto;">
                <button class="modal-close"><i data-lucide="x" style="width:20px;height:20px;"></i></button>
                <div class="modal-header">
                    <h2>✏️ Chỉnh sửa hồ sơ ${isStudent ? 'Sinh viên' : 'Doanh nghiệp'}</h2>
                </div>
                <div class="modal-body">
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label class="form-label">${isStudent ? 'Ảnh đại diện' : 'Logo công ty'}</label>
                            <div class="file-upload-wrapper">
                                <input type="file" id="editAvatarFile" accept="image/*" />
                                <div class="file-upload-placeholder">
                                    <span class="file-upload-icon">📷</span>
                                    <span id="avatarFileLabel">Chọn ảnh đại diện mới</span>
                                </div>
                                <div style="position: relative; display: inline-block; width: 100%; margin-top: 10px;" id="avatarPreviewContainer" class="${uploadedAvatarBase64 ? '' : 'd-none'}">
                                    <img src="${uploadedAvatarBase64 || ''}" class="file-preview-img" id="avatarPreview" style="margin-top:0;" />
                                    <button type="button" class="btn-recrop-img" id="btnRecropAvatar" style="position: absolute; right: 8px; bottom: 8px; z-index: 10; background: rgba(15, 23, 42, 0.75); border: none; border-radius: 4px; padding: 4px 8px; color: white; font-size: 11px; display: flex; align-items: center; gap: 4px; cursor: pointer; pointer-events: auto;"><i data-lucide="crop" style="width:12px;height:12px;"></i> Cắt hình</button>
                                </div>
                            </div>
                        </div>

                        ${isStudent ? `
                        <div class="form-group">
                            <label class="form-label">Ảnh bìa hồ sơ</label>
                            <div class="file-upload-wrapper">
                                <input type="file" id="editCoverFile" accept="image/*" />
                                <div class="file-upload-placeholder">
                                    <span class="file-upload-icon">🖼️</span>
                                    <span id="coverFileLabel">Chọn ảnh bìa mới</span>
                                </div>
                                <div style="position: relative; display: inline-block; width: 100%; margin-top: 10px;" id="coverPreviewContainer" class="${uploadedCoverBase64 ? '' : 'd-none'}">
                                    <img src="${uploadedCoverBase64 || ''}" class="file-preview-img" id="coverPreview" style="margin-top:0;" />
                                    <button type="button" class="btn-recrop-img" id="btnRecropCover" style="position: absolute; right: 8px; bottom: 8px; z-index: 10; background: rgba(15, 23, 42, 0.75); border: none; border-radius: 4px; padding: 4px 8px; color: white; font-size: 11px; display: flex; align-items: center; gap: 4px; cursor: pointer; pointer-events: auto;"><i data-lucide="crop" style="width:12px;height:12px;"></i> Cắt hình</button>
                                </div>
                            </div>
                        </div>
                        ` : `
                        <div class="form-group">
                            <label class="form-label">Lĩnh vực hoạt động</label>
                            <input type="text" class="form-input" id="editIndustry" value="${escapeHtml(data.industry || '')}" placeholder="Lĩnh vực: IT, Marketing, Xây dựng..." />
                        </div>
                        `}
                    </div>

                    <div class="form-grid-2">
                        <div class="form-group">
                            <label class="form-label">${isStudent ? 'Họ và tên' : 'Tên doanh nghiệp'}</label>
                            <input type="text" class="form-input" id="editName" value="${escapeHtml(isStudent ? data.fullName : data.companyName)}" required />
                        </div>
                        <div class="form-group">
                            <label class="form-label">Số điện thoại liên hệ</label>
                            <input type="text" class="form-input" id="editPhone" value="${escapeHtml(data.phone || '')}" />
                        </div>
                    </div>

                    ${isStudent ? `
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label class="form-label">Trường đại học/cao đẳng</label>
                            <input type="text" class="form-input" id="editUniversity" value="${escapeHtml(data.university || '')}" />
                        </div>
                        <div class="form-group">
                            <label class="form-label">Chuyên ngành</label>
                            <input type="text" class="form-input" id="editMajor" value="${escapeHtml(data.major || '')}" />
                        </div>
                    </div>

                    <div class="form-grid-2">
                        <div class="form-group">
                            <label class="form-label">Điểm GPA (Hệ 4.0)</label>
                            <input type="number" step="0.01" min="0" max="4" class="form-input" id="editGpa" value="${data.gpa || ''}" />
                        </div>
                        <div class="form-group">
                            <label class="form-label">Năm tốt nghiệp</label>
                            <input type="number" min="2000" max="2100" class="form-input" id="editGraduationYear" value="${data.graduationYear || ''}" />
                        </div>
                    </div>

                    <div class="form-grid-2">
                        <div class="form-group">
                            <label class="form-label">Giới tính</label>
                            <select class="form-select w-100" id="editGender" style="height: 42px; border: 1.5px solid var(--border-color); border-radius: 6px; padding: 0 12px;">
                                <option value="Nam" ${data.gender === 'Nam' ? 'selected' : ''}>Nam</option>
                                <option value="Nữ" ${data.gender === 'Nữ' ? 'selected' : ''}>Nữ</option>
                                <option value="Khác" ${data.gender === 'Khác' ? 'selected' : ''}>Khác</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Ngày sinh</label>
                            <input type="date" class="form-input" id="editDob" value="${data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : ''}" />
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Giới thiệu ngắn về bản thân</label>
                        <textarea class="form-textarea" id="editBio" rows="4" placeholder="Viết giới thiệu ngắn về bản thân bạn...">${escapeHtml(data.bio || '')}</textarea>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Kinh nghiệm làm việc</label>
                        <textarea class="form-textarea" id="editExperience" rows="4" placeholder="Mô tả các công việc, dự án thực tế bạn đã tham gia...">${escapeHtml(data.experience || '')}</textarea>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Kỹ năng chuyên môn (cách nhau bằng dấu phẩy)</label>
                        <input type="text" class="form-input" id="editSkills" value="${escapeHtml(data.skills ? data.skills.join(', ') : '')}" placeholder="Photoshop, Figma, HTML, CSS..." />
                    </div>

                    <div class="form-group">
                        <label class="form-label">Quản lý Chứng chỉ & Bằng cấp</label>
                        <div class="form-grid-2" style="gap: 8px; margin-bottom: 8px;">
                            <input type="text" class="form-input" id="newCertName" placeholder="Tên chứng chỉ..." />
                            <input type="text" class="form-input" id="newCertOrg" placeholder="Tổ chức cấp..." />
                        </div>
                        <div class="form-grid-3" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                            <div>
                                <label style="font-size:11px; color:var(--text-muted); display:block; margin-bottom: 2px;">Ngày cấp:</label>
                                <input type="date" class="form-input" id="newCertIssuedDate" />
                            </div>
                            <div>
                                <label style="font-size:11px; color:var(--text-muted); display:block; margin-bottom: 2px;">Ngày hết hạn:</label>
                                <input type="date" class="form-input" id="newCertExpiryDate" />
                            </div>
                            <div>
                                <label style="font-size:11px; color:var(--text-muted); display:block; margin-bottom: 2px;">Link chứng chỉ:</label>
                                <input type="text" class="form-input" id="newCertUrl" placeholder="URL..." />
                            </div>
                        </div>
                        <div style="text-align: right; margin-bottom: 8px;">
                            <button class="btn-sm btn-primary" id="btnAddCert" style="padding: 6px 16px;">Thêm chứng chỉ</button>
                        </div>
                        <div class="modal-cert-list" id="modalCertList">
                            ${tempCertificates.map((c, i) => `
                                <div class="modal-cert-item" data-index="${i}">
                                    <span>
                                        <strong>${escapeHtml(c.certificateName)}</strong> 
                                        <small style="color: var(--text-muted); font-size:11px;">
                                            (${escapeHtml(c.organization)}) - Cấp: ${formatDate(c.issuedDate)}
                                        </small>
                                    </span>
                                    <button class="btn-delete-cert" data-index="${i}" style="background: none; border: none; color: var(--danger); cursor: pointer;"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Quản lý Portfolio dự án</label>
                        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                            <input type="text" class="form-input" id="newProjTitle" placeholder="Tên dự án..." style="flex: 2;" />
                            <input type="text" class="form-input" id="newProjDesc" placeholder="Mô tả..." style="flex: 3;" />
                            <input type="text" class="form-input" id="newProjUrl" placeholder="Link (nếu có)..." style="flex: 2;" />
                            <button class="btn-sm btn-primary" id="btnAddProj" style="white-space:nowrap; padding: 10px 16px;">Thêm</button>
                        </div>
                        <div class="modal-portfolio-list" id="modalPortfolioList">
                            ${tempPortfolio.map((p, i) => `
                                <div class="modal-portfolio-item" data-index="${i}">
                                    <span>
                                        <strong>${escapeHtml(p.title)}</strong> 
                                        <small style="color: var(--text-muted); font-size:11px;">(${escapeHtml(p.description || 'Không mô tả')})</small>
                                    </span>
                                    <button class="btn-delete-portfolio" data-index="${i}"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Tài liệu CV cá nhân (PDF, ảnh hoặc docx)</label>
                        <div class="file-upload-wrapper">
                            <input type="file" id="editCvFile" accept=".pdf,.doc,.docx,image/*" />
                            <div class="file-upload-placeholder">
                                <span class="file-upload-icon">📄</span>
                                <span id="cvFileLabel">${uploadedCvName ? `CV hiện tại: ${escapeHtml(uploadedCvName)} (Bấm để đổi)` : 'Bấm hoặc kéo thả để tải CV mới'}</span>
                            </div>
                        </div>
                    </div>
                    ` : `
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label class="form-label">Mã số thuế</label>
                            <input type="text" class="form-input" id="editTaxCode" value="${escapeHtml(data.taxCode || '')}" />
                        </div>
                        <div class="form-group">
                            <label class="form-label">Website doanh nghiệp</label>
                            <input type="text" class="form-input" id="editWebsiteUrl" value="${escapeHtml(data.websiteUrl || '')}" />
                        </div>
                    </div>

                    <div class="form-grid-2">
                        <div class="form-group">
                            <label class="form-label">Quy mô doanh nghiệp</label>
                            <input type="text" class="form-input" id="editCompanySize" value="${escapeHtml(data.companySize || '')}" placeholder="Ví dụ: 10-50 nhân sự" />
                        </div>
                        <div class="form-group">
                            <label class="form-label">Địa chỉ trụ sở chính</label>
                            <input type="text" class="form-input" id="editAddress" value="${escapeHtml(data.address || '')}" />
                        </div>
                    </div>
                    `}
                    
                    <div style="border-top: 1px solid var(--border-color); margin-top: 24px; padding-top: 20px;">
                        <h3 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 12px; display: flex; align-items: center; gap: 6px;"><i data-lucide="key" style="width:16px;height:16px;"></i> Thay đổi mật khẩu</h3>
                        <div class="form-grid-2">
                            <div class="form-group">
                                <label class="form-label">Mật khẩu hiện tại</label>
                                <input type="password" class="form-input" id="changePasswordOld" placeholder="Nhập mật khẩu cũ..." />
                            </div>
                            <div class="form-group">
                                <label class="form-label">Mật khẩu mới</label>
                                <input type="password" class="form-input" id="changePasswordNew" placeholder="Nhập mật khẩu mới..." />
                            </div>
                        </div>
                        <div style="text-align: right; margin-top: 8px;">
                            <button type="button" class="btn-sm btn-primary" id="btnSubmitChangePassword" style="padding: 8px 16px;">Cập nhật mật khẩu</button>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-apply-job" id="btnSaveProfile"><i data-lucide="save" style="width:16px;height:16px;"></i> Lưu hồ sơ</button>
                    <button class="btn-modal-cancel">Hủy</button>
                </div>
            </div>`;

        modal.innerHTML = modalHTML;
        document.body.appendChild(modal);
        if (window.lucide) lucide.createIcons();
        requestAnimationFrame(() => modal.classList.add('active'));

        modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
        modal.querySelector('.btn-modal-cancel').addEventListener('click', () => closeModal(modal));
        modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal); });

        const avatarInput = modal.querySelector('#editAvatarFile');
        const avatarPreview = modal.querySelector('#avatarPreview');
        const avatarPreviewContainer = modal.querySelector('#avatarPreviewContainer');
        const btnRecropAvatar = modal.querySelector('#btnRecropAvatar');

        avatarInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (evt) {
                    openCropModal(evt.target.result, 1, function (croppedBase64) {
                        uploadedAvatarBase64 = croppedBase64;
                        avatarPreview.src = croppedBase64;
                        avatarPreviewContainer.classList.remove('d-none');
                        if (window.lucide) lucide.createIcons();
                    });
                };
                reader.readAsDataURL(file);
            }
        });

        if (btnRecropAvatar) {
            btnRecropAvatar.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (uploadedAvatarBase64) {
                    openCropModal(uploadedAvatarBase64, 1, function (croppedBase64) {
                        uploadedAvatarBase64 = croppedBase64;
                        avatarPreview.src = croppedBase64;
                    });
                }
            });
        }

        if (isStudent) {
            const coverInput = modal.querySelector('#editCoverFile');
            const coverPreview = modal.querySelector('#coverPreview');
            const coverPreviewContainer = modal.querySelector('#coverPreviewContainer');
            const btnRecropCover = modal.querySelector('#btnRecropCover');

            coverInput.addEventListener('change', function (e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function (evt) {
                        openCropModal(evt.target.result, 3.4, function (croppedBase64) {
                            uploadedCoverBase64 = croppedBase64;
                            coverPreview.src = croppedBase64;
                            coverPreviewContainer.classList.remove('d-none');
                            if (window.lucide) lucide.createIcons();
                        });
                    };
                    reader.readAsDataURL(file);
                }
            });

            if (btnRecropCover) {
                btnRecropCover.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (uploadedCoverBase64) {
                        openCropModal(uploadedCoverBase64, 3.4, function (croppedBase64) {
                            uploadedCoverBase64 = croppedBase64;
                            coverPreview.src = croppedBase64;
                        });
                    }
                });
            }

            const cvInput = modal.querySelector('#editCvFile');
            const cvFileLabel = modal.querySelector('#cvFileLabel');
            cvInput.addEventListener('change', function (e) {
                const file = e.target.files[0];
                if (file) {
                    uploadedCvName = file.name;
                    cvFileLabel.textContent = `Đang tải: ${file.name}`;
                    const reader = new FileReader();
                    reader.onload = function (evt) {
                        uploadedCvUrl = evt.target.result;
                        cvFileLabel.textContent = `Tệp đã chọn: ${file.name}`;
                    };
                    reader.readAsDataURL(file);
                }
            });

            const addProjBtn = modal.querySelector('#btnAddProj');
            const newProjTitle = modal.querySelector('#newProjTitle');
            const newProjDesc = modal.querySelector('#newProjDesc');
            const newProjUrl = modal.querySelector('#newProjUrl');
            const modalPortfolioList = modal.querySelector('#modalPortfolioList');

            function renderModalPortfolioItems() {
                modalPortfolioList.innerHTML = tempPortfolio.map((p, idx) => `
                    <div class="modal-portfolio-item" data-index="${idx}">
                        <span>
                            <strong>${escapeHtml(p.title)}</strong> 
                            <small style="color: var(--text-muted); font-size:11px;">(${escapeHtml(p.description || 'Không mô tả')})</small>
                        </span>
                        <button class="btn-delete-portfolio" data-index="${idx}"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
                    </div>
                `).join('');
                if (window.lucide) lucide.createIcons();
                
                modalPortfolioList.querySelectorAll('.btn-delete-portfolio').forEach(btn => {
                    btn.addEventListener('click', function () {
                        const index = parseInt(this.dataset.index);
                        tempPortfolio.splice(index, 1);
                        renderModalPortfolioItems();
                    });
                });
            }

            modalPortfolioList.querySelectorAll('.btn-delete-portfolio').forEach(btn => {
                btn.addEventListener('click', function () {
                    const index = parseInt(this.dataset.index);
                    tempPortfolio.splice(index, 1);
                    renderModalPortfolioItems();
                });
            });

            addProjBtn.addEventListener('click', function () {
                const title = newProjTitle.value.trim();
                const desc = newProjDesc.value.trim();
                const url = newProjUrl.value.trim();
                if (!title) {
                    showToast('Vui lòng nhập tên dự án portfolio!', 'warning');
                    return;
                }
                tempPortfolio.push({ title: title, description: desc, projectUrl: url });
                newProjTitle.value = '';
                newProjDesc.value = '';
                newProjUrl.value = '';
                renderModalPortfolioItems();
            });

            // Bind Certificates management in modal
            const addCertBtn = modal.querySelector('#btnAddCert');
            const modalCertList = modal.querySelector('#modalCertList');

            function renderModalCertItems() {
                modalCertList.innerHTML = tempCertificates.map((c, idx) => `
                    <div class="modal-cert-item" data-index="${idx}">
                        <span>
                            <strong>${escapeHtml(c.certificateName)}</strong> 
                            <small style="color: var(--text-muted); font-size:11px;">
                                (${escapeHtml(c.organization)}) - Cấp: ${formatDate(c.issuedDate)}
                            </small>
                        </span>
                        <button class="btn-delete-cert" data-index="${idx}" style="background: none; border: none; color: var(--danger); cursor: pointer;"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
                    </div>
                `).join('');
                if (window.lucide) lucide.createIcons();
                
                modalCertList.querySelectorAll('.btn-delete-cert').forEach(btn => {
                    btn.addEventListener('click', function () {
                        const index = parseInt(this.dataset.index);
                        tempCertificates.splice(index, 1);
                        renderModalCertItems();
                    });
                });
            }

            if (modalCertList) {
                modalCertList.querySelectorAll('.btn-delete-cert').forEach(btn => {
                    btn.addEventListener('click', function () {
                        const index = parseInt(this.dataset.index);
                        tempCertificates.splice(index, 1);
                        renderModalCertItems();
                    });
                });
            }

            if (addCertBtn) {
                addCertBtn.addEventListener('click', function () {
                    const name = modal.querySelector('#newCertName').value.trim();
                    const org = modal.querySelector('#newCertOrg').value.trim();
                    const issued = modal.querySelector('#newCertIssuedDate').value;
                    const expiry = modal.querySelector('#newCertExpiryDate').value;
                    const url = modal.querySelector('#newCertUrl').value.trim();
                    
                    if (!name) {
                        showToast('Vui lòng nhập tên chứng chỉ!', 'warning');
                        return;
                    }
                    if (!org) {
                        showToast('Vui lòng nhập tổ chức cấp!', 'warning');
                        return;
                    }
                    if (!issued) {
                        showToast('Vui lòng nhập ngày cấp!', 'warning');
                        return;
                    }
                    
                    tempCertificates.push({
                        certificateName: name,
                        organization: org,
                        issuedDate: issued,
                        expiryDate: expiry || null,
                        credentialUrl: url
                    });
                    
                    modal.querySelector('#newCertName').value = '';
                    modal.querySelector('#newCertOrg').value = '';
                    modal.querySelector('#newCertIssuedDate').value = '';
                    modal.querySelector('#newCertExpiryDate').value = '';
                    modal.querySelector('#newCertUrl').value = '';
                    
                    renderModalCertItems();
                });
            }
        }

        modal.querySelector('#btnSaveProfile').addEventListener('click', function () {
            let payload = {
                phone: modal.querySelector('#editPhone').value.trim()
            };

            if (isStudent) {
                const skillsVal = modal.querySelector('#editSkills').value.trim();
                const parsedSkills = skillsVal
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s.length > 0);

                const gpaInput = modal.querySelector('#editGpa').value;
                const gradYearInput = modal.querySelector('#editGraduationYear').value;

                payload.fullName = modal.querySelector('#editName').value.trim();
                payload.bio = modal.querySelector('#editBio').value.trim();
                payload.experience = modal.querySelector('#editExperience').value.trim();
                payload.university = modal.querySelector('#editUniversity').value.trim();
                payload.major = modal.querySelector('#editMajor').value.trim();
                payload.gpa = gpaInput ? parseFloat(gpaInput) : null;
                payload.graduationYear = gradYearInput ? parseInt(gradYearInput) : null;
                payload.gender = modal.querySelector('#editGender').value;
                payload.dateOfBirth = modal.querySelector('#editDob').value;
                payload.avatarUrl = uploadedAvatarBase64;
                payload.coverImageUrl = uploadedCoverBase64;
                payload.cvName = uploadedCvName;
                payload.cvUrl = uploadedCvUrl;
                payload.skills = parsedSkills;
                payload.portfolio = tempPortfolio;
                payload.certificates = tempCertificates;

                if (!payload.fullName) {
                    showToast('Vui lòng nhập họ và tên!', 'warning');
                    return;
                }
            } else {
                payload.companyName = modal.querySelector('#editName').value.trim();
                payload.industry = modal.querySelector('#editIndustry').value.trim();
                payload.taxCode = modal.querySelector('#editTaxCode').value.trim();
                payload.websiteUrl = modal.querySelector('#editWebsiteUrl').value.trim();
                payload.companySize = modal.querySelector('#editCompanySize').value.trim();
                payload.address = modal.querySelector('#editAddress').value.trim();
                payload.logoUrl = uploadedAvatarBase64;

                if (!payload.companyName) {
                    showToast('Vui lòng nhập tên doanh nghiệp!', 'warning');
                    return;
                }
            }

            const saveBtn = modal.querySelector('#btnSaveProfile');
            const originalBtnHTML = saveBtn.innerHTML;
            saveBtn.disabled = true;
            saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" style="margin-right: 8px;"></span> Đang lưu...`;

            fetch('/Home/SaveProfile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(resData => {
                if (resData.success) {
                    closeModal(modal);
                    showToast(resData.message || '✅ Đã lưu thay đổi hồ sơ thành công!', 'success');
                    
                    const topNavUserName = document.querySelector('#userProfile .user-name');
                    if (topNavUserName) {
                        topNavUserName.textContent = isStudent ? payload.fullName : payload.companyName;
                    }
                    
                    renderProfileView();
                } else {
                    showToast(resData.message || 'Lỗi khi lưu thông tin.', 'error');
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = originalBtnHTML;
                }
            })
            .catch(err => {
                console.error(err);
                showToast('Không thể lưu hồ sơ do lỗi kết nối.', 'error');
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalBtnHTML;
            });
        });

        const submitChangePwBtn = modal.querySelector('#btnSubmitChangePassword');
        if (submitChangePwBtn) {
            submitChangePwBtn.addEventListener('click', function () {
                const oldPassword = modal.querySelector('#changePasswordOld').value;
                const newPassword = modal.querySelector('#changePasswordNew').value;

                if (!oldPassword || !newPassword) {
                    showToast('Vui lòng nhập đầy đủ mật khẩu cũ và mới!', 'warning');
                    return;
                }

                if (newPassword.length < 6) {
                    showToast('Mật khẩu mới phải có ít nhất 6 ký tự!', 'warning');
                    return;
                }

                submitChangePwBtn.disabled = true;
                const originalBtnText = submitChangePwBtn.innerHTML;
                submitChangePwBtn.textContent = 'Đang cập nhật...';

                fetch('/Home/ChangePassword', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ oldPassword, newPassword })
                })
                .then(res => res.json())
                .then(resData => {
                    if (resData.success) {
                        showToast('✅ Đổi mật khẩu thành công!', 'success');
                        modal.querySelector('#changePasswordOld').value = '';
                        modal.querySelector('#changePasswordNew').value = '';
                    } else {
                        showToast(resData.message || 'Lỗi khi đổi mật khẩu.', 'error');
                    }
                    submitChangePwBtn.disabled = false;
                    submitChangePwBtn.innerHTML = originalBtnText;
                })
                .catch(err => {
                    console.error(err);
                    showToast('Không thể đổi mật khẩu do lỗi kết nối.', 'error');
                    submitChangePwBtn.disabled = false;
                    submitChangePwBtn.innerHTML = originalBtnText;
                });
            });
        }
    }

    // ============================================
    // RENDER: Tin nhắn
    // ============================================
    function renderMessagesView() {
        mainContent.innerHTML = `
            <div class="page-header">
                <h1 class="page-title"><i data-lucide="message-circle" style="width:24px;height:24px;"></i> Tin nhắn</h1>
                <p class="page-subtitle">Trò chuyện với khách hàng và đối tác</p>
            </div>
            <div class="messages-container">
                <div class="messages-list">
                    ${mockMessages.map(m => `
                        <div class="message-item ${m.unread > 0 ? 'unread' : ''}" data-msg-id="${m.id}">
                            <div class="msg-avatar" style="background:${m.avatarImg ? 'none' : (m.color || '#6366F1')}">
                                ${m.avatarImg ? `<img src="${m.avatarImg}" alt="${m.name}" />` : m.avatar}
                            </div>
                            <div class="msg-content">
                                <div class="msg-header">
                                    <span class="msg-name">${escapeHtml(m.name)}</span>
                                    <span class="msg-time">${m.time}</span>
                                </div>
                                <p class="msg-preview">${escapeHtml(m.lastMsg)}</p>
                            </div>
                            ${m.unread > 0 ? `<span class="msg-badge">${m.unread}</span>` : ''}
                        </div>
                    `).join('')}
                </div>
                <div class="chat-panel" id="chatPanel">
                    <div class="chat-placeholder">
                        <i data-lucide="message-square" style="width:48px;height:48px;color:var(--text-muted);"></i>
                        <p>Chọn một cuộc trò chuyện để bắt đầu</p>
                    </div>
                </div>
            </div>`;
        if (window.lucide) lucide.createIcons();

        // Bind message item clicks
        document.querySelectorAll('.message-item').forEach(item => {
            item.addEventListener('click', function () {
                const msgId = this.dataset.msgId;
                const msg = mockMessages.find(m => m.id === msgId);
                if (!msg) return;
                document.querySelectorAll('.message-item').forEach(i => i.classList.remove('selected'));
                this.classList.add('selected');
                this.classList.remove('unread');
                const badge = this.querySelector('.msg-badge');
                if (badge) badge.remove();
                openChat(msg);
            });
        });
    }

    function openChat(msg) {
        const chatPanel = document.getElementById('chatPanel');
        if (!chatPanel) return;
        const mockChats = [
            { from: 'them', text: 'Chào bạn! Mình cần hỗ trợ dự án này.', time: '10:30' },
            { from: 'me', text: 'Chào bạn! Mình sẵn sàng hỗ trợ ạ. Bạn có thể mô tả chi tiết hơn không?', time: '10:32' },
            { from: 'them', text: msg.lastMsg, time: '10:45' }
        ];
        chatPanel.innerHTML = `
            <div class="chat-header">
                <div class="chat-user-info">
                    <div class="msg-avatar small" style="background:${msg.avatarImg ? 'none' : (msg.color || '#6366F1')}">
                        ${msg.avatarImg ? `<img src="${msg.avatarImg}" alt="" />` : msg.avatar}
                    </div>
                    <div>
                        <div class="chat-user-name">${escapeHtml(msg.name)}</div>
                        <div class="chat-status">Đang hoạt động</div>
                    </div>
                </div>
            </div>
            <div class="chat-messages" id="chatMessages">
                ${mockChats.map(c => `
                    <div class="chat-bubble ${c.from === 'me' ? 'me' : 'them'}">
                        <p>${escapeHtml(c.text)}</p>
                        <span class="bubble-time">${c.time}</span>
                    </div>
                `).join('')}
            </div>
            <div class="chat-input-area">
                <input type="text" placeholder="Nhập tin nhắn..." class="chat-input" id="chatInput" />
                <button class="chat-send-btn" id="chatSendBtn"><i data-lucide="send" style="width:18px;height:18px;"></i></button>
            </div>`;
        if (window.lucide) lucide.createIcons();

        const chatInput = document.getElementById('chatInput');
        const chatSendBtn = document.getElementById('chatSendBtn');
        const chatMessages = document.getElementById('chatMessages');

        function sendMsg() {
            const text = chatInput.value.trim();
            if (!text) return;
            const bubble = document.createElement('div');
            bubble.className = 'chat-bubble me';
            const now = new Date();
            bubble.innerHTML = `<p>${escapeHtml(text)}</p><span class="bubble-time">${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}</span>`;
            chatMessages.appendChild(bubble);
            chatInput.value = '';
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Auto reply
            setTimeout(() => {
                const replies = ['Cảm ơn bạn! 👍', 'Ok mình hiểu rồi!', 'Để mình xem lại nhé!', 'Tuyệt vời! 🎉', 'Mình sẽ gửi lại sớm ạ.'];
                const reply = document.createElement('div');
                reply.className = 'chat-bubble them';
                reply.innerHTML = `<p>${replies[Math.floor(Math.random() * replies.length)]}</p><span class="bubble-time">${now.getHours()}:${String(now.getMinutes() + 1).padStart(2, '0')}</span>`;
                chatMessages.appendChild(reply);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 1500);
        }

        chatSendBtn?.addEventListener('click', sendMsg);
        chatInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMsg(); });
    }

    // ============================================
    // RENDER: Đánh giá
    // ============================================
    function renderReviewsView() {
        const avgRating = (mockReviews.reduce((s, r) => s + r.rating, 0) / mockReviews.length).toFixed(1);
        mainContent.innerHTML = `
            <div class="page-header">
                <h1 class="page-title"><i data-lucide="star" style="width:24px;height:24px;"></i> Đánh giá của tôi</h1>
                <p class="page-subtitle">Xem các đánh giá từ khách hàng</p>
            </div>
            <div class="reviews-summary">
                <div class="review-score-big">
                    <div class="score-number">${avgRating}</div>
                    <div class="score-stars">${'★'.repeat(Math.round(avgRating))}${'☆'.repeat(5 - Math.round(avgRating))}</div>
                    <div class="score-count">${mockReviews.length} đánh giá</div>
                </div>
                <div class="rating-bars">
                    ${[5, 4, 3, 2, 1].map(star => {
            const count = mockReviews.filter(r => r.rating === star).length;
            const pct = (count / mockReviews.length * 100);
            return `<div class="rating-bar-row">
                            <span class="bar-label">${star} ★</span>
                            <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
                            <span class="bar-count">${count}</span>
                        </div>`;
        }).join('')}
                </div>
            </div>
            <div class="reviews-list">
                ${mockReviews.map(r => `
                    <div class="review-card">
                        <div class="review-header">
                            <div class="reviewer-info">
                                <div class="reviewer-avatar">${r.reviewer[0]}${r.reviewer.split(' ').pop()[0]}</div>
                                <div>
                                    <div class="reviewer-name">${escapeHtml(r.reviewer)}</div>
                                    <div class="review-project">${escapeHtml(r.project)}</div>
                                </div>
                            </div>
                            <div class="review-meta">
                                <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
                                <div class="review-date">${r.date}</div>
                            </div>
                        </div>
                        <p class="review-comment">"${escapeHtml(r.comment)}"</p>
                    </div>
                `).join('')}
            </div>`;
        if (window.lucide) lucide.createIcons();
    }

    // ============================================
    // RENDER: Ví tiền
    // ============================================
    function renderWalletView() {
        mainContent.innerHTML = `
            <div class="page-header">
                <h1 class="page-title"><i data-lucide="wallet" style="width:24px;height:24px;"></i> Ví tiền J4S</h1>
                <p class="page-subtitle">Quản lý thu chi và giao dịch</p>
            </div>
            <div class="wallet-balance-card">
                <div class="balance-info">
                    <div class="balance-label">Số dư khả dụng</div>
                    <div class="balance-amount">2.450.000 đ</div>
                    <div class="balance-change">+12% so với tháng trước</div>
                </div>
                <div class="wallet-quick-actions">
                    <button class="wallet-action-btn deposit" id="walletDeposit"><i data-lucide="plus-circle" style="width:20px;height:20px;"></i> Nạp tiền</button>
                    <button class="wallet-action-btn withdraw" id="walletWithdraw"><i data-lucide="arrow-up-circle" style="width:20px;height:20px;"></i> Rút tiền</button>
                </div>
            </div>
            <div class="wallet-stats-row">
                <div class="wallet-stat"><div class="ws-label">Thu nhập tháng này</div><div class="ws-value income">+1.170.000 đ</div></div>
                <div class="wallet-stat"><div class="ws-label">Chi tháng này</div><div class="ws-value expense">-1.058.500 đ</div></div>
                <div class="wallet-stat"><div class="ws-label">Đang giữ (Escrow)</div><div class="ws-value pending">350.000 đ</div></div>
            </div>
            <h3 class="section-title" style="margin:24px 0 16px;">Lịch sử giao dịch</h3>
            <div class="transaction-list-full">
                ${mockWalletTransactions.map(t => `
                    <div class="transaction-item-full">
                        <div class="tx-icon ${t.type}">
                            <i data-lucide="${t.type === 'income' ? 'arrow-down-left' : t.type === 'expense' ? 'arrow-up-right' : 'plus'}" style="width:16px;height:16px;"></i>
                        </div>
                        <div class="tx-info">
                            <div class="tx-desc">${t.desc}</div>
                            <div class="tx-date">${t.date}</div>
                        </div>
                        <div class="tx-amount ${t.type}">${t.amount}</div>
                    </div>
                `).join('')}
            </div>`;
        if (window.lucide) lucide.createIcons();
        document.getElementById('walletDeposit')?.addEventListener('click', () => showToast('💰 Đã nạp thành công 500.000 đ vào ví!', 'success'));
        document.getElementById('walletWithdraw')?.addEventListener('click', () => showToast('🏦 Yêu cầu rút 1.000.000 đ đã được gửi!', 'success'));
    }

    // ============================================
    // RENDER: Freelancer nổi bật
    // ============================================
    function renderFeaturedFreelancersView() {
        mainContent.innerHTML = `
            <div class="page-header">
                <h1 class="page-title"><i data-lucide="award" style="width:24px;height:24px;"></i> Freelancer nổi bật</h1>
                <p class="page-subtitle">Những freelancer được đánh giá cao nhất trên J4S</p>
            </div>
            <div class="featured-grid">
                ${mockFeaturedFreelancers.map(f => `
                    <div class="featured-card">
                        <div class="featured-badge">${f.badge}</div>
                        <div class="featured-avatar" style="background:${f.avatar ? 'none' : (f.color || '#6366F1')}">
                            ${f.avatar ? `<img src="${f.avatar}" alt="${f.name}" />` : f.initials}
                        </div>
                        <h3 class="featured-name">${escapeHtml(f.name)}</h3>
                        <p class="featured-skill">${escapeHtml(f.skill)}</p>
                        <div class="featured-stats">
                            <span>★ ${f.rating} (${f.reviews})</span>
                            <span>${f.completedJobs} dự án</span>
                        </div>
                        <button class="btn-view-profile" onclick="event.stopPropagation()">Xem hồ sơ</button>
                    </div>
                `).join('')}
            </div>`;
        if (window.lucide) lucide.createIcons();
        document.querySelectorAll('.featured-card .btn-view-profile').forEach((btn, i) => {
            btn.addEventListener('click', () => openFreelancerProfileModal(mockFeaturedFreelancers[i]));
        });
    }

    // ============================================
    // RENDER: Bảng xếp hạng
    // ============================================
    function renderLeaderboardView() {
        mainContent.innerHTML = `
            <div class="page-header">
                <h1 class="page-title"><i data-lucide="bar-chart-3" style="width:24px;height:24px;"></i> Bảng xếp hạng tháng 5/2026</h1>
                <p class="page-subtitle">Top freelancer hoạt động tích cực nhất</p>
            </div>
            <div class="leaderboard-top3">
                ${mockLeaderboard.slice(0, 3).map((u, i) => `
                    <div class="top3-card top${i + 1}">
                        <div class="top3-rank">${['🥇', '🥈', '🥉'][i]}</div>
                        <div class="top3-avatar" style="background:${u.avatar ? 'none' : 'linear-gradient(135deg, #6366F1, #8B5CF6)'}">
                            ${u.avatar ? `<img src="${u.avatar}" alt="" />` : u.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                        </div>
                        <div class="top3-name">${escapeHtml(u.name)}</div>
                        <div class="top3-score">${u.score} điểm</div>
                        <div class="top3-meta">★ ${u.rating} · ${u.jobs} dự án</div>
                    </div>
                `).join('')}
            </div>
            <div class="leaderboard-table">
                <div class="lb-header-row">
                    <span class="lb-col-rank">Hạng</span>
                    <span class="lb-col-name">Freelancer</span>
                    <span class="lb-col-score">Điểm</span>
                    <span class="lb-col-jobs">Dự án</span>
                    <span class="lb-col-rating">Rating</span>
                    <span class="lb-col-trend">Xu hướng</span>
                </div>
                ${mockLeaderboard.map(u => `
                    <div class="lb-row ${u.isCurrentUser ? 'current-user' : ''}">
                        <span class="lb-col-rank">#${u.rank}</span>
                        <span class="lb-col-name">${escapeHtml(u.name)} ${u.isCurrentUser ? '<span class="you-badge">Bạn</span>' : ''}</span>
                        <span class="lb-col-score">${u.score}</span>
                        <span class="lb-col-jobs">${u.jobs}</span>
                        <span class="lb-col-rating">★ ${u.rating}</span>
                        <span class="lb-col-trend trend-${u.trend === '↑' ? 'up' : u.trend === '↓' ? 'down' : 'same'}">${u.trend}</span>
                    </div>
                `).join('')}
            </div>`;
        if (window.lucide) lucide.createIcons();
    }

    // ============================================
    // RENDER: Blog & Hướng dẫn
    // ============================================
    function renderBlogView() {
        const colors = ['#6366F1', '#EC4899', '#14B8A6', '#F59E0B', '#EF4444'];
        mainContent.innerHTML = `
            <div class="page-header">
                <h1 class="page-title"><i data-lucide="book-open" style="width:24px;height:24px;"></i> Blog & Hướng dẫn</h1>
                <p class="page-subtitle">Kiến thức và mẹo hữu ích cho freelancer</p>
            </div>
            <div class="blog-grid">
                ${mockBlogPosts.map((b, i) => `
                    <div class="blog-card" data-blog-id="${b.id}">
                        <div class="blog-thumbnail" style="background:linear-gradient(135deg, ${colors[i % colors.length]}, ${colors[(i + 1) % colors.length]}33)">
                            <span class="blog-category-tag">${escapeHtml(b.category)}</span>
                        </div>
                        <div class="blog-content">
                            <h3 class="blog-title">${escapeHtml(b.title)}</h3>
                            <p class="blog-excerpt">${escapeHtml(b.excerpt)}</p>
                            <div class="blog-meta">
                                <span><i data-lucide="calendar" style="width:12px;height:12px;"></i> ${b.date}</span>
                                <span><i data-lucide="clock" style="width:12px;height:12px;"></i> ${b.readTime}</span>
                                <span><i data-lucide="eye" style="width:12px;height:12px;"></i> ${b.views.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>`;
        if (window.lucide) lucide.createIcons();
        document.querySelectorAll('.blog-card').forEach(card => {
            card.addEventListener('click', () => showToast('📖 Đang mở bài viết...', 'info'));
        });
    }

    // ============================================
    // RENDER JOBS — Dynamic DOM rebuild
    // ============================================
    function renderJobs(jobs) {
        const container = document.getElementById('jobFeedContainer') || mainContent?.querySelector('#jobFeedContainer');
        if (!container) return;

        if (!jobs || jobs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <h3>Không tìm thấy việc làm</h3>
                    <p>Hãy thử từ khóa khác hoặc chọn danh mục khác.</p>
                </div>`;
            return;
        }

        const iconMap = {
            'Design': { cls: 'design', icon: 'image' },
            'Translation': { cls: 'translate', icon: 'file-text' },
            'Slides': { cls: 'slide', icon: 'monitor' },
            'Content': { cls: 'content', icon: 'pen-tool' },
            'Code': { cls: 'code', icon: 'code-2' },
            'Video': { cls: 'video', icon: 'video' }
        };

        container.innerHTML = jobs.map((job, idx) => {
            const iconInfo = iconMap[job.category] || { cls: 'design', icon: 'briefcase' };
            const budgetFormatted = formatVND(job.budget);
            const savedClass = job.isSaved ? 'saved' : '';
            const appliedBadge = job.isApplied ? '<span class="applied-badge">Đã ứng tuyển</span>' : '';

            return `
            <div class="job-card animate-in" data-job-id="${job.id}" style="animation-delay: ${idx * 0.05}s">
                <div class="job-icon ${iconInfo.cls}">
                    <i data-lucide="${iconInfo.icon}" style="width:22px;height:22px;"></i>
                </div>
                <div class="job-info">
                    <h3 class="job-title" data-job-id="${job.id}">${escapeHtml(job.title)}</h3>
                    <p class="job-desc">${escapeHtml(job.description)}</p>
                    <div class="job-tags">
                        ${job.tags.map(t => `<span class="job-tag">${escapeHtml(t)}</span>`).join('')}
                    </div>
                </div>
                <div class="job-meta">
                    <span class="job-price">${budgetFormatted}</span>
                    <span class="job-deadline">${escapeHtml(job.deadline)}</span>
                    <span class="job-proposals">${job.applicantsCount} đề xuất ${appliedBadge}</span>
                </div>
                <button class="job-bookmark ${savedClass}" data-job-id="${job.id}" aria-label="Lưu việc">
                    <i data-lucide="${job.isSaved ? 'bookmark-check' : 'bookmark'}" style="width:18px;height:18px;"></i>
                </button>
            </div>`;
        }).join('');

        if (window.lucide) lucide.createIcons();
        bindJobFeedEvents();
    }

    // ============================================
    // JOB FEED EVENTS — Bookmark + Title Click
    // ============================================
    function bindJobFeedEvents() {
        document.querySelectorAll('.job-bookmark[data-job-id]').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                toggleSaveJob(this.dataset.jobId, this);
            });
        });

        document.querySelectorAll('.job-title[data-job-id]').forEach(title => {
            const newTitle = title.cloneNode(true);
            title.parentNode.replaceChild(newTitle, title);
            newTitle.addEventListener('click', function () {
                openJobModal(this.dataset.jobId);
            });
            newTitle.style.cursor = 'pointer';
        });
    }

    // ============================================
    // TOGGLE SAVE JOB
    // ============================================
    function toggleSaveJob(jobId, btnEl) {
        fetch('/Home/ToggleSaveJob', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId })
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    const job = allJobs.find(j => j.id === jobId);
                    if (job) job.isSaved = data.isSaved;

                    if (data.isSaved) {
                        btnEl.classList.add('saved');
                        btnEl.innerHTML = '<i data-lucide="bookmark-check" style="width:18px;height:18px;"></i>';
                        showToast('🔖 Đã lưu việc làm!', 'success');
                    } else {
                        btnEl.classList.remove('saved');
                        btnEl.innerHTML = '<i data-lucide="bookmark" style="width:18px;height:18px;"></i>';
                        showToast('Đã bỏ lưu việc làm.', 'info');
                    }
                    if (window.lucide) lucide.createIcons();

                    if (currentSidebarMode === 'saved') {
                        renderJobs(allJobs.filter(j => j.isSaved));
                    }
                } else {
                    showToast(data.message || 'Lỗi khi thực hiện thao tác.', 'warning');
                }
            })
            .catch(err => {
                console.error('Save error:', err);
                showToast('Lỗi khi lưu việc làm.', 'error');
            });
    }

    // ============================================
    // JOB APPLICATION MODAL
    // ============================================
    function openJobModal(jobId) {
        const job = allJobs.find(j => j.id === jobId);
        if (!job) return;

        const budgetFormatted = formatVND(job.budget);
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close"><i data-lucide="x" style="width:20px;height:20px;"></i></button>
                <div class="modal-header">
                    <h2>${escapeHtml(job.title)}</h2>
                    <div class="modal-tags">${job.tags.map(t => `<span class="job-tag">${escapeHtml(t)}</span>`).join('')}</div>
                </div>
                <div class="modal-body">
                    <p class="modal-description">${escapeHtml(job.description)}</p>
                    <div class="modal-details">
                        <div class="detail-item">
                            <div class="detail-icon"><i data-lucide="banknote" style="width:18px;height:18px;"></i></div>
                            <div><div class="detail-label">Ngân sách</div><div class="detail-value">${budgetFormatted}</div></div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-icon"><i data-lucide="clock" style="width:18px;height:18px;"></i></div>
                            <div><div class="detail-label">Thời hạn</div><div class="detail-value">${escapeHtml(job.deadline)}</div></div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-icon"><i data-lucide="users" style="width:18px;height:18px;"></i></div>
                            <div><div class="detail-label">Đề xuất</div><div class="detail-value" id="modalApplicants">${job.applicantsCount} người</div></div>
                        </div>
                    </div>
                    <div class="escrow-notice">
                        <div class="escrow-icon">🛡️</div>
                        <div><strong>Bảo vệ bởi J4S Escrow</strong><p>Tiền được giữ an toàn trong ví trung gian. Freelancer nhận tiền sau khi khách hàng xác nhận hoàn thành.</p></div>
                    </div>
                    <div class="deadline-warning">
                        <div class="warning-icon"><i data-lucide="alert-triangle" style="width:16px;height:16px;"></i></div>
                        <div><strong>Cam kết thời hạn</strong><p>Trễ deadline sẽ bị trừ điểm uy tín và có thể bị hạn chế nhận việc mới.</p></div>
                    </div>
                </div>
                <div class="modal-footer">
                    ${job.isApplied
                ? '<button class="btn-applied" disabled><i data-lucide="check-circle" style="width:16px;height:16px;"></i> Đã ứng tuyển</button>'
                : `<button class="btn-apply-job" id="btnApplyJob" data-job-id="${job.id}"><i data-lucide="send" style="width:16px;height:16px;"></i> Ứng tuyển ngay</button>`}
                    <button class="btn-modal-cancel">Đóng</button>
                </div>
            </div>`;

        document.body.appendChild(modal);
        if (window.lucide) lucide.createIcons();
        requestAnimationFrame(() => modal.classList.add('active'));

        modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
        modal.querySelector('.btn-modal-cancel').addEventListener('click', () => closeModal(modal));
        modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal); });

        const applyBtn = modal.querySelector('#btnApplyJob');
        if (applyBtn) {
            applyBtn.addEventListener('click', function () { applyJob(job.id, this, modal); });
        }
    }

    function closeModal(modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }

    function loadCropper(callback) {
        if (window.Cropper) {
            callback();
            return;
        }
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.css';
        document.head.appendChild(cssLink);

        const jsScript = document.createElement('script');
        jsScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.js';
        jsScript.onload = () => {
            callback();
        };
        document.head.appendChild(jsScript);
    }

    function openCropModal(imageSrc, aspectRatio, callback) {
        const cropModal = document.createElement('div');
        cropModal.className = 'modal-overlay';
        cropModal.style.zIndex = '3000';

        cropModal.innerHTML = `
            <div class="modal-content" style="max-width: 600px; padding: 20px;">
                <button class="modal-close" id="btnCloseCropModal"><i data-lucide="x" style="width:20px;height:20px;"></i></button>
                <div class="modal-header" style="padding: 0 0 15px 0;">
                    <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: var(--text-primary);">✂️ Cắt chỉnh ảnh</h2>
                </div>
                <div class="modal-body" style="padding: 10px 0 20px 0; text-align: center;">
                    <div style="max-height: 400px; background: #f1f5f9; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                        <img id="cropImageTarget" src="${imageSrc}" style="max-width: 100%; max-height: 400px;" />
                    </div>
                </div>
                <div class="modal-footer" style="padding: 0; display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="btn-modal-cancel" id="btnCancelCrop">Hủy</button>
                    <button class="btn-apply-job" id="btnConfirmCrop"><i data-lucide="crop" style="width:16px;height:16px;"></i> Cắt & Lưu</button>
                </div>
            </div>`;

        document.body.appendChild(cropModal);
        if (window.lucide) lucide.createIcons();
        requestAnimationFrame(() => cropModal.classList.add('active'));

        const image = cropModal.querySelector('#cropImageTarget');
        let cropper;

        loadCropper(function () {
            cropper = new Cropper(image, {
                aspectRatio: aspectRatio,
                viewMode: 1,
                autoCropArea: 0.9,
                responsive: true,
                restore: false,
                checkCrossOrigin: false
            });
        });

        const cleanup = () => {
            if (cropper) {
                cropper.destroy();
            }
            closeModal(cropModal);
        };

        cropModal.querySelector('#btnCloseCropModal').addEventListener('click', cleanup);
        cropModal.querySelector('#btnCancelCrop').addEventListener('click', cleanup);

        cropModal.querySelector('#btnConfirmCrop').addEventListener('click', function () {
            if (cropper) {
                const canvas = cropper.getCroppedCanvas({
                    maxWidth: aspectRatio === 1 ? 500 : 1200,
                    maxHeight: aspectRatio === 1 ? 500 : 600
                });
                if (canvas) {
                    const croppedBase64 = canvas.toDataURL('image/jpeg', 0.85);
                    callback(croppedBase64);
                }
            }
            cleanup();
        });
    }

    // ============================================
    // APPLY JOB
    // ============================================
    function applyJob(jobId, btnEl, modal) {
        btnEl.disabled = true;
        btnEl.innerHTML = '<span class="spinner"></span> Đang xử lý...';

        fetch('/Home/ApplyJob', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId })
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    const job = allJobs.find(j => j.id === jobId);
                    if (job) { job.isApplied = true; job.applicantsCount = data.applicantsCount; }

                    btnEl.className = 'btn-applied';
                    btnEl.innerHTML = '<i data-lucide="check-circle" style="width:16px;height:16px;"></i> Đã ứng tuyển';
                    if (window.lucide) lucide.createIcons();

                    const applicantsEl = modal.querySelector('#modalApplicants');
                    if (applicantsEl) applicantsEl.textContent = `${data.applicantsCount} người`;

                    const feedCard = document.querySelector(`.job-card[data-job-id="${jobId}"]`);
                    if (feedCard) {
                        const p = feedCard.querySelector('.job-proposals');
                        if (p) p.innerHTML = `${data.applicantsCount} đề xuất <span class="applied-badge">Đã ứng tuyển</span>`;
                    }

                    // Update saved original HTML
                    if (mainContent) originalMainHTML = mainContent.innerHTML;

                    showToast('🎉 Ứng tuyển thành công! Nhà tuyển dụng sẽ liên hệ bạn sớm.', 'success');
                } else {
                    btnEl.disabled = false;
                    btnEl.innerHTML = '<i data-lucide="send" style="width:16px;height:16px;"></i> Ứng tuyển ngay';
                    if (window.lucide) lucide.createIcons();
                    showToast(data.message || 'Lỗi khi ứng tuyển.', 'warning');
                }
            })
            .catch(err => {
                console.error('Apply error:', err);
                btnEl.disabled = false;
                btnEl.innerHTML = '<i data-lucide="send" style="width:16px;height:16px;"></i> Ứng tuyển ngay';
                if (window.lucide) lucide.createIcons();
                showToast('Lỗi khi ứng tuyển.', 'error');
            });
    }

    // ============================================
    // FREELANCER PROFILE MODAL
    // ============================================
    function openFreelancerProfileModal(freelancer) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close"><i data-lucide="x" style="width:20px;height:20px;"></i></button>
                <div class="modal-body" style="padding-top:28px;">
                    <div style="text-align:center;margin-bottom:20px;">
                        <div class="featured-avatar-modal" style="background:${freelancer.avatar ? 'none' : (freelancer.color || '#6366F1')}">
                            ${freelancer.avatar ? `<img src="${freelancer.avatar}" alt="" />` : (freelancer.initials || freelancer.name.split(' ').map(w => w[0]).join('').slice(0, 2))}
                        </div>
                        <h2 style="margin:12px 0 4px;">${escapeHtml(freelancer.name)}</h2>
                        <p style="color:var(--text-muted);font-size:14px;">${escapeHtml(freelancer.skill)}</p>
                        <div style="margin-top:8px;display:flex;gap:8px;justify-content:center;">
                            <span class="badge badge-rating">★ ${freelancer.rating} (${freelancer.reviews || freelancer.reviewsCount} đánh giá)</span>
                            ${freelancer.completedJobs ? `<span class="badge badge-level">${freelancer.completedJobs} dự án</span>` : ''}
                        </div>
                    </div>
                    <div class="escrow-notice" style="margin-top:16px;">
                        <div class="escrow-icon">💼</div>
                        <div><strong>Sẵn sàng nhận việc</strong><p>Freelancer này đang hoạt động và có thể bắt đầu ngay.</p></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-apply-job" onclick="this.closest('.modal-overlay').querySelector('.modal-close').click();">
                        <i data-lucide="message-circle" style="width:16px;height:16px;"></i> Nhắn tin
                    </button>
                    <button class="btn-modal-cancel">Đóng</button>
                </div>
            </div>`;

        document.body.appendChild(modal);
        if (window.lucide) lucide.createIcons();
        requestAnimationFrame(() => modal.classList.add('active'));

        modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
        modal.querySelector('.btn-modal-cancel').addEventListener('click', () => closeModal(modal));
        modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal); });

        modal.querySelector('.btn-apply-job').addEventListener('click', () => {
            showToast('💬 Đã gửi tin nhắn cho ' + freelancer.name, 'success');
        });
    }

    // ============================================
    // FINANCIAL MODALS (Right Sidebar)
    // ============================================
    function bindFinancialButtons() {
        const configs = {
            'btnDeposit': { title: 'Nạp tiền vào ví', icon: '💰', message: 'Bạn đã nạp thành công <strong>500.000 đ</strong> vào ví J4S!', detail: 'Số dư hiện tại: 2.950.000 đ' },
            'btnWithdraw': { title: 'Rút tiền', icon: '🏦', message: 'Yêu cầu rút <strong>1.000.000 đ</strong> đã được gửi!', detail: 'Tiền sẽ về tài khoản ngân hàng trong 1-3 ngày làm việc.' },
            'btnHistory': { title: 'Lịch sử giao dịch', icon: '📊', isHistory: true, transactions: mockWalletTransactions.slice(0, 5) },
            'btnPromo': { title: 'Ưu đãi cho bạn', icon: '🎁', message: 'Chúc mừng! Bạn có mã giảm <strong>20%</strong> phí dịch vụ.', detail: 'Mã: J4S20OFF — Hết hạn: 30/06/2026' }
        };
        Object.entries(configs).forEach(([id, config]) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.addEventListener('click', () => openFinancialModal(config));
        });
    }

    function openFinancialModal(config) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        let bodyContent = config.isHistory
            ? `<div class="transaction-list">${config.transactions.map(t => `
                <div class="transaction-item">
                    <div class="transaction-info"><span class="transaction-date">${t.date}</span><span class="transaction-desc">${t.desc}</span></div>
                    <span class="transaction-amount ${t.type}">${t.amount}</span>
                </div>`).join('')}</div>`
            : `<div class="financial-result">
                <div class="result-icon">${config.icon}</div>
                <p class="result-message">${config.message}</p>
                ${config.detail ? `<p class="result-detail">${config.detail}</p>` : ''}
               </div>`;

        modal.innerHTML = `
            <div class="modal-content modal-sm">
                <button class="modal-close"><i data-lucide="x" style="width:20px;height:20px;"></i></button>
                <div class="modal-header"><h2>${config.icon} ${config.title}</h2></div>
                <div class="modal-body">${bodyContent}</div>
                <div class="modal-footer"><button class="btn-modal-cancel">Đóng</button></div>
            </div>`;

        document.body.appendChild(modal);
        if (window.lucide) lucide.createIcons();
        requestAnimationFrame(() => modal.classList.add('active'));
        modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
        modal.querySelector('.btn-modal-cancel').addEventListener('click', () => closeModal(modal));
        modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal); });
    }

    // ============================================
    // NOTIFICATION DROPDOWN
    // ============================================
    function bindNotificationBtn() {
        const btn = document.getElementById('notificationBtn');
        if (!btn) return;
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            // Close any existing dropdown
            document.querySelector('.dropdown-panel')?.remove();

            const dropdown = document.createElement('div');
            dropdown.className = 'dropdown-panel notification-dropdown';
            dropdown.innerHTML = `
                <div class="dropdown-header">
                    <h4>Thông báo</h4>
                    <button class="dropdown-mark-read">Đánh dấu đã đọc</button>
                </div>
                <div class="dropdown-list">
                    ${mockNotifications.map(n => `
                        <div class="dropdown-item ${n.unread ? 'unread' : ''}">
                            <div class="dropdown-item-icon">${n.icon}</div>
                            <div class="dropdown-item-content">
                                <div class="dropdown-item-title">${n.title}</div>
                                <div class="dropdown-item-desc">${n.desc}</div>
                                <div class="dropdown-item-time">${n.time}</div>
                            </div>
                            ${n.unread ? '<div class="dropdown-dot"></div>' : ''}
                        </div>
                    `).join('')}
                </div>`;

            document.body.appendChild(dropdown);
            // Position near the bell
            const rect = btn.getBoundingClientRect();
            dropdown.style.top = (rect.bottom + 8) + 'px';
            dropdown.style.right = (window.innerWidth - rect.right) + 'px';

            requestAnimationFrame(() => dropdown.classList.add('show'));

            dropdown.querySelector('.dropdown-mark-read').addEventListener('click', () => {
                dropdown.querySelectorAll('.unread').forEach(item => item.classList.remove('unread'));
                dropdown.querySelectorAll('.dropdown-dot').forEach(dot => dot.remove());
                const badge = btn.querySelector('.notification-badge');
                if (badge) badge.style.display = 'none';
                showToast('✅ Đã đánh dấu tất cả đã đọc', 'success');
            });

            // Close on outside click
            setTimeout(() => {
                document.addEventListener('click', function closeDropdown(ev) {
                    if (!dropdown.contains(ev.target)) {
                        dropdown.classList.remove('show');
                        setTimeout(() => dropdown.remove(), 200);
                        document.removeEventListener('click', closeDropdown);
                    }
                });
            }, 10);
        });
    }

    // ============================================
    // USER PROFILE DROPDOWN
    // ============================================
    function bindUserProfileDropdown() {
        const btn = document.getElementById('userProfile');
        if (!btn) return;
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            document.querySelector('.dropdown-panel')?.remove();

            // Read dynamic info from the DOM elements
            const nameEl = btn.querySelector('.user-name');
            const roleEl = btn.querySelector('.user-role');
            const initialsEl = btn.querySelector('.user-avatar span');
            const avatarImg = btn.querySelector('.user-avatar img');

            const name = nameEl ? nameEl.textContent.trim() : 'Người dùng';
            const role = roleEl ? roleEl.textContent.trim() : 'Thành viên';
            const initials = initialsEl ? initialsEl.textContent.trim() : 'US';
            const avatarSrc = avatarImg ? avatarImg.src : null;
            const email = btn.getAttribute('data-email') || (role === 'Freelancer' ? 'sinhvien@j4s.vn' : 'doanhnghiep@j4s.vn');

            const dropdown = document.createElement('div');
            dropdown.className = 'dropdown-panel user-dropdown';
            dropdown.innerHTML = `
                <div class="dropdown-user-header">
                    <div class="user-avatar" style="background: ${avatarSrc ? 'none' : 'linear-gradient(135deg, #2563eb, #3b82f6)'}; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; color: white; font-weight: 700; overflow: hidden; flex-shrink: 0;">
                        ${avatarSrc 
                            ? `<img src="${avatarSrc}" style="width: 100%; height: 100%; object-fit: cover;" />` 
                            : `<span>${escapeHtml(initials)}</span>`
                        }
                    </div>
                    <div>
                        <div class="dropdown-user-name">${escapeHtml(name)}</div>
                        <div class="dropdown-user-email">${escapeHtml(email)}</div>
                    </div>
                </div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-menu-list">
                    <div class="dropdown-menu-item" data-action="profile"><i data-lucide="user" style="width:16px;height:16px;"></i> Hồ sơ của tôi</div>
                    <div class="dropdown-menu-item" data-action="policies"><i data-lucide="shield-check" style="width:16px;height:16px;"></i> Điều khoản & Chính sách</div>
                    <div class="dropdown-divider"></div>
                    <div class="dropdown-menu-item danger" data-action="logout"><i data-lucide="log-out" style="width:16px;height:16px;"></i> Đăng xuất</div>
                </div>`;

            document.body.appendChild(dropdown);
            const rect = btn.getBoundingClientRect();
            dropdown.style.top = (rect.bottom + 8) + 'px';
            dropdown.style.right = (window.innerWidth - rect.right) + 'px';
            if (window.lucide) lucide.createIcons();

            requestAnimationFrame(() => dropdown.classList.add('show'));

            dropdown.querySelectorAll('.dropdown-menu-item').forEach(item => {
                item.addEventListener('click', () => {
                    const action = item.dataset.action;
                    dropdown.classList.remove('show');
                    setTimeout(() => dropdown.remove(), 200);
                    switch (action) {
                        case 'profile': setActiveSidebar('profile'); currentSidebarMode = 'profile'; renderProfileView(); break;
                        case 'policies': setActiveSidebar(''); currentSidebarMode = 'policies'; renderPoliciesView(); break;
                        case 'logout':
                            const logoutForm = document.getElementById('logoutForm');
                            if (logoutForm) {
                                logoutForm.submit();
                            } else {
                                window.location.href = '/Auth/Logout';
                            }
                            break;
                    }
                });
            });

            setTimeout(() => {
                document.addEventListener('click', function closeDd(ev) {
                    if (!dropdown.contains(ev.target)) {
                        dropdown.classList.remove('show');
                        setTimeout(() => dropdown.remove(), 200);
                        document.removeEventListener('click', closeDd);
                    }
                });
            }, 10);
        });
    }

    function renderPoliciesView() {
        mainContent.innerHTML = `
            <div class="page-header animate-in">
                <h1 class="page-title"><i data-lucide="shield-check" style="width:24px;height:24px;"></i> Điều khoản & Chính sách</h1>
                <p class="page-subtitle">Các quy định sử dụng và chính sách bảo mật thông tin trên J4S</p>
            </div>
            
            <div class="profile-content-grid animate-in" style="grid-template-columns: 1fr; gap: 24px; max-width: 900px; margin: 0 auto;">
                <div class="profile-card-modern" style="padding: 30px;">
                    <h2 style="font-size: 20px; font-weight: 800; color: #0ea5e9; margin: 0 0 16px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; display: flex; align-items: center; gap: 8px;"><i data-lucide="file-text" style="width:20px;height:20px;"></i> Điều khoản sử dụng</h2>
                    <div style="font-size: 14px; line-height: 1.8; color: var(--text-secondary);">
                        <p>Chào mừng bạn đến với <strong>J4S (Job For Students)</strong>. Bằng việc truy cập và sử dụng nền tảng của chúng tôi, bạn đồng ý tuân thủ các điều khoản sau đây:</p>
                        <h4 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-top: 16px; margin-bottom: 8px;">1. Tài khoản người dùng</h4>
                        <ul style="padding-left: 20px;">
                            <li>Sinh viên phải cung cấp thông tin học vấn chính xác (Trường học, Chuyên ngành, Điểm GPA nếu có).</li>
                            <li>Doanh nghiệp/Nhà tuyển dụng chịu trách nhiệm về tính pháp lý và thông tin tuyển dụng của dự án/công việc đăng tải.</li>
                            <li>Nghiêm cấm chia sẻ tài khoản hoặc sử dụng thông tin giả mạo.</li>
                        </ul>
                        <h4 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-top: 16px; margin-bottom: 8px;">2. Quy trình làm việc và Thanh toán (Escrow)</h4>
                        <ul style="padding-left: 20px;">
                            <li>Tất cả các giao dịch thanh toán dự án phải được thực hiện thông qua hệ thống giữ tiền trung gian (Escrow) của J4S để đảm bảo quyền lợi cho cả hai bên.</li>
                            <li>Doanh nghiệp cần nạp đủ ngân sách công việc trước khi freelancer bắt đầu thực hiện dự án.</li>
                            <li>Freelancer nhận thanh toán sau khi doanh nghiệp xác nhận nghiệm thu sản phẩm đạt yêu cầu.</li>
                        </ul>
                        <h4 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-top: 16px; margin-bottom: 8px;">3. Quyền và nghĩa vụ</h4>
                        <ul style="padding-left: 20px;">
                            <li>Freelancer cam kết hoàn thành công việc đúng thời hạn (deadline) và chất lượng đã thỏa thuận.</li>
                            <li>Mọi tranh chấp phát sinh sẽ được ban quản trị J4S hỗ trợ giải quyết dựa trên lịch sử giao dịch và thỏa thuận ban đầu của hợp đồng.</li>
                        </ul>
                    </div>
                </div>

                <div class="profile-card-modern animate-in" style="padding: 30px;">
                    <h2 style="font-size: 20px; font-weight: 800; color: #0ea5e9; margin: 0 0 16px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; display: flex; align-items: center; gap: 8px;"><i data-lucide="lock" style="width:20px;height:20px;"></i> Chính sách bảo mật</h2>
                    <div style="font-size: 14px; line-height: 1.8; color: var(--text-secondary);">
                        <p>J4S cam kết bảo vệ thông tin riêng tư của các thành viên tham gia nền tảng:</p>
                        <h4 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-top: 16px; margin-bottom: 8px;">1. Thu thập thông tin</h4>
                        <ul style="padding-left: 20px;">
                            <li>Chúng tôi thu thập các thông tin cá nhân cần thiết bao gồm: Họ tên, Email, Số điện thoại, Thông tin học vấn (đối với sinh viên) và Thông tin công ty (đối với doanh nghiệp).</li>
                            <li>Hình ảnh chân dung, ảnh bìa và tệp CV tải lên được sử dụng cho mục đích hiển thị hồ sơ cá nhân của bạn.</li>
                        </ul>
                        <h4 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-top: 16px; margin-bottom: 8px;">2. Sử dụng thông tin</h4>
                        <ul style="padding-left: 20px;">
                            <li>Thông tin liên hệ (Email, Số điện thoại) được sử dụng để thông báo trạng thái dự án, giao dịch ví, hoặc các cập nhật quan trọng từ nền tảng.</li>
                            <li>Hồ sơ năng lực, kỹ năng và CV của sinh viên sẽ được hiển thị công khai cho các nhà tuyển dụng tìm kiếm nhân sự phù hợp.</li>
                        </ul>
                        <h4 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-top: 16px; margin-bottom: 8px;">3. Bảo mật dữ liệu</h4>
                        <ul style="padding-left: 20px;">
                            <li>Mật khẩu của bạn được mã hóa một chiều bằng thuật toán băm bảo mật cao trước khi lưu trữ trong cơ sở dữ liệu.</li>
                            <li>Chúng tôi không chia sẻ, bán hay tiết lộ dữ liệu cá nhân của thành viên cho bên thứ ba vì bất kỳ mục đích thương mại nào.</li>
                        </ul>
                    </div>
                </div>
            </div>`;
        
        if (window.lucide) lucide.createIcons();
    }

    // ============================================
    // BANNER BUTTONS
    // ============================================
    function bindBannerButtons() {
        document.getElementById('btnFindJobNow')?.addEventListener('click', () => {
            setActiveSidebar('find');
            currentSidebarMode = 'find';
            restoreHomeView();
            renderJobs(allJobs);
            searchInput.focus();
        });
        document.getElementById('btnPostJobBanner')?.addEventListener('click', () => openPostJobModal());
    }

    // ============================================
    // VIEW MORE BUTTON
    // ============================================
    function bindViewMoreBtn() {
        const btn = document.getElementById('btnViewMore');
        if (!btn) return;
        btn.addEventListener('click', () => {
            showToast('📋 Đã hiển thị tất cả việc làm hiện có!', 'info');
            btn.textContent = 'Đã hiển thị tất cả';
            btn.disabled = true;
            btn.style.opacity = '0.5';
        });
    }

    // ============================================
    // VIEW PROFILE BUTTONS (Right sidebar)
    // ============================================
    function bindViewProfileButtons() {
        document.querySelectorAll('.btn-view-profile').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', function () {
                const item = this.closest('.freelancer-item');
                if (!item) return;
                const name = item.querySelector('.freelancer-name')?.textContent || '';
                const skill = item.querySelector('.freelancer-role')?.textContent || '';
                const avatarEl = item.querySelector('.freelancer-avatar img');
                const avatar = avatarEl ? avatarEl.src : '';
                const ratingText = item.querySelector('.freelancer-rating')?.textContent || '';
                const ratingMatch = ratingText.match(/([\d.]+)\s*\((\d+)\)/);
                const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 5.0;
                const reviews = ratingMatch ? parseInt(ratingMatch[2]) : 0;
                const matchText = item.querySelector('.match-badge')?.textContent || '';

                openFreelancerProfileModal({ name, skill, avatar, rating, reviews, matchPercentage: matchText, color: '#6366F1' });
            });
        });
    }

    // ============================================
    // POST JOB MODAL
    // ============================================
    function bindPostJobButtons() {
        document.getElementById('btnPostJob')?.addEventListener('click', () => openPostJobModal());
    }

    function openPostJobModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close"><i data-lucide="x" style="width:20px;height:20px;"></i></button>
                <div class="modal-header"><h2>📝 Đăng việc mới</h2></div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Tiêu đề công việc</label>
                        <input type="text" class="form-input" id="postJobTitle" placeholder="VD: Thiết kế poster sự kiện..." />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Mô tả chi tiết</label>
                        <textarea class="form-textarea" id="postJobDesc" rows="3" placeholder="Mô tả yêu cầu công việc..."></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Danh mục</label>
                            <select class="form-select" id="postJobCategory">
                                <option>Thiết kế</option><option>Làm slide</option><option>Dịch thuật</option>
                                <option>Viết content</option><option>Code web</option><option>Edit video</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Ngân sách (VNĐ)</label>
                            <input type="number" class="form-input" id="postJobBudget" placeholder="150000" />
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Thời hạn</label>
                        <input type="date" class="form-input" id="postJobDeadline" />
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-apply-job" id="btnSubmitJob"><i data-lucide="send" style="width:16px;height:16px;"></i> Đăng việc</button>
                    <button class="btn-modal-cancel">Hủy</button>
                </div>
            </div>`;

        document.body.appendChild(modal);
        if (window.lucide) lucide.createIcons();
        requestAnimationFrame(() => modal.classList.add('active'));

        modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
        modal.querySelector('.btn-modal-cancel').addEventListener('click', () => closeModal(modal));
        modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal); });

        modal.querySelector('#btnSubmitJob').addEventListener('click', () => {
            const title = modal.querySelector('#postJobTitle').value.trim();
            if (!title) { showToast('Vui lòng nhập tiêu đề công việc.', 'warning'); return; }
            closeModal(modal);
            showToast('✅ Đã đăng việc "' + title + '" thành công!', 'success');
        });
    }

    // ============================================
    // FIND FREELANCER BUTTON
    // ============================================
    function bindFindFreelancerBtn() {
        document.getElementById('btnFindFreelancer')?.addEventListener('click', () => {
            setActiveSidebar('topFreelancer');
            currentSidebarMode = 'topFreelancer';
            renderFeaturedFreelancersView();
        });
    }

    // ============================================
    // TOAST NOTIFICATIONS
    // ============================================
    function showToast(message, type = 'info') {
        document.querySelectorAll('.toast-notification').forEach(t => t.remove());
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        const icons = { success: 'check-circle', error: 'alert-circle', info: 'info', warning: 'alert-triangle' };
        toast.innerHTML = `<i data-lucide="${icons[type] || 'info'}" style="width:18px;height:18px;"></i><span>${message}</span>`;
        document.body.appendChild(toast);
        if (window.lucide) lucide.createIcons();
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3500);
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    function formatVND(amount) {
        return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // --- Kick off ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
