(function() {
    // 获取 DOM
    const filterList = document.getElementById('collection-filter-list');
    const articleList = document.getElementById('collection-article-list');
    const readingContent = document.getElementById('collection-reading-content');

    let allFavorites = [];

    // 图标映射
    const iconMap = {
        "前端开发": "fa-solid fa-code",
        "后端架构": "fa-solid fa-server",
        "UI/UX 设计": "fa-solid fa-pen-nib",
        "音乐分享": "fa-solid fa-headphones",
        "生活随笔": "fa-solid fa-mug-saucer",
        "科技前沿": "fa-solid fa-microchip"
    };

    async function loadCollection() {
        try {
            const response = await fetch('/book/meta.json');
            if (!response.ok) throw new Error(`读取失败: ${response.status}`);
            const data = await response.json();
            
            allFavorites = data.favorites || [];
            if (allFavorites.length === 0) {
                filterList.innerHTML = `<div style="color:rgba(255,255,255,0.4); text-align:center;">暂无收藏</div>`;
                return;
            }

            // 1. 生成左侧筛选列表 (全部 和 各个分类)
            renderFilterList(allFavorites);

        } catch (error) {
            console.error('加载收藏数据失败:', error);
            filterList.innerHTML = `<div style="color:#ffcccc; text-align:center;">读取 /book/meta.json 失败</div>`;
        }
    }

    // 渲染左侧筛选按钮
    function renderFilterList(items) {
        const categories = [...new Set(items.map(p => p.category))];
        
        filterList.innerHTML = '';
        
        // 添加“全部”选项
        const allBtn = createFilterBtn('全部', 'fa-solid fa-heart', true);
        filterList.appendChild(allBtn);

        // 添加各个分类选项
        categories.forEach(cat => {
            const iconClass = iconMap[cat] || "fa-regular fa-folder";
            const btn = createFilterBtn(cat, iconClass, false);
            filterList.appendChild(btn);
        });

        // 默认触发点击“全部”
        const firstBtn = filterList.querySelector('.category-btn');
        if (firstBtn) firstBtn.click();
    }

    // 辅助函数：创建筛选按钮
    function createFilterBtn(name, icon, isAll) {
        const btn = document.createElement('div');
        btn.className = 'category-btn';
        btn.innerHTML = `<i class="${icon}"></i> ${name}`;
        btn.dataset.category = isAll ? 'all' : name;

        btn.addEventListener('click', () => {
            document.querySelectorAll('#collection-filter-list .category-btn').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            
            // 按分类筛选收藏列表
            let filtered = allFavorites;
            if (!isAll) {
                filtered = allFavorites.filter(p => p.category === name);
            }
            renderArticleList(filtered);
        });
        return btn;
    }

    // 渲染中间列收藏文章
    function renderArticleList(filteredItems) {
        const sorted = filteredItems.sort((a, b) => new Date(b.date) - new Date(a.date));

        articleList.innerHTML = '';
        if (sorted.length === 0) {
            articleList.innerHTML = `<div style="color:rgba(255,255,255,0.4); text-align:center; font-size:13px;">该分类暂无收藏</div>`;
            readingContent.innerHTML = `<div class="empty-preview"><h1>收藏预览</h1><p>暂无内容可显示</p></div>`;
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
                renderReadingArea(item);
            });

            articleList.appendChild(el);
        });

        const firstItem = articleList.querySelector('.article-item');
        if (firstItem) firstItem.click();
    }

    // 渲染右侧阅读区
    // 替换收藏里的渲染阅读区函数
    function renderReadingArea(item) {
        const iconClass = iconMap[item.category] || "fa-regular fa-folder";
        readingContent.innerHTML = `
            <div style="width: 100%; padding: 0 40px; box-sizing: border-box; text-align: left;">
                <!-- 文章大标题 -->
                <h1 style="font-size: 34px; font-weight: 600; color: #ffffff; margin-bottom: 10px; letter-spacing: 1px;">${item.title}</h1>
                
                <!-- 元数据信息 -->
                <div style="font-size: 14px; color: rgba(255, 255, 255, 0.5); padding-bottom: 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 25px; display: flex; gap: 15px;">
                    <span><i class="${iconClass}" style="margin-right: 6px;"></i> ${item.category}</span>
                    <span><i class="fa-regular fa-calendar" style="margin-right: 6px;"></i> ${item.date}</span>
                </div>

                <!-- 文章正文内容 (舒适行距排版) -->
                <div class="article-body" style="font-size: 17px; line-height: 1.8; color: rgba(255, 255, 255, 0.9);">
                    <p>${item.subtitle || '您收藏的这篇文章，当前通过排版引擎为您呈现左对齐的阅读视图。'}</p>
                </div>
            </div>
        `;
    }

    if (filterList) { loadCollection(); }
})();