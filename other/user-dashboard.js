function t(key, fallback) {
    if (window.LangHelper && window.LangHelper.t) {
        return window.LangHelper.t(key, fallback);
    }
    return fallback != null ? fallback : key;
}
function getLang() {
    return (window.LangHelper && window.LangHelper.getLang) ? window.LangHelper.getLang() : 'zh';
}
function applyLang() {
    if (window.LangHelper && window.LangHelper.apply) {
        window.LangHelper.apply();
    }
    if (typeof refreshDynamicText === 'function') {
        try { refreshDynamicText(); } catch (e) {}
    }
}
window.__udLangChanged = applyLang;

(function setupMobileTabbar() {
    'use strict';
    function isMobile() { return window.innerWidth <= 768; }
    var TABBAR_GROUPS = [
        { key: 'home', icon: '🏠', label: '主页', special: 'home' },
        { key: 'works', icon: '🐺', label: '作品', tabs: ['publicWorks', 'excellentWorks', 'myWorks', 'favWorks'] },
        { key: 'msg', icon: '📬', label: '消息', tabs: ['announce', 'wall'] },
        { key: 'points', icon: '💎', label: '积分', tabs: ['shop', 'checkin'] },
        { key: 'me', icon: '👤', label: '我的', tabs: ['achievements', 'friends', 'theme', 'feedback'] }
    ];
    var tabbarEl = null;
    var submenuEl = null;
    var activeGroupKey = null;

    function build() {
        if (tabbarEl) return;
        tabbarEl = document.createElement('nav');
        tabbarEl.id = 'mobileTabbar';
        tabbarEl.className = 'mobile-tabbar';
        TABBAR_GROUPS.forEach(function (g) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'mobile-tabbar-btn';
            btn.setAttribute('data-group', g.key);
            btn.innerHTML = '<span class="tabbar-icon">' + g.icon + '</span><span class="tabbar-label">' + g.label + '</span>';
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                if (g.special === 'home') {
                    var homeNav = document.getElementById('homeNavItem');
                    if (homeNav) homeNav.click();
                    closeSubmenu();
                    setActiveGroup('home');
                    return;
                }
                toggleGroup(g.key);
            });
            tabbarEl.appendChild(btn);
        });
        submenuEl = document.createElement('div');
        submenuEl.id = 'mobileSubmenu';
        submenuEl.className = 'mobile-submenu';
        document.body.appendChild(tabbarEl);
        document.body.appendChild(submenuEl);
        document.body.classList.add('has-mobile-tabbar');
    }
    function destroy() {
        if (tabbarEl && tabbarEl.parentNode) tabbarEl.parentNode.removeChild(tabbarEl);
        if (submenuEl && submenuEl.parentNode) submenuEl.parentNode.removeChild(submenuEl);
        tabbarEl = null;
        submenuEl = null;
        activeGroupKey = null;
        document.body.classList.remove('has-mobile-tabbar');
    }
    function setActiveGroup(key) {
        if (!tabbarEl) return;
        tabbarEl.querySelectorAll('.mobile-tabbar-btn').forEach(function (b) {
            b.classList.toggle('active', b.getAttribute('data-group') === key);
        });
    }
    function toggleGroup(key) {
        if (activeGroupKey === key) { closeSubmenu(); return; }
        activeGroupKey = key;
        setActiveGroup(key);
        var group = TABBAR_GROUPS.filter(function (g) { return g.key === key; })[0];
        if (!group || !group.tabs) return;
        var nav = document.querySelector('.nav-menu');
        var html = '';
        group.tabs.forEach(function (tabName) {
            var original = nav ? nav.querySelector('[data-tab="' + tabName + '"]') : null;
            var textEl = original ? original.querySelector('.nav-text') : null;
            var text = textEl ? textEl.textContent.trim() : (original ? original.textContent.trim() : tabName);
            html += '<button type="button" class="mobile-submenu-btn" data-tab="' + tabName + '">' + text + '</button>';
        });
        submenuEl.innerHTML = html;
        submenuEl.classList.add('show');
        submenuEl.querySelectorAll('.mobile-submenu-btn').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var tab = this.getAttribute('data-tab');
                if (typeof switchTab === 'function') switchTab(tab);
                closeSubmenu();
            });
        });
    }
    function closeSubmenu() {
        activeGroupKey = null;
        if (submenuEl) submenuEl.classList.remove('show');
    }
    function syncActiveTab(tabName) {
        if (!tabbarEl) return;
        var group = TABBAR_GROUPS.filter(function (g) { return g.tabs && g.tabs.indexOf(tabName) !== -1; })[0];
        if (group) { setActiveGroup(group.key); } else if (tabName === 'home') { setActiveGroup('home'); }
    }
    window.syncMobileTabbar = syncActiveTab;
    function start() {
        if (isMobile()) build();
        var timer = null;
        var lastMode = isMobile();
        window.addEventListener('resize', function () {
            clearTimeout(timer);
            timer = setTimeout(function () {
                var now = isMobile();
                if (now !== lastMode) { lastMode = now; if (now) build(); else destroy(); }
            }, 150);
        });
        document.addEventListener('click', function (e) {
            if (!e.target.closest('.mobile-tabbar') && !e.target.closest('.mobile-submenu')) { closeSubmenu(); }
        });
    }
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', start); } else { start(); }
})();

var SUPABASE_URL = 'https://syxawclhvreyxltynpnj.supabase.co';
var SUPABASE_KEY = 'sb_publishable_EvEBa8dU22MpK6E7UsnWbQ_2JRdVeZQ';
var supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.SUPABASE_URL = SUPABASE_URL;

var DEFAULT_AVATAR = 'image/default-avatar.png';
var currentUser = null;
var myProfile = null;

var userEmailEl    = document.getElementById('userEmail');
var logoutBtn      = document.getElementById('logoutBtn');
var avatarInput    = document.getElementById('avatarInput');
var avatarImg      = document.getElementById('avatarImg');
var welcomeAvatar  = document.getElementById('welcomeAvatar');
var welcomeTitle   = document.getElementById('welcomeTitle');
var infoEmail      = document.getElementById('infoEmail');
var infoName       = document.getElementById('infoName');
var infoPhone      = document.getElementById('infoPhone');
var infoCreated    = document.getElementById('infoCreated');

supabaseClient.auth.getSession().then(function (res) {
    var session = res.data && res.data.session;
    if (!session) { location.href = 'index.html'; return; }
    bootUser(session.user);
});
supabaseClient.auth.onAuthStateChange(function (event, session) {
    if (event === 'SIGNED_OUT' || !session) location.href = 'index.html';
});

function bootUser(user) {
    currentUser = user;
    var role = user.app_metadata && user.app_metadata.role;
    if (role === 'admin') {
        var navMenu = document.querySelector('.nav-menu');
        if (navMenu && !document.getElementById('adminEntry')) {
            var entry = document.createElement('div');
            entry.id = 'adminEntry';
            entry.className = 'nav-item';
            entry.innerHTML = '<span class="nav-text">' + t('userDash.navAdmin', '🔧 进入管理后台') + '</span>';
            entry.addEventListener('click', function () { location.href = 'admin-dashboard.html'; });
            var mainRow = navMenu.querySelector('.nav-main-row') || navMenu;
            mainRow.appendChild(entry);
        }
        var roleBadge = document.querySelector('.user-name-row .role');
        if (roleBadge) roleBadge.textContent = t('common.admin', '管理员');
    }
    userEmailEl.textContent = (user.user_metadata && user.user_metadata.full_name) || user.email || '未知';
    var avatarUrl = (user.user_metadata && user.user_metadata.avatar_url) ? user.user_metadata.avatar_url : DEFAULT_AVATAR;
    avatarImg.src = avatarUrl;
    welcomeAvatar.src = avatarUrl;

    supabaseClient.from('profiles').select('*').eq('id', user.id).maybeSingle()
        .then(function (profileRes) {
            myProfile = profileRes.data || {};
            var profile = myProfile;

            userEmailEl.textContent = profile.full_name || user.email || '未知';
            welcomeTitle.textContent = profile.full_name ? t('userDash.homeWelcomeName', '欢迎回来，') + profile.full_name : t('userDash.homeWelcome', '欢迎回来');
            infoEmail.textContent = user.email || '—';
            infoName.textContent  = profile.full_name || t('userDash.homeNotSet', '未设置');
            infoPhone.textContent = profile.phone || t('userDash.homeNotSet', '未设置');
            infoCreated.textContent = profile.created_at ? new Date(profile.created_at).toLocaleString('zh-CN', { hour12: false }) : '—';

            var userBio = profile.bio || '';
            document.getElementById('infoUid').textContent = profile.uid || t('userDash.homeUidUnassigned', '未分配');
            document.getElementById('infoBio').textContent = userBio || t('userDash.homeNoBio', '暂无简介');
            document.getElementById('welcomeBio').textContent = userBio || t('userDash.homeBioDefault', '这里是你的个人主页');

            document.getElementById('editBioBtn').addEventListener('click', function () {
                document.getElementById('bioInput').value = userBio;
                document.getElementById('bioModal').style.display = 'flex';
            });
            document.getElementById('bioCancelBtn').addEventListener('click', function () {
                document.getElementById('bioModal').style.display = 'none';
            });
            document.getElementById('bioSaveBtn').addEventListener('click', function () {
                var newBio = document.getElementById('bioInput').value.trim();
                if (newBio.length > 50) { alert(t('userDash.homeBioTooLong', '个人简介不能超过50个字')); return; }
                supabaseClient.from('profiles').update({ bio: newBio }).eq('id', user.id).then(function (res) {
                    if (res.error) { alert(t('common.fail', '操作失败') + '：' + res.error.message); return; }
                    userBio = newBio;
                    document.getElementById('infoBio').textContent = newBio || t('userDash.homeNoBio', '暂无简介');
                    document.getElementById('welcomeBio').textContent = newBio || t('userDash.homeBioDefault', '这里是你的个人主页');
                    document.getElementById('bioModal').style.display = 'none';
                    alert(t('userDash.homeBioUpdated', '个人简介已更新！'));
                });
            });

            document.getElementById('editNameBtn').addEventListener('click', function () {
                document.getElementById('nameInput').value = profile.full_name || '';
                document.getElementById('nameModal').style.display = 'flex';
                setTimeout(function () {
                    document.getElementById('nameInput').focus();
                    document.getElementById('nameInput').select();
                }, 50);
            });
            document.getElementById('nameCancelBtn').addEventListener('click', function () {
                document.getElementById('nameModal').style.display = 'none';
            });
            document.getElementById('nameModal').addEventListener('click', function (e) {
                if (e.target === this) this.style.display = 'none';
            });
            document.getElementById('nameSaveBtn').addEventListener('click', function () {
                var newName = document.getElementById('nameInput').value.trim();
                if (newName.length < 2) { alert(t('userDash.homeNameTooShort', '昵称至少 2 个字')); return; }
                if (newName.length > 20) { alert(t('userDash.homeNameTooLong', '昵称最多 20 个字')); return; }
                var btn = this;
                btn.disabled = true;
                btn.textContent = t('common.loading', '加载中...');
                supabaseClient.from('profiles').update({ full_name: newName }).eq('id', user.id)
                    .then(function (res) {
                        if (res.error) throw new Error(res.error.message);
                        return supabaseClient.auth.updateUser({ data: { full_name: newName } });
                    })
                    .then(function () {
                        btn.disabled = false;
                        btn.textContent = t('common.save', '保存');
                        profile.full_name = newName;
                        document.getElementById('infoName').textContent = newName;
                        document.getElementById('welcomeTitle').textContent = t('userDash.homeWelcomeName', '欢迎回来，') + newName;
                        userEmailEl.textContent = newName;
                        document.getElementById('nameModal').style.display = 'none';
                        alert(t('userDash.homeNameUpdated', '昵称已更新！'));
                    })
                    .catch(function (err) {
                        btn.disabled = false;
                        btn.textContent = t('common.save', '保存');
                        alert(t('common.fail', '操作失败') + '：' + ((err && err.message) || err));
                    });
            });

            document.getElementById('myPoints').textContent = profile.points || 0;
            document.getElementById('myStreak').textContent = profile.checkin_streak || 0;

            var todayStr = toDateStr(shanghaiNow());
            supabaseClient.from('checkins').select('points').eq('user_id', user.id).eq('checkin_date', todayStr).maybeSingle()
                .then(function (ckRes) {
                    if (ckRes.data) {
                        var btn = document.getElementById('checkinBtn');
                        btn.textContent = t('userDash.checkinDone', '✓ 今日已签到');
                        btn.disabled = true;
                        document.getElementById('todayReward').textContent = '+' + (ckRes.data.points || 0);
                    }
                });
            loadCheckinCalendar();
            loadMyRank(user.id);
            loadMyPointLogs();
        });
}

