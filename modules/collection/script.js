(function() {
    // ==========================================================
    // 【DOM 绑定】
    // ==========================================================
    const filterList = document.getElementById('collection-filter-list');
    const articleList = document.getElementById('collection-article-list');

    // 全局模态框元素 (直接从 index.html 读取)
    const modal = document.getElementById('immersive-reader-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    const modalMeta = document.getElementById('modal-meta');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // ==========================================================
    // 【数据与配置】
    // ==========================================================
    let allFavorites = [];
    let isLibrariesLoaded = false;

    const iconMap = {
        "前端开发": "fa-solid fa-code", "后端架构": "fa-solid fa-server",
        "UI/UX 设计": "fa-solid fa-pen-nib", "音乐分享": "fa-solid fa-headphones",
        "生活随笔": "fa-solid fa-mug-saucer", "科技前沿": "fa-solid fa-microchip"
    };

    // ==========================================================
    // 【核心数据加载】
    // ==========================================================
    async function loadCollection() {
        try {
            const response = await fetch('/book/meta.json');
            if (!response.ok) throw new Error(`读取失败: ${response.status}`);
            const data = await response.json();
            
            allFavorites = data.favorites || [];
            if (allFavorites.length === 0) {
                filterList.innerHTML = `<div style="color:rgba(255,255,255,0.4); text-align:center; padding: 20px;">暂无收藏</div>`;
                return;
            }

            renderFilterList(allFavorites);

        } catch (error) {
            console.error('加载收藏数据失败:', error);
            filterList.innerHTML = `<div style="color:#ffcccc; text-align:center;">读取 /book/meta.json 失败</div>`;
        }
    }

    // ==========================================================
    // 【渲染左侧筛选列表】
    // ==========================================================
    function renderFilterList(items) {
        const categories = [...new Set(items.map(p => p.category))];
        filterList.innerHTML = '';
        
        // 添加“全部”选项
        const allBtn = createFilterBtn('全部', 'fa-solid fa-heart', true);
        filterList.appendChild(allBtn);

        categories.forEach(cat => {
            const iconClass = iconMap[cat] || "fa-regular fa-folder";
            const btn = createFilterBtn(cat, iconClass, false);
            filterList.appendChild(btn);
        });

        // 默认触发点击“全部”
        const firstBtn = filterList.querySelector('.category-btn');
        if (firstBtn) firstBtn.click();
    }

    function createFilterBtn(name, icon, isAll) {
        const btn = document.createElement('div');
        btn.className = 'category-btn';
        btn.innerHTML = `<i class="${icon}"></i> ${name}`;
        btn.dataset.category = isAll ? 'all' : name;

        btn.addEventListener('click', () => {
            document.querySelectorAll('#collection-filter-list .category-btn').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            
            let filtered = allFavorites;
            if (!isAll) {
                filtered = allFavorites.filter(p => p.category === name);
            }
            renderArticleList(filtered);
        });
        return btn;
    }

    // ==========================================================
    // 【渲染中间列收藏文章】
    // ==========================================================
    function renderArticleList(filteredItems) {
        const sorted = filteredItems.sort((a, b) => new Date(b.date) - new Date(a.date));

        articleList.innerHTML = '';
        if (sorted.length === 0) {
            articleList.innerHTML = `<div style="color:rgba(255,255,255,0.4); text-align:center; font-size:13px;">该分类暂无收藏</div>`;
            return;
        }

        sorted.forEach((item, index) => {
            const el = document.createElement('div');
            el.className = 'article-item';
            if (index === 0) el.classList.add('active');
            el.innerHTML = `
                <div class="title">${item.title}</div>
                <div class="subtitle">${item.subtitle || item.date}</div>
            `;

            el.addEventListener('click', () => {
                document.querySelectorAll('#collection-article-list .article-item').forEach(el => el.classList.remove('active'));
                el.classList.add('active');
                openImmersiveReader(item); // 触发打开模态框
            });

            articleList.appendChild(el);
        });
    }

    // ==========================================================
    // 【核心逻辑：打开沉浸式模态框 (与分类模块共用)】
    // ==========================================================
    async function openImmersiveReader(post) {
        modalTitle.textContent = post.title;
        modalMeta.innerHTML = `<i class="fa-regular fa-folder-open"></i> ${post.category || '未分类'} <span style="margin:0 8px;">·</span> <i class="fa-regular fa-calendar"></i> ${post.date || '未知'}`;
        modalBody.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100%; color:#999;">加载文章中...</div>`;
        
        // 显示模态框
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.querySelector('#reader-modal-content').style.transform = 'scale(1)';
        }, 10);

        const mdUrl = post.mdPath;
        if (!mdUrl) {
            modalBody.innerHTML = `<div style="padding:40px; color:#856404;">⚠️ 请在 meta.json 中指定 "mdPath" 字段。</div>`;
            return;
        }

        try {
            // 动态加载依赖库
            if (!isLibrariesLoaded) {
                await new Promise((resolve, reject) => {
                    const markedScript = document.createElement('script');
                    markedScript.src = 'https://cdn.bootcdn.net/ajax/libs/marked/4.3.0/marked.min.js';
                    markedScript.onload = () => {
                        const hljsScript = document.createElement('script');
                        hljsScript.src = 'https://cdn.bootcdn.net/ajax/libs/highlight.js/11.8.0/highlight.min.js';
                        hljsScript.onload = resolve;
                        hljsScript.onerror = reject;
                        document.head.appendChild(hljsScript);
                    };
                    document.head.appendChild(markedScript);
                });
                isLibrariesLoaded = true;
            }

            const res = await fetch(mdUrl);
            if (!res.ok) throw new Error('404');
            const rawText = await res.text();

            // 计算图片绝对路径
            let baseUrl = '';
            const idx = mdUrl.lastIndexOf('/');
            if (idx !== -1) baseUrl = mdUrl.substring(0, idx + 1) + 'picture/';

            const renderer = new marked.Renderer();
            renderer.image = function(href, title, text) {
                if (!href.startsWith('http') && !href.startsWith('/')) {
                    href = baseUrl + href;
                }
                return `<img src="${href}" alt="${text}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0; display: block;">`;
            };

            let html = marked.parse(rawText, { renderer: renderer });
            html = html.replace(/<pre><code/g, '<pre><code class="hljs"');
            
            modalBody.innerHTML = `<div style="max-width: 100%; word-wrap: break-word;">${html}</div>`;
            setTimeout(() => {
                modalBody.querySelectorAll('pre code').forEach(block => {
                    if (window.hljs) hljs.highlightElement(block);
                });
            }, 50);

        } catch (error) {
            console.error(error);
            modalBody.innerHTML = `<div style="padding:40px; color:#ffcccc;">加载失败：${mdUrl}</div>`;
        }
    }

    // ==========================================================
    // 【模态框控制逻辑 (全局只绑定一次)】
    // ==========================================================
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeReader);
    if (modal) modal.addEventListener('click', (e) => {
        if (e.target === modal) closeReader();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') closeReader();
    });

    function closeReader() {
        modal.style.opacity = '0';
        modal.querySelector('#reader-modal-content').style.transform = 'scale(0.95)';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    // ==========================================================
    // 【启动】
    // ==========================================================
    loadCollection();

})();