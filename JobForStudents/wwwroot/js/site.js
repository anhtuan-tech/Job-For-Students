// ============================================
// J4S Dashboard — Complete Interactive Frontend
// ALL features with mock data
// ============================================

(function () {
    'use strict';

    // --- State ---
    let allJobs = [];
    let currentRenderedJobs = [];
    let currentFilter = 'all';
    let currentSidebarMode = 'home';
    let originalMainHTML = '';
    let originalBannerHTML = '';
    let originalCategoriesHTML = '';
    let pendingChatUserId = null;

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

        const isBusiness = isBusinessAccount();
        if (isBusiness) {
            setupBusinessDashboardShell();
        }

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
        updateNotificationBadge();

        if (isBusiness) {
            bindBusinessSidebarNav();
            renderBusinessEmployerHome();
        }
    }

    function setupBusinessDashboardShell() {
        document.body.classList.add('business-dashboard-shell');

        const brandIcon = document.querySelector('.j4s-logo-box i');
        if (brandIcon) brandIcon.setAttribute('data-lucide', 'briefcase-business');

        if (searchInput) {
            searchInput.placeholder = 'Tìm hồ sơ ứng viên, bài đăng, kỹ năng...';
        }

        document.getElementById('btnFindFreelancer')?.remove();

        const navRight = document.querySelector('.nav-right');
        const userProfile = document.getElementById('userProfile');
        const userId = userProfile?.dataset.userId;
        if (navRight && userProfile && !document.getElementById('btnBusinessPublicJobs')) {
            const publicJobsBtn = document.createElement('a');
            publicJobsBtn.id = 'btnBusinessPublicJobs';
            publicJobsBtn.className = 'business-public-jobs-btn';
            publicJobsBtn.href = userId ? `/business/${userId}/jobs` : '#';
            publicJobsBtn.innerHTML = '<i data-lucide="external-link" style="width:16px;height:16px;"></i><span>Xem trang việc làm</span>';
            navRight.insertBefore(publicJobsBtn, userProfile.closest('.dropdown'));
        }

        const roleLabel = document.querySelector('#userProfile .user-role');
        if (roleLabel) roleLabel.textContent = 'Nhà tuyển dụng';

        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.innerHTML = `
                <div class="sidebar-group">
                    <div class="sidebar-label">NHÀ TUYỂN DỤNG</div>
                    <a href="#" class="sidebar-item active" data-nav="home" id="navHome">
                        <span class="item-icon"><i data-lucide="home" style="width:18px;height:18px;"></i></span>
                        Trang chủ
                    </a>
                    <a href="#" class="sidebar-item" data-nav="businessJobs" id="navBusinessJobs">
                        <span class="item-icon"><i data-lucide="file-text" style="width:18px;height:18px;"></i></span>
                        Quản lý tin đăng
                    </a>
                    <a href="#" class="sidebar-item" data-nav="candidateSearch" id="navCandidateSearch">
                        <span class="item-icon"><i data-lucide="users" style="width:18px;height:18px;"></i></span>
                        Ứng viên
                    </a>
                    <a href="#" class="sidebar-item has-chevron" data-nav="servicePackages" id="navServicePackages">
                        <span class="item-icon"><i data-lucide="credit-card" style="width:18px;height:18px;"></i></span>
                        Gói dịch vụ & Thanh toán
                        <i data-lucide="chevron-right" class="sidebar-chevron" style="width:15px;height:15px;"></i>
                    </a>
                    <a href="#" class="sidebar-item" data-nav="notifications" id="navNotifications">
                        <span class="item-icon"><i data-lucide="bell" style="width:18px;height:18px;"></i></span>
                        Thông báo
                    </a>
                </div>
                <div class="sidebar-group">
                    <div class="sidebar-label">HỖ TRỢ</div>
                    <a href="#" class="sidebar-item" data-nav="support" id="navSupport">
                        <span class="item-icon"><i data-lucide="circle-help" style="width:18px;height:18px;"></i></span>
                        Trung tâm hỗ trợ
                    </a>
                    <a href="#" class="sidebar-item" data-nav="feedback" id="navFeedback">
                        <span class="item-icon"><i data-lucide="bug" style="width:18px;height:18px;"></i></span>
                        Phản hồi & Báo lỗi
                    </a>
                </div>
                <div class="sidebar-bottom">
                    <button class="btn-post-job" id="btnPostJob">
                        <i data-lucide="plus" style="width:18px;height:18px;"></i>
                        Đăng tin tuyển dụng
                    </button>
                </div>`;
        }

        if (window.lucide) lucide.createIcons();
    }

    function bindBusinessSidebarNav() {
        document.querySelectorAll('.business-dashboard-shell .sidebar-item[data-nav]').forEach(item => {
            item.addEventListener('click', e => {
                e.preventDefault();
                const nav = item.dataset.nav;
                setActiveSidebar(nav);
                currentSidebarMode = nav;
                if (searchInput) searchInput.value = '';

                switch (nav) {
                    case 'home':
                        renderBusinessEmployerHome();
                        break;
                    case 'businessJobs':
                        renderBusinessJobsManagement();
                        break;
                    case 'candidateSearch':
                        renderCandidateSearchView();
                        break;
                    case 'servicePackages':
                        renderServicePackagesView();
                        break;
                    case 'notifications':
                        renderBusinessNotificationsView();
                        break;
                    case 'support':
                        renderBusinessSupportView();
                        break;
                    case 'feedback':
                        renderBusinessFeedbackView();
                        break;
                    default:
                        renderBusinessEmployerHome();
                        break;
                }
            });
        });
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

            if (isBusinessAccount()) {
                searchTimeout = setTimeout(() => {
                    setActiveSidebar('candidateSearch');
                    currentSidebarMode = 'candidateSearch';
                    renderCandidateSearchView();
                    const candidateKeyword = document.getElementById('candidateKeyword');
                    if (candidateKeyword) {
                        candidateKeyword.value = term;
                        loadCandidateProfiles();
                    }
                }, 300);
                return;
            }

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
                        if (document.querySelector('.dashboard-layout')?.classList.contains('layout-business')) {
                            renderBusinessJobsView();
                        } else {
                            renderProjectsView();
                        }
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
                    case 'wallet-current':
                        if (typeof window.renderBusinessWalletCurrent === 'function') {
                            window.renderBusinessWalletCurrent();
                        } else {
                            restoreHomeView();
                            renderJobs(allJobs);
                        }
                        break;
                    case 'wallet-deposit':
                        if (typeof window.renderBusinessWalletDeposit === 'function') {
                            window.renderBusinessWalletDeposit();
                        } else {
                            restoreHomeView();
                            renderJobs(allJobs);
                        }
                        break;
                    case 'wallet-history':
                        if (typeof window.renderBusinessWalletHistory === 'function') {
                            window.renderBusinessWalletHistory();
                        } else {
                            restoreHomeView();
                            renderJobs(allJobs);
                        }
                        break;
                    case 'businessJobs':
                        renderBusinessJobsManagement();
                        break;
                    case 'servicePackages':
                        renderServicePackagesView();
                        break;
                    case 'candidateSearch':
                        renderCandidateSearchView();
                        break;
                    case 'topFreelancer':
                        if (document.querySelector('.dashboard-layout')?.classList.contains('layout-business')) {
                            renderBusinessApplicantsView();
                        } else {
                            renderFeaturedFreelancersView();
                        }
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
        const currentSidebarItems = document.querySelectorAll('.sidebar-item[data-nav]');
        currentSidebarItems.forEach(i => {
            i.classList.remove('active');
            i.removeAttribute('aria-current');
        });

        if (!nav) return;

        const target = document.querySelector(`.sidebar-item[data-nav="${nav}"]`);
        if (target) {
            target.classList.add('active');
            target.setAttribute('aria-current', 'page');
        }
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

    function renderBusinessJobsManagement() {
        mainContent.innerHTML = `
            <div class="page-header animate-in">
                <h1 class="page-title"><i data-lucide="briefcase-business" style="width:24px;height:24px;"></i> Quản lý tin đăng</h1>
                <p class="page-subtitle">Theo dõi trạng thái duyệt, chỉnh sửa, gia hạn, tạm dừng, đóng tin và xem ứng viên từng tin.</p>
                <button class="btn-modern-primary" id="btnCreateManagedJob" style="margin-top:14px;">
                    <i data-lucide="plus-circle" style="width:16px;height:16px;"></i> Đăng tin mới
                </button>
            </div>
            <div id="businessJobStatsPanel" class="business-job-stats-panel"></div>
            <div id="newApplicantsPanel" class="new-applicants-panel"></div>
            <div id="businessJobsPanel" class="business-jobs-panel">
                <div style="display:flex;align-items:center;justify-content:center;min-height:220px;color:var(--text-secondary);font-weight:600;">
                    <span class="spinner-border spinner-border-sm" style="margin-right:8px;"></span> Đang tải tin tuyển dụng...
                </div>
            </div>`;
        if (window.lucide) lucide.createIcons();
        document.getElementById('btnCreateManagedJob')?.addEventListener('click', () => openPostJobModal());
        loadBusinessJobs();
        loadNewBusinessApplicants();
    }

    function loadBusinessJobs() {
        fetch('/Home/GetBusinessJobPosts')
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    showToast(data.message || 'Không thể tải tin đăng.', 'error');
                    return;
                }
                renderBusinessJobsList(data.jobs || [], data.summary || {});
            })
            .catch(err => {
                console.error(err);
                showToast('Không thể kết nối đến máy chủ.', 'error');
            });
    }

    function renderBusinessJobsList(jobs, summary = {}) {
        const panel = document.getElementById('businessJobsPanel');
        if (!panel) return;
        renderBusinessJobStats(jobs, summary);

        if (!jobs.length) {
            panel.innerHTML = `
                <div class="profile-card-modern animate-in" style="padding:34px;text-align:center;">
                    <i data-lucide="briefcase" style="width:34px;height:34px;color:var(--primary);"></i>
                    <h3 style="margin:12px 0 6px;">Chưa có tin tuyển dụng</h3>
                    <p style="color:var(--text-muted);margin:0 0 16px;">Tạo tin đầu tiên để bắt đầu nhận ứng viên.</p>
                    <button class="btn-modern-primary" id="btnEmptyCreateJob">Đăng tin mới</button>
                </div>`;
            if (window.lucide) lucide.createIcons();
            document.getElementById('btnEmptyCreateJob')?.addEventListener('click', () => openPostJobModal());
            return;
        }

        panel.innerHTML = `
            <div class="managed-job-list">
                ${jobs.map(job => `
                    <article class="managed-job-card animate-in" data-job-id="${job.id}">
                        <div class="managed-job-main">
                            <div class="managed-job-topline">
                                <span class="managed-status status-${escapeHtml(job.status.toLowerCase())}">${escapeHtml(job.statusText)}</span>
                                <span><i data-lucide="calendar" style="width:13px;height:13px;"></i> Hạn: ${escapeHtml(job.deadlineText)}</span>
                                <span><i data-lucide="users" style="width:13px;height:13px;"></i> ${job.applicantsCount} ứng viên</span>
                            </div>
                            <h3>${escapeHtml(job.title)}</h3>
                            <p>${escapeHtml(job.description)}</p>
                            <div class="job-tags">
                                ${(job.skills || []).map(skill => `<span class="job-tag">${escapeHtml(skill)}</span>`).join('')}
                            </div>
                        </div>
                        <div class="managed-job-side">
                            <strong>${formatVND(job.budget)}</strong>
                            <span>${escapeHtml(job.location || 'Linh hoạt')}</span>
                            <span>${job.quantity} vị trí</span>
                        </div>
                        <div class="managed-job-actions">
                            <button class="btn-sm btn-primary" data-action="edit">Chỉnh sửa</button>
                            <button class="btn-sm btn-outline" data-action="extend">Gia hạn</button>
                            <button class="btn-sm btn-outline" data-action="${job.status === 'Paused' || job.status === 'Draft' ? 'open' : 'pause'}">${job.status === 'Draft' ? 'Đăng ngay' : (job.status === 'Paused' ? 'Mở lại' : 'Tạm dừng')}</button>
                            <button class="btn-sm btn-outline" data-action="close">Đóng tin</button>
                            <button class="btn-sm btn-outline" data-action="applicants">Xem ứng viên</button>
                            <button class="btn-sm btn-ghost" data-action="delete" style="color:var(--danger);">Xóa</button>
                        </div>
                    </article>
                `).join('')}
            </div>`;
        if (window.lucide) lucide.createIcons();
        bindManagedJobActions(jobs);
    }

    function renderBusinessJobStats(jobs, summary = {}) {
        const panel = document.getElementById('businessJobStatsPanel');
        if (!panel) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const activeJobs = jobs.filter(job => job.status === 'Open');
        const expiringJobs = activeJobs.filter(job => {
            if (!job.deadline) return false;
            const deadline = new Date(`${job.deadline}T00:00:00`);
            const daysLeft = Math.ceil((deadline - today) / 86400000);
            return daysLeft >= 0 && daysLeft <= 3;
        });

        panel.innerHTML = `
            <section class="business-job-overview animate-in">
                <div class="overview-stat">
                    <span>Tổng số tin đang hoạt động</span>
                    <strong>${activeJobs.length}</strong>
                </div>
                <div class="overview-stat warning">
                    <span>Số tin sắp hết hạn</span>
                    <strong>${expiringJobs.length}</strong>
                </div>
                <div class="overview-stat">
                    <span>Tổng số ứng viên đã ứng tuyển</span>
                    <strong>${summary.totalApplicants ?? 0}</strong>
                </div>
                <div class="overview-stat">
                    <span>Tổng hồ sơ nhận được</span>
                    <strong>${summary.totalReceivedProfiles ?? 0}</strong>
                </div>
                <div class="overview-details">
                    <h3>Tin đăng hiển thị</h3>
                    ${activeJobs.length ? activeJobs.slice(0, 4).map(job => `
                        <button class="overview-job-row" data-job-id="${job.id}">
                            <span>${escapeHtml(job.title)}</span>
                            <small>${escapeHtml(job.deadlineText)} · ${job.applicantsCount} ứng viên</small>
                        </button>
                    `).join('') : '<p>Chưa có tin đang hoạt động.</p>'}
                </div>
            </section>`;

        panel.querySelectorAll('.overview-job-row').forEach(btn => {
            btn.addEventListener('click', () => openJobApplicantsModal(Number(btn.dataset.jobId)));
        });
    }

    function renderBusinessEmployerHome() {
        if (!mainContent) return;

        const userProfile = document.getElementById('userProfile');
        const userName = document.querySelector('#userProfile .user-name')?.textContent?.trim() || 'Huỳnh Khang';

        mainContent.innerHTML = `
            <section class="business-welcome-card animate-in">
                <div class="business-welcome-copy">
                    <span>CHÀO MỪNG TRỞ LẠI,</span>
                    <h1>${escapeHtml(userName)} <span aria-hidden="true">👋</span></h1>
                    <p>Quản lý tuyển dụng hiệu quả – Tìm đúng người, đúng vị trí</p>
                    <div class="business-welcome-actions">
                        <button class="btn-business-primary" id="btnBusinessPostJob">
                            <i data-lucide="plus" style="width:16px;height:16px;"></i>
                            Đăng tin tuyển dụng
                        </button>
                        <button class="btn-business-outline" id="btnBusinessFindCandidates">
                            <i data-lucide="search" style="width:16px;height:16px;"></i>
                            Tìm hồ sơ ứng viên
                        </button>
                    </div>
                </div>
                <div class="business-welcome-illustration" aria-hidden="true">
                    <div class="illustration-card main">
                        <div class="illustration-person">
                            <div class="person-head"></div>
                            <div class="person-body"></div>
                            <div class="person-laptop"></div>
                        </div>
                    </div>
                    <div class="floating-candidate candidate-a"><span>HK</span><i data-lucide="star"></i></div>
                    <div class="floating-candidate candidate-b"><span>AN</span><i data-lucide="star"></i></div>
                    <div class="floating-candidate candidate-c"><span>QA</span><i data-lucide="star"></i></div>
                </div>
            </section>

            <section class="business-stat-grid" id="businessHomeStats">
                <article class="business-stat-card">
                    <div class="stat-icon danger"><i data-lucide="file-text"></i></div>
                    <div><strong>--</strong><span>Tin đang hiển thị</span><small class="danger">Đang tải...</small></div>
                </article>
                <article class="business-stat-card">
                    <div class="stat-icon success"><i data-lucide="user-plus"></i></div>
                    <div><strong>--</strong><span>Ứng viên mới</span><small class="success">Trong 7 ngày qua</small></div>
                </article>
                <article class="business-stat-card">
                    <div class="stat-icon neutral"><i data-lucide="users"></i></div>
                    <div><strong>--</strong><span>Tổng số ứng viên</span><small>Tất cả tin đăng</small></div>
                </article>
            </section>

            <section class="latest-candidates-card animate-in">
                <div class="business-section-heading">
                    <h2>Ứng viên mới nhất</h2>
                    <button class="text-link-button" id="btnViewAllCandidates">Xem tất cả <i data-lucide="chevron-right" style="width:15px;height:15px;"></i></button>
                </div>
                <div id="businessLatestCandidates" class="latest-candidate-list">
                    <div class="business-loading-row"><span class="spinner-border spinner-border-sm"></span> Đang tải ứng viên...</div>
                </div>
            </section>`;

        renderBusinessRightSidebarLoading();
        bindBusinessHomeActions();
        loadBusinessHomeData();
        if (window.lucide) lucide.createIcons();
    }

    function bindBusinessHomeActions() {
        document.getElementById('btnBusinessPostJob')?.addEventListener('click', () => openPostJobModal());
        document.getElementById('btnBusinessFindCandidates')?.addEventListener('click', () => {
            setActiveSidebar('candidateSearch');
            currentSidebarMode = 'candidateSearch';
            renderCandidateSearchView();
        });
        document.getElementById('btnViewAllCandidates')?.addEventListener('click', () => {
            setActiveSidebar('candidateSearch');
            currentSidebarMode = 'candidateSearch';
            renderCandidateSearchView();
        });
    }

    function loadBusinessHomeData() {
        Promise.all([
            fetch('/Home/GetBusinessJobPosts').then(r => r.json()),
            fetch('/Home/GetNewBusinessApplicants').then(r => r.json()),
            fetch('/Home/GetBusinessServicePackage').then(r => r.json())
        ])
            .then(([jobsData, applicantsData, packageData]) => {
                if (!jobsData.success) {
                    showToast(jobsData.message || 'Không thể tải dữ liệu tin đăng.', 'error');
                    return;
                }

                const jobs = jobsData.jobs || [];
                const applicants = applicantsData.success ? (applicantsData.applicants || []) : [];
                const pkg = packageData.success ? packageData : null;
                renderBusinessHomeStats(jobs, jobsData.summary || {}, applicantsData.success ? applicantsData.totalNewApplicants || 0 : 0);
                renderBusinessLatestCandidates(applicants);
                renderBusinessRightSidebar(jobs, applicants, pkg);
            })
            .catch(err => {
                console.error(err);
                showToast('Không thể kết nối đến máy chủ.', 'error');
            });
    }

    function renderBusinessHomeStats(jobs, summary, newApplicantsCount) {
        const panel = document.getElementById('businessHomeStats');
        if (!panel) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const activeJobs = jobs.filter(job => job.status === 'Open');
        const expiringJobs = activeJobs.filter(job => {
            if (!job.deadline) return false;
            const deadline = new Date(`${job.deadline}T00:00:00`);
            const daysLeft = Math.ceil((deadline - today) / 86400000);
            return daysLeft >= 0 && daysLeft <= 3;
        });

        panel.innerHTML = `
            <article class="business-stat-card">
                <div class="stat-icon danger"><i data-lucide="file-text"></i></div>
                <div><strong>${activeJobs.length}</strong><span>Tin đang hiển thị</span><small class="danger">${expiringJobs.length} tin sắp hết hạn</small></div>
            </article>
            <article class="business-stat-card">
                <div class="stat-icon success"><i data-lucide="user-plus"></i></div>
                <div><strong>${newApplicantsCount}</strong><span>Ứng viên mới</span><small class="success">Trong 7 ngày qua</small></div>
            </article>
            <article class="business-stat-card">
                <div class="stat-icon neutral"><i data-lucide="users"></i></div>
                <div><strong>${summary.totalApplicants ?? 0}</strong><span>Tổng số ứng viên</span><small>Tất cả tin đăng</small></div>
            </article>`;

        if (window.lucide) lucide.createIcons();
    }

    function renderBusinessLatestCandidates(applicants) {
        const panel = document.getElementById('businessLatestCandidates');
        if (!panel) return;

        if (!applicants.length) {
            panel.innerHTML = '<div class="business-empty-row">Chưa có ứng viên mới trong 7 ngày.</div>';
            return;
        }

        panel.innerHTML = applicants.slice(0, 4).map((app, index) => `
            <article class="latest-candidate-row">
                <div class="latest-candidate-avatar">
                    ${app.avatarUrl ? `<img src="${escapeHtml(app.avatarUrl)}" alt="${escapeHtml(app.name)}" />` : `<span>${getInitials(app.name)}</span>`}
                </div>
                <div class="latest-candidate-main">
                    <div class="latest-candidate-title">
                        <strong>${escapeHtml(app.name)}</strong>
                        <span class="match-pill medium">Phù hợp trung bình</span>
                    </div>
                    <p>Ứng tuyển ${escapeHtml(app.jobTitle)} · ${escapeHtml(app.proposal || 'Đã gửi hồ sơ ứng tuyển')}</p>
                    <small>${escapeHtml(app.appliedAgo || app.appliedAt || `${index + 5} phút trước`)}</small>
                </div>
                <button class="btn-business-outline sm" data-student-id="${app.studentId}">Xem hồ sơ</button>
            </article>
        `).join('');

        panel.querySelectorAll('button[data-student-id]').forEach(btn => {
            btn.addEventListener('click', () => openCandidateProfileModal(Number(btn.dataset.studentId)));
        });
    }

    function renderBusinessRightSidebarLoading() {
        const rightSidebar = document.getElementById('rightSidebar');
        if (!rightSidebar) return;
        rightSidebar.innerHTML = `
            <div class="business-side-card">
                <div class="business-loading-row"><span class="spinner-border spinner-border-sm"></span> Đang tải dữ liệu...</div>
            </div>`;
    }

    function renderBusinessRightSidebar(jobs, applicants, packageData) {
        const rightSidebar = document.getElementById('rightSidebar');
        if (!rightSidebar) return;

        const activeJobs = jobs.filter(job => job.status === 'Open');
        const recentJobs = activeJobs.slice(0, 3);
        const newApplicantsByJob = applicants.reduce((acc, app) => {
            acc[app.jobId] = (acc[app.jobId] || 0) + 1;
            return acc;
        }, {});
        const current = packageData?.currentPackage;
        const planLimit = current?.jobPostLimit || ((current?.remainingJobPosts || 0) + activeJobs.length) || 1;
        const usedPosts = Math.max(0, planLimit - (current?.remainingJobPosts ?? 0));
        const progress = Math.max(0, Math.min(100, Math.round((usedPosts / Math.max(1, planLimit)) * 100)));

        rightSidebar.innerHTML = `
            <section class="business-side-card">
                <div class="business-side-heading">
                    <h3>Tin đăng gần đây</h3>
                    <button class="text-link-button" id="btnAllRecentJobs">Xem tất cả</button>
                </div>
                <div class="recent-job-list">
                    ${recentJobs.length ? recentJobs.map(job => `
                        <article class="recent-job-item">
                            <div class="recent-job-icon"><i data-lucide="file-text"></i></div>
                            <div>
                                <strong>${escapeHtml(job.title)}</strong>
                                <p><span><i data-lucide="eye"></i> 0</span><span><i data-lucide="user"></i> ${job.applicantsCount}</span><span>${newApplicantsByJob[job.id] || 0} mới</span></p>
                                <span class="job-warning-badge">Sắp hết hạn</span>
                            </div>
                        </article>
                    `).join('') : '<div class="business-empty-row">Chưa có tin đang hiển thị.</div>'}
                </div>
                <button class="btn-business-outline full" id="btnManageRecentJobs">Quản lý tin đăng</button>
            </section>

            <section class="business-side-card">
                <span class="side-eyebrow">GÓI DỊCH VỤ HIỆN TẠI</span>
                <div class="current-plan-head">
                    <div class="plan-star"><i data-lucide="star"></i></div>
                    <div>
                        <h3>${escapeHtml(current?.planName || 'Chưa có gói')}</h3>
                        <span class="active-plan-badge">Đang hoạt động</span>
                    </div>
                </div>
                <p class="plan-expiry">Hiệu lực đến: <strong>${escapeHtml(current?.endDate || '--')}</strong></p>
                <div class="plan-checklist">
                    ${(current?.benefits || ['Trang tuyển dụng công khai', 'Quản lý ứng viên', 'Thông báo tuyển dụng', 'Lịch sử thanh toán']).slice(0, 4).map(item => `
                        <span><i data-lucide="check"></i>${escapeHtml(item)}</span>
                    `).join('')}
                </div>
                <div class="plan-progress-row">
                    <span>Đã sử dụng ${usedPosts}/${planLimit} tin</span>
                    <div class="plan-progress"><div style="width:${progress}%"></div></div>
                </div>
            </section>`;

        document.getElementById('btnAllRecentJobs')?.addEventListener('click', () => {
            setActiveSidebar('businessJobs');
            currentSidebarMode = 'businessJobs';
            renderBusinessJobsManagement();
        });
        document.getElementById('btnManageRecentJobs')?.addEventListener('click', () => {
            setActiveSidebar('businessJobs');
            currentSidebarMode = 'businessJobs';
            renderBusinessJobsManagement();
        });

        if (window.lucide) lucide.createIcons();
    }

    function renderBusinessNotificationsView() {
        mainContent.innerHTML = `
            <div class="page-header animate-in">
                <h1 class="page-title"><i data-lucide="bell" style="width:24px;height:24px;"></i> Thông báo</h1>
                <p class="page-subtitle">Theo dõi ứng viên mới, thanh toán, tin sắp hết hạn và thông báo hệ thống.</p>
            </div>
            <div class="profile-card-modern" id="businessNotificationsPanel" style="padding:18px;">
                <div class="business-loading-row"><span class="spinner-border spinner-border-sm"></span> Đang tải thông báo...</div>
            </div>`;

        fetch('/Home/GetNotifications')
            .then(res => res.json())
            .then(notifications => {
                const panel = document.getElementById('businessNotificationsPanel');
                if (!panel) return;
                const items = Array.isArray(notifications) ? notifications : [];
                panel.innerHTML = items.length ? items.map(n => `
                    <div class="notification-list-item ${n.unread ? 'unread' : ''}">
                        <div class="notification-icon">${escapeHtml(n.icon || '•')}</div>
                        <div>
                            <strong>${escapeHtml(n.title || '')}</strong>
                            <p>${escapeHtml(n.desc || '')}</p>
                            <small>${escapeHtml(n.time || '')}</small>
                        </div>
                    </div>
                `).join('') : '<div class="business-empty-row">Chưa có thông báo.</div>';
            })
            .catch(err => {
                console.error(err);
                showToast('Không thể tải thông báo.', 'error');
            });
        if (window.lucide) lucide.createIcons();
    }

    function renderBusinessSupportView() {
        mainContent.innerHTML = `
            <div class="page-header animate-in">
                <h1 class="page-title"><i data-lucide="circle-help" style="width:24px;height:24px;"></i> Trung tâm hỗ trợ</h1>
                <p class="page-subtitle">Các kênh hỗ trợ dành cho nhà tuyển dụng.</p>
            </div>
            <div class="support-card-grid">
                <article class="business-side-card"><h3>Hướng dẫn đăng tin</h3><p>Tạo tin rõ tiêu đề, kỹ năng, mức lương và deadline để ứng viên dễ ứng tuyển.</p></article>
                <article class="business-side-card"><h3>Quản lý ứng viên</h3><p>Dùng danh sách ứng viên mới, xem hồ sơ và liên hệ qua box chat.</p></article>
                <article class="business-side-card"><h3>Thanh toán</h3><p>Kiểm tra gói dịch vụ, lượt đăng còn lại và lịch sử thanh toán.</p></article>
            </div>`;
        if (window.lucide) lucide.createIcons();
    }

    function renderBusinessFeedbackView() {
        mainContent.innerHTML = `
            <div class="page-header animate-in">
                <h1 class="page-title"><i data-lucide="bug" style="width:24px;height:24px;"></i> Phản hồi & Báo lỗi</h1>
                <p class="page-subtitle">Gửi ghi chú để team xử lý trong các bản cập nhật tiếp theo.</p>
            </div>
            <div class="profile-card-modern" style="padding:20px;">
                <div class="form-group">
                    <label class="form-label">Nội dung phản hồi</label>
                    <textarea class="form-textarea" rows="5" id="businessFeedbackText" placeholder="Mô tả lỗi hoặc góp ý của bạn..."></textarea>
                </div>
                <button class="btn-business-primary" id="btnSubmitBusinessFeedback">Gửi phản hồi</button>
            </div>`;
        document.getElementById('btnSubmitBusinessFeedback')?.addEventListener('click', () => {
            const text = document.getElementById('businessFeedbackText')?.value.trim();
            if (!text) {
                showToast('Vui lòng nhập nội dung phản hồi.', 'warning');
                return;
            }
            showToast('Đã ghi nhận phản hồi của bạn.', 'success');
            document.getElementById('businessFeedbackText').value = '';
        });
        if (window.lucide) lucide.createIcons();
    }


    function bindManagedJobActions(jobs) {
        document.querySelectorAll('.managed-job-card').forEach(card => {
            const jobId = Number(card.dataset.jobId);
            const job = jobs.find(j => j.id === jobId);
            card.querySelectorAll('button[data-action]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    if (action === 'edit') openPostJobModal(job);
                    if (action === 'extend') extendBusinessJob(jobId);
                    if (action === 'pause') changeBusinessJobStatus(jobId, 'Paused');
                    if (action === 'open') changeBusinessJobStatus(jobId, 'Open');
                    if (action === 'close') changeBusinessJobStatus(jobId, 'Closed');
                    if (action === 'delete') deleteBusinessJob(jobId);
                    if (action === 'applicants') openJobApplicantsModal(jobId);
                });
            });
        });
    }

    function postJson(url, body) {
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }).then(res => res.json());
    }

    function changeBusinessJobStatus(jobId, status) {
        postJson('/Home/ChangeBusinessJobStatus', { jobId, status })
            .then(data => {
                showToast(data.message || 'Đã cập nhật trạng thái tin.', data.success ? 'success' : 'error');
                if (data.success) loadBusinessJobs();
            })
            .catch(err => {
                console.error(err);
                showToast('Không thể cập nhật trạng thái tin.', 'error');
            });
    }

    function extendBusinessJob(jobId) {
        const days = Number(window.prompt('Gia hạn thêm bao nhiêu ngày?', '7'));
        if (!Number.isFinite(days) || days <= 0) return;
        postJson('/Home/ExtendBusinessJobPost', { jobId, days })
            .then(data => {
                showToast(data.message || 'Đã gia hạn tin.', data.success ? 'success' : 'error');
                if (data.success) loadBusinessJobs();
            })
            .catch(err => {
                console.error(err);
                showToast('Không thể gia hạn tin.', 'error');
            });
    }

    function deleteBusinessJob(jobId) {
        if (!window.confirm('Bạn chắc chắn muốn xóa tin tuyển dụng này?')) return;
        postJson('/Home/DeleteBusinessJobPost', { jobId })
            .then(data => {
                showToast(data.message || 'Đã xóa tin.', data.success ? 'success' : 'error');
                if (data.success) loadBusinessJobs();
            })
            .catch(err => {
                console.error(err);
                showToast('Không thể xóa tin.', 'error');
            });
    }

    function openJobApplicantsModal(jobId) {
        fetch(`/Home/GetJobApplicants?jobId=${jobId}`)
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    showToast(data.message || 'Không thể tải danh sách ứng viên.', 'error');
                    return;
                }

                const modal = document.createElement('div');
                modal.className = 'modal-overlay';
                modal.innerHTML = `
                    <div class="modal-content" style="max-width:760px;max-height:85vh;overflow-y:auto;">
                        <button class="modal-close"><i data-lucide="x" style="width:20px;height:20px;"></i></button>
                        <div class="modal-header"><h2>Ứng viên: ${escapeHtml(data.jobTitle)}</h2></div>
                        <div class="modal-body">
                            ${data.applicants.length ? data.applicants.map(app => `
                                <div class="applicant-card">
                                    <div class="applicant-avatar">
                                        ${app.avatarUrl ? `<img src="${escapeHtml(app.avatarUrl)}" alt="${escapeHtml(app.name)}" />` : `<span>${escapeHtml(app.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase())}</span>`}
                                    </div>
                                    <div class="applicant-info">
                                        <h3>${escapeHtml(app.name)}</h3>
                                        <p>${escapeHtml(app.proposal || 'Chưa có lời nhắn ứng tuyển.')}</p>
                                        <div class="applicant-meta">
                                            <span>${escapeHtml(app.email)}</span>
                                            <span>${escapeHtml(app.phone)}</span>
                                            <span>${formatVND(app.bidAmount)}</span>
                                            <span>${app.estimatedDays} ngày</span>
                                        </div>
                                        <div class="job-tags">${(app.skills || []).map(skill => `<span class="job-tag">${escapeHtml(skill)}</span>`).join('')}</div>
                                    </div>
                                </div>
                            `).join('') : `<div style="padding:28px;text-align:center;color:var(--text-muted);font-weight:600;">Chưa có ứng viên nào cho tin này.</div>`}
                        </div>
                        <div class="modal-footer"><button class="btn-modal-cancel">Đóng</button></div>
                    </div>`;
                document.body.appendChild(modal);
                if (window.lucide) lucide.createIcons();
                requestAnimationFrame(() => modal.classList.add('active'));
                modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
                modal.querySelector('.btn-modal-cancel').addEventListener('click', () => closeModal(modal));
                modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal); });
            })
            .catch(err => {
                console.error(err);
                showToast('Không thể kết nối đến máy chủ.', 'error');
            });
    }

    function loadNewBusinessApplicants() {
        const panel = document.getElementById('newApplicantsPanel');
        if (panel) {
            panel.innerHTML = `<div class="new-applicants-loading"><span class="spinner-border spinner-border-sm" style="margin-right:8px;"></span> Đang tải ứng viên mới...</div>`;
        }

        fetch('/Home/GetNewBusinessApplicants')
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    showToast(data.message || 'Không thể tải ứng viên mới.', 'error');
                    return;
                }
                renderNewBusinessApplicants(data.applicants || [], data.totalNewApplicants || 0);
            })
            .catch(err => {
                console.error(err);
                showToast('Không thể kết nối đến máy chủ.', 'error');
            });
    }

    function renderNewBusinessApplicants(applicants, totalNewApplicants) {
        const panel = document.getElementById('newApplicantsPanel');
        if (!panel) return;

        panel.innerHTML = `
            <section class="new-applicants-section animate-in">
                <div class="section-header">
                    <div>
                        <h2 class="section-title">Ứng viên mới</h2>
                        <p class="section-subtitle">${totalNewApplicants} ứng viên mới trong 7 ngày</p>
                    </div>
                </div>
                <div class="new-applicant-list">
                    ${applicants.length ? applicants.map(app => `
                        <article class="new-applicant-card" data-student-id="${app.studentId}">
                            <div class="applicant-avatar">
                                ${app.avatarUrl ? `<img src="${escapeHtml(app.avatarUrl)}" alt="${escapeHtml(app.name)}" />` : `<span>${getInitials(app.name)}</span>`}
                            </div>
                            <div class="new-applicant-main">
                                <h3>${escapeHtml(app.name)}</h3>
                                <p>${escapeHtml(app.jobTitle)} · ${escapeHtml(app.appliedAt)}</p>
                                <p>${escapeHtml(app.proposal || 'Ứng viên chưa gửi lời nhắn ứng tuyển.')}</p>
                                <div class="job-tags">${(app.skills || []).map(skill => `<span class="job-tag">${escapeHtml(skill)}</span>`).join('')}</div>
                            </div>
                            <div class="new-applicant-side">
                                <strong>${formatVND(app.bidAmount)}</strong>
                                <span>${app.estimatedDays} ngày</span>
                                <button class="btn-sm btn-primary" data-action="profile">Xem hồ sơ</button>
                                <button class="btn-sm btn-outline" data-action="contact">Liên hệ ứng viên</button>
                            </div>
                        </article>
                    `).join('') : '<div class="service-payment-empty">Chưa có ứng viên mới trong 7 ngày.</div>'}
                </div>
            </section>`;

        if (window.lucide) lucide.createIcons();
        panel.querySelectorAll('.new-applicant-card').forEach(card => {
            const studentId = Number(card.dataset.studentId);
            card.querySelector('[data-action="profile"]')?.addEventListener('click', () => openCandidateProfileModal(studentId));
            card.querySelector('[data-action="contact"]')?.addEventListener('click', () => contactCandidate(studentId));
        });
    }

    function contactCandidate(studentId) {
        postJson('/Home/StartCandidateChat', { studentId })
            .then(data => {
                if (!data.success) {
                    showToast(data.message || 'Không thể mở box chat.', 'error');
                    return;
                }
                pendingChatUserId = data.conversationUserId;
                setActiveSidebar('messages');
                currentSidebarMode = 'messages';
                renderMessagesView();
                showToast(data.message || 'Đã mở box chat với ứng viên.', 'success');
            })
            .catch(err => {
                console.error(err);
                showToast('Không thể kết nối đến máy chủ.', 'error');
            });
    }

    function renderServicePackagesView() {
        mainContent.innerHTML = `
            <div class="page-header animate-in">
                <h1 class="page-title"><i data-lucide="package-check" style="width:24px;height:24px;"></i> Gói dịch vụ</h1>
                <p class="page-subtitle">Xem gói đang sử dụng, nâng cấp, gia hạn và theo dõi lịch sử thanh toán.</p>
            </div>
            <div id="servicePackagesPanel">
                <div style="display:flex;align-items:center;justify-content:center;min-height:240px;color:var(--text-secondary);font-weight:600;">
                    <span class="spinner-border spinner-border-sm" style="margin-right:8px;"></span> Đang tải gói dịch vụ...
                </div>
            </div>`;
        if (window.lucide) lucide.createIcons();
        loadServicePackages();
    }

    function loadServicePackages() {
        Promise.all([
            fetch('/Home/GetBusinessServicePackage').then(r => r.json()),
            fetch('/Home/GetServicePlanPaymentHistory').then(r => r.json())
        ])
            .then(([pkg, history]) => {
                if (!pkg.success) {
                    showToast(pkg.message || 'Không thể tải gói dịch vụ.', 'error');
                    return;
                }
                renderServicePackagesData(pkg, history.success ? history.payments : []);
            })
            .catch(err => {
                console.error(err);
                showToast('Không thể kết nối đến máy chủ.', 'error');
            });
    }

    function renderServicePackagesData(data, payments) {
        const panel = document.getElementById('servicePackagesPanel');
        if (!panel) return;

        const current = data.currentPackage;
        const getPlanAction = (plan) => {
            const isCurrent = current?.planId === plan.id;
            const isLowerOrEqual = current && !isCurrent && (
                Number(plan.price) < Number(current.price ?? 0)
                || (Number(plan.price) === Number(current.price ?? 0) && Number(plan.jobPostLimit) <= Number(current.jobPostLimit ?? 0))
            );

            return {
                disabled: isCurrent || isLowerOrEqual,
                label: isCurrent
                    ? 'Đang dùng'
                    : isLowerOrEqual
                        ? 'Gói thấp hơn'
                        : (plan.price === 0 ? 'Kích hoạt' : 'Thanh toán / Nâng cấp')
            };
        };
        panel.innerHTML = `
            <section class="service-package-current animate-in">
                <div class="service-current-main">
                    <span class="service-eyebrow">Gói đang sử dụng</span>
                    <h2>${escapeHtml(current?.planName || 'Chưa có gói')}</h2>
                    <p>${escapeHtml(current?.description || 'Doanh nghiệp chưa có gói dịch vụ đang hoạt động.')}</p>
                    <div class="service-benefits">
                        ${(current?.benefits || []).map(b => `<span><i data-lucide="check" style="width:14px;height:14px;"></i>${escapeHtml(b)}</span>`).join('')}
                    </div>
                </div>
                <div class="service-current-stats">
                    <div><strong>${escapeHtml(current?.endDate || '--')}</strong><span>Ngày hết hạn</span></div>
                    <div><strong>${current?.remainingJobPosts ?? 0}</strong><span>Số lượng tin còn lại</span></div>
                    <div><strong>${current?.daysLeft ?? 0}</strong><span>Ngày còn lại</span></div>
                    <button class="btn-modern-primary" id="btnRenewCurrentPlan">Gia hạn gói</button>
                </div>
            </section>

            <section class="service-plan-section animate-in">
                <div class="section-header">
                    <h2 class="section-title">Danh sách các gói</h2>
                    <span style="color:var(--text-muted);font-weight:700;">Số dư ví: ${formatVND(data.balance)}</span>
                </div>
                <div class="service-plan-grid">
                    ${(data.plans || []).map(plan => `
                        <article class="service-plan-card ${current?.planId === plan.id ? 'active' : ''}">
                            <div>
                                <div class="service-plan-head">
                                    <h3>${escapeHtml(plan.name)}</h3>
                                    ${current?.planId === plan.id ? '<span>Đang dùng</span>' : ''}
                                </div>
                                <p>${escapeHtml(plan.description)}</p>
                                <strong>${formatVND(plan.price)}</strong>
                                <small>${plan.durationDays} ngày · ${plan.jobPostLimit} tin đăng</small>
                                <div class="service-benefits">
                                    ${(plan.benefits || []).map(b => `<span><i data-lucide="check" style="width:14px;height:14px;"></i>${escapeHtml(b)}</span>`).join('')}
                                </div>
                            </div>
                            <button class="btn-modern-primary" data-plan-id="${plan.id}" ${getPlanAction(plan).disabled ? 'disabled' : ''}>
                                ${getPlanAction(plan).label}
                            </button>
                        </article>
                    `).join('')}
                </div>
            </section>

            <section class="service-history-section animate-in">
                <div class="section-header">
                    <h2 class="section-title">Lịch sử thanh toán</h2>
                </div>
                <div class="service-payment-list">
                    ${payments.length ? payments.map(p => `
                        <div class="service-payment-item">
                            <div>
                                <strong>${escapeHtml(p.description)}</strong>
                                <span>${escapeHtml(p.code)} · ${escapeHtml(p.createdAt)}</span>
                            </div>
                            <div>
                                <strong>${formatVND(p.amount)}</strong>
                                <span>${escapeHtml(p.status)}</span>
                            </div>
                        </div>
                    `).join('') : '<div class="service-payment-empty">Chưa có lịch sử thanh toán gói dịch vụ.</div>'}
                </div>
            </section>`;

        if (window.lucide) lucide.createIcons();

        document.getElementById('btnRenewCurrentPlan')?.addEventListener('click', renewCurrentServicePlan);
        panel.querySelectorAll('button[data-plan-id]').forEach(btn => {
            btn.addEventListener('click', () => purchaseServicePlan(Number(btn.dataset.planId)));
        });
    }

    function purchaseServicePlan(planId) {
        if (!window.confirm('Xác nhận thanh toán/nâng cấp gói dịch vụ này bằng số dư ví?')) return;
        postJson('/Home/PurchaseServicePlan', { planId })
            .then(data => {
                showToast(data.message || 'Đã xử lý thanh toán gói dịch vụ.', data.success ? 'success' : 'error');
                if (data.success) loadServicePackages();
            })
            .catch(err => {
                console.error(err);
                showToast('Không thể thanh toán gói dịch vụ.', 'error');
            });
    }

    function renewCurrentServicePlan() {
        if (!window.confirm('Xác nhận gia hạn gói hiện tại bằng số dư ví?')) return;
        postJson('/Home/RenewServicePlan', { isAutoRenew: false })
            .then(data => {
                showToast(data.message || 'Đã gia hạn gói dịch vụ.', data.success ? 'success' : 'error');
                if (data.success) loadServicePackages();
            })
            .catch(err => {
                console.error(err);
                showToast('Không thể gia hạn gói dịch vụ.', 'error');
            });
    }

    // ============================================
    // RENDER: Dự án đang làm
    // ============================================
    function renderCandidateSearchView() {
        mainContent.innerHTML = `
            <div class="page-header animate-in">
                <h1 class="page-title"><i data-lucide="user-search" style="width:24px;height:24px;"></i> Tìm hồ sơ ứng viên</h1>
                <p class="page-subtitle">Tìm ứng viên theo từ khóa, kỹ năng, ngành nghề, mức lương mong muốn, kinh nghiệm và đánh giá.</p>
            </div>

            <section class="candidate-search-panel animate-in">
                <div class="candidate-filter-grid">
                    <div class="form-group">
                        <label class="form-label">Từ khóa</label>
                        <input type="text" class="form-input" id="candidateKeyword" placeholder="Tên, trường, mô tả, kỹ năng..." />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Kỹ năng</label>
                        <input type="text" class="form-input" id="candidateSkill" placeholder="Figma, C#, Content..." />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Ngành nghề</label>
                        <input type="text" class="form-input" id="candidateMajor" placeholder="CNTT, Thiết kế, Marketing..." />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Mức lương tối đa</label>
                        <input type="number" min="0" class="form-input" id="candidateMaxSalary" placeholder="300000" />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Kinh nghiệm</label>
                        <input type="text" class="form-input" id="candidateExperience" placeholder="Beginner, Expert, thực tập..." />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Đánh giá tối thiểu</label>
                        <select class="form-select" id="candidateMinRating">
                            <option value="">Tất cả</option>
                            <option value="3">Từ 3 sao</option>
                            <option value="4">Từ 4 sao</option>
                            <option value="4.5">Từ 4.5 sao</option>
                        </select>
                    </div>
                </div>
                <div class="candidate-filter-actions">
                    <button class="btn-modern-primary" id="btnSearchCandidates">
                        <i data-lucide="search" style="width:16px;height:16px;"></i> Tìm kiếm
                    </button>
                    <button class="btn-sm btn-outline" id="btnResetCandidateFilters">Xóa lọc</button>
                </div>
            </section>

            <div id="candidateResultsPanel" class="candidate-results-panel">
                <div style="display:flex;align-items:center;justify-content:center;min-height:220px;color:var(--text-secondary);font-weight:600;">
                    <span class="spinner-border spinner-border-sm" style="margin-right:8px;"></span> Đang tải hồ sơ ứng viên...
                </div>
            </div>`;

        if (window.lucide) lucide.createIcons();
        document.getElementById('btnSearchCandidates')?.addEventListener('click', loadCandidateProfiles);
        document.getElementById('btnResetCandidateFilters')?.addEventListener('click', () => {
            ['candidateKeyword', 'candidateSkill', 'candidateMajor', 'candidateMaxSalary', 'candidateExperience'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            const rating = document.getElementById('candidateMinRating');
            if (rating) rating.value = '';
            loadCandidateProfiles();
        });
        document.querySelectorAll('#candidateKeyword,#candidateSkill,#candidateMajor,#candidateExperience').forEach(input => {
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') loadCandidateProfiles();
            });
        });
        loadCandidateProfiles();
    }

    function loadCandidateProfiles() {
        const panel = document.getElementById('candidateResultsPanel');
        if (panel) {
            panel.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;min-height:180px;color:var(--text-secondary);font-weight:600;"><span class="spinner-border spinner-border-sm" style="margin-right:8px;"></span> Đang tìm ứng viên...</div>`;
        }

        const params = new URLSearchParams();
        [
            ['keyword', 'candidateKeyword'],
            ['skill', 'candidateSkill'],
            ['major', 'candidateMajor'],
            ['maxSalary', 'candidateMaxSalary'],
            ['experience', 'candidateExperience'],
            ['minRating', 'candidateMinRating']
        ].forEach(([key, id]) => {
            const value = document.getElementById(id)?.value?.trim();
            if (value) params.set(key, value);
        });

        fetch(`/Home/SearchCandidateProfiles?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    showToast(data.message || 'Không thể tải hồ sơ ứng viên.', 'error');
                    return;
                }
                renderCandidateProfiles(data.candidates || []);
            })
            .catch(err => {
                console.error(err);
                showToast('Không thể kết nối đến máy chủ.', 'error');
            });
    }

    function renderCandidateProfiles(candidates) {
        const panel = document.getElementById('candidateResultsPanel');
        if (!panel) return;

        if (!candidates.length) {
            panel.innerHTML = `
                <div class="profile-card-modern animate-in" style="padding:34px;text-align:center;">
                    <i data-lucide="search-x" style="width:34px;height:34px;color:var(--primary);"></i>
                    <h3 style="margin:12px 0 6px;">Chưa tìm thấy ứng viên phù hợp</h3>
                    <p style="color:var(--text-muted);margin:0;">Thử nới bộ lọc hoặc tìm bằng kỹ năng/ngành nghề khác.</p>
                </div>`;
            if (window.lucide) lucide.createIcons();
            return;
        }

        panel.innerHTML = `
            <div class="candidate-result-list">
                ${candidates.map(candidate => `
                    <article class="candidate-card animate-in" data-candidate-id="${candidate.id}">
                        <div class="candidate-avatar">
                            ${candidate.avatarUrl ? `<img src="${escapeHtml(candidate.avatarUrl)}" alt="${escapeHtml(candidate.name)}" />` : `<span>${getInitials(candidate.name)}</span>`}
                        </div>
                        <div class="candidate-main">
                            <div class="candidate-title-row">
                                <div>
                                    <h3>${escapeHtml(candidate.name)}</h3>
                                    <p>${escapeHtml([candidate.major, candidate.university].filter(Boolean).join(' · ') || 'Chưa cập nhật ngành học')}</p>
                                </div>
                                <span class="candidate-rating"><i data-lucide="star" style="width:14px;height:14px;"></i> ${Number(candidate.rating || 0).toFixed(1)} (${candidate.reviewsCount || 0})</span>
                            </div>
                            <p class="candidate-bio">${escapeHtml(candidate.bio || candidate.experience || 'Ứng viên chưa cập nhật mô tả hồ sơ.')}</p>
                            <div class="job-tags">${(candidate.skills || []).slice(0, 8).map(skill => `<span class="job-tag">${escapeHtml(skill)}</span>`).join('')}</div>
                        </div>
                        <div class="candidate-side">
                            <strong>${candidate.expectedSalary > 0 ? formatVND(candidate.expectedSalary) : 'Thỏa thuận'}</strong>
                            <span>Mức lương mong muốn</span>
                            <button class="btn-sm btn-primary" data-action="view">Xem hồ sơ</button>
                            <button class="btn-sm btn-outline" data-action="save">${candidate.isSaved ? 'Bỏ lưu' : 'Lưu ứng viên'}</button>
                        </div>
                    </article>
                `).join('')}
            </div>`;

        if (window.lucide) lucide.createIcons();
        panel.querySelectorAll('.candidate-card').forEach(card => {
            const studentId = Number(card.dataset.candidateId);
            card.querySelector('[data-action="view"]')?.addEventListener('click', () => openCandidateProfileModal(studentId));
            card.querySelector('[data-action="save"]')?.addEventListener('click', e => toggleSaveCandidate(studentId, e.currentTarget));
        });
    }

    function openCandidateProfileModal(studentId) {
        fetch(`/Home/GetCandidateProfile?studentId=${studentId}`)
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    showToast(data.message || 'Không thể tải hồ sơ ứng viên.', 'error');
                    return;
                }

                const candidate = data.candidate;
                const modal = document.createElement('div');
                modal.className = 'modal-overlay';
                modal.innerHTML = `
                    <div class="modal-content" style="max-width:840px;max-height:88vh;overflow-y:auto;">
                        <button class="modal-close"><i data-lucide="x" style="width:20px;height:20px;"></i></button>
                        <div class="candidate-profile-cover" style="${candidate.coverImageUrl ? `background-image:url('${escapeHtml(candidate.coverImageUrl)}')` : ''}">
                            <div class="candidate-profile-avatar">
                                ${candidate.avatarUrl ? `<img src="${escapeHtml(candidate.avatarUrl)}" alt="${escapeHtml(candidate.name)}" />` : `<span>${getInitials(candidate.name)}</span>`}
                            </div>
                        </div>
                        <div class="modal-body candidate-profile-body">
                            <div class="candidate-profile-head">
                                <div>
                                    <h2>${escapeHtml(candidate.name)}</h2>
                                    <p>${escapeHtml([candidate.major, candidate.university].filter(Boolean).join(' · ') || 'Chưa cập nhật ngành học')}</p>
                                </div>
                                <button class="btn-sm btn-outline" id="btnSaveCandidateFromModal">${candidate.isSaved ? 'Bỏ lưu' : 'Lưu ứng viên'}</button>
                            </div>
                            <div class="candidate-profile-stats">
                                <div><strong>${Number(candidate.rating || 0).toFixed(1)}</strong><span>Đánh giá</span></div>
                                <div><strong>${candidate.reviewsCount || 0}</strong><span>Lượt đánh giá</span></div>
                                <div><strong>${candidate.expectedSalary > 0 ? formatVND(candidate.expectedSalary) : 'Thỏa thuận'}</strong><span>Lương mong muốn</span></div>
                                <div><strong>${candidate.graduationYear || '--'}</strong><span>Năm tốt nghiệp</span></div>
                            </div>
                            <section>
                                <h3>Giới thiệu</h3>
                                <p>${escapeHtml(candidate.bio || 'Ứng viên chưa cập nhật giới thiệu.')}</p>
                                <p>${escapeHtml(candidate.experience || '')}</p>
                            </section>
                            <section>
                                <h3>Kỹ năng</h3>
                                <div class="job-tags">${(candidate.skills || []).map(skill => `<span class="job-tag">${escapeHtml(skill.name)} · ${escapeHtml(skill.level)}${skill.months ? ` · ${skill.months} tháng` : ''}</span>`).join('') || '<span class="job-tag">Chưa cập nhật</span>'}</div>
                            </section>
                            <section>
                                <h3>Portfolio</h3>
                                <div class="candidate-profile-list">
                                    ${(candidate.portfolio || []).length ? candidate.portfolio.map(item => `
                                        <div>
                                            <strong>${escapeHtml(item.title)}</strong>
                                            <p>${escapeHtml(item.description)}</p>
                                            ${item.projectUrl ? `<a href="${escapeHtml(item.projectUrl)}" target="_blank" rel="noopener">Mở liên kết</a>` : ''}
                                        </div>
                                    `).join('') : '<p>Chưa có portfolio.</p>'}
                                </div>
                            </section>
                            <section>
                                <h3>Chứng chỉ</h3>
                                <div class="candidate-profile-list">
                                    ${(candidate.certificates || []).length ? candidate.certificates.map(cert => `
                                        <div>
                                            <strong>${escapeHtml(cert.name)}</strong>
                                            <p>${escapeHtml(cert.organization)} · ${escapeHtml(cert.issuedDate)}</p>
                                        </div>
                                    `).join('') : '<p>Chưa có chứng chỉ.</p>'}
                                </div>
                            </section>
                            <section>
                                <h3>Đánh giá</h3>
                                <div class="candidate-profile-list">
                                    ${(candidate.reviews || []).length ? candidate.reviews.map(review => `
                                        <div>
                                            <strong>${Number(review.rating || 0).toFixed(1)} sao</strong>
                                            <p>${escapeHtml(review.comment || 'Không có nhận xét.')}</p>
                                            <small>${escapeHtml(review.createdAt)}</small>
                                        </div>
                                    `).join('') : '<p>Chưa có đánh giá.</p>'}
                                </div>
                            </section>
                        </div>
                        <div class="modal-footer"><button class="btn-modal-cancel">Đóng</button></div>
                    </div>`;

                document.body.appendChild(modal);
                if (window.lucide) lucide.createIcons();
                requestAnimationFrame(() => modal.classList.add('active'));
                modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
                modal.querySelector('.btn-modal-cancel').addEventListener('click', () => closeModal(modal));
                modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal); });
                modal.querySelector('#btnSaveCandidateFromModal')?.addEventListener('click', e => {
                    toggleSaveCandidate(studentId, e.currentTarget);
                    closeModal(modal);
                });
            })
            .catch(err => {
                console.error(err);
                showToast('Không thể kết nối đến máy chủ.', 'error');
            });
    }

    function toggleSaveCandidate(studentId, button) {
        if (button) button.disabled = true;
        postJson('/Home/ToggleSaveCandidate', { studentId })
            .then(data => {
                showToast(data.message || 'Đã cập nhật ứng viên.', data.success ? 'success' : 'error');
                if (data.success && button) {
                    button.textContent = data.isSaved ? 'Bỏ lưu' : 'Lưu ứng viên';
                    button.disabled = false;
                } else if (button) {
                    button.disabled = false;
                }
            })
            .catch(err => {
                console.error(err);
                showToast('Không thể lưu ứng viên.', 'error');
                if (button) button.disabled = false;
            });
    }

    function getInitials(name) {
        return (name || 'UV')
            .split(' ')
            .map(word => word[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
    }

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
                        <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end;">
                            <button class="btn-modern-primary" id="btnViewBusinessJobs">
                                <i data-lucide="briefcase-business" style="width:16px;height:16px;"></i> Xem trang việc làm
                            </button>
                            <button class="btn-modern-primary" id="btnEditProfile">
                                <i data-lucide="edit-3" style="width:16px;height:16px;"></i> Chỉnh sửa hồ sơ
                            </button>
                        </div>
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
                    <div class="profile-cover-modern" style="height: 180px;">
                        ${data.coverImageUrl
                    ? `<img src="${data.coverImageUrl}" class="profile-cover-image" alt="Company Cover" />`
                    : ''
                }
                    </div>

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
                                <span class="stat-modern-value">${data.openJobsCount || 0}</span>
                                <span class="stat-modern-title">Tin đang mở</span>
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
                            <h3><i data-lucide="file-text" style="width:16px;height:16px;"></i> Mô tả doanh nghiệp</h3>
                            <p style="font-size:14px; color: var(--text-secondary); margin:0; line-height: 1.6; white-space: pre-line;">
                                ${escapeHtml(data.description || 'Chưa cập nhật mô tả doanh nghiệp.')}
                            </p>
                        </div>

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

        document.getElementById('btnViewBusinessJobs')?.addEventListener('click', () => {
            const currentUserId = document.getElementById('userProfile')?.getAttribute('data-user-id');
            if (currentUserId) {
                window.location.href = `/business/${currentUserId}/jobs`;
            }
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
                            <label class="form-label">Ảnh bìa doanh nghiệp</label>
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
                        `}
                    </div>

                    <div class="form-grid-2">
                        <div class="form-group">
                            <label class="form-label">${isStudent ? 'Họ và tên' : 'Tên doanh nghiệp'}</label>
                            <input type="text" class="form-input" id="editName" value="${escapeHtml(isStudent ? data.fullName : data.companyName)}" required />
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email tài khoản</label>
                            <input type="email" class="form-input" id="editEmail" value="${escapeHtml(data.email || '')}" />
                        </div>
                    </div>

                    <div class="form-grid-2">
                        <div class="form-group">
                            <label class="form-label">Số điện thoại liên hệ</label>
                            <input type="text" class="form-input" id="editPhone" value="${escapeHtml(data.phone || '')}" />
                        </div>
                        ${!isStudent ? `
                        <div class="form-group">
                            <label class="form-label">Lĩnh vực hoạt động</label>
                            <input type="text" class="form-input" id="editIndustry" value="${escapeHtml(data.industry || '')}" placeholder="Lĩnh vực: IT, Marketing, Xây dựng..." />
                        </div>
                        ` : `<div></div>`}
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
                    <div class="form-group">
                        <label class="form-label">Mô tả doanh nghiệp</label>
                        <textarea class="form-textarea" id="editBusinessDescription" rows="4" placeholder="Giới thiệu ngắn về doanh nghiệp, môi trường làm việc và định hướng tuyển dụng...">${escapeHtml(data.description || '')}</textarea>
                    </div>

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

        if (!isStudent) {
            const coverInput = modal.querySelector('#editCoverFile');
            const coverPreview = modal.querySelector('#coverPreview');
            const coverPreviewContainer = modal.querySelector('#coverPreviewContainer');
            const btnRecropCover = modal.querySelector('#btnRecropCover');

            coverInput?.addEventListener('change', function (e) {
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

            btnRecropCover?.addEventListener('click', function (e) {
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
                email: modal.querySelector('#editEmail').value.trim(),
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
                payload.coverImageUrl = uploadedCoverBase64;
                payload.businessDescription = modal.querySelector('#editBusinessDescription').value.trim();

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

    async function renderBusinessJobsView() {
        mainContent.innerHTML = `
            <div class="page-header">
                <h1 class="page-title"><i data-lucide="file-text" style="width:24px;height:24px;"></i> Quản lý tin đăng</h1>
                <p class="page-subtitle">Theo dõi bài đăng tuyển dụng và số lượng ứng viên ứng tuyển</p>
            </div>
            <div class="card border-0 shadow-sm p-4" style="border-radius:12px; background:#fff; border:1px solid #e2e8f0;">
                <div id="businessJobsList" style="display:flex; flex-direction:column; gap:12px;">
                    <div class="text-muted text-center py-4">Đang tải tin đăng...</div>
                </div>
            </div>`;
        if (window.lucide) lucide.createIcons();

        try {
            const res = await fetch('/Home/GetBusinessJobs');
            const data = await res.json();
            const list = document.getElementById('businessJobsList');
            if (!data.success) {
                list.innerHTML = `<div class="alert alert-danger m-0">${escapeHtml(data.message || 'Không thể tải tin đăng.')}</div>`;
                return;
            }

            if (!data.jobs || data.jobs.length === 0) {
                list.innerHTML = `<div class="empty-state"><div class="empty-icon">📄</div><h3>Chưa có tin đăng</h3><p>Hãy tạo tin tuyển dụng đầu tiên để nhận ứng viên.</p></div>`;
                return;
            }

            list.innerHTML = data.jobs.map(job => {
                const approvalText = job.isApproved ? 'Đã duyệt' : 'Chờ duyệt';
                const approvalColor = job.isApproved ? '#059669' : '#d97706';
                const statusText = job.status === 'Open' ? 'Đang mở' : job.status === 'In_Progress' ? 'Đang thực hiện' : job.status === 'Rejected' ? 'Bị từ chối' : job.status;
                return `
                    <div style="border:1px solid #f1f5f9; padding:16px; border-radius:10px; display:grid; grid-template-columns:1fr auto; gap:16px; align-items:center;">
                        <div style="min-width:0;">
                            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:6px;">
                                <strong style="font-size:1rem; color:#0f172a;">${escapeHtml(job.title)}</strong>
                                <span class="admin-badge" style="background:#f8fafc; color:${approvalColor}; border:1px solid #e2e8f0;">${approvalText}</span>
                                <span class="admin-badge" style="background:#eef2ff; color:#4F46E5; border:1px solid #e0e7ff;">${statusText}</span>
                            </div>
                            <div style="font-size:0.82rem; color:#64748b; margin-bottom:8px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${escapeHtml(job.description || '')}</div>
                            <div style="display:flex; gap:12px; flex-wrap:wrap; font-size:0.78rem; color:#475569;">
                                <span><strong>${formatVND(job.budget)}</strong></span>
                                <span>Hạn: ${escapeHtml(job.deadline)}</span>
                                <span>${job.applicantsCount} ứng viên</span>
                                <span>${job.viewCount || 0} lượt xem</span>
                            </div>
                        </div>
                        <div style="display:flex; gap:8px; justify-content:flex-end; flex-wrap:wrap;">
                            <button class="btn-indigo-outline btnViewBusinessApplicants" data-job-id="${job.id}" style="padding:8px 12px; border-radius:8px; font-size:0.82rem;">
                                <i data-lucide="users" style="width:14px;height:14px;"></i> Xem ứng viên
                            </button>
                        </div>
                    </div>`;
            }).join('');
            if (window.lucide) lucide.createIcons();

            document.querySelectorAll('.btnViewBusinessApplicants').forEach(btn => {
                btn.addEventListener('click', () => renderBusinessApplicantsView(btn.dataset.jobId));
            });
        } catch (err) {
            console.error(err);
            document.getElementById('businessJobsList').innerHTML = `<div class="alert alert-danger m-0">Không thể kết nối máy chủ.</div>`;
        }
    }

    async function renderBusinessApplicantsView(jobId = null) {
        const url = jobId ? `/Home/GetBusinessApplicants?jobId=${encodeURIComponent(jobId)}` : '/Home/GetBusinessApplicants';
        mainContent.innerHTML = `
            <div class="page-header">
                <h1 class="page-title"><i data-lucide="users" style="width:24px;height:24px;"></i> Ứng viên</h1>
                <p class="page-subtitle">Duyệt ứng viên đã ứng tuyển và bắt đầu trao đổi</p>
            </div>
            <div class="card border-0 shadow-sm p-4" style="border-radius:12px; background:#fff; border:1px solid #e2e8f0;">
                <div id="businessApplicantsList" style="display:flex; flex-direction:column; gap:12px;">
                    <div class="text-muted text-center py-4">Đang tải ứng viên...</div>
                </div>
            </div>`;
        if (window.lucide) lucide.createIcons();

        try {
            const res = await fetch(url);
            const data = await res.json();
            const list = document.getElementById('businessApplicantsList');
            if (!data.success) {
                list.innerHTML = `<div class="alert alert-danger m-0">${escapeHtml(data.message || 'Không thể tải ứng viên.')}</div>`;
                return;
            }

            if (!data.applicants || data.applicants.length === 0) {
                list.innerHTML = `<div class="empty-state"><div class="empty-icon">👥</div><h3>Chưa có ứng viên</h3><p>Khi sinh viên ứng tuyển, hồ sơ sẽ xuất hiện tại đây.</p></div>`;
                return;
            }

            list.innerHTML = data.applicants.map(app => {
                const initials = (app.fullName || 'UV').split(' ').filter(Boolean).slice(-2).map(x => x[0]).join('').toUpperCase() || 'UV';
                const statusText = app.status === 'Pending' ? 'Chờ duyệt' : app.status === 'Accepted' ? 'Đã duyệt' : app.status === 'Rejected' ? 'Đã từ chối' : app.status;
                const statusColor = app.status === 'Accepted' ? '#059669' : app.status === 'Rejected' ? '#dc2626' : '#d97706';
                return `
                    <div class="candidate-item" style="border:1px solid #f1f5f9; border-radius:10px; padding:16px; align-items:flex-start;">
                        <div class="candidate-left" style="align-items:flex-start; min-width:0;">
                            <div class="candidate-avatar" style="background:${app.avatarUrl ? 'none' : 'linear-gradient(135deg,#4F46E5,#06b6d4)'}; color:white; display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0;">
                                ${app.avatarUrl ? `<img src="${escapeHtml(app.avatarUrl)}" alt="" />` : initials}
                            </div>
                            <div style="min-width:0;">
                                <div class="candidate-name" style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                                    ${escapeHtml(app.fullName || 'Ứng viên')}
                                    <span class="candidate-badge" style="background:#f8fafc; color:${statusColor}; border:1px solid #e2e8f0;">${statusText}</span>
                                </div>
                                <div class="candidate-role">${escapeHtml(app.role || 'Ứng viên')} · ${escapeHtml(app.jobTitle || '')}</div>
                                <div style="font-size:0.78rem; color:#64748b; margin-top:6px;">${escapeHtml(app.university || '')}${app.major ? ' · ' + escapeHtml(app.major) : ''}</div>
                                <div style="font-size:0.8rem; color:#334155; margin-top:8px;">${escapeHtml(app.proposal || '')}</div>
                                <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">${(app.skills || []).map(s => `<span class="job-tag">${escapeHtml(s)}</span>`).join('')}</div>
                                <div style="font-size:0.75rem; color:#94a3b8; margin-top:8px;">Ứng tuyển: ${escapeHtml(app.appliedAt || '')} · Giá đề xuất: ${formatVND(app.bidAmount || 0)}</div>
                            </div>
                        </div>
                        <div class="candidate-right" style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
                            ${app.status === 'Pending' ? `
                                <button class="btn-indigo-solid btnAcceptBid" data-bid-id="${app.bidId}" style="padding:7px 12px; border-radius:8px; font-size:0.78rem;">Duyệt</button>
                                <button class="btn-indigo-outline btnRejectBid" data-bid-id="${app.bidId}" style="padding:7px 12px; border-radius:8px; font-size:0.78rem; color:#dc2626; border-color:#fecaca;">Từ chối</button>
                            ` : ''}
                            <button class="btn-indigo-outline btnChatApplicant" data-student-id="${app.studentId}" style="padding:7px 12px; border-radius:8px; font-size:0.78rem;">
                                <i data-lucide="message-circle" style="width:14px;height:14px;"></i> Trao đổi
                            </button>
                        </div>
                    </div>`;
            }).join('');
            if (window.lucide) lucide.createIcons();

            document.querySelectorAll('.btnAcceptBid').forEach(btn => btn.addEventListener('click', () => updateBidStatus(btn.dataset.bidId, 'accept', jobId)));
            document.querySelectorAll('.btnRejectBid').forEach(btn => btn.addEventListener('click', () => updateBidStatus(btn.dataset.bidId, 'reject', jobId)));
            document.querySelectorAll('.btnChatApplicant').forEach(btn => btn.addEventListener('click', () => {
                window.location.href = `/Message?userId=${encodeURIComponent(btn.dataset.studentId)}`;
            }));
        } catch (err) {
            console.error(err);
            document.getElementById('businessApplicantsList').innerHTML = `<div class="alert alert-danger m-0">Không thể kết nối máy chủ.</div>`;
        }
    }

    async function updateBidStatus(bidId, action, jobId = null) {
        try {
            const res = await fetch('/Home/UpdateBidStatus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bidId: parseInt(bidId, 10), action })
            });
            const data = await res.json();
            if (data.success) {
                showToast(action === 'accept' ? 'Đã duyệt ứng viên.' : 'Đã từ chối ứng viên.', 'success');
                await renderBusinessApplicantsView(jobId);
            } else {
                showToast(data.message || 'Không thể cập nhật ứng viên.', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Lỗi kết nối máy chủ.', 'error');
        }
    }

    // ============================================
    // RENDER: Tin nhắn
    // ============================================
    function isBusinessAccount() {
        return document.getElementById('userProfile')?.dataset.userRole === 'Business';
    }

    function renderBusinessMessagesView() {
        mainContent.innerHTML = `
            <div class="page-header">
                <h1 class="page-title"><i data-lucide="message-circle" style="width:24px;height:24px;"></i> Tin nhắn</h1>
                <p class="page-subtitle">Trao đổi với ứng viên và đối tác</p>
            </div>
            <div class="messages-container">
                <div class="messages-list" id="businessMessagesList">
                    <div style="padding:18px;color:var(--text-muted);font-weight:700;"><span class="spinner-border spinner-border-sm" style="margin-right:8px;"></span> Đang tải hội thoại...</div>
                </div>
                <div class="chat-panel" id="chatPanel">
                    <div class="chat-placeholder">
                        <i data-lucide="message-square" style="width:48px;height:48px;color:var(--text-muted);"></i>
                        <p>Chọn một cuộc trò chuyện để bắt đầu</p>
                    </div>
                </div>
            </div>`;
        if (window.lucide) lucide.createIcons();
        loadBusinessConversations();
    }

    function loadBusinessConversations() {
        fetch('/Home/GetMessageConversations')
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    showToast(data.message || 'Không thể tải hội thoại.', 'error');
                    return;
                }
                renderBusinessConversations(data.conversations || []);
            })
            .catch(err => {
                console.error(err);
                showToast('Không thể kết nối đến máy chủ.', 'error');
            });
    }

    function renderBusinessConversations(conversations) {
        const list = document.getElementById('businessMessagesList');
        if (!list) return;

        if (!conversations.length) {
            list.innerHTML = '<div style="padding:18px;color:var(--text-muted);font-weight:700;">Chưa có hội thoại nào.</div>';
            return;
        }

        list.innerHTML = conversations.map(conv => `
            <div class="message-item ${conv.unread > 0 ? 'unread' : ''}" data-user-id="${conv.userId}">
                <div class="msg-avatar" style="background:${conv.avatarUrl ? 'none' : '#0ea5e9'}">
                    ${conv.avatarUrl ? `<img src="${escapeHtml(conv.avatarUrl)}" alt="${escapeHtml(conv.name)}" />` : getInitials(conv.name)}
                </div>
                <div class="msg-content">
                    <div class="msg-header">
                        <span class="msg-name">${escapeHtml(conv.name)}</span>
                        <span class="msg-time">${escapeHtml(conv.time)}</span>
                    </div>
                    <p class="msg-preview">${escapeHtml(conv.lastMsg)}</p>
                </div>
                ${conv.unread > 0 ? `<span class="msg-badge">${conv.unread}</span>` : ''}
            </div>
        `).join('');

        list.querySelectorAll('.message-item').forEach(item => {
            item.addEventListener('click', () => openBusinessChat(Number(item.dataset.userId)));
        });

        if (pendingChatUserId) {
            const target = pendingChatUserId;
            pendingChatUserId = null;
            openBusinessChat(target);
        }
    }

    function openBusinessChat(userId) {
        document.querySelectorAll('.message-item').forEach(i => i.classList.toggle('selected', Number(i.dataset.userId) === userId));

        fetch(`/Home/GetConversationMessages?userId=${userId}`)
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    showToast(data.message || 'Không thể tải tin nhắn.', 'error');
                    return;
                }
                renderBusinessChat(data.user, data.messages || []);
            })
            .catch(err => {
                console.error(err);
                showToast('Không thể kết nối đến máy chủ.', 'error');
            });
    }

    function renderBusinessChat(user, messages) {
        const chatPanel = document.getElementById('chatPanel');
        if (!chatPanel) return;

        chatPanel.innerHTML = `
            <div class="chat-header">
                <div class="chat-user-info">
                    <div class="msg-avatar small" style="background:${user.avatarUrl ? 'none' : '#0ea5e9'}">
                        ${user.avatarUrl ? `<img src="${escapeHtml(user.avatarUrl)}" alt="${escapeHtml(user.name)}" />` : getInitials(user.name)}
                    </div>
                    <div>
                        <div class="chat-user-name">${escapeHtml(user.name)}</div>
                        <div class="chat-status">Ứng viên</div>
                    </div>
                </div>
            </div>
            <div class="chat-messages" id="chatMessages">
                ${messages.map(m => `
                    <div class="chat-bubble ${m.fromMe ? 'me' : 'them'}">
                        <p>${escapeHtml(m.text)}</p>
                        <span class="bubble-time">${escapeHtml(m.time)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="chat-input-area">
                <input type="text" placeholder="Nhập tin nhắn..." class="chat-input" id="chatInput" />
                <button class="chat-send-btn" id="chatSendBtn"><i data-lucide="send" style="width:18px;height:18px;"></i></button>
            </div>`;
        if (window.lucide) lucide.createIcons();

        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;

        const send = () => {
            const input = document.getElementById('chatInput');
            const text = input?.value.trim();
            if (!text) return;

            postJson('/Home/SendConversationMessage', { receiverId: user.id, content: text })
                .then(data => {
                    if (!data.success) {
                        showToast(data.message || 'Không thể gửi tin nhắn.', 'error');
                        return;
                    }
                    input.value = '';
                    openBusinessChat(user.id);
                    loadBusinessConversations();
                })
                .catch(err => {
                    console.error(err);
                    showToast('Không thể kết nối đến máy chủ.', 'error');
                });
        };

        document.getElementById('chatSendBtn')?.addEventListener('click', send);
        document.getElementById('chatInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
    }

    function renderMessagesView() {
        if (isBusinessAccount()) {
            renderBusinessMessagesView();
            return;
        }

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
        document.getElementById('walletDeposit')?.addEventListener('click', () => openDepositQrModal());
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
        currentRenderedJobs = Array.isArray(jobs) ? jobs : [];

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

        document.querySelectorAll('.job-card[data-job-id]').forEach(card => {
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
            newCard.addEventListener('click', function (e) {
                if (e.target.closest('.job-bookmark')) return;
                openJobModal(this.dataset.jobId);
            });
            newCard.style.cursor = 'pointer';
        });

        document.querySelectorAll('.job-bookmark[data-job-id]').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                toggleSaveJob(this.dataset.jobId, this);
            });
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
        const job = currentRenderedJobs.find(j => String(j.id) === String(jobId)) || allJobs.find(j => String(j.id) === String(jobId));
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
        document.getElementById('btnDeposit')?.addEventListener('click', () => openDepositQrModal());
        const configs = {
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

    function openDepositQrModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content modal-sm">
                <button class="modal-close"><i data-lucide="x" style="width:20px;height:20px;"></i></button>
                <div class="modal-header"><h2>Nạp tiền doanh nghiệp</h2></div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Số tiền nạp</label>
                        <input type="number" class="form-input" id="depositAmountInput" min="50000" step="50000" value="50000" />
                        <small style="display:block;margin-top:6px;color:var(--text-muted);font-weight:600;">Số tiền phải là bội của 50.000 đ. Mã QR chỉ dùng một lần và hết hạn sau 15 phút.</small>
                    </div>
                    <div id="depositQrResult"></div>
                </div>
                <div class="modal-footer">
                    <button class="btn-apply-job" id="btnGenerateDepositQr"><i data-lucide="qr-code" style="width:16px;height:16px;"></i> Tạo mã QR</button>
                    <button class="btn-modal-cancel">Đóng</button>
                </div>
            </div>`;

        document.body.appendChild(modal);
        if (window.lucide) lucide.createIcons();
        requestAnimationFrame(() => modal.classList.add('active'));

        modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
        modal.querySelector('.btn-modal-cancel').addEventListener('click', () => closeModal(modal));
        modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal); });

        modal.querySelector('#btnGenerateDepositQr').addEventListener('click', function () {
            const amount = Number(modal.querySelector('#depositAmountInput').value);
            const result = modal.querySelector('#depositQrResult');

            if (!Number.isFinite(amount) || amount < 50000 || amount % 50000 !== 0) {
                showToast('Số tiền nạp phải là bội của 50.000 đ.', 'warning');
                return;
            }

            const btn = this;
            const original = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm" style="margin-right:8px;"></span> Đang tạo...';

            fetch('/Home/GenerateDepositQr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount })
            })
                .then(res => res.json())
                .then(data => {
                    if (!data.success) {
                        showToast(data.message || 'Không thể tạo mã QR.', 'error');
                        return;
                    }

                    const qrUrl = `https://quickchart.io/qr?size=220&margin=1&text=${encodeURIComponent(data.qrPayload)}`;
                    result.innerHTML = `
                        <div class="financial-result" style="margin-top:16px;">
                            <img src="${qrUrl}" alt="QR nạp tiền" style="width:220px;height:220px;border-radius:8px;border:1px solid var(--border-color);background:#fff;padding:8px;" />
                            <p class="result-message" style="margin-top:12px;">Mã giao dịch: <strong>${escapeHtml(data.transactionCode)}</strong></p>
                            <p class="result-detail">Số tiền: <strong>${formatVND(data.amount)}</strong><br/>Hết hạn: ${escapeHtml(data.expiresAt)}</p>
                            <textarea readonly class="form-textarea" style="height:76px;font-size:12px;">${escapeHtml(data.qrPayload)}</textarea>
                        </div>`;
                    if (window.lucide) lucide.createIcons();
                    showToast('Đã tạo mã QR nạp tiền dùng một lần.', 'success');
                })
                .catch(err => {
                    console.error(err);
                    showToast('Không thể kết nối đến máy chủ.', 'error');
                })
                .finally(() => {
                    btn.disabled = false;
                    btn.innerHTML = original;
                });
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
    // NOTIFICATION DROPDOWN & BADGE
    // ============================================
    function updateNotificationBadge() {
        const btn = document.getElementById('notificationBtn');
        if (!btn) return;
        fetch('/Home/GetNotifications')
            .then(r => r.json())
            .then(notifications => {
                if (Array.isArray(notifications)) {
                    const unreadCount = notifications.filter(n => n.unread).length;
                    const badge = btn.querySelector('.notification-badge');
                    if (badge) {
                        if (unreadCount > 0) {
                            badge.textContent = unreadCount;
                            badge.style.display = 'flex';
                        } else {
                            badge.style.display = 'none';
                        }
                    }
                }
            })
            .catch(err => console.error('Error fetching notifications:', err));
    }

    function bindNotificationBtn() {
        const btn = document.getElementById('notificationBtn');
        if (!btn) return;
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            // Close any existing dropdown
            document.querySelector('.dropdown-panel')?.remove();

            fetch('/Home/GetNotifications')
                .then(r => r.json())
                .then(notifications => {
                    const listHTML = (notifications && notifications.length > 0)
                        ? notifications.map(n => `
                            <div class="dropdown-item ${n.unread ? 'unread' : ''}" data-id="${n.id}">
                                <div class="dropdown-item-icon">${n.icon}</div>
                                <div class="dropdown-item-content">
                                    <div class="dropdown-item-title" style="color: ${n.color || 'inherit'}; font-weight: 600;">${n.title}</div>
                                    <div class="dropdown-item-desc">${n.desc}</div>
                                    <div class="dropdown-item-time">${n.time}</div>
                                </div>
                                ${n.unread ? '<div class="dropdown-dot"></div>' : ''}
                            </div>
                        `).join('')
                        : `<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">Không có thông báo nào</div>`;

                    const dropdown = document.createElement('div');
                    dropdown.className = 'dropdown-panel notification-dropdown';
                    dropdown.innerHTML = `
                        <div class="dropdown-header">
                            <h4>Thông báo</h4>
                            <button class="dropdown-mark-read">Đánh dấu đã đọc</button>
                        </div>
                        <div class="dropdown-list">
                            ${listHTML}
                        </div>`;

                    document.body.appendChild(dropdown);
                    // Position near the bell
                    const rect = btn.getBoundingClientRect();
                    dropdown.style.top = (rect.bottom + 8) + 'px';
                    dropdown.style.right = (window.innerWidth - rect.right) + 'px';

                    requestAnimationFrame(() => dropdown.classList.add('show'));

                    dropdown.querySelector('.dropdown-mark-read').addEventListener('click', () => {
                        fetch('/Home/MarkNotificationsAsRead', { method: 'POST' })
                            .then(r => r.json())
                            .then(res => {
                                if (res.success) {
                                    dropdown.querySelectorAll('.unread').forEach(item => item.classList.remove('unread'));
                                    dropdown.querySelectorAll('.dropdown-dot').forEach(dot => dot.remove());
                                    const badge = btn.querySelector('.notification-badge');
                                    if (badge) badge.style.display = 'none';
                                    showToast('✅ Đã đánh dấu tất cả đã đọc', 'success');
                                }
                            })
                            .catch(err => console.error('Error marking notifications as read:', err));
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
                })
                .catch(err => {
                    console.error('Error loading notifications:', err);
                    showToast('Không thể tải thông báo.', 'error');
                });
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
            const userId = btn.getAttribute('data-user-id');
            const userRole = btn.getAttribute('data-user-role') || '';
            const isBusiness = userRole === 'Business';
            const businessJobsUrl = isBusiness && userId ? `/business/${userId}/jobs` : '#';

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
                    ${isBusiness ? `
                        <div class="dropdown-section-label">Doanh nghiệp</div>
                        <div class="dropdown-menu-item" data-action="deposit"><i data-lucide="wallet-cards" style="width:16px;height:16px;"></i> Nạp tiền</div>
                        <div class="dropdown-menu-item" data-action="business-jobs"><i data-lucide="briefcase-business" style="width:16px;height:16px;"></i> Xem trang việc làm</div>
                        <div class="dropdown-menu-item" data-action="profile"><i data-lucide="building-2" style="width:16px;height:16px;"></i> Hồ sơ doanh nghiệp</div>
                        <div class="dropdown-menu-item" data-action="edit-profile"><i data-lucide="pencil" style="width:16px;height:16px;"></i> Chỉnh sửa thông tin công ty</div>
                        <div class="dropdown-menu-item" data-action="edit-profile"><i data-lucide="image" style="width:16px;height:16px;"></i> Thay đổi logo doanh nghiệp</div>
                        <div class="dropdown-menu-item" data-action="edit-profile"><i data-lucide="panorama" style="width:16px;height:16px;"></i> Cập nhật ảnh bìa</div>
                        <div class="dropdown-menu-item" data-action="edit-profile"><i data-lucide="file-text" style="width:16px;height:16px;"></i> Chỉnh sửa mô tả doanh nghiệp</div>
                        <div class="dropdown-menu-item" data-action="edit-profile"><i data-lucide="map-pin" style="width:16px;height:16px;"></i> Cập nhật địa chỉ</div>
                        <div class="dropdown-menu-item" data-action="edit-profile"><i data-lucide="globe" style="width:16px;height:16px;"></i> Cập nhật website</div>
                        <div class="dropdown-menu-item" data-action="edit-profile"><i data-lucide="users" style="width:16px;height:16px;"></i> Cập nhật quy mô công ty</div>
                        <div class="dropdown-menu-item" data-action="edit-profile"><i data-lucide="factory" style="width:16px;height:16px;"></i> Cập nhật lĩnh vực hoạt động</div>
                        <div class="dropdown-divider"></div>
                        <div class="dropdown-section-label">Tài khoản</div>
                        <div class="dropdown-menu-item" data-action="edit-profile"><i data-lucide="badge" style="width:16px;height:16px;"></i> Hiển thị tên doanh nghiệp</div>
                        <div class="dropdown-menu-item" data-action="edit-profile"><i data-lucide="phone" style="width:16px;height:16px;"></i> Chỉnh sửa số điện thoại</div>
                        <div class="dropdown-menu-item" data-action="edit-profile"><i data-lucide="mail" style="width:16px;height:16px;"></i> Chỉnh sửa email</div>
                        <div class="dropdown-menu-item" data-action="edit-profile"><i data-lucide="key-round" style="width:16px;height:16px;"></i> Đổi mật khẩu</div>
                    ` : `
                        <div class="dropdown-menu-item" data-action="profile"><i data-lucide="user" style="width:16px;height:16px;"></i> Hồ sơ của tôi</div>
                    `}
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
                        case 'deposit': openDepositQrModal(); break;
                        case 'business-jobs': window.location.href = businessJobsUrl; break;
                        case 'profile': setActiveSidebar('profile'); currentSidebarMode = 'profile'; renderProfileView(); break;
                        case 'edit-profile': openEditProfileFromMenu(); break;
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

    function openEditProfileFromMenu() {
        fetch('/Home/GetProfile')
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    showToast(data.message || 'Không thể tải hồ sơ.', 'error');
                    return;
                }
                openEditProfileModal(data);
            })
            .catch(err => {
                console.error(err);
                showToast('Không thể kết nối đến máy chủ.', 'error');
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
        document.getElementById('btnPostJobBanner')?.addEventListener('click', () => {
            document.getElementById('btnPostJob')?.click();
        });
    }

    function openPostJobModal(job = null) {
        const isEdit = !!job;
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:760px;max-height:85vh;overflow-y:auto;">
                <button class="modal-close"><i data-lucide="x" style="width:20px;height:20px;"></i></button>
                <div class="modal-header"><h2>${isEdit ? 'Chỉnh sửa tin tuyển dụng' : 'Đăng việc mới'}</h2></div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Tiêu đề công việc</label>
                        <input type="text" class="form-input" id="postJobTitle" value="${escapeHtml(job?.title || '')}" placeholder="VD: Thiết kế poster sự kiện..." />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Mô tả chi tiết</label>
                        <textarea class="form-textarea" id="postJobDesc" rows="3" placeholder="Mô tả yêu cầu công việc...">${escapeHtml(job?.description || '')}</textarea>
                    </div>
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label class="form-label">Danh mục</label>
                            <select class="form-select" id="postJobCategory">
                                ${['Thiết kế', 'Làm slide', 'Dịch thuật', 'Viết content', 'Code web', 'Edit video', 'Khác'].map(c => `<option ${job?.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Ngân sách (VNĐ)</label>
                            <input type="number" class="form-input" id="postJobBudget" value="${job?.budget || ''}" placeholder="150000" />
                        </div>
                    </div>
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label class="form-label">Hình thức ngân sách</label>
                            <select class="form-select" id="postJobBudgetType">
                                <option value="Fixed" ${job?.budgetType === 'Fixed' ? 'selected' : ''}>Cố định</option>
                                <option value="Hourly" ${job?.budgetType === 'Hourly' ? 'selected' : ''}>Theo giờ</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Kinh nghiệm yêu cầu</label>
                            <select class="form-select" id="postJobExperience">
                                <option value="No_Experience" ${job?.experienceLevel === 'No_Experience' ? 'selected' : ''}>Không yêu cầu</option>
                                <option value="Mid_Level" ${job?.experienceLevel === 'Mid_Level' ? 'selected' : ''}>Trung cấp</option>
                                <option value="Expert" ${job?.experienceLevel === 'Expert' ? 'selected' : ''}>Chuyên gia</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label class="form-label">Hình thức</label>
                            <input type="text" class="form-input" id="postJobLocation" value="${escapeHtml(job?.location || 'Online')}" placeholder="Remote, Quận 1, TP.HCM..." />
                        </div>
                        <div class="form-group">
                            <label class="form-label">Số lượng tuyển</label>
                            <input type="number" min="1" class="form-input" id="postJobQuantity" value="${job?.quantity || 1}" />
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Kỹ năng cần có (cách nhau bằng dấu phẩy)</label>
                        <input type="text" class="form-input" id="postJobSkills" value="${escapeHtml((job?.skills || []).join(', '))}" placeholder="Figma, Photoshop, Content..." />
                    </div>
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label class="form-label">Yêu cầu</label>
                            <textarea class="form-textarea" id="postJobRequirements" rows="3">${escapeHtml(job?.requirements || '')}</textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Quyền lợi</label>
                            <textarea class="form-textarea" id="postJobBenefits" rows="3">${escapeHtml(job?.benefits || '')}</textarea>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Thời hạn</label>
                        <input type="date" class="form-input" id="postJobDeadline" value="${escapeHtml(job?.deadline || '')}" />
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-apply-job" id="btnSubmitJob"><i data-lucide="send" style="width:16px;height:16px;"></i> Đăng ngay</button>
                    <button class="btn-sm btn-outline" id="btnSaveDraftJob" type="button">Lưu nháp</button>
                    <button class="btn-modal-cancel">Hủy</button>
                </div>
            </div>`;

        document.body.appendChild(modal);
        if (window.lucide) lucide.createIcons();
        requestAnimationFrame(() => modal.classList.add('active'));

        modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
        modal.querySelector('.btn-modal-cancel').addEventListener('click', () => closeModal(modal));
        modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal); });

        const submitBusinessJob = (saveAsDraft) => {
            const title = modal.querySelector('#postJobTitle').value.trim();
            const description = modal.querySelector('#postJobDesc').value.trim();
            const deadline = modal.querySelector('#postJobDeadline').value;
            const budget = Number(modal.querySelector('#postJobBudget').value);

            if (!title) { showToast('Vui lòng nhập tiêu đề công việc.', 'warning'); return; }
            if (!saveAsDraft && !description) { showToast('Vui lòng nhập mô tả công việc.', 'warning'); return; }
            if (!saveAsDraft && !deadline) { showToast('Vui lòng chọn deadline tuyển dụng.', 'warning'); return; }
            if (!saveAsDraft && (!Number.isFinite(budget) || budget <= 0)) { showToast('Vui lòng nhập mức lương hợp lệ.', 'warning'); return; }

            const payload = {
                id: job?.id || null,
                title,
                description,
                requirements: modal.querySelector('#postJobRequirements').value.trim(),
                benefits: modal.querySelector('#postJobBenefits').value.trim(),
                category: modal.querySelector('#postJobCategory').value,
                skills: modal.querySelector('#postJobSkills').value.split(',').map(s => s.trim()).filter(Boolean),
                budget: Number.isFinite(budget) ? budget : 0,
                budgetType: modal.querySelector('#postJobBudgetType').value,
                experienceLevel: modal.querySelector('#postJobExperience').value,
                location: modal.querySelector('#postJobLocation').value.trim() || 'Online',
                quantity: Number(modal.querySelector('#postJobQuantity').value) || 1,
                deadline,
                saveAsDraft
            };

            const btn = modal.querySelector(saveAsDraft ? '#btnSaveDraftJob' : '#btnSubmitJob');
            const original = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm" style="margin-right:8px;"></span> Đang lưu...';

            postJson('/Home/SaveBusinessJobPost', payload)
                .then(data => {
                    if (data.success) {
                        closeModal(modal);
                        showToast(data.message || 'Đã lưu tin tuyển dụng.', 'success');
                        if (currentSidebarMode === 'businessJobs') loadBusinessJobs();
                    } else {
                        showToast(data.message || 'Không thể lưu tin tuyển dụng.', 'error');
                        btn.disabled = false;
                        btn.innerHTML = original;
                    }
                })
                .catch(err => {
                    console.error(err);
                    showToast('Không thể kết nối đến máy chủ.', 'error');
                    btn.disabled = false;
                    btn.innerHTML = original;
                });
        };

        modal.querySelector('#btnSubmitJob').addEventListener('click', () => submitBusinessJob(false));
        modal.querySelector('#btnSaveDraftJob').addEventListener('click', () => submitBusinessJob(true));
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