var profilePanel = document.getElementById('profilePanel');
var profileArrow = document.getElementById('profileArrow');
document.getElementById('homeNavItem').addEventListener('click', function () {
    switchTab('home');
    profilePanel.classList.toggle('open');
    profileArrow.classList.toggle('open', profilePanel.classList.contains('open'));
});

document.querySelectorAll('.nav-group').forEach(function (group) {
    group.addEventListener('click', function () {
        var key = this.getAttribute('data-group');
        var sub = document.querySelector('.nav-sub[data-sub="' + key + '"]');
        var arrow = this.querySelector('.nav-arrow');
        if (!sub) return;
        var willOpen = !sub.classList.contains('open');
        document.querySelectorAll('.nav-sub').forEach(function (el) { el.classList.remove('open'); });
        document.querySelectorAll('.nav-group .nav-arrow').forEach(function (el) { el.classList.remove('open'); });
        document.querySelectorAll('.nav-group').forEach(function (el) { el.classList.remove('open'); });
        if (willOpen) {
            sub.classList.add('open');
            arrow.classList.add('open');
            this.classList.add('open');
        }
    });
});

var CARDS = {
    home: 'cardHome', publicWorks: 'cardPublicWorks', excellentWorks: 'cardExcellentWorks',
    myWorks: 'cardMyWorks', favWorks: 'cardFavWorks', announce: 'cardAnnounce', wall: 'cardWall',
    checkin: 'cardCheckin', achievements: 'cardAchievements', shop: 'cardShop',
    friends: 'cardFriends', theme: 'cardTheme', feedback: 'cardFeedback'
};

function switchTab(tab) {
    document.querySelectorAll('.nav-item, .nav-sub-item').forEach(function (el) { el.classList.remove('active'); });
    var activeEl = document.querySelector('.nav-item[data-tab="' + tab + '"], .nav-sub-item[data-tab="' + tab + '"]');
    if (activeEl) {
        activeEl.classList.add('active');
        if (activeEl.classList.contains('nav-sub-item')) {
            var parentSub = activeEl.closest('.nav-sub');
            if (parentSub) {
                var parentGroup = document.querySelector('.nav-group[data-group="' + parentSub.getAttribute('data-sub') + '"]');
                if (parentGroup) parentGroup.classList.add('open');
            }
        }
    }
    Object.keys(CARDS).forEach(function (k) {
        var el = document.getElementById(CARDS[k]);
        if (!el) return;
        if (k === tab) {
            el.classList.remove('active');
            void el.offsetWidth;
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });
    if (tab === 'announce') loadAnnouncements();
    if (tab === 'wall' && typeof loadWall === 'function') loadWall();
    if (tab === 'publicWorks') loadWorksList('publicWorks');
    if (tab === 'excellentWorks') loadWorksList('excellentWorks');
    if (tab === 'myWorks') loadWorksList('myWorks');
    if (tab === 'favWorks') loadWorksList('favWorks');
    if (tab === 'feedback') {
        loadMyFeedbacks();
        if (currentUser) {
            supabaseClient.from('profiles').select('points').eq('id', currentUser.id).maybeSingle()
                .then(function (r) {
                    if (r.data) {
                        var el = document.getElementById('myPoints');
                        if (el) el.textContent = r.data.points || 0;
                    }
                });
        }
    }
    if (tab === 'checkin') { refreshCheckinUI(); loadCheckinCalendar(); loadMyPointLogs(); checkAndUnlockAchievements('checkin'); }
    if (tab === 'achievements') loadMyAchievements();
    if (tab === 'shop') loadShop();
    if (tab === 'friends') loadFriends();
    if (window.syncMobileTabbar) window.syncMobileTabbar(tab);
}

document.querySelectorAll('.nav-item[data-tab]').forEach(function (el) {
    if (el.id === 'homeNavItem') return;
    el.addEventListener('click', function (e) {
        if (e.target.classList.contains('nav-arrow')) return;
        switchTab(this.getAttribute('data-tab'));
    });
});
document.querySelectorAll('.nav-sub-item[data-tab]').forEach(function (el) {
    el.addEventListener('click', function () { switchTab(this.getAttribute('data-tab')); });
});

function toDateStr(d) { var y = d.getFullYear(); var m = String(d.getMonth() + 1).padStart(2, '0'); var dd = String(d.getDate()).padStart(2, '0'); return y + '-' + m + '-' + dd; }
function shanghaiNow() { var now = new Date(); return new Date(now.getTime() + (now.getTimezoneOffset() + 480) * 60000); }

function loadCheckinCalendar() {
    if (!currentUser) return;
    var today = shanghaiNow();
    var dow = today.getDay();
    var diff = dow === 0 ? -6 : 1 - dow;
    var monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    var sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    var startStr = toDateStr(monday); var endStr = toDateStr(sunday);
    Promise.all([
        supabaseClient.from('checkin_config').select('*').eq('id', 1).maybeSingle(),
        supabaseClient.from('checkins').select('checkin_date, points').eq('user_id', currentUser.id).gte('checkin_date', startStr).lte('checkin_date', endStr)
    ]).then(function (results) {
        var cfg = results[0].data || {};
        var checked = {};
        (results[1].data || []).forEach(function (c) { checked[c.checkin_date] = c.points; });
        renderCalendar(monday, cfg, checked);
    }).catch(function () { renderCalendar(monday, {}, {}); });
}

function renderCalendar(monday, cfg, checked) {
    var names = [t('adminDash.pointsMon', '周一'), t('adminDash.pointsTue', '周二'), t('adminDash.pointsWed', '周三'), t('adminDash.pointsThu', '周四'), t('adminDash.pointsFri', '周五'), t('adminDash.pointsSat', '周六'), t('adminDash.pointsSun', '周日')];
    var keys = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
    var todayStr = toDateStr(shanghaiNow());
    var html = '';
    for (var i = 0; i < 7; i++) {
        var d = new Date(monday); d.setDate(monday.getDate() + i);
        var dateStr = toDateStr(d);
        var isToday = dateStr === todayStr;
        var isChecked = Object.prototype.hasOwnProperty.call(checked, dateStr);
        var reward = cfg[keys[i]] != null ? cfg[keys[i]] : 1;
        var cls = 'checkin-day'; if (isToday) cls += ' today'; if (isChecked) cls += ' checked';
        var pointText = isChecked ? ('+' + checked[dateStr]) : ('+' + reward);
        html += '<div class="' + cls + '"><div class="day-name">' + names[i] + '</div><div class="day-date">' + (d.getMonth() + 1) + '/' + d.getDate() + '</div><div class="day-points">' + pointText + '</div></div>';
    }
    document.getElementById('checkinCalendar').innerHTML = html;
}

function loadAnnouncements() {
    var listEl = document.getElementById('announceList');
    var badge = document.getElementById('badgeAnnounce');
    listEl.innerHTML = '<div class="empty-state">' + t('common.loading', '加载中...') + '</div>';
    supabaseClient.from('announcements').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false })
        .then(function (res) {
            if (res.error) { listEl.innerHTML = '<div class="empty-state">' + t('common.loadFailed', '加载失败：') + escapeHtml(res.error.message) + '</div>'; return; }
            var data = res.data || [];
            badge.textContent = data.length + ' ' + (getLang() === 'zh' ? '条' : '');
            if (data.length === 0) { listEl.innerHTML = '<div class="empty-state">' + t('userDash.announceEmpty', '暂无公告') + '</div>'; return; }
            var html = '';
            data.forEach(function (item) {
                var time = new Date(item.created_at).toLocaleString('zh-CN', { hour12: false });
                html += '<div class="announce-item"><div class="announce-head">' + (item.is_pinned ? '<span class="announce-pinned">' + t('userDash.announcePinned', '📌 置顶') + '</span>' : '') + '<span class="announce-title">' + escapeHtml(item.title) + '</span><span class="announce-time">' + time + '</span></div><div class="announce-content">' + escapeHtml(item.content) + '</div></div>';
            });
            listEl.innerHTML = html;
        });
}

var COS_BUCKET = 'wenjian-1486273443';
var COS_REGION = 'ap-chongqing';
var cos = null;
var cosReady = false;
var currentCategoryList = 'myWorks';
var globalWorksData = [];

async function initCOS() {
    var uploadBtn = document.getElementById('openUploadModalBtn');
    if (uploadBtn) { uploadBtn.innerHTML = '<span style="font-size: 1.2em;">⏳</span> 正在连接云端...'; uploadBtn.style.opacity = '0.6'; uploadBtn.style.pointerEvents = 'none'; }
    try {
        const { data, error } = await supabaseClient.functions.invoke('cos-sts');
        if (error) {
            if (error.context && typeof error.context.json === 'function') {
                const body = await error.context.json();
                console.error('Edge Function 返回详情:', body);
                throw new Error(body.error || body.message || JSON.stringify(body));
            }
            throw error;
        }
        if (!data || !data.credentials) throw new Error('未获取到有效秘钥');
        cos = new COS({
            getAuthorization: function (options, callback) {
                callback({ TmpSecretId: data.credentials.tmpSecretId, TmpSecretKey: data.credentials.tmpSecretKey, XCosSecurityToken: data.credentials.sessionToken, StartTime: data.startTime, ExpiredTime: data.expiredTime });
            }
        });
        cosReady = true;
        if (uploadBtn) { uploadBtn.innerHTML = '📤 上传新作品'; uploadBtn.style.opacity = '1'; uploadBtn.style.pointerEvents = 'auto'; }
    } catch (err) {
        console.error('COS 初始化异常:', err);
        if (uploadBtn) { uploadBtn.innerHTML = '❌ 失败: ' + (err.message || '未知错误'); uploadBtn.style.opacity = '0.8'; uploadBtn.style.color = '#ff6b6b'; uploadBtn.style.pointerEvents = 'none'; }
    }
}
initCOS();

