(function() {
    const categorySwitchList = document.getElementById('category-switch-list');
    const articleSwitchList = document.getElementById('article-switch-list');

    // 模态框元素
    const modal = document.getElementById('immersive-reader-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    const modalMeta = document.getElementById('modal-meta');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    let allPosts = [];
    let isLibrariesLoaded = false;

    const iconMap = {
        "前端开发": "fa-solid fa-code", "后端架构": "fa-solid fa-server",
        "UI/UX 设计": "fa-solid fa-pen-nib", "音乐分享": "fa-solid fa-headphones",
        "生活随笔": "fa-solid fa-mug-saucer", "科技前沿": "fa-solid fa-microchip"
    };

    // ==========================================================
    // 【核心数据加载】
    // ==========================================================
    async function loadCategoriesData() {
        try {
            const response = await fetch('/book/meta.json');
            if (!response.ok) throw new Error(`读取失败: ${response.status}`);
            const data = await response.json();
            allPosts = data.posts || [];
            if (allPosts.length === 0) {
                categorySwitchList.innerHTML = `<div style="color:rgba(255,255,255,0.4); padding: 20px; text-align:center;">暂无文章数据</div>`;
                return;
            }
            renderCategorySwitcher(allPosts);
        } catch (error) {
            console.error(error);
            categorySwitchList.innerHTML = `<div style="color:#ffcccc; padding:20px; text-align:center;">未能读取到 /book/meta.json</div>`;
        }
    }

    function renderCategorySwitcher(posts) {
        const categories = [...new Set(posts.map(p => p.category))];
        const defaultCat = categories.length > 0 ? categories[0] : null;
        categorySwitchList.innerHTML = '';
        categories.forEach(cat => {
            const btn = document.createElement('div');
            btn.className = 'category-btn';
            btn.innerHTML = `<i class="${iconMap[cat] || 'fa-regular fa-folder'}"></i> ${cat}`;
            if (cat === defaultCat) btn.classList.add('active');
            btn.addEventListener('click', () => {
                document.querySelectorAll('.category-btn').forEach(el => el.classList.remove('active'));
                btn.classList.add('active');
                renderArticleList(posts.filter(p => p.category === cat));
            });
            categorySwitchList.appendChild(btn);
        });
        if (defaultCat) {
            const firstBtn = categorySwitchList.querySelector('.category-btn');
            if (firstBtn) firstBtn.click();
        }
    }

    function renderArticleList(filteredPosts) {
        const sorted = filteredPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
        articleSwitchList.innerHTML = '';
        if (sorted.length === 0) {
            articleSwitchList.innerHTML = `<div style="color:rgba(255,255,255,0.4); text-align:center; padding: 20px;">该分类暂无文章</div>`;
            return;
        }
        sorted.forEach((post, index) => {
            const item = document.createElement('div');
            item.className = 'article-item';
            if (index === 0) item.classList.add('active');
            item.innerHTML = `<div class="title">${post.title}</div><div class="subtitle">${post.subtitle || ''}</div>`;
            item.addEventListener('click', () => {
                document.querySelectorAll('.article-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                openImmersiveReader(post); // 触发打开模态框
            });
            articleSwitchList.appendChild(item);
        });
    }

    // ==========================================================
    // 【核心逻辑：打开沉浸式模态框】
    // ==========================================================
    async function openImmersiveReader(post) {
        modalTitle.textContent = post.title;
        modalMeta.innerHTML = `<i class="fa-regular fa-folder-open"></i> ${post.category || '未分类'} <span style="margin:0 8px;">·</span> <i class="fa-regular fa-calendar"></i> ${post.date || '未知'}`;
        modalBody.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100%; color:#999;">加载文章中...</div>`;
        
        // 1. 显示模态框 (带平滑动画)
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
            // 2. 动态加载依赖库 (只在第一次点击时加载)
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

            // 3. 请求 MD 文件
            const res = await fetch(mdUrl);
            if (!res.ok) throw new Error('404');
            const rawText = await res.text();

            // 4. 计算图片绝对路径
            let baseUrl = '';
            const idx = mdUrl.lastIndexOf('/');
            if (idx !== -1) baseUrl = mdUrl.substring(0, idx + 1) + 'picture/';

            // 5. 挂载 Renderer 修正图片路径
            const renderer = new marked.Renderer();
            renderer.image = function(href, title, text) {
                if (!href.startsWith('http') && !href.startsWith('/')) {
                    href = baseUrl + href;
                }
                return `<img src="${href}" alt="${text}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0; display: block;">`;
            };

            // 6. 解析 Markdown
            let html = marked.parse(rawText, { renderer: renderer });

            // 7. 代码高亮处理
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
    // 【模态框控制逻辑】
    // ==========================================================
    function closeReader() {
        modal.style.opacity = '0';
        modal.querySelector('#reader-modal-content').style.transform = 'scale(0.95)';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    // 点击关闭按钮
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeReader);
    // 点击蒙层外部关闭
    if (modal) modal.addEventListener('click', (e) => {
        if (e.target === modal) closeReader();
    });
    // 快捷键 ESC 关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') closeReader();
    });

    loadCategoriesData();
})();