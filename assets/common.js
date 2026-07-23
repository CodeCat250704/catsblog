document.addEventListener('DOMContentLoaded', () => {
    // 1. 路由系统 SPA
    const mainContent = document.getElementById('main-content');
    const navItems = document.querySelectorAll('.nav-links li, #settings-btn');
    
    const modulePaths = {
        'home': '/modules/home/',
        'categories': '/modules/categories/',
        'collection': '/modules/collection/',
        'notice': '/modules/notice/',
        'co-create': '/modules/co-create/',
        'submit': '/modules/submit/',
        'about': '/modules/about/',
        'settings': '/modules/settings/'
    };

    function loadModule(moduleName) {
        document.querySelectorAll('.nav-links li').forEach(el => el.classList.remove('active'));
        const activeLi = document.querySelector(`[data-module="${moduleName}"]`);
        if(activeLi) activeLi.classList.add('active');

        const basePath = modulePaths[moduleName];
        if(!basePath) return;

        fetch(basePath + 'index.html')
            .then(response => response.text())
            .then(html => {
                mainContent.innerHTML = html;
                
                const existingLink = document.querySelector('link[data-module-css]');
                if(existingLink) existingLink.remove();
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = basePath + 'style.css';
                link.setAttribute('data-module-css', 'true');
                document.head.appendChild(link);

                const existingScript = document.querySelector('script[data-module-js]');
                if(existingScript) existingScript.remove();
                const script = document.createElement('script');
                script.src = basePath + 'script.js';
                script.setAttribute('data-module-js', 'true');
                // 【关键修复】删除了 defer 属性，让注入的脚本立即执行！
                document.body.appendChild(script);
            })
            .catch(err => {
                mainContent.innerHTML = `<div class="glass-panel" style="padding: 40px; text-align: center;">
                    <i class="fa-solid fa-code-branch" style="font-size: 40px; margin-bottom: 15px; color: #ffffff;"></i>
                    <h3 style="color: #ffffff;">模块建设中</h3>
                    <p style="color: rgba(255,255,255,0.7);">请在此文件夹放入对应的 index.html, style.css, script.js</p>
                </div>`;
            });
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const module = item.getAttribute('data-module');
            if(module) loadModule(module);
        });
    });

    loadModule('home');
});