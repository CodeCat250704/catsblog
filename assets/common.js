/*路由引擎     非请勿动，重要文件！-非请勿动，重要文件！
  修改者：CodeSandwich
  修改内容：26H4重写
*/

(function() {
    "use strict";

    // 时钟
    function updateClock() {
        var now = new Date();
        var days = ["周日","周一","周二","周三","周四","周五","周六"];
        var dateStr = days[now.getDay()] + ", " + (now.getMonth()+1) + "月 " + now.getDate() + " " + now.getFullYear();
        var timeStr = now.toLocaleTimeString("zh-CN", { hour12: true });
        var el = document.getElementById("clock-display");
        if (el) el.textContent = dateStr + " | " + timeStr;
    }
    updateClock();
    setInterval(updateClock, 1000);

    // 全局音量控制
    var volSlider = document.getElementById("global-volume-slider");
    var volIcon = document.getElementById("vol-icon");
    function applyVolume(val) {
        var audio = document.getElementById("myHomeAudio");
        if (audio) audio.volume = val / 100;
        if (volIcon) {
            if (val == 0) volIcon.className = "fa-solid fa-volume-xmark";
            else if (val < 30) volIcon.className = "fa-solid fa-volume-low";
            else volIcon.className = "fa-solid fa-volume-high";
        }
    }
    if (volSlider) {
        volSlider.addEventListener("input", function() { applyVolume(this.value); });
        setTimeout(function() { applyVolume(volSlider.value); }, 500);
    }

    // 核心路由
    var MODULES = {
        "home": "/modules/home/",
        "categories": "/modules/categories/",
        "collection": "/modules/collection/",
        "notice": "/modules/notice/",
        "co-create": "/modules/co-create/",
        "submit": "/modules/submit/",
        "about": "/modules/about/",
        "settings": "/modules/settings/"
    };
    var mainEl = document.getElementById("main-content");

    function loadModule(name) {
        var path = MODULES[name];
        if (!path) return;

        document.querySelectorAll(".taskbar-item").forEach(function(el) {
            el.classList.remove("active");
        });
        var target = document.querySelector(".taskbar-item[data-module='" + name + "']");
        if (target) target.classList.add("active");

        mainEl.innerHTML = "<div style='display:flex; justify-content:center; align-items:center; height:100%; color:rgba(255,255,255,0.6);'>加载中...</div>";

        fetch(path + "index.html")
            .then(function(res) { return res.ok ? res.text() : Promise.reject(); })
            .then(function(html) {
                mainEl.innerHTML = html;
                
                var oldCss = document.querySelector("link[data-module-css]");
                if (oldCss) oldCss.remove();
                var link = document.createElement("link");
                link.rel = "stylesheet"; link.href = path + "style.css";
                link.setAttribute("data-module-css", name);
                document.head.appendChild(link);

                var oldJs = document.querySelector("script[data-module-js]");
                if (oldJs) oldJs.remove();
                var script = document.createElement("script");
                script.src = path + "script.js";
                script.setAttribute("data-module-js", name);
                document.body.appendChild(script);
            })
            .catch(function() {
                mainEl.innerHTML = "<div style='padding:40px;color:#ffcccc;text-align:center;'>加载失败</div>";
            });
    }

    var taskbar = document.getElementById("taskbar");
    if (taskbar) {
        taskbar.addEventListener("click", function(e) {
            var btn = e.target.closest("[data-module]");
            if (btn) {
                loadModule(btn.getAttribute("data-module"));
            }
        });
    }

    // 首页加载
    loadModule("home");
})();