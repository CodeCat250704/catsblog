/* ==========================================================
 * 【全能交互引擎 - 稳固响应版】
 * 职能：语言切换菜单、猫开始菜单、11项右键菜单
 * ========================================================== */

(function() {
    "use strict";

    // --- 1. 定义您支持的语言列表 ---
    var LANG_LIST = [
        { code: "zh-CN", name: "简体中文" },
        { code: "zh-TW", name: "繁體中文" },
        { code: "en", name: "English" },
        { code: "ja", name: "日本語" },
        { code: "ru", name: "Русский" },
        { code: "es", name: "Español" },
        { code: "fr", name: "Français" }
    ];

    // 样式字典（统一所有菜单的毛玻璃质感）
    var STYLE_BASE = "position:fixed; padding:6px 0; display:none; z-index:99999; background: rgba(20, 20, 30, 0.9); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color:#fff; font:14px sans-serif; box-shadow: 0 10px 30px rgba(0,0,0,0.4);";

    function createMenu(id, width) {
        var m = document.getElementById(id);
        if (!m) {
            m = document.createElement("div");
            m.id = id;
            m.style.cssText = STYLE_BASE + "width:" + width + "px;";
            document.body.appendChild(m);
        }
        return m;
    }

    function bindMenu(menu) {
        menu.querySelectorAll(".menu-item").forEach(function(el) {
            el.style.cssText = "padding:10px 20px; cursor:pointer; display:block; transition:0.15s;";
            el.onmouseenter = function() { this.style.background = "rgba(255,255,255,0.1)"; };
            el.onmouseleave = function() { this.style.background = "transparent"; };
            el.onclick = function(e) {
                e.stopPropagation();
                handleAction(this.getAttribute("data-action"));
                menu.style.display = "none";
            };
        });
    }

    // ==========================================================
    // 【功能 1：猫开始菜单】
    // ==========================================================
    var startBtn = document.getElementById("start-menu-btn");
    if (startBtn) {
        startBtn.onclick = function(e) {
            e.stopPropagation();
            var menu = createMenu("start-context-menu", "160px");
            menu.innerHTML = `
                <div class="menu-item" data-action="goto-home">首页</div>
                <div class="menu-item" data-action="goto-categories">分类</div>
                <div class="menu-item" data-action="goto-collection">收藏</div>
                <div class="menu-item" data-action="goto-notice">通知</div>
                <div class="menu-item" data-action="goto-co-create">共创</div>
                <div class="menu-item" data-action="goto-submit">投稿</div>
                <div class="menu-item" data-action="goto-about">关于</div>
                <div class="menu-divider" style="height:1px; background:rgba(255,255,255,0.1); margin:4px 16px;"></div>
                <div class="menu-item" data-action="toggle-dark">切换深色模式</div>
                <div class="menu-item" data-action="refresh-page">刷新页面</div>
                <div class="menu-item" data-action="goto-settings">设置</div>
            `;

            var rect = this.getBoundingClientRect();
            var top = rect.top - 320; var left = rect.left - 60;
            if (top < 20) top = 20; if (left + 160 > window.innerWidth) left = window.innerWidth - 170;
            menu.style.top = top + "px"; menu.style.left = left + "px";
            bindMenu(menu);
            menu.style.display = "block";
        };
    }

    // ==========================================================
    // 【功能 2：右键菜单】
    // ==========================================================
    document.addEventListener("contextmenu", function(e) {
        e.preventDefault();
        var menu = createMenu("custom-context-menu", "150px");
        menu.innerHTML = `
            <div class="menu-item" data-action="copy">复制</div>
            <div class="menu-item" data-action="select-all">全选</div>
            <div class="menu-divider" style="height:1px; background:rgba(255,255,255,0.15); margin:4px 16px;"></div>
            <div class="menu-item" data-action="goto-home">首页</div>
            <div class="menu-item" data-action="goto-categories">分类</div>
            <div class="menu-item" data-action="goto-collection">收藏</div>
            <div class="menu-item" data-action="goto-notice">通知</div>
            <div class="menu-item" data-action="goto-co-create">共创</div>
            <div class="menu-item" data-action="goto-submit">投稿</div>
            <div class="menu-item" data-action="goto-about">关于</div>
            <div class="menu-item" data-action="goto-settings">设置</div>
            <div class="menu-divider" style="height:1px; background:rgba(255,255,255,0.15); margin:4px 16px;"></div>
            <div class="menu-item" data-action="refresh-page">刷新页面</div>
        `;

        var left = e.clientX, top = e.clientY;
        if (left + 150 > window.innerWidth) left = window.innerWidth - 160;
        if (top + 350 > window.innerHeight) top = window.innerHeight - 360;
        menu.style.top = top + "px"; menu.style.left = left + "px";
        bindMenu(menu);
        menu.style.display = "block";
    });

    // ==========================================================
    // 【动作分发器】
    // ==========================================================
    function handleAction(action) {
        switch (action) {
            case "copy":
                var sel = window.getSelection().toString();
                if (sel) navigator.clipboard.writeText(sel).then(function() { showToast("已复制"); });
                else showToast("未选中内容");
                break;
            case "select-all": document.execCommand("selectAll"); showToast("已全选"); break;
            case "refresh-page": window.location.reload(); break;
            case "toggle-dark":
                var toggle = document.getElementById("darkModeToggle");
                if (toggle) { toggle.checked = !toggle.checked; toggle.dispatchEvent(new Event("change")); showToast(toggle.checked ? "已切换深色模式" : "已切换亮色模式"); }
                break;
            default:
                if (action.startsWith("goto-")) {
                    var mod = action.replace("goto-", "");
                    var btn = document.querySelector(".taskbar-item[data-module='" + mod + "']");
                    if (btn) btn.click();
                }
                break;
        }
    }

    function showToast(msg) {
        var t = document.getElementById("custom-toast");
        if (!t) {
            t = document.createElement("div");
            t.id = "custom-toast";
            document.body.appendChild(t);
            t.style.cssText = "position:fixed; bottom:85px; left:50%; transform:translateX(-50%); padding:12px 28px; background:rgba(0,0,0,0.4); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.2); border-radius:30px; color:#fff; font-size:14px; display:none; z-index:999999;";
        }
        t.textContent = msg; t.style.display = "block";
        clearTimeout(t._timer);
        t._timer = setTimeout(function() { t.style.display = "none"; }, 2000);
    }

})();