function loadWorksList(category) {
    currentCategoryList = category;
    var container = document.getElementById(category + 'List');
    if (!container) return;
    container.innerHTML = '<div class="empty-state">' + t('common.loading', '加载中...') + '</div>';
    
    var parentCard = container.closest('.card');
    if (parentCard) {
        parentCard.style.setProperty('max-width', '100%', 'important');
        parentCard.style.setProperty('width', '100%', 'important');
    }

    function fetchAndRender(workIds, fromFav) {
        // 同时查询关联的点赞数
        var query = supabaseClient.from('user_works').select('*, work_likes(count)');
        
        if (fromFav) { query = query.in('id', workIds); } 
        else if (category === 'myWorks') { query = query.eq('user_id', currentUser.id); } 
        else { query = query.eq('category', category); }
        
        query = query.order('created_at', { ascending: false });
        
        query.then(function (res) {
            if (res.error) { container.innerHTML = '<div class="empty-state">加载失败：' + res.error.message + '</div>'; return; }
            var data = res.data || [];
            
            // 处理点赞数
            data.forEach(function(item) {
                item.like_count = (item.work_likes && item.work_likes.length > 0) ? item.work_likes[0].count : 0;
            });

            // 如果是公共作品，按点赞数从高到低排序
            if (category !== 'myWorks' && category !== 'favWorks') {
                data.sort(function(a, b) {
                    return b.like_count - a.like_count;
                });
            }

            globalWorksData = data;
            
            if (data.length === 0) { 
                container.innerHTML = '<div class="empty-state">' + (fromFav ? '你还没有收藏过作品哦~' : '暂时没有任何作品哦~') + '</div>'; 
                return; 
            }

            var userIds = Array.from(new Set(data.map(function(x) { return x.user_id; })));
            supabaseClient.from('profiles').select('id, full_name, email').in('id', userIds).then(function(pRes) {
                var profileMap = {};
                (pRes.data || []).forEach(function(p) { profileMap[p.id] = p; });

                data.forEach(function(item) {
                    var author = profileMap[item.user_id] || {};
                    item.author_name = author.full_name || author.email || '未知用户';
                    if (!item.work_code) item.work_code = '暂无';
                });

                container.innerHTML = `<div id="worksGrid_${category}" style="display: flex !important; flex-direction: row !important; flex-wrap: wrap !important; gap: 20px !important; width: 100% !important; height: auto !important; align-items: flex-start !important;"></div>`;

                if (parentCard) {
                    var cardHead = parentCard.querySelector('.card-head');
                    if (cardHead) {
                        var oldSearch = cardHead.querySelector('.custom-search-wrapper');
                        if (oldSearch) oldSearch.remove();

                        var searchHtml = `
                            <div class="custom-search-wrapper" style="display:flex; align-items:center; margin-left:auto; margin-right: 10px;">
                                <div style="display: flex; align-items: center; background: var(--theme-info-box); border: 1px solid var(--theme-border); border-radius: 20px; padding: 2px; height: 38px; box-sizing: border-box;">
                                    <input type="text" id="searchInput_${category}" placeholder="搜索作品ID或作者昵称..." style="width: 200px; height: 100%; padding: 0 12px; border: none; background: transparent; color: var(--theme-text); outline: none; font-size: 0.85em;">
                                    <button id="searchBtn_${category}" style="height: 100%; padding: 0 16px; border: none; border-radius: 18px; background: var(--theme-accent); color: #fff; font-size: 0.85em; cursor: pointer; white-space: nowrap;">搜索</button>
                                </div>
                            </div>
                        `;
                        cardHead.insertAdjacentHTML('beforeend', searchHtml);
                        
                        var searchInput = document.getElementById(`searchInput_${category}`);
                        var searchBtn = document.getElementById(`searchBtn_${category}`);

                        function doSearch() { renderGrid(searchInput.value.trim()); }
                        searchBtn.addEventListener('click', doSearch);
                        searchInput.addEventListener('keypress', function(e) { if (e.key === 'Enter') doSearch(); });
                        searchInput.addEventListener('input', function() { renderGrid(this.value.trim()); });
                    }
                }

                function renderGrid(filterText) {
                    var gridEl = document.getElementById(`worksGrid_${category}`);
                    var filteredData = data;
                    if (filterText) {
                        filterText = filterText.toLowerCase();
                        filteredData = data.filter(function(item) {
                            return (item.title && item.title.toLowerCase().includes(filterText)) ||
                                   (item.work_code && item.work_code.toLowerCase().includes(filterText)) ||
                                   (item.author_name && item.author_name.toLowerCase().includes(filterText));
                        });
                    }

                    if (filteredData.length === 0) {
                        gridEl.innerHTML = '<div style="width: 100%; text-align: center; padding: 40px; color: #888;">没有找到相关作品</div>';
                        return;
                    }

                    var promises = filteredData.map(function(item) {
                        return new Promise(function(resolve) {
                            if (!item.cover_url) { item.finalCoverUrl = ''; resolve(); return; }
                            if (item.cover_url.indexOf('.myqcloud.com/') !== -1 && cosReady && cos) {
                                var key = item.cover_url.split('.myqcloud.com/')[1].split('?')[0];
                                cos.getObjectUrl({ Bucket: COS_BUCKET, Region: COS_REGION, Key: key, Sign: true, Expires: 3600 }, function(err, data2) {
                                    item.finalCoverUrl = (data2 && data2.Url) ? data2.Url : item.cover_url;
                                    resolve();
                                });
                            } else {
                                item.finalCoverUrl = item.cover_url;
                                resolve();
                            }
                        });
                    });

                    Promise.all(promises).then(function() {
                        var gridHtml = '';
                        filteredData.forEach(function (item) {
                            var isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(item.file_name);
                            var isVid = /\.(mp4|webm|mov)$/i.test(item.file_name);
                            var defaultIcon = isImg ? '🖼️' : (isVid ? '🎬' : '📄');
                            
                            var headerHtml = item.finalCoverUrl
                                ? `<div style="width: 100% !important; height: 140px !important; min-height: 140px !important; max-height: 140px !important; flex-shrink: 0 !important; background-image: url('${escapeHtml(item.finalCoverUrl)}'); background-size: cover !important; background-position: center !important; background-repeat: no-repeat !important; border-radius: 12px 12px 0 0 !important; margin: 0 !important; padding: 0 !important; display: block !important;"></div>` 
                                : `<div style="display: flex !important; width: 100% !important; height: 140px !important; min-height: 140px !important; flex-shrink: 0 !important; align-items: center !important; justify-content: center !important; font-size: 2.5em !important; background: #2a2a2a !important; color: #666 !important; border-radius: 12px 12px 0 0 !important;">${defaultIcon}</div>`;
                                
                            var title = item.title || item.file_name;
                            
                            // 在卡片底部加上点赞数显示
                            gridHtml += `
                            <div onclick="openWorkDetail('${item.id}')" style="width: 180px !important; min-width: 180px !important; max-width: 180px !important; height: 220px !important; min-height: 220px !important; max-height: 220px !important; flex: 0 0 180px !important; display: flex !important; flex-direction: column !important; background: #1e1e1e !important; border: 1px solid #333 !important; border-radius: 12px !important; overflow: hidden !important; cursor: pointer !important; box-sizing: border-box !important; transition: transform 0.2s; margin: 0 !important; padding: 0 !important;" onmouseover="this.style.transform='translateY(-3px)'; this.style.borderColor='#555';" onmouseout="this.style.transform='none'; this.style.borderColor='#333';">
                                ${headerHtml}
                                <div style="height: 80px !important; min-height: 80px !important; max-height: 80px !important; flex-shrink: 0 !important; padding: 10px !important; display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; box-sizing: border-box !important; background: #1e1e1e !important; width: 100% !important;">
                                    <div title="${escapeHtml(title)}" style="margin: 0 !important; font-size: 0.95em !important; font-weight: 600 !important; color: #fff !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; width: 100% !important; text-align: center !important;">${escapeHtml(title)}</div>
                                    <div style="font-size: 0.75em; color: #888; margin-top: 4px;">👍 ${item.like_count || 0}</div>
                                </div>
                            </div>`;
                        });
                        gridEl.innerHTML = gridHtml;
                    });
                }
                renderGrid('');
            });
        });
    }

    if (category === 'favWorks') {
        supabaseClient.from('work_favorites').select('work_id').eq('user_id', currentUser.id).then(function(favRes) {
            if (favRes.error) { container.innerHTML = '<div class="empty-state">加载失败：' + favRes.error.message + '</div>'; return; }
            var workIds = (favRes.data || []).map(function(f) { return f.work_id; });
            if (workIds.length === 0) {
                container.innerHTML = '<div class="empty-state">你还没有收藏过作品哦~</div>';
                return;
            }
            fetchAndRender(workIds, true);
        });
    } else {
        fetchAndRender(null, false);
    }
}

