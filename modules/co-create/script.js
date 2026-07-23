(function() {
    const container = document.getElementById('co-create-list-container');

    async function loadCoCreates() {
        try {
            // 读取特定路径：/book/information/co-create.json
            const response = await fetch('/book/information/co-create.json');
            if (!response.ok) throw new Error(`读取失败: ${response.status}`);
            const data = await response.json();
            
            container.innerHTML = '';

            if (!data || data.length === 0) {
                container.innerHTML = `
                    <div class="empty-placeholder">
                        <i class="fa-regular fa-handshake" style="font-size: 32px;"></i>
                        <p>暂无可显示的共创项目</p>
                    </div>
                `;
                return;
            }

            // 遍历并渲染卡片
            data.forEach(item => {
                const card = document.createElement('div');
                card.className = 'co-create-card glass-panel';
                
                card.innerHTML = `
                    <div class="co-header">
                        <div class="co-title">${item.title}</div>
                    </div>
                    <div class="co-body-grid">
                        <div class="co-person">
                            <div class="role">文章提供者</div>
                            <div class="name">${item.article_provider}</div>
                        </div>
                        <div class="co-person">
                            <div class="role">共创伙伴</div>
                            <div class="name">${item.co_creator}</div>
                        </div>
                        <div class="co-person">
                            <div class="role">图片提供者</div>
                            <div class="name">${item.image_provider}</div>
                        </div>
                    </div>
                    <div class="co-description">
                        ${item.description}
                    </div>
                `;
                
                container.appendChild(card);
            });

        } catch (error) {
            console.error('加载共创数据失败:', error);
            container.innerHTML = `
                <div class="empty-placeholder" style="color: rgba(255,100,100,0.8);">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 32px;"></i>
                    <p>未能读取到共创数据。</p>
                    <p style="font-size: 12px;">请确认 /book/information/co-create.json 是否存在。</p>
                </div>
            `;
        }
    }

    if (container) { loadCoCreates(); }
})();