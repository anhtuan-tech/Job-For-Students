document.addEventListener('DOMContentLoaded', () => {
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationBadge = document.getElementById('notificationBadge');
    const notificationList = document.getElementById('notificationList');
    const btnMarkAllRead = document.getElementById('btnMarkAllRead');

    if (!notificationBtn) return;

    function fetchNotifications() {
        fetch('/Notification/GetMyNotifications')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateNotificationUI(data.notifications, data.unreadCount);
                }
            })
            .catch(error => console.error('Error fetching notifications:', error));
    }

    function updateNotificationUI(notifications, unreadCount) {
        if (unreadCount > 0) {
            notificationBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            notificationBadge.style.display = 'flex';
        } else {
            notificationBadge.style.display = 'none';
        }

        if (notifications.length === 0) {
            notificationList.innerHTML = `
                <div class="text-center p-4 text-muted" style="font-size: 0.85rem;">
                    <i data-lucide="bell-off" style="width: 24px; height: 24px; margin-bottom: 8px; color: #cbd5e1;"></i>
                    <br/>Không có thông báo mới
                </div>`;
            lucide.createIcons();
            return;
        }

        notificationList.innerHTML = '';
        notifications.forEach(n => {
            const isUnread = !n.isRead;
            const bgClass = isUnread ? 'background-color: #f0f9ff;' : '';
            const fwClass = isUnread ? 'font-weight: 600;' : 'font-weight: 400; color: #475569;';
            const dot = isUnread ? '<div style="width:8px;height:8px;background-color:#0ea5e9;border-radius:50%;margin-right:12px;flex-shrink:0;"></div>' : '<div style="width:8px;height:8px;margin-right:12px;flex-shrink:0;"></div>';

            const itemHTML = `
                <a href="#" class="notification-item" data-id="${n.id}" style="display:flex; padding: 12px 16px; border-bottom: 1px solid #f1f5f9; text-decoration: none; color: #1e293b; align-items: center; transition: background-color 0.2s; ${bgClass}">
                    ${dot}
                    <div style="flex-grow:1;">
                        <div style="font-size: 0.85rem; ${fwClass} margin-bottom: 4px;">${n.title}</div>
                        <div style="font-size: 0.8rem; color: #64748b; line-height: 1.4;">${n.message}</div>
                        <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 4px;">${n.timeAgo}</div>
                    </div>
                </a>
            `;
            notificationList.insertAdjacentHTML('beforeend', itemHTML);
        });

        // Add click listeners to mark individual as read
        document.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const id = item.getAttribute('data-id');
                fetch(`/Notification/MarkAsRead?id=${id}`, { method: 'POST' })
                    .then(() => fetchNotifications());
            });
        });

        lucide.createIcons();
    }

    if (btnMarkAllRead) {
        btnMarkAllRead.addEventListener('click', (e) => {
            e.preventDefault();
            fetch('/Notification/MarkAllAsRead', { method: 'POST' })
                .then(() => fetchNotifications());
        });
    }

    // Initial fetch
    fetchNotifications();

    // Poll every 30 seconds
    setInterval(fetchNotifications, 30000);
});
