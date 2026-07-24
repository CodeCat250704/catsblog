document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('carouselTrack');
    const indicators = document.getElementById('carouselIndicators');
    const nextBtn = document.querySelector('.carousel-btn.next');
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const historyList = document.getElementById('historyList');
    const musicListContainer = document.getElementById('musicListContainer');
    const announcementList = document.getElementById('announcementList');

    let currentIndex = 0;
    let slides = [];

    // ==========================================================
    // 音乐播放器核心逻辑
    // ==========================================================
    let audioPlayer = null; // 音频对象
    let currentSongName = ''; // 当前歌曲名
    let isPlaying = false;    // 播放状态

    function initAudioPlayer() {
        // 创建隐藏的 audio 标签
        audioPlayer = document.createElement('audio');
        audioPlayer.id = 'global-audio-player';
        // 设置默认音量 0.5 (50%)
        audioPlayer.volume = 0.5;
        document.body.appendChild(audioPlayer);

        // 监听播放结束，自动播放下一首
        audioPlayer.addEventListener('ended', () => {
            playNextSong();
        });
    }

    // 渲染音乐列表
    function renderMusicList(musicFiles) {
        if (!musicListContainer) return;

        if (!musicFiles || musicFiles.length === 0) {
            musicListContainer.innerHTML = '<p style="color:rgba(255,255,255,0.5);">暂无音乐数据</p>';
            return;
        }

        // 播放器 UI 初始化
        musicListContainer.innerHTML = `
            <div class="music-player-ui">
                <!-- 顶部：当前播放信息 -->
                <div class="player-info glass-panel" style="padding: 10px; margin-bottom: 10px; display:flex; align-items:center; justify-content:space-between;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <i class="fa-solid fa-circle-play" id="player-play-icon" style="font-size:20px; color:#ffffff; cursor:pointer;"></i>
                        <span id="current-song-title" style="color:#ffffff; font-weight:500;">未播放</span>
                    </div>
                    <!-- 音量调节 -->
                    <div style="display:flex; align-items:center; gap:6px;">
                        <i class="fa-solid fa-volume-low" style="color:rgba(255,255,255,0.6); font-size:14px;"></i>
                        <input type="range" id="volume-slider" min="0" max="1" step="0.01" value="0.5" style="width: 60px; height:3px; background:rgba(255,255,255,0.3); border-radius:2px; outline:none; cursor:pointer;">
                    </div>
                </div>
                <!-- 列表区 -->
                <div id="music-file-list"></div>
            </div>
        `;

        const listContainer = document.getElementById('music-file-list');
        const playIcon = document.getElementById('player-play-icon');
        const songTitle = document.getElementById('current-song-title');
        const volSlider = document.getElementById('volume-slider');

        // 列表渲染
        musicFiles.forEach((name, index) => {
            // 去掉扩展名只显示歌名
            const displayName = name.replace(/\.mp3$/i, '');
            const div = document.createElement('div');
            div.className = 'music-item';
            div.dataset.index = index;
            div.innerHTML = `
                <i class="fa-regular fa-circle-play" style="margin-right: 8px; font-size: 12px;"></i>
                ${displayName}
            `;
            div.addEventListener('click', () => {
                playSpecificSong(name, index);
            });
            listContainer.appendChild(div);
        });

        // 播放/暂停控制
        playIcon.addEventListener('click', () => {
            if (audioPlayer.paused) {
                audioPlayer.play();
                playIcon.className = 'fa-solid fa-circle-pause';
            } else {
                audioPlayer.pause();
                playIcon.className = 'fa-solid fa-circle-play';
            }
        });

        // 音量控制
        volSlider.addEventListener('input', (e) => {
            if (audioPlayer) {
                audioPlayer.volume = parseFloat(e.target.value);
            }
        });

        // 如果没有初始化过音频对象，现在初始化
        if (!audioPlayer) initAudioPlayer();
        
        // 保存列表数据供切歌使用
        window.__musicList = musicFiles;
    }

    // 播放指定歌曲
    function playSpecificSong(fileName, index) {
        if (!audioPlayer) initAudioPlayer();
        
        // 构造音乐路径：/book/music/文件名.mp3
        const songPath = `/book/music/${fileName}`;
        currentSongName = fileName.replace(/\.mp3$/i, '');
        
        // 更新 UI 文字
        const titleEl = document.getElementById('current-song-title');
        if (titleEl) titleEl.textContent = currentSongName;

        // 高亮当前正在播放的列表项
        const items = document.querySelectorAll('#music-file-list .music-item');
        items.forEach(el => el.classList.remove('active-playing'));
        if (items[index]) items[index].classList.add('active-playing');

        // 播放逻辑
        if (audioPlayer.src !== songPath) {
            audioPlayer.src = songPath;
            audioPlayer.play();
        } else {
            // 如果点的是同一首
            if (audioPlayer.paused) {
                audioPlayer.play();
            }
        }
        
        // 把图标变成暂停
        const playIcon = document.getElementById('player-play-icon');
        if (playIcon) playIcon.className = 'fa-solid fa-circle-pause';
    }

    // 自动播放下一次
    function playNextSong() {
        const list = window.__musicList || [];
        if (list.length === 0) return;

        // 找到当前播放的是哪一首
        const currentName = currentSongName + '.mp3';
        let currentIndex = list.indexOf(currentName);
        
        // 播下一首，如果到头了就循环到第一首
        let nextIndex = (currentIndex + 1) % list.length;
        playSpecificSong(list[nextIndex], nextIndex);
    }

    // ==========================================================
    // 常规数据加载逻辑 (修正轮播和音乐读取)
    // ==========================================================

    async function loadHomeData() {
        try {
            const response = await fetch('/book/meta.json');
            if (!response.ok) throw new Error('网络请求状态异常');
            const data = await response.json();
            
            // 渲染公告
            if (data.announcements && data.announcements.length > 0) {
                announcementList.innerHTML = data.announcements.map(text => `<p>${text}</p>`).join('');
            } else {
                announcementList.innerHTML = '<p style="color:rgba(255,255,255,0.5);">暂无公告数据</p>';
            }

            // 渲染音乐列表 (调用上面新写的函数)
            if (data.music && data.music.length > 0) {
                renderMusicList(data.music);
            } else {
                musicListContainer.innerHTML = '<p style="color:rgba(255,255,255,0.5);">暂无音乐数据</p>';
            }

            const posts = data.posts || [];
            if (posts.length > 0) {
                const sortedPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
                historyList.innerHTML = sortedPosts.map(post => `<li>· ${post.title}</li>`).join('');
                slides = sortedPosts.slice(0, 3);
                renderCarousel(slides);
                setupCarouselControls();
            } else {
                track.innerHTML = '<li class="carousel-slide"><div class="slide-content">暂无文章数据</div></li>';
                historyList.innerHTML = '<li style="color:rgba(255,255,255,0.5);">暂无历史发布</li>';
            }

        } catch (error) {
            console.error('加载首页数据失败:', error);
            // 数据加载失败容错
        }
    }

    function renderCarousel(posts) {
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
        if (slides.length === 0) return;
        const updateCarousel = () => {
            const width = track.querySelector('.carousel-slide')?.getBoundingClientRect().width || 0;
            track.style.transform = `translateX(-${width * currentIndex}px)`;
            document.querySelectorAll('.indicator').forEach((dot, index) => {
                dot.classList.toggle('active', index === currentIndex);
            });
        };

        nextBtn.addEventListener('click', () => {
            if (slides.length === 0) return;
            currentIndex = (currentIndex + 1) % slides.length;
            updateCarousel();
        });

        prevBtn.addEventListener('click', () => {
            if (slides.length === 0) return;
            currentIndex = (currentIndex - 1 + slides.length) % slides.length;
            updateCarousel();
        });

        indicators.addEventListener('click', (e) => {
            const target = e.target.closest('.indicator');
            if (!target) return;
            currentIndex = parseInt(target.dataset.slide);
            updateCarousel();
        });

        setInterval(() => {
            if (slides.length > 0) {
                currentIndex = (currentIndex + 1) % slides.length;
                updateCarousel();
            }
        }, 5000);
    }

    loadHomeData();
});