window.openWorkDetail = function(id) {
    var item = globalWorksData.find(function(x) { return String(x.id) === String(id); });
    if (!item) return;

    document.getElementById('detailWorkTitle').textContent = item.title || item.file_name;
    document.getElementById('detailWorkDesc').textContent = item.description || '暂无简介';
    document.getElementById('detailWorkSize').textContent = (item.file_size / 1024 / 1024).toFixed(2) + ' MB';
    
    var timeHtml = new Date(item.created_at).toLocaleString('zh-CN', { hour12: false });
    if (item.work_code) {
        timeHtml += ` <span id="copyWorkCodeBtn" title="点击复制作品ID" style="cursor:pointer; margin-left:10px; font-size:0.8em; padding:2px 6px; background:var(--theme-info-box); border-radius:4px; border:1px solid var(--theme-border); transition:all 0.2s;">作品 ID: ${item.work_code} 📋</span>`;
    }
    document.getElementById('detailWorkTime').innerHTML = timeHtml;
    
    var copyBtn = document.getElementById('copyWorkCodeBtn');
    if (copyBtn) {
        copyBtn.onclick = function() {
            navigator.clipboard.writeText(item.work_code).then(function() {
                var originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '✅ 已复制!';
                copyBtn.style.color = 'var(--theme-accent)';
                copyBtn.style.borderColor = 'var(--theme-accent)';
                setTimeout(function() {
                    copyBtn.innerHTML = originalText;
                    copyBtn.style.color = '';
                    copyBtn.style.borderColor = 'var(--theme-border)';
                }, 1500);
            });
        };
    }

    var authorEl = document.getElementById('detailWorkAuthor');
    if (item.user_id === currentUser.id) {
        authorEl.textContent = '👤 ' + (myProfile && myProfile.full_name ? myProfile.full_name : '我自己');
    } else {
        authorEl.textContent = '👤 加载中...';
        supabaseClient.from('profiles').select('full_name, email').eq('id', item.user_id).maybeSingle().then(function(res) {
            var name = (res.data && (res.data.full_name || res.data.email)) ? (res.data.full_name || res.data.email) : '未知用户';
            authorEl.textContent = '👤 ' + name;
        });
    }

    var coverImg = document.getElementById('detailWorkCover');
    var fallbackIcon = document.getElementById('detailWorkIcon');
    var isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(item.file_name);
    var isVid = /\.(mp4|webm|mov)$/i.test(item.file_name);
    fallbackIcon.textContent = isImg ? '🖼️' : (isVid ? '🎬' : '📄');
    
    if (item.cover_url) {
        coverImg.style.display = 'block';
        fallbackIcon.style.display = 'none';
        if (item.cover_url.indexOf('.myqcloud.com/') !== -1 && cosReady && cos) {
            var key = item.cover_url.split('.myqcloud.com/')[1].split('?')[0];
            cos.getObjectUrl({ Bucket: COS_BUCKET, Region: COS_REGION, Key: key, Sign: true, Expires: 3600 }, function(err, data2) {
                coverImg.src = (data2 && data2.Url) ? data2.Url : item.cover_url;
            });
        } else {
            coverImg.src = item.cover_url;
        }
        coverImg.onerror = function() { this.style.display = 'none'; fallbackIcon.style.display = 'flex'; };
    } else {
        coverImg.style.display = 'none';
        fallbackIcon.style.display = 'flex';
    }

    var actionsHtml = '';
    if (item.user_id === currentUser.id && currentCategoryList === 'myWorks') {
        actionsHtml += `<button id="detailWorkEditBtn" style="height: 42px; padding: 0 16px; border-radius: var(--radius-md); border: 1px solid var(--theme-accent-border); background: var(--theme-accent-soft); color: var(--theme-accent); cursor: pointer; font-weight: 500; margin-right: 8px;">✏️ 编辑</button>`;
        actionsHtml += `<button id="detailWorkDeleteBtn" style="height: 42px; padding: 0 16px; border-radius: var(--radius-md); border: 1px solid rgba(214,139,139,.45); background: rgba(214,139,139,.15); color: var(--danger); cursor: pointer; font-weight: 500; margin-right: 8px;">🗑 删除</button>`;
    }
    
    // 点赞按钮
    actionsHtml += `<button id="detailWorkLikeBtn" style="height: 42px; padding: 0 20px; background: transparent; border: 1px solid var(--theme-border); color: var(--theme-text); border-radius: var(--radius-md); cursor: pointer; margin-right: 8px; transition: all 0.2s;">👍 点赞 <span id="detailWorkLikeCount">${item.like_count || 0}</span></button>`;

    // 收藏按钮
    if (item.user_id !== currentUser.id) {
        actionsHtml += `<button id="detailWorkFavBtn" style="height: 42px; padding: 0 20px; background: transparent; border: 1px solid var(--theme-border); color: var(--theme-text); border-radius: var(--radius-md); cursor: pointer; margin-right: 8px; transition: all 0.2s;">⭐ 收藏</button>`;
    }
    
    // 下载按钮
    actionsHtml += `<button id="detailWorkDownloadBtn" class="btn-save" style="height: 42px; padding: 0 24px; width: auto;">📥 下载文件</button>`;
    
    document.getElementById('detailWorkActions').innerHTML = actionsHtml;

    document.getElementById('detailWorkDownloadBtn').onclick = function() {
        var fileKey = item.file_key;
        var fileName = item.file_name;
        
        if (!fileKey) { alert('❌ 错误：文件路径为空'); return; }
        if (!cosReady || !cos) { alert('❌ 错误：云端未连接'); return; }
        
        var btn = this;
        var oldText = btn.innerHTML;
        btn.innerHTML = '⏳ 正在拉取...';
        btn.disabled = true;

        cos.getObjectUrl({
            Bucket: COS_BUCKET,
            Region: COS_REGION,
            Key: fileKey,
            Sign: true,
            Expires: 3600
        }, function(err, data) {
            btn.innerHTML = oldText;
            btn.disabled = false;
            
            if (err) {
                alert('❌ 获取链接失败：' + (err.message || '未知错误'));
                return;
            }
            
            if (data && data.Url) {
                var a = document.createElement('a');
                a.href = data.Url;
                a.download = fileName || '作品文件';
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                alert('❌ 获取链接失败：返回的地址为空');
            }
        });
    };
    
    if (document.getElementById('detailWorkEditBtn')) {
        document.getElementById('detailWorkEditBtn').onclick = function() {
            document.getElementById('workDetailModal').style.display = 'none';
            editWork(item.id);
        };
        document.getElementById('detailWorkDeleteBtn').onclick = function() {
            if (confirm('确定要永久删除这个作品吗？')) {
                document.getElementById('workDetailModal').style.display = 'none';
                deleteWork(item.id, item.file_key);
            }
        };
    }

    if (document.getElementById('detailWorkLikeBtn')) {
        var likeBtn = document.getElementById('detailWorkLikeBtn');
        var likeCountSpan = document.getElementById('detailWorkLikeCount');

        supabaseClient.from('work_likes').select('id').eq('user_id', currentUser.id).eq('work_id', item.id).maybeSingle().then(function(likeRes) {
            if (likeRes.data) {
                likeBtn.innerHTML = `❤️ 已赞 <span id="detailWorkLikeCount">${item.like_count || 0}</span>`;
                likeBtn.style.color = 'var(--danger)';
                likeBtn.style.borderColor = 'rgba(214,139,139,.45)';
            }
        });

        likeBtn.onclick = function() {
            var btn = this;
            btn.disabled = true;
            supabaseClient.from('work_likes').select('id').eq('user_id', currentUser.id).eq('work_id', item.id).maybeSingle().then(function(likeRes) {
                if (likeRes.data) {
                    return supabaseClient.from('work_likes').delete().eq('id', likeRes.data.id).then(function(res) {
                        if (!res.error) {
                            item.like_count = Math.max(0, (item.like_count || 0) - 1);
                            btn.innerHTML = `👍 点赞 <span>${item.like_count}</span>`;
                            btn.style.color = 'var(--theme-text)';
                            btn.style.borderColor = 'var(--theme-border)';
                        }
                        btn.disabled = false;
                    });
                } else {
                    return supabaseClient.from('work_likes').insert([{ user_id: currentUser.id, work_id: item.id }]).then(function(res) {
                        if (!res.error) {
                            item.like_count = (item.like_count || 0) + 1;
                            btn.innerHTML = `❤️ 已赞 <span>${item.like_count}</span>`;
                            btn.style.color = 'var(--danger)';
                            btn.style.borderColor = 'rgba(214,139,139,.45)';
                        }
                        btn.disabled = false;
                    });
                }
            });
        };
    }

    if (document.getElementById('detailWorkFavBtn')) {
        var favBtn = document.getElementById('detailWorkFavBtn');
        supabaseClient.from('work_favorites').select('id').eq('user_id', currentUser.id).eq('work_id', item.id).maybeSingle().then(function(favRes) {
            if (favRes.data) {
                favBtn.innerHTML = '💔 取消收藏';
                favBtn.style.color = 'var(--danger)';
                favBtn.style.borderColor = 'rgba(214,139,139,.45)';
            }
        });

        favBtn.onclick = function() {
            var btn = this;
            btn.disabled = true;
            supabaseClient.from('work_favorites').select('id').eq('user_id', currentUser.id).eq('work_id', item.id).maybeSingle().then(function(favRes) {
                if (favRes.data) {
                    return supabaseClient.from('work_favorites').delete().eq('id', favRes.data.id).then(function(res) {
                        if (!res.error) {
                            btn.innerHTML = '⭐ 收藏';
                            btn.style.color = 'var(--theme-text)';
                            btn.style.borderColor = 'var(--theme-border)';
                        }
                        btn.disabled = false;
                    });
                } else {
                    return supabaseClient.from('work_favorites').insert([{ user_id: currentUser.id, work_id: item.id }]).then(function(res) {
                        if (!res.error) {
                            btn.innerHTML = '💔 取消收藏';
                            btn.style.color = 'var(--danger)';
                            btn.style.borderColor = 'rgba(214,139,139,.45)';
                        }
                        btn.disabled = false;
                    });
                }
            });
        };
    }

    var closeBtn = document.getElementById('detailWorkCloseBtn');
    if (closeBtn) {
        closeBtn.onclick = function() {
            document.getElementById('workDetailModal').style.display = 'none';
        };
    }
    var modalMask = document.getElementById('workDetailModal');
    if (modalMask) {
        modalMask.onclick = function(e) {
            if (e.target === this) this.style.display = 'none';
        };
    }

    document.getElementById('workDetailModal').style.display = 'flex';
};

var uploadCoverFile = null; var uploadMainFile = null;
var btnOpenUpload = document.getElementById('openUploadModalBtn');
if (btnOpenUpload) {
    btnOpenUpload.addEventListener('click', function() {
        if (!cosReady || !cos) { alert('云端存储未连接，无法上传！请刷新重试。'); return; }
        document.getElementById('uploadWorkCategory').value = 'publicWorks';
        document.getElementById('uploadWorkTitle').value = '';
        document.getElementById('uploadWorkDesc').value = '';
        document.getElementById('uploadMainFile').value = '';
        document.getElementById('uploadCoverInput').value = '';
        document.getElementById('uploadCoverPreview').innerHTML = '🖼️';
        document.getElementById('uploadMainFileName').textContent = '未选择文件';
        uploadCoverFile = null; uploadMainFile = null;
        document.getElementById('uploadWorkModal').style.display = 'flex';
    });
}
var btnCancelUpload = document.getElementById('uploadWorkCancelBtn');
if (btnCancelUpload) { btnCancelUpload.onclick = function() { document.getElementById('uploadWorkModal').style.display = 'none'; }; }

var btnSelectCover = document.getElementById('btnSelectCover');
if (btnSelectCover) { btnSelectCover.onclick = function() { document.getElementById('uploadCoverInput').click(); }; }
var inputUploadCover = document.getElementById('uploadCoverInput');
if (inputUploadCover) {
    inputUploadCover.addEventListener('change', function(e) {
        var file = e.target.files[0]; if (!file) return;
        if (!file.type.startsWith('image/')) { alert('封面必须是图片文件！'); return; }
        uploadCoverFile = file;
        var reader = new FileReader();
        reader.onload = function(ev) { document.getElementById('uploadCoverPreview').innerHTML = `<img src="${ev.target.result}" style="width:100%; height:100%; object-fit:cover;">`; };
        reader.readAsDataURL(file);
    });
}

var btnSelectMain = document.getElementById('btnSelectMainFile');
if (btnSelectMain) { btnSelectMain.onclick = function() { document.getElementById('uploadMainFile').click(); }; }
var inputUploadMain = document.getElementById('uploadMainFile');
if (inputUploadMain) {
    inputUploadMain.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file) { document.getElementById('uploadMainFileName').textContent = '未选择文件'; uploadMainFile = null; return; }
        if (file.size > 50 * 1024 * 1024) { alert('文件不能超过 50MB'); this.value = ''; return; }
        uploadMainFile = file;
        document.getElementById('uploadMainFileName').textContent = file.name;
    });
}

var btnSubmitUpload = document.getElementById('uploadWorkSubmitBtn');
if (btnSubmitUpload) {
    btnSubmitUpload.onclick = function() {
        var title = document.getElementById('uploadWorkTitle').value.trim();
        var category = document.getElementById('uploadWorkCategory').value;
        var desc = document.getElementById('uploadWorkDesc').value.trim();
        if (!title) { alert('请输入作品名称'); return; }
        if (!uploadMainFile) { alert('请选择要上传的主文件'); return; }
        
        var btn = this; btn.disabled = true; btn.textContent = '上传中...';
        var progressBar = document.getElementById('uploadProgressBar');
        var progressInner = document.getElementById('uploadProgressInner');
        if(progressBar) { progressBar.style.display = 'block'; progressInner.style.width = '0%'; }

        var uploadCoverPromise = Promise.resolve('');
        if (uploadCoverFile) {
            var coverExt = uploadCoverFile.name.split('.').pop();
            var coverKey = 'covers/' + currentUser.id + '/' + Date.now() + '.' + coverExt;
            uploadCoverPromise = new Promise((resolve, reject) => {
                cos.putObject({ Bucket: COS_BUCKET, Region: COS_REGION, Key: coverKey, Body: uploadCoverFile }, function(err, data) {
                    if (err) { reject(new Error('封面上传失败：' + err.message)); return; }
                    resolve(`https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com/${coverKey}`);
                });
            });
        }

        uploadCoverPromise.then(function(coverUrl) {
            var fileExt = uploadMainFile.name.split('.').pop();
            var mainFileName = Date.now() + '_' + Math.floor(Math.random() * 10000) + '.' + fileExt;
            var mainFileKey = 'works/' + currentUser.id + '/' + mainFileName;
            
            return new Promise((resolve, reject) => {
                cos.putObject({
                    Bucket: COS_BUCKET, Region: COS_REGION, Key: mainFileKey, Body: uploadMainFile,
                    onProgress: function (info) { if(progressInner) progressInner.style.width = Math.floor(info.percent * 100) + '%'; }
                }, function(err, data) {
                    if (err) reject(new Error('主文件上传失败：' + err.message));
                    else resolve({ coverUrl: coverUrl, fileKey: mainFileKey });
                });
            });
        })
        .then(function(result) {
            var randomWorkCode = Math.random().toString(36).substring(2, 10).toUpperCase();
            var payload = {
                user_id: currentUser.id, title: title, description: desc, cover_url: result.coverUrl,
                file_key: result.fileKey, file_name: uploadMainFile.name, file_size: uploadMainFile.size,
                category: category, work_code: randomWorkCode
            };
            return supabaseClient.from('user_works').insert([payload]);
        })
        .then(function(res) {
            if(progressBar) progressBar.style.display = 'none';
            btn.disabled = false; btn.textContent = '开始上传';
            if (res && res.error) { alert('保存记录失败：' + res.error.message); return; }
            
            alert('🎉 作品上传成功！');
            document.getElementById('uploadWorkModal').style.display = 'none';
            document.getElementById('uploadWorkTitle').value = '';
            document.getElementById('uploadWorkDesc').value = '';
            document.getElementById('uploadMainFile').value = '';
            document.getElementById('uploadCoverInput').value = '';
            document.getElementById('uploadCoverPreview').innerHTML = '🖼️';
            document.getElementById('uploadMainFileName').textContent = '未选择文件';
            uploadCoverFile = null; uploadMainFile = null;

            if (currentCategoryList === 'myWorks') loadWorksList('myWorks');
            if (currentCategoryList === category) loadWorksList(category);
        })
        .catch(function(err) {
            if(progressBar) progressBar.style.display = 'none';
            btn.disabled = false; btn.textContent = '开始上传';
            alert((err && err.message) || '上传失败');
        });
    };
}

