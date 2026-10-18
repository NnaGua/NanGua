/* ============================================================
 * 拖拽模块 · 独立脚本
 * 特性：
 *   - 每次刷新默认在屏幕正中央
 *   - 只能在屏幕可视区域（边界框）内拖动，绝对飞不出去
 *   - 排除输入框、按钮等元素的干扰
 *   - 支持鼠标 + 触屏
 * ============================================================ */
(function () {
    'use strict';

    var EXCLUDE = 'button, a, input, textarea, select, option, label, [data-no-drag]';

    function getPoint(e) {
        if (e.touches && e.touches.length) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    }

    function makeDraggable(el) {
        var offsetX = 0;
        var offsetY = 0;
        var startX  = 0;
        var startY  = 0;
        var dragging = false;

        var handleSel = el.getAttribute('data-drag-handle');
        var handle = handleSel ? el.querySelector(handleSel) : el;

        // 每次加载强制归零，回到最初的正中央
        el.style.setProperty('--drag-x', '0px');
        el.style.setProperty('--drag-y', '0px');

        // 记录元素在最开始（无偏移）时的基准位置和尺寸
        var baseLeft = 0, baseTop = 0, elWidth = 0, elHeight = 0;

        function updateBaseRect() {
            // 临时归零获取真实位置
            var tempX = el.style.getPropertyValue('--drag-x');
            var tempY = el.style.getPropertyValue('--drag-y');
            el.style.setProperty('--drag-x', '0px');
            el.style.setProperty('--drag-y', '0px');

            var rect = el.getBoundingClientRect();
            baseLeft = rect.left;
            baseTop = rect.top;
            elWidth = rect.width;
            elHeight = rect.height;

            // 恢复
            el.style.setProperty('--drag-x', tempX);
            el.style.setProperty('--drag-y', tempY);
        }

        // 初始化及窗口大小改变时，重新计算基准
        setTimeout(updateBaseRect, 100);
        window.addEventListener('resize', updateBaseRect);

        function onDown(e) {
            var target = e.target;
            if (target.closest && target.closest(EXCLUDE)) return;
            if (handleSel && (!handle || !handle.contains(target))) return;

            updateBaseRect(); // 按下时再确认一次基准尺寸

            dragging = true;
            var pt = getPoint(e);
            startX = pt.x;
            startY = pt.y;

            el.classList.add('is-dragging');
            document.body.classList.add('dragging-active');
            e.preventDefault();
        }

        function onMove(e) {
            if (!dragging) return;
            var pt = getPoint(e);

            // 计算理论上的新偏移
            var newOffsetX = offsetX + (pt.x - startX);
            var newOffsetY = offsetY + (pt.y - startY);

            // 计算允许的最大、最小偏移量（硬边界）
            var minX = -baseLeft;
            var maxX = window.innerWidth - baseLeft - elWidth;
            
            var minY = -baseTop;
            var maxY = window.innerHeight - baseTop - elHeight;

            // 强制限制在边界内
            if (newOffsetX < minX) newOffsetX = minX;
            if (newOffsetX > maxX) newOffsetX = maxX;

            if (newOffsetY < minY) newOffsetY = minY;
            if (newOffsetY > maxY) newOffsetY = maxY;

            // 更新当前偏移量
            offsetX = newOffsetX;
            offsetY = newOffsetY;

            // 更新鼠标/触摸起点（防止累加导致拖拽失灵）
            startX = pt.x;
            startY = pt.y;

            el.style.setProperty('--drag-x', offsetX + 'px');
            el.style.setProperty('--drag-y', offsetY + 'px');
            e.preventDefault();
        }

        function onUp() {
            if (!dragging) return;
            dragging = false;
            el.classList.remove('is-dragging');
            document.body.classList.remove('dragging-active');
        }

        el.addEventListener('mousedown', onDown);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);

        el.addEventListener('touchstart', onDown, { passive: false });
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onUp);
        document.addEventListener('touchcancel', onUp);
    }

    function init() {
        document.querySelectorAll('[data-draggable]').forEach(makeDraggable);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();