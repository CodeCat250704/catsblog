(function() {
    const categorySwitchList = document.getElementById('category-switch-list');
    const articleSwitchList = document.getElementById('article-switch-list');
    const readingContent = document.getElementById('reading-content');

    // 存储所有数据
    let allPosts = [];

    // 分类图标映射
    const iconMap = {
        "前端开发": "fa-solid fa-code", "后端架构": "fa-solid fa-server",
        "UI/UX 设计": "fa-solid fa-pen-nib", "音乐分享": "fa-solid fa-headphones",
        "生活随笔": "fa-solid fa-mug-saucer", "科技前沿": "fa-solid fa-microchip"
    };

    async function loadCategoriesData() {
        try {
            const response = await fetch('/book/meta.json');
            if (!response.ok) throw new Error(`读取失败: ${response.status}`);
            const data = await response.json();
            
            allPosts = data.posts || [];
            if (allPosts.length === 0) {
                categorySwitchList.innerHTML = `<div style="color:rgba(255,255,255,0.4); text-align:center;">暂无文章</div>`;
                return;
            }

            renderCategorySwitcher(allPosts);

        } catch (error) {
            console.error('数据加载失败:', error);
            categorySwitchList.innerHTML = `<div style="color:#ffcccc; text-align:center;">未能读取到 /book/meta.json</div>`;
        }
    }

    // 渲染分类切换按钮
    function renderCategorySwitcher(posts) {
        const categories = [...new Set(posts.map(p => p.category))];
        const defaultCat = categories.length > 0 ? categories[0] : null;

        categorySwitchList.innerHTML = '';
        categories.forEach(cat => {
            const btn = document.createElement('div');
            btn.className = 'category-btn';
            const iconClass = iconMap[cat] || "fa-regular fa-folder";
            btn.innerHTML = `<i class="${iconClass}"></i> ${cat}`;
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

    // 渲染中间列同级文章
    function renderArticleList(filteredPosts) {
        const sorted = filteredPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

        articleSwitchList.innerHTML = '';
        if (sorted.length === 0) {
            articleSwitchList.innerHTML = `<div style="color:rgba(255,255,255,0.4); text-align:center;">该分类暂无文章</div>`;
            readingContent.innerHTML = `<div class="empty-preview" style="display:flex; justify-content:center; align-items:center; height:100%;">
                <h1 style="font-size: 40px; color: rgba(255,255,255,0.8); font-weight: 300;">阅读文章区域</h1>
                <p style="font-size: 15px; color: rgba(255,255,255,0.4); margin-top: 10px;">请从左侧选择文章开始阅读</p>
            </div>`;
            return;
        }

        sorted.forEach((post, index) => {
            const item = document.createElement('div');
            item.className = 'article-item';
            if (index === 0) item.classList.add('active');
            
            const showId = post.id ? ` · ID: ${post.id}` : '';
            item.innerHTML = `
                <div class="title">${post.title}</div>
                <div class="subtitle">${post.subtitle}${showId}</div>
            `;

            item.addEventListener('click', () => {
                document.querySelectorAll('.article-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                renderReadingAreaWithMarkdown(post);
            });

            articleSwitchList.appendChild(item);
        });

        const firstItem = articleSwitchList.querySelector('.article-item');
        if (firstItem) firstItem.click();
    }

    // ============================================================
    // 【核心升级】：完美排版阅读器渲染
    // ============================================================
    async function renderReadingAreaWithMarkdown(post) {
        // 显示加载状态
        readingContent.innerHTML = `
            <div style="display:flex; justify-content:center; align-items:center; height:100%; width:100%; color: rgba(255,255,255,0.4); font-size: 14px;">
                <i class="fa-solid fa-circle-notch fa-spin" style="margin-right:8px;"></i> 正在加载正文...
            </div>
        `;

        try {
            let folderPath = post.id || post.title.toLowerCase().replace(/\s+/g, '-');
            if(post.title === '我的第一篇博客') { folderPath = 'my-first-post'; }

            const mdUrl = `/book/${folderPath}/md/content.md`;
            const mdResponse = await fetch(mdUrl);

            let contentHtml = '';
            if (!mdResponse.ok) {
                contentHtml = `<p style="color: rgba(255,255,255,0.6); font-size: 15px;">(系统提示：未能在 ${mdUrl} 找到 Markdown 文件)</p>
                               <p style="color: #ffffff; font-size: 16px; margin-top: 15px;">${post.subtitle || '这篇测试文章目前在预览区展示了其元数据。'}</p>`;
            } else {
                const mdText = await mdResponse.text();
                // 简单解析 Markdown
                contentHtml = mdText
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br>');
            }

            // === 渲染为左对齐、舒适的文章阅读器排版 ===
            readingContent.innerHTML = `
                <div style="width: 100%; padding: 0 40px; box-sizing: border-box; text-align: left;">
                    <!-- 文章大标题 -->
                    <h1 style="font-size: 34px; font-weight: 600; color: #ffffff; margin-bottom: 10px; letter-spacing: 1px;">${post.title}</h1>
                    
                    <!-- 元数据信息 -->
                    <div style="font-size: 14px; color: rgba(255, 255, 255, 0.5); padding-bottom: 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 25px; display: flex; gap: 15px;">
                        <span><i class="fa-regular fa-folder-open" style="margin-right: 6px;"></i> ${post.category}</span>
                        <span><i class="fa-regular fa-calendar" style="margin-right: 6px;"></i> ${post.date}</span>
                    </div>

                    <!-- 文章正文内容 (舒适行距排版) -->
                    <div class="article-body" style="font-size: 17px; line-height: 1.8; color: rgba(255, 255, 255, 0.9);">
                        ${contentHtml}
                    </div>
                </div>
            `;

        } catch (error) {
            console.error('读取 Markdown 失败:', error);
            readingContent.innerHTML = `
                <div style="width: 100%; padding: 40px; text-align: left;">
                    <h1 style="font-size: 34px; color: #ffffff;">${post.title}</h1>
                    <div style="color: rgba(255,0,0,0.7); margin-top: 20px;">
                        加载正文失败，请检查路径是否正确。
                    </div>
                </div>
            `;
        }
    }

    if (categorySwitchList) { loadCategoriesData(); }
})();