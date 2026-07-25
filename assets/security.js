/* ============================================================== *
 *  注意：本文件包含强力反调试逻辑（暴力摧毁窗口与无限重载）。
 *  在本地编写代码、调试时，请务必去 /index.html 中将本 JS 注释掉！
 *  请勿在调试状态引入此文件，否则会导致本地调试环境彻底无法使用！
 * ============================================================== */

(function() {
    "use strict";

    // =========================================================================
    // 【反调试区块 1】：暴力监测窗口尺寸与强制重载逻辑
    // 当用户打开 F12 开发者工具时，浏览器窗口的外宽/内宽、外高/内高会产生巨大差异。
    // 此逻辑每秒检测一次，一旦发现疑似调试工具开启，立即清空页面并无限重载。
    // =========================================================================
    /*function antiDebugCheck() {
        // 设置一个极高的阈值 (F12打开通常会产生 200px 以上的差异)
        var threshold = 100; 

        var widthDiff = window.outerWidth - window.innerWidth;
        var heightDiff = window.outerHeight - window.innerHeight;

        // 一旦发现内外尺寸差异过大，触发暴力防御
        if (widthDiff > threshold || heightDiff > threshold) {
            // 第一步：立即清除页面所有内容，防止数据留存
            document.body.innerHTML = '';
            document.head.innerHTML = '';
            
            // 第二步：强制中断所有现有 JS 运行
            throw new Error('防调试触发：已切断环境');
            
            // 第三步：1秒后强制重载页面，让用户根本无法在工具里点击查看
            // (即使工具拦截了重载，由于上方页面被清空，调试器依然无用)
            setTimeout(function() {
                window.location.reload();
            }, 1000);
        }
    }

    // 尝试使用更密集的轮询（1秒1次），增加破译难度
    try {
        setInterval(antiDebugCheck, 1000);
    } catch (e) {
        // 如果有人在控制台试图拦截 setInterval，我们什么也不做，静默失效。
    }


    // =========================================================================
    // 【反调试区块 2】：清空控制台
    // 打开工具后，强行清理控制台输出，防止信息泄露
    // =========================================================================
    try {
     setInterval(function() {
           console.clear();
       }, 2000);
    } catch (e) {}*/


    // =========================================================================
    // 【防御区块 3】：防 F12 快捷键、防 Ctrl+Shift+I 等键盘监听
    // 拦截用户试图通过键盘直接呼出控制台的操作
    // =========================================================================
    document.addEventListener('keydown', function(e) {
        // 禁用 F12
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
        // 禁用 Ctrl+Shift+I (检查)
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
            e.preventDefault();
            return false;
        }
        // 禁用 Ctrl+Shift+J (控制台)
        if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
            e.preventDefault();
            return false;
        }
        // 禁用 Ctrl+U (查看源代码)
        if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
            e.preventDefault();
            return false;
        }
    });


    // =========================================================================
    // 【交互区块 4】：自定义毛玻璃右键菜单
    // 覆盖原生右键菜单，提供极简的“复制、全选、模块跳转”功能
    // =========================================================================
    
    // 禁止右键点击时出现浏览器原生菜单
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showCustomMenu(e.clientX, e.clientY);
    });

    // 点击页面任何其他位置，自动关闭菜单
    document.addEventListener('click', function(e) {
        var menu = document.getElementById('custom-context-menu');
        if (menu && !menu.contains(e.target)) {
            menu.style.display = 'none';
        }
    });

    // 渲染自定义菜单
    function showCustomMenu(x, y) {
        var menu = document.getElementById('custom-context-menu');
        if (!menu) {
            menu = document.createElement('div');
            menu.id = 'custom-context-menu';
            menu.className = 'context-menu-glass';
            document.body.appendChild(menu);
        }

        menu.innerHTML = `
            <div class="menu-item" data-action="copy"><i class="fa-regular fa-copy"></i> 复制</div>
            <div class="menu-item" data-action="select-all"><i class="fa-regular fa-square-check"></i> 全选</div>
            <div class="menu-divider"></div>
            <div class="menu-item" data-action="goto-home"><i class="fa-solid fa-house"></i> 跳转首页</div>
            <div class="menu-item" data-action="goto-categories"><i class="fa-solid fa-layer-group"></i> 跳转分类</div>
            <div class="menu-item" data-action="goto-settings"><i class="fa-solid fa-gear"></i> 跳转设置</div>
        `;

        // 绑定点击事件
        menu.querySelectorAll('.menu-item').forEach(function(item) {
            item.onclick = function(e) {
                e.stopPropagation();
                var action = this.dataset.action;
                handleMenuAction(action);
                menu.style.display = 'none';
            };
        });

        // 计算位置，防止超出屏幕
        var menuWidth = 160;
        var menuHeight = 220;
        var left = x;
        var top = y;

        if (x + menuWidth > window.innerWidth) {
            left = window.innerWidth - menuWidth - 10;
        }
        if (y + menuHeight > window.innerHeight) {
            top = window.innerHeight - menuHeight - 10;
        }

        menu.style.left = left + 'px';
        menu.style.top = top + 'px';
        menu.style.display = 'block';
    }

    // 菜单动作处理
    function handleMenuAction(action) {
        switch (action) {
            case 'copy':
                var selection = window.getSelection();
                if (selection.toString().length > 0) {
                    navigator.clipboard.writeText(selection.toString()).then(function() {
                        showFloatingToast('已复制到剪贴板');
                    }).catch(function() {
                        document.execCommand('copy');
                        showFloatingToast('已复制到剪贴板');
                    });
                } else {
                    showFloatingToast('未选中任何内容');
                }
                break;
            case 'select-all':
                document.execCommand('selectAll', false, null);
                showFloatingToast('已全选');
                break;
            case 'goto-home':
                triggerNavigation('home');
                break;
            case 'goto-categories':
                triggerNavigation('categories');
                break;
            case 'goto-settings':
                triggerNavigation('settings');
                break;
        }
    }

    // 触发全局路由跳转
    function triggerNavigation(moduleName) {
        var targetLi = document.querySelector('[data-module="' + moduleName + '"]');
        if (targetLi) {
            targetLi.click();
        } else if (window.loadModule) {
            window.loadModule(moduleName);
        }
    }

    // 全局轻提示 (Toast)
    function showFloatingToast(msg) {
        var toast = document.getElementById('custom-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'custom-toast';
            toast.className = 'glass-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.style.display = 'block';
        toast.style.opacity = '1';
        
        clearTimeout(toast._timer);
        toast._timer = setTimeout(function() {
            toast.style.opacity = '0';
            setTimeout(function() {
                toast.style.display = 'none';
            }, 300);
        }, 2000);
    }

})();