window.editWork = function(id) {
    supabaseClient.from('user_works').select('*').eq('id', id).maybeSingle().then(function(res) { if (res.data) openWorkEditModal(res.data); });
}
var currentEditWorkId = null; var tempCoverUrl = ''; var tempCoverFileKey = '';

function openWorkEditModal(workData) {
    currentEditWorkId = workData ? workData.id : null;
    tempCoverUrl = workData && workData.cover_url ? workData.cover_url : '';
    tempCoverFileKey = '';
    document.getElementById('workEditTitle').value = workData ? (workData.title || workData.file_name) : '';
    document.getElementById('workEditDesc').value = workData ? (workData.description || '') : '';
    var preview = document.getElementById('workCoverPreview');
    if (tempCoverUrl) preview.innerHTML = `<img src="${tempCoverUrl}" style="width:100%; height:100%; object-fit:cover;">`;
    else preview.innerHTML = '🖼️';
    document.getElementById('workEditModal').style.display = 'flex';
}

var _btnUploadCover = document.getElementById('uploadCoverBtn');
if (_btnUploadCover) { _btnUploadCover.addEventListener('click', function() { document.getElementById('workCoverInput').click(); }); }
var _inputWorkCover = document.getElementById('workCoverInput');
if (_inputWorkCover) {
    _inputWorkCover.addEventListener('change', function(e) {
        var file = e.target.files[0]; if (!file) return;
        if (!cosReady || !cos) { alert('云端未连接，无法上传封面'); return; }
        var btn = document.getElementById('uploadCoverBtn'); if (btn) { btn.disabled = true; btn.textContent = '上传中...'; }
        var fileExt = file.name.split('.').pop();
        var fileKey = 'covers/' + currentUser.id + '/' + Date.now() + '.' + fileExt;
        cos.putObject({ Bucket: COS_BUCKET, Region: COS_REGION, Key: fileKey, Body: file }, function(err, data) {
            if (btn) { btn.disabled = false; btn.textContent = '上传封面图'; }
            if (err) { alert('封面上传失败：' + err.message); return; }
            tempCoverFileKey = fileKey;
            tempCoverUrl = `https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com/${fileKey}`;
            document.getElementById('workCoverPreview').innerHTML = `<img src="${tempCoverUrl}" style="width:100%; height:100%; object-fit:cover;">`;
        });
    });
}

var _btnWorkEditSave = document.getElementById('workEditSaveBtn');
if (_btnWorkEditSave) {
    _btnWorkEditSave.addEventListener('click', function() {
        var title = document.getElementById('workEditTitle').value.trim();
        if (!title) { alert('请输入作品标题'); return; }
        var desc = document.getElementById('workEditDesc').value.trim();
        var btn = this; btn.disabled = true; btn.textContent = '保存中...';
        var payload = { title: title, description: desc, cover_url: tempCoverUrl };
        if (currentEditWorkId) {
            supabaseClient.from('user_works').update(payload).eq('id', currentEditWorkId).then(function(res) {
                btn.disabled = false; btn.textContent = '保存作品';
                if (res.error) { alert('保存失败：' + res.error.message); return; }
                document.getElementById('workEditModal').style.display = 'none';
                tempCoverFileKey = '';
                loadWorksList(currentCategoryList);
            });
        }
    });
}

var _btnWorkEditCancel = document.getElementById('workEditCancelBtn');
if (_btnWorkEditCancel) {
    _btnWorkEditCancel.addEventListener('click', function() {
        document.getElementById('workEditModal').style.display = 'none';
        if (tempCoverFileKey && cosReady && cos) { cos.deleteObject({ Bucket: COS_BUCKET, Region: COS_REGION, Key: tempCoverFileKey }); }
        tempCoverFileKey = '';
    });
}

window.deleteWork = function(dbId, fileKey) {
    if (!confirm('确定要永久删除这个作品吗？此操作不可恢复！')) return;
    if (!cosReady || !cos) return;
    cos.deleteObject({ Bucket: COS_BUCKET, Region: COS_REGION, Key: fileKey }, function (err, data) {
        if (err) { alert('云端文件删除失败：' + err.message); return; }
        supabaseClient.from('user_works').delete().eq('id', dbId).then(function (dbRes) {
            if (dbRes.error) { alert('记录删除失败：' + dbRes.error.message); } else { loadWorksList(currentCategoryList); }
        });
    });
};

function loadMyAchievements() {
    if (!currentUser) return;
    var grid = document.getElementById('achievementsGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="empty-state">' + t('common.loading', '加载中...') + '</div>';
    Promise.all([
        supabaseClient.from('achievements').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        supabaseClient.from('user_achievements').select('*').eq('user_id', currentUser.id)
    ]).then(function (results) {
        if (results[0].error || results[1].error) { grid.innerHTML = '<div class="empty-state">加载失败，请稍后重试</div>'; return; }
        var allAch = results[0].data || [];
        var myUnlocked = results[1].data || [];
        var unlockedMap = {}; var unlockTimeMap = {};
        myUnlocked.forEach(function (ua) { unlockedMap[ua.achievement_id] = true; unlockTimeMap[ua.achievement_id] = ua.unlocked_at; });
        if (allAch.length === 0) { grid.innerHTML = '<div class="empty-state">暂时没有可解锁的成就</div>'; return; }
        var html = '';
        allAch.forEach(function (item) {
            var isUnlocked = !!unlockedMap[item.id];
            var cardClass = isUnlocked ? 'unlocked' : 'locked';
            var footerHtml = '';
            if (isUnlocked) {
                var time = new Date(unlockTimeMap[item.id]).toLocaleDateString('zh-CN');
                footerHtml = '<div class="achieve-time">' + time + ' 解锁</div>';
            } else {
                var typeMap = { 'manual': '手动发放', 'checkin_streak': '连续签到', 'points_reached': '积分达到', 'purchase_count': '兑换次数' };
                var conditionText = typeMap[item.condition_type] || '';
                if (item.condition_value > 0) conditionText += ' ' + item.condition_value + (item.condition_type === 'checkin_streak' ? ' 天' : '');
                footerHtml = '<div class="achieve-time" style="color:var(--theme-accent);">条件：' + conditionText + '</div>';
            }
            html += '<div class="achieve-card ' + cardClass + '"><div class="achieve-icon">' + escapeHtml(item.icon || '🏆') + '</div><div class="achieve-name">' + escapeHtml(item.name) + '</div><div class="achieve-desc">' + escapeHtml(item.description || '') + '</div>' + (item.reward_points > 0 ? '<div class="achieve-reward">+' + item.reward_points + ' 积分</div>' : '') + footerHtml + '</div>';
        });
        grid.innerHTML = html;
    }).catch(function () { grid.innerHTML = '<div class="empty-state">网络错误，加载失败</div>'; });
}

function checkAndUnlockAchievements(actionType) {
    if (!currentUser) return Promise.resolve();
    return supabaseClient.from('profiles').select('points, checkin_streak').eq('id', currentUser.id).maybeSingle()
    .then(function (pRes) {
        if (pRes.error || !pRes.data) return;
        var profile = pRes.data;
        return supabaseClient.from('achievements').select('*').eq('is_active', true).then(function (achRes) {
            var achievements = achRes.data || [];
            var unlockPromises = [];
            achievements.forEach(function (ach) {
                var isQualified = false;
                if (ach.condition_type === 'checkin_streak' && profile.checkin_streak >= ach.condition_value) isQualified = true;
                else if (ach.condition_type === 'points_reached' && profile.points >= ach.condition_value) isQualified = true;
                if (isQualified) {
                    var promise = supabaseClient.from('user_achievements').insert([{ user_id: currentUser.id, achievement_id: ach.id }]).then(function (insertRes) {
                        if (!insertRes.error && ach.reward_points > 0) {
                            var newPoints = (profile.points || 0) + ach.reward_points;
                            return supabaseClient.from('profiles').update({ points: newPoints }).eq('id', currentUser.id).then(function() {
                                addPointLog(currentUser.id, ach.reward_points, '解锁成就：' + ach.name, null, newPoints);
                                return { ach: ach, newPoints: newPoints };
                            });
                        }
                        return null;
                    });
                    unlockPromises.push(promise);
                }
            });
            return Promise.all(unlockPromises);
        });
    })
    .then(function (unlockedResults) {
        var unlockedList = unlockedResults.filter(function (r) { return r != null; });
        if (unlockedList.length > 0) {
            unlockedList.forEach(function (item) { showToast('🎉 解锁成就：「' + item.ach.name + '」 +' + item.ach.reward_points + ' 积分', 'success'); });
            refreshCheckinUI(); loadMyAchievements();
        }
    }).catch(function (err) { console.warn('[成就系统] 检查异常：', err); });
}

function loadMyFeedbacks() {
    var listEl = document.getElementById('myFeedbackList');
    var badge  = document.getElementById('badgeFeedback');
    if (!listEl || !currentUser) return;
    listEl.innerHTML = '<div class="empty-state">' + t('common.loading', '加载中...') + '</div>';
    supabaseClient.from('feedbacks').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false })
        .then(function (res) {
            if (res.error) { listEl.innerHTML = '<div class="empty-state">' + t('common.loadFailed', '加载失败：') + escapeHtml(res.error.message) + '</div>'; return; }
            var data = res.data || [];
            if (badge) badge.textContent = data.length + ' ' + (getLang() === 'zh' ? '条' : '');
            if (data.length === 0) { listEl.innerHTML = '<div class="empty-state">' + t('userDash.feedbackListEmpty', '📭 暂无反馈记录') + '</div>'; resetFbSelection(); return; }
            var statusMap = { pending: t('userDash.feedbackStatusPending', '⏳ 待处理'), processing: t('userDash.feedbackStatusProcessing', '🔄 处理中'), resolved: t('userDash.feedbackStatusResolved', '✅ 已解决') };
            var html = '';
            data.forEach(function (item) {
                var time = new Date(item.created_at).toLocaleString('zh-CN', { hour12: false });
                html += '<div class="feedback-item"><label class="fb-check" title="Select"><input type="checkbox" class="fb-item-check" data-id="' + item.id + '"></label><div class="fb-main"><div class="feedback-head"><span class="feedback-status ' + item.status + '">' + (statusMap[item.status] || item.status) + '</span>' + ((item.reward_points && item.reward_points > 0) ? '<span class="feedback-reward-tag">+' + item.reward_points + ' ' + (getLang() === 'zh' ? '积分' : 'pts') + '</span>' : '') + '<span class="feedback-time">' + time + '</span></div><div class="feedback-content">' + escapeHtml(item.content) + '</div>' + (item.reply ? '<div class="feedback-reply">💬 <b>' + t('userDash.feedbackAdminReply', '💬 管理员回复：') + '</b>' + escapeHtml(item.reply) + '</div>' : '') + '<div class="feedback-actions"><button class="fb-del-btn fb-del" data-id="' + item.id + '">' + t('userDash.feedbackDeleteBtn', '🗑 删除') + '</button></div></div></div>';
            });
            listEl.innerHTML = html; resetFbSelection();
        });
}
var submitFbBtn = document.getElementById('submitFeedbackBtn');
if (submitFbBtn) {
    submitFbBtn.addEventListener('click', function () {
        var content = document.getElementById('feedbackContent').value.trim();
        if (!content) { showToast(t('userDash.feedbackSubmitEmpty', '请填写反馈内容'), 'error'); return; }
        if (!currentUser) { showToast('请先登录', 'error'); return; }
        var btn = this; btn.disabled = true;
        supabaseClient.from('feedbacks').insert([{ user_id: currentUser.id, user_email: currentUser.email, content: content }]).then(function (res) {
            btn.disabled = false;
            if (res.error) { showToast(t('userDash.feedbackSubmitFail', '提交失败：') + res.error.message, 'error'); return; }
            document.getElementById('feedbackContent').value = '';
            showToast(t('userDash.feedbackSubmitSuccess', '反馈提交成功，感谢你的反馈！'), 'success');
            loadMyFeedbacks();
        });
    });
}
var refreshFbBtn = document.getElementById('refreshFeedbackBtn');
if (refreshFbBtn) { refreshFbBtn.addEventListener('click', function () { loadMyFeedbacks(); }); }

