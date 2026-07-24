(function() {
    // ==========================================================
    // 【DOM 绑定】
    // ==========================================================
    const categorySwitchList = document.getElementById('category-switch-list');
    const articleSwitchList = document.getElementById('article-switch-list');
    const readingContent = document.getElementById('reading-content');
    
    if (!categorySwitchList || !articleSwitchList || !readingContent) {
        console.error("分类页面 DOM 元素丢失！请检查 HTML 结构。");
        return;
    }

    // ==========================================================
    // 【全局变量与配置】
    // ==========================================================
    let allPosts = [];

    const iconMap = {
        "前端开发": "fa-solid fa-code", 
        "后端架构": "fa-solid fa-server",
        "UI/UX 设计": "fa-solid fa-pen-nib", 
        "音乐分享": "fa-solid fa-headphones",
        "生活随笔": "fa-solid fa-mug-saucer", 
        "科技前沿": "fa-solid fa-microchip"
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
                categorySwitchList.innerHTML = `<div style="color:rgba(255,255,255,0.4); text-align:center; padding: 20px;">暂无文章数据</div>`;
                return;
            }

            renderCategorySwitcher(allPosts);

        } catch (error) {
            console.error('数据加载失败:', error);
            categorySwitchList.innerHTML = `<div style="color:#ffcccc; text-align:center; padding:20px;">未能读取到 /book/meta.json</div>`;
        }
    }

    // ==========================================================
    // 【第一步：渲染分类切换按钮】
    // ==========================================================
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

    // ==========================================================
    // 【第二步：渲染中间列同级文章】
    // ==========================================================
    function renderArticleList(filteredPosts) {
        const sorted = filteredPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

        articleSwitchList.innerHTML = '';
        
        if (sorted.length === 0) {
            articleSwitchList.innerHTML = `<div style="color:rgba(255,255,255,0.4); text-align:center; padding: 20px;">该分类暂无文章</div>`;
            readingContent.innerHTML = `
                <div style="display:flex; justify-content:center; align-items:center; height:100%; text-align:center;">
                    <div>
                        <h1 style="font-size: 40px; color: rgba(255,255,255,0.8); font-weight: 300; margin:0;">阅读文章区域</h1>
                        <p style="font-size: 15px; color: rgba(255,255,255,0.4); margin-top: 10px;">请从左侧选择文章开始阅读</p>
                    </div>
                </div>
            `;
            return;
        }

        sorted.forEach((post, index) => {
            const item = document.createElement('div');
            item.className = 'article-item';
            if (index === 0) item.classList.add('active');
            
            item.innerHTML = `
                <div class="title">${post.title}</div>
                <div class="subtitle">${post.subtitle || '无副标题'}</div>
            `;

            item.addEventListener('click', () => {
                document.querySelectorAll('.article-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                renderReadingArea(post);
            });

            articleSwitchList.appendChild(item);
        });

        const firstItem = articleSwitchList.querySelector('.article-item');
        if (firstItem) firstItem.click();
    }

    // ==========================================================
    // 【第三步：渲染右侧阅读区 (全功能工业级渲染)】
    // ==========================================================
    async function renderReadingArea(post) {
        readingContent.innerHTML = `
            <div style="display:flex; justify-content:center; align-items:center; height:100%; width:100%; color: rgba(255,255,255,0.4);">
                <i class="fa-solid fa-circle-notch fa-spin" style="margin-right:8px;"></i> 正在加载富文本...
            </div>
        `;

        try {
            // === 1. 绝对路径获取 ===
            let mdUrl = post.mdPath;
            let markdownContent = "";

            if (!mdUrl) {
                markdownContent = `
                    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0; color: #856404; font-size: 14px;">
                        <strong> 提示：</strong><br>
                        请在 <code>meta.json</code> 中指定 <code>"mdPath"</code> 字段。<br>
                        例如：<code style="background:#eee; padding:2px 4px;">"mdPath": "/book/home/1/md/content.md"</code>
                    </div>
                `;
            } else {
                // === 2. 请求 Markdown 文件 ===
                const mdResponse = await fetch(mdUrl);
                
                if (!mdResponse.ok) {
                    markdownContent = `
                        <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; border-radius: 4px; margin: 20px 0; color: #721c24; font-size: 14px;">
                            <strong>404 加载失败：</strong><br>
                            未找到文件：<code style="background:#eee; padding:2px 4px;">${mdUrl}</code><br><br>
                            请检查您的 <code>meta.json</code> 中的 <code>"mdPath"</code> 路径是否指向了正确的 <code>content.md</code> 真实位置。
                        </div>
                    `;
                } else {
                    const rawText = await mdResponse.text();

                    // === 3. 异步加载 marked 库 ===
                    if (typeof marked === 'undefined') {
                        await new Promise((resolve, reject) => {
                            const script = document.createElement('script');
                            script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
                            script.onload = resolve;
                            script.onerror = reject;
                            document.head.appendChild(script);
                        });
                    }

                    // === 4. 自定义 Renderer 路径补全 ===
                    const renderer = new marked.Renderer();
                    renderer.image = function(href, title, text) {
                        let finalSrc = href;
                        // 如果不是绝对路径，自动拼接到 /book/home/{folder}/picture/
                        if (!href.startsWith('http') && !href.startsWith('/')) {
                            const basePath = mdUrl.substring(0, mdUrl.lastIndexOf('/') + 1).replace('/md/', '/picture/');
                            finalSrc = basePath + href;
                        }
                        return `<img src="${finalSrc}" alt="${text || ''}" style="max-width: 100%; height: auto; border-radius: 6px; margin: 15px 0; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">`;
                    };

                    // === 5. 使用 marked 解析 ===
                    markdownContent = marked.parse(rawText, { renderer: renderer });
                }
            }

            // === 6. 最终注入 DOM (防溢出封闭区) ===
            readingContent.innerHTML = `
                <div style="width: 100%; height: 100%; padding: 0 30px 20px 30px; box-sizing: border-box; overflow-y: auto; overflow-x: hidden; text-align: left; display: flex; flex-direction: column;">
                    
                    <!-- 元数据区 -->
                    <div style="margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.15); flex-shrink: 0;">
                        <h1 style="font-size: 34px; font-weight: 600; color: #ffffff; margin: 0 0 10px 0; letter-spacing: 1px;">${post.title}</h1>
                        <div style="font-size: 14px; color: rgba(255, 255, 255, 0.6); display: flex; gap: 20px; flex-wrap: wrap;">
                            <span><i class="fa-regular fa-folder-open" style="margin-right: 6px;"></i> ${post.category || '未分类'}</span>
                            <span><i class="fa-regular fa-calendar" style="margin-right: 6px;"></i> ${post.date || '未知日期'}</span>
                        </div>
                    </div>
                    
                    <!-- 正文区 (防溢出滚动，黑色字体，舒适合集) -->
                    <div class="article-body" style="font-size: 17px; line-height: 1.8; color: #222222; flex: 1; overflow-y: auto; overflow-x: hidden; padding-bottom: 40px; word-wrap: break-word;">
                        ${markdownContent}
                    </div>

                </div>
            `;

        } catch (error) {
            console.error('渲染过程发生崩溃:', error);
            readingContent.innerHTML = `
                <div style="width: 100%; padding: 40px; text-align: center; color: #ffffff;">
                    <h1 style="font-size: 24px; color: #ff6b6b;">⚠️ 系统渲染崩溃</h1>
                    <div style="color: #ffcccc; margin-top: 15px; font-size: 14px;">
                        请检查 <code>Console</code> 面板查看具体错误信息。<br>
                        通常是网络请求被拦截，或是浏览器的安全策略导致。
                    </div>
                </div>
            `;
        }
    }

    // ==========================================================
    // 【启动系统】
    // ==========================================================
    loadCategoriesData();

})();