(function() {
    const track = document.getElementById('carouselTrack');
    const indicators = document.getElementById('carouselIndicators');
    const nextBtn = document.querySelector('.carousel-btn.next');
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const historyList = document.getElementById('historyList');
    const musicList = document.getElementById('musicList');
    const announcementList = document.getElementById('announcementList');

    let currentIndex = 0;
    let slides = [];

    async function loadHomeData() {
        try {
            const response = await fetch('/book/meta.json');
            if (!response.ok) throw new Error(`请求异常: ${response.status}`);
            const data = await response.json();

            if (announcementList) {
                if (data.announcements && data.announcements.length > 0) {
                    announcementList.innerHTML = data.announcements.map(text => `<p>${text}</p>`).join('');
                } else {
                    announcementList.innerHTML = '<p style="color:rgba(255,255,255,0.5);">暂无公告数据</p>';
                }
            }

            if (musicList) {
                if (data.music && data.music.length > 0) {
                    musicList.innerHTML = data.music.map(name => `
                        <div class="music-item"><i class="fa-solid fa-play"></i> ${name}</div>
                    `).join('');
                } else {
                    musicList.innerHTML = '<p style="color:rgba(255,255,255,0.5);">暂无音乐数据</p>';
                }
            }

            if (historyList) {
                const posts = data.posts || [];
                if (posts.length > 0) {
                    const sortedPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
                    historyList.innerHTML = sortedPosts.map(post => `<li>· ${post.title}</li>`).join('');
                    slides = sortedPosts.slice(0, 3);
                    renderCarousel(slides);
                    setupCarouselControls();
                } else {
                    historyList.innerHTML = '<li style="color:rgba(255,255,255,0.5);">暂无历史发布</li>';
                    if (track) track.innerHTML = '<li class="carousel-slide"><div class="slide-content">暂无文章数据</div></li>';
                }
            }

        } catch (error) {
            console.error('加载首页数据失败:', error);
            if (announcementList) announcementList.innerHTML = '<p style="color:rgba(255,100,100,0.8);">❌ 加载失败，请检查 /book/meta.json</p>';
            if (historyList) historyList.innerHTML = '<li style="color:rgba(255,100,100,0.8);">❌ 无法加载历史数据</li>';
            if (track) track.innerHTML = '<li class="carousel-slide"><div class="slide-content" style="color:rgba(255,100,100,0.8);">❌ 数据读取错误</div></li>';
        }
    }

    function renderCarousel(posts) {
        if (!track || !indicators) return;
        track.innerHTML = posts.map((post, index) => `
            <li class="carousel-slide ${index === 0 ? 'current-slide' : ''}">
                <div class="slide-content">
                    <div class="slide-text">
                        <h2>${post.title}</h2>
                        <p>${post.subtitle || post.category || '最新文章'}</p>
                    </div>
                    <div class="slide-image">
                        <i class="fa-regular fa-image"></i> 配图
                    </div>
                </div>
            </li>
        `).join('');
        indicators.innerHTML = posts.map((_, index) => `
            <button class="indicator ${index === 0 ? 'active' : ''}" data-slide="${index}"></button>
        `).join('');
    }

    function setupCarouselControls() {
        if (slides.length === 0 || !nextBtn || !prevBtn || !indicators) return;
        const updateCarousel = () => {
            const width = track.querySelector('.carousel-slide')?.getBoundingClientRect().width || 0;
            track.style.transform = `translateX(-${width * currentIndex}px)`;
            document.querySelectorAll('.indicator').forEach((dot, index) => {
                dot.classList.toggle('active', index === currentIndex);
            });
        };
        nextBtn.addEventListener('click', () => { if (slides.length === 0) return; currentIndex = (currentIndex + 1) % slides.length; updateCarousel(); });
        prevBtn.addEventListener('click', () => { if (slides.length === 0) return; currentIndex = (currentIndex - 1 + slides.length) % slides.length; updateCarousel(); });
        indicators.addEventListener('click', (e) => { const target = e.target.closest('.indicator'); if (!target) return; currentIndex = parseInt(target.dataset.slide); updateCarousel(); });
        setInterval(() => { if (slides.length > 0) { currentIndex = (currentIndex + 1) % slides.length; updateCarousel(); } }, 5000);
    }

    if (track) { loadHomeData(); }
})();