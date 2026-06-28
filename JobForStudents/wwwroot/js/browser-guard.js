(function () {
    'use strict';

    const blockMessage = 'This feature has been disabled on J4S.';
    const devtoolsMessage = 'Please close Developer Tools to continue using J4S.';
    // const blockPath = '/BlockDevTool';
    const devtoolsWidthThreshold = 260;
    const devtoolsHeightThreshold = 320;
    const emulationWidthThreshold = 520;
    const publicSafePaths = ['/auth/login', '/auth/register', '/auth/forgotpassword', '/auth/accessdenied'];
    let overlayEl = null;
    let lastToastAt = 0;

    function isBlockPage() {
        return window.location.pathname.toLowerCase() === blockPath.toLowerCase();
    }

    function normalizeLocalPath(value) {
        try {
            const url = new URL(value || '/', window.location.origin);
            if (url.origin !== window.location.origin) return '/';
            return `${url.pathname}${url.search}${url.hash}`;
        } catch {
            return '/';
        }
    }

    function isPublicSafePath(path) {
        const pathname = normalizeLocalPath(path).split('?')[0].split('#')[0].toLowerCase();
        return publicSafePaths.some(publicPath => pathname === publicPath || pathname.startsWith(`${publicPath}/`));
    }

    function isMobileLikeUserAgent() {
        return /android|iphone|ipad|ipod|iemobile|mobile/i.test(navigator.userAgent || '');
    }

    function shouldGuardCurrentPage() {
        return !isBlockPage() && !isPublicSafePath(window.location.pathname);
    }

    function notify(message) {
        const now = Date.now();
        if (now - lastToastAt < 1800) return;
        lastToastAt = now;

        if (typeof window.showToast === 'function') {
            window.showToast(message, 'warning');
            return;
        }

        console.warn(message);
    }

    function ensureOverlay() {
        if (overlayEl) return overlayEl;

        overlayEl = document.createElement('div');
        overlayEl.className = 'browser-guard-overlay';
        overlayEl.setAttribute('role', 'alert');
        overlayEl.setAttribute('aria-live', 'assertive');
        overlayEl.innerHTML = `
            <div class="browser-guard-panel">
                <div class="browser-guard-icon">J4S</div>
                <h2>Đã tạm dừng</h2>
                <p>${devtoolsMessage}</p>
            </div>
        `;
        document.body.appendChild(overlayEl);
        return overlayEl;
    }

    function setBlocked(isBlocked) {
        if (!shouldGuardCurrentPage() && !isBlockPage()) {
            isBlocked = false;
        }

        if (isBlocked && !isBlockPage()) {
            document.documentElement.classList.add('browser-guard-active');
            ensureOverlay().classList.add('show');
            notify(devtoolsMessage);
            return;
        }

        if (isBlockPage()) {
            document.documentElement.classList.remove('browser-guard-active');
            ensureOverlay().classList.remove('show');
            return;
        }

        document.documentElement.classList.toggle('browser-guard-active', isBlocked);
        ensureOverlay().classList.toggle('show', isBlocked);
    }

    function isDevtoolsLikelyOpen() {
        const widthGap = Math.abs(window.outerWidth - window.innerWidth);
        const heightGap = Math.abs(window.outerHeight - window.innerHeight);
        const visualWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
        const screenGap = Math.abs(window.screen.width - window.innerWidth);
        const looksLikeDeviceToolbar = window.innerWidth <= emulationWidthThreshold && screenGap > devtoolsWidthThreshold;
        const looksLikeDesktopDeviceEmulation = !isMobileLikeUserAgent() &&
            Math.min(window.innerWidth, visualWidth) <= emulationWidthThreshold &&
            window.screen.width > 900;

        return widthGap > devtoolsWidthThreshold ||
            heightGap > devtoolsHeightThreshold ||
            looksLikeDeviceToolbar ||
            looksLikeDesktopDeviceEmulation ||
            (visualWidth <= emulationWidthThreshold && widthGap > 80);
    }

    function checkDevtools() {
        if (isBlockPage()) {
            setBlocked(false);
            return;
        }

        setBlocked(isDevtoolsLikelyOpen());
    }

    function scheduleDevtoolsCheck() {
        window.setTimeout(checkDevtools, 80);
        window.setTimeout(checkDevtools, 350);
    }

    function bindBlockRetry() {
        const retryButton = document.getElementById('btnRetryAfterDevToolBlock');
        if (!retryButton) return;

        const returnWhenSafe = function () {
            const returnUrl = normalizeLocalPath(retryButton.getAttribute('data-return-url') || '/');

            if (isPublicSafePath(returnUrl)) {
                window.location.replace(returnUrl);
                return;
            }

            if (isDevtoolsLikelyOpen()) {
                notify('Please close Developer Tools before continuing.');
                retryButton.classList.add('shake');
                window.setTimeout(function () {
                    retryButton.classList.remove('shake');
                }, 400);
                return;
            }

            window.location.replace(returnUrl);
        };

        retryButton.addEventListener('click', returnWhenSafe);
        window.setInterval(function () {
            if (!isDevtoolsLikelyOpen()) {
                returnWhenSafe();
            }
        }, 900);
        window.addEventListener('resize', function () {
            window.setTimeout(returnWhenSafe, 150);
        });
        window.addEventListener('focus', function () {
            window.setTimeout(returnWhenSafe, 150);
        });
    }

    function blockEvent(event) {
        event.preventDefault();
        event.stopPropagation();
        notify(blockMessage);
        return false;
    }

    function isBlockedShortcut(event) {
        const key = (event.key || '').toLowerCase();
        const ctrlOrMeta = event.ctrlKey || event.metaKey;

        return event.key === 'F12' ||
            (ctrlOrMeta && event.shiftKey && ['i', 'j', 'c'].includes(key)) ||
            (ctrlOrMeta && ['u', 's', 'p'].includes(key));
    }

    document.addEventListener('contextmenu', blockEvent, true);
    document.addEventListener('dragstart', blockEvent, true);
    document.addEventListener('keydown', function (event) {
        if (isBlockedShortcut(event)) {
            blockEvent(event);
        }
    }, true);

    document.addEventListener('DOMContentLoaded', function () {
        ensureOverlay();
        bindBlockRetry();
        checkDevtools();
        window.addEventListener('resize', scheduleDevtoolsCheck);
        window.addEventListener('focus', scheduleDevtoolsCheck);
        window.addEventListener('pageshow', scheduleDevtoolsCheck);
        document.addEventListener('visibilitychange', scheduleDevtoolsCheck);

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', scheduleDevtoolsCheck);
        }

        window.setInterval(checkDevtools, 1000);
    });
})();