function resetFbSelection() { var sa = document.getElementById('fbSelectAll'); if (sa) sa.checked = false; updateFbSelected(); }
function getFbCheckedIds() { var ids = []; document.querySelectorAll('#myFeedbackList .fb-item-check:checked').forEach(function (c) { ids.push(c.getAttribute('data-id')); }); return ids; }
function updateFbSelected() {
    var ids = getFbCheckedIds(); var btn = document.getElementById('fbDeleteSelected'); var cnt = document.getElementById('fbSelectedCount'); var sa  = document.getElementById('fbSelectAll');
    if (btn) btn.disabled = ids.length === 0;
    if (cnt) cnt.textContent = t('userDash.feedbackSelectedCountTpl', '已选 ') + ids.length + t('userDash.feedbackSelectedCountUnit', ' 条');
    if (sa) { var total = document.querySelectorAll('#myFeedbackList .fb-item-check').length; sa.checked = total > 0 && ids.length === total; }
}
function deleteFbRecords(ids, single) {
    if (!ids.length) return;
    var msg = single ? t('userDash.feedbackDeleteConfirm', '确定删除这条反馈吗？删除后不可恢复。') : t('userDash.feedbackDeleteConfirmMulti', '确定删除选中的 ') + ids.length + t('userDash.feedbackDeleteConfirmMulti2', ' 条反馈吗？删除后不可恢复。');
    confirmFb(msg).then(function (ok) {
        if (!ok) return;
        var q = supabaseClient.from('feedbacks').delete().select(); q = single ? q.eq('id', ids[0]) : q.in('id', ids);
        q.then(function (res) {
            if (res.error) { showToast('删除失败：' + res.error.message, 'error'); return; }
            if (!res.data || res.data.length === 0) { showToast('删除未生效：反馈表缺少删除权限（RLS 策略）', 'error'); loadMyFeedbacks(); return; }
            showToast(single ? '已删除该反馈' : '已删除 ' + res.data.length + ' 条反馈', 'success'); loadMyFeedbacks();
        });
    });
}
function showToast(msg, type) {
    var toast = document.getElementById('fbToast');
    if (!toast) { toast = document.createElement('div'); toast.id = 'fbToast'; toast.className = 'fb-toast'; document.body.appendChild(toast); }
    toast.className = 'fb-toast ' + (type === 'success' ? 'fb-toast-success' : type === 'error' ? 'fb-toast-error' : '');
    toast.textContent = (type === 'success' ? '✅ ' : type === 'error' ? '⚠️ ' : 'ℹ️ ') + msg;
    void toast.offsetWidth; toast.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function () { toast.classList.remove('show'); }, 2600);
}
var fbPendingResolve = null;
function confirmFb(message) {
    return new Promise(function (resolve) {
        var mask = document.getElementById('fbModalMask');
        if (!mask) {
            mask = document.createElement('div'); mask.id = 'fbModalMask'; mask.className = 'fb-modal-mask';
            mask.innerHTML = '<div class="fb-modal"><div class="fb-modal-title">⚠️ ' + t('common.confirm', '确定') + '</div><div class="fb-modal-msg"></div><div class="fb-modal-actions"><button class="fb-btn" data-act="cancel">' + t('common.cancel', '取消') + '</button><button class="fb-btn fb-btn-ok" data-act="ok">' + t('common.confirm', '确定') + '</button></div></div>';
            mask.addEventListener('click', function (e) {
                if (e.target === mask || (e.target.getAttribute && e.target.getAttribute('data-act') === 'cancel')) { mask.classList.remove('show'); if (fbPendingResolve) fbPendingResolve(false); }
                else if (e.target.getAttribute && e.target.getAttribute('data-act') === 'ok') { mask.classList.remove('show'); if (fbPendingResolve) fbPendingResolve(true); }
            });
            document.body.appendChild(mask);
        }
        mask.querySelector('.fb-modal-msg').textContent = message; fbPendingResolve = resolve; mask.classList.add('show');
    });
}
var fbSelAll = document.getElementById('fbSelectAll');
if (fbSelAll) { fbSelAll.addEventListener('change', function () { var checked = this.checked; document.querySelectorAll('#myFeedbackList .fb-item-check').forEach(function (c) { c.checked = checked; }); updateFbSelected(); }); }
var fbDelSel = document.getElementById('fbDeleteSelected');
if (fbDelSel) { fbDelSel.addEventListener('click', function () { deleteFbRecords(getFbCheckedIds(), false); }); }
var myFbList = document.getElementById('myFeedbackList');
if (myFbList) {
    myFbList.addEventListener('change', function (e) { if (e.target && e.target.classList.contains('fb-item-check')) updateFbSelected(); });
    myFbList.addEventListener('click', function (e) { var del = e.target.closest ? e.target.closest('.fb-del') : null; if (del) deleteFbRecords([del.getAttribute('data-id')], true); });
}

function refreshCheckinUI() {
    if (!currentUser) return;
    var today = toDateStr(shanghaiNow());
    Promise.all([
        supabaseClient.from('profiles').select('points, checkin_streak').eq('id', currentUser.id).maybeSingle(),
        supabaseClient.from('checkins').select('checkin_date, points').eq('user_id', currentUser.id).eq('checkin_date', today).maybeSingle()
    ]).then(function (results) {
        var p = results[0].data || {}; var todayRow = results[1].data; var hasCheckedToday = !!todayRow;
        var myPointsEl = document.getElementById('myPoints'); if (myPointsEl) myPointsEl.textContent = p.points || 0;
        var myStreakEl = document.getElementById('myStreak'); if (myStreakEl) myStreakEl.textContent = p.checkin_streak || 0;
        var btn = document.getElementById('checkinBtn');
        if (btn) {
            if (hasCheckedToday) {
                btn.textContent = t('userDash.checkinDone', '✓ 今日已签到'); btn.disabled = true;
                var todayRewardEl = document.getElementById('todayReward'); if (todayRewardEl) todayRewardEl.textContent = '+' + (todayRow.points || 0);
            } else {
                btn.textContent = t('userDash.checkinBtn', '签 到'); btn.disabled = false;
                var todayRewardEl2 = document.getElementById('todayReward'); if (todayRewardEl2) todayRewardEl2.textContent = '—';
            }
        }
        loadMyRank(currentUser.id);
    });
}
function loadMyRank(userId) {
    supabaseClient.from('profiles').select('points').eq('id', userId).maybeSingle().then(function (r) {
        if (r.error || !r.data) return;
        var myPoints = r.data.points || 0;
        Promise.all([supabaseClient.from('profiles').select('id', { count: 'exact', head: true }).gt('points', myPoints), supabaseClient.from('profiles').select('id', { count: 'exact', head: true })]).then(function (res) {
            var higher = (res[0] && res[0].count) || 0; var total  = (res[1] && res[1].count) || 0; var rank   = higher + 1;
            var el = document.getElementById('myRank'); if (el) el.textContent = rank + ' / ' + total;
        });
    });
}
var checkinBtnEl = document.getElementById('checkinBtn');
if (checkinBtnEl) {
    checkinBtnEl.addEventListener('click', function () {
        var btn = this; btn.disabled = true; btn.textContent = t('common.loading', '加载中...');
        supabaseClient.rpc('do_checkin').then(function (res) {
            if (res.error) { alert(t('userDash.checkinFail', '签到失败：') + res.error.message); btn.disabled = false; btn.textContent = t('userDash.checkinBtn', '签 到'); return; }
            var data = res.data || {};
            if (data.error) { alert(data.error); refreshCheckinUI(); loadCheckinCalendar(); return; }
            btn.textContent = t('userDash.checkinDone', '✓ 今日已签到');
            var ptsEl = document.getElementById('myPoints'); if (ptsEl) ptsEl.textContent = (parseInt(ptsEl.textContent) || 0) + (data.points || 0);
            var streakEl = document.getElementById('myStreak'); if (streakEl) streakEl.textContent = data.streak || 0;
            var rewardEl = document.getElementById('todayReward'); if (rewardEl) rewardEl.textContent = '+' + (data.points || 0);
            loadCheckinCalendar(); addPointLog(currentUser.id, data.points, '每日签到', null, parseInt(ptsEl.textContent) || 0); loadMyPointLogs(); checkAndUnlockAchievements('checkin');
            alert(t('userDash.checkinSuccess', '签到成功！') + '\n' + t('userDash.checkinGotPoints', '获得 ') + data.points + t('userDash.checkinPointsUnit', ' 积分'));
        }).catch(function (err) { alert(t('userDash.checkinFail', '签到失败：') + (err.message || err)); btn.disabled = false; btn.textContent = t('userDash.checkinBtn', '签 到'); });
    });
}

function addPointLog(userId, changeAmount, reason, relatedId, balanceAfter) {
    if (!userId || !changeAmount) return Promise.resolve();
    return supabaseClient.from('point_logs').insert([{ user_id: userId, change_amount: changeAmount, reason: reason || '积分变化', balance_after: balanceAfter != null ? balanceAfter : 0, related_id: relatedId || null }]).then(function (r) { if (r.error) console.warn('[积分日志] 写入失败：', r.error.message); });
}
function loadMyPointLogs() {
    var listEl = document.getElementById('myPointLogs');
    if (!listEl || !currentUser) return;
    listEl.innerHTML = '<div class="empty-state">' + t('common.loading', '加载中...') + '</div>';
    supabaseClient.from('point_logs').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(30)
        .then(function (res) {
            if (res.error) { listEl.innerHTML = '<div class="empty-state">' + t('common.loadFailed', '加载失败：') + escapeHtml(res.error.message) + '</div>'; return; }
            var data = res.data || [];
            if (data.length === 0) { listEl.innerHTML = '<div class="empty-state">' + t('userDash.checkinLogsEmpty', '📭 暂无积分记录') + '</div>'; return; }
            var html = '';
            data.forEach(function (log) {
                var isPlus = log.change_amount > 0; var icon = isPlus ? '📈' : '📉'; var sign = isPlus ? '+' : '';
                var time = new Date(log.created_at).toLocaleString('zh-CN', { hour12: false });
                html += '<div class="point-log-item"><div class="pl-icon ' + (isPlus ? 'plus' : 'minus') + '">' + icon + '</div><div class="pl-info"><div class="pl-reason">' + escapeHtml(log.reason) + '</div><div class="pl-time">' + time + '</div></div><div class="pl-change ' + (isPlus ? 'plus' : 'minus') + '">' + sign + log.change_amount + '</div></div>';
            });
            listEl.innerHTML = html;
        });
}
(function () {
    var btn = document.getElementById('refreshMyPointLogsBtn'); if (!btn) return;
    btn.addEventListener('click', function () { if (btn.disabled) return; btn.disabled = true; btn.classList.add('spinning'); loadMyPointLogs(); setTimeout(function () { btn.disabled = false; btn.classList.remove('spinning'); }, 800); });
})();