/* ==========================================================
 * 【接入开源翻译引擎：底部地球菜单交互】
 * ========================================================== */

(function() {
    // 1. 准备任务栏的翻译按钮
    document.addEventListener('DOMContentLoaded', function() {
        var taskbar = document.getElementById('taskbar');
        if (!taskbar) return;

        // 检查是否已经存在翻译按钮
        var existingBtn = document.getElementById('lang-menu-btn');
        if (!existingBtn) {
            var menuBtn = document.createElement('div');
            menuBtn.id = 'lang-menu-btn';
            menuBtn.className = 'taskbar-start-btn';
            menuBtn.style.cssText = 'cursor: pointer; font-size: 18px; margin-left: 10px; position: relative;';
            menuBtn.innerHTML = '<i class="fa-solid fa-language"></i>';
            
            // 插入到任务栏中（在猫图标后面）
            var catBtn = document.getElementById('start-menu-btn');
            if (catBtn) {
                catBtn.parentNode.insertBefore(menuBtn, catBtn.nextSibling);
            } else {
                taskbar.appendChild(menuBtn);
            }

            // 2. 语言列表菜单 DOM
            var dropdown = document.createElement('div');
            dropdown.id = 'lang-dropdown';
            dropdown.style.cssText = 'display: none; position: absolute; bottom: 70px; left: 0; width: 130px; background: rgba(20, 20, 30, 0.95); backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 8px 0; box-shadow: 0 8px 30px rgba(0,0,0,0.5); z-index: 999;';
            
            var langList = [
                { code: 'zh', name: '简体中文' },
                { code: 'en', name: 'English' },
                { code: 'ja', name: '日本語' },
                { code: 'es', name: 'Español' },
                { code: 'fr', name: 'Français' },
                { code: 'ru', name: 'Русский' }
            ];

            langList.forEach(function(lang) {
                var item = document.createElement('div');
                item.textContent = lang.name;
                item.style.cssText = 'padding: 8px 16px; cursor: pointer; color: #fff; font-size: 14px; transition: 0.15s;';
                item.onmouseenter = function() { this.style.background = 'rgba(255,255,255,0.1)'; };
                item.onmouseleave = function() { this.style.background = 'transparent'; };
                item.onclick = function() {
                    if (window.translatePageTo) {
                        window.translatePageTo(lang.code);
                    } else {
                        alert("翻译引擎正在后台加载，请稍候再点...");
                    }
                    dropdown.style.display = 'none';
                };
                dropdown.appendChild(item);
            });

            menuBtn.appendChild(dropdown);

            // 3. 开关逻辑
            menuBtn.onclick = function(e) {
                e.stopPropagation();
                var isVisible = dropdown.style.display === 'block';
                dropdown.style.display = isVisible ? 'none' : 'block';
            };

            document.addEventListener('click', function(e) {
                if (!menuBtn.contains(e.target)) {
                    dropdown.style.display = 'none';
                }
            });
        }
    });
})();