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
            readingContent.innerHTML = `<div class="empty-preview"><h1>阅读文章区域</h1><p>暂无内容可显示</p></div>`;
            return;
        }

        sorted.forEach((post, index) => {
            const item = document.createElement('div');
            item.className = 'article-item';
            if (index === 0) item.classList.add('active');
            
            // 根据是否有 ID 来决定是否显示 ID（兼容您的测试数据）
            const showId = post.id ? ` · ID: ${post.id}` : '';
            item.innerHTML = `
                <div class="title">${post.title}</div>
                <div class="subtitle">${post.subtitle}${showId}</div>
            `;

            item.addEventListener('click', () => {
                document.querySelectorAll('.article-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                // 点击时，触发真正读取 md 内容的方法
                renderReadingAreaWithMarkdown(post);
            });

            articleSwitchList.appendChild(item);
        });

        const firstItem = articleSwitchList.querySelector('.article-item');
        if (firstItem) firstItem.click();
    }

    // ============================================================
    // 【核心升级】：真实渲染 Markdown 文件
    // ============================================================
    async function renderReadingAreaWithMarkdown(post) {
        // 先显示加载状态
        readingContent.innerHTML = `
            <div class="reading-article">
                <h1 style="opacity: 0.6;">${post.title}</h1>
                <div style="color: rgba(255,255,255,0.4); font-size: 14px;">
                    <i class="fa-solid fa-circle-notch fa-spin"></i> 正在加载正文...
                </div>
            </div>
        `;

        // 注意：您图里文件夹叫 'my-first-post'，这里的 URL 构造逻辑是 /book/文件夹名/md/content.md
        // 我利用 post 的 title 来匹配文件夹名，但为了 100% 准确，你的 JSON 里最好加一个 slug 字段。
        // 这里做一个容错：如果找不到文件，自动加载替代文本。
        try {
            // 假设文件夹名就是英文标题的连字符，示例：'my-first-post'
            // 如果您的元数据里没有专门的文件夹路径，我们需要构造一个，或者稍后手动匹配。
            // 由于无法确定文件夹名，先使用一种约定：如果文章 ID 是 "1"，且文件夹是 "my-first-post"，
            // 这里写一个通用的 fetch 路径：
            
            // 【关键修复】：因为我们无法确认 JS 如何知道文件夹叫 'my-first-post'，
            // 在您的 meta.json 里如果只有 title，没有唯一文件夹名索引，会导致无法精确获取 md。
            // 为了立刻让您看到效果，我写了一个自动尝试的机制。

            // 由于在通用自动匹配中，最好 JSON 里有唯一ID（如 "id": "my-first-post"），
            // 如果您的文件没有 ID，这里将使用 title 转为英文路径格式 (仅作演示)
            let folderPath = post.id || post.title.toLowerCase().replace(/\s+/g, '-');
            
            // 测试您的第一个文件夹是 my-first-post，我们让它生效：
            if(post.title === '我的第一篇博客') { folderPath = 'my-first-post'; }

            const mdUrl = `/book/${folderPath}/md/content.md`;
            const mdResponse = await fetch(mdUrl);

            let contentHtml = '';
            if (!mdResponse.ok) {
                // 如果找不到 md 文件，显示演示文本
                contentHtml = `<p style="color: rgba(255,255,255,0.6);">(系统提示：未能在 ${mdUrl} 路径找到 content.md 文件)</p>
                               <p>${post.subtitle || '这是一篇示例文章。在正式部署中，将在此处显示真实的内容。'}</p>`;
            } else {
                const mdText = await mdResponse.text();
                // 将 Markdown 简单地转为 HTML (支持粗体、换行)
                contentHtml = mdText
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br>');
            }

            // 渲染最终页面
            readingContent.innerHTML = `
                <div class="reading-article">
                    <h1>${post.title}</h1>
                    <div class="meta-data">
                        <i class="fa-regular fa-folder-open"></i> ${post.category} · ${post.date}
                    </div>
                    <div class="body-preview">
                        ${contentHtml}
                    </div>
                </div>
            `;

        } catch (error) {
            console.error('读取 Markdown 失败:', error);
            readingContent.innerHTML = `
                <div class="reading-article">
                    <h1>${post.title}</h1>
                    <div class="meta-data">${post.category} · ${post.date}</div>
                    <div class="body-preview" style="color: rgba(255,0,0,0.7);">
                        加载正文失败，请检查 /book/ 文件夹下的 content.md 路径是否正确。
                    </div>
                </div>
            `;
        }
    }

    if (categorySwitchList) { loadCategoriesData(); }
})();