function refreshDynamicText() {
    try { loadCheckinCalendar(); } catch (e) {}
    try {
        var shopCard = document.getElementById('cardShop'); if (shopCard && shopCard.classList.contains('active')) loadShop();
        var friendsCard = document.getElementById('cardFriends'); if (friendsCard && friendsCard.classList.contains('active')) loadFriends();
        var annCard = document.getElementById('cardAnnounce'); if (annCard && annCard.classList.contains('active')) loadAnnouncements();
        var wallCard = document.getElementById('cardWall'); if (wallCard && wallCard.classList.contains('active') && typeof loadWall === 'function') loadWall();
        var fbCard = document.getElementById('cardFeedback'); if (fbCard && fbCard.classList.contains('active')) loadMyFeedbacks();
        var logEl = document.getElementById('myPointLogs'); if (logEl) loadMyPointLogs();
    } catch (e) {}
}
window.refreshDynamicText = refreshDynamicText;

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function loadShop() {
    if (!currentUser) return;
    var shopPointsEl = document.getElementById('shopMyPoints');
    if (shopPointsEl) { supabaseClient.from('profiles').select('points').eq('id', currentUser.id).maybeSingle().then(function (r) { var p = (r.data && r.data.points) || 0; shopPointsEl.textContent = t('userDash.shopMyPoints', '积分：') + p; }); }
    var grid = document.getElementById('shopGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="empty-state">' + t('common.loading', '加载中...') + '</div>';
    supabaseClient.from('shop_items').select('*').eq('is_active', true).order('sort_order', { ascending: true }).order('created_at', { ascending: false })
        .then(function (res) {
            if (res.error) { grid.innerHTML = '<div class="empty-state">' + t('common.loadFailed', '加载失败：') + escapeHtml(res.error.message) + '</div>'; return; }
            var items = res.data || [];
            if (items.length === 0) { grid.innerHTML = '<div class="empty-state">' + t('userDash.shopEmpty', '暂时没有商品') + '</div>'; return; }
            var html = '';
            items.forEach(function (it) {
                var soldOut = (it.stock === 0); var stockTag = '';
                if (it.stock > 0) stockTag = '<span class="shop-item-stock">' + t('userDash.shopStockLeft', '仅剩 ') + it.stock + '</span>';
                else if (it.stock === 0) stockTag = '<span class="shop-item-stock">' + t('userDash.shopSoldOut', '已售罄') + '</span>';
                var limitTag = ''; if (it.per_user_limit != null && it.per_user_limit > 0) limitTag = '<div class="shop-item-limit">' + t('userDash.shopLimitPerUser', '每人限购 ') + it.per_user_limit + t('userDash.shopLimitUnit', ' 份') + '</div>';
                html += '<div class="shop-item' + (soldOut ? ' out-of-stock' : '') + '" data-id="' + it.id + '">' + stockTag + '<div class="shop-item-icon">' + escapeHtml(it.icon || '🎁') + '</div><div class="shop-item-name">' + escapeHtml(it.name) + '</div><div class="shop-item-desc">' + escapeHtml(it.description || '') + '</div>' + limitTag + '<div class="shop-item-price">' + it.price + t('userDash.shopPointsUnit', ' 积分') + '</div><button class="shop-buy-btn" data-id="' + it.id + '" data-name="' + escapeHtml(it.name) + '" data-price="' + it.price + '"' + (soldOut ? ' disabled' : '') + '>' + (soldOut ? t('userDash.shopSoldOut', '已售罄') : t('userDash.shopBuyNow', '立即兑换')) + '</button></div>';
            });
            grid.innerHTML = html;
            grid.querySelectorAll('.shop-buy-btn').forEach(function (btn) { btn.addEventListener('click', function () { var id = this.getAttribute('data-id'); var name = this.getAttribute('data-name'); var price = parseInt(this.getAttribute('data-price'), 10); doPurchase(id, name, price); }); });
        });
    var hist = document.getElementById('shopHistory');
    if (!hist) return;
    hist.innerHTML = '<div class="empty-state">' + t('common.loading', '加载中...') + '</div>';
    supabaseClient.from('user_purchases').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(20)
        .then(function (res) {
            if (res.error) { hist.innerHTML = '<div class="empty-state">' + t('common.loadFailed', '加载失败：') + '</div>'; return; }
            var list = res.data || [];
            if (list.length === 0) { hist.innerHTML = '<div class="empty-state">' + t('userDash.shopHistoryEmpty', '暂无记录') + '</div>'; return; }
            var h = '';
            list.forEach(function (p) {
                var time = new Date(p.created_at).toLocaleString('zh-CN', { hour12: false });
                h += '<div class="shop-history-item" style="cursor:pointer;" data-id="' + p.id + '" data-name="' + escapeHtml(p.item_name  || t('userDash.detailUnknown', '未知商品')) + '" data-icon="' + escapeHtml(p.item_icon  || '🎁') + '" data-image="' + escapeHtml(p.item_image || '') + '" data-detail="' + escapeHtml(p.item_detail || t('userDash.detailNoDetail', '暂无详情')) + '" data-price="' + (p.price_paid || 0) + '" data-time="' + time + '"><span class="h-icon">' + escapeHtml(p.item_icon || '🎁') + '</span><div class="h-info"><div class="h-name">' + escapeHtml(p.item_name || t('userDash.detailUnknown', '未知商品')) + '</div><div class="h-time">' + time + '</div></div><span class="h-price">-' + (p.price_paid || 0) + '</span></div>';
            });
            hist.innerHTML = h;
            hist.querySelectorAll('.shop-history-item').forEach(function (el) {
                el.addEventListener('click', function () {
                    var id = this.getAttribute('data-id'); var name = this.getAttribute('data-name'); var icon = this.getAttribute('data-icon'); var image = this.getAttribute('data-image'); var detail = this.getAttribute('data-detail'); var price = this.getAttribute('data-price'); var time = this.getAttribute('data-time');
                    document.getElementById('detailName').textContent  = name; document.getElementById('detailPrice').textContent = '-' + price; document.getElementById('detailTime').textContent  = time; document.getElementById('detailDesc').textContent  = detail; document.getElementById('detailDeleteBtn').dataset.purchaseId = id;
                    var imgEl = document.getElementById('detailImage'); var fallbackEl = document.getElementById('detailIconFallback');
                    if (image) { imgEl.src = image; imgEl.style.display = 'block'; fallbackEl.style.display = 'none'; }
                    else { imgEl.style.display = 'none'; fallbackEl.style.display = 'flex'; fallbackEl.textContent = icon; }
                    document.getElementById('itemDetailModal').style.display = 'flex';
                });
            });
        });
}

function doPurchase(itemId, itemName, price) {
    if (!currentUser) return;
    var topPointsEl = document.getElementById('shopMyPoints');
    var currentPoints = topPointsEl ? (parseInt((topPointsEl.textContent || '').replace(/\D/g, ''), 10) || 0) : 999999;
    if (currentPoints < price) { alert(t('userDash.shopInsufficientPoints', '积分不足，还差 ') + (price - currentPoints) + t('userDash.shopPointUnit', ' 分')); return; }
    var confirmMsg = t('userDash.shopConfirmBuy', '确定用 ') + price + t('userDash.shopConfirmBuy2', ' 积分兑换「') + itemName + t('userDash.shopConfirmBuy3', '」吗？');
    if (!confirm(confirmMsg)) return;
    supabaseClient.rpc('purchase_item', { p_item_id: itemId }).then(function (res) {
        if (res.error) { alert(t('userDash.shopBuyFail', '兑换失败：') + res.error.message); return; }
        var data = res.data || {};
        if (data.error) { alert(data.error); return; }
        if (typeof data.newPoints === 'number') {
            if (topPointsEl) topPointsEl.textContent = t('userDash.shopMyPoints', '积分：') + data.newPoints;
            var myPts = document.getElementById('myPoints'); if (myPts) myPts.textContent = data.newPoints;
        }
        addPointLog(currentUser.id, -data.points, t('adminDash.purchasesTitle', '兑换：') + itemName, null, data.newPoints);
        checkAndUnlockAchievements('purchase');
        alert(t('userDash.shopBuySuccess', '兑换成功！') + '\n' + t('userDash.shopCost', '消耗 ') + data.points + t('userDash.shopPointsUnit', ' 积分') + '\n' + t('userDash.shopRemain', '剩余 ') + data.newPoints + t('userDash.shopPointsUnit', ' 积分'));
        loadShop();
    }).catch(function (err) { alert(t('userDash.shopBuyFail', '兑换失败：') + (err.message || err)); });
}
(function () {
    var b = document.getElementById('refreshUserShopBtn'); if (!b) return;
    b.addEventListener('click', function () { b.classList.add('spinning'); loadShop(); setTimeout(function () { b.classList.remove('spinning'); }, 500); });
})();

var friendsCache = []; var currentChatFriend = null; var chatPollTimer = null; var lastMsgTs = null; var chatMsgCache = []; var currentReplyMsg = null; var activeContextMsgId = null;
function loadFriends() {
    if (!currentUser) return;
    var pendingList = document.getElementById('pendingList'); var friendList  = document.getElementById('friendList'); var badge       = document.getElementById('badgeFriends');
    if (!pendingList || !friendList) return;
    pendingList.innerHTML = '<div class="empty-state">' + t('common.loading', '加载中...') + '</div>';
    friendList.innerHTML  = '<div class="empty-state">' + t('common.loading', '加载中...') + '</div>';
    supabaseClient.from('friendships').select('*').or('user_id.eq.' + currentUser.id + ',friend_id.eq.' + currentUser.id)
        .then(function (res) {
            if (res.error) { pendingList.innerHTML = '<div class="empty-state">' + t('common.loadFailed', '加载失败：') + escapeHtml(res.error.message) + '</div>'; friendList.innerHTML  = '<div class="empty-state">' + t('common.loadFailed', '加载失败：') + '</div>'; return; }
            var all = res.data || []; var pendingFromOthers = []; var friendIds = [];
            all.forEach(function (f) { if (f.status === 'pending' && f.friend_id === currentUser.id) { pendingFromOthers.push(f); } else if (f.status === 'accepted') { friendIds.push(f.user_id === currentUser.id ? f.friend_id : f.user_id); } });
            if (badge) badge.textContent = friendIds.length + t('userDash.friendsBadge', ' 位好友');
            if (pendingFromOthers.length > 0) { if(typeof showFriendRequestBanner === 'function') showFriendRequestBanner(pendingFromOthers.length); }
            var allIds = friendIds.concat(pendingFromOthers.map(function (f) { return f.user_id; }));
            if (allIds.length === 0) { pendingList.innerHTML = '<div class="empty-state">' + t('userDash.friendsPendingEmpty', '暂无待处理的请求') + '</div>'; friendList.innerHTML  = '<div class="empty-state">' + t('userDash.friendsEmpty', '还没有好友，输入邮箱添加吧~') + '</div>'; return; }
            supabaseClient.from('profiles').select('id, email, full_name, avatar_url').in('id', allIds)
                .then(function (pRes) {
                    var map = {}; (pRes.data || []).forEach(function (p) { map[p.id] = p; });
                    if (pendingFromOthers.length === 0) { pendingList.innerHTML = '<div class="empty-state">' + t('userDash.friendsPendingEmpty', '暂无待处理的请求') + '</div>'; }
                    else {
                        var ph = ''; pendingFromOthers.forEach(function (f) { var u = map[f.user_id] || {}; ph += renderFriendItem(u, f.id, true); });
                        pendingList.innerHTML = ph; bindPendingActions();
                    }
                    friendsCache = friendIds.map(function (id) { return map[id]; }).filter(Boolean);
                    if (friendsCache.length === 0) { friendList.innerHTML = '<div class="empty-state">' + t('userDash.friendsEmpty', '还没有好友，输入邮箱添加吧~') + '</div>'; }
                    else {
                        var fh = ''; friendsCache.forEach(function (u) { fh += renderFriendItem(u, null, false); });
                        friendList.innerHTML = fh;
                    }
                });
        });
}
function renderFriendItem(user, fsId, isPending) {
    var avatar = user.avatar_url || DEFAULT_AVATAR; var name = user.full_name || user.email || '未知'; var email = user.email || '';
    if (isPending) return '<div class="friend-item pending" data-fsid="' + fsId + '" data-uid="' + user.id + '"><img src="' + escapeHtml(avatar) + '" onerror="this.src=\'' + DEFAULT_AVATAR + '\'"><div class="friend-info"><div class="friend-name">' + escapeHtml(name) + '</div><div class="friend-email">' + escapeHtml(email) + '</div></div><div class="friend-actions"><button class="accept-btn">' + t('userDash.friendsAccept', '同意') + '</button><button class="reject-btn">' + t('userDash.friendsReject', '拒绝') + '</button></div></div>';
    return '<div class="friend-item" onclick="window.openChatById(\'' + user.id + '\')" style="cursor:pointer;"><img src="' + escapeHtml(avatar) + '" onerror="this.src=\'' + DEFAULT_AVATAR + '\'"><div class="friend-info"><div class="friend-name">' + escapeHtml(name) + '</div><div class="friend-email">' + escapeHtml(email) + '</div></div><div class="friend-arrow">💬</div></div>';
}
function bindPendingActions() {
    document.querySelectorAll('#pendingList .friend-item.pending').forEach(function (item) {
        var fsId = item.getAttribute('data-fsid');
        item.querySelector('.accept-btn').addEventListener('click', function () { supabaseClient.from('friendships').update({ status: 'accepted' }).eq('id', fsId).then(function (r) { if (r.error) { alert(t('common.fail', '操作失败') + '：' + r.error.message); return; } loadFriends(); }); });
        item.querySelector('.reject-btn').addEventListener('click', function () { if (!confirm(t('userDash.friendsRejectConfirm', '确定拒绝该好友请求吗？'))) return; supabaseClient.from('friendships').delete().eq('id', fsId).then(function (r) { if (r.error) { alert(t('common.fail', '操作失败') + '：' + r.error.message); return; } loadFriends(); }); });
    });
}
window.openChatById = function(uid) {
    var friend = friendsCache.find(function (u) { return String(u.id) === String(uid); });
    if (friend) openChat(friend);
    else { supabaseClient.from('profiles').select('*').eq('id', uid).maybeSingle().then(function(res) { if (res.data) openChat(res.data); else alert('找不到该用户的信息'); }); }
};
function openChat(friend) {
    currentChatFriend = friend; lastMsgTs = null; currentReplyMsg = null; hideReplyPreview();
    var modal = document.getElementById('chatModal'); if (modal) modal.style.display = 'flex';
    document.getElementById('chatFriendName').textContent = friend.full_name || friend.email || '未知好友';
    document.getElementById('chatFriendAvatar').src = friend.avatar_url || DEFAULT_AVATAR;
    document.getElementById('chatBody').innerHTML = '<div class="empty-state">' + t('common.loading', '加载中...') + '</div>';
    loadMessages();
    if (chatPollTimer) clearInterval(chatPollTimer); chatPollTimer = setInterval(loadMessages, 3000);
    setTimeout(function () { document.getElementById('chatInput').focus(); }, 100);
}
function loadMessages() {
    if (!currentUser || !currentChatFriend) return;
    supabaseClient.from('messages').select('*').or('and(from_user.eq.' + currentUser.id + ',to_user.eq.' + currentChatFriend.id + '),and(from_user.eq.' + currentChatFriend.id + ',to_user.eq.' + currentUser.id + ')').order('created_at', { ascending: true })
        .then(function (res) {
            if (res.error) return;
            var data = res.data || []; chatMsgCache = data; var body = document.getElementById('chatBody'); if (!body) return;
            if (data.length === 0) { body.innerHTML = '<div class="empty-state">' + t('userDash.chatEmpty', '还没有聊天记录，说点什么吧~') + '</div>'; return; }
            var latestFromFriend = null;
            data.forEach(function (m) { if (m.from_user !== currentUser.id && !m.is_recalled) { if (!latestFromFriend || new Date(m.created_at) > new Date(latestFromFriend)) latestFromFriend = m.created_at; } });
            if (latestFromFriend) { var isFirst = (lastMsgTs === null); if (!isFirst && new Date(latestFromFriend) > new Date(lastMsgTs)) { if (window.LoginSound && window.LoginSound.playMessageIfEnabled) window.LoginSound.playMessageIfEnabled(); } lastMsgTs = latestFromFriend; }
            var html = '';
            data.forEach(function (m) {
                var mine = m.from_user === currentUser.id; var time = new Date(m.created_at).toLocaleString('zh-CN', { hour12: false, month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
                if (m.is_recalled) { html += '<div class="chat-msg recalled">' + (mine ? '你' : '对方') + '撤回了一条消息</div>'; return; }
                var quoteHtml = '';
                if (m.reply_to_id) { var quoted = chatMsgCache.find(function(x){ return x.id === m.reply_to_id; }); if (quoted) { var qName = quoted.from_user === currentUser.id ? '你' : '对方'; var qText = quoted.is_recalled ? '[已撤回]' : quoted.content; quoteHtml = '<div class="msg-quote-block">' + qName + '：' + escapeHtml(qText) + '</div>'; } }
                html += '<div class="chat-msg ' + (mine ? 'mine' : 'theirs') + '" data-id="' + m.id + '" data-mine="' + mine + '" data-time="' + new Date(m.created_at).getTime() + '">' + quoteHtml + '<div class="msg-text">' + escapeHtml(m.content) + '</div><span class="chat-time">' + time + '</span></div>';
            });
            body.innerHTML = html; body.scrollTop = body.scrollHeight;
            var unreadIds = data.filter(function (m) { return m.to_user === currentUser.id && !m.is_read && !m.is_recalled; }).map(function (m) { return m.id; });
            if (unreadIds.length > 0) { supabaseClient.from('messages').update({ is_read: true }).in('id', unreadIds).then(function () {}); }
            bindMsgEvents();
        });
}
var pressTimer;
function bindMsgEvents() {
    document.querySelectorAll('.chat-msg:not(.recalled)').forEach(function(msgEl) {
        msgEl.addEventListener('touchstart', function(e) { var id = this.getAttribute('data-id'); pressTimer = setTimeout(function() { showContextMenu(e.touches[0].clientX, e.touches[0].clientY, id); }, 500); }, { passive: true });
        msgEl.addEventListener('touchend', function() { clearTimeout(pressTimer); });
        msgEl.addEventListener('touchmove', function() { clearTimeout(pressTimer); });
        msgEl.addEventListener('contextmenu', function(e) { e.preventDefault(); var id = this.getAttribute('data-id'); showContextMenu(e.clientX, e.clientY, id); });
    });
}
function showContextMenu(x, y, msgId) {
    activeContextMsgId = msgId; var menu = document.getElementById('chatContextMenu'); var msg = chatMsgCache.find(function(m){ return m.id == msgId; }); if (!msg) return;
    var isMine = msg.from_user === currentUser.id; var timeLimit = (Date.now() - new Date(msg.created_at).getTime()) < 2 * 60 * 1000;
    var btnRecall = document.getElementById('menuRecall'); if (isMine && timeLimit) btnRecall.style.display = 'flex'; else btnRecall.style.display = 'none';
    if (x + 120 > window.innerWidth) x = window.innerWidth - 120; if (y + 100 > window.innerHeight) y = window.innerHeight - 100;
    menu.style.left = x + 'px'; menu.style.top = y + 'px'; menu.style.display = 'block';
}
document.addEventListener('click', function() { document.getElementById('chatContextMenu').style.display = 'none'; });
document.addEventListener('scroll', function() { document.getElementById('chatContextMenu').style.display = 'none'; }, true);
document.getElementById('menuReply').addEventListener('click', function() {
    var msg = chatMsgCache.find(function(m){ return m.id == activeContextMsgId; });
    if (msg) { currentReplyMsg = msg; document.getElementById('replyPreviewName').textContent = (msg.from_user === currentUser.id ? '你' : '对方'); document.getElementById('replyPreviewText').textContent = msg.content; document.getElementById('replyPreviewBox').style.display = 'flex'; document.getElementById('chatInput').focus(); }
});
document.getElementById('cancelReplyBtn').addEventListener('click', hideReplyPreview);
function hideReplyPreview() { currentReplyMsg = null; document.getElementById('replyPreviewBox').style.display = 'none'; }
document.getElementById('menuRecall').addEventListener('click', function() {
    if (!activeContextMsgId) return; if (!confirm('确定要撤回这条消息吗？')) return;
    supabaseClient.from('messages').update({ is_recalled: true }).eq('id', activeContextMsgId).then(function(res) { if (res.error) { alert('撤回失败：' + res.error.message); return; } loadMessages(); });
});
function sendMessage() {
    if (!currentUser || !currentChatFriend) return; var input = document.getElementById('chatInput'); var content = input.value.trim(); if (!content) return;
    var btn = document.getElementById('chatSendBtn'); btn.disabled = true;
    var payload = { from_user: currentUser.id, to_user: currentChatFriend.id, content: content }; if (currentReplyMsg) payload.reply_to_id = currentReplyMsg.id;
    supabaseClient.from('messages').insert([payload]).then(function (res) { btn.disabled = false; if (res.error) { alert(t('userDash.chatSendFail', '发送失败：') + res.error.message); return; } input.value = ''; hideReplyPreview(); loadMessages(); });
}
document.getElementById('chatSendBtn').addEventListener('click', sendMessage);
document.getElementById('chatInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') sendMessage(); });
function closeChat() { var chatModalEl = document.getElementById('chatModal'); if (chatModalEl) chatModalEl.style.display = 'none'; if (chatPollTimer) { clearInterval(chatPollTimer); chatPollTimer = null; } currentChatFriend = null; lastMsgTs = null; }
document.getElementById('chatCloseBtn').addEventListener('click', closeChat);
document.getElementById('chatModal').addEventListener('click', function(e) { if (e.target === this) closeChat(); });

document.addEventListener('DOMContentLoaded', function () {
    var avatarBtn = document.getElementById('avatarChangeBtn'); var avatarInput = document.getElementById('avatarInput');
    if (avatarBtn && avatarInput) { avatarBtn.onclick = function () { avatarInput.click(); }; }
    if (avatarInput) {
        avatarInput.onchange = function (e) {
            var file = e.target.files[0]; if (!file) return;
            if (file.size > 5 * 1024 * 1024) { alert('头像文件大小不能超过 5 MB！'); this.value = ''; return; }
            if (!file.type.startsWith('image/')) { alert('请上传图片文件！'); this.value = ''; return; }
            var btn = document.getElementById('avatarChangeBtn'); var oldText = btn ? btn.innerHTML : ''; if (btn) { btn.innerHTML = '上传中...'; btn.disabled = true; }
            supabaseClient.auth.getUser().then(function (userRes) {
                if (userRes.error || !userRes.data.user) { alert('获取用户信息失败'); return; }
                var userId = userRes.data.user.id; var fileExt = file.name.split('.').pop(); var filePath = userId + '/' + Date.now() + '.' + fileExt;
                supabaseClient.storage.from('avatars').upload(filePath, file, { upsert: true })
                    .then(function (uploadRes) { if (uploadRes.error) { alert('头像上传失败：' + uploadRes.error.message); return; } return supabaseClient.storage.from('avatars').createSignedUrl(filePath, 60*60*24*365*10); })
                    .then(function (signRes) {
                        if (!signRes || signRes.error) return; var signedUrl = signRes.data.signedUrl;
                        return supabaseClient.auth.updateUser({ data: { avatar_url: signedUrl } })
                            .then(function () { return supabaseClient.from('profiles').update({ avatar_url: signedUrl }).eq('id', userId); })
                            .then(function () { var img1 = document.getElementById('avatarImg'); var img2 = document.getElementById('welcomeAvatar'); if (img1) img1.src = signedUrl; if (img2) img2.src = signedUrl; alert('头像更新成功！'); });
                    }).finally(function() { if (btn) { btn.innerHTML = oldText; btn.disabled = false; } avatarInput.value = ''; });
            });
        };
    }
    var logoutButton = document.getElementById('logoutBtn');
    if (logoutButton) { logoutButton.onclick = function () { if (confirm('确定要退出登录吗？')) { if (window.supabaseClient) { window.supabaseClient.auth.signOut().then(function () { location.href = 'index.html'; }); } else { location.href = 'index.html'; } } }; }
});