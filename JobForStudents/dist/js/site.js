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

    // --- DOM References ---
    const jobFeedContainer = document.getElementById('jobFeedContainer');
    const searchInput = document.getElementById('searchInput');
    const categoryCards = document.querySelectorAll('.category-card[data-category]');
    const sidebarItems = document.querySelectorAll('.sidebar-item[data-nav]');
    const filterCategorySelect = document.getElementById('filterCategory');
    const mainContent = document.getElementById('mainContent');

    // ============================================
    // MOCK DATA — All Sections
    // ============================================

    const mockProjects = [
        { id: 'proj-001', title: 'Thiết kế poster sự kiện TEDx', client: 'CLB TEDx HCMUE', deadline: '30/05/2026', progress: 75, budget: 200000, status: 'Đang thực hiện' },
        { id: 'proj-002', title: 'Dịch tài liệu nghiên cứu', client: 'TS. Nguyễn Văn A', deadline: '02/06/2026', progress: 40, budget: 350000, status: 'Đang thực hiện' },
        { id: 'proj-003', title: 'Làm slide báo cáo tốt nghiệp', client: 'Trần Minh Khôi', deadline: '28/05/2026', progress: 90, budget: 150000, status: 'Sắp hoàn thành' }
    ];

    const mockMessages = [
        { id: 'msg-001', name: 'Trần Minh Khôi', avatar: 'TK', color: '#6366F1', lastMsg: 'Bạn làm slide rất đẹp! Mình muốn chỉnh thêm trang 5...', time: '5 phút trước', unread: 2 },
        { id: 'msg-002', name: 'Nguyễn Thu Hà', avatar: 'TH', color: '#EC4899', lastMsg: 'Cảm ơn bạn, mình đã nhận được file rồi 👍', time: '1 giờ trước', unread: 0 },
        { id: 'msg-003', name: 'Lê Anh Tuấn', avatar: '', avatarImg: '/images/tuan_avatar.jpg', lastMsg: 'Dự án design mới, bạn có hứng thú không?', time: '3 giờ trước', unread: 1 },
        { id: 'msg-004', name: 'Phạm Đức Huy', avatar: 'PH', color: '#F59E0B', lastMsg: 'Code review xong rồi, bạn check lại nhé!', time: 'Hôm qua', unread: 0 },
        { id: 'msg-005', name: 'Admin J4S', avatar: 'J4', color: '#4F46E5', lastMsg: 'Chúc mừng bạn đã hoàn thành 10 dự án! 🎉', time: '2 ngày trước', unread: 0 }
    ];

    const mockReviews = [
        { id: 'rev-001', reviewer: 'Trần Minh Khôi', project: 'Làm slide báo cáo Marketing', rating: 5, comment: 'Rất chuyên nghiệp, giao đúng hạn! Slide đẹp, nội dung trình bày rõ ràng. Sẽ thuê lại lần sau.', date: '25/05/2026' },
        { id: 'rev-002', reviewer: 'Nguyễn Hồng Phúc', project: 'Thiết kế poster sự kiện', rating: 5, comment: 'Poster quá đẹp luôn! Sáng tạo, màu sắc hài hòa. Team mình rất hài lòng.', date: '20/05/2026' },
        { id: 'rev-003', reviewer: 'Lê Thị Mai', project: 'Dịch tài liệu Anh-Việt', rating: 4, comment: 'Dịch chính xác, thuật ngữ chuyên ngành ok. Chỉ cần chỉnh lại vài chỗ nhỏ.', date: '15/05/2026' },
        { id: 'rev-004', reviewer: 'Phạm Văn Đức', project: 'Code landing page startup', rating: 5, comment: 'Code sạch, responsive hoàn hảo! Giao tiếp tốt, nhiệt tình hỗ trợ chỉnh sửa.', date: '10/05/2026' },
        { id: 'rev-005', reviewer: 'Hà Thanh Tùng', project: 'Viết content blog AI', rating: 4, comment: 'Bài viết chất lượng, SEO tốt. Mong bạn viết thêm nhiều bài nữa!', date: '05/05/2026' }
    ];

    const mockWalletTransactions = [
        { date: '27/05/2026', desc: 'Nhận tiền – Thiết kế poster sự kiện', amount: '+200.000 đ', type: 'income' },
        { date: '25/05/2026', desc: 'Nhận tiền – Dịch tài liệu Anh-Việt', amount: '+350.000 đ', type: 'income' },
        { date: '23/05/2026', desc: 'Rút tiền về Vietcombank', amount: '-1.000.000 đ', type: 'expense' },
        { date: '20/05/2026', desc: 'Nhận tiền – Làm slide thuyết trình', amount: '+120.000 đ', type: 'income' },
        { date: '18/05/2026', desc: 'Nạp tiền từ Momo', amount: '+500.000 đ', type: 'deposit' },
        { date: '15/05/2026', desc: 'Nhận tiền – Code landing page', amount: '+500.000 đ', type: 'income' },
        { date: '12/05/2026', desc: 'Phí dịch vụ J4S (5%)', amount: '-58.500 đ', type: 'expense' },
        { date: '10/05/2026', desc: 'Nhận tiền – Viết blog AI', amount: '+300.000 đ', type: 'income' }
    ];

    const mockFeaturedFreelancers = [
        { name: 'Lê Anh Tuấn', skill: 'Thiết kế đồ họa / UX-UI', rating: 5.0, reviews: 32, avatar: '/images/tuan_avatar.jpg', completedJobs: 45, badge: '🥇 Top 1' },
        { name: 'Nguyễn Thu Hà', skill: 'Làm slide chuyên nghiệp', rating: 4.9, reviews: 27, avatar: '', initials: 'TH', color: '#EC4899', completedJobs: 38, badge: '🥈 Top 2' },
        { name: 'Lê Minh Anh', skill: 'Dịch thuật EN-VI', rating: 5.0, reviews: 18, avatar: '', initials: 'MA', color: '#14B8A6', completedJobs: 30, badge: '🥉 Top 3' },
        { name: 'Phạm Đức Huy', skill: 'Lập trình Web Full-stack', rating: 4.8, reviews: 24, avatar: '', initials: 'PH', color: '#F59E0B', completedJobs: 35, badge: '⭐ Top 4' },
        { name: 'Trần Khánh Vy', skill: 'Video Editor & Motion', rating: 4.7, reviews: 15, avatar: '', initials: 'KV', color: '#EF4444', completedJobs: 22, badge: '⭐ Top 5' },
        { name: 'Hoàng Minh Tú', skill: 'Viết content & Copywriting', rating: 4.8, reviews: 20, avatar: '', initials: 'MT', color: '#8B5CF6', completedJobs: 28, badge: '⭐ Top 6' }
    ];

    const mockLeaderboard = [
        { rank: 1, name: 'Lê Anh Tuấn', score: 985, jobs: 45, rating: 5.0, avatar: '/images/tuan_avatar.jpg', trend: '↑' },
        { rank: 2, name: 'Nguyễn Thu Hà', score: 920, jobs: 38, rating: 4.9, trend: '↑' },
        { rank: 3, name: 'Phạm Đức Huy', score: 875, jobs: 35, rating: 4.8, trend: '→' },
        { rank: 4, name: 'Lê Minh Anh', score: 860, jobs: 30, rating: 5.0, trend: '↑' },
        { rank: 5, name: 'Hoàng Minh Tú', score: 810, jobs: 28, rating: 4.8, trend: '↓' },
        { rank: 6, name: 'Trần Khánh Vy', score: 780, jobs: 22, rating: 4.7, trend: '↑' },
        { rank: 7, name: 'Mai Linh', score: 750, jobs: 12, rating: 4.6, trend: '↑', isCurrentUser: true },
        { rank: 8, name: 'Nguyễn Văn Bình', score: 720, jobs: 18, rating: 4.5, trend: '→' },
        { rank: 9, name: 'Trương Thị Cẩm', score: 695, jobs: 15, rating: 4.7, trend: '↓' },
        { rank: 10, name: 'Đỗ Quang Minh', score: 670, jobs: 14, rating: 4.4, trend: '→' }
    ];

    const mockBlogPosts = [
        { id: 'blog-001', title: 'Hướng dẫn tạo hồ sơ freelancer ấn tượng', category: 'Hướng dẫn', excerpt: 'Bí quyết xây dựng profile thu hút khách hàng trên J4S, từ avatar đến portfolio...', date: '26/05/2026', readTime: '5 phút', views: 1250 },
        { id: 'blog-002', title: '5 Mẹo đàm phán giá với khách hàng', category: 'Tips & Tricks', excerpt: 'Làm sao để báo giá hợp lý, không quá cao cũng không quá thấp? Đọc ngay!', date: '24/05/2026', readTime: '4 phút', views: 890 },
        { id: 'blog-003', title: 'Xu hướng thiết kế 2026: AI-Powered Design', category: 'Xu hướng', excerpt: 'Từ Midjourney đến Figma AI, làm sao sinh viên có thể tận dụng?', date: '22/05/2026', readTime: '7 phút', views: 2100 },
        { id: 'blog-004', title: 'Cách quản lý thời gian khi vừa học vừa freelance', category: 'Kỹ năng', excerpt: 'Chia sẻ từ top freelancer J4S về cách cân bằng học tập và kiếm tiền.', date: '20/05/2026', readTime: '6 phút', views: 1560 },
        { id: 'blog-005', title: 'Escrow là gì? Tại sao J4S bảo vệ bạn?', category: 'J4S Guide', excerpt: 'Tìm hiểu cơ chế thanh toán trung gian giúp freelancer yên tâm làm việc.', date: '18/05/2026', readTime: '3 phút', views: 3200 }
    ];

    const mockNotifications = [
        { id: 'noti-001', icon: '💼', title: 'Việc mới phù hợp với bạn', desc: 'Thiết kế banner cho shop online – 180.000 đ', time: '10 phút trước', unread: true },
        { id: 'noti-002', icon: '✅', title: 'Đã được chấp nhận!', desc: 'Bạn được chọn cho dự án "Dịch tài liệu Marketing"', time: '2 giờ trước', unread: true },
        { id: 'noti-003', icon: '💰', title: 'Nhận thanh toán', desc: 'Bạn đã nhận 200.000 đ từ dự án poster workshop', time: '1 ngày trước', unread: true },
        { id: 'noti-004', icon: '⭐', title: 'Đánh giá mới', desc: 'Trần Minh Khôi đã đánh giá bạn 5 sao!', time: '2 ngày trước', unread: false },
        { id: 'noti-005', icon: '🎉', title: 'Thành tựu mới', desc: 'Chúc mừng! Bạn đã hoàn thành 10 dự án.', time: '3 ngày trước', unread: false }
    ];

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
            <div class="profile-container">
                <div class="profile-cover">
                    <div class="profile-cover-gradient"></div>
                </div>
                <div class="profile-main">
                    <div class="profile-avatar-section">
                        <div class="profile-avatar-large">
                            <span>ML</span>
                        </div>
                        <div class="profile-name-section">
                            <h1>Mai Linh</h1>
                            <p class="profile-tagline">Freelancer đa năng | Thiết kế & Dịch thuật</p>
                            <div class="profile-badges">
                                <span class="badge badge-verified"><i data-lucide="check-circle" style="width:12px;height:12px;"></i> Đã xác minh</span>
                                <span class="badge badge-level">Level 3</span>
                                <span class="badge badge-rating">★ 4.6 (12 đánh giá)</span>
                            </div>
                        </div>
                        <button class="btn-edit-profile" id="btnEditProfile"><i data-lucide="edit-3" style="width:14px;height:14px;"></i> Chỉnh sửa</button>
                    </div>

                    <div class="profile-stats-grid">
                        <div class="stat-card"><div class="stat-value">12</div><div class="stat-label">Dự án hoàn thành</div></div>
                        <div class="stat-card"><div class="stat-value">4.6 ★</div><div class="stat-label">Đánh giá TB</div></div>
                        <div class="stat-card"><div class="stat-value">95%</div><div class="stat-label">Tỷ lệ đúng hạn</div></div>
                        <div class="stat-card"><div class="stat-value">2.45M đ</div><div class="stat-label">Tổng thu nhập</div></div>
                    </div>

                    <div class="profile-sections">
                        <div class="profile-section">
                            <h3>Giới thiệu</h3>
                            <p>Sinh viên năm 3 ngành Thiết kế Đồ họa tại ĐH FPT HCM. Đam mê sáng tạo, chuyên thiết kế poster, slide thuyết trình và dịch thuật Anh-Việt. Luôn giao bài đúng hạn và sẵn sàng chỉnh sửa theo yêu cầu.</p>
                        </div>
                        <div class="profile-section">
                            <h3>Kỹ năng</h3>
                            <div class="skills-list">
                                <span class="skill-tag">Photoshop</span>
                                <span class="skill-tag">Illustrator</span>
                                <span class="skill-tag">Figma</span>
                                <span class="skill-tag">PowerPoint</span>
                                <span class="skill-tag">Canva</span>
                                <span class="skill-tag">Dịch thuật EN-VI</span>
                                <span class="skill-tag">Viết content</span>
                                <span class="skill-tag">HTML/CSS</span>
                            </div>
                        </div>
                        <div class="profile-section">
                            <h3>Portfolio</h3>
                            <div class="portfolio-grid">
                                <div class="portfolio-item" style="background:linear-gradient(135deg,#6366F1,#8B5CF6)"><span>🎨 Poster TEDx</span></div>
                                <div class="portfolio-item" style="background:linear-gradient(135deg,#EC4899,#F472B6)"><span>📊 Slide Marketing</span></div>
                                <div class="portfolio-item" style="background:linear-gradient(135deg,#14B8A6,#2DD4BF)"><span>🌐 Landing Page</span></div>
                                <div class="portfolio-item" style="background:linear-gradient(135deg,#F59E0B,#FBBF24)"><span>📝 Content Blog</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        if (window.lucide) lucide.createIcons();
        document.getElementById('btnEditProfile')?.addEventListener('click', () => {
            showToast('✏️ Chế độ chỉnh sửa hồ sơ đã mở!', 'info');
        });
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
                    ${[5,4,3,2,1].map(star => {
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
                            ${freelancer.avatar ? `<img src="${freelancer.avatar}" alt="" />` : (freelancer.initials || freelancer.name.split(' ').map(w=>w[0]).join('').slice(0,2))}
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
                        case 'logout': showToast('👋 Đã đăng xuất thành công!', 'success'); break;
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
