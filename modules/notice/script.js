(function() {
    const container = document.getElementById('notice-list-container');

    async function loadNotices() {
        try {
            // 读取指定路径：/book/information/notice.json
            const response = await fetch('/book/information/notice.json');
            if (!response.ok) throw new Error(`读取失败: ${response.status}`);
            const data = await response.json();
            
            container.innerHTML = '';

            if (!data || data.length === 0) {
                container.innerHTML = `
                    <div class="empty-placeholder">
                        <i class="fa-regular fa-bell-slash" style="font-size: 32px;"></i>
                        <p>暂无可显示的通知</p>
                    </div>
                `;
                return;
            }

            // 遍历并渲染卡片（模仿主页列表结构）
            data.forEach(notice => {
                const card = document.createElement('div');
                card.className = 'notice-card glass-panel';
                
                card.innerHTML = `
                    <div class="notice-header">
                        <div class="notice-title">${notice.title}</div>
                        <div class="notice-date">${notice.date}</div>
                    </div>
                    <div class="notice-content">${notice.content}</div>
                `;
                
                container.appendChild(card);
            });

        } catch (error) {
            console.error('加载通知数据失败:', error);
            container.innerHTML = `
                <div class="empty-placeholder" style="color: rgba(255,100,100,0.8);">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 32px;"></i>
                    <p>未能读取到通知数据。</p>
                    <p style="font-size: 12px;">请确认 /book/information/notice.json 是否存在。</p>
                </div>
            `;
        }
    }

    if (container) { loadNotices(); }
})();