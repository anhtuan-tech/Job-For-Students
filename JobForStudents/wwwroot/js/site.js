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
    let activeChatUserId = null;
    let reviewsFilter = 'all';
    let studentProjectsPage = 1;
    let studentProjectsPageSize = Number(localStorage.getItem('j4s_pagesize_studentProjects')) || 10;
    let studentProjectsList = [];
    let managedJobsPage = 1;
    let managedJobsList = [];
    let managedJobsSummary = {};
    let candidateSearchPage = 1;
    let candidateSearchList = [];
    let businessReviewsPage = 1;
    let businessReviewsList = [];
    let newApplicantsPage = 1;
    let newApplicantsList = [];
    let newApplicantsTotal = 0;
    let paymentHistoryPage = 1;

    let profileState = {
        avatar: '',
        cover: '',
        bio: '',
        skills: [],
        portfolio: [],
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
            renderBusinessRightSidebarLoading();
            loadBusinessHomeData();
        }

        // Remove the hide styles before saving original HTML to prevent them from being restored
        const hideStylePre = document.getElementById('j4s-hide-main');
        if (hideStylePre) hideStylePre.remove();
        const hideStyleAdminPre = document.getElementById('j4s-hide-admin');
        if (hideStyleAdminPre) hideStyleAdminPre.remove();

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
        updateUnreadMessagesBadge();
        setInterval(updateUnreadMessagesBadge, 10000);
        setInterval(updateNotificationBadge, 10000);
        setInterval(pollActiveChat, 4000);

        try {
            if (isBusiness) {
                bindBusinessSidebarNav();
                // Delay tab restore so Dashboard.cshtml inline scripts (renderBusinessWalletDeposit etc.) finish defining
                const _restoreBizTab = () => {
                    const activeTab = localStorage.getItem('j4s_active_tab') || 'home';
                    const targetSidebarItem = document.querySelector(`.business-dashboard-shell .sidebar-item[data-nav="${activeTab}"]`);
                    if (targetSidebarItem) {
                        targetSidebarItem.click();
                    } else {
                        renderBusinessEmployerHome();
                    }
                };
                // If wallet-related tabs, poll until Dashboard.cshtml wallet functions are ready (max 2s)
                const _savedTab = localStorage.getItem('j4s_active_tab') || 'home';
                const _walletTabs = ['wallet-business', 'wallet-current', 'wallet-deposit', 'wallet-history'];
                if (_walletTabs.includes(_savedTab)) {
                    let _pollCount = 0;
                    const _pollReady = setInterval(() => {
                        const _fnReady = (
                            (_savedTab === 'wallet-business' && typeof window.renderBusinessWalletDeposit === 'function') ||
                            (_savedTab === 'wallet-current' && typeof window.renderBusinessWalletCurrent === 'function') ||
                            (_savedTab === 'wallet-deposit' && typeof window.renderBusinessWalletDeposit === 'function') ||
                            (_savedTab === 'wallet-history' && typeof window.renderBusinessWalletHistory === 'function')
                        );
                        if (_fnReady || ++_pollCount > 20) {
                            clearInterval(_pollReady);
                            _restoreBizTab();
                        }
                    }, 100);
                } else {
                    _restoreBizTab();
                }
            } else {
                const activeTab = localStorage.getItem('j4s_active_tab') || 'home';
                const targetSidebarItem = document.querySelector(`.sidebar-item[data-nav="${activeTab}"]:not(.business-dashboard-shell *)`);
                if (targetSidebarItem && activeTab !== 'home') {
                    targetSidebarItem.click();
                }
            }
        } catch (err) {
            console.error("Tab restore error:", err);
        } finally {
            const hideStyle = document.getElementById('j4s-hide-main');
            if (hideStyle) {
                hideStyle.remove();
            }
        }
    }

    function hasActivePackage() {
        return document.getElementById('userProfile')?.dataset.hasActivePackage === 'true';
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
        if (navRight && userProfile && !document.getElementById('btnBusinessPublicJobs')) {
            const userId = userProfile.dataset.userId;
            const publicJobsBtn = document.createElement('a');
            publicJobsBtn.href = userId ? `/business/${userId}/jobs` : '#';
            publicJobsBtn.className = 'btn-find-freelancer me-2';
            publicJobsBtn.id = 'btnBusinessPublicJobs';
            publicJobsBtn.style.textDecoration = 'none';
            publicJobsBtn.innerHTML = '<i data-lucide="briefcase" style="width:14px;height:14px;"></i> Xem trang việc làm';
            navRight.insertBefore(publicJobsBtn, userProfile.closest('.dropdown'));
        }

        const roleLabel = document.querySelector('#userProfile .user-role');
        if (roleLabel) roleLabel.textContent = 'Nhà tuyển dụng';

        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            const activePkg = hasActivePackage();
            if (!activePkg) {
                sidebar.innerHTML = `
                    <div class="sidebar-group">
                        <div class="sidebar-label">TỔNG QUAN</div>
                        <a href="#" class="sidebar-item active" data-nav="home" id="navHome">
                            <span class="item-icon"><i data-lucide="home" style="width:18px;height:18px;"></i></span>
                            Trang chủ
                        </a>
                    </div>
                    <div class="sidebar-group">
                        <div class="sidebar-label">CHI PHÍ & DỊCH VỤ</div>
                        <a href="#" class="sidebar-item" data-nav="wallet-business" id="navBusinessWallet">
                            <span class="item-icon"><i data-lucide="wallet" style="width:18px;height:18px;"></i></span>
                            Ví doanh nghiệp
                        </a>
                        <a href="#" class="sidebar-item has-chevron" data-nav="servicePackages" id="navServicePackages">
                            <span class="item-icon"><i data-lucide="credit-card" style="width:18px;height:18px;"></i></span>
                            Gói dịch vụ & Thanh toán
                            <i data-lucide="chevron-right" class="sidebar-chevron" style="width:15px;height:15px;"></i>
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
                    </div>`;
            }
            else {
                sidebar.innerHTML = `
                    <div class="sidebar-group">
                        <div class="sidebar-label">TỔNG QUAN</div>
                        <a href="#" class="sidebar-item active" data-nav="home" id="navHome">
                            <span class="item-icon"><i data-lucide="home" style="width:18px;height:18px;"></i></span>
                            Trang chủ
                        </a>
                        <a href="#" class="sidebar-item" data-nav="profile" id="navBusinessProfile">
                            <span class="item-icon"><i data-lucide="building-2" style="width:18px;height:18px;"></i></span>
                            Hồ sơ doanh nghiệp
                        </a>
                    </div>
                    <div class="sidebar-group">
                        <div class="sidebar-label">QUẢN LÝ TUYỂN DỤNG</div>
                        <a href="#" class="sidebar-item" data-nav="businessJobs" id="navBusinessJobs">
                            <span class="item-icon"><i data-lucide="file-text" style="width:18px;height:18px;"></i></span>
                            Quản lý tin đăng
                        </a>
                        <a href="#" class="sidebar-item" data-nav="approveCandidates" id="navApproveCandidates">
                            <span class="item-icon"><i data-lucide="user-check" style="width:18px;height:18px;"></i></span>
                            Duyệt ứng viên
                        </a>
                        <a href="#" class="sidebar-item" data-nav="candidateSearch" id="navCandidateSearch">
                            <span class="item-icon"><i data-lucide="users" style="width:18px;height:18px;"></i></span>
                            Ứng viên
                        </a>
                    </div>
                    <div class="sidebar-group">
                        <div class="sidebar-label">CHI PHÍ & DỊCH VỤ</div>
                        <a href="#" class="sidebar-item" data-nav="wallet-business" id="navBusinessWallet">
                            <span class="item-icon"><i data-lucide="wallet" style="width:18px;height:18px;"></i></span>
                            Ví doanh nghiệp
                        </a>
                        <a href="#" class="sidebar-item has-chevron" data-nav="servicePackages" id="navServicePackages">
                            <span class="item-icon"><i data-lucide="credit-card" style="width:18px;height:18px;"></i></span>
                            Gói dịch vụ & Thanh toán
                            <i data-lucide="chevron-right" class="sidebar-chevron" style="width:15px;height:15px;"></i>
                        </a>
                    </div>
                    <div class="sidebar-group">
                        <div class="sidebar-label">TƯƠNG TÁC & ĐÁNH GIÁ</div>
                        <a href="#" class="sidebar-item" data-nav="messages" id="navMessages">
                            <span class="item-icon"><i data-lucide="message-square" style="width:18px;height:18px;"></i></span>
                            Tin nhắn
                        </a>
                        <a href="#" class="sidebar-item" data-nav="notifications" id="navNotifications">
                            <span class="item-icon"><i data-lucide="bell" style="width:18px;height:18px;"></i></span>
                            Thông báo
                        </a>
                        <a href="#" class="sidebar-item" data-nav="reviews-business" id="navBusinessReviews">
                            <span class="item-icon"><i data-lucide="star" style="width:18px;height:18px;"></i></span>
                            Đánh giá
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
                        <button class="btn-post-job" id="btnPostJob" style="background:linear-gradient(135deg,#2563eb,#0ea5e9);color:#fff;border:none;">
                            <i data-lucide="plus" style="width:18px;height:18px;"></i>
                            Đăng tin tuyển dụng
                        </button>
                    </div>`;
            }
        }

        if (window.lucide) lucide.createIcons();

        // Wire up sidebar post-job button → open modal
        const btnPostJobEl = document.getElementById('btnPostJob');
        if (btnPostJobEl) {
            btnPostJobEl.dataset.bound = '1';
            btnPostJobEl.addEventListener('click', () => openPostJobModal());
        }
        updateUnreadMessagesBadge();
    }

    function bindBusinessSidebarNav() {
        document.querySelectorAll('.business-dashboard-shell .sidebar-item[data-nav]').forEach(item => {
            item.addEventListener('click', e => {
                e.preventDefault();
                const nav = item.dataset.nav;
                setActiveSidebar(nav);
                currentSidebarMode = nav;
                localStorage.setItem('j4s_active_tab', nav);
                if (searchInput) searchInput.value = '';

                switch (nav) {
                    case 'home':
                        renderBusinessEmployerHome();
                        break;
                    case 'businessJobs':
                        renderBusinessJobsManagement();
                        break;
                    case 'approveCandidates':
                        renderApproveCandidatesView();
                        break;
                    case 'candidateSearch':
                        renderCandidateSearchView();
                        break;
                    case 'servicePackages':
                        renderServicePackagesView();
                        break;
                    case 'wallet-business':
                        if (typeof window.renderBusinessWalletDeposit === 'function') {
                            window.renderBusinessWalletDeposit();
                        } else {
                            // Function defined later in Dashboard.cshtml — retry after scripts load
                            let _wRetry = 0;
                            const _wInterval = setInterval(() => {
                                if (typeof window.renderBusinessWalletDeposit === 'function') {
                                    clearInterval(_wInterval);
                                    window.renderBusinessWalletDeposit();
                                } else if (++_wRetry > 20) {
                                    clearInterval(_wInterval);
                                }
                            }, 100);
                        }
                        break;
                    case 'notifications':
                        renderNotificationsView();
                        break;
                    case 'reviews-business':
                        renderBusinessReviewsView();
                        break;
                    case 'messages':
                        renderMessagesView();
                        break;
                    case 'support':
                        renderBusinessSupportView();
                        break;
                    case 'feedback':
                        renderBusinessFeedbackView();
                        break;
                    case 'profile':
                        renderProfileView();
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
        const cards = document.querySelectorAll('.category-card[data-category]');
        cards.forEach(card => {
            card.addEventListener('click', function () {
                const cat = this.dataset.category;
                if (!isBusinessAccount()) {
                    const findTab = document.getElementById('navFindJob');
                    if (findTab) {
                        window.pendingSearchCategory = cat;
                        findTab.click();
                    }
                    return;
                }
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
        const select = document.getElementById('filterCategory');
        if (!select) return;
        select.addEventListener('change', function () {
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
                localStorage.setItem('j4s_active_tab', nav);

                // Handle right sidebar display for students
                if (!isBusinessAccount()) {
                    const rs = document.getElementById('rightSidebar');
                    if (rs) {
                        rs.style.display = ''; // always show
                    }
                }

                switch (nav) {
                    case 'home':
                        restoreHomeView();
                        renderJobs(allJobs);
                        break;
                    case 'find':
                        renderFindJobView();
                        searchInput.focus();
                        break;
                    case 'saved':
                        renderSavedJobsView();
                        break;
                    case 'applied':
                        renderAppliedJobsView();
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
                    case 'notifications':
                        renderNotificationsView();
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
                    case 'wallet-business':
                        if (typeof window.renderBusinessWalletDeposit === 'function') {
                            window.renderBusinessWalletDeposit();
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
                    case 'help':
                        renderHelpView();
                        break;
                    case 'feedback':
                        renderFeedbackView();
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
        bindBannerButtons();
        bindCategoryCards();
        bindFilterSelect();
    }

    function renderGenericPaginationControls(paginationEl, total, totalPages, currentPage, pageSize, onPageSizeChange, onPageChange, storageKey = 'j4s_pagesize') {
        if (!paginationEl) return;
        if (totalPages <= 1) {
            paginationEl.innerHTML = `
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:0.85rem;color:#64748b;">Hiển thị:</span>
                    <select class="fj-pagesize-select" style="border:1px solid #e2e8f0;border-radius:8px;padding:4px 8px;font-size:0.85rem;outline:none;background:#fff;cursor:pointer;">
                        ${[5, 10, 15, 20, 30, 50].map(sz => `<option value="${sz}" ${sz === pageSize ? 'selected' : ''}>${sz}</option>`).join('')}
                    </select>
                    <span style="font-size:0.85rem;color:#64748b;">/ trang</span>
                </div>
                <div style="font-size:0.85rem;color:#64748b;font-weight:500;">
                    Hiển thị từ 1 đến ${total} trong tổng số ${total}
                </div>
            `;
        } else {
            paginationEl.innerHTML = `
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:0.85rem;color:#64748b;">Hiển thị:</span>
                    <select class="fj-pagesize-select" style="border:1px solid #e2e8f0;border-radius:8px;padding:4px 8px;font-size:0.85rem;outline:none;background:#fff;cursor:pointer;">
                        ${[5, 10, 15, 20, 30, 50].map(sz => `<option value="${sz}" ${sz === pageSize ? 'selected' : ''}>${sz}</option>`).join('')}
                    </select>
                    <span style="font-size:0.85rem;color:#64748b;">/ trang</span>
                </div>
                
                <div style="display:flex;align-items:center;gap:6px;">
                    <button class="fj-prev-btn" ${currentPage === 1 ? 'disabled' : ''} style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:6px 12px;cursor:${currentPage === 1 ? 'not-allowed' : 'pointer'};color:${currentPage === 1 ? '#cbd5e1' : '#475569'};font-size:0.85rem;font-weight:600;display:flex;align-items:center;gap:4px;">
                        <i data-lucide="chevron-left" style="width:14px;height:14px;"></i> Trước
                    </button>
                    <span style="font-size:0.85rem;color:#475569;font-weight:600;padding:0 8px;">Trang ${currentPage} / ${totalPages}</span>
                    <button class="fj-next-btn" ${currentPage === totalPages ? 'disabled' : ''} style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:6px 12px;cursor:${currentPage === totalPages ? 'not-allowed' : 'pointer'};color:${currentPage === totalPages ? '#cbd5e1' : '#475569'};font-size:0.85rem;font-weight:600;display:flex;align-items:center;gap:4px;">
                        Sau <i data-lucide="chevron-right" style="width:14px;height:14px;"></i>
                    </button>
                </div>

                <div style="font-size:0.85rem;color:#64748b;font-weight:500;">
                    Hiển thị từ ${(currentPage - 1) * pageSize + 1} đến ${Math.min(currentPage * pageSize, total)} trong tổng số ${total}
                </div>
            `;
        }

        if (window.lucide) lucide.createIcons();

        paginationEl.querySelector('.fj-pagesize-select')?.addEventListener('change', function () {
            const newSize = Number(this.value);
            localStorage.setItem(storageKey, newSize);
            onPageSizeChange(newSize);
        });

        paginationEl.querySelector('.fj-prev-btn')?.addEventListener('click', function () {
            if (currentPage > 1) {
                onPageChange(currentPage - 1);
            }
        });

        paginationEl.querySelector('.fj-next-btn')?.addEventListener('click', function () {
            if (currentPage < totalPages) {
                onPageChange(currentPage + 1);
            }
        });
    }

    // ============================================
    // STUDENT VIEWS — Tìm việc / Đã lưu / Đã ứng tuyển
    // ============================================

    function renderFindJobView() {
        if (!mainContent) return;
        mainContent.innerHTML = `
            <!-- Page Header -->
            <div class="animate-in" style="margin-bottom:24px;">
                <h1 style="font-size:1.5rem;font-weight:800;color:#0f172a;margin:0 0 4px;display:flex;align-items:center;gap:10px;">
                    <span style="background:#eff6ff;color:#2563eb;border-radius:12px;padding:8px 10px;display:inline-flex;"><i data-lucide="search" style="width:20px;height:20px;"></i></span>
                    Tìm việc
                </h1>
                <p style="color:#64748b;font-size:0.9rem;margin:0;">Khám phá hàng trăm công việc freelance phù hợp với kỹ năng của bạn.</p>
            </div>

            <!-- Search Bar -->
            <div style="background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:16px 20px;margin-bottom:18px;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                <div style="display:flex;gap:10px;align-items:center;">
                    <div style="position:relative;flex:1;">
                        <i data-lucide="search" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);width:17px;height:17px;color:#94a3b8;pointer-events:none;"></i>
                        <input id="fjKeyword" type="text" placeholder="Tên công việc, kỹ năng, từ khóa..." style="width:100%;border:1px solid #e2e8f0;border-radius:12px;padding:11px 14px 11px 40px;font-size:0.9rem;outline:none;font-family:'Inter',sans-serif;transition:border-color 0.2s;"
                            onfocus="this.style.borderColor='#2563eb'" onblur="this.style.borderColor='#e2e8f0'" />
                    </div>
                </div>
            </div>

            <!-- Filters Row -->
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px;align-items:flex-end;">
                <div style="flex:1;min-width:160px;">
                    <label style="font-size:0.75rem;font-weight:700;color:#64748b;display:block;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.04em;">Ngành nghề</label>
                    <select id="fjCategory" style="width:100%;border:1px solid #e2e8f0;border-radius:10px;padding:9px 12px;font-size:0.85rem;color:#334155;outline:none;background:#fff;cursor:pointer;">
                        <option value="">Đang tải...</option>
                    </select>
                </div>

                <!-- Mức lương -->
                <div style="flex:1;min-width:160px;">
                    <label style="font-size:0.75rem;font-weight:700;color:#64748b;display:block;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.04em;">Mức lương (đ)</label>
                    <select id="fjBudget" style="width:100%;border:1px solid #e2e8f0;border-radius:10px;padding:9px 12px;font-size:0.85rem;color:#334155;outline:none;background:#fff;cursor:pointer;">
                        <option value="">Tất cả mức</option>
                        <option value="0-500000">Dưới 500k</option>
                        <option value="500000-2000000">500k – 2 triệu</option>
                        <option value="2000000-5000000">2 – 5 triệu</option>
                        <option value="5000000-10000000">5 – 10 triệu</option>
                        <option value="10000000-">Trên 10 triệu</option>
                    </select>
                </div>

                <!-- Thời gian đăng -->
                <div style="flex:1;min-width:160px;">
                    <label style="font-size:0.75rem;font-weight:700;color:#64748b;display:block;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.04em;">Thời gian đăng</label>
                    <select id="fjDaysAgo" style="width:100%;border:1px solid #e2e8f0;border-radius:10px;padding:9px 12px;font-size:0.85rem;color:#334155;outline:none;background:#fff;cursor:pointer;">
                        <option value="">Tất cả thời gian</option>
                        <option value="1">Hôm nay</option>
                        <option value="3">3 ngày gần đây</option>
                        <option value="7">Tuần này</option>
                        <option value="30">Tháng này</option>
                    </select>
                </div>

                <!-- Kinh nghiệm -->
                <div style="flex:1;min-width:160px;">
                    <label style="font-size:0.75rem;font-weight:700;color:#64748b;display:block;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.04em;">Kinh nghiệm</label>
                    <select id="fjExperience" style="width:100%;border:1px solid #e2e8f0;border-radius:10px;padding:9px 12px;font-size:0.85rem;color:#334155;outline:none;background:#fff;cursor:pointer;">
                        <option value="">Tất cả cấp độ</option>
                        <option value="No_Experience">🌱 Không cần kinh nghiệm</option>
                        <option value="Mid_Level">⭐ Có kinh nghiệm</option>
                        <option value="Expert">🏆 Chuyên gia</option>
                    </select>
                </div>

                <!-- Sắp xếp -->
                <div style="flex:1;min-width:150px;">
                    <label style="font-size:0.75rem;font-weight:700;color:#64748b;display:block;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.04em;">Sắp xếp</label>
                    <select id="fjSort" style="width:100%;border:1px solid #e2e8f0;border-radius:10px;padding:9px 12px;font-size:0.85rem;color:#334155;outline:none;background:#fff;cursor:pointer;">
                        <option value="newest">Mới nhất</option>
                        <option value="budget_desc">Lương cao nhất</option>
                        <option value="budget_asc">Lương thấp nhất</option>
                        <option value="applicants">Nhiều ứng tuyển nhất</option>
                    </select>
                </div>

                <!-- Reset -->
                <button id="fjReset" title="Xóa bộ lọc" style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:10px;padding:9px 14px;cursor:pointer;color:#64748b;font-size:0.85rem;white-space:nowrap;display:flex;align-items:center;gap:5px;transition:all 0.2s;"
                    onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'">
                    <i data-lucide="x" style="width:14px;height:14px;"></i> Xóa lọc
                </button>
            </div>

            <!-- Results Summary & Count -->
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                <div id="fjCount" style="font-size:0.85rem;color:#64748b;font-weight:600;"></div>
                <div id="fjActiveFilters" style="display:flex;gap:6px;flex-wrap:wrap;"></div>
            </div>

            <!-- Results Container -->
            <div id="fjResults" style="display:flex;flex-direction:column;gap:14px;">
                <div style="text-align:center;padding:50px;color:#94a3b8;">
                    <span class="spinner-border spinner-border-sm" style="margin-right:8px;"></span> Đang tải danh sách việc làm...
                </div>
            </div>
            
            <!-- Pagination Container -->
            <div id="fjPagination" style="display:flex;align-items:center;justify-content:space-between;margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;flex-wrap:wrap;gap:12px;"></div>`;

        if (window.lucide) lucide.createIcons();

        function buildUrl() {
            const term = document.getElementById('fjKeyword')?.value.trim() || '';
            let cat = document.getElementById('fjCategory')?.value || '';
            if (!cat && window.pendingSearchCategory) {
                cat = window.pendingSearchCategory;
            }
            const budgetVal = document.getElementById('fjBudget')?.value || '';
            const daysAgo = document.getElementById('fjDaysAgo')?.value || '';
            const exp = document.getElementById('fjExperience')?.value || '';
            const sort = document.getElementById('fjSort')?.value || 'newest';

            const params = new URLSearchParams();
            if (term) params.set('searchTerm', term);
            if (cat) params.set('category', cat);
            if (daysAgo) params.set('daysAgo', daysAgo);
            if (exp) params.set('experienceLevel', exp);
            if (sort) params.set('sortBy', sort);
            if (budgetVal) {
                const [min, max] = budgetVal.split('-');
                if (min) params.set('minBudget', min);
                if (max) params.set('maxBudget', max);
            }
            return '/Home/SearchJobs?' + params.toString();
        }

        function updateActiveFilters() {
            const container = document.getElementById('fjActiveFilters');
            if (!container) return;
            const tags = [];
            let cat = document.getElementById('fjCategory')?.value;
            if (!cat && window.pendingSearchCategory) {
                cat = window.pendingSearchCategory;
            }
            const budget = document.getElementById('fjBudget');
            const daysAgo = document.getElementById('fjDaysAgo');
            const exp = document.getElementById('fjExperience');
            if (cat) tags.push(cat);
            if (budget?.value) tags.push(budget.options[budget.selectedIndex].text);
            if (daysAgo?.value) tags.push(daysAgo.options[daysAgo.selectedIndex].text);
            if (exp?.value) tags.push(exp.options[exp.selectedIndex].text);

            container.innerHTML = tags.map(t =>
                `<span style="background:#eff6ff;color:#2563eb;font-size:0.75rem;font-weight:600;padding:3px 10px;border-radius:20px;">${escapeHtml(t)}</span>`
            ).join('');
        }

        let lastJobsSignature = '';
        let currentPage = 1;
        let pageSize = Number(localStorage.getItem('j4s_pagesize')) || 10;
        let activeJobsList = [];

        function doSearch() {
            const results = document.getElementById('fjResults');
            const countEl = document.getElementById('fjCount');
            const paginationEl = document.getElementById('fjPagination');
            if (!results) return;
            results.innerHTML = '<div style="text-align:center;padding:50px;color:#94a3b8;"><span class="spinner-border spinner-border-sm" style="margin-right:8px;"></span> Đang tìm kiếm...</div>';
            if (countEl) countEl.textContent = '';
            updateActiveFilters();

            fetch(buildUrl())
                .then(r => r.json())
                .then(jobs => {
                    if (!jobs || !jobs.length) {
                        lastJobsSignature = '';
                        activeJobsList = [];
                        results.innerHTML = `
                            <div style="text-align:center;padding:70px 20px;">
                                <div style="font-size:3.5rem;margin-bottom:14px;">🔍</div>
                                <h3 style="color:#1e293b;font-weight:700;margin-bottom:8px;">Không tìm thấy việc làm phù hợp</h3>
                                <p style="color:#64748b;max-width:360px;margin:0 auto;">Hãy thử thay đổi từ khóa hoặc bỏ bớt bộ lọc.</p>
                            </div>`;
                        if (countEl) countEl.textContent = '0 kết quả';
                        if (paginationEl) paginationEl.innerHTML = '';
                        return;
                    }
                    lastJobsSignature = jobs.map(j => `${j.id}_${j.applicantsCount}_${j.isSaved}_${j.isApplied}`).join(',');
                    activeJobsList = jobs;
                    renderPaginatedJobs();
                })
                .catch(() => {
                    results.innerHTML = '<div style="text-align:center;padding:60px;color:#ef4444;">⚠️ Lỗi khi tải dữ liệu. Vui lòng thử lại.</div>';
                });
        }

        function doSearchBackground() {
            const results = document.getElementById('fjResults');
            if (!results) {
                if (window.findJobIntervalId) {
                    clearInterval(window.findJobIntervalId);
                    window.findJobIntervalId = null;
                }
                return;
            }

            fetch(buildUrl())
                .then(r => r.json())
                .then(jobs => {
                    const signature = jobs ? jobs.map(j => `${j.id}_${j.applicantsCount}_${j.isSaved}_${j.isApplied}`).join(',') : '';
                    if (signature !== lastJobsSignature) {
                        lastJobsSignature = signature;
                        activeJobsList = jobs || [];
                        renderPaginatedJobs();
                    }
                })
                .catch(err => console.warn('Background job poll failed:', err));
        }

        function renderPaginatedJobs() {
            const results = document.getElementById('fjResults');
            const countEl = document.getElementById('fjCount');
            const paginationEl = document.getElementById('fjPagination');
            if (!results) return;

            if (!activeJobsList || !activeJobsList.length) {
                results.innerHTML = `
                    <div style="text-align:center;padding:70px 20px;">
                        <div style="font-size:3.5rem;margin-bottom:14px;">🔍</div>
                        <h3 style="color:#1e293b;font-weight:700;margin-bottom:8px;">Không tìm thấy việc làm phù hợp</h3>
                        <p style="color:#64748b;max-width:360px;margin:0 auto;">Hãy thử thay đổi từ khóa hoặc bỏ bớt bộ lọc.</p>
                    </div>`;
                if (countEl) countEl.textContent = '0 kết quả';
                if (paginationEl) paginationEl.innerHTML = '';
                return;
            }

            const total = activeJobsList.length;
            const totalPages = Math.ceil(total / pageSize);
            if (currentPage > totalPages) {
                currentPage = Math.max(1, totalPages);
            }

            if (countEl) {
                countEl.textContent = `${total} việc làm phù hợp`;
            }

            const startIndex = (currentPage - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const pageJobs = activeJobsList.slice(startIndex, endIndex);

            results.innerHTML = pageJobs.map(job => renderJobCard(job)).join('');
            if (window.lucide) lucide.createIcons();
            bindJobCardClicks();

            if (paginationEl) {
                if (totalPages <= 1) {
                    paginationEl.innerHTML = `
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span style="font-size:0.85rem;color:#64748b;">Hiển thị:</span>
                            <select id="fjPageSize" style="border:1px solid #e2e8f0;border-radius:8px;padding:4px 8px;font-size:0.85rem;outline:none;background:#fff;cursor:pointer;">
                                ${[5, 10, 15, 20, 30, 50].map(sz => `<option value="${sz}" ${sz === pageSize ? 'selected' : ''}>${sz}</option>`).join('')}
                            </select>
                            <span style="font-size:0.85rem;color:#64748b;">/ trang</span>
                        </div>
                        <div style="font-size:0.85rem;color:#64748b;font-weight:500;">
                            Hiển thị từ ${startIndex + 1} đến ${Math.min(endIndex, total)} trong tổng số ${total}
                        </div>
                    `;
                } else {
                    paginationEl.innerHTML = `
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span style="font-size:0.85rem;color:#64748b;">Hiển thị:</span>
                            <select id="fjPageSize" style="border:1px solid #e2e8f0;border-radius:8px;padding:4px 8px;font-size:0.85rem;outline:none;background:#fff;cursor:pointer;">
                                ${[5, 10, 15, 20, 30, 50].map(sz => `<option value="${sz}" ${sz === pageSize ? 'selected' : ''}>${sz}</option>`).join('')}
                            </select>
                            <span style="font-size:0.85rem;color:#64748b;">/ trang</span>
                        </div>
                        
                        <div style="display:flex;align-items:center;gap:6px;">
                            <button id="fjPrevPage" ${currentPage === 1 ? 'disabled' : ''} style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:6px 12px;cursor:${currentPage === 1 ? 'not-allowed' : 'pointer'};color:${currentPage === 1 ? '#cbd5e1' : '#475569'};font-size:0.85rem;font-weight:600;display:flex;align-items:center;gap:4px;">
                                <i data-lucide="chevron-left" style="width:14px;height:14px;"></i> Trước
                            </button>
                            <span style="font-size:0.85rem;color:#475569;font-weight:600;padding:0 8px;">Trang ${currentPage} / ${totalPages}</span>
                            <button id="fjNextPage" ${currentPage === totalPages ? 'disabled' : ''} style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:6px 12px;cursor:${currentPage === totalPages ? 'not-allowed' : 'pointer'};color:${currentPage === totalPages ? '#cbd5e1' : '#475569'};font-size:0.85rem;font-weight:600;display:flex;align-items:center;gap:4px;">
                                Sau <i data-lucide="chevron-right" style="width:14px;height:14px;"></i>
                            </button>
                        </div>

                        <div style="font-size:0.85rem;color:#64748b;font-weight:500;">
                            Hiển thị từ ${startIndex + 1} đến ${Math.min(endIndex, total)} trong tổng số ${total}
                        </div>
                    `;
                }

                if (window.lucide) lucide.createIcons();

                document.getElementById('fjPageSize')?.addEventListener('change', function () {
                    pageSize = Number(this.value);
                    currentPage = 1;
                    renderPaginatedJobs();
                });

                document.getElementById('fjPrevPage')?.addEventListener('click', function () {
                    if (currentPage > 1) {
                        currentPage--;
                        renderPaginatedJobs();
                        document.getElementById('mainContent')?.scrollIntoView({ behavior: 'smooth' });
                    }
                });

                document.getElementById('fjNextPage')?.addEventListener('click', function () {
                    if (currentPage < totalPages) {
                        currentPage++;
                        renderPaginatedJobs();
                        document.getElementById('mainContent')?.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            }
        }

        // Bind events
        let debounceTimer;
        document.getElementById('fjKeyword')?.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            currentPage = 1;
            debounceTimer = setTimeout(doSearch, 300);
        });
        ['fjCategory', 'fjBudget', 'fjDaysAgo', 'fjExperience', 'fjSort'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => {
                currentPage = 1;
                doSearch();
            });
        });
        document.getElementById('fjReset')?.addEventListener('click', () => {
            ['fjKeyword', 'fjCategory', 'fjBudget', 'fjDaysAgo', 'fjExperience'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            const sortEl = document.getElementById('fjSort');
            if (sortEl) sortEl.value = 'newest';
            const activeEl = document.getElementById('fjActiveFilters');
            if (activeEl) activeEl.innerHTML = '';
            currentPage = 1;
            doSearch();
        });

        // Fetch categories dynamically from database
        fetch('/Home/GetCategories')
            .then(r => r.json())
            .then(categories => {
                const select = document.getElementById('fjCategory');
                if (!select) return;
                let html = '<option value="">Tất cả ngành</option>';
                categories.forEach(cat => {
                    html += `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`;
                });

                if (window.pendingSearchCategory) {
                    const exists = categories.some(cat => cat.trim().toLowerCase() === window.pendingSearchCategory.trim().toLowerCase());
                    if (!exists) {
                        html += `<option value="${escapeHtml(window.pendingSearchCategory)}">${escapeHtml(window.pendingSearchCategory)}</option>`;
                    }
                }
                select.innerHTML = html;

                if (window.pendingSearchCategory) {
                    const matchedOption = Array.from(select.options).find(opt =>
                        opt.value.trim().toLowerCase() === window.pendingSearchCategory.trim().toLowerCase()
                    );
                    if (matchedOption) {
                        select.value = matchedOption.value;
                    } else {
                        const matchedTextOption = Array.from(select.options).find(opt =>
                            opt.text.toLowerCase().includes(window.pendingSearchCategory.toLowerCase())
                        );
                        if (matchedTextOption) {
                            select.value = matchedTextOption.value;
                        }
                    }
                    window.pendingSearchCategory = null;
                }
                doSearch();
            })
            .catch(err => {
                console.error(err);
                const select = document.getElementById('fjCategory');
                if (select) select.innerHTML = '<option value="">Tất cả ngành</option>';
                doSearch();
            });

        if (window.findJobIntervalId) {
            clearInterval(window.findJobIntervalId);
        }
        window.findJobIntervalId = setInterval(doSearchBackground, 5000);
    }

    function renderSavedJobsView() {
        if (!mainContent) return;

        let currentPage = 1;
        let pageSize = Number(localStorage.getItem('j4s_pagesize_studentSavedJobs')) || 10;
        let activeJobs = [];

        mainContent.innerHTML = `
            <div class="page-header animate-in" style="margin-bottom:24px;">
                <h1 style="font-size:1.5rem;font-weight:800;color:#0f172a;margin:0 0 6px;"><i data-lucide="bookmark" style="width:22px;height:22px;vertical-align:middle;margin-right:8px;"></i>Việc đã lưu</h1>
                <p style="color:#64748b;font-size:0.9rem;margin:0;">Danh sách các công việc bạn đã đánh dấu để xem lại sau.</p>
            </div>
            <div id="savedJobResults" style="display:flex;flex-direction:column;gap:14px;">
                <div style="text-align:center;padding:40px;color:#94a3b8;"><span class="spinner-border spinner-border-sm" style="margin-right:8px;"></span> Đang tải...</div>
            </div>
            <div id="savedJobPagination" style="display:flex;align-items:center;justify-content:space-between;margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;flex-wrap:wrap;gap:12px;"></div>`;
        if (window.lucide) lucide.createIcons();

        function renderPage() {
            const results = document.getElementById('savedJobResults');
            const paginationEl = document.getElementById('savedJobPagination');
            if (!results) return;

            if (!activeJobs.length) {
                results.innerHTML = `<div style="text-align:center;padding:60px;">
                    <div style="font-size:3rem;margin-bottom:12px;">🔖</div>
                    <h3 style="color:#1e293b;font-weight:700;margin-bottom:8px;">Chưa có việc làm nào được lưu</h3>
                    <p style="color:#64748b;">Bấm vào icon bookmark trên các tin để lưu lại.</p>
                </div>`;
                if (paginationEl) paginationEl.innerHTML = '';
                return;
            }

            const total = activeJobs.length;
            const totalPages = Math.ceil(total / pageSize);
            if (currentPage > totalPages) currentPage = Math.max(1, totalPages);

            const startIndex = (currentPage - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const pageJobs = activeJobs.slice(startIndex, endIndex);

            results.innerHTML = pageJobs.map(job => renderJobCard(job)).join('');
            if (window.lucide) lucide.createIcons();
            bindJobCardClicks();

            if (paginationEl) {
                renderGenericPaginationControls(paginationEl, total, totalPages, currentPage, pageSize, (newSize) => {
                    pageSize = newSize;
                    currentPage = 1;
                    renderPage();
                }, (newPage) => {
                    currentPage = newPage;
                    renderPage();
                    document.getElementById('mainContent')?.scrollIntoView({ behavior: 'smooth' });
                }, 'j4s_pagesize_studentSavedJobs');
            }
        }

        fetch('/Home/GetSavedJobs')
            .then(r => r.json())
            .then(data => {
                activeJobs = Array.isArray(data) ? data : (data.jobs || []);
                renderPage();
            })
            .catch(() => {
                const results = document.getElementById('savedJobResults');
                if (results) results.innerHTML = '<div style="text-align:center;padding:60px;color:#ef4444;">Lỗi khi tải dữ liệu.</div>';
            });
    }

    function renderAppliedJobsView() {
        if (!mainContent) return;

        let currentPage = 1;
        let pageSize = Number(localStorage.getItem('j4s_pagesize_studentAppliedJobs')) || 10;
        let activeJobs = [];

        mainContent.innerHTML = `
            <div class="page-header animate-in" style="margin-bottom:24px;">
                <h1 style="font-size:1.5rem;font-weight:800;color:#0f172a;margin:0 0 6px;"><i data-lucide="send" style="width:22px;height:22px;vertical-align:middle;margin-right:8px;"></i>Đã ứng tuyển</h1>
                <p style="color:#64748b;font-size:0.9rem;margin:0;">Theo dõi trạng thái các vị trí bạn đã nộp hồ sơ.</p>
            </div>
            <div id="appliedJobResults" style="display:flex;flex-direction:column;gap:14px;">
                <div style="text-align:center;padding:40px;color:#94a3b8;"><span class="spinner-border spinner-border-sm" style="margin-right:8px;"></span> Đang tải...</div>
            </div>
            <div id="appliedJobPagination" style="display:flex;align-items:center;justify-content:space-between;margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;flex-wrap:wrap;gap:12px;"></div>`;
        if (window.lucide) lucide.createIcons();

        function renderPage() {
            const results = document.getElementById('appliedJobResults');
            const paginationEl = document.getElementById('appliedJobPagination');
            if (!results) return;

            if (!activeJobs.length) {
                results.innerHTML = `<div style="text-align:center;padding:60px;">
                    <div style="font-size:3rem;margin-bottom:12px;">📋</div>
                    <h3 style="color:#1e293b;font-weight:700;margin-bottom:8px;">Bạn chưa ứng tuyển công việc nào</h3>
                    <p style="color:#64748b;">Hãy bắt đầu tìm việc và nộp hồ sơ ngay!</p>
                </div>`;
                if (paginationEl) paginationEl.innerHTML = '';
                return;
            }

            const total = activeJobs.length;
            const totalPages = Math.ceil(total / pageSize);
            if (currentPage > totalPages) currentPage = Math.max(1, totalPages);

            const startIndex = (currentPage - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const pageJobs = activeJobs.slice(startIndex, endIndex);

            results.innerHTML = pageJobs.map(job => renderAppliedJobCard(job)).join('');
            if (window.lucide) lucide.createIcons();
            bindJobCardClicks();

            if (paginationEl) {
                renderGenericPaginationControls(paginationEl, total, totalPages, currentPage, pageSize, (newSize) => {
                    pageSize = newSize;
                    currentPage = 1;
                    renderPage();
                }, (newPage) => {
                    currentPage = newPage;
                    renderPage();
                    document.getElementById('mainContent')?.scrollIntoView({ behavior: 'smooth' });
                }, 'j4s_pagesize_studentAppliedJobs');
            }
        }

        fetch('/Home/GetAppliedJobs')
            .then(r => r.json())
            .then(data => {
                activeJobs = Array.isArray(data) ? data : (data.jobs || []);
                renderPage();
            })
            .catch(() => {
                const results = document.getElementById('appliedJobResults');
                if (results) results.innerHTML = '<div style="text-align:center;padding:60px;color:#ef4444;">Lỗi khi tải dữ liệu.</div>';
            });
    }

    function renderJobCard(job) {
        const catColors = {
            'IT & Lập trình': { bg: '#eff6ff', color: '#2563eb', icon: 'code-2' },
            'Thiết kế & Đồ họa': { bg: '#ecfdf5', color: '#10b981', icon: 'palette' },
            'Viết lách & Dịch thuật': { bg: '#fffbeb', color: '#f59e0b', icon: 'languages' },
            'Sales & Marketing': { bg: '#fdf2f8', color: '#db2777', icon: 'megaphone' },
            'Video & Photography': { bg: '#faf5ff', color: '#9333ea', icon: 'video' }
        };
        const info = catColors[job.category] || { bg: '#f1f5f9', color: '#64748b', icon: 'briefcase' };
        const budget = (job.budget || 0).toLocaleString('vi-VN') + ' đ';
        const savedClass = job.isSaved ? 'color:#f59e0b' : 'color:#94a3b8';
        const appliedBadge = job.isApplied ? '<span style="background:#ecfdf5;color:#059669;font-size:0.7rem;font-weight:700;padding:2px 10px;border-radius:20px;margin-left:8px;">Đã ứng tuyển</span>' : '';
        return `
        <div class="job-card animate-in" data-job-id="${job.id}" style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:20px;display:flex;align-items:flex-start;gap:16px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.borderColor='#cbd5e1';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.06)'" onmouseout="this.style.borderColor='#e2e8f0';this.style.boxShadow='none'">
            <div style="background:${info.bg};color:${info.color};width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <i data-lucide="${info.icon}" style="width:22px;height:22px;"></i>
            </div>
            <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:6px;">
                    <h3 class="job-title" data-job-id="${job.id}" style="font-size:1rem;font-weight:700;color:#1e293b;margin:0;display:inline-flex;align-items:center;gap:8px;">${escapeHtml(job.title || '')}${job.isVip ? ' <span style="background:#f59e0b; color:#fff; font-size:0.65rem; font-weight:700; padding:2px 8px; border-radius:4px; vertical-align:middle; display:inline-block;">VIP</span>' : ''}</h3>${appliedBadge}
                    <span style="margin-left:auto;background:#f8fafc;border:1px solid #e2e8f0;font-size:0.7rem;font-weight:700;padding:2px 10px;border-radius:20px;color:#475569;text-transform:uppercase;">${escapeHtml(job.category || '')}</span>
                </div>
                <p style="font-size:0.85rem;color:#64748b;margin:0 0 10px;line-height:1.5;">${escapeHtml((job.description || '').substring(0, 120))}${(job.description || '').length > 120 ? '...' : ''}</p>
                <div style="display:flex;align-items:center;gap:16px;">
                    <span style="font-size:1.05rem;font-weight:800;color:#10b981;">${budget}</span>
                    <span style="font-size:0.8rem;color:#94a3b8;display:flex;align-items:center;gap:4px;"><i data-lucide="clock" style="width:13px;height:13px;"></i>${escapeHtml(job.deadline || '')}</span>
                    <span style="font-size:0.8rem;color:#94a3b8;display:flex;align-items:center;gap:4px;"><i data-lucide="users" style="width:13px;height:13px;"></i>Đã nhận: ${job.hiredCount || 0}/${job.quantity || 1} · ${job.applicantsCount || 0} ứng viên</span>
                    <button class="btn-save-job ${job.isSaved ? 'saved' : ''}" data-job-id="${job.id}" title="Lưu">
                        <i data-lucide="bookmark" style="width:18px;height:18px;"></i>
                    </button>
                </div>
            </div>
        </div>`;
    }

    function renderAppliedJobCard(job) {
        const statusMap = {
            'Pending': { label: 'Đang xét duyệt', bg: '#fffbeb', color: '#f59e0b' },
            'Reviewing': { label: 'Đang xét duyệt', bg: '#eff6ff', color: '#2563eb' },
            'Accepted': { label: 'Được nhận', bg: '#ecfdf5', color: '#059669' },
            'Hired': { label: 'Được nhận', bg: '#ecfdf5', color: '#059669' },
            'Rejected': { label: 'Từ chối', bg: '#fef2f2', color: '#dc2626' }
        };
        const status = statusMap[job.status] || statusMap['Pending'];
        const budget = (job.budget || 0).toLocaleString('vi-VN') + ' đ';
        const appliedDate = job.appliedDate ? new Date(job.appliedDate).toLocaleDateString('vi-VN') : '';

        // Setup timeline progress state variables
        let progressPercent = 0;
        let progressBarColor = '#e2e8f0';

        let step2Bg = '#fff';
        let step2Color = '#cbd5e1';
        let step2Border = '#cbd5e1';
        let step2Shadow = 'none';
        let step2Char = '2';
        let step2FontWeight = '500';
        let step2TextColor = '#94a3b8';

        let step3Bg = '#fff';
        let step3Color = '#cbd5e1';
        let step3Border = '#cbd5e1';
        let step3Shadow = 'none';
        let step3Char = '3';
        let step3Label = 'Kết quả';
        let step3FontWeight = '500';
        let step3TextColor = '#94a3b8';

        let showCancelBtn = false;

        if (job.status === 'Pending' || job.status === 'Reviewing') {
            progressPercent = 50;
            progressBarColor = '#2563eb';

            step2Bg = '#2563eb';
            step2Color = '#fff';
            step2Border = '#2563eb';
            step2Shadow = '0 0 0 4px #eff6ff';
            step2Char = '2';
            step2FontWeight = '700';
            step2TextColor = '#1e293b';

            showCancelBtn = true;
        } else if (job.status === 'Accepted' || job.status === 'Hired') {
            progressPercent = 100;
            progressBarColor = '#10b981';

            step2Bg = '#10b981';
            step2Color = '#fff';
            step2Border = '#10b981';
            step2Char = '✓';
            step2TextColor = '#64748b';

            step3Bg = '#10b981';
            step3Color = '#fff';
            step3Border = '#10b981';
            step3Shadow = '0 0 0 4px #ecfdf5';
            step3Char = '✓';
            step3Label = 'Được nhận';
            step3FontWeight = '700';
            step3TextColor = '#059669';
        } else if (job.status === 'Rejected') {
            progressPercent = 100;
            progressBarColor = '#ef4444';

            step2Bg = '#2563eb';
            step2Color = '#fff';
            step2Border = '#2563eb';
            step2Char = '✓';
            step2TextColor = '#64748b';

            step3Bg = '#ef4444';
            step3Color = '#fff';
            step3Border = '#ef4444';
            step3Shadow = '0 0 0 4px #fef2f2';
            step3Char = '✗';
            step3Label = 'Từ chối';
            step3FontWeight = '700';
            step3TextColor = '#dc2626';
        }

        return `
        <div class="job-card animate-in" data-job-id="${job.id}" style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:14px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.borderColor='#cbd5e1';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.06)'" onmouseout="this.style.borderColor='#e2e8f0';this.style.boxShadow='none'">
            <div style="display:flex;align-items:flex-start;gap:16px;width:100%;">
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <h3 class="job-title" data-job-id="${job.id}" style="font-size:1rem;font-weight:700;color:#1e293b;margin:0;flex:1;display:inline-flex;align-items:center;gap:8px;">${escapeHtml(job.title || '')}${job.isVip ? ' <span style="background:#f59e0b; color:#fff; font-size:0.65rem; font-weight:700; padding:2px 8px; border-radius:4px; vertical-align:middle; display:inline-block;">VIP</span>' : ''}</h3>
                        <span style="background:${status.bg};color:${status.color};font-size:0.75rem;font-weight:700;padding:3px 12px;border-radius:20px;white-space:nowrap;">${status.label}</span>
                    </div>
                    <p style="font-size:0.85rem;color:#64748b;margin:0 0 10px;line-height:1.5;">${escapeHtml((job.description || '').substring(0, 100))}${(job.description || '').length > 100 ? '...' : ''}</p>
                    <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
                        <span style="font-size:1rem;font-weight:800;color:#10b981;">${budget}</span>
                        ${appliedDate ? `<span style="font-size:0.8rem;color:#94a3b8;display:flex;align-items:center;gap:4px;"><i data-lucide="calendar" style="width:13px;height:13px;"></i>Đã ứng tuyển: ${appliedDate}</span>` : ''}
                        <span style="font-size:0.8rem;color:#94a3b8;display:flex;align-items:center;gap:4px;"><i data-lucide="building-2" style="width:13px;height:13px;"></i>${escapeHtml(job.businessName || '')}</span>
                        <span style="font-size:0.8rem;color:#94a3b8;display:flex;align-items:center;gap:4px;"><i data-lucide="users" style="width:13px;height:13px;"></i>Đã nhận: ${job.hiredCount || 0}/${job.quantity || 1} · ${job.applicantsCount || 0} ứng viên</span>
                        ${showCancelBtn ? `
                        <button class="btn-cancel-apply" data-job-id="${job.id}" style="background:#fff; border:1px solid #ef4444; color:#ef4444; border-radius:8px; padding:6px 12px; font-size:0.8rem; font-weight:600; cursor:pointer; transition:all 0.2s; display:inline-flex; align-items:center; gap:4px; margin-left:auto;"
                                onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='#fff'">
                            <i data-lucide="x-circle" style="width:14px;height:14px;"></i> Hủy ứng tuyển
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <!-- Recruitment Progress Timeline -->
            <div class="recruitment-timeline" style="margin-top:4px; padding-top:12px; border-top:1px dashed #e2e8f0; width:100%;">
                <div style="font-size:0.75rem; font-weight:700; color:#64748b; margin-bottom:12px; display:flex; align-items:center; gap:5px;">
                    <i data-lucide="git-commit" style="width:14px;height:14px;color:#2563eb;"></i> TIẾN ĐỘ TUYỂN DỤNG
                </div>
                <div style="display:flex; align-items:center; position:relative; justify-content:space-between; max-width: 480px; margin: 0 auto 10px;">
                    <!-- Background Track line -->
                    <div style="position:absolute; top:12px; left:30px; right:30px; height:2px; background:#e2e8f0; z-index:1;"></div>
                    <!-- Active Progress line -->
                    <div style="position:absolute; top:12px; left:30px; width:calc(${progressPercent}% - 60px); height:2px; background:${progressBarColor}; z-index:2; transition: width 0.3s ease;"></div>
                    
                    <!-- Step 1: Đã nộp -->
                    <div style="display:flex; flex-direction:column; align-items:center; position:relative; z-index:3; width: 60px; text-align:center;">
                        <div style="width:24px; height:24px; border-radius:50%; background:#2563eb; color:#fff; display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:bold; box-shadow:0 0 0 4px #eff6ff;">✓</div>
                        <span style="font-size:0.7rem; font-weight:600; color:#1e293b; margin-top:6px; white-space:nowrap;">Đã nộp</span>
                    </div>

                    <!-- Step 2: Xét duyệt -->
                    <div style="display:flex; flex-direction:column; align-items:center; position:relative; z-index:3; width: 60px; text-align:center;">
                        <div style="width:24px; height:24px; border-radius:50%; background:${step2Bg}; color:${step2Color}; display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:bold; border: 2px solid ${step2Border}; box-shadow:${step2Shadow};">${step2Char}</div>
                        <span style="font-size:0.7rem; font-weight:${step2FontWeight}; color:${step2TextColor}; margin-top:6px; white-space:nowrap;">Xét duyệt</span>
                    </div>

                    <!-- Step 3: Kết quả -->
                    <div style="display:flex; flex-direction:column; align-items:center; position:relative; z-index:3; width: 60px; text-align:center;">
                        <div style="width:24px; height:24px; border-radius:50%; background:${step3Bg}; color:${step3Color}; display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:bold; border: 2px solid ${step3Border}; box-shadow:${step3Shadow};">${step3Char}</div>
                        <span style="font-size:0.7rem; font-weight:${step3FontWeight}; color:${step3TextColor}; margin-top:6px; white-space:nowrap;">${step3Label}</span>
                    </div>
                </div>
            </div>
        </div>`;
    }

    function cancelApplication(jobId) {
        showConfirmModal('Bạn có chắc chắn muốn hủy ứng tuyển công việc này?', () => {
            fetch('/Home/ApplyJob', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId })
            })
                .then(r => r.json())
                .then(data => {
                    if (data.success && !data.isApplied) {
                        showToast('Đã hủy ứng tuyển thành công.', 'success');
                        renderAppliedJobsView(); // Refresh the list
                    } else {
                        showToast(data.message || 'Lỗi khi hủy ứng tuyển.', 'error');
                    }
                })
                .catch(err => {
                    console.error('Cancel apply error:', err);
                    showToast('Không thể kết nối đến máy chủ.', 'error');
                });
        }, 'Xác nhận hủy ứng tuyển');
    }

    function bindJobCardClicks() {
        document.querySelectorAll('.job-card[data-job-id]').forEach(el => {
            el.addEventListener('click', function (e) {
                if (e.target.closest('.btn-save-job')) return;
                if (e.target.closest('.btn-cancel-apply')) return;
                const jobId = this.dataset.jobId;
                const job = allJobs.find(j => String(j.id) === String(jobId));
                if (job) openJobModal(jobId);
                else fetch('/Home/GetJobDetail/' + jobId).then(r => r.json()).then(j => {
                    if (!allJobs.find(x => String(x.id) === String(j.id))) allJobs.push(j);
                    openJobModal(j.id);
                }).catch(() => { });
            });
        });
        document.querySelectorAll('.btn-save-job').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const jobId = this.dataset.jobId;
                toggleSaveJob(jobId, this);
            });
        });
        document.querySelectorAll('.btn-cancel-apply').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const jobId = this.dataset.jobId;
                cancelApplication(jobId);
            });
        });
    }

    function renderBusinessJobsManagement() {
        managedJobsPage = 1;
        mainContent.innerHTML = `
            <div class="page-header animate-in">
                <h1 class="page-title"><i data-lucide="briefcase-business" style="width:24px;height:24px;"></i> Quản lý tin đăng</h1>
                <p class="page-subtitle">Theo dõi trạng thái duyệt, chỉnh sửa, gia hạn, tạm dừng, đóng tin và xem ứng viên từng tin.</p>
                <button class="btn-modern-primary" id="btnCreateManagedJob" style="margin-top:14px;">
                    <i data-lucide="plus-circle" style="width:16px;height:16px;"></i> Đăng tin mới
                </button>
            </div>
            <div id="businessJobStatsPanel" class="business-job-stats-panel"></div>
            <div id="businessJobsPanel" class="business-jobs-panel">
                <div style="display:flex;align-items:center;justify-content:center;min-height:220px;color:var(--text-secondary);font-weight:600;">
                    <span class="spinner-border spinner-border-sm" style="margin-right:8px;"></span> Đang tải tin tuyển dụng...
                </div>
            </div>
            <div id="businessJobsManagedPagination" style="display:flex;align-items:center;justify-content:space-between;margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;flex-wrap:wrap;gap:12px;"></div>`;
        if (window.lucide) lucide.createIcons();
        document.getElementById('btnCreateManagedJob')?.addEventListener('click', () => openPostJobModal());
        loadBusinessJobs();
    }

    function renderApproveCandidatesView() {
        newApplicantsPage = 1;
        mainContent.innerHTML = `
            <div class="page-header animate-in">
                <h1 class="page-title"><i data-lucide="user-check" style="width:24px;height:24px;"></i> Duyệt ứng viên</h1>
                <p class="page-subtitle">Xem danh sách ứng viên mới ứng tuyển và đưa ra quyết định duyệt hoặc từ chối.</p>
            </div>
            <div id="newApplicantsPanel" class="new-applicants-panel"></div>
            <div id="newApplicantsPagination" style="display:flex;align-items:center;justify-content:space-between;margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;flex-wrap:wrap;gap:12px;"></div>`;
        if (window.lucide) lucide.createIcons();
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
                managedJobsList = data.jobs || [];

                // Sort jobs: VIP first, then by Status (In_Progress -> Approved Open -> Pending Approval -> Closed)
                managedJobsList.sort((a, b) => {
                    if (a.isVip && !b.isVip) return -1;
                    if (!a.isVip && b.isVip) return 1;

                    const getStatusPriority = (job) => {
                        if (job.status === 'In_Progress') return 1;
                        if (job.isApproved && job.status === 'Open') return 2;
                        if (!job.isApproved) return 3;
                        if (job.status === 'Closed') return 4;
                        return 5;
                    };

                    const priorityA = getStatusPriority(a);
                    const priorityB = getStatusPriority(b);

                    if (priorityA !== priorityB) {
                        return priorityA - priorityB;
                    }

                    // If same status, sort by ID descending (newest first)
                    return b.id - a.id;
                });

                managedJobsSummary = data.summary || {};
                renderBusinessJobsPage();
            })
            .catch(err => {
                console.error(err);
                showToast('Không thể kết nối đến máy chủ.', 'error');
            });
    }

    function renderBusinessJobsPage() {
        const panel = document.getElementById('businessJobsPanel');
        const paginationEl = document.getElementById('businessJobsManagedPagination');
        if (!panel) return;
        renderBusinessJobStats(managedJobsList, managedJobsSummary);

        if (!managedJobsList.length) {
            panel.innerHTML = `
                <div class="profile-card-modern animate-in" style="padding:34px;text-align:center;">
                    <i data-lucide="briefcase" style="width:34px;height:34px;color:var(--primary);"></i>
                    <h3 style="margin:12px 0 6px;">Chưa có tin tuyển dụng</h3>
                    <p style="color:var(--text-muted);margin:0 0 16px;">Tạo tin đầu tiên để bắt đầu nhận ứng viên.</p>
                    <button class="btn-modern-primary" id="btnEmptyCreateJob">Đăng tin mới</button>
                </div>`;
            if (window.lucide) lucide.createIcons();
            document.getElementById('btnEmptyCreateJob')?.addEventListener('click', () => openPostJobModal());
            if (paginationEl) paginationEl.innerHTML = '';
            return;
        }

        const pageSize = Number(localStorage.getItem('j4s_pagesize_businessJobPosts')) || 10;
        const total = managedJobsList.length;
        const totalPages = Math.ceil(total / pageSize);
        if (managedJobsPage > totalPages) managedJobsPage = Math.max(1, totalPages);

        const startIndex = (managedJobsPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageJobs = managedJobsList.slice(startIndex, endIndex);

        panel.innerHTML = `
            <div class="managed-job-list">
                ${pageJobs.map(job => `
                    <article class="managed-job-card animate-in" data-job-id="${job.id}">
                        <div class="managed-job-main">
                            <div class="managed-job-topline">
                                <span class="managed-status ${!job.isApproved && job.status === 'Open' ? 'status-pending' : 'status-' + job.status.toLowerCase()}">${escapeHtml(job.statusText)}</span>
                                <span><i data-lucide="calendar" style="width:13px;height:13px;"></i> Hạn: ${escapeHtml(job.deadlineText)}</span>
                                <span><i data-lucide="users" style="width:13px;height:13px;"></i> Đã tuyển: ${job.hiredCount || 0}/${job.quantity} · ${job.applicantsCount} ứng viên</span>
                            </div>
                            <h3>${escapeHtml(job.title)}</h3>
                            <p>${escapeHtml(job.description)}</p>
                            <div class="job-tags">
                                ${(job.skills || []).map(skill => `<span class="job-tag">${escapeHtml(skill)}</span>`).join('')}
                            </div>
                        </div>
                        <div class="managed-job-side">
                            ${job.isVip ? `<span style="background:#f59e0b; color:#fff; font-size:0.7rem; font-weight:700; padding:2px 8px; border-radius:4px; margin-bottom:4px; display:inline-block;">VIP</span>` : ''}
                            <strong>${formatVND(job.budget)}</strong>
                            <span>${escapeHtml(job.location || 'Linh hoạt')}</span>
                            <span>${job.quantity} vị trí</span>
                        </div>
                        <div class="managed-job-actions">
                            <button class="btn-sm btn-primary" data-action="edit">Chỉnh sửa</button>
                            <button class="btn-sm btn-outline" data-action="extend">Gia hạn</button>
                            <button class="btn-sm btn-outline" data-action="${job.status === 'Paused' || job.status === 'Draft' ? 'open' : 'pause'}">${job.status === 'Draft' ? 'Đăng ngay' : (job.status === 'Paused' ? 'Mở lại' : 'Tạm dừng')}</button>
                            <button class="btn-sm btn-outline" data-action="close">Đóng tin</button>
                            ${job.status === 'In_Progress' && job.contracts && job.contracts.length > 0 ? (
                job.contracts[0].businessCompleted ?
                    `<button class="btn-sm btn-secondary" disabled>Chờ SV hoàn thành</button>` :
                    `<button class="btn-sm btn-success" data-action="complete-contract" data-contract-id="${job.contracts[0].id}">Hoàn thành</button>`
            ) : ''}
                            <button class="btn-sm btn-ghost" data-action="delete" style="color:var(--danger);">Xóa</button>
                        </div>
                    </article>
                `).join('')}
            </div>`;
        if (window.lucide) lucide.createIcons();
        bindManagedJobActions(pageJobs);

        if (paginationEl) {
            renderGenericPaginationControls(paginationEl, total, totalPages, managedJobsPage, pageSize, (newSize) => {
                managedJobsPage = 1;
                renderBusinessJobsPage();
            }, (newPage) => {
                managedJobsPage = newPage;
                renderBusinessJobsPage();
                document.getElementById('mainContent')?.scrollIntoView({ behavior: 'smooth' });
            }, 'j4s_pagesize_businessJobPosts');
        }
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
            </section>`;
    }

    function renderBusinessEmployerHome() {
        if (!mainContent) return;

        const activePkg = hasActivePackage();
        const userName = document.querySelector('#userProfile .user-name')?.textContent?.trim() || 'Nhà tuyển dụng';

        if (!activePkg) {
            mainContent.innerHTML = `
                <div class="welcome-box-business" style="padding: 24px; margin-bottom: 24px; border-radius: 16px; background: linear-gradient(135deg, #2563eb, #0ea5e9); color: #fff;">
                    <h1 class="welcome-title" style="margin: 0 0 8px; font-size: 1.75rem; font-weight: 800; color: #fff; text-shadow: 0 1px 4px rgba(0,0,0,0.15);">Xin chào, ${escapeHtml(userName)} 👋</h1>
                    <p class="welcome-desc" style="margin: 0; color: rgba(255,255,255,0.90); font-size: 1rem; font-weight: 500;">Chào mừng bạn đến với hệ thống quản lý tuyển dụng J4S.</p>
                </div>
                <div class="card border-0 shadow-sm text-center animate-in" style="border-radius: 16px; background: #ffffff; padding: 48px; border: 1px solid #e2e8f0; text-align: center;">
                    <div style="max-width: 500px; margin: 0 auto; display: flex; flex-direction: column; align-items: center;">
                        <i data-lucide="shield-alert" style="width: 56px; height: 56px; color: #f59e0b; margin-bottom: 16px;"></i>
                        <h2 style="font-weight: 700; font-size: 1.5rem; color: #1e293b; margin: 0 0 12px;">Tính năng tuyển dụng bị giới hạn</h2>
                        <p style="color: #64748b; line-height: 1.6; margin: 0 0 24px; font-size: 0.95rem;">
                            Tài khoản của bạn hiện chưa đăng ký gói dịch vụ đang hoạt động (hoặc gói cũ đã hết hạn). Vui lòng đăng ký gói <strong>Business Premium</strong> để mở khóa các tính năng tuyển dụng, quản lý tin đăng, duyệt hồ sơ ứng viên.
                        </p>
                        <button class="btn btn-primary fw-bold" id="btnPaywallUpgrade" style="border-radius: 10px; background: linear-gradient(135deg,#2563eb,#0ea5e9); border: none; color: #fff; padding: 12px 24px; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px;">
                            <i data-lucide="credit-card" style="width:18px;height:18px;"></i> Nâng cấp gói dịch vụ ngay
                        </button>
                    </div>
                </div>`;
            document.getElementById('btnPaywallUpgrade')?.addEventListener('click', () => {
                const navBtn = document.getElementById('navServicePackages');
                if (navBtn) {
                    navBtn.click();
                } else {
                    currentSidebarMode = 'servicePackages';
                    renderServicePackagesView();
                }
            });
            renderBusinessRightSidebarLoading();
            loadBusinessHomeData();
            if (window.lucide) lucide.createIcons();
            return;
        }

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
                const hasPlan = !!pkg?.currentPackage;
                const userProfileEl = document.getElementById('userProfile');
                if (userProfileEl) {
                    userProfileEl.dataset.hasActivePackage = hasPlan ? 'true' : 'false';
                }

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
        const hasPlan = !!current;
        const planLimit = hasPlan ? (current.jobPostLimit || ((current.remainingJobPosts || 0) + activeJobs.length) || 1) : 0;
        const usedPosts = hasPlan ? Math.max(0, planLimit - (current.remainingJobPosts ?? 0)) : 0;
        const progress = planLimit > 0 ? Math.max(0, Math.min(100, Math.round((usedPosts / planLimit) * 100))) : 0;

        rightSidebar.innerHTML = `
            <section class="business-side-card" style="${hasActivePackage() ? '' : 'display:none;'}">
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

            <section class="business-side-card" id="sidebarServicePkgCard">
                <span class="side-eyebrow">GÓI DỊCH VỤ HIỆN TẠI</span>
                <div class="current-plan-head">
                    <div class="plan-star" style="${hasPlan ? '' : 'background:#e2e8f0;color:#94a3b8;'}"><i data-lucide="${hasPlan ? 'star' : 'shield-alert'}"></i></div>
                    <div>
                        <h3>${hasPlan ? (current.planName === 'Gói Premium' ? 'Business Premium' : (current.planName === 'Gói VIP' ? 'Business VIP' : current.planName)) : 'Chưa đăng ký gói'}${packageData?.vipPackage ? ' + VIP' : ''}</h3>
                        ${hasPlan ? '<span class="active-plan-badge">Đang hoạt động</span>' : '<span class="active-plan-badge" style="background:#f1f5f9;color:#64748b;">Chưa kích hoạt</span>'}
                    </div>
                </div>
                <p class="plan-expiry">
                    ${hasPlan ? `Hiệu lực đến: <strong>${escapeHtml(current.endDate || '--')}</strong>` : 'Đăng ký gói để sử dụng tính năng'}
                </p>
                <div class="plan-checklist">
                    ${hasPlan ? `
                        <span><i data-lucide="check"></i>10 tin tuyển dụng</span>
                        <span><i data-lucide="check"></i>Xem duyệt ứng viên</span>
                        <span><i data-lucide="check"></i>Truy cập hồ sơ ứng viên không giới hạn</span>
                        ${packageData?.vipPackage ? `
                            <span><i data-lucide="check" style="color:#f59e0b;"></i>Đăng tin VIP (1 lần, 7 ngày)</span>
                        ` : ''}
                    ` : ''}
                </div>
                <div class="plan-progress-row" style="${hasPlan ? '' : 'display:none;'}">
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

    function renderNotificationsView() {
        const subtitle = isBusinessAccount()
            ? "Theo dõi ứng viên mới, thanh toán, tin sắp hết hạn và thông báo hệ thống."
            : "Theo dõi cập nhật dự án, tin tuyển dụng, tin nhắn mới và thông báo hệ thống.";

        let currentPage = 1;
        let pageSize = Number(localStorage.getItem('j4s_pagesize_notifications')) || 10;
        let activeNotifications = [];

        mainContent.innerHTML = `
            <div class="page-header animate-in">
                <h1 class="page-title"><i data-lucide="bell" style="width:24px;height:24px;"></i> Thông báo</h1>
                <p class="page-subtitle">${subtitle}</p>
            </div>
            <div class="profile-card-modern" style="padding:18px;">
                <div id="notificationsPanel" style="display:flex; flex-direction:column;">
                    <div class="business-loading-row"><span class="spinner-border spinner-border-sm"></span> Đang tải thông báo...</div>
                </div>
                <div id="notificationsPagination" style="display:flex;align-items:center;justify-content:space-between;margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;flex-wrap:wrap;gap:12px;"></div>
            </div>`;
        if (window.lucide) lucide.createIcons();

        function renderPage() {
            const panel = document.getElementById('notificationsPanel');
            const paginationEl = document.getElementById('notificationsPagination');
            if (!panel) return;

            if (!activeNotifications.length) {
                panel.innerHTML = '<div class="business-empty-row">Chưa có thông báo.</div>';
                if (paginationEl) paginationEl.innerHTML = '';
                return;
            }

            const total = activeNotifications.length;
            const totalPages = Math.ceil(total / pageSize);
            if (currentPage > totalPages) currentPage = Math.max(1, totalPages);

            const startIndex = (currentPage - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const pageNotifications = activeNotifications.slice(startIndex, endIndex);

            panel.innerHTML = pageNotifications.map(n => `
                <div class="notification-list-item ${n.unread ? 'unread' : ''}">
                    <div class="notification-icon">${escapeHtml(n.icon || '•')}</div>
                    <div>
                        <strong>${escapeHtml(n.title || '')}</strong>
                        <p>${escapeHtml(n.desc || '')}</p>
                        <small>${escapeHtml(n.time || '')}</small>
                    </div>
                </div>
            `).join('');

            if (paginationEl) {
                renderGenericPaginationControls(paginationEl, total, totalPages, currentPage, pageSize, (newSize) => {
                    pageSize = newSize;
                    currentPage = 1;
                    renderPage();
                }, (newPage) => {
                    currentPage = newPage;
                    renderPage();
                    document.getElementById('mainContent')?.scrollIntoView({ behavior: 'smooth' });
                }, 'j4s_pagesize_notifications');
            }
        }

        fetch('/Home/GetNotifications')
            .then(res => res.json())
            .then(notifications => {
                activeNotifications = Array.isArray(notifications) ? notifications : [];
                renderPage();
            })
            .catch(err => {
                console.error(err);
                showToast('Không thể tải thông báo.', 'error');
            });
    }

    function renderBusinessSupportView() {
        mainContent.innerHTML = `
            <div class="page-header animate-in">
                <h1 class="page-title"><i data-lucide="circle-help" style="width:24px;height:24px;"></i> Trung tâm hỗ trợ</h1>
                <p class="page-subtitle">Tra cứu FAQ, xem hướng dẫn và gửi yêu cầu hỗ trợ dành cho nhà tuyển dụng</p>
            </div>
            <div class="row g-4">
                <div class="col-lg-7">
                    <!-- FAQ -->
                    <div class="card border-0 shadow-sm p-4 mb-4" style="border-radius:16px;">
                        <h3 class="fw-bold mb-3">FAQ - Câu hỏi thường gặp</h3>
                        <div class="accordion" id="bizHelpFaqAccordion">
                            <div class="accordion-item">
                                <h2 class="accordion-header">
                                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#bizFaq1">
                                        Làm sao để đăng tin tuyển dụng?
                                    </button>
                                </h2>
                                <div id="bizFaq1" class="accordion-collapse collapse show" data-bs-parent="#bizHelpFaqAccordion">
                                    <div class="accordion-body">Chọn nút <strong>Đăng tin tuyển dụng</strong> ở góc dưới sidebar, nhập tiêu đề, mô tả, ngân sách và hạn chót, sau đó gửi duyệt.</div>
                                </div>
                            </div>
                            <div class="accordion-item">
                                <h2 class="accordion-header">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#bizFaq2">
                                        Vì sao cần nạp tiền bội số 50k?
                                    </button>
                                </h2>
                                <div id="bizFaq2" class="accordion-collapse collapse" data-bs-parent="#bizHelpFaqAccordion">
                                    <div class="accordion-body">Hệ thống đối soát QR tự động theo từng mệnh giá chuẩn để đảm bảo giao dịch được xác nhận nhanh và chính xác.</div>
                                </div>
                            </div>
                            <div class="accordion-item">
                                <h2 class="accordion-header">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#bizFaq3">
                                        Làm thế nào để xem hồ sơ ứng viên?
                                    </button>
                                </h2>
                                <div id="bizFaq3" class="accordion-collapse collapse" data-bs-parent="#bizHelpFaqAccordion">
                                    <div class="accordion-body">Mở mục <strong>Ứng viên</strong> trên sidebar hoặc bấm <strong>Xem hồ sơ</strong> ở thẻ ứng viên mới nhất để vào trang hồ sơ chi tiết.</div>
                                </div>
                            </div>
                            <div class="accordion-item">
                                <h2 class="accordion-header">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#bizFaq4">
                                        Gói dịch vụ hết hạn thì tin đăng bị ảnh hưởng không?
                                    </button>
                                </h2>
                                <div id="bizFaq4" class="accordion-collapse collapse" data-bs-parent="#bizHelpFaqAccordion">
                                    <div class="accordion-body">Khi gói hết hạn, tin đăng hiện tại vẫn hiển thị cho đến khi hết deadline riêng của từng tin. Để đăng tin mới, bạn cần gia hạn hoặc mua gói mới.</div>
                                </div>
                            </div>
                            <div class="accordion-item">
                                <h2 class="accordion-header">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#bizFaq5">
                                        Tôi có thể xóa tin đăng không?
                                    </button>
                                </h2>
                                <div id="bizFaq5" class="accordion-collapse collapse" data-bs-parent="#bizHelpFaqAccordion">
                                    <div class="accordion-body">Có, bạn có thể xóa tin đăng từ mục <strong>Quản lý tin đăng</strong>. Tin đã xóa sẽ không còn hiển thị với ứng viên, nhưng lịch sử vẫn được lưu để đối soát.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- Hướng dẫn sử dụng -->
                    <div class="card border-0 shadow-sm p-4" style="border-radius:16px;">
                        <h3 class="fw-bold mb-3">Hướng dẫn sử dụng nhanh</h3>
                        <ol class="mb-0" style="line-height:2; color:#475569;">
                            <li>Đăng nhập tài khoản doanh nghiệp và hoàn thiện hồ sơ công ty.</li>
                            <li>Nạp tiền vào ví bằng QR VietQR (bội số 50.000đ) để mua gói dịch vụ.</li>
                            <li>Chọn gói phù hợp tại mục <strong>Gói dịch vụ &amp; Thanh toán</strong>.</li>
                            <li>Đăng tin tuyển dụng — nhập đầy đủ thông tin để thu hút ứng viên.</li>
                            <li>Theo dõi ứng viên và nhắn tin trực tiếp qua box chat.</li>
                            <li>Gia hạn, đóng hoặc xóa tin đăng khi nhu cầu thay đổi.</li>
                        </ol>
                    </div>
                </div>
                <div class="col-lg-5">
                    <!-- Gửi yêu cầu hỗ trợ -->
                    <div class="card border-0 shadow-sm p-4 mb-4" style="border-radius:16px;">
                        <h3 class="fw-bold mb-3">Gửi yêu cầu hỗ trợ</h3>
                        <form id="bizSupportRequestForm" class="d-grid gap-3">
                            <input class="form-control" name="subject" placeholder="Tiêu đề hỗ trợ" required />
                            <select class="form-select" name="category" required>
                                <option value="">Chọn loại hỗ trợ</option>
                                <option value="Đăng tin tuyển dụng">Đăng tin tuyển dụng</option>
                                <option value="Thanh toán &amp; ví">Thanh toán &amp; ví</option>
                                <option value="Tài khoản">Tài khoản</option>
                                <option value="Khác">Khác</option>
                            </select>
                            <textarea class="form-control" name="message" rows="5" placeholder="Mô tả chi tiết vấn đề..." required></textarea>
                            <button class="btn btn-primary w-100" type="submit" id="bizSupportSubmitBtn">
                                <i data-lucide="send" style="width:16px;height:16px;margin-right:6px;"></i>Gửi yêu cầu hỗ trợ
                            </button>
                        </form>
                    </div>
                    <!-- Liên hệ CSKH -->
                    <div class="card border-0 shadow-sm p-4 mb-4" style="border-radius:16px;">
                        <h3 class="fw-bold mb-3">Liên hệ CSKH</h3>
                        <div class="d-grid gap-3" style="color:#475569;">
                            <div class="d-flex align-items-center gap-2">
                                <i data-lucide="mail" style="width:18px;height:18px;color:#2563eb;flex-shrink:0;"></i>
                                <div><strong>Email:</strong> <a href="https://mail.google.com/mail/?view=cm&fs=1&to=j4s.job4stu@gmail.com" target="_blank" style="color:inherit;text-decoration:none;">j4s.job4stu@gmail.com</a></div>
                            </div>
                            <div class="d-flex align-items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                                <div><strong>Fanpage:</strong> <a href="https://www.facebook.com/job4stu" target="_blank" style="color:#2563eb;text-decoration:none;font-weight:600;">www.facebook.com/job4stu</a></div>
                            </div>
                        </div>
                    </div>
                    <!-- Yêu cầu gần đây -->
                    <div class="card border-0 shadow-sm p-4" style="border-radius:16px;">
                        <h3 class="fw-bold mb-3">Yêu cầu gần đây</h3>
                        <div id="bizSupportRequestList" class="d-grid gap-2 small" style="color:#475569;"></div>
                    </div>
                </div>
            </div>`;

        if (window.lucide) lucide.createIcons();

        const form = document.getElementById('bizSupportRequestForm');
        const list = document.getElementById('bizSupportRequestList');

        function renderBizRequestList(requests) {
            if (!list) return;
            list.innerHTML = (requests && requests.length)
                ? requests.map(r => `
                    <div class="border rounded-3 p-3">
                        <div class="fw-semibold">${escapeHtml(r.subject)}</div>
                        <div class="text-muted">${escapeHtml(r.category)} · <span class="badge bg-secondary-subtle text-secondary rounded-pill">${escapeHtml(r.status || 'Đã tiếp nhận')}</span></div>
                        <div class="text-muted" style="font-size:0.78rem;">${escapeHtml(r.createdAt || '')}</div>
                    </div>`).join('')
                : '<div class="text-muted">Chưa có yêu cầu nào.</div>';
        }

        fetch('/Support/GetMyRequests')
            .then(res => res.json())
            .then(resData => { if (resData.success) renderBizRequestList(resData.requests); })
            .catch(err => console.error(err));

        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            const payload = {
                subject: form.subject.value.trim(),
                category: form.category.value,
                message: form.message.value.trim()
            };
            const submitBtn = document.getElementById('bizSupportSubmitBtn');
            const originalHTML = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" style="margin-right:8px;"></span>Đang gửi...`;

            fetch('/Support/SubmitRequest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(res => res.json())
                .then(resData => {
                    if (resData.success) {
                        showToast(resData.message || 'Đã gửi yêu cầu hỗ trợ.', 'success');
                        form.reset();
                        fetch('/Support/GetMyRequests')
                            .then(res => res.json())
                            .then(d => { if (d.success) renderBizRequestList(d.requests); })
                            .catch(err => console.error(err));
                    } else {
                        showToast(resData.message || 'Không thể gửi yêu cầu hỗ trợ.', 'error');
                    }
                })
                .catch(err => {
                    console.error(err);
                    showToast('Lỗi kết nối máy chủ.', 'error');
                })
                .finally(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalHTML;
                    if (window.lucide) lucide.createIcons();
                });
        });
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
                    if (action === 'complete-contract') {
                        const contractId = Number(btn.dataset.contractId);
                        completeContractFromBusiness(contractId);
                    }
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
                if (data.success) {
                    loadBusinessJobs();
                    if (typeof loadBusinessHomeData === 'function') {
                        loadBusinessHomeData();
                    }
                }
            })
            .catch(err => {
                console.error(err);
                showToast('Không thể cập nhật trạng thái tin.', 'error');
            });
    }

    function extendBusinessJob(jobId) {
        showPromptModal('Gia hạn thêm bao nhiêu ngày?', '7', (daysText) => {
            if (daysText === null || daysText.trim() === '') return;
            const days = Number(daysText);
            if (!Number.isFinite(days) || days <= 0) return;
            postJson('/Home/ExtendBusinessJobPost', { jobId, days })
                .then(data => {
                    showToast(data.message || 'Đã gia hạn tin.', data.success ? 'success' : 'error');
                    if (data.success) {
                        loadBusinessJobs();
                        if (typeof loadBusinessHomeData === 'function') {
                            loadBusinessHomeData();
                        }
                    }
                })
                .catch(err => {
                    console.error(err);
                    showToast('Không thể gia hạn tin.', 'error');
                });
        }, 'Gia hạn tin đăng');
    }

    function deleteBusinessJob(jobId) {
        showConfirmModal('Bạn chắc chắn muốn xóa tin tuyển dụng này?', async () => {
            try {
                const body = new FormData();
                body.append('jobId', jobId);
                const response = await fetch('/Home/DeleteBusinessJobPost', {
                    method: 'POST',
                    body: body,
                    headers: {
                        'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]')?.value
                    }
                });
                const data = await response.json();
                if (data.success) {
                    showToast(data.message || 'Đã xóa tin.', 'success');
                    loadBusinessJobs();
                    if (typeof loadBusinessHomeData === 'function') {
                        loadBusinessHomeData();
                    }
                } else {
                    showToast(data.message || 'Không thể xóa tin.', 'error');
                }
            } catch (err) {
                console.error(err);
                showToast('Không thể xóa tin.', 'error');
            }
        }, 'Xác nhận xóa');
    }

    function completeContractFromBusiness(contractId) {
        showConfirmModal('Bạn có chắc chắn muốn xác nhận hoàn thành dự án này không? Trạng thái dự án chỉ chính thức chuyển sang "Hoàn thành" (Đóng) khi cả sinh viên và bạn đều xác nhận.', () => {
            const formData = new FormData();
            formData.append('contractId', contractId);
            fetch('/Home/CompleteContractBusiness', {
                method: 'POST',
                body: formData,
                headers: {
                    'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]')?.value
                }
            })
                .then(res => res.json())
                .then(data => {
                    showToast(data.message || 'Đã gửi xác nhận hoàn thành.', data.success ? 'success' : 'error');
                    if (data.success) {
                        loadBusinessJobs();
                    }
                })
                .catch(err => {
                    console.error(err);
                    showToast('Lỗi kết nối máy chủ.', 'error');
                });
        }, 'Xác nhận hoàn thành');
    }

    function updateApplicantStatus(bidId, action, onSuccess) {
        postJson('/Home/UpdateBidStatus', { bidId, action })
            .then(data => {
                showToast(data.message || 'Đã cập nhật trạng thái ứng viên.', data.success ? 'success' : 'error');
                if (data.success) {
                    if (onSuccess) {
                        onSuccess();
                    } else {
                        loadNewBusinessApplicants();
                        loadBusinessJobs();
                        loadBusinessHomeData();
                    }
                }
            })
            .catch(err => {
                console.error(err);
                showToast('Không thể kết nối đến máy chủ.', 'error');
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
                                <div class="applicant-card" data-bid-id="${app.id}" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding:16px 0; gap: 16px;">
                                    <div style="display:flex; gap:16px; flex: 1; min-width: 0;">
                                        <div class="applicant-avatar">
                                            ${app.avatarUrl ? `<img src="${escapeHtml(app.avatarUrl)}" alt="${escapeHtml(app.name)}" />` : `<span>${escapeHtml(app.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase())}</span>`}
                                        </div>
                                        <div class="applicant-info" style="flex: 1; min-width: 0;">
                                            <h3>${escapeHtml(app.name)}</h3>
                                            <p style="white-space: pre-wrap; word-break: break-word;">${escapeHtml(app.proposal || 'Chưa có lời nhắn ứng tuyển.')}</p>
                                            <div class="applicant-meta">
                                                <span>${escapeHtml(app.email)}</span>
                                                <span>${escapeHtml(app.phone)}</span>
                                                <span>${formatVND(app.bidAmount)}</span>
                                                <span>${app.estimatedDays} ngày</span>
                                            </div>
                                            <div class="job-tags">${(app.skills || []).map(skill => `<span class="job-tag">${escapeHtml(skill)}</span>`).join('')}</div>
                                        </div>
                                    </div>
                                    <div class="applicant-actions" style="display:flex; flex-direction:column; gap:8px; align-items:flex-end; flex-shrink: 0;">
                                        ${app.status === 'Pending' ? `
                                            <div style="display:flex; gap:8px;">
                                                <button class="btn-sm" data-action="approve-bid" style="background:#10b981; color:#fff; border:none; border-radius:6px; cursor:pointer; padding:6px 12px; font-weight:600;">Duyệt</button>
                                                <button class="btn-sm" data-action="reject-bid" style="background:#ef4444; color:#fff; border:none; border-radius:6px; cursor:pointer; padding:6px 12px; font-weight:600;">Từ chối</button>
                                            </div>
                                        ` : `
                                            <span style="font-size:0.8rem; font-weight:700; padding:4px 12px; border-radius:20px; ${app.status === 'Hired' || app.status === 'Accepted' ? 'background:#ecfdf5; color:#059669;' : 'background:#fef2f2; color:#dc2626;'}">
                                                ${app.status === 'Hired' || app.status === 'Accepted' ? 'Đã nhận' : 'Từ chối'}
                                            </span>
                                            
                                            ${(app.status === 'Hired' || app.status === 'Accepted') && app.contractId ? `
                                                <div style="margin-top: 6px;">
                                                    ${app.contractStatus === 'Completed' ? `
                                                        <span style="font-size:0.75rem; color:#10b981; font-weight:700; display:flex; align-items:center; gap:4px;">
                                                            <i data-lucide="check-circle" style="width:14px;height:14px;"></i> Dự án đã hoàn thành
                                                        </span>
                                                    ` : app.businessCompleted ? `
                                                        <span style="font-size:0.75rem; color:#d97706; font-weight:700; display:flex; align-items:center; gap:4px;">
                                                            <i data-lucide="clock" style="width:14px;height:14px;"></i> Chờ sinh viên xác nhận
                                                        </span>
                                                    ` : `
                                                        <button class="btn-sm complete-contract-business-btn" data-contract-id="${app.contractId}" style="background:#10b981; color:#fff; border:none; border-radius:6px; cursor:pointer; padding:4px 10px; font-size:0.75rem; font-weight:600; display:flex; align-items:center; gap:4px; transition: background 0.2s;">
                                                            <i data-lucide="check-circle" style="width:12px;height:12px;"></i> ${app.studentCompleted ? 'Xác nhận hoàn thành (SV đã hoàn thành)' : 'Hoàn thành dự án'}
                                                        </button>
                                                    `}
                                                </div>
                                            ` : ''}
                                        `}
                                    </div>
                                </div>
                            `).join('') : `<div style="padding:28px;text-align:center;color:var(--text-muted);font-weight:600;">Chưa có ứng viên nào cho tin này.</div>`}
                        </div>
                        </div>
                     </div>`;
                document.body.appendChild(modal);
                if (window.lucide) lucide.createIcons();
                requestAnimationFrame(() => modal.classList.add('active'));

                modal.querySelectorAll('.applicant-card').forEach(card => {
                    const bidId = Number(card.dataset.bidId);
                    card.querySelector('[data-action="approve-bid"]')?.addEventListener('click', () => {
                        updateApplicantStatus(bidId, 'hire', () => {
                            closeModal(modal);
                            openJobApplicantsModal(jobId);
                        });
                    });
                    card.querySelector('[data-action="reject-bid"]')?.addEventListener('click', () => {
                        updateApplicantStatus(bidId, 'reject', () => {
                            closeModal(modal);
                            openJobApplicantsModal(jobId);
                        });
                    });
                });

                // Bind business complete button
                modal.querySelectorAll('.complete-contract-business-btn').forEach(btn => {
                    btn.addEventListener('click', function () {
                        const contractId = Number(this.dataset.contractId);
                        completeBusinessProject(contractId, modal, jobId);
                    });
                });

                modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
                modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal); });
            })
            .catch(err => {
                console.error(err);
                showToast('Không thể kết nối đến máy chủ.', 'error');
            });
    }

    function completeBusinessProject(contractId, modal, jobId) {
        showConfirmModal('Bạn chắc chắn muốn đánh dấu dự án này là hoàn thành? Trạng thái sẽ được lưu vào hệ thống.', () => {
            const body = new FormData();
            body.append('contractId', contractId);
            fetch('/Home/CompleteContractBusiness', {
                method: 'POST',
                body: body,
                headers: {
                    'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]')?.value
                }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        showToast(data.message || 'Đã hoàn thành dự án!', 'success');
                        closeModal(modal);
                        openJobApplicantsModal(jobId);
                    } else {
                        showToast(data.message || 'Lỗi khi hoàn thành dự án.', 'error');
                    }
                })
                .catch(err => {
                    console.error(err);
                    showToast('Không thể kết nối đến máy chủ.', 'error');
                });
        }, 'Xác nhận hoàn thành dự án');
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
                newApplicantsList = data.applicants || [];
                newApplicantsTotal = data.totalNewApplicants || 0;
                renderNewBusinessApplicantsPage();
            })
            .catch(err => {
                console.error(err);
                showToast('Không thể kết nối đến máy chủ.', 'error');
            });
    }

    function renderNewBusinessApplicantsPage() {
        const panel = document.getElementById('newApplicantsPanel');
        const paginationEl = document.getElementById('newApplicantsPagination');
        if (!panel) return;

        if (!newApplicantsList.length) {
            panel.innerHTML = `<div class="service-payment-empty">Chưa có ứng viên nào ứng tuyển.</div>`;
            if (paginationEl) paginationEl.innerHTML = '';
            return;
        }

        const pageSize = Number(localStorage.getItem('j4s_pagesize_businessApplicantsApproval')) || 10;
        const total = newApplicantsList.length;
        const totalPages = Math.ceil(total / pageSize);
        if (newApplicantsPage > totalPages) newApplicantsPage = Math.max(1, totalPages);

        const startIndex = (newApplicantsPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageApplicants = newApplicantsList.slice(startIndex, endIndex);

        panel.innerHTML = `
            <section class="new-applicants-section animate-in">
                <div class="section-header">
                    <div>
                        <h2 class="section-title">Danh sách ứng viên</h2>
                        <p class="section-subtitle">Tổng số: ${newApplicantsTotal} ứng viên đã ứng tuyển</p>
                    </div>
                </div>
                <div class="new-applicant-list">
                    ${pageApplicants.map(app => `
                        <article class="new-applicant-card" data-student-id="${app.studentId}" data-bid-id="${app.id}">
                            <div class="applicant-avatar">
                                ${app.avatarUrl ? `<img src="${escapeHtml(app.avatarUrl)}" alt="${escapeHtml(app.name)}" />` : `<span>${getInitials(app.name)}</span>`}
                            </div>
                            <div class="new-applicant-main" style="width: 100%;">
                                <div class="applicant-header-row" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; gap: 12px; width:100%;">
                                    <div>
                                        <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 900;">${escapeHtml(app.name)}</h3>
                                        <p style="margin: 0; color: var(--text-secondary); font-size: 13px;">${escapeHtml(app.jobTitle)} · ${escapeHtml(app.appliedAt)}</p>
                                    </div>
                                    <div style="text-align: right; display:flex; flex-direction:column; align-items:flex-end; flex-shrink:0;">
                                        <strong style="color: #0f766e; font-size: 16px; font-weight: 900;">${formatVND(app.bidAmount)}</strong>
                                        <span style="color: var(--text-muted); font-size: 12px; font-weight: 800; margin-top:2px;">${app.estimatedDays} ngày</span>
                                    </div>
                                </div>
                                
                                ${app.proposal && app.proposal !== 'Tôi muốn ứng tuyển vào công việc này. Tôi có kỹ năng phù hợp.' ? `
                                <p class="proposal-text" style="margin: 10px 0 12px; font-size:13.5px; line-height:1.5; color:#334155; white-space: pre-wrap; word-break: break-word;">
                                    ${escapeHtml(app.proposal)}
                                </p>
                                ` : ''}
                                
                                <div class="job-tags" style="margin-bottom:16px;">
                                    ${(app.skills || []).map(skill => `<span class="job-tag">${escapeHtml(skill)}</span>`).join('')}
                                </div>
                                
                                <div class="applicant-actions-row" style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #e2e8f0; padding-top:12px; gap: 12px; flex-wrap: wrap; width:100%;">
                                    <div style="display:flex; gap:8px;">
                                        <button class="btn-sm btn-primary" data-action="profile" style="padding: 6px 14px; font-weight:600; display:flex; align-items:center; gap:6px;">
                                            <i data-lucide="user" style="width:14px;height:14px;"></i> Hồ sơ
                                        </button>
                                        <button class="btn-sm btn-outline" data-action="contact" style="padding: 6px 14px; font-weight:600; display:flex; align-items:center; gap:6px;">
                                            <i data-lucide="message-square" style="width:14px;height:14px;"></i> Liên hệ
                                        </button>
                                    </div>
                                    <div style="display:flex; gap:8px;">
                                        ${app.status === 'Pending' ? `
                                            <button class="btn-sm" data-action="approve" style="background:#10b981; color:#fff; border:none; padding: 6px 16px; font-weight:600; cursor:pointer; border-radius:var(--radius-sm); display:flex; align-items:center; gap:6px;">
                                                <i data-lucide="check" style="width:14px;height:14px;"></i> Duyệt
                                            </button>
                                            <button class="btn-sm" data-action="reject" style="background:#ef4444; color:#fff; border:none; padding: 6px 16px; font-weight:600; cursor:pointer; border-radius:var(--radius-sm); display:flex; align-items:center; gap:6px;">
                                                <i data-lucide="x" style="width:14px;height:14px;"></i> Từ chối
                                            </button>
                                        ` : `
                                            <span style="font-size:0.85rem; font-weight:700; padding:6px 14px; border-radius:6px; display:inline-flex; align-items:center; gap:6px; ${app.status === 'Hired' || app.status === 'Accepted' ? 'background:#ecfdf5; color:#059669;' : 'background:#fef2f2; color:#dc2626;'}">
                                                <i data-lucide="${app.status === 'Hired' || app.status === 'Accepted' ? 'check-circle' : 'x-circle'}" style="width:14px;height:14px;"></i>
                                                ${app.status === 'Hired' || app.status === 'Accepted' ? 'Đã nhận' : 'Từ chối'}
                                            </span>
                                        `}
                                    </div>
                                </div>
                            </div>
                        </article>
                    `).join('')}
                </div>
            </section>`;

        if (window.lucide) lucide.createIcons();
        panel.querySelectorAll('.new-applicant-card').forEach(card => {
            const studentId = Number(card.dataset.studentId);
            const bidId = Number(card.dataset.bidId);
            card.querySelector('[data-action="profile"]')?.addEventListener('click', () => openCandidateProfileModal(studentId));
            card.querySelector('[data-action="contact"]')?.addEventListener('click', () => contactCandidate(studentId));
            card.querySelector('[data-action="approve"]')?.addEventListener('click', () => updateApplicantStatus(bidId, 'hire'));
            card.querySelector('[data-action="reject"]')?.addEventListener('click', () => updateApplicantStatus(bidId, 'reject'));
        });

        if (paginationEl) {
            renderGenericPaginationControls(paginationEl, total, totalPages, newApplicantsPage, pageSize, (newSize) => {
                newApplicantsPage = 1;
                renderNewBusinessApplicantsPage();
            }, (newPage) => {
                newApplicantsPage = newPage;
                renderNewBusinessApplicantsPage();
                document.getElementById('mainContent')?.scrollIntoView({ behavior: 'smooth' });
            }, 'j4s_pagesize_businessApplicantsApproval');
        }
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
        const panel = document.getElementById('servicePackagesPanel');
        if (!panel) {
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
        }
        paymentHistoryPage = 1;
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
                const hasPlan = !!pkg?.currentPackage;
                const userProfileEl = document.getElementById('userProfile');
                if (userProfileEl) {
                    userProfileEl.dataset.hasActivePackage = hasPlan ? 'true' : 'false';
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
            if (plan.id === 3) {
                const hasVip = data.vipPackage != null || current?.planId === 3;
                return {
                    disabled: hasVip,
                    label: hasVip ? 'Đang dùng' : 'Thanh toán / Nâng cấp'
                };
            } else if (plan.id === 2) {
                const hasPremium = current?.planId === 2;
                return {
                    disabled: hasPremium,
                    label: hasPremium ? 'Đang dùng' : 'Thanh toán / Nâng cấp'
                };
            }

            const isCurrent = current?.planId === plan.id;
            return {
                disabled: isCurrent,
                label: isCurrent ? 'Đang dùng' : 'Thanh toán / Nâng cấp'
            };
        };

        panel.innerHTML = `
            <section class="service-package-current animate-in" style="display:block; padding:16px 20px; background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%); border: 1px solid #e2e8f0; border-radius: 16px; margin-bottom: 24px;">
                ${(!current && !data.vipPackage) ? `
                <div style="text-align: center; padding: 12px 0;">
                    <div style="font-size: 1.5rem; color: #94a3b8; margin-bottom: 4px;"><i data-lucide="shield-alert"></i></div>
                    <h3 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: #475569;">Chưa đăng ký gói dịch vụ</h3>
                    <p style="margin: 4px 0 0; font-size: 0.85rem; color: #64748b;">Vui lòng chọn đăng ký gói bên dưới để sử dụng đầy đủ các tính năng tuyển dụng.</p>
                </div>
                ` : `
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div style="width: 44px; height: 44px; border-radius: 12px; background: #0ea5e9; color: white; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 10px rgba(14,165,233,0.2);">
                            <i data-lucide="award"></i>
                        </div>
                        <div>
                            <div style="font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Gói dịch vụ đang hoạt động</div>
                            <h3 style="margin: 4px 0 0; font-size: 1.25rem; font-weight: 800; color: #1e293b; display: flex; align-items: center; flex-wrap: wrap; gap: 8px;">
                                ${escapeHtml(current?.planName || 'Business Premium')}
                                ${data.vipPackage ? `
                                <span style="color: #94a3b8; font-weight: 400; font-size: 1.1rem;">+</span> 
                                <span style="color: #d97706; font-weight: 800; display: inline-flex; align-items: center; gap: 4px;">
                                    Business VIP
                                    <span style="background: #f59e0b; color: #fff; font-size: 0.6rem; font-weight: 700; padding: 1px 6px; border-radius: 4px; text-transform: uppercase;">1 Bài VIP</span>
                                </span>
                                ` : ''}
                            </h3>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
                        <div style="font-size: 0.85rem; color: #475569; line-height: 1.5;">
                            <div><strong>Hạn Premium:</strong> ${escapeHtml(current?.endDate || '--')} (${current?.daysLeft ?? 0} ngày)</div>
                            <div><strong>Tin thường:</strong> Còn <span style="color: #0ea5e9; font-weight: 700;">${current?.remainingJobPosts ?? 0}</span> / 10 tin</div>
                        </div>
                        ${current ? `<button class="btn-modern-primary" id="btnRenewCurrentPlan" style="padding: 8px 18px; border-radius: 10px; font-weight: 600; font-size: 0.85rem; background: #0ea5e9; color: white; border: none; box-shadow: 0 4px 10px rgba(14,165,233,0.15);">Gia hạn gói</button>` : ''}
                    </div>
                </div>
                `}
            </section>

            <section class="service-plan-section animate-in">
                <div class="section-header">
                    <h2 class="section-title">Danh sách các gói</h2>
                    <span style="color:var(--text-muted);font-weight:700;">Số dư ví: ${formatVND(data.balance)}</span>
                </div>
                <div class="service-plan-grid">
                    ${(data.plans || []).map(plan => {
            const isVipPlan = plan.id === 3;
            const hasPremiumActive = current?.planId === 2 || data.vipPackage != null;
            const isLocked = isVipPlan && !hasPremiumActive;
            const isVipActive = isVipPlan && data.vipPackage != null;
            const isCardActive = (current?.planId === plan.id) || isVipActive;
            return `
                        <article class="service-plan-card ${isCardActive ? 'active' : ''} position-relative" style="${isLocked ? 'overflow:hidden;' : ''}">
                            ${isLocked ? `
                            <div class="vip-lock-overlay" style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.95); display:flex; flex-direction:column; align-items:center; justify-content:center; padding:16px; text-align:center; z-index:2;">
                                <i data-lucide="lock" style="width:28px;height:28px;color:#64748b;margin-bottom:8px;"></i>
                                <h5 style="font-weight:700;color:#334155;font-size:0.9rem;margin-bottom:4px;">Gói hỗ trợ VIP</h5>
                                <p style="font-size:0.75rem;color:#64748b;margin:0;">Vui lòng kích hoạt gói Premium trước để mua gói VIP.</p>
                            </div>
                            ` : ''}
                            <div>
                                <div class="service-plan-head">
                                    <h3>${escapeHtml(plan.name)}</h3>
                                    ${isCardActive ? '<span>Đang dùng</span>' : ''}
                                </div>
                                <p>${escapeHtml(plan.description)}</p>
                                <strong>${formatVND(plan.price)}</strong>
                                <small>${plan.id === 3 ? '1 tin đăng VIP (Hạn theo gói Premium)' : `${plan.durationDays} ngày · ${plan.jobPostLimit} tin đăng`}</small>
                                <div class="service-benefits">
                                    ${(plan.benefits || []).map(b => `<span><i data-lucide="check" style="width:14px;height:14px;"></i>${escapeHtml(b)}</span>`).join('')}
                                </div>
                            </div>
                            <button class="btn-modern-primary" data-plan-id="${plan.id}" ${getPlanAction(plan).disabled || isLocked ? 'disabled' : ''}>
                                ${getPlanAction(plan).label}
                            </button>
                        </article>
                        `;
        }).join('')}
                </div>
            </section>

            <section class="service-history-section animate-in">
                <div class="section-header">
                    <h2 class="section-title">Lịch sử thanh toán</h2>
                </div>
                <div id="servicePaymentListContainer" class="service-payment-list">
                    <div class="text-muted text-center py-4">Đang tải lịch sử...</div>
                </div>
                <div id="servicePaymentPagination" style="display:flex;align-items:center;justify-content:space-between;margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;flex-wrap:wrap;gap:12px;"></div>
            </section>`;

        if (window.lucide) lucide.createIcons();

        document.getElementById('btnRenewCurrentPlan')?.addEventListener('click', renewCurrentServicePlan);
        panel.querySelectorAll('button[data-plan-id]').forEach(btn => {
            btn.addEventListener('click', () => purchaseServicePlan(Number(btn.dataset.planId)));
        });

        function renderPaymentsPage() {
            const listEl = document.getElementById('servicePaymentListContainer');
            const paginationEl = document.getElementById('servicePaymentPagination');
            if (!listEl) return;

            if (!payments.length) {
                listEl.innerHTML = '<div class="service-payment-empty">Chưa có lịch sử thanh toán gói dịch vụ.</div>';
                if (paginationEl) paginationEl.innerHTML = '';
                return;
            }

            const pageSize = Number(localStorage.getItem('j4s_pagesize_paymentHistory')) || 10;
            const total = payments.length;
            const totalPages = Math.ceil(total / pageSize);
            if (paymentHistoryPage > totalPages) paymentHistoryPage = Math.max(1, totalPages);

            const startIndex = (paymentHistoryPage - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const pagePayments = payments.slice(startIndex, endIndex);

            listEl.innerHTML = pagePayments.map(p => `
                <div class="service-payment-item">
                    <div>
                        <strong>${escapeHtml(p.description)}</strong>
                        <span>${escapeHtml(p.code)} · ${escapeHtml(p.createdAt)}</span>
                    </div>
                    <div>
                        <strong>${formatVND(p.amount)}</strong>
                        <span style="font-weight:700; color:${p.status === 'Success' ? '#059669' : '#dc2626'}">${escapeHtml(p.status === 'Success' ? 'Thành công' : p.status)}</span>
                    </div>
                </div>
            `).join('');

            if (paginationEl) {
                renderGenericPaginationControls(paginationEl, total, totalPages, paymentHistoryPage, pageSize, (newSize) => {
                    paymentHistoryPage = 1;
                    renderPaymentsPage();
                }, (newPage) => {
                    paymentHistoryPage = newPage;
                    renderPaymentsPage();
                }, 'j4s_pagesize_paymentHistory');
            }
        }

        renderPaymentsPage();
    }

    function showConfirmModal(message, onConfirm, title = 'Xác nhận thanh toán') {
        document.getElementById('j4sConfirmModal')?.remove();
        const modalHTML = `
            <div class="modal fade" id="j4sConfirmModal" tabindex="-1" aria-hidden="true" style="z-index: 1060;">
                <div class="modal-dialog modal-dialog-centered" style="max-width: 400px;">
                    <div class="modal-content" style="border-radius: 16px; border: none; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);">
                        <div class="modal-body p-4 text-center">
                            <div class="mb-3 d-inline-flex align-items-center justify-content-center" style="width: 56px; height: 56px; background-color: #f0f9ff; color: #0284c7; border-radius: 50%;">
                                <i data-lucide="help-circle" style="width: 28px; height: 28px;"></i>
                            </div>
                            <h5 class="fw-bold text-slate-800 mb-2">${title}</h5>
                            <p class="text-muted small mb-4" style="line-height: 1.5;">${message}</p>
                            <div class="d-flex gap-2 justify-content-center">
                                <button type="button" class="btn btn-light rounded-pill px-4 py-2 fw-semibold text-slate-600 small" style="border: 1px solid #e2e8f0; font-size: 0.85rem;" data-bs-dismiss="modal">Hủy bỏ</button>
                                <button type="button" id="j4sConfirmBtn" class="btn btn-primary rounded-pill px-4 py-2 fw-bold small" style="background: #0ea5e9; border: none; font-size: 0.85rem;">Xác nhận</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modalEl = document.getElementById('j4sConfirmModal');
        if (window.lucide) lucide.createIcons();
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
        document.getElementById('j4sConfirmBtn').addEventListener('click', () => {
            modal.hide();
            modalEl.addEventListener('hidden.bs.modal', () => {
                modalEl.remove();
                onConfirm();
            }, { once: true });
        });
    }

    function showPromptModal(message, defaultValue, onConfirm, title = 'Nhập thông tin') {
        document.getElementById('j4sPromptModal')?.remove();
        const modalHTML = `
            <div class="modal fade" id="j4sPromptModal" tabindex="-1" aria-hidden="true" style="z-index: 1060;">
                <div class="modal-dialog modal-dialog-centered" style="max-width: 400px;">
                    <div class="modal-content" style="border-radius: 16px; border: none; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);">
                        <div class="modal-body p-4">
                            <div class="text-center mb-3">
                                <div class="d-inline-flex align-items-center justify-content-center" style="width: 56px; height: 56px; background-color: #f0f9ff; color: #0284c7; border-radius: 50%;">
                                    <i data-lucide="help-circle" style="width: 28px; height: 28px;"></i>
                                </div>
                            </div>
                            <h5 class="fw-bold text-slate-800 text-center mb-2">${title}</h5>
                            <p class="text-muted small text-center mb-3" style="line-height: 1.5;">${message}</p>
                            <div class="mb-4">
                                <input type="text" id="j4sPromptInput" class="form-control text-center" value="${defaultValue}" style="border-radius: 8px;" />
                            </div>
                            <div class="d-flex gap-2 justify-content-center">
                                <button type="button" class="btn btn-light rounded-pill px-4 py-2 fw-semibold text-slate-600 small" style="border: 1px solid #e2e8f0; font-size: 0.85rem;" data-bs-dismiss="modal">Hủy bỏ</button>
                                <button type="button" id="j4sPromptBtn" class="btn btn-primary rounded-pill px-4 py-2 fw-bold small" style="background: #0ea5e9; border: none; font-size: 0.85rem;">Xác nhận</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modalEl = document.getElementById('j4sPromptModal');
        if (window.lucide) lucide.createIcons();
        const modal = new bootstrap.Modal(modalEl);
        modal.show();

        setTimeout(() => document.getElementById('j4sPromptInput')?.focus(), 500);

        document.getElementById('j4sPromptBtn').addEventListener('click', () => {
            const val = document.getElementById('j4sPromptInput').value;
            modal.hide();
            modalEl.addEventListener('hidden.bs.modal', () => {
                modalEl.remove();
                onConfirm(val);
            }, { once: true });
        });
    }

    window.showConfirmModal = showConfirmModal;
    window.showPromptModal = showPromptModal;

    function purchaseServicePlan(planId) {
        showConfirmModal('Xác nhận thanh toán/nâng cấp gói dịch vụ này bằng số dư ví?', () => {
            postJson('/Home/PurchaseServicePlan', { planId })
                .then(data => {
                    showToast(data.message || 'Đã xử lý thanh toán gói dịch vụ.', data.success ? 'success' : 'error');
                    if (data.success) {
                        const userProfileEl = document.getElementById('userProfile');
                        if (userProfileEl) {
                            userProfileEl.dataset.hasActivePackage = 'true';
                        }
                        setupBusinessDashboardShell();
                        bindBusinessSidebarNav();
                        setActiveSidebar('servicePackages');
                        loadServicePackages();
                        loadBusinessHomeData();
                        if (typeof window.getWalletData === 'function') {
                            window.getWalletData();
                        }
                    }
                })
                .catch(err => {
                    console.error(err);
                    showToast('Không thể thanh toán gói dịch vụ.', 'error');
                });
        });
    }

    function renewCurrentServicePlan() {
        showConfirmModal('Xác nhận gia hạn gói hiện tại bằng số dư ví?', () => {
            postJson('/Home/RenewServicePlan', { isAutoRenew: false })
                .then(data => {
                    showToast(data.message || 'Đã gia hạn gói dịch vụ.', data.success ? 'success' : 'error');
                    if (data.success) {
                        const userProfileEl = document.getElementById('userProfile');
                        if (userProfileEl) {
                            userProfileEl.dataset.hasActivePackage = 'true';
                        }
                        setupBusinessDashboardShell();
                        bindBusinessSidebarNav();
                        setActiveSidebar('servicePackages');
                        loadServicePackages();
                        loadBusinessHomeData();
                        if (typeof window.getWalletData === 'function') {
                            window.getWalletData();
                        }
                    }
                })
                .catch(err => {
                    console.error(err);
                    showToast('Không thể gia hạn gói dịch vụ.', 'error');
                });
        });
    }

    window.purchaseServicePlan = purchaseServicePlan;
    window.renewCurrentServicePlan = renewCurrentServicePlan;

    // ============================================
    // RENDER: Dự án đang làm
    // ============================================
    function renderCandidateSearchView() {
        candidateSearchPage = 1;
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

            <div class="profile-card-modern p-4" style="background:#fff; border-radius:12px; border:1px solid #e2e8f0; margin-top:16px;">
                <div id="candidateResultsPanel" class="candidate-results-panel">
                    <div style="display:flex;align-items:center;justify-content:center;min-height:220px;color:var(--text-secondary);font-weight:600;">
                        <span class="spinner-border spinner-border-sm" style="margin-right:8px;"></span> Đang tải hồ sơ ứng viên...
                    </div>
                </div>
                <div id="candidateSearchPagination" style="display:flex;align-items:center;justify-content:space-between;margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;flex-wrap:wrap;gap:12px;"></div>
            </div>`;

        if (window.lucide) lucide.createIcons();
        document.getElementById('btnSearchCandidates')?.addEventListener('click', () => {
            candidateSearchPage = 1;
            loadCandidateProfiles();
        });
        document.getElementById('btnResetCandidateFilters')?.addEventListener('click', () => {
            ['candidateKeyword', 'candidateSkill', 'candidateMajor', 'candidateMaxSalary', 'candidateExperience'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            const rating = document.getElementById('candidateMinRating');
            if (rating) rating.value = '';
            candidateSearchPage = 1;
            loadCandidateProfiles();
        });
        document.querySelectorAll('#candidateKeyword,#candidateSkill,#candidateMajor,#candidateExperience').forEach(input => {
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    candidateSearchPage = 1;
                    loadCandidateProfiles();
                }
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
                candidateSearchList = data.candidates || [];
                renderCandidateProfilesPage();
            })
            .catch(err => {
                console.error(err);
                showToast('Không thể kết nối đến máy chủ.', 'error');
            });
    }

    function renderCandidateProfilesPage() {
        const panel = document.getElementById('candidateResultsPanel');
        const paginationEl = document.getElementById('candidateSearchPagination');
        if (!panel) return;

        if (!candidateSearchList.length) {
            panel.innerHTML = `
                <div class="profile-card-modern animate-in" style="padding:34px;text-align:center;">
                    <i data-lucide="search-x" style="width:34px;height:34px;color:var(--primary);"></i>
                    <h3 style="margin:12px 0 6px;">Chưa tìm thấy ứng viên phù hợp</h3>
                    <p style="color:var(--text-muted);margin:0;">Thử nới bộ lọc hoặc tìm bằng kỹ năng/ngành nghề khác.</p>
                </div>`;
            if (window.lucide) lucide.createIcons();
            if (paginationEl) paginationEl.innerHTML = '';
            return;
        }

        const pageSize = Number(localStorage.getItem('j4s_pagesize_candidateSearch')) || 10;
        const total = candidateSearchList.length;
        const totalPages = Math.ceil(total / pageSize);
        if (candidateSearchPage > totalPages) candidateSearchPage = Math.max(1, totalPages);

        const startIndex = (candidateSearchPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageCandidates = candidateSearchList.slice(startIndex, endIndex);

        panel.innerHTML = `
            <div class="candidate-result-list">
                ${pageCandidates.map(candidate => `
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
                        </div>
                    </article>
                `).join('')}
            </div>`;

        if (window.lucide) lucide.createIcons();
        panel.querySelectorAll('.candidate-card').forEach(card => {
            const studentId = Number(card.dataset.candidateId);
            card.querySelector('[data-action="view"]')?.addEventListener('click', () => openCandidateProfileModal(studentId));
        });

        if (paginationEl) {
            renderGenericPaginationControls(paginationEl, total, totalPages, candidateSearchPage, pageSize, (newSize) => {
                candidateSearchPage = 1;
                renderCandidateProfilesPage();
            }, (newPage) => {
                candidateSearchPage = newPage;
                renderCandidateProfilesPage();
                document.getElementById('mainContent')?.scrollIntoView({ behavior: 'smooth' });
            }, 'j4s_pagesize_candidateSearch');
        }
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
                    </div>`;

                document.body.appendChild(modal);
                if (window.lucide) lucide.createIcons();
                requestAnimationFrame(() => modal.classList.add('active'));
                modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
                modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal); });
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
        studentProjectsPage = 1;
        mainContent.innerHTML = `
            <div class="page-header animate-in">
                <h1 class="page-title"><i data-lucide="folder-open" style="width:24px;height:24px;"></i> Dự án của mình</h1>
                <p class="page-subtitle">Quản lý các dự án bạn đang thực hiện và đã hoàn thành</p>
            </div>
            <div class="projects-list" id="studentProjectsList">
                <div style="padding:18px;color:var(--text-muted);font-weight:700;"><span class="spinner-border spinner-border-sm" style="margin-right:8px;"></span> Đang tải danh sách dự án...</div>
            </div>
            <div id="studentProjectsPagination" style="display:flex;align-items:center;justify-content:space-between;margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;flex-wrap:wrap;gap:12px;"></div>`;
        if (window.lucide) lucide.createIcons();
        loadStudentActiveContracts();
    }

    function loadStudentActiveContracts() {
        fetch('/Home/GetStudentActiveContracts')
            .then(res => res.json())
            .then(data => {
                const list = document.getElementById('studentProjectsList');
                const paginationEl = document.getElementById('studentProjectsPagination');
                if (!list) return;

                if (!data.success) {
                    showToast(data.message || 'Không thể tải danh sách dự án.', 'error');
                    list.innerHTML = `<div style="padding:18px;color:#ef4444;font-weight:700;">Lỗi: ${data.message}</div>`;
                    if (paginationEl) paginationEl.innerHTML = '';
                    return;
                }

                studentProjectsList = data.contracts || [];
                renderStudentProjectsPage();
            })
            .catch(err => {
                console.error(err);
                const list = document.getElementById('studentProjectsList');
                if (list) {
                    list.innerHTML = `<div style="padding:18px;color:#ef4444;font-weight:700;">Không thể kết nối đến máy chủ.</div>`;
                }
            });
    }

    function renderStudentProjectsPage() {
        const list = document.getElementById('studentProjectsList');
        const paginationEl = document.getElementById('studentProjectsPagination');
        if (!list) return;

        if (!studentProjectsList.length) {
            list.innerHTML = '<div class="service-payment-empty" style="text-align:center; padding:40px; color:var(--text-muted); font-weight:600;">Chưa có dự án nào.</div>';
            if (paginationEl) paginationEl.innerHTML = '';
            return;
        }

        const total = studentProjectsList.length;
        const totalPages = Math.ceil(total / studentProjectsPageSize);
        if (studentProjectsPage > totalPages) studentProjectsPage = Math.max(1, totalPages);

        const startIndex = (studentProjectsPage - 1) * studentProjectsPageSize;
        const endIndex = startIndex + studentProjectsPageSize;
        const pageContracts = studentProjectsList.slice(startIndex, endIndex);

        list.innerHTML = pageContracts.map(p => `
            <div class="project-card animate-in" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:16px; padding:20px; margin-bottom:16px; box-shadow:0 4px 15px rgba(0,0,0,0.01);">
                <div class="project-header" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; gap: 12px;">
                    <h3 style="margin:0; font-size:1.1rem; font-weight:800; color:#0f172a;">${escapeHtml(p.title)}</h3>
                    <span class="project-status" style="${p.contractStatus === 'Completed' ? 'background:#e0f2fe; color:#0369a1;' : (p.contractStatus === 'Submitted' ? 'background:#fef3c7; color:#d97706;' : 'background:#ecfdf5; color:#059669;')} padding:4px 12px; border-radius:999px; font-size:0.75rem; font-weight:700;">${escapeHtml(p.status)}</span>
                </div>
                <div class="project-client" style="color:#475569; font-size:0.88rem; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                    <i data-lucide="building" style="width:16px;height:16px;color:#64748b;"></i>
                    Khách hàng: <strong>${escapeHtml(p.client)}</strong>
                </div>
                <div class="project-footer" style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #f1f5f9; padding-top:14px; margin-top:14px;">
                    <span class="project-deadline" style="font-size:0.85rem; color:#ef4444; font-weight:600; display:flex; align-items:center; gap:6px;">
                        <i data-lucide="calendar" style="width:16px;height:16px;"></i> Hạn chót: ${escapeHtml(p.deadline)}
                    </span>
                    <span class="project-budget" style="font-size:1.1rem; font-weight:900; color:#0f766e;">${formatVND(p.budget)}</span>
                </div>
                <div class="project-actions" style="margin-top:16px; display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap; align-items:center;">
                    <button class="btn-sm btn-outline chat-client-btn" data-client-id="${p.clientId}" style="display:flex; align-items:center; gap:6px; font-weight:600; padding:6px 14px;">
                        <i data-lucide="message-square" style="width:14px;height:14px;"></i> Trao đổi với khách hàng
                    </button>
                    ${p.contractStatus === 'Completed' ? `
                        <span style="color:#0369a1; font-weight:700; display:inline-flex; align-items:center; gap:6px; font-size:0.9rem; padding:6px 14px; background:#e0f2fe; border-radius:8px;">
                            <i data-lucide="check-circle" style="width:16px;height:16px;"></i> Dự án đã kết thúc
                        </span>
                    ` : (p.studentCompleted ? `
                        <button class="btn-sm" disabled style="display:flex; align-items:center; gap:6px; font-weight:600; padding:6px 14px; background:#d1fae5; color:#065f46; border:none; border-radius:8px; cursor:not-allowed; opacity:0.85;">
                            <i data-lucide="clock" style="width:14px;height:14px;"></i> ${p.businessCompleted ? 'Cả hai đã xác nhận' : 'Chờ doanh nghiệp xác nhận'}
                        </button>
                    ` : `
                        <button class="btn-sm complete-project-btn" data-contract-id="${p.id}" style="display:flex; align-items:center; gap:6px; font-weight:700; padding:6px 16px; background:linear-gradient(135deg,#10b981,#059669); color:#fff; border:none; border-radius:8px; cursor:pointer; box-shadow:0 2px 8px rgba(16,185,129,0.25);">
                            <i data-lucide="check-circle" style="width:14px;height:14px;"></i> ${p.businessCompleted ? 'Xác nhận hoàn thành (DN đã xác nhận)' : 'Hoàn thành'}
                        </button>
                    `)}
                </div>
            </div>
        `).join('');

        if (window.lucide) lucide.createIcons();

        // Bind chat click
        list.querySelectorAll('.chat-client-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const clientId = Number(this.dataset.clientId);
                chatWithClient(clientId);
            });
        });

        // Bind complete click
        list.querySelectorAll('.complete-project-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const contractId = Number(this.dataset.contractId);
                completeStudentProject(contractId);
            });
        });

        if (paginationEl) {
            renderGenericPaginationControls(paginationEl, total, totalPages, studentProjectsPage, studentProjectsPageSize, (newSize) => {
                studentProjectsPageSize = newSize;
                studentProjectsPage = 1;
                renderStudentProjectsPage();
            }, (newPage) => {
                studentProjectsPage = newPage;
                renderStudentProjectsPage();
                document.getElementById('mainContent')?.scrollIntoView({ behavior: 'smooth' });
            }, 'j4s_pagesize_studentProjects');
        }
    }

    function completeStudentProject(contractId) {
        showConfirmModal('Bạn chắc chắn muốn đánh dấu dự án này là hoàn thành? Trạng thái sẽ được lưu vào hệ thống.', () => {
            const body = new FormData();
            body.append('contractId', contractId);
            fetch('/Home/CompleteContract', {
                method: 'POST',
                body: body,
                headers: {
                    'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]')?.value
                }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        showToast(data.message || 'Đã hoàn thành dự án!', 'success');
                        loadStudentActiveContracts();
                    } else {
                        showToast(data.message || 'Lỗi khi hoàn thành dự án.', 'error');
                    }
                })
                .catch(err => {
                    console.error(err);
                    showToast('Không thể kết nối đến máy chủ.', 'error');
                });
        }, 'Xác nhận hoàn thành dự án');
    }

    function chatWithClient(clientId) {
        pendingChatUserId = clientId;
        setActiveSidebar('messages');
        currentSidebarMode = 'messages';
        renderMessagesView();
        showToast('Đang mở hội thoại với khách hàng...', 'info');
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
        } else if (data.role === 'Admin' && data.displayName) {
            initials = data.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        }

        // Calculate average rating from reviews
        const reviewsCount = data.reviews ? data.reviews.length : 0;
        const avgRating = data.reviews && data.reviews.length > 0
            ? (data.reviews.reduce((sum, r) => sum + r.rating, 0) / data.reviews.length).toFixed(1)
            : "0.0";

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
            const studentLevel = data.completedJobsCount >= 10 ? 3 : (data.completedJobsCount >= 3 ? 2 : 1);
            const ratingBadgeHTML = reviewsCount > 0
                ? `<span class="badge-modern badge-modern-orange">★ ${avgRating} (${reviewsCount} đánh giá)</span>`
                : `<span class="badge-modern badge-modern-gray"><i data-lucide="star" style="width:13px;height:13px;"></i> Chưa có đánh giá</span>`;

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
                                    <span class="badge-modern badge-modern-gray"><i data-lucide="graduation-cap" style="width:13px;height:13px;"></i> Level ${studentLevel}</span>
                                    <span class="badge-modern badge-modern-orange">★ ${avgRating} (${reviewsCount} đánh giá)</span>
                                </div>
                            </div>
                        </div>
                        <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end;">

                            <button class="btn-modern-primary" id="btnEditProfile">
                                <i data-lucide="edit-3" style="width:16px;height:16px;"></i> Chỉnh sửa hồ sơ
                            </button>
                        </div>
                    </div>

                    <div class="profile-stats-modern-grid" style="grid-template-columns: repeat(3, 1fr);">
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
                                <span class="stat-modern-value">${reviewsCount > 0 ? avgRating + ' ★' : 'Chưa có'}</span>
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
        } else if (data.role === 'Business') {
            const tagline = data.industry ? `${data.industry} | Doanh nghiệp` : 'Doanh nghiệp tuyển dụng';
            const ratingBadgeHTML = reviewsCount > 0
                ? `<span class="badge-modern badge-modern-orange">★ ${avgRating} (${reviewsCount} đánh giá)</span>`
                : `<span class="badge-modern badge-modern-gray"><i data-lucide="star" style="width:13px;height:13px;"></i> Chưa có đánh giá</span>`;

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
                                ${data.logoUrl
                    ? `<img src="${data.logoUrl}" alt="${escapeHtml(data.companyName)}" id="profileAvatarImg" />`
                    : `<span>${escapeHtml(initials)}</span>`
                }
                            </div>
                            <div class="profile-meta-text">
                                <h2>${escapeHtml(data.companyName)}</h2>
                                <div class="tagline">${escapeHtml(tagline)}</div>
                                <div class="badge-row">
                                    ${data.isVerified ? `<span class="badge-modern badge-modern-blue"><i data-lucide="check-circle" style="width:13px;height:13px;"></i> Đã xác minh</span>` : ''}
                                    ${ratingBadgeHTML}
                                </div>
                            </div>
                        </div>
                        <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end;">
                            <button class="btn-modern-primary" id="btnEditProfile">
                                <i data-lucide="edit-3" style="width:16px;height:16px;"></i> Chỉnh sửa hồ sơ
                            </button>
                        </div>
                    </div>

                    <div class="profile-stats-modern-grid" style="grid-template-columns: repeat(3, 1fr);">
                        <div class="stat-modern-card animate-in">
                            <div class="stat-modern-icon"><i data-lucide="briefcase" style="width:20px;height:20px;"></i></div>
                            <div class="stat-modern-info">
                                <span class="stat-modern-value">${data.openJobsCount}</span>
                                <span class="stat-modern-title">Tin tuyển dụng mở</span>
                            </div>
                        </div>
                        <div class="stat-modern-card animate-in">
                            <div class="stat-modern-icon"><i data-lucide="star" style="width:20px;height:20px;"></i></div>
                            <div class="stat-modern-info">
                                <span class="stat-modern-value">${reviewsCount > 0 ? avgRating + ' ★' : 'Chưa có'}</span>
                                <span class="stat-modern-title">Đánh giá trung bình</span>
                            </div>
                        </div>
                        <div class="stat-modern-card animate-in">
                            <div class="stat-modern-icon"><i data-lucide="award" style="width:20px;height:20px;"></i></div>
                            <div class="stat-modern-info">
                                <span class="stat-modern-value">${data.completedJobsCount}</span>
                                <span class="stat-modern-title">Dự án hoàn thành</span>
                            </div>
                        </div>
                    </div>

                    <div class="profile-content-grid">
                        <div style="display: flex; flex-direction: column; gap: 24px;">
                            <div class="profile-card-modern animate-in">
                                <h3><i data-lucide="info" style="width:16px;height:16px;"></i> Giới thiệu công ty</h3>
                                <p style="font-size:14px; color: var(--text-secondary); margin:0; line-height: 1.6; white-space: pre-line;">
                                    ${escapeHtml(data.description || 'Chưa cập nhật giới thiệu công ty.')}
                                </p>
                            </div>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 24px;">
                            <div class="profile-card-modern animate-in">
                                <h3><i data-lucide="building" style="width:16px;height:16px;"></i> Thông tin doanh nghiệp</h3>
                                <div class="info-list-modern">
                                    <div class="info-item-modern">
                                        <i data-lucide="tag" style="width:16px;height:16px;"></i>
                                        <span class="label">Lĩnh vực:</span>
                                        <span class="value">${escapeHtml(data.industry || 'Chưa cập nhật')}</span>
                                    </div>
                                    <div class="info-item-modern">
                                        <i data-lucide="users" style="width:16px;height:16px;"></i>
                                        <span class="label">Quy mô:</span>
                                        <span class="value">${escapeHtml(data.companySize || 'Chưa cập nhật')}</span>
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
                                        <span class="label">Email liên hệ:</span>
                                        <span class="value" style="word-break: break-all;">${escapeHtml(data.email)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else if (data.role === 'Admin') {
            const adminTagline = 'Quản trị viên hệ thống';
            const adminActivityHTML = data.reviews && data.reviews.length > 0
                ? `<div class="reviews-modern-container">` + data.reviews.map(r => `
                    <div class="review-modern-item">
                        <div class="review-avatar-box">
                            ${r.reviewerAvatar
                        ? `<img src="${r.reviewerAvatar}" alt="${escapeHtml(r.reviewerName)}" />`
                        : `<span>${escapeHtml((r.reviewerName || 'KH').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase())}</span>`
                    }
                        </div>
                        <div class="review-body-box">
                            <div class="review-header-box">
                                <span class="reviewer-name">${escapeHtml(r.reviewerName)}</span>
                                <span class="review-date">${escapeHtml(r.createdAt)}</span>
                            </div>
                            <div class="review-stars">${'★'.repeat(Math.round(r.rating))}${'☆'.repeat(5 - Math.round(r.rating))}</div>
                            <p class="review-comment-text">${escapeHtml(r.comment || 'Không có nhận xét.')}</p>
                        </div>
                    </div>
                `).join('') + `</div>`
                : '<p style="color: var(--text-muted); font-style: italic; font-size: 13px;">Chưa có hoạt động hệ thống gần đây.</p>';

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
                            <div class="profile-avatar-frame" style="background: linear-gradient(135deg, #7c3aed, #0f172a);">
                                <span>${escapeHtml(initials)}</span>
                            </div>
                            <div class="profile-meta-text">
                                <h2>${escapeHtml(data.displayName || data.email || 'Admin')}</h2>
                                <div class="tagline">${escapeHtml(adminTagline)}</div>
                                <div class="badge-row">
                                    <span class="badge-modern badge-modern-blue"><i data-lucide="shield-check" style="width:13px;height:13px;"></i> Quản trị viên</span>
                                    <span class="badge-modern badge-modern-gray"><i data-lucide="calendar" style="width:13px;height:13px;"></i> Từ ${escapeHtml(data.joinedAt || 'hôm nay')}</span>
                                    <span class="badge-modern badge-modern-orange">★ ${avgRating} (${reviewsCount} hoạt động)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="profile-stats-modern-grid">
                        <div class="stat-modern-card animate-in">
                            <div class="stat-modern-icon"><i data-lucide="users" style="width:20px;height:20px;"></i></div>
                            <div class="stat-modern-info">
                                <span class="stat-modern-value">${data.totalUsers}</span>
                                <span class="stat-modern-title">Tổng người dùng</span>
                            </div>
                        </div>
                        <div class="stat-modern-card animate-in">
                            <div class="stat-modern-icon"><i data-lucide="file-text" style="width:20px;height:20px;"></i></div>
                            <div class="stat-modern-info">
                                <span class="stat-modern-value">${data.totalJobs}</span>
                                <span class="stat-modern-title">Tổng tin tuyển dụng</span>
                            </div>
                        </div>
                        <div class="stat-modern-card animate-in">
                            <div class="stat-modern-icon"><i data-lucide="handshake" style="width:20px;height:20px;"></i></div>
                            <div class="stat-modern-info">
                                <span class="stat-modern-value">${data.totalContracts}</span>
                                <span class="stat-modern-title">Tổng hợp đồng</span>
                            </div>
                        </div>
                        <div class="stat-modern-card animate-in">
                            <div class="stat-modern-icon"><i data-lucide="wallet" style="width:20px;height:20px;"></i></div>
                            <div class="stat-modern-info">
                                <span class="stat-modern-value">${formatVND(data.systemVolume || data.balance || 0)}</span>
                                <span class="stat-modern-title">Tổng số dư hệ thống</span>
                            </div>
                        </div>
                    </div>

                    <div class="profile-content-grid" style="grid-template-columns: 1fr;">
                        <div class="profile-card-modern animate-in">
                            <h3><i data-lucide="info" style="width:16px;height:16px;"></i> Thông tin tài khoản</h3>
                            <div class="info-list-modern">
                                <div class="info-item-modern">
                                    <i data-lucide="mail" style="width:16px;height:16px;"></i>
                                    <span class="label">Email:</span>
                                    <span class="value">${escapeHtml(data.email)}</span>
                                </div>
                                <div class="info-item-modern">
                                    <i data-lucide="phone" style="width:16px;height:16px;"></i>
                                    <span class="label">Điện thoại:</span>
                                    <span class="value">${escapeHtml(data.phone || 'Chưa cập nhật')}</span>
                                </div>
                                <div class="info-item-modern">
                                    <i data-lucide="shield" style="width:16px;height:16px;"></i>
                                    <span class="label">Vai trò:</span>
                                    <span class="value">Admin</span>
                                </div>
                                <div class="info-item-modern">
                                    <i data-lucide="wallet" style="width:16px;height:16px;"></i>
                                    <span class="label">Số dư ví:</span>
                                    <span class="value">${formatVND(data.balance)}</span>
                                </div>
                            </div>
                        </div>

                        <div class="profile-card-modern animate-in" style="margin-top: 24px;">
                            <h3><i data-lucide="activity" style="width:16px;height:16px;"></i> Hoạt động gần đây</h3>
                            ${adminActivityHTML}
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
                </div>
            </div>`;

        modal.innerHTML = modalHTML;
        document.body.appendChild(modal);
        if (window.lucide) lucide.createIcons();
        requestAnimationFrame(() => modal.classList.add('active'));

        modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
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
                    // Validate file extension
                    const allowedExtensions = ['.pdf', '.doc', '.docx'];
                    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
                    if (!allowedExtensions.includes(fileExt)) {
                        showToast('Chỉ chấp nhận file CV định dạng .pdf, .doc, .docx!', 'error');
                        cvInput.value = '';
                        return;
                    }

                    // Validate file size (max 5MB)
                    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
                    if (file.size > maxSizeBytes) {
                        showToast('File CV không được vượt quá 5MB!', 'error');
                        cvInput.value = '';
                        return;
                    }

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

                // Validate GPA range [0.0 - 4.0]
                if (payload.gpa !== null && (isNaN(payload.gpa) || payload.gpa < 0 || payload.gpa > 4.0)) {
                    showToast('GPA phải nằm trong khoảng từ 0.0 đến 4.0!', 'warning');
                    return;
                }

                // Validate Date of Birth (age must be 15–70)
                if (payload.dateOfBirth) {
                    const dob = new Date(payload.dateOfBirth);
                    const today = new Date();
                    const ageDiff = today.getFullYear() - dob.getFullYear();
                    const hadBirthday = today >= new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
                    const age = hadBirthday ? ageDiff : ageDiff - 1;
                    if (age < 15 || age > 70) {
                        showToast('Tuổi không hợp lệ. Tuổi phải từ 15 đến 70!', 'warning');
                        return;
                    }
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
        let currentPage = 1;
        let pageSize = Number(localStorage.getItem('j4s_pagesize_businessJobs')) || 10;
        let activeJobs = [];

        mainContent.innerHTML = `
            <div class="page-header">
                <h1 class="page-title"><i data-lucide="file-text" style="width:24px;height:24px;"></i> Quản lý tin đăng</h1>
                <p class="page-subtitle">Theo dõi bài đăng tuyển dụng và số lượng ứng viên ứng tuyển</p>
            </div>
            <div class="card border-0 shadow-sm p-4" style="border-radius:12px; background:#fff; border:1px solid #e2e8f0;">
                <div id="businessJobsList" style="display:flex; flex-direction:column; gap:12px;">
                    <div class="text-muted text-center py-4">Đang tải tin đăng...</div>
                </div>
                <div id="businessJobsPagination" style="display:flex;align-items:center;justify-content:space-between;margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;flex-wrap:wrap;gap:12px;"></div>
            </div>`;
        if (window.lucide) lucide.createIcons();

        function renderPage() {
            const list = document.getElementById('businessJobsList');
            const paginationEl = document.getElementById('businessJobsPagination');
            if (!list) return;

            if (!activeJobs.length) {
                list.innerHTML = `<div class="empty-state"><div class="empty-icon">📄</div><h3>Chưa có tin đăng</h3><p>Hãy tạo tin tuyển dụng đầu tiên để nhận ứng viên.</p></div>`;
                if (paginationEl) paginationEl.innerHTML = '';
                return;
            }

            const total = activeJobs.length;
            const totalPages = Math.ceil(total / pageSize);
            if (currentPage > totalPages) currentPage = Math.max(1, totalPages);

            const startIndex = (currentPage - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const pageJobs = activeJobs.slice(startIndex, endIndex);

            list.innerHTML = pageJobs.map(job => {
                const approvalText = job.isApproved ? 'Đã duyệt' : 'Chờ duyệt';
                const approvalColor = job.isApproved ? '#059669' : '#d97706';
                const statusText = job.status === 'Open' ? 'Đang mở' : job.status === 'In_Progress' ? 'Đang thực hiện' : job.status === 'Closed' ? 'Đã đóng' : job.status === 'Rejected' ? 'Bị từ chối' : job.status;
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
                            <button class="btn-indigo-outline btnEditBusinessJob" data-job-id="${job.id}" style="padding:8px 12px; border-radius:8px; font-size:0.82rem;">
                                <i data-lucide="pencil" style="width:14px;height:14px;"></i> Chỉnh sửa
                            </button>
                            <button class="btn-indigo-outline btnExtendBusinessJob" data-job-id="${job.id}" style="padding:8px 12px; border-radius:8px; font-size:0.82rem; color:#0f766e; border-color:#99f6e4;">
                                <i data-lucide="calendar-plus" style="width:14px;height:14px;"></i> Gia hạn
                            </button>
                            <button class="btn-indigo-outline btnCloseBusinessJob" data-job-id="${job.id}" style="padding:8px 12px; border-radius:8px; font-size:0.82rem; color:#b45309; border-color:#fde68a;">
                                <i data-lucide="archive" style="width:14px;height:14px;"></i> Đóng tin
                            </button>
                            <button class="btn-indigo-outline btnDeleteBusinessJob" data-job-id="${job.id}" style="padding:8px 12px; border-radius:8px; font-size:0.82rem; color:#dc2626; border-color:#fecaca;">
                                <i data-lucide="trash-2" style="width:14px;height:14px;"></i> Xóa tin
                            </button>
                            <button class="btn-indigo-outline btnViewBusinessApplicants" data-job-id="${job.id}" style="padding:8px 12px; border-radius:8px; font-size:0.82rem;">
                                <i data-lucide="users" style="width:14px;height:14px;"></i> Xem ứng viên
                            </button>
                        </div>
                    </div>`;
            }).join('');
            if (window.lucide) lucide.createIcons();

            document.querySelectorAll('.btnEditBusinessJob').forEach(btn => {
                btn.addEventListener('click', () => {
                    const job = (window.businessJobsData || []).find(j => String(j.id) === String(btn.dataset.jobId));
                    window.openBusinessJobEditor?.(job);
                });
            });
            document.querySelectorAll('.btnExtendBusinessJob').forEach(btn => {
                btn.addEventListener('click', () => window.performBusinessJobAction?.(btn.dataset.jobId, 'extend'));
            });
            document.querySelectorAll('.btnCloseBusinessJob').forEach(btn => {
                btn.addEventListener('click', () => window.performBusinessJobAction?.(btn.dataset.jobId, 'close'));
            });
            document.querySelectorAll('.btnDeleteBusinessJob').forEach(btn => {
                btn.addEventListener('click', () => window.performBusinessJobAction?.(btn.dataset.jobId, 'delete'));
            });
            document.querySelectorAll('.btnViewBusinessApplicants').forEach(btn => {
                btn.addEventListener('click', () => renderBusinessApplicantsView(btn.dataset.jobId));
            });

            if (paginationEl) {
                renderGenericPaginationControls(paginationEl, total, totalPages, currentPage, pageSize, (newSize) => {
                    pageSize = newSize;
                    currentPage = 1;
                    renderPage();
                }, (newPage) => {
                    currentPage = newPage;
                    renderPage();
                    document.getElementById('mainContent')?.scrollIntoView({ behavior: 'smooth' });
                }, 'j4s_pagesize_businessJobs');
            }
        }

        try {
            const res = await fetch('/Home/GetBusinessJobs');
            const data = await res.json();
            const list = document.getElementById('businessJobsList');
            if (!data.success) {
                list.innerHTML = `<div class="alert alert-danger m-0">${escapeHtml(data.message || 'Không thể tải tin đăng.')}</div>`;
                return;
            }

            activeJobs = data.jobs || [];

            // Sort jobs: VIP first, then by Status (In_Progress -> Approved Open -> Pending Approval -> Closed)
            activeJobs.sort((a, b) => {
                if (a.isVip && !b.isVip) return -1;
                if (!a.isVip && b.isVip) return 1;

                const getStatusPriority = (job) => {
                    if (job.status === 'In_Progress') return 1;
                    if (job.isApproved && job.status === 'Open') return 2;
                    if (!job.isApproved) return 3;
                    if (job.status === 'Closed') return 4;
                    return 5;
                };

                const priorityA = getStatusPriority(a);
                const priorityB = getStatusPriority(b);

                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }

                // If same status, sort by ID descending (newest first)
                return b.id - a.id;
            });

            window.businessJobsData = activeJobs;
            renderPage();
        } catch (err) {
            console.error(err);
            document.getElementById('businessJobsList').innerHTML = `<div class="alert alert-danger m-0">Không thể kết nối máy chủ.</div>`;
        }
    }

    window.preparePostJobForm = function () {
        const form = document.getElementById('postJobForm');
        if (!form) return;
        form.reset();
        const modeInput = document.getElementById('jobFormMode');
        const jobIdInput = document.getElementById('jobFormId');
        const saveModeInput = document.getElementById('jobFormSaveMode');
        const titleEl = document.getElementById('postJobModalTitle');
        const submitBtn = document.getElementById('btnSubmitJob');
        const draftBtn = document.getElementById('btnSaveDraftJob');
        if (modeInput) modeInput.value = 'new';
        if (jobIdInput) jobIdInput.value = '';
        if (saveModeInput) saveModeInput.value = 'publish';
        if (titleEl) titleEl.textContent = 'Đăng tin tuyển dụng mới';
        if (submitBtn) submitBtn.textContent = 'Đăng tin ngay';
        if (draftBtn) draftBtn.classList.remove('d-none');
        document.getElementById('jobTemplateBar')?.classList.remove('d-none');
        document.getElementById('btnDeleteTemplate')?.classList.add('d-none');
        const templateSelect = document.getElementById('jobTemplateSelect');
        if (templateSelect) templateSelect.value = '';
        loadJobTemplatesIntoSelect();
    };

    window.openBusinessJobEditor = function (job) {
        if (!job) {
            showToast('Không tìm thấy dữ liệu tin đăng.', 'error');
            return;
        }

        const form = document.getElementById('postJobForm');
        if (!form) return;
        form.reset();

        document.getElementById('jobFormMode').value = 'edit';
        document.getElementById('jobFormId').value = job.id;
        document.getElementById('jobFormSaveMode').value = job.status === 'Draft' ? 'draft' : 'publish';
        document.getElementById('jobTitle').value = job.title || '';
        document.getElementById('jobDescription').value = job.description || '';
        document.getElementById('jobBudget').value = job.budget || '';
        document.getElementById('jobDeadline').value = (job.deadline || '').split('/').reverse().join('-');
        if (window.setSelectCategory) {
            window.setSelectCategory('jobCategory', 'staticCustomCategoryWrapper', 'jobCustomCategory', job.category);
        } else {
            const categoryEl = document.getElementById('jobCategory');
            if (categoryEl) categoryEl.value = job.category || '';
        }
        document.getElementById('postJobModalTitle').textContent = job.status === 'Draft' ? 'Chỉnh sửa tin nháp' : 'Chỉnh sửa tin tuyển dụng';
        document.getElementById('btnSubmitJob').textContent = job.status === 'Draft' ? 'Đăng tin ngay' : 'Lưu thay đổi';
        document.getElementById('btnSaveDraftJob')?.classList.remove('d-none');
        document.getElementById('jobTemplateBar')?.classList.add('d-none');

        const modalEl = document.getElementById('postJobModal');
        if (modalEl) {
            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.show();
        }
    };

    // ============================================
    // JOB TEMPLATES (Mẫu tin tuyển dụng)
    // ============================================
    let cachedJobTemplates = [];

    async function loadJobTemplatesIntoSelect() {
        const select = document.getElementById('jobTemplateSelect');
        if (!select) return;
        select.innerHTML = '<option value="">Đang tải mẫu tin...</option>';
        try {
            const res = await fetch('/Home/GetJobTemplates');
            const data = await res.json();
            cachedJobTemplates = (data.success && data.templates) ? data.templates : [];
            select.innerHTML = '<option value="">Chọn mẫu tin có sẵn...</option>' +
                cachedJobTemplates.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');
        } catch (err) {
            console.error(err);
            select.innerHTML = '<option value="">Không thể tải mẫu tin</option>';
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const templateSelect = document.getElementById('jobTemplateSelect');
        const deleteTemplateBtn = document.getElementById('btnDeleteTemplate');

        templateSelect?.addEventListener('change', () => {
            const id = parseInt(templateSelect.value, 10);
            const deleteBtn = document.getElementById('btnDeleteTemplate');
            if (!id) {
                deleteBtn?.classList.add('d-none');
                return;
            }
            const tpl = cachedJobTemplates.find(t => t.id === id);
            if (!tpl) return;
            document.getElementById('jobTitle').value = tpl.title || '';
            document.getElementById('jobDescription').value = tpl.description || '';
            document.getElementById('jobBudget').value = tpl.budget || '';
            if (window.setSelectCategory) {
                window.setSelectCategory('jobCategory', 'staticCustomCategoryWrapper', 'jobCustomCategory', tpl.category);
            } else {
                const categoryEl = document.getElementById('jobCategory');
                if (categoryEl) categoryEl.value = tpl.category || '';
            }
            deleteBtn?.classList.remove('d-none');
        });

        deleteTemplateBtn?.addEventListener('click', async () => {
            const id = parseInt(templateSelect?.value, 10);
            if (!id) return;
            showConfirmModal('Xóa mẫu tin này?', async () => {
                try {
                    const res = await fetch('/Home/DeleteJobTemplate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]')?.value
                        },
                        body: `templateId=${id}`
                    });
                    const data = await res.json();
                    if (data.success) {
                        showToast('Đã xóa mẫu tin.', 'success');
                        await loadJobTemplatesIntoSelect();
                        deleteTemplateBtn.classList.add('d-none');
                    } else {
                        showToast(data.message || 'Không thể xóa mẫu tin.', 'error');
                    }
                } catch (err) {
                    console.error(err);
                    showToast('Lỗi kết nối máy chủ.', 'error');
                }
            }, 'Xác nhận xóa');
        });

        document.getElementById('btnSaveAsTemplate')?.addEventListener('click', async () => {
            const title = document.getElementById('jobTitle').value.trim();
            const description = document.getElementById('jobDescription').value.trim();
            const budget = parseFloat(document.getElementById('jobBudget').value || '0');
            const category = document.getElementById('jobCategory').value;

            if (!title || !description) {
                showToast('Vui lòng nhập tiêu đề và mô tả trước khi lưu thành mẫu.', 'warning');
                return;
            }

            showPromptModal('Đặt tên cho mẫu tin này (VD: Mẫu tuyển CTV thiết kế):', title, async (name) => {
                if (!name || name.trim() === '') return;

                try {
                    const res = await fetch('/Home/SaveJobTemplate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, title, description, category, budget })
                    });
                    const data = await res.json();
                    if (data.success) {
                        showToast('Đã lưu thành mẫu tin.', 'success');
                        await loadJobTemplatesIntoSelect();
                    } else {
                        showToast(data.message || 'Không thể lưu mẫu tin.', 'error');
                    }
                } catch (err) {
                    console.error(err);
                    showToast('Lỗi kết nối máy chủ.', 'error');
                }
            }, 'Lưu thành mẫu');
        });
    });

    window.performBusinessJobAction = async function (jobId, action) {
        const normalizedAction = (action || '').toLowerCase();
        let url = '';
        let confirmMessage = '';
        let body = new FormData();
        body.append('jobId', jobId);

        const executeAction = async () => {
            showConfirmModal(confirmMessage, async () => {
                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        body: body,
                        headers: {
                            'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]')?.value
                        }
                    });
                    const data = await response.json();
                    if (data.success) {
                        showToast(data.message || 'Đã cập nhật tin đăng.', 'success');
                        await renderBusinessJobsView();
                    } else {
                        showToast(data.message || 'Không thể cập nhật tin đăng.', 'error');
                    }
                } catch (err) {
                    console.error(err);
                    showToast('Lỗi kết nối máy chủ.', 'error');
                }
            }, 'Xác nhận hành động');
        };

        if (normalizedAction === 'extend') {
            showPromptModal('Nhập số ngày gia hạn', '30', (daysText) => {
                if (daysText === null || daysText.trim() === '') return;
                const extraDays = parseInt(daysText, 10);
                if (Number.isNaN(extraDays) || extraDays <= 0) {
                    showToast('Số ngày gia hạn không hợp lệ.', 'error');
                    return;
                }
                url = '/Home/ExtendJobPost';
                body.append('extraDays', extraDays);
                confirmMessage = `Bạn có chắc chắn muốn gia hạn tin thêm ${extraDays} ngày?`;
                executeAction();
            }, 'Gia hạn tin đăng');
            return;
        } else if (normalizedAction === 'close') {
            url = '/Home/CloseJobPost';
            confirmMessage = 'Bạn có chắc chắn muốn đóng tin tuyển dụng này?';
        } else if (normalizedAction === 'delete') {
            url = '/Home/DeleteBusinessJobPost';
            confirmMessage = 'Bạn có chắc chắn muốn xóa tin tuyển dụng này?';
        } else {
            showToast('Hành động không hợp lệ.', 'error');
            return;
        }

        executeAction();
    };

    async function renderBusinessApplicantsView(jobId = null, filters = {}, pageToRender = 1) {
        const currentFilters = {
            searchTerm: filters.searchTerm || '',
            status: filters.status || '',
            savedOnly: filters.savedOnly || false
        };

        const params = new URLSearchParams();
        if (jobId) params.set('jobId', jobId);
        if (currentFilters.searchTerm) params.set('searchTerm', currentFilters.searchTerm);
        if (currentFilters.status) params.set('status', currentFilters.status);
        if (currentFilters.savedOnly) params.set('savedOnly', 'true');
        const url = `/Home/GetBusinessApplicants${params.toString() ? '?' + params.toString() : ''}`;

        let currentPage = pageToRender;
        let pageSize = Number(localStorage.getItem('j4s_pagesize_businessApplicants')) || 10;
        let applicantsList = [];

        mainContent.innerHTML = `
            <div class="page-header">
                <h1 class="page-title"><i data-lucide="users" style="width:24px;height:24px;"></i> Ứng viên</h1>
                <p class="page-subtitle">Duyệt ứng viên đã ứng tuyển và bắt đầu trao đổi</p>
            </div>
            <div class="card border-0 shadow-sm p-3 mb-3" style="border-radius:12px; background:#fff; border:1px solid #e2e8f0;">
                <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                    <div style="flex:1; min-width:220px; position:relative;">
                        <i data-lucide="search" style="width:16px;height:16px; position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#94a3b8;"></i>
                        <input type="text" id="applicantSearchInput" class="form-control" style="padding-left:36px;" placeholder="Tìm theo tên, trường, ngành, kỹ năng..." value="${escapeHtml(currentFilters.searchTerm)}" />
                    </div>
                    <select id="applicantStatusFilter" class="form-select" style="width:auto;">
                        <option value="">Tất cả trạng thái</option>
                        <option value="Pending" ${currentFilters.status === 'Pending' ? 'selected' : ''}>Chờ duyệt</option>
                        <option value="Accepted" ${currentFilters.status === 'Accepted' ? 'selected' : ''}>Đã duyệt</option>
                        <option value="Hired" ${currentFilters.status === 'Hired' ? 'selected' : ''}>Đã tuyển</option>
                        <option value="Rejected" ${currentFilters.status === 'Rejected' ? 'selected' : ''}>Đã từ chối</option>
                    </select>
                    <div class="form-check" style="margin:0;">
                        <input class="form-check-input" type="checkbox" id="applicantSavedOnly" ${currentFilters.savedOnly ? 'checked' : ''} />
                        <label class="form-check-label" for="applicantSavedOnly" style="font-size:0.85rem; color:#475569;">Chỉ xem đã lưu</label>
                    </div>
                </div>
            </div>
            <div class="card border-0 shadow-sm p-4" style="border-radius:12px; background:#fff; border:1px solid #e2e8f0;">
                <div id="businessApplicantsList" style="display:flex; flex-direction:column; gap:12px;">
                    <div class="text-muted text-center py-4">Đang tải ứng viên...</div>
                </div>
                <div id="businessApplicantsPagination" style="display:flex;align-items:center;justify-content:space-between;margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;flex-wrap:wrap;gap:12px;"></div>
            </div>`;
        if (window.lucide) lucide.createIcons();

        const searchInputEl = document.getElementById('applicantSearchInput');
        const statusFilterEl = document.getElementById('applicantStatusFilter');
        const savedOnlyEl = document.getElementById('applicantSavedOnly');

        let searchDebounce;
        searchInputEl?.addEventListener('input', () => {
            clearTimeout(searchDebounce);
            searchDebounce = setTimeout(() => {
                renderBusinessApplicantsView(jobId, {
                    searchTerm: searchInputEl.value,
                    status: statusFilterEl.value,
                    savedOnly: savedOnlyEl.checked
                }, 1);
            }, 400);
        });
        statusFilterEl?.addEventListener('change', () => {
            renderBusinessApplicantsView(jobId, {
                searchTerm: searchInputEl.value,
                status: statusFilterEl.value,
                savedOnly: savedOnlyEl.checked
            }, 1);
        });
        savedOnlyEl?.addEventListener('change', () => {
            renderBusinessApplicantsView(jobId, {
                searchTerm: searchInputEl.value,
                status: statusFilterEl.value,
                savedOnly: savedOnlyEl.checked
            }, 1);
        });

        function renderPage() {
            const list = document.getElementById('businessApplicantsList');
            const paginationEl = document.getElementById('businessApplicantsPagination');
            if (!list) return;

            if (!applicantsList.length) {
                list.innerHTML = `<div class="empty-state"><div class="empty-icon">👥</div><h3>Chưa có ứng viên</h3><p>Khi sinh viên ứng tuyển, hồ sơ sẽ xuất hiện tại đây.</p></div>`;
                if (paginationEl) paginationEl.innerHTML = '';
                return;
            }

            const total = applicantsList.length;
            const totalPages = Math.ceil(total / pageSize);
            if (currentPage > totalPages) currentPage = Math.max(1, totalPages);

            const startIndex = (currentPage - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const pageApplicants = applicantsList.slice(startIndex, endIndex);

            const statusLabels = {
                Pending: 'Chờ duyệt',
                Accepted: 'Đã duyệt',
                Hired: 'Đã tuyển',
                Rejected: 'Đã từ chối'
            };
            const statusColors = {
                Pending: '#d97706',
                Accepted: '#2563eb',
                Hired: '#059669',
                Rejected: '#dc2626'
            };

            list.innerHTML = pageApplicants.map(app => {
                const initials = (app.fullName || 'UV').split(' ').filter(Boolean).slice(-2).map(x => x[0]).join('').toUpperCase() || 'UV';
                const statusText = statusLabels[app.status] || app.status;
                const statusColor = statusColors[app.status] || '#64748b';
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
                                    ${app.isSaved ? '<i data-lucide="bookmark" style="width:14px;height:14px; color:#4F46E5; fill:#4F46E5;"></i>' : ''}
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
                            ${app.status === 'Accepted' ? `
                                <button class="btn-indigo-solid btnHireBid" data-bid-id="${app.bidId}" style="padding:7px 12px; border-radius:8px; font-size:0.78rem; background:#059669; border-color:#059669;">Đánh dấu đã tuyển</button>
                                <button class="btn-indigo-outline btnRejectBid" data-bid-id="${app.bidId}" style="padding:7px 12px; border-radius:8px; font-size:0.78rem; color:#dc2626; border-color:#fecaca;">Từ chối</button>
                            ` : ''}
                            <button class="btn-indigo-outline btnSaveCandidate" data-student-id="${app.studentId}" data-saved="${app.isSaved ? '1' : '0'}" style="padding:7px 12px; border-radius:8px; font-size:0.78rem; ${app.isSaved ? 'color:#4F46E5; border-color:#4F46E5;' : ''}">
                                <i data-lucide="bookmark" style="width:14px;height:14px;"></i> ${app.isSaved ? 'Đã lưu' : 'Lưu'}
                            </button>
                            <button class="btn-indigo-outline btnViewProfile" data-student-id="${app.studentId}" style="padding:7px 12px; border-radius:8px; font-size:0.78rem;">
                                <i data-lucide="user" style="width:14px;height:14px;"></i> Xem hồ sơ
                            </button>
                            <button class="btn-indigo-outline btnChatApplicant" data-student-id="${app.studentId}" style="padding:7px 12px; border-radius:8px; font-size:0.78rem;">
                                <i data-lucide="message-circle" style="width:14px;height:14px;"></i> Trao đổi
                            </button>
                        </div>
                    </div>`;
            }).join('');
            if (window.lucide) lucide.createIcons();

            const currentFiltersForReload = () => ({
                searchTerm: searchInputEl?.value || '',
                status: statusFilterEl?.value || '',
                savedOnly: savedOnlyEl?.checked || false
            });

            document.querySelectorAll('.btnAcceptBid').forEach(btn => btn.addEventListener('click', () => updateBidStatus(btn.dataset.bidId, 'accept', jobId, currentFiltersForReload())));
            document.querySelectorAll('.btnHireBid').forEach(btn => btn.addEventListener('click', () => {
                showConfirmModal('Xác nhận đánh dấu ứng viên này là đã tuyển? Các ứng viên còn lại của tin này sẽ tự động bị từ chối.', () => {
                    updateBidStatus(btn.dataset.bidId, 'hire', jobId, currentFiltersForReload());
                }, 'Xác nhận tuyển dụng');
            }));
            document.querySelectorAll('.btnRejectBid').forEach(btn => btn.addEventListener('click', () => updateBidStatus(btn.dataset.bidId, 'reject', jobId, currentFiltersForReload())));
            document.querySelectorAll('.btnSaveCandidate').forEach(btn => btn.addEventListener('click', () => toggleSaveCandidate(btn.dataset.studentId, jobId, currentFiltersForReload())));
            document.querySelectorAll('.btnViewProfile').forEach(btn => btn.addEventListener('click', () => {
                window.location.href = `/StudentProfile/Details/${encodeURIComponent(btn.dataset.studentId)}`;
            }));
            document.querySelectorAll('.btnChatApplicant').forEach(btn => btn.addEventListener('click', () => {
                window.location.href = `/Message?userId=${encodeURIComponent(btn.dataset.studentId)}`;
            }));

            if (paginationEl) {
                renderGenericPaginationControls(paginationEl, total, totalPages, currentPage, pageSize, (newSize) => {
                    pageSize = newSize;
                    currentPage = 1;
                    renderPage();
                }, (newPage) => {
                    currentPage = newPage;
                    renderPage();
                    document.getElementById('mainContent')?.scrollIntoView({ behavior: 'smooth' });
                }, 'j4s_pagesize_businessApplicants');
            }
        }

        try {
            const res = await fetch(url);
            const data = await res.json();
            if (!data.success) {
                const list = document.getElementById('businessApplicantsList');
                if (list) list.innerHTML = `<div class="alert alert-danger m-0">${escapeHtml(data.message || 'Không thể tải ứng viên.')}</div>`;
                return;
            }
            applicantsList = data.applicants || [];
            renderPage();
        } catch (err) {
            console.error(err);
            const list = document.getElementById('businessApplicantsList');
            if (list) list.innerHTML = `<div class="alert alert-danger m-0">Không thể kết nối máy chủ.</div>`;
        }
    }

    async function updateBidStatus(bidId, action, jobId = null, filters = {}) {
        try {
            const res = await fetch('/Home/UpdateBidStatus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bidId: parseInt(bidId, 10), action })
            });
            const data = await res.json();
            if (data.success) {
                const messages = { accept: 'Đã duyệt ứng viên.', reject: 'Đã từ chối ứng viên.', hire: 'Đã đánh dấu ứng viên là đã tuyển.' };
                showToast(messages[action] || 'Đã cập nhật.', 'success');
                await renderBusinessApplicantsView(jobId, filters);
            } else {
                showToast(data.message || 'Không thể cập nhật ứng viên.', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Lỗi kết nối máy chủ.', 'error');
        }
    }

    async function toggleSaveCandidate(studentId, jobId = null, filters = {}) {
        try {
            const res = await fetch('/Home/ToggleSaveCandidate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId: parseInt(studentId, 10) })
            });
            const data = await res.json();
            if (data.success) {
                showToast(data.isSaved ? 'Đã lưu ứng viên.' : 'Đã bỏ lưu ứng viên.', 'success');
                await renderBusinessApplicantsView(jobId, filters);
            } else {
                showToast(data.message || 'Không thể lưu ứng viên.', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Lỗi kết nối máy chủ.', 'error');
        }
    }

    function renderHelpView() {
        mainContent.innerHTML = `
            <div class="page-header">
                <h1 class="page-title"><i data-lucide="help-circle" style="width:24px;height:24px;"></i> Trung tâm hỗ trợ</h1>
                <p class="page-subtitle">Tra cứu FAQ, xem hướng dẫn và gửi yêu cầu hỗ trợ</p>
            </div>
            <div class="row g-4">
                <div class="col-lg-7">
                    <div class="card border-0 shadow-sm p-4 mb-4" style="border-radius:16px;">
                        <h3 class="fw-bold mb-3">FAQ - Câu hỏi thường gặp</h3>
                        <div class="accordion" id="helpFaqAccordion">
                            <div class="accordion-item">
                                <h2 class="accordion-header"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#faq1">Làm sao để đăng tin tuyển dụng?</button></h2>
                                <div id="faq1" class="accordion-collapse collapse show" data-bs-parent="#helpFaqAccordion"><div class="accordion-body">Chọn nút <strong>Đăng tin tuyển dụng</strong>, nhập tiêu đề, mô tả, ngân sách và hạn chót, sau đó gửi duyệt.</div></div>
                            </div>
                            <div class="accordion-item">
                                <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq2">Vì sao cần nạp tiền bội số 50k?</button></h2>
                                <div id="faq2" class="accordion-collapse collapse" data-bs-parent="#helpFaqAccordion"><div class="accordion-body">Hệ thống đối soát QR tự động theo từng mệnh giá chuẩn để đảm bảo giao dịch được xác nhận nhanh và chính xác.</div></div>
                            </div>
                            <div class="accordion-item">
                                <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq3">Làm thế nào để xem hồ sơ ứng viên?</button></h2>
                                <div id="faq3" class="accordion-collapse collapse" data-bs-parent="#helpFaqAccordion"><div class="accordion-body">Mở mục <strong>Ứng viên</strong> hoặc bấm <strong>Xem hồ sơ</strong> ở thẻ ứng viên mới nhất để vào trang hồ sơ chi tiết.</div></div>
                            </div>
                        </div>
                    </div>
                    <div class="card border-0 shadow-sm p-4" style="border-radius:16px;">
                        <h3 class="fw-bold mb-3">Hướng dẫn sử dụng nhanh</h3>
                        <ol class="mb-0 text-slate-700" style="line-height:1.9;">
                            <li>Đăng nhập tài khoản doanh nghiệp và hoàn thiện hồ sơ công ty.</li>
                            <li>Nạp tiền vào ví bằng QR VietQR nếu cần mua gói hoặc thanh toán dịch vụ.</li>
                            <li>Đăng tin tuyển dụng, theo dõi ứng viên và nhắn tin trực tiếp.</li>
                            <li>Gia hạn, đóng hoặc xóa tin đăng khi nhu cầu thay đổi.</li>
                        </ol>
                    </div>
                </div>
                <div class="col-lg-5">
                    <div class="card border-0 shadow-sm p-4 mb-4" style="border-radius:16px;">
                        <h3 class="fw-bold mb-3">Gửi yêu cầu hỗ trợ</h3>
                        <form id="supportRequestForm" class="d-grid gap-3">
                            <input class="form-control" name="subject" placeholder="Tiêu đề hỗ trợ" required />
                            <select class="form-select" name="category" required>
                                <option value="">Chọn loại hỗ trợ</option>
                                <option value="Đăng tin tuyển dụng">Đăng tin tuyển dụng</option>
                                <option value="Thanh toán & ví">Thanh toán & ví</option>
                                <option value="Tài khoản">Tài khoản</option>
                                <option value="Khác">Khác</option>
                            </select>
                            <textarea class="form-control" name="message" rows="5" placeholder="Mô tả chi tiết vấn đề..." required></textarea>
                            <button class="btn btn-indigo w-100" type="submit">Gửi yêu cầu hỗ trợ</button>
                        </form>
                    </div>
                    <div class="card border-0 shadow-sm p-4" style="border-radius:16px;">
                        <h3 class="fw-bold mb-3">Liên hệ CSKH</h3>
                        <div class="d-grid gap-2 text-slate-700">
                            <div class="d-flex align-items-center gap-2 mb-1">
                                <i data-lucide="mail" style="width:18px;height:18px;color:var(--primary);flex-shrink:0;"></i>
                                <div><strong>Email:</strong> <a href="https://mail.google.com/mail/?view=cm&fs=1&to=j4s.job4stu@gmail.com" target="_blank" style="color:inherit;text-decoration:none;">j4s.job4stu@gmail.com</a></div>
                            </div>
                            <div class="d-flex align-items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                                <div><strong>Fanpage:</strong> <a href="https://www.facebook.com/job4stu" target="_blank" style="color:var(--primary);text-decoration:none;font-weight:600;">www.facebook.com/job4stu</a></div>
                            </div>
                        </div>
                    </div>
                    <div class="card border-0 shadow-sm p-4 mt-4" style="border-radius:16px;">
                        <h3 class="fw-bold mb-3">Yêu cầu gần đây</h3>
                        <div id="supportRequestList" class="d-grid gap-2 text-slate-700 small"></div>
                    </div>
                </div>
            </div>`;
        if (window.lucide) lucide.createIcons();

        const form = document.getElementById('supportRequestForm');
        const list = document.getElementById('supportRequestList');

        function renderRequestList(requests) {
            if (!list) return;
            list.innerHTML = (requests && requests.length)
                ? requests.map(r => `<div class="border rounded-3 p-3"><div class="fw-semibold">${escapeHtml(r.subject)}</div><div class="text-muted">${escapeHtml(r.category)} · ${escapeHtml(r.status || 'Đã tiếp nhận')}</div></div>`).join('')
                : '<div class="text-muted">Chưa có yêu cầu nào.</div>';
        }

        fetch('/Support/GetMyRequests')
            .then(res => res.json())
            .then(resData => {
                if (resData.success) renderRequestList(resData.requests);
            })
            .catch(err => console.error(err));

        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            const payload = {
                subject: form.subject.value.trim(),
                category: form.category.value,
                message: form.message.value.trim()
            };

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnHTML = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" style="margin-right: 8px;"></span> Đang gửi...`;

            fetch('/Support/SubmitRequest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
                .then(res => res.json())
                .then(resData => {
                    if (resData.success) {
                        showToast(resData.message || 'Đã gửi yêu cầu hỗ trợ.', 'success');
                        form.reset();
                        fetch('/Support/GetMyRequests')
                            .then(res => res.json())
                            .then(d => { if (d.success) renderRequestList(d.requests); })
                            .catch(err => console.error(err));
                    } else {
                        showToast(resData.message || 'Không thể gửi yêu cầu hỗ trợ.', 'error');
                    }
                })
                .catch(err => {
                    console.error(err);
                    showToast('Lỗi kết nối máy chủ.', 'error');
                })
                .finally(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnHTML;
                });
        });
    }

    function renderFeedbackView() {
        mainContent.innerHTML = `
            <div class="page-header">
                <h1 class="page-title"><i data-lucide="message-square" style="width:24px;height:24px;"></i> Phản hồi & Báo lỗi</h1>
                <p class="page-subtitle">Gửi góp ý và theo dõi trạng thái xử lý phản hồi</p>
            </div>
            <div class="row g-4">
                <div class="col-lg-6">
                    <div class="card border-0 shadow-sm p-4" style="border-radius:16px;">
                        <h3 class="fw-bold mb-3">Gửi góp ý / Báo lỗi hệ thống</h3>
                        <form id="feedbackForm" class="d-grid gap-3">
                            <select class="form-select" name="type" required>
                                <option value="">Chọn loại phản hồi</option>
                                <option value="Góp ý">Góp ý</option>
                                <option value="Báo lỗi hệ thống">Báo lỗi hệ thống</option>
                            </select>
                            <input class="form-control" name="title" placeholder="Tiêu đề" required />
                            <textarea class="form-control" name="details" rows="6" placeholder="Mô tả chi tiết, kèm các bước tái hiện nếu có..." required></textarea>
                            <button class="btn btn-indigo w-100" type="submit">Gửi phản hồi</button>
                        </form>
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="card border-0 shadow-sm p-4 mb-4" style="border-radius:16px;">
                        <h3 class="fw-bold mb-3">Trạng thái xử lý</h3>
                        <div id="feedbackList" class="d-grid gap-2 text-slate-700 small"></div>
                    </div>
                    <div class="card border-0 shadow-sm p-4" style="border-radius:16px;">
                        <h3 class="fw-bold mb-3">Cam kết xử lý</h3>
                        <ul class="mb-0 text-slate-700" style="line-height:1.9;">
                            <li>Phản hồi mới được ghi nhận ngay sau khi gửi.</li>
                            <li>Báo lỗi hệ thống sẽ được ưu tiên kiểm tra theo mức độ ảnh hưởng.</li>
                            <li>Bạn có thể xem lại danh sách phản hồi đã gửi tại đây.</li>
                        </ul>
                    </div>
                </div>
            </div>`;
        if (window.lucide) lucide.createIcons();

        const form = document.getElementById('feedbackForm');
        const list = document.getElementById('feedbackList');

        function renderFeedbackList(items) {
            if (!list) return;
            list.innerHTML = (items && items.length)
                ? items.map(f => `<div class="border rounded-3 p-3"><div class="fw-semibold">${escapeHtml(f.title)}</div><div class="text-muted">${escapeHtml(f.type)} · ${escapeHtml(f.status || 'Đã ghi nhận')}</div></div>`).join('')
                : '<div class="text-muted">Chưa có phản hồi nào.</div>';
        }

        fetch('/Feedback/GetMyFeedback')
            .then(res => res.json())
            .then(resData => {
                if (resData.success) renderFeedbackList(resData.items);
            })
            .catch(err => console.error(err));

        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            const payload = {
                type: form.type.value,
                title: form.title.value.trim(),
                details: form.details.value.trim()
            };

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnHTML = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" style="margin-right: 8px;"></span> Đang gửi...`;

            fetch('/Feedback/SubmitFeedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
                .then(res => res.json())
                .then(resData => {
                    if (resData.success) {
                        showToast(resData.message || 'Đã gửi phản hồi.', 'success');
                        form.reset();
                        fetch('/Feedback/GetMyFeedback')
                            .then(res => res.json())
                            .then(d => { if (d.success) renderFeedbackList(d.items); })
                            .catch(err => console.error(err));
                    } else {
                        showToast(resData.message || 'Không thể gửi phản hồi.', 'error');
                    }
                })
                .catch(err => {
                    console.error(err);
                    showToast('Lỗi kết nối máy chủ.', 'error');
                })
                .finally(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnHTML;
                });
        });
    }

    // ============================================
    // RENDER: Tin nhắn
    // ============================================
    function isBusinessAccount() {
        return document.getElementById('userProfile')?.dataset.userRole === 'Business';
    }

    function renderBusinessMessagesView() {
        const subtitle = isBusinessAccount() ? "Trao đổi với ứng viên và đối tác" : "Trao đổi với khách hàng và đối tác";
        mainContent.innerHTML = `
            <div class="page-header">
                <h1 class="page-title"><i data-lucide="message-circle" style="width:24px;height:24px;"></i> Tin nhắn</h1>
                <p class="page-subtitle">${subtitle}</p>
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

        const chatPanel = document.getElementById('chatPanel');
        if (chatPanel && chatPanel.dataset.activeUserId) {
            activeChatUserId = Number(chatPanel.dataset.activeUserId);
        }

        if (!conversations.length) {
            list.innerHTML = '<div style="padding:18px;color:var(--text-muted);font-weight:700;">Chưa có hội thoại nào.</div>';
            return;
        }

        list.innerHTML = conversations.map(conv => `
            <div class="message-item ${conv.unread > 0 ? 'unread' : ''} ${Number(conv.userId) === Number(activeChatUserId) ? 'selected' : ''}" data-user-id="${conv.userId}">
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
        activeChatUserId = userId;
        document.querySelectorAll('.message-item').forEach(i => i.classList.toggle('selected', Number(i.dataset.userId) === userId));

        fetch(`/Home/GetConversationMessages?userId=${userId}`)
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    showToast(data.message || 'Không thể tải tin nhắn.', 'error');
                    return;
                }
                if (!window.activeChatMsgCounts) window.activeChatMsgCounts = {};
                window.activeChatMsgCounts[userId] = (data.messages || []).length;

                renderBusinessChat(data.user, data.messages || []);
                updateUnreadMessagesBadge();
                loadBusinessConversations();
            })
            .catch(err => {
                console.error(err);
                showToast('Không thể kết nối đến máy chủ.', 'error');
            });
    }

    function renderBusinessChat(user, messages) {
        const chatPanel = document.getElementById('chatPanel');
        if (!chatPanel) return;

        chatPanel.dataset.activeUserId = user.id;

        // Preserve current typed text and focus state
        const chatInputOld = document.getElementById('chatInput');
        const typedText = chatInputOld ? chatInputOld.value : '';
        const wasFocused = chatInputOld && document.activeElement === chatInputOld;

        chatPanel.innerHTML = `
            <div class="chat-header">
                <div class="chat-user-info">
                    <div class="msg-avatar small" style="background:${user.avatarUrl ? 'none' : '#0ea5e9'}">
                        ${user.avatarUrl ? `<img src="${escapeHtml(user.avatarUrl)}" alt="${escapeHtml(user.name)}" />` : getInitials(user.name)}
                    </div>
                    <div>
                        <div class="chat-user-name">${escapeHtml(user.name)}</div>
                        <div class="chat-status">Trò chuyện</div>
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

        // Restore typed text and focus
        const chatInputNew = document.getElementById('chatInput');
        if (chatInputNew) {
            chatInputNew.value = typedText;
            if (wasFocused) {
                chatInputNew.focus();
            }
        }

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
                    if (typeof window.loadBubbleChatMessages === 'function') {
                        window.loadBubbleChatMessages();
                    }
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
        if (activeChatUserId) {
            pendingChatUserId = activeChatUserId;
        }
        renderBusinessMessagesView();
    }

    function loadMainChatMessages() {
        const chatPanel = document.getElementById('chatPanel');
        const currentActiveId = (chatPanel && chatPanel.dataset.activeUserId) ? Number(chatPanel.dataset.activeUserId) : activeChatUserId;
        if (currentActiveId) {
            openBusinessChat(currentActiveId);
        } else {
            loadBusinessConversations();
        }
    }

    // ============================================
    // RENDER: Đánh giá
    // ============================================
    function renderReviewsView() {
        renderGenericReviewsShell('Student');
    }

    function renderReviewsViewObsolete() {
        mainContent.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 250px; flex-direction: column; gap: 16px;">
                <div class="spinner-border text-info" role="status" style="width: 2rem; height: 2rem;"></div>
                <span style="color: var(--text-secondary); font-weight: 500; font-family: 'Inter', sans-serif;">Đang tải danh sách đánh giá...</span>
            </div>
        `;

        fetch('/Review/GetMyReviews')
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    showToast(data.message || 'Lỗi khi tải đánh giá.', 'error');
                    mainContent.innerHTML = `<div class="alert alert-danger m-4">${escapeHtml(data.message)}</div>`;
                    return;
                }

                const dbReviews = data.reviews || [];
                const totalReviews = dbReviews.length;
                const avgRating = totalReviews > 0
                    ? (dbReviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1)
                    : "0.0";
                const roundedAvg = Math.round(Number(avgRating));

                // Filter reviews
                let filteredReviews = dbReviews;
                if (reviewsFilter === '5') {
                    filteredReviews = dbReviews.filter(r => r.rating === 5);
                } else if (reviewsFilter === '4') {
                    filteredReviews = dbReviews.filter(r => r.rating === 4);
                } else if (reviewsFilter === 'low') {
                    filteredReviews = dbReviews.filter(r => r.rating <= 3);
                }

                const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

                mainContent.innerHTML = `
                    <div class="page-header animate-in">
                        <h1 class="page-title"><i data-lucide="star" style="width:24px;height:24px;color:#F59E0B;"></i> Đánh giá của tôi</h1>
                        <p class="page-subtitle">Quản lý các nhận xét từ khách hàng và phản hồi của bạn</p>
                    </div>
                    
                    <div class="reviews-summary animate-in">
                        <div class="review-score-big">
                            <div class="score-number">${avgRating}</div>
                            <div class="score-stars">
                                ${'★'.repeat(roundedAvg)}${'☆'.repeat(5 - roundedAvg)}
                            </div>
                            <div class="score-count">${totalReviews} đánh giá từ khách hàng</div>
                        </div>
                        <div class="rating-bars">
                            ${[5, 4, 3, 2, 1].map(star => {
                    const count = dbReviews.filter(r => r.rating === star).length;
                    const pct = totalReviews > 0 ? (count / totalReviews * 100) : 0;
                    return `
                                    <div class="rating-bar-row">
                                        <span class="bar-label">${star} ★</span>
                                        <div class="bar-track"><div class="bar-fill" style="width:${pct}%;"></div></div>
                                        <span class="bar-count">${count}</span>
                                    </div>
                                `;
                }).join('')}
                        </div>
                    </div>

                    <!-- Filter Tabs -->
                    <div class="reviews-filter-tabs animate-in">
                        <button class="review-tab-btn ${reviewsFilter === 'all' ? 'active' : ''}" data-filter="all">Tất cả (${dbReviews.length})</button>
                        <button class="review-tab-btn ${reviewsFilter === '5' ? 'active' : ''}" data-filter="5">5 ★ (${dbReviews.filter(r => r.rating === 5).length})</button>
                        <button class="review-tab-btn ${reviewsFilter === '4' ? 'active' : ''}" data-filter="4">4 ★ (${dbReviews.filter(r => r.rating === 4).length})</button>
                        <button class="review-tab-btn ${reviewsFilter === 'low' ? 'active' : ''}" data-filter="low">Dưới 4 ★ (${dbReviews.filter(r => r.rating <= 3).length})</button>
                    </div>

                    <div class="reviews-list animate-in" id="reviewsCardList"></div>
                    <div id="reviewsPagination" style="display:flex;align-items:center;justify-content:space-between;margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;flex-wrap:wrap;gap:12px;"></div>`;

                if (window.lucide) lucide.createIcons();

                // Attach event listeners for tabs
                document.querySelectorAll('.review-tab-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        reviewsFilter = btn.getAttribute('data-filter');
                        renderReviewsView();
                    });
                });

                let currentPage = 1;
                let pageSize = Number(localStorage.getItem('j4s_pagesize_studentReviews')) || 10;

                function renderPage() {
                    const listContainer = document.getElementById('reviewsCardList');
                    const paginationEl = document.getElementById('reviewsPagination');
                    if (!listContainer) return;

                    if (filteredReviews.length === 0) {
                        listContainer.innerHTML = `
                            <div class="empty-state">
                                <div class="empty-icon">⭐</div>
                                <h3>Không tìm thấy đánh giá nào</h3>
                                <p>Không có đánh giá nào phù hợp với bộ lọc đã chọn.</p>
                            </div>`;
                        if (paginationEl) paginationEl.innerHTML = '';
                        return;
                    }

                    const total = filteredReviews.length;
                    const totalPages = Math.ceil(total / pageSize);
                    if (currentPage > totalPages) currentPage = Math.max(1, totalPages);

                    const startIndex = (currentPage - 1) * pageSize;
                    const endIndex = startIndex + pageSize;
                    const pageReviews = filteredReviews.slice(startIndex, endIndex);

                    listContainer.innerHTML = pageReviews.map((r, i) => {
                        const avatarColor = colors[(startIndex + i) % colors.length];
                        const initials = (r.reviewer || "KH").split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
                        return `
                            <div class="review-card ${r.isReported ? 'reported-dimmed' : ''}" data-id="${r.id}" style="margin-bottom: 16px;">
                                <div class="review-header">
                                    <div class="reviewer-info">
                                        <div class="reviewer-avatar" style="background: linear-gradient(135deg, ${avatarColor}, ${avatarColor}aa)">${initials}</div>
                                        <div>
                                            <div class="reviewer-name">${escapeHtml(r.reviewer)}</div>
                                            <div class="review-project"><i data-lucide="briefcase" style="width:12px;height:12px;display:inline-align:middle;margin-right:4px;"></i> ${escapeHtml(r.project)}</div>
                                        </div>
                                    </div>
                                    <div class="review-meta">
                                        <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
                                        <div class="review-date">${r.date}</div>
                                    </div>
                                </div>
                                <p class="review-comment">"${escapeHtml(r.comment)}"</p>
                                
                                ${r.reply ? `
                                    <div class="review-reply-box">
                                        <div class="reply-header">
                                            <div style="display:flex; align-items:center; gap:6px;">
                                                <div class="reply-avatar">SV</div>
                                                <strong>Phản hồi của bạn (Freelancer)</strong>
                                            </div>
                                        </div>
                                        <p class="reply-content">${escapeHtml(r.reply)}</p>
                                    </div>
                                ` : `
                                    <div class="review-actions" id="actions-${r.id}">
                                        ${r.isReported ? `
                                            <span class="report-badge pending"><i data-lucide="alert-triangle" style="width:14px;height:14px;"></i> Đang xem xét báo cáo không phù hợp</span>
                                        ` : `
                                            <button class="btn-review-reply" data-id="${r.id}"><i data-lucide="message-square" style="width:14px;height:14px;"></i> Phản hồi</button>
                                            <button class="btn-review-report" data-id="${r.id}"><i data-lucide="flag" style="width:14px;height:14px;"></i> Báo cáo không phù hợp</button>
                                        `}
                                    </div>
                                    
                                    <!-- Reply Form Container -->
                                    <div class="reply-form-wrapper" id="replyForm-${r.id}" style="display:none; margin-top:12px;">
                                        <textarea placeholder="Nhập nội dung phản hồi của bạn tới khách hàng..." class="form-control reply-textarea" id="replyText-${r.id}"></textarea>
                                        <div style="display:flex; gap:8px; margin-top:8px; justify-content:flex-end;">
                                            <button class="btn-reply-cancel" data-id="${r.id}">Hủy</button>
                                            <button class="btn-reply-submit" data-id="${r.id}">Gửi phản hồi</button>
                                        </div>
                                    </div>
                                    
                                    <!-- Report Form Container -->
                                    <div class="report-form-wrapper" id="reportForm-${r.id}" style="display:none; margin-top:12px;">
                                        <div style="background:#FFFBEB; border:1px solid #FDE68A; padding:12px; border-radius:8px;">
                                            <div style="font-weight:700; color:#92400E; margin-bottom:8px; font-size:13px;">Chọn lý do báo cáo đánh giá này không phù hợp:</div>
                                            <div style="display:flex; flex-direction:column; gap:6px; font-size:13px; color:#4B5563;">
                                                <label style="display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="radio" name="reportReason-${r.id}" value="Thông tin sai sự thật" checked> Đánh giá không đúng sự thật, bôi nhọ danh dự</label>
                                                <label style="display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="radio" name="reportReason-${r.id}" value="Ngôn từ thô tục"> Có chứa từ ngữ thiếu văn hóa, kích động</label>
                                                <label style="display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="radio" name="reportReason-${r.id}" value="Spam/Quảng cáo"> Spam quảng cáo hoặc không liên quan đến công việc</label>
                                            </div>
                                            <div style="display:flex; gap:8px; margin-top:12px; justify-content:flex-end;">
                                                <button class="btn-report-cancel" data-id="${r.id}">Hủy</button>
                                                <button class="btn-report-submit" data-id="${r.id}">Báo cáo vi phạm</button>
                                            </div>
                                        </div>
                                    </div>
                                `}
                            </div>
                        `;
                    }).join('');

                    if (window.lucide) lucide.createIcons();
                    bindReviewActions();

                    if (paginationEl) {
                        renderGenericPaginationControls(paginationEl, total, totalPages, currentPage, pageSize, (newSize) => {
                            pageSize = newSize;
                            currentPage = 1;
                            renderPage();
                        }, (newPage) => {
                            currentPage = newPage;
                            renderPage();
                            document.getElementById('mainContent')?.scrollIntoView({ behavior: 'smooth' });
                        }, 'j4s_pagesize_studentReviews');
                    }
                }

                function bindReviewActions() {
                    // Attach reply click handler
                    document.querySelectorAll('.btn-review-reply').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const id = btn.getAttribute('data-id');
                            document.getElementById(`replyForm-${id}`).style.display = 'block';
                            document.getElementById(`actions-${id}`).style.display = 'none';
                        });
                    });

                    // Attach cancel reply handler
                    document.querySelectorAll('.btn-reply-cancel').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const id = btn.getAttribute('data-id');
                            document.getElementById(`replyForm-${id}`).style.display = 'none';
                            document.getElementById(`actions-${id}`).style.display = 'flex';
                        });
                    });

                    // Attach submit reply handler
                    document.querySelectorAll('.btn-reply-submit').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const id = Number(btn.getAttribute('data-id'));
                            const text = document.getElementById(`replyText-${id}`).value.trim();
                            if (!text) {
                                showToast('Vui lòng nhập nội dung phản hồi!', 'warning');
                                return;
                            }

                            const formData = new FormData();
                            formData.append('parentReviewId', id);
                            formData.append('comment', text);

                            fetch('/Review/Reply', {
                                method: 'POST',
                                body: formData
                            })
                                .then(res => res.json())
                                .then(resData => {
                                    if (resData.success) {
                                        showToast('✅ Gửi phản hồi thành công!', 'success');
                                        renderReviewsView();
                                    } else {
                                        showToast(resData.message || 'Lỗi khi gửi phản hồi.', 'error');
                                    }
                                })
                                .catch(err => {
                                    console.error(err);
                                    showToast('Không thể kết nối đến máy chủ.', 'error');
                                });
                        });
                    });

                    // Attach report click handler
                    document.querySelectorAll('.btn-review-report').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const id = btn.getAttribute('data-id');
                            document.getElementById(`reportForm-${id}`).style.display = 'block';
                            document.getElementById(`actions-${id}`).style.display = 'none';
                        });
                    });

                    // Attach cancel report handler
                    document.querySelectorAll('.btn-report-cancel').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const id = btn.getAttribute('data-id');
                            document.getElementById(`reportForm-${id}`).style.display = 'none';
                            document.getElementById(`actions-${id}`).style.display = 'flex';
                        });
                    });

                    // Attach submit report handler
                    document.querySelectorAll('.btn-report-submit').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const id = Number(btn.getAttribute('data-id'));
                            const selectedReason = document.querySelector(`input[name="reportReason-${id}"]:checked`)?.value || "Lý do khác";

                            const formData = new FormData();
                            formData.append('id', id);
                            formData.append('reason', selectedReason);

                            fetch('/Review/Report', {
                                method: 'POST',
                                body: formData
                            })
                                .then(res => res.json())
                                .then(resData => {
                                    if (resData.success) {
                                        showToast('🚩 Đã gửi báo cáo đánh giá! Ban quản trị sẽ xem xét trong 24h.', 'success');
                                        renderReviewsView();
                                    } else {
                                        showToast(resData.message || 'Lỗi khi gửi báo cáo.', 'error');
                                    }
                                })
                                .catch(err => {
                                    console.error(err);
                                    showToast('Không thể kết nối đến máy chủ.', 'error');
                                });
                        });
                    });
                }

                renderPage();
            })
            .catch(err => {
                console.error(err);
                showToast('Lỗi khi tải thông tin đánh giá.', 'error');
            });
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
            <div class="job-card animate-in ${job.isVip ? 'job-card-vip' : ''}" data-job-id="${job.id}" style="animation-delay: ${idx * 0.05}s">
                <div class="job-icon ${iconInfo.cls}">
                    <i data-lucide="${iconInfo.icon}" style="width:22px;height:22px;"></i>
                </div>
                <div class="job-info">
                    <h3 class="job-title" data-job-id="${job.id}">
                        ${escapeHtml(job.title)}
                        ${job.isVip ? `<span style="background:#f59e0b; color:#fff; font-size:0.65rem; font-weight:700; padding:2px 8px; border-radius:4px; margin-left:8px; vertical-align:middle; display:inline-block;">VIP</span>` : ''}
                    </h3>
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
                        btnEl.innerHTML = '<i data-lucide="bookmark" style="width:18px;height:18px;"></i>';
                        showToast('🔖 Đã lưu việc làm!', 'success');
                    } else {
                        btnEl.classList.remove('saved');
                        btnEl.innerHTML = '<i data-lucide="bookmark" style="width:18px;height:18px;"></i>';
                        showToast('Đã bỏ lưu việc làm.', 'info');
                    }
                    if (window.lucide) lucide.createIcons();

                    if (currentSidebarMode === 'saved') {
                        const card = btnEl.closest('.job-card[data-job-id]');
                        if (card) {
                            card.style.opacity = '0';
                            card.style.transform = 'scale(0.9)';
                            card.style.transition = 'all 0.3s ease';
                            setTimeout(() => {
                                card.remove();
                                const results = document.getElementById('savedJobResults');
                                if (results && !results.querySelector('.job-card')) {
                                    results.innerHTML = `<div style="text-align:center;padding:60px;">
                                        <div style="font-size:3rem;margin-bottom:12px;">🔖</div>
                                        <h3 style="color:#1e293b;font-weight:700;margin-bottom:8px;">Chưa có việc làm nào được lưu</h3>
                                        <p style="color:#64748b;">Bấm vào icon bookmark trên các tin để lưu lại.</p>
                                    </div>`;
                                }
                            }, 300);
                        }
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
                    <div class="modal-details" style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:20px;">
                        <div class="detail-item" style="flex:1; min-width:140px; margin:0;">
                            <div class="detail-icon"><i data-lucide="banknote" style="width:18px;height:18px;"></i></div>
                            <div><div class="detail-label">Ngân sách</div><div class="detail-value">${budgetFormatted}</div></div>
                        </div>
                        <div class="detail-item" style="flex:1; min-width:140px; margin:0;">
                            <div class="detail-icon"><i data-lucide="clock" style="width:18px;height:18px;"></i></div>
                            <div><div class="detail-label">Thời hạn</div><div class="detail-value">${escapeHtml(job.deadline)}</div></div>
                        </div>
                        <div class="detail-item" style="flex:1; min-width:140px; margin:0;">
                            <div class="detail-icon"><i data-lucide="award" style="width:18px;height:18px;"></i></div>
                            <div><div class="detail-label">Kinh nghiệm</div><div class="detail-value">${escapeHtml(job.experienceLevel === 'No_Experience' ? 'Không yêu cầu' : job.experienceLevel === 'Expert' ? 'Chuyên gia' : job.experienceLevel === 'Mid_Level' ? 'Có kinh nghiệm' : job.experienceLevel || 'Không yêu cầu')}</div></div>
                        </div>
                        <div class="detail-item" style="flex:1; min-width:140px; margin:0;">
                            <div class="detail-icon"><i data-lucide="users" style="width:18px;height:18px;"></i></div>
                            <div><div class="detail-label">Tuyển dụng</div><div class="detail-value" id="modalApplicants">Đã nhận: ${job.hiredCount || 0}/${job.quantity || 1} (Có ${job.applicantsCount || 0} đề xuất)</div></div>
                        </div>
                    </div>
                    ${job.requirements ? `<h3 style="font-size:1rem;font-weight:700;color:#1e293b;margin-bottom:8px;margin-top:20px;">Yêu cầu ứng viên</h3>
                    <p class="modal-description">${escapeHtml(job.requirements)}</p>` : ''}
                </div>
                <div class="modal-footer">
                    ${job.isApplied
                ? '<button class="btn-applied" disabled><i data-lucide="check-circle" style="width:16px;height:16px;"></i> Đã ứng tuyển</button>'
                : `<button class="btn-apply-job" id="btnApplyJob" data-job-id="${job.id}"><i data-lucide="send" style="width:16px;height:16px;"></i> Ứng tuyển ngay</button>`}
                </div>
            </div>`;

        document.body.appendChild(modal);
        if (window.lucide) lucide.createIcons();
        requestAnimationFrame(() => modal.classList.add('active'));

        modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
        modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal); });

        const applyBtn = modal.querySelector('#btnApplyJob');
        if (applyBtn) {
            applyBtn.addEventListener('click', function () { applyJob(job.id, this, modal); });
        }
    }

    const tipData = {
        'tip-proposal': {
            title: 'Viết Proposal chinh phục khách hàng',
            category: 'Kỹ năng',
            categoryColor: '#2563eb',
            icon: '✍️',
            content: `
                <p style="margin-bottom:14px; color:#475569; line-height:1.7;">Một bản Proposal (Đề xuất công việc) ấn tượng là chìa khóa mở ra cơ hội làm việc với các nhà tuyển dụng chất lượng. Đối với sinh viên, khi kinh nghiệm chưa nhiều, Proposal chính là nơi tốt nhất để bạn thể hiện sự nhiệt huyết và năng lực giải quyết vấn đề.</p>
                <div style="background:#eff6ff; border-left:4px solid #2563eb; border-radius:8px; padding:14px 16px; margin-bottom:16px;">
                    <p style="font-weight:700; color:#1e40af; margin:0 0 6px 0;">📌 1. Đi thẳng vào vấn đề của khách hàng</p>
                    <p style="color:#475569; margin:0; line-height:1.6;">Thay vì giới thiệu bản thân dài dòng, hãy tóm tắt yêu cầu của khách hàng và chỉ ra bạn đang hiểu họ cần gì. Ví dụ: <em>"Tôi thấy bạn đang cần thiết kế bộ slide với phong cách tối giản và hiện đại..."</em></p>
                </div>
                <div style="background:#f0fdf4; border-left:4px solid #16a34a; border-radius:8px; padding:14px 16px; margin-bottom:16px;">
                    <p style="font-weight:700; color:#15803d; margin:0 0 6px 0;">🎯 2. Đưa ra giải pháp cụ thể</p>
                    <p style="color:#475569; margin:0; line-height:1.6;">Hãy nêu rõ bạn sẽ giải quyết công việc đó như thế nào, dùng công cụ gì và quy trình làm việc ra sao. Điều này chứng minh bạn là người làm việc có kế hoạch.</p>
                </div>
                <div style="background:#fdf4ff; border-left:4px solid #9333ea; border-radius:8px; padding:14px 16px; margin-bottom:16px;">
                    <p style="font-weight:700; color:#7e22ce; margin:0 0 6px 0;">🖼️ 3. Đính kèm Portfolio tương tự</p>
                    <p style="color:#475569; margin:0; line-height:1.6;">Trăm nghe không bằng một thấy. Hãy gửi link hoặc đính kèm 2-3 dự án tốt nhất liên quan trực tiếp đến lĩnh vực mà họ đang tuyển dụng.</p>
                </div>
                <div style="background:#fff7ed; border-left:4px solid #ea580c; border-radius:8px; padding:14px 16px; margin-bottom:0;">
                    <p style="font-weight:700; color:#c2410c; margin:0 0 6px 0;">💰 4. Đề xuất giá và thời hạn rõ ràng</p>
                    <p style="color:#475569; margin:0; line-height:1.6;">Đừng ngại đề xuất mức giá và thời gian hoàn thành cụ thể. Khách hàng luôn thích sự minh bạch ngay từ đầu để dễ đưa ra quyết định.</p>
                </div>`
        },
        'tip-time': {
            title: 'Quản lý thời gian: Học & Làm Freelance',
            category: 'Năng suất',
            categoryColor: '#10b981',
            icon: '⏰',
            content: `
                <p style="margin-bottom:14px; color:#475569; line-height:1.7;">Làm freelance khi còn đi học giúp sinh viên tích lũy kinh nghiệm và thu nhập, nhưng nếu không quản lý thời gian tốt, rất dễ bị quá tải và ảnh hưởng đến học tập.</p>
                <div style="background:#ecfdf5; border-left:4px solid #10b981; border-radius:8px; padding:14px 16px; margin-bottom:16px;">
                    <p style="font-weight:700; color:#065f46; margin:0 0 8px 0;">🧩 1. Ma trận Eisenhower — Phân loại công việc</p>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                        <div style="background:#fff; border:1px solid #d1fae5; border-radius:8px; padding:10px;">
                            <p style="color:#065f46; font-weight:700; font-size:12px; margin:0 0 4px;">🔴 Khẩn & Quan trọng</p>
                            <p style="color:#475569; font-size:12px; margin:0;">Làm ngay (bài kiểm tra, deadline gấp)</p>
                        </div>
                        <div style="background:#fff; border:1px solid #d1fae5; border-radius:8px; padding:10px;">
                            <p style="color:#065f46; font-weight:700; font-size:12px; margin:0 0 4px;">🟡 Quan trọng, không khẩn</p>
                            <p style="color:#475569; font-size:12px; margin:0;">Lên lịch (học kỹ năng, làm portfolio)</p>
                        </div>
                        <div style="background:#fff; border:1px solid #d1fae5; border-radius:8px; padding:10px;">
                            <p style="color:#065f46; font-weight:700; font-size:12px; margin:0 0 4px;">🟠 Khẩn nhưng ít quan trọng</p>
                            <p style="color:#475569; font-size:12px; margin:0;">Ủy thác hoặc tối ưu (email cơ bản)</p>
                        </div>
                        <div style="background:#fff; border:1px solid #d1fae5; border-radius:8px; padding:10px;">
                            <p style="color:#065f46; font-weight:700; font-size:12px; margin:0 0 4px;">⚪ Không khẩn & không quan trọng</p>
                            <p style="color:#475569; font-size:12px; margin:0;">Loại bỏ (lướt mạng vô ích)</p>
                        </div>
                    </div>
                </div>
                <div style="background:#f0fdf4; border-left:4px solid #16a34a; border-radius:8px; padding:14px 16px; margin-bottom:16px;">
                    <p style="font-weight:700; color:#15803d; margin:0 0 6px 0;">🍅 2. Kỹ thuật Pomodoro</p>
                    <p style="color:#475569; margin:0; line-height:1.6;">Làm việc <strong>25 phút</strong> tập trung → nghỉ <strong>5 phút</strong>. Lặp lại 4 lần rồi nghỉ dài 15-30 phút. Bộ não không bị quá tải và luôn duy trì năng suất cao.</p>
                </div>
                <div style="background:#eff6ff; border-left:4px solid #2563eb; border-radius:8px; padding:14px 16px;">
                    <p style="font-weight:700; color:#1e40af; margin:0 0 6px 0;">🛠️ 3. Công cụ hỗ trợ quản lý</p>
                    <p style="color:#475569; margin:0; line-height:1.6;">Tận dụng <strong>Trello</strong>, <strong>Notion</strong> hoặc <strong>Google Calendar</strong> để sắp xếp lịch học và deadline công việc. Nhìn thấy toàn bộ kế hoạch trực quan giúp bạn không bỏ sót gì.</p>
                </div>`
        },
        'tip-portfolio': {
            title: 'Xây dựng Portfolio từ con số 0',
            category: 'Portfolio',
            categoryColor: '#db2777',
            icon: '💼',
            content: `
                <p style="margin-bottom:14px; color:#475569; line-height:1.7;">Với sinh viên, rào cản lớn nhất khi bắt đầu freelance là thiếu dự án thực tế. Nhưng đừng lo — nhà tuyển dụng quan tâm đến <strong>năng lực</strong> của bạn nhiều hơn là việc dự án đó có thực sự tồn tại hay không.</p>
                <div style="background:#fdf2f8; border-left:4px solid #db2777; border-radius:8px; padding:14px 16px; margin-bottom:16px;">
                    <p style="font-weight:700; color:#9d174d; margin:0 0 6px 0;">💡 1. Tạo dự án cá nhân (Concept Projects)</p>
                    <p style="color:#475569; margin:0; line-height:1.6;">Chọn một thương hiệu nổi tiếng và tự thiết kế lại poster, slide, hoặc giao diện theo ý bạn. Nói rõ đây là "Personal Concept" — điều đó chứng minh bạn chủ động học hỏi.</p>
                </div>
                <div style="background:#fffbeb; border-left:4px solid #f59e0b; border-radius:8px; padding:14px 16px; margin-bottom:16px;">
                    <p style="font-weight:700; color:#92400e; margin:0 0 6px 0;">🎓 2. Tận dụng hoạt động ngoại khóa & CLB</p>
                    <p style="color:#475569; margin:0; line-height:1.6;">Nhận thiết kế tờ rơi, banner, viết bài hay quản lý fanpage cho các câu lạc bộ trường đại học. Đây là nguồn dự án thực tế vô cùng giá trị và được đánh giá cao.</p>
                </div>
                <div style="background:#eff6ff; border-left:4px solid #2563eb; border-radius:8px; padding:14px 16px; margin-bottom:16px;">
                    <p style="font-weight:700; color:#1e40af; margin:0 0 6px 0;">📝 3. Trình bày theo dạng Case Study</p>
                    <p style="color:#475569; margin:0; line-height:1.6;">Đừng chỉ đưa ra sản phẩm cuối cùng. Hãy kể câu chuyện: <em>Bài toán là gì? → Bạn đã làm gì? → Kết quả ra sao?</em> Đây là phong cách trình bày được các nhà tuyển dụng chuyên nghiệp ưa thích nhất.</p>
                </div>
                <div style="background:#f0fdf4; border-left:4px solid #16a34a; border-radius:8px; padding:14px 16px;">
                    <p style="font-weight:700; color:#15803d; margin:0 0 6px 0;">🌐 4. Chia sẻ portfolio lên mạng xã hội</p>
                    <p style="color:#475569; margin:0; line-height:1.6;">Đăng các dự án lên <strong>Behance</strong>, <strong>LinkedIn</strong> hoặc <strong>Instagram</strong> với đầy đủ thông tin. Portfolio online giúp khách hàng tìm đến bạn ngay cả khi bạn không chủ động tìm việc.</p>
                </div>`
        }
    };

    window.openTipModal = function (tipId) {
        const tip = tipData[tipId];
        if (!tip) return;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content animate-in" style="max-width:620px; max-height:88vh; overflow-y:auto; border-radius:20px; padding:0; position:relative;">
                <div style="background:linear-gradient(135deg, ${tip.categoryColor}18, ${tip.categoryColor}08); padding:28px 28px 20px; border-bottom:1px solid #f1f5f9; border-radius:20px 20px 0 0;">
                    <button class="modal-close" style="position:absolute; top:16px; right:16px; background:rgba(0,0,0,0.06); border:none; cursor:pointer; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; color:#64748b; font-size:18px;">×</button>
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
                        <span style="font-size:28px;">${tip.icon}</span>
                        <span style="background:${tip.categoryColor}20; color:${tip.categoryColor}; padding:3px 12px; border-radius:20px; font-size:12px; font-weight:700; letter-spacing:0.04em;">${tip.category}</span>
                    </div>
                    <h2 style="font-size:1.25rem; font-weight:800; color:#0f172a; margin:0; line-height:1.4; font-family:'Inter', sans-serif;">${tip.title}</h2>
                </div>
                <div style="padding:24px 28px 8px; font-family:'Inter', sans-serif;">
                    ${tip.content}
                </div>
                </div>
            </div>`;
        document.body.appendChild(modal);
        if (window.lucide) lucide.createIcons();
        requestAnimationFrame(() => modal.classList.add('active'));
        modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
        modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal); });
    };

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
                </div>
            </div>`;

        document.body.appendChild(modal);
        if (window.lucide) lucide.createIcons();
        requestAnimationFrame(() => modal.classList.add('active'));

        modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
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
                </div>
            </div>`;

        document.body.appendChild(modal);
        if (window.lucide) lucide.createIcons();
        requestAnimationFrame(() => modal.classList.add('active'));

        modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
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
            </div>`;

        document.body.appendChild(modal);
        if (window.lucide) lucide.createIcons();
        requestAnimationFrame(() => modal.classList.add('active'));
        modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
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

    function updateUnreadMessagesBadge() {
        const navMsg = document.getElementById('navMessages');
        if (!navMsg) return;

        fetch('/Home/GetUnreadMessagesCount')
            .then(res => res.json())
            .then(data => {
                if (data && data.success) {
                    let badge = navMsg.querySelector('.sidebar-badge');
                    if (data.count > 0) {
                        if (!badge) {
                            badge = document.createElement('span');
                            badge.className = 'sidebar-badge';
                            navMsg.appendChild(badge);
                        }
                        badge.textContent = data.count;
                        badge.style.display = 'inline-flex';
                    } else {
                        if (badge) {
                            badge.remove();
                        }
                    }
                }
            })
            .catch(err => console.error('Error fetching unread message count:', err));
    }

    function pollActiveChat() {
        const chatPanel = document.getElementById('chatPanel');
        if (!chatPanel) return;

        const currentActiveId = (chatPanel && chatPanel.dataset.activeUserId) ? Number(chatPanel.dataset.activeUserId) : activeChatUserId;
        if (currentActiveId) {
            const userId = currentActiveId;
            fetch(`/Home/GetConversationMessages?userId=${userId}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.success) {
                        const msgCount = (data.messages || []).length;
                        if (!window.activeChatMsgCounts) window.activeChatMsgCounts = {};
                        const prevCount = window.activeChatMsgCounts[userId];
                        if (prevCount !== msgCount) {
                            renderBusinessChat(data.user, data.messages || []);
                            window.activeChatMsgCounts[userId] = msgCount;
                            updateUnreadMessagesBadge();
                            loadBusinessConversations();
                        }
                    }
                })
                .catch(err => console.warn('Chat poll error:', err));
        } else {
            loadBusinessConversations();
        }
    }

    function bindNotificationBtn() {
        const btn = document.getElementById('notificationBtn');
        if (!btn) return;
        if (btn.closest('.dropdown')?.querySelector('.dropdown-menu')) return;
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
        if (btn.closest('.dropdown')?.querySelector('.dropdown-menu')) return;
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
            const email = btn.getAttribute('data-email') || (role === 'Nhà tuyển dụng' ? 'doanhnghiep@j4s.vn' : role === 'Freelancer' ? 'sinhvien@j4s.vn' : 'admin@j4s.vn');
            const userId = btn.getAttribute('data-user-id');
            const userRole = btn.getAttribute('data-user-role') || '';
            const isBusiness = userRole === 'Business';
            const isStudent = userRole === 'Student';
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
                        <div class="dropdown-menu-item" data-action="deposit"><i data-lucide="wallet-cards" style="width:16px;height:16px;"></i> Nạp tiền</div>
                        <div class="dropdown-menu-item" data-action="profile"><i data-lucide="building-2" style="width:16px;height:16px;"></i> Hồ sơ doanh nghiệp</div>
                        <div class="dropdown-menu-item" data-action="edit-profile"><i data-lucide="pencil" style="width:16px;height:16px;"></i> Chỉnh sửa thông tin công ty</div>
                        <div class="dropdown-menu-item" data-action="policies"><i data-lucide="shield" style="width:16px;height:16px;"></i> Điều khoản & Chính sách</div>
                    ` : `
                        ${isStudent ? `<div class="dropdown-menu-item" data-action="profile"><i data-lucide="user" style="width:16px;height:16px;"></i> Hồ sơ của tôi</div>` : ''}
                        ${isStudent ? `<div class="dropdown-menu-item" data-action="account"><i data-lucide="settings" style="width:16px;height:16px;"></i> Thiết lập tài khoản</div>` : ''}
                        <div class="dropdown-menu-item" data-action="privacy"><i data-lucide="shield" style="width:16px;height:16px;"></i> Điều khoản & Chính sách</div>
                    `}
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
                        case 'deposit':
                            if (isBusiness) {
                                setActiveSidebar('wallet-business');
                                currentSidebarMode = 'wallet-business';
                                if (typeof window.renderBusinessWalletDeposit === 'function') {
                                    window.renderBusinessWalletDeposit();
                                }
                            } else {
                                openDepositQrModal();
                            }
                            break;
                        case 'profile': setActiveSidebar('profile'); currentSidebarMode = 'profile'; renderProfileView(); break;
                        case 'edit-profile': openEditProfileFromMenu(); break;
                        case 'account': openEditProfileFromMenu(); break;
                        case 'privacy': setActiveSidebar(''); currentSidebarMode = 'privacy'; renderPoliciesView(); break;
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
                        <h4 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-top: 16px; margin-bottom: 8px;">2. Quy trình làm việc và Thanh toán</h4>
                        <ul style="padding-left: 20px;">
                            <li><strong>Thỏa thuận chi phí:</strong> Doanh nghiệp và sinh viên chủ động trao đổi, thống nhất mức ngân sách và hình thức thanh toán với nhau trước khi bắt đầu dự án.</li>
                            <li><strong>Vai trò của J4S:</strong> Hệ thống J4S không can thiệp vào quá trình thanh toán, không thu phí hay giữ tiền thù lao của sinh viên.</li>
                            <li><strong>Dịch vụ nền tảng:</strong> Hệ thống cung cấp các gói dịch vụ trả phí (đăng tin tuyển dụng, tính năng hỗ trợ gia tăng) dành riêng cho doanh nghiệp để tối ưu hóa quá trình tìm kiếm nhân sự.</li>
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
                            <li>Hồ sơ năng lực và kỹ năng của sinh viên sẽ được hiển thị công khai cho các nhà tuyển dụng tìm kiếm nhân sự phù hợp.</li>
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
            if (!isBusinessAccount()) {
                const rs = document.getElementById('rightSidebar');
                if (rs) rs.style.display = '';
            }
            renderFindJobView();
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
            openPostJobModal();
        });
        // Also bind the sidebar button (in case not yet bound by setupBusinessDashboardShell)
        const sidebarPostBtn = document.getElementById('btnPostJob');
        if (sidebarPostBtn && !sidebarPostBtn.dataset.bound) {
            sidebarPostBtn.dataset.bound = '1';
            sidebarPostBtn.style.background = 'linear-gradient(135deg,#2563eb,#0ea5e9)';
            sidebarPostBtn.style.color = '#fff';
            sidebarPostBtn.style.border = 'none';
            sidebarPostBtn.addEventListener('click', () => openPostJobModal());
        }
    }

    async function openPostJobModal(job = null) {
        const isEditOpen = job && job.status === 'Open';

        let isVipPackage = false;
        let remainingPosts = 0;
        let hasPlan = false;
        try {
            const res = await fetch('/Home/GetBusinessServicePackage');
            const data = await res.json();
            hasPlan = data.success && !!data.currentPackage;
            if (hasPlan) {
                remainingPosts = data.currentPackage.remainingJobPosts ?? 0;
                if (data.currentPackage.planName === 'Business VIP' || data.currentPackage.hasVipActive) {
                    isVipPackage = true;
                }
            }
        } catch (e) {
            console.error('Error checking subscription package:', e);
        }

        if (!isEditOpen && (!hasPlan || remainingPosts <= 0)) {
            showToast('Gói dịch vụ hiện tại đã hết số lượng tin đăng hoặc bạn chưa đăng ký gói. Vui lòng nâng cấp hoặc gia hạn.', 'warning');
            const navBtn = document.getElementById('navServicePackages');
            if (navBtn) {
                navBtn.click();
            } else {
                currentSidebarMode = 'servicePackages';
                renderServicePackagesView();
            }
            return;
        }

        const isEdit = !!job;
        const standardCategories = ['IT & Lập trình', 'Thiết kế & Đồ họa', 'Viết lách & Dịch thuật', 'Sales & Marketing', 'Video & Photography'];
        const isCustomCategory = job?.category && !standardCategories.includes(job.category);
        const selectedCategory = isCustomCategory ? 'Khác' : (job?.category || 'IT & Lập trình');

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:760px;max-height:85vh;overflow-y:auto;">
                <button class="modal-close"><i data-lucide="x" style="width:20px;height:20px;"></i></button>
                <div class="modal-header"><h2>${isEdit ? 'Chỉnh sửa tin tuyển dụng' : 'Đăng việc mới'}</h2></div>
                <div class="modal-body">
                    ${(isVipPackage || job?.isVip) ? `
                    <div class="form-group" style="background:#fffbeb; padding:12px; border-radius:8px; border:1px solid #fef3c7; margin-bottom:16px;">
                        <label class="form-checkbox d-flex align-items-center gap-2" style="font-weight:600; color:#b45309; display:inline-flex; align-items:center; cursor:pointer;">
                            <input type="checkbox" id="postJobIsVip" ${job?.isVip || isVipPackage ? 'checked' : ''} style="margin-right:8px; width:16px; height:16px;" />
                            <span>Đăng bài này dưới tư cách thành viên VIP (Độ ưu tiên cao nhất, hiển thị trong 7 ngày)</span>
                        </label>
                    </div>
                    ` : ''}
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
                                ${['IT & Lập trình', 'Thiết kế & Đồ họa', 'Viết lách & Dịch thuật', 'Sales & Marketing', 'Video & Photography', 'Khác'].map(c => `<option ${selectedCategory === c ? 'selected' : ''}>${c}</option>`).join('')}
                            </select>
                            <div id="dynamicCustomCategoryWrapper" style="${selectedCategory === 'Khác' ? '' : 'display: none;'}" class="mt-2">
                                <input type="text" class="form-input" id="postJobCustomCategory" value="${isCustomCategory ? escapeHtml(job.category) : ''}" placeholder="Nhập danh mục khác..." />
                            </div>
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
                </div>
            </div>`;

        document.body.appendChild(modal);
        setupCurrencyInput(modal.querySelector('#postJobBudget'));
        if (window.lucide) lucide.createIcons();
        requestAnimationFrame(() => modal.classList.add('active'));

        const vipCheck = modal.querySelector('#postJobIsVip');
        const deadlineInput = modal.querySelector('#postJobDeadline');
        if (vipCheck && deadlineInput) {
            const updateDeadlineState = () => {
                if (vipCheck.checked) {
                    const nextWeek = new Date();
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    deadlineInput.value = nextWeek.toISOString().split('T')[0];
                    deadlineInput.disabled = true;
                } else {
                    deadlineInput.disabled = false;
                }
            };
            vipCheck.addEventListener('change', updateDeadlineState);
            updateDeadlineState();
        }

        modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
        modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal); });

        const dynCategory = modal.querySelector('#postJobCategory');
        const dynWrapper = modal.querySelector('#dynamicCustomCategoryWrapper');
        const dynInput = modal.querySelector('#postJobCustomCategory');
        if (dynCategory) {
            dynCategory.addEventListener('change', () => {
                if (dynCategory.value === 'Khác') {
                    if (dynWrapper) dynWrapper.style.display = 'block';
                    if (dynInput) dynInput.focus();
                } else {
                    if (dynWrapper) dynWrapper.style.display = 'none';
                    if (dynInput) dynInput.value = '';
                }
            });
        }

        const submitBusinessJob = (saveAsDraft) => {
            const title = modal.querySelector('#postJobTitle').value.trim();
            const description = modal.querySelector('#postJobDesc').value.trim();
            const deadline = modal.querySelector('#postJobDeadline').value;
            const budgetVal = modal.querySelector('#postJobBudget').value;
            const budget = Number(budgetVal.replace(/\D/g, ''));
            const quantity = Number(modal.querySelector('#postJobQuantity').value) || 1;

            if (!title || title.length < 10 || title.length > 150) {
                showToast('Tiêu đề công việc phải có độ dài từ 10 đến 150 ký tự.', 'warning');
                return;
            }
            if (quantity < 1) {
                showToast('Số lượng tuyển dụng phải lớn hơn hoặc bằng 1.', 'warning');
                return;
            }
            if (!saveAsDraft) {
                if (!description) { showToast('Vui lòng nhập mô tả công việc.', 'warning'); return; }
                if (!deadline) { showToast('Vui lòng chọn deadline tuyển dụng.', 'warning'); return; }

                const deadlineDate = new Date(deadline);
                deadlineDate.setHours(0, 0, 0, 0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                const maxFutureDate = new Date(today);
                maxFutureDate.setDate(maxFutureDate.getDate() + 90);

                if (deadlineDate < tomorrow) {
                    showToast('Hạn chót ứng tuyển phải từ ngày mai trở đi.', 'warning');
                    return;
                }
                if (deadlineDate > maxFutureDate) {
                    showToast('Hạn chót ứng tuyển không được vượt quá 90 ngày kể từ ngày đăng.', 'warning');
                    return;
                }

                if (!Number.isFinite(budget) || budget < 10000 || budget > 10000000000) {
                    showToast('Mức lương hợp lệ phải từ 10,000đ đến 10 tỷ đồng.', 'warning');
                    return;
                }
            }

            let finalCategory = modal.querySelector('#postJobCategory').value;
            if (finalCategory === 'Khác') {
                finalCategory = modal.querySelector('#postJobCustomCategory')?.value.trim() || 'Khác';
            }

            const payload = {
                id: job?.id || null,
                title,
                description,
                requirements: modal.querySelector('#postJobRequirements').value.trim(),
                benefits: modal.querySelector('#postJobBenefits').value.trim(),
                category: finalCategory,
                skills: modal.querySelector('#postJobSkills').value.split(',').map(s => s.trim()).filter(Boolean),
                budget: Number.isFinite(budget) ? budget : 0,
                budgetType: modal.querySelector('#postJobBudgetType').value,
                experienceLevel: modal.querySelector('#postJobExperience').value,
                location: modal.querySelector('#postJobLocation').value.trim() || 'Online',
                quantity: Number(modal.querySelector('#postJobQuantity').value) || 1,
                deadline,
                isVip: modal.querySelector('#postJobIsVip')?.checked || false,
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

                        if (typeof loadBusinessHomeData === 'function') {
                            loadBusinessHomeData();
                        }
                        if (typeof loadServicePackages === 'function' && document.getElementById('servicePackagesPanel')) {
                            loadServicePackages();
                        }
                        if (typeof window.getWalletData === 'function') {
                            window.getWalletData();
                        }
                        if (typeof window.renderBusinessWalletDeposit === 'function') {
                            window.renderBusinessWalletDeposit();
                        }

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
    window.showToast = showToast;

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    function formatVND(amount) {
        return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
    }

    function formatCurrencyInput(value) {
        let clean = value.toString().replace(/\D/g, '');
        if (!clean) return '';
        return new Intl.NumberFormat('vi-VN').format(clean) + ' đ';
    }

    function setupCurrencyInput(inputElement) {
        if (!inputElement) return;
        inputElement.type = 'text';
        if (inputElement.value) {
            inputElement.value = formatCurrencyInput(inputElement.value);
        }
        inputElement.addEventListener('input', function () {
            this.value = formatCurrencyInput(this.value);
        });
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




    window.setSelectCategory = function (selectId, wrapperId, inputId, categoryValue) {
        const select = document.getElementById(selectId);
        const wrapper = document.getElementById(wrapperId);
        const input = document.getElementById(inputId);
        if (!select) return;

        const standardCategories = ['IT & Lập trình', 'Thiết kế & Đồ họa', 'Viết lách & Dịch thuật', 'Sales & Marketing', 'Video & Photography'];
        if (!categoryValue) {
            select.value = '';
            if (wrapper) wrapper.style.display = 'none';
            if (input) input.value = '';
        } else if (standardCategories.includes(categoryValue)) {
            select.value = categoryValue;
            if (wrapper) wrapper.style.display = 'none';
            if (input) input.value = '';
        } else {
            select.value = 'Khác';
            if (wrapper) wrapper.style.display = 'block';
            if (input) input.value = categoryValue;
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        const staticCategory = document.getElementById('jobCategory');
        const staticWrapper = document.getElementById('staticCustomCategoryWrapper');
        const staticInput = document.getElementById('jobCustomCategory');
        if (staticCategory) {
            staticCategory.addEventListener('change', () => {
                if (staticCategory.value === 'Khác') {
                    if (staticWrapper) staticWrapper.style.display = 'block';
                    if (staticInput) staticInput.focus();
                } else {
                    if (staticWrapper) staticWrapper.style.display = 'none';
                    if (staticInput) staticInput.value = '';
                }
            });
        }

        const btnSubmitJob = document.getElementById('btnSubmitJob');
        if (btnSubmitJob) {
            btnSubmitJob.addEventListener('click', async () => {
                const form = document.getElementById('postJobForm');
                const title = document.getElementById('jobTitle')?.value.trim() || '';
                const description = document.getElementById('jobDescription')?.value.trim() || '';
                const budget = Number(document.getElementById('jobBudget')?.value) || 0;
                const deadline = document.getElementById('jobDeadline')?.value || '';
                const saveMode = document.getElementById('jobFormSaveMode')?.value || 'publish';
                const isDraft = saveMode.trim().toLowerCase() === 'draft';

                if (!title || title.length < 10 || title.length > 150) {
                    showToast('Tiêu đề công việc phải có độ dài từ 10 đến 150 ký tự.', 'warning');
                    return;
                }

                if (!isDraft) {
                    if (!description) { showToast('Vui lòng nhập mô tả công việc.', 'warning'); return; }
                    if (!deadline) { showToast('Vui lòng chọn deadline tuyển dụng.', 'warning'); return; }

                    const deadlineDate = new Date(deadline);
                    deadlineDate.setHours(0, 0, 0, 0);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);

                    const maxFutureDate = new Date(today);
                    maxFutureDate.setDate(maxFutureDate.getDate() + 90);

                    if (deadlineDate < tomorrow) {
                        showToast('Hạn chót ứng tuyển phải từ ngày mai trở đi.', 'warning');
                        return;
                    }
                    if (deadlineDate > maxFutureDate) {
                        showToast('Hạn chót ứng tuyển không được vượt quá 90 ngày kể từ ngày đăng.', 'warning');
                        return;
                    }

                    if (budget < 10000 || budget > 10000000000) {
                        showToast('Mức lương hợp lệ phải từ 10,000đ đến 10 tỷ đồng.', 'warning');
                        return;
                    }
                }

                if (!form.checkValidity()) {
                    form.reportValidity();
                    return;
                }
                const formData = new FormData(form);
                if (formData.get('category') === 'Khác') {
                    const customVal = document.getElementById('jobCustomCategory')?.value.trim() || 'Khác';
                    formData.set('category', customVal);
                }
                const mode = (formData.get('jobMode') || 'new').toString().toLowerCase();
                const url = mode === 'edit' ? '/Home/UpdateJobPost' : '/Home/PostJob';
                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]')?.value
                        }
                    });

                    if (!response.ok) {
                        const text = await response.text();
                        console.error("Server returned error:", response.status, text);
                        showToast('Lỗi từ máy chủ: ' + response.status + '. Vui lòng xem F12 Console.', 'error');
                        return;
                    }

                    const data = await response.json();
                    if (data.success) {
                        showToast(data.message, 'success');
                        const modalEl = document.getElementById('postJobModal');
                        if (modalEl) {
                            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                            modal.hide();
                            form.reset();
                        }
                        window.preparePostJobForm?.();
                        setTimeout(() => window.location.reload(), 1500);
                    } else {
                        showToast(data.message || 'Lỗi khi đăng bài', 'error');
                    }
                } catch (err) {
                    console.error("Lỗi fetch:", err);
                    showToast('Lỗi kết nối hoặc lỗi xử lý dữ liệu', 'error');
                }
            });
        }

    });

    function renderBusinessReviewsView() {
        renderGenericReviewsShell('Business');
    }

    function renderBusinessReviewsViewObsolete() {
        businessReviewsPage = 1;
        mainContent.innerHTML = `
            <div class="page-header animate-in">
                <h1 class="page-title"><i data-lucide="star" style="width:24px;height:24px;"></i> Đánh giá sinh viên</h1>
                <p class="page-subtitle">Đánh giá sinh viên sau khi dự án đã hoàn thành. Cho phép chỉnh sửa trong vòng 24 giờ sau khi đánh giá.</p>
            </div>
            <div class="profile-card-modern" style="padding:18px;">
                <div id="businessReviewsPanel" style="display:flex; flex-direction:column; gap:16px;">
                    <div class="business-loading-row"><span class="spinner-border spinner-border-sm"></span> Đang tải danh sách dự án...</div>
                </div>
                <div id="businessReviewsPagination" style="display:flex;align-items:center;justify-content:space-between;margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;flex-wrap:wrap;gap:12px;"></div>
            </div>`;

        if (window.lucide) lucide.createIcons();
        loadBusinessCompletedReviews();
    }

    function loadBusinessCompletedReviews() {
        fetch('/Review/GetBusinessCompletedContracts')
            .then(res => res.json())
            .then(data => {
                const panel = document.getElementById('businessReviewsPanel');
                if (!panel) return;
                if (!data.success) {
                    panel.innerHTML = `<div class="business-empty-row">${escapeHtml(data.message || 'Lỗi khi tải dữ liệu.')}</div>`;
                    return;
                }
                businessReviewsList = data.contracts || [];
                renderBusinessCompletedReviewsPage();
            })
            .catch(err => {
                console.error(err);
                const panel = document.getElementById('businessReviewsPanel');
                if (panel) panel.innerHTML = '<div class="business-empty-row">Có lỗi khi tải danh sách.</div>';
            });
    }

    function renderBusinessCompletedReviewsPage() {
        const panel = document.getElementById('businessReviewsPanel');
        const paginationEl = document.getElementById('businessReviewsPagination');
        if (!panel) return;

        if (!businessReviewsList.length) {
            panel.innerHTML = '<div class="business-empty-row">Chưa có dự án nào hoàn thành để đánh giá.</div>';
            if (paginationEl) paginationEl.innerHTML = '';
            return;
        }

        const pageSize = Number(localStorage.getItem('j4s_pagesize_businessReviews')) || 10;
        const total = businessReviewsList.length;
        const totalPages = Math.ceil(total / pageSize);
        if (businessReviewsPage > totalPages) businessReviewsPage = Math.max(1, totalPages);

        const startIndex = (businessReviewsPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageContracts = businessReviewsList.slice(startIndex, endIndex);

        panel.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:16px;">
                ${pageContracts.map(c => {
            let actionHTML = '';
            if (c.hasReview) {
                if (c.review.canEdit) {
                    actionHTML = `<button class="btn btn-sm btn-outline-primary rounded-pill px-3 btn-edit-review" data-contract-id="${c.contractId}"><i data-lucide="edit-3" style="width:14px;height:14px;margin-right:4px;"></i> Chỉnh sửa</button>`;
                } else {
                    actionHTML = `<span class="text-muted small d-inline-flex align-items-center gap-1"><i data-lucide="lock" style="width:14px;height:14px;"></i> Đã khóa (Quá 24h)</span>`;
                }
            } else {
                actionHTML = `<button class="btn btn-sm btn-primary rounded-pill px-3 btn-write-review" style="background:#0ea5e9; border:none;" data-contract-id="${c.contractId}"><i data-lucide="star" style="width:14px;height:14px;margin-right:4px;"></i> Viết đánh giá</button>`;
            }

            return `
                                <div class="review-modern-item" style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background:#fff; display:flex; justify-content:space-between; align-items:flex-start; gap:16px;">
                                    <div style="display:flex; gap:16px; align-items:flex-start;">
                                        <div class="user-avatar" style="width:48px; height:48px; border-radius:50%; overflow:hidden; background:#e2e8f0; flex-shrink:0;">
                                            ${c.studentAvatar ? `<img src="${c.studentAvatar}" style="width:100%; height:100%; object-fit:cover;" />` : `<span style="display:flex; width:100%; height:100%; align-items:center; justify-content:center; font-weight:700; color:#475569;">${c.studentName.substring(0, 2).toUpperCase()}</span>`}
                                        </div>
                                        <div>
                                            <h5 style="margin:0 0 4px 0; font-size:1rem; font-weight:700; color:#1e293b;">${escapeHtml(c.studentName)}</h5>
                                            <p style="margin:0 0 6px 0; font-size:0.85rem; color:#64748b;">Dự án: <strong>${escapeHtml(c.jobTitle)}</strong></p>
                                            <small class="text-muted" style="font-size:0.75rem;">Hoàn thành lúc: ${escapeHtml(c.completedAt)}</small>
                                            
                                            ${c.hasReview && c.review ? `
                                                <div style="margin-top:10px; border-top:1px solid #f1f5f9; padding-top:8px;">
                                                    <div style="color:#fbbf24; font-size:0.95rem; margin-bottom:4px;">
                                                        ${'★'.repeat(c.review.rating || 0)}${'☆'.repeat(5 - (c.review.rating || 0))}
                                                        <span class="text-muted small" style="margin-left:4px; font-weight:600;">(${c.review.rating || 0}/5)</span>
                                                    </div>
                                                    <p style="margin:0; font-size:0.9rem; color:#334155; font-style:italic;">"${escapeHtml(c.review.comment || '')}"</p>
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                    <div style="flex-shrink:0;">
                                        ${actionHTML}
                                    </div>
                                </div>
                            `;
        }).join('')}
            </div>`;

        // Programmatically bind events to write/edit buttons
        panel.querySelectorAll('.btn-write-review, .btn-edit-review').forEach(btn => {
            btn.addEventListener('click', function () {
                const contractId = parseInt(this.dataset.contractId);
                const c = businessReviewsList.find(item => item.contractId === contractId);
                if (c) {
                    openReviewModal(
                        c.contractId,
                        c.studentName,
                        c.review ? c.review.rating : 5,
                        c.review ? c.review.comment : ''
                    );
                }
            });
        });

        if (window.lucide) lucide.createIcons();

        if (paginationEl) {
            renderGenericPaginationControls(paginationEl, total, totalPages, businessReviewsPage, pageSize, (newSize) => {
                businessReviewsPage = 1;
                renderBusinessCompletedReviewsPage();
            }, (newPage) => {
                businessReviewsPage = newPage;
                renderBusinessCompletedReviewsPage();
                document.getElementById('mainContent')?.scrollIntoView({ behavior: 'smooth' });
            }, 'j4s_pagesize_businessReviews');
        }
    }

    function openReviewModal(contractId, studentName, currentRating = 5, currentComment = '') {
        document.getElementById('j4sReviewModal')?.remove();
        const modalHTML = `
            <div class="modal fade" id="j4sReviewModal" tabindex="-1" aria-hidden="true" style="z-index: 1060;">
                <div class="modal-dialog modal-dialog-centered" style="max-width: 450px;">
                    <div class="modal-content" style="border-radius: 16px; border: none; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
                        <div class="modal-header border-0 pb-0" style="padding: 20px 20px 0 20px;">
                            <h5 class="modal-title fw-bold text-slate-800" id="reviewModalTitle">${currentComment ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá cho sinh viên'}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-4">
                            <div class="text-center mb-3">
                                <p class="text-slate-600 font-semibold mb-1">Sinh viên: <strong>${escapeHtml(studentName)}</strong></p>
                                <div class="review-stars-input d-flex justify-content-center gap-2 my-2" style="font-size: 2rem; cursor: pointer; color: #cbd5e1;">
                                    <span data-star="1">★</span>
                                    <span data-star="2">★</span>
                                    <span data-star="3">★</span>
                                    <span data-star="4">★</span>
                                    <span data-star="5">★</span>
                                </div>
                                <input type="hidden" id="reviewRatingInput" value="${currentRating || 5}" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label text-slate-700 fw-bold small">Nhận xét của bạn</label>
                                <textarea id="reviewCommentInput" class="form-control" rows="4" style="border-radius:10px; font-size:0.9rem;" placeholder="Nhập phản hồi, thái độ làm việc, chất lượng dự án của sinh viên...">${escapeHtml(currentComment)}</textarea>
                            </div>
                            <div class="d-flex gap-2 justify-content-end">
                                <button type="button" class="btn btn-light rounded-pill px-4 py-2 fw-semibold text-slate-600 small" style="border: 1px solid #e2e8f0; font-size: 0.85rem;" data-bs-dismiss="modal">Hủy</button>
                                <button type="button" id="btnSubmitReview" class="btn btn-primary rounded-pill px-4 py-2 fw-bold small" style="background: #0ea5e9; border: none; font-size: 0.85rem;">Gửi đánh giá</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modalEl = document.getElementById('j4sReviewModal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();

        const stars = modalEl.querySelectorAll('.review-stars-input span');
        const ratingInput = document.getElementById('reviewRatingInput');

        function highlightStars(val) {
            stars.forEach(star => {
                const sVal = parseInt(star.dataset.star);
                if (sVal <= val) {
                    star.style.color = '#fbbf24';
                } else {
                    star.style.color = '#cbd5e1';
                }
            });
        }

        highlightStars(parseInt(ratingInput.value));

        stars.forEach(star => {
            star.addEventListener('click', () => {
                const val = parseInt(star.dataset.star);
                ratingInput.value = val;
                highlightStars(val);
            });
            star.addEventListener('mouseover', () => {
                highlightStars(parseInt(star.dataset.star));
            });
            star.addEventListener('mouseout', () => {
                highlightStars(parseInt(ratingInput.value));
            });
        });

        document.getElementById('btnSubmitReview').addEventListener('click', () => {
            const rating = parseInt(ratingInput.value);
            const comment = document.getElementById('reviewCommentInput').value.trim();

            if (isNaN(rating) || rating < 1 || rating > 5) {
                showToast('Vui lòng chọn số sao từ 1 đến 5.', 'warning');
                return;
            }

            if (!comment || comment.length < 10) {
                showToast('Nội dung nhận xét phải tối thiểu 10 ký tự.', 'warning');
                return;
            }

            const formData = new FormData();
            formData.append('contractId', contractId);
            formData.append('rating', rating);
            formData.append('comment', comment);

            fetch('/Review/SaveBusinessReview', {
                method: 'POST',
                body: formData
            })
                .then(r => r.json())
                .then(data => {
                    showToast(data.message || 'Đã gửi đánh giá thành công.', data.success ? 'success' : 'error');
                    if (data.success) {
                        modal.hide();
                        modalEl.addEventListener('hidden.bs.modal', () => {
                            modalEl.remove();
                            loadBusinessCompletedReviews();
                        }, { once: true });
                    }
                })
                .catch(err => {
                    console.error(err);
                    showToast('Có lỗi xảy ra khi lưu đánh giá.', 'error');
                });
        });
    }

    function renderGenericReviewsShell(role) {
        const title = 'Đánh giá';
        const subtitle = role === 'Student'
            ? 'Quản lý các đánh giá của bạn dành cho doanh nghiệp và các phản hồi qua lại'
            : 'Quản lý các nhận xét của doanh nghiệp dành cho bạn và các phản hồi qua lại';

        mainContent.innerHTML = `
            <div class="page-header animate-in">
                <h1 class="page-title"><i data-lucide="star" style="width:24px;height:24px;color:#F59E0B;"></i> ${title}</h1>
                <p class="page-subtitle">${subtitle}</p>
            </div>
            
            <div id="reviewsRatingChartContainer" class="animate-in" style="margin-bottom: 24px;"></div>
            
            <div class="reviews-tab-nav animate-in" style="margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; display:flex; gap: 8px;">
                <button class="review-tab-btn active" id="btnTabWrite" style="border:none; border-bottom:2px solid #2563eb; background:none; padding: 10px 16px; font-weight:600; color:#2563eb; cursor:pointer; display:flex; align-items:center; gap:6px;">
                    <i data-lucide="edit-3" style="width:16px;height:16px;"></i> Viết đánh giá đối tác
                </button>
                <button class="review-tab-btn" id="btnTabReceived" style="border:none; border-bottom:2px solid transparent; background:none; padding: 10px 16px; font-weight:600; color:#64748b; cursor:pointer; display:flex; align-items:center; gap:6px;">
                    <i data-lucide="message-square" style="width:16px;height:16px;"></i> Nhận xét từ đối tác
                </button>
            </div>
            
            <div id="reviewsContentPanel" class="animate-in">
                <div style="display: flex; align-items: center; justify-content: center; min-height: 200px; flex-direction: column; gap: 12px;">
                    <div class="spinner-border text-primary" role="status" style="width: 1.5rem; height: 1.5rem;"></div>
                    <span style="color:#64748b; font-size:0.9rem;">Đang tải dữ liệu...</span>
                </div>
            </div>
        `;

        if (window.lucide) lucide.createIcons();

        const chartContainer = document.getElementById('reviewsRatingChartContainer');
        if (chartContainer) {
            fetch('/Review/GetMyReviews')
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        const reviews = data.reviews || [];
                        const totalCount = reviews.length;
                        let sum = 0;
                        const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
                        reviews.forEach(r => {
                            const val = r.rating || 0;
                            if (val >= 1 && val <= 5) {
                                counts[val]++;
                                sum += val;
                            }
                        });
                        const avgRating = totalCount > 0 ? (sum / totalCount) : 0;
                        const avgRatingStr = avgRating > 0 ? avgRating.toFixed(1).replace('.', ',') : '0,0';

                        const pct5 = totalCount > 0 ? Math.round((counts[5] / totalCount) * 100) : 0;
                        const pct4 = totalCount > 0 ? Math.round((counts[4] / totalCount) * 100) : 0;
                        const pct3 = totalCount > 0 ? Math.round((counts[3] / totalCount) * 100) : 0;
                        const pct2 = totalCount > 0 ? Math.round((counts[2] / totalCount) * 100) : 0;
                        const pct1 = totalCount > 0 ? Math.round((counts[1] / totalCount) * 100) : 0;

                        const roundedRating = Math.round(avgRating);
                        const starHTML = '★'.repeat(roundedRating) + '☆'.repeat(5 - roundedRating);

                        chartContainer.innerHTML = `
                            <style>
                            @media (max-width: 576px) {
                                .rating-chart-right {
                                    border-left: none !important;
                                    padding-left: 0 !important;
                                    border-top: 1px solid #e2e8f0;
                                    padding-top: 20px;
                                    width: 100%;
                                }
                            }
                            @media (min-width: 577px) {
                                .rating-chart-right {
                                    border-left: 1px solid #e2e8f0;
                                }
                            }
                            </style>
                            <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; display: flex; align-items: center; justify-content: space-between; gap: 40px; flex-wrap: wrap; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                                <!-- Left: Breakdown bars -->
                                <div style="flex: 1; min-width: 250px; display: flex; flex-direction: column; gap: 10px;">
                                    <div style="display: flex; align-items: center; gap: 12px; font-size: 0.9rem; font-weight: 500; color: #475569;">
                                        <span style="width: 12px; text-align: right;">5</span>
                                        <div style="flex: 1; height: 8px; background: #f1f5f9; border-radius: 9999px; overflow: hidden; position: relative;">
                                            <div style="width: ${pct5}%; height: 100%; background: #fbbf24; border-radius: 9999px;"></div>
                                        </div>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 12px; font-size: 0.9rem; font-weight: 500; color: #475569;">
                                        <span style="width: 12px; text-align: right;">4</span>
                                        <div style="flex: 1; height: 8px; background: #f1f5f9; border-radius: 9999px; overflow: hidden; position: relative;">
                                            <div style="width: ${pct4}%; height: 100%; background: #fbbf24; border-radius: 9999px;"></div>
                                        </div>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 12px; font-size: 0.9rem; font-weight: 500; color: #475569;">
                                        <span style="width: 12px; text-align: right;">3</span>
                                        <div style="flex: 1; height: 8px; background: #f1f5f9; border-radius: 9999px; overflow: hidden; position: relative;">
                                            <div style="width: ${pct3}%; height: 100%; background: #fbbf24; border-radius: 9999px;"></div>
                                        </div>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 12px; font-size: 0.9rem; font-weight: 500; color: #475569;">
                                        <span style="width: 12px; text-align: right;">2</span>
                                        <div style="flex: 1; height: 8px; background: #f1f5f9; border-radius: 9999px; overflow: hidden; position: relative;">
                                            <div style="width: ${pct2}%; height: 100%; background: #fbbf24; border-radius: 9999px;"></div>
                                        </div>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 12px; font-size: 0.9rem; font-weight: 500; color: #475569;">
                                        <span style="width: 12px; text-align: right;">1</span>
                                        <div style="flex: 1; height: 8px; background: #f1f5f9; border-radius: 9999px; overflow: hidden; position: relative;">
                                            <div style="width: ${pct1}%; height: 100%; background: #fbbf24; border-radius: 9999px;"></div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Right: Avg rating and overall count -->
                                <div class="rating-chart-right" style="text-align: center; min-width: 180px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding-left: 40px;">
                                    <span style="font-size: 3.5rem; font-weight: 800; color: #0f172a; line-height: 1; margin-bottom: 8px;">${avgRatingStr}</span>
                                    <div style="color: #fbbf24; font-size: 1.25rem; margin-bottom: 8px; letter-spacing: 2px;">
                                        ${starHTML}
                                    </div>
                                    <span style="font-size: 0.85rem; color: #64748b; font-weight: 600;">${totalCount} đánh giá</span>
                                </div>
                            </div>
                        `;
                    } else {
                        chartContainer.remove();
                    }
                })
                .catch(err => {
                    console.error('Error loading rating breakdown:', err);
                    chartContainer.remove();
                });
        }

        const btnTabWrite = document.getElementById('btnTabWrite');
        const btnTabReceived = document.getElementById('btnTabReceived');

        let activeSubTab = 'write';

        function updateTabStyles() {
            if (activeSubTab === 'write') {
                btnTabWrite.style.color = '#2563eb';
                btnTabWrite.style.borderBottomColor = '#2563eb';
                btnTabReceived.style.color = '#64748b';
                btnTabReceived.style.borderBottomColor = 'transparent';
            } else {
                btnTabReceived.style.color = '#2563eb';
                btnTabReceived.style.borderBottomColor = '#2563eb';
                btnTabWrite.style.color = '#64748b';
                btnTabWrite.style.borderBottomColor = 'transparent';
            }
        }

        btnTabWrite.addEventListener('click', () => {
            if (activeSubTab === 'write') return;
            activeSubTab = 'write';
            updateTabStyles();
            loadWriteReviewsTab(role);
        });

        btnTabReceived.addEventListener('click', () => {
            if (activeSubTab === 'received') return;
            activeSubTab = 'received';
            updateTabStyles();
            loadReceivedReviewsTab(role);
        });

        loadWriteReviewsTab(role);
    }

    function loadWriteReviewsTab(role) {
        const panel = document.getElementById('reviewsContentPanel');
        if (!panel) return;

        panel.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 200px; flex-direction: column; gap: 12px;">
                <div class="spinner-border text-primary" role="status" style="width: 1.5rem; height: 1.5rem;"></div>
                <span style="color:#64748b; font-size:0.9rem;">Đang tải danh sách hợp đồng...</span>
            </div>
        `;

        const storageKey = 'j4s_pagesize_write_reviews';
        let pageSize = Number(localStorage.getItem(storageKey)) || 10;
        let currentPage = 1;

        const url = role === 'Student'
            ? '/Review/GetStudentCompletedContracts'
            : '/Review/GetBusinessCompletedContracts';

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    panel.innerHTML = `<div class="alert alert-danger">${escapeHtml(data.message || 'Lỗi khi tải dữ liệu.')}</div>`;
                    return;
                }

                const contracts = data.contracts || [];
                if (contracts.length === 0) {
                    panel.innerHTML = `
                        <div style="text-align:center; padding:40px; background:#fff; border-radius:12px; border:1px solid #e2e8f0;">
                            <div style="font-size:2.5rem; margin-bottom:12px;">💼</div>
                            <h3 style="font-size:1.1rem; font-weight:700; color:#1e293b; margin:0 0 6px 0;">Chưa có hợp đồng nào hoàn thành</h3>
                            <p style="font-size:0.9rem; color:#64748b; margin:0;">Sau khi dự án hoàn thành, bạn có thể đánh giá đối tác tại đây.</p>
                        </div>
                    `;
                    return;
                }

                panel.innerHTML = `
                    <div id="writeReviewsListContainer" style="display:flex; flex-direction:column; gap:16px;"></div>
                    <div id="writeReviewsPagination" style="display:flex; align-items:center; justify-content:space-between; margin-top:20px; padding-top:16px; border-top:1px solid #e2e8f0; flex-wrap:wrap; gap:12px;"></div>
                `;

                function renderPage(page) {
                    currentPage = page;
                    const totalPages = Math.ceil(contracts.length / pageSize);
                    if (currentPage > totalPages) {
                        currentPage = Math.max(1, totalPages);
                    }

                    const startIndex = (currentPage - 1) * pageSize;
                    const pageContracts = contracts.slice(startIndex, startIndex + pageSize);

                    const reviewsHTML = pageContracts.map(c => {
                        let actionHTML = '';
                        if (c.hasReview) {
                            if (c.review.canEdit) {
                                actionHTML = `<button class="btn btn-sm btn-outline-primary rounded-pill px-3 btn-edit-generic-review" data-contract-id="${c.contractId}"><i data-lucide="edit-3" style="width:14px;height:14px;margin-right:4px;"></i> Chỉnh sửa</button>`;
                            } else {
                                actionHTML = `<span class="text-muted small d-inline-flex align-items-center gap-1"><i data-lucide="lock" style="width:14px;height:14px;"></i> Đã khóa (Quá 24h)</span>`;
                            }
                        } else {
                            actionHTML = `<button class="btn btn-sm btn-primary rounded-pill px-3 btn-write-generic-review" style="background:#0ea5e9; border:none;" data-contract-id="${c.contractId}"><i data-lucide="star" style="width:14px;height:14px;margin-right:4px;"></i> Viết đánh giá</button>`;
                        }

                        const avatarChar = (c.partnerName || "K").substring(0, 2).toUpperCase();

                        return `
                            <div class="review-modern-item animate-in" style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background:#fff; display:flex; justify-content:space-between; align-items:flex-start; gap:16px;">
                                <div style="display:flex; gap:16px; align-items:flex-start; width: 100%;">
                                    <div class="user-avatar" style="width:48px; height:48px; border-radius:50%; overflow:hidden; background:#e2e8f0; flex-shrink:0;">
                                        ${c.partnerAvatar ? `<img src="${c.partnerAvatar}" style="width:100%; height:100%; object-fit:cover;" />` : `<span style="display:flex; width:100%; height:100%; align-items:center; justify-content:center; font-weight:700; color:#475569;">${avatarChar}</span>`}
                                    </div>
                                    <div style="flex-grow: 1;">
                                        <h5 style="margin:0 0 4px 0; font-size:1rem; font-weight:700; color:#1e293b;">${escapeHtml(c.partnerName)}</h5>
                                        <p style="margin:0 0 6px 0; font-size:0.85rem; color:#64748b;">Dự án: <strong>${escapeHtml(c.jobTitle)}</strong></p>
                                        <small class="text-muted" style="font-size:0.75rem;">Hoàn thành lúc: ${escapeHtml(c.completedAt)}</small>
                                        
                                        ${c.hasReview && c.review ? `
                                            <div style="margin-top:10px; border-top:1px solid #f1f5f9; padding-top:8px;">
                                                <div style="color:#fbbf24; font-size:0.95rem; margin-bottom:4px;">
                                                    ${'★'.repeat(c.review.rating || 0)}${'☆'.repeat(5 - (c.review.rating || 0))}
                                                    <span class="text-muted small" style="margin-left:4px; font-weight:600;">(${c.review.rating || 0}/5)</span>
                                                </div>
                                                <p style="margin:0; font-size:0.9rem; color:#334155; font-style:italic;">"${escapeHtml(c.review.comment || '')}"</p>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                                <div style="flex-shrink:0;">
                                    ${actionHTML}
                                </div>
                            </div>
                        `;
                    }).join('');

                    const listContainer = document.getElementById('writeReviewsListContainer');
                    if (listContainer) {
                        listContainer.innerHTML = reviewsHTML;
                    }

                    const paginationEl = document.getElementById('writeReviewsPagination');
                    renderGenericPaginationControls(
                        paginationEl,
                        contracts.length,
                        totalPages,
                        currentPage,
                        pageSize,
                        (newSize) => {
                            pageSize = newSize;
                            currentPage = 1;
                            renderPage(1);
                        },
                        (newPage) => {
                            renderPage(newPage);
                        },
                        storageKey
                    );

                    if (window.lucide) lucide.createIcons();
                    bindEvents();
                }

                function bindEvents() {
                    panel.querySelectorAll('.btn-write-generic-review, .btn-edit-generic-review').forEach(btn => {
                        btn.addEventListener('click', function () {
                            const contractId = parseInt(this.dataset.contractId);
                            const c = contracts.find(item => item.contractId === contractId);
                            if (c) {
                                openGenericReviewModal(
                                    role,
                                    c.contractId,
                                    c.partnerName,
                                    c.review ? c.review.rating : 5,
                                    c.review ? c.review.comment : ''
                                );
                            }
                        });
                    });
                }

                renderPage(1);
            })
            .catch(err => {
                console.error(err);
                panel.innerHTML = `<div class="alert alert-danger">Không thể kết nối đến máy chủ.</div>`;
            });
    }

    function openGenericReviewModal(role, contractId, partnerName, currentRating = 5, currentComment = '') {
        document.getElementById('j4sReviewModal')?.remove();
        const partnerLabel = role === 'Student' ? 'doanh nghiệp' : 'sinh viên';
        const modalHTML = `
            <div class="modal fade" id="j4sReviewModal" tabindex="-1" aria-hidden="true" style="z-index: 1060;">
                <div class="modal-dialog modal-dialog-centered" style="max-width: 450px;">
                    <div class="modal-content" style="border-radius: 16px; border: none; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
                        <div class="modal-header border-0 pb-0" style="padding: 20px 20px 0 20px;">
                            <h5 class="modal-title fw-bold text-slate-800" id="reviewModalTitle">${currentComment ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá cho ' + partnerLabel}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-4">
                            <div class="text-center mb-3">
                                <p class="text-slate-600 font-semibold mb-1">Đối tác: <strong>${escapeHtml(partnerName)}</strong></p>
                                <div class="review-stars-input d-flex justify-content-center gap-2 my-2" style="font-size: 2rem; cursor: pointer; color: #cbd5e1;">
                                    <span data-star="1">★</span>
                                    <span data-star="2">★</span>
                                    <span data-star="3">★</span>
                                    <span data-star="4">★</span>
                                    <span data-star="5">★</span>
                                </div>
                                <input type="hidden" id="reviewRatingInput" value="${currentRating || 5}" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label text-slate-700 fw-bold small">Nhận xét của bạn (Tối thiểu 10 ký tự)</label>
                                <textarea id="reviewCommentInput" class="form-control" rows="4" style="border-radius:10px; font-size:0.9rem;" placeholder="Nhập phản hồi, thái độ làm việc, chất lượng công việc...">${escapeHtml(currentComment)}</textarea>
                            </div>
                            <div class="d-flex gap-2 justify-content-end">
                                <button type="button" class="btn btn-light rounded-pill px-4 py-2 fw-semibold text-slate-600 small" style="border: 1px solid #e2e8f0; font-size: 0.85rem;" data-bs-dismiss="modal">Hủy</button>
                                <button type="button" id="btnSubmitReview" class="btn btn-primary rounded-pill px-4 py-2 fw-bold small" style="background: #0ea5e9; border: none; font-size: 0.85rem;">Gửi đánh giá</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modalEl = document.getElementById('j4sReviewModal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();

        const stars = modalEl.querySelectorAll('.review-stars-input span');
        const ratingInput = document.getElementById('reviewRatingInput');

        function highlightStars(val) {
            stars.forEach(star => {
                const sVal = parseInt(star.dataset.star);
                if (sVal <= val) {
                    star.style.color = '#fbbf24';
                } else {
                    star.style.color = '#cbd5e1';
                }
            });
        }

        highlightStars(parseInt(ratingInput.value));

        stars.forEach(star => {
            star.addEventListener('click', () => {
                const val = parseInt(star.dataset.star);
                ratingInput.value = val;
                highlightStars(val);
            });
            star.addEventListener('mouseover', () => {
                highlightStars(parseInt(star.dataset.star));
            });
            star.addEventListener('mouseout', () => {
                highlightStars(parseInt(ratingInput.value));
            });
        });

        document.getElementById('btnSubmitReview').addEventListener('click', () => {
            const rating = parseInt(ratingInput.value);
            const comment = document.getElementById('reviewCommentInput').value.trim();

            if (isNaN(rating) || rating < 1 || rating > 5) {
                showToast('Vui lòng chọn số sao từ 1 đến 5.', 'warning');
                return;
            }

            if (!comment || comment.length < 10) {
                showToast('Nội dung nhận xét phải tối thiểu 10 ký tự.', 'warning');
                return;
            }

            const formData = new FormData();
            formData.append('contractId', contractId);
            formData.append('rating', rating);
            formData.append('comment', comment);

            fetch('/Review/SaveReview', {
                method: 'POST',
                body: formData
            })
                .then(r => r.json())
                .then(data => {
                    showToast(data.message || 'Đã gửi đánh giá thành công.', data.success ? 'success' : 'error');
                    if (data.success) {
                        modal.hide();
                        modalEl.addEventListener('hidden.bs.modal', () => {
                            modalEl.remove();
                            loadWriteReviewsTab(role);
                        }, { once: true });
                    }
                })
                .catch(err => {
                    console.error(err);
                    showToast('Có lỗi xảy ra khi lưu đánh giá.', 'error');
                });
        });
    }

    function loadReceivedReviewsTab(role) {
        const panel = document.getElementById('reviewsContentPanel');
        if (!panel) return;

        panel.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 200px; flex-direction: column; gap: 12px;">
                <div class="spinner-border text-primary" role="status" style="width: 1.5rem; height: 1.5rem;"></div>
                <span style="color:#64748b; font-size:0.9rem;">Đang tải nhận xét...</span>
            </div>
        `;

        const storageKey = 'j4s_pagesize_received_reviews';
        let pageSize = Number(localStorage.getItem(storageKey)) || 10;
        let currentPage = 1;

        fetch('/Review/GetMyReviews')
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    panel.innerHTML = `<div class="alert alert-danger">${escapeHtml(data.message || 'Lỗi khi tải dữ liệu.')}</div>`;
                    return;
                }

                const dbReviews = data.reviews || [];
                if (dbReviews.length === 0) {
                    panel.innerHTML = `
                        <div style="text-align:center; padding:40px; background:#fff; border-radius:12px; border:1px solid #e2e8f0;">
                            <div style="font-size:2.5rem; margin-bottom:12px;">💬</div>
                            <h3 style="font-size:1.1rem; font-weight:700; color:#1e293b; margin:0 0 6px 0;">Chưa nhận được đánh giá nào</h3>
                            <p style="font-size:0.9rem; color:#64748b; margin:0;">Khi đối tác gửi nhận xét cho bạn, thông tin sẽ hiển thị tại đây.</p>
                        </div>
                    `;
                    return;
                }

                panel.innerHTML = `
                    <div id="receivedReviewsListContainer" style="display:flex; flex-direction:column; gap:20px;"></div>
                    <div id="receivedReviewsPagination" style="display:flex; align-items:center; justify-content:space-between; margin-top:20px; padding-top:16px; border-top:1px solid #e2e8f0; flex-wrap:wrap; gap:12px;"></div>
                `;

                const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

                function renderPage(page) {
                    currentPage = page;
                    const totalPages = Math.ceil(dbReviews.length / pageSize);
                    if (currentPage > totalPages) {
                        currentPage = Math.max(1, totalPages);
                    }

                    const startIndex = (currentPage - 1) * pageSize;
                    const pageReviews = dbReviews.slice(startIndex, startIndex + pageSize);

                    const reviewsHTML = pageReviews.map((r, idx) => {
                        const avatarColor = colors[idx % colors.length];
                        const initials = (r.reviewer || "K").split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
                        const partnerText = role === 'Student' ? 'doanh nghiệp' : 'sinh viên';

                        const repliesHTML = (r.replies || []).map(rep => {
                            const isSelfReply = rep.reviewer === r.reviewer ? false : true;
                            const replyAvatarInitials = (rep.reviewer || "K").split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
                            return `
                                <div class="review-reply-box animate-in" style="margin-top:10px; background:${isSelfReply ? '#f0fdf4' : '#f8fafc'}; border:1px solid ${isSelfReply ? '#bbf7d0' : '#e2e8f0'}; border-radius:8px; padding:10px 12px; font-size:0.85rem;">
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                        <div style="display:flex; align-items:center; gap:6px;">
                                            <div style="width:20px; height:20px; border-radius:50%; background:#e2e8f0; font-size:9px; display:flex; align-items:center; justify-content:center; font-weight:700; color:#475569;">${replyAvatarInitials}</div>
                                            <strong style="color:${isSelfReply ? '#15803d' : '#334155'};">${escapeHtml(rep.reviewer)} ${isSelfReply ? '(Bạn)' : `(${partnerText})`}</strong>
                                        </div>
                                        <span style="font-size:0.75rem; color:#64748b;">${escapeHtml(rep.date)}</span>
                                    </div>
                                    <p style="margin:0; color:#334155; font-style:italic;">"${escapeHtml(rep.comment)}"</p>
                                </div>
                            `;
                        }).join('');

                        const ownReply = (r.replies || []).find(rep => rep.isOwnReply);
                        let replyActionHTML = '';
                        if (ownReply) {
                            if (ownReply.canEdit) {
                                replyActionHTML = `<button class="btn-generic-reply-trigger" style="border:none; background:none; padding:4px 8px; font-weight:600; color:#2563eb; font-size:0.8rem; cursor:pointer; display:flex; align-items:center; gap:4px;" data-id="${r.id}"><i data-lucide="edit-3" style="width:14px;height:14px;"></i> Chỉnh sửa phản hồi</button>`;
                            } else {
                                replyActionHTML = `<span class="text-muted small d-inline-flex align-items-center gap-1" style="font-size:0.8rem; padding:4px 8px;"><i data-lucide="lock" style="width:12px;height:12px;"></i> Phản hồi đã khóa (Quá 24h)</span>`;
                            }
                        } else {
                            replyActionHTML = `<button class="btn-generic-reply-trigger" style="border:none; background:none; padding:4px 8px; font-weight:600; color:#2563eb; font-size:0.8rem; cursor:pointer; display:flex; align-items:center; gap:4px;" data-id="${r.id}"><i data-lucide="message-square" style="width:14px;height:14px;"></i> Phản hồi</button>`;
                        }

                        return `
                            <div class="review-card ${r.isReported ? 'reported-dimmed' : ''}" style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; background:#fff; margin-bottom:0;" data-id="${r.id}">
                                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; flex-wrap:wrap; gap:12px;">
                                    <div style="display:flex; gap:12px; align-items:center;">
                                        <div style="width:40px; height:40px; border-radius:50%; overflow:hidden; background: linear-gradient(135deg, ${avatarColor}, ${avatarColor}aa); display:flex; align-items:center; justify-content:center; font-weight:700; color:#fff; flex-shrink:0;">
                                            ${r.reviewerAvatar ? `<img src="${r.reviewerAvatar}" style="width:100%; height:100%; object-fit:cover;" />` : `<span>${initials}</span>`}
                                        </div>
                                        <div>
                                            <div style="font-weight:700; color:#1e293b; font-size:0.95rem;">${escapeHtml(r.reviewer)} <span style="font-weight:400; color:#64748b; font-size:0.8rem;">(${partnerText})</span></div>
                                            <div style="font-size:0.8rem; color:#64748b; display:flex; align-items:center; gap:4px;"><i data-lucide="briefcase" style="width:12px;height:12px;"></i> ${escapeHtml(r.project)}</div>
                                        </div>
                                    </div>
                                    <div style="text-align:right;">
                                        <div style="color:#fbbf24; font-size:0.95rem; margin-bottom:2px;">
                                            ${'★'.repeat(r.rating || 0)}${'☆'.repeat(5 - (r.rating || 0))}
                                        </div>
                                        <small style="color:#64748b; font-size:0.75rem;">${escapeHtml(r.date)}</small>
                                    </div>
                                </div>
                                
                                <p style="margin:0 0 12px 0; font-size:0.9rem; color:#334155; font-style:italic; line-height:1.5;">"${escapeHtml(r.comment)}"</p>
                                
                                ${repliesHTML}
                                
                                <div style="margin-top:14px; border-top:1px dashed #e2e8f0; padding-top:12px;">
                                    <div style="display:flex; gap:8px; justify-content:space-between; align-items:center; flex-wrap:wrap;">
                                        <div style="display:flex; gap:8px;">
                                            ${r.isReported ? `
                                                <span class="report-badge pending" style="background:#fef3c7; color:#b45309; font-size:0.75rem; padding:4px 8px; border-radius:12px; display:inline-flex; align-items:center; gap:4px;"><i data-lucide="alert-triangle" style="width:12px;height:12px;"></i> Đang xem xét báo cáo không phù hợp</span>
                                            ` : `
                                                ${replyActionHTML}
                                                <button class="btn-generic-report-trigger" style="border:none; background:none; padding:4px 8px; font-weight:600; color:#94a3b8; font-size:0.8rem; cursor:pointer; display:flex; align-items:center; gap:4px;" data-id="${r.id}"><i data-lucide="flag" style="width:14px;height:14px;"></i> Báo cáo</button>
                                            `}
                                        </div>
                                    </div>
                                    
                                    <div id="replyArea-${r.id}" style="display:none; margin-top:10px;">
                                        <textarea id="replyText-${r.id}" class="form-control" rows="2" style="font-size:0.85rem; border-radius:8px;" placeholder="Nhập nội dung phản hồi (tối thiểu 10 ký tự)..."></textarea>
                                        <div style="display:flex; gap:6px; justify-content:flex-end; margin-top:6px;">
                                            <button class="btn btn-sm btn-light btn-generic-reply-cancel" style="font-size:0.75rem; border-radius:12px;" data-id="${r.id}">Hủy</button>
                                            <button class="btn btn-sm btn-primary btn-generic-reply-submit" style="font-size:0.75rem; background:#2563eb; border:none; border-radius:12px;" data-id="${r.id}">Gửi phản hồi</button>
                                        </div>
                                    </div>
                                    
                                    <div id="reportArea-${r.id}" style="display:none; margin-top:10px; background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:10px;">
                                        <div style="font-size:0.8rem; font-weight:700; color:#92400E; margin-bottom:6px;">Lý do báo cáo không phù hợp:</div>
                                        <div style="display:flex; flex-direction:column; gap:4px; font-size:0.8rem; color:#4B5563;">
                                            <label style="display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="radio" name="reportReason-${r.id}" value="Thông tin sai sự thật" checked> Đánh giá không đúng sự thật, bôi nhọ</label>
                                            <label style="display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="radio" name="reportReason-${r.id}" value="Ngôn từ thô tục"> Có ngôn từ thiếu văn hóa, công kích</label>
                                            <label style="display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="radio" name="reportReason-${r.id}" value="Spam/Quảng cáo"> Spam quảng cáo hoặc không liên quan</label>
                                        </div>
                                        <div style="display:flex; gap:6px; justify-content:flex-end; margin-top:8px;">
                                            <button class="btn btn-sm btn-light btn-generic-report-cancel" style="font-size:0.75rem; border-radius:12px;" data-id="${r.id}">Hủy</button>
                                            <button class="btn btn-sm btn-warning btn-generic-report-submit" style="font-size:0.75rem; border-radius:12px; color:#fff;" data-id="${r.id}">Báo cáo</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('');

                    const listContainer = document.getElementById('receivedReviewsListContainer');
                    if (listContainer) {
                        listContainer.innerHTML = reviewsHTML;
                    }

                    const paginationEl = document.getElementById('receivedReviewsPagination');
                    renderGenericPaginationControls(
                        paginationEl,
                        dbReviews.length,
                        totalPages,
                        currentPage,
                        pageSize,
                        (newSize) => {
                            pageSize = newSize;
                            currentPage = 1;
                            renderPage(1);
                        },
                        (newPage) => {
                            renderPage(newPage);
                        },
                        storageKey
                    );

                    if (window.lucide) lucide.createIcons();
                    bindEvents();
                }

                function bindEvents() {
                    panel.querySelectorAll('.btn-generic-reply-trigger').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const id = btn.dataset.id;
                            const reviewObj = dbReviews.find(rev => rev.id == id);
                            const ownReply = (reviewObj?.replies || []).find(rep => rep.isOwnReply);
                            const textarea = document.getElementById(`replyText-${id}`);
                            if (ownReply && textarea) {
                                textarea.value = ownReply.comment;
                            } else if (textarea) {
                                textarea.value = '';
                            }
                            document.getElementById(`replyArea-${id}`).style.display = 'block';
                            document.getElementById(`reportArea-${id}`).style.display = 'none';
                        });
                    });

                    panel.querySelectorAll('.btn-generic-reply-cancel').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const id = btn.dataset.id;
                            document.getElementById(`replyArea-${id}`).style.display = 'none';
                        });
                    });

                    panel.querySelectorAll('.btn-generic-report-trigger').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const id = btn.dataset.id;
                            document.getElementById(`reportArea-${id}`).style.display = 'block';
                            document.getElementById(`replyArea-${id}`).style.display = 'none';
                        });
                    });

                    panel.querySelectorAll('.btn-generic-report-cancel').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const id = btn.dataset.id;
                            document.getElementById(`reportArea-${id}`).style.display = 'none';
                        });
                    });

                    panel.querySelectorAll('.btn-generic-reply-submit').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const id = parseInt(btn.dataset.id);
                            const text = document.getElementById(`replyText-${id}`).value.trim();
                            if (!text || text.length < 10) {
                                showToast('Phản hồi phải tối thiểu 10 ký tự.', 'warning');
                                return;
                            }

                            const formData = new FormData();
                            formData.append('parentReviewId', id);
                            formData.append('comment', text);

                            fetch('/Review/Reply', {
                                method: 'POST',
                                body: formData
                            })
                                .then(res => res.json())
                                .then(resData => {
                                    showToast(resData.message || 'Đã gửi phản hồi thành công.', resData.success ? 'success' : 'error');
                                    if (resData.success) {
                                        loadReceivedReviewsTab(role);
                                    }
                                })
                                .catch(err => {
                                    console.error(err);
                                    showToast('Có lỗi xảy ra khi phản hồi.', 'error');
                                });
                        });
                    });

                    panel.querySelectorAll('.btn-generic-report-submit').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const id = parseInt(btn.dataset.id);
                            const reason = panel.querySelector(`input[name="reportReason-${id}"]:checked`)?.value || "Lý do khác";

                            const formData = new FormData();
                            formData.append('id', id);
                            formData.append('reason', reason);

                            fetch('/Review/Report', {
                                method: 'POST',
                                body: formData
                            })
                                .then(res => res.json())
                                .then(resData => {
                                    showToast(resData.message || 'Báo cáo thành công.', resData.success ? 'success' : 'error');
                                    if (resData.success) {
                                        loadReceivedReviewsTab(role);
                                    }
                                })
                                .catch(err => {
                                    console.error(err);
                                    showToast('Có lỗi xảy ra khi báo cáo.', 'error');
                                });
                        });
                    });
                }

                renderPage(1);
            })
            .catch(err => {
                console.error(err);
                panel.innerHTML = `<div class="alert alert-danger">Không thể kết nối đến máy chủ.</div>`;
            });
    }

    window.loadMainChatMessages = loadMainChatMessages;
    window.openReviewModal = openReviewModal;
    window.renderBusinessReviewsView = renderBusinessReviewsView;
    window.formatCurrencyInput = formatCurrencyInput;
    window.setupCurrencyInput = setupCurrencyInput;
    window.renderGenericPaginationControls = renderGenericPaginationControls;
})();

