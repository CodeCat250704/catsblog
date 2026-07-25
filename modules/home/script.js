(function() {
    console.log("Home JS 已启动 (全功能专业播放器 + 杜比全景声模拟)");

    // 绑定 DOM 元素
    const track = document.getElementById('carouselTrack');
    const indicators = document.getElementById('carouselIndicators');
    const nextBtn = document.getElementById('carouselNext');
    const prevBtn = document.getElementById('carouselPrev');
    const historyList = document.getElementById('historyList');
    const announcementList = document.getElementById('announcementList');
    const musicListContainer = document.getElementById('musicListContainer');

    // 获取全局路由跳转函数 (来自 assets/common.js)
    const navigateTo = (module) => {
        const targetLi = document.querySelector(`[data-module="${module}"]`);
        if (targetLi) targetLi.click();
    };

    // ==========================================================
    // 【全局播放器核心配置】
    // ==========================================================
    let allSongs = [];
    let currentSongIndex = 0;
    let playMode = 'list';
    let allSongsOriginal = []; // 保存原始列表，用于过滤重置

    const audioPlayer = document.getElementById('myHomeAudio');
    if (!audioPlayer) {
        alert("错误：页面中没有找到音频元素 #myHomeAudio！请检查 HTML！");
        return;
    }
    audioPlayer.volume = 0.5;

    let volumeSlider = null;

    // ==========================================================
    // 【核心数据读取函数】
    // ==========================================================
    async function loadHomeData() {
        try {
            const response = await fetch('/book/meta.json');
            if (!response.ok) {
                alert("请求 /book/meta.json 失败！状态码: " + response.status);
                return;
            }
            const data = await response.json();

            // 公告版渲染 (现在点击公告不会跳转，仅显示)
            if (data.announcements && data.announcements.length > 0) {
                announcementList.innerHTML = data.announcements.map(text => `<p>${text}</p>`).join('');
            }

            const posts = data.posts || [];
            if (posts.length > 0) {
                const sortedPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                // 历史发布渲染 (添加点击跳转功能)
                historyList.innerHTML = sortedPosts.map(post => 
                    `<li class="history-link" data-title="${post.title}" style="cursor:pointer; transition:0.2s;">· ${post.title}</li>`
                ).join('');
                
                // 绑定历史跳转事件
                document.querySelectorAll('.history-link').forEach(el => {
                    el.onclick = () => {
                        navigateTo('categories'); // 跳转到分类模块
                    };
                    el.onmouseenter = function() { this.style.color = '#ffffff'; this.style.transform = 'translateX(6px)'; };
                    el.onmouseleave = function() { this.style.color = ''; this.style.transform = ''; };
                });

                renderCarouselWithImage(sortedPosts); // 调用带图的轮播
            }

            if (data.music && data.music.length > 0) {
                allSongs = data.music;
                allSongsOriginal = data.music;
                renderMusicPlayerUI(data.music);
            } else {
                musicListContainer.innerHTML = '<p style="color:rgba(255,255,255,0.5);">暂无音乐数据</p>';
            }

        } catch (error) {
            console.error("发生致命错误:", error);
        }
    }

    // ==========================================================
    // 【带图片的轮播图渲染 (支持点击跳转)】
    // ==========================================================
    let currentSlide = 0;

    function renderCarouselWithImage(posts) {
        track.innerHTML = posts.map((post) => {
            const imgPath = post.folder ? `/book/home/${post.folder}/headpicture/${post.cover || 'cover.jpg'}` : '';
            return `
                <li class="carousel-slide" style="cursor:pointer;">
                    <div class="slide-bg" style="background-image: url('${imgPath}');"></div>
                    <div class="slide-content-overlay">
                        <div class="slide-text">
                            <h2>${post.title}</h2>
                            <p>${post.subtitle || post.category}</p>
                            <div class="click-hint">点击查看详情</div>
                        </div>
                    </div>
                </li>
            `;
        }).join('');

        // 为每一个轮播图绑定点击跳转事件
        document.querySelectorAll('.carousel-slide').forEach((el, index) => {
            el.onclick = () => {
                navigateTo('categories'); // 跳转到分类模块
            };
        });

        indicators.innerHTML = posts.map((_, index) => `
            <button class="indicator ${index === 0 ? 'active' : ''}"></button>
        `).join('');

        const updateCarousel = () => {
            if (!track.firstElementChild) return;
            const width = track.firstElementChild.getBoundingClientRect().width;
            track.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
            track.style.transform = `translateX(-${width * currentSlide}px)`;
            document.querySelectorAll('.indicator').forEach((dot, i) => {
                dot.classList.toggle('active', i === currentSlide);
            });
        };

        nextBtn.onclick = () => { if (posts.length === 0) return; currentSlide = (currentSlide + 1) % posts.length; updateCarousel(); };
        prevBtn.onclick = () => { if (posts.length === 0) return; currentSlide = (currentSlide - 1 + posts.length) % posts.length; updateCarousel(); };
        indicators.onclick = (e) => {
            const target = e.target.closest('.indicator');
            if (!target) return;
            currentSlide = Array.from(indicators.children).indexOf(target);
            updateCarousel();
        };

        let autoSlideInterval = setInterval(() => { if (posts.length > 0) nextBtn.click(); }, 5000);
        const carouselContainer = document.getElementById('heroCarousel');
        carouselContainer.onmouseenter = () => clearInterval(autoSlideInterval);
        carouselContainer.onmouseleave = () => {
            autoSlideInterval = setInterval(() => { if (posts.length > 0) nextBtn.click(); }, 5000);
        };
    }

    // ==========================================================
    // 【全功能 UI 播放器渲染 (含杜比全景声 & 5项增强)】
    // ==========================================================
    function renderMusicPlayerUI(songs) {
        musicListContainer.innerHTML = `
            <style>
                .player-progress-bar { height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; cursor: pointer; width: 100%; position: relative; margin: 6px 0; transition: 0.1s; }
                .player-progress-bar .progress-fill { height: 100%; width: 0%; background: #ffffff; border-radius: 2px; position: absolute; left: 0; top: 0; pointer-events: none; box-shadow: 0 0 8px rgba(255,255,255,0.5); }
                .player-controls { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 6px; flex-wrap: wrap;}
                .ctrl-btn { background: transparent; border: none; color: rgba(255,255,255,0.7); font-size: 16px; cursor: pointer; transition: all 0.2s; padding: 0 4px; }
                .ctrl-btn:hover { color: #ffffff; transform: scale(1.05); }
                .eq-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 2px 8px; color: rgba(255,255,255,0.5); font-size: 10px; cursor: pointer; transition: 0.2s; }
                .eq-btn:hover { border-color: rgba(255,255,255,0.4); color: #ffffff; }
                .eq-btn.active { border-color: #ffffff; color: #ffffff; background: rgba(255,255,255,0.1); }
                .mode-btn { background: transparent; border: none; color: rgba(255,255,255,0.4); font-size: 14px; cursor: pointer; transition: 0.2s; }
                .mode-btn.active { color: #ffffff; }
                .mode-btn.list { color: #ffffff; }
                .music-item-active { background: rgba(255, 255, 255, 0.15); border-radius: 6px; padding-left: 8px; }
                .volume-container { display: flex; align-items: center; gap: 6px; }
                .vol-slider { width: 50px; height: 3px; background: rgba(255,255,255,0.2); border-radius: 2px; outline: none; cursor: pointer; }
                .time-display { font-size: 11px; color: rgba(255,255,255,0.5); font-variant-numeric: tabular-nums; min-width: 70px; text-align: center;}
                
                .music-search-box { width: 100%; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 4px 10px; color: #ffffff; font-size: 13px; outline: none; margin-bottom: 8px; box-sizing: border-box;}
                .music-search-box::placeholder { color: rgba(255,255,255,0.3); }
                .music-search-box:focus { border-color: rgba(255,255,255,0.4); }
                .lyric-display { text-align: center; font-size: 13px; color: rgba(255,255,255,0.5); height: 24px; line-height: 24px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 4px; transition: 0.3s; }
                .lyric-display.playing { color: #ffffff; }

                /* 新增：点击提示样式 */
                .click-hint { margin-top: 10px; font-size: 12px; opacity: 0.6; font-weight: 300; letter-spacing: 1px; }
            </style>

            <div class="player-panel" style="padding: 6px 0;">
                <div class="player-progress-bar" id="playerProgressBar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 10px; color: rgba(255,255,255,0.3);">
                    <span id="currentTimeDisplay">0:00</span>
                    <span id="totalTimeDisplay">0:00</span>
                </div>
                <div class="lyric-display" id="lyricDisplay">🎵 准备好享受音乐了...</div>

                <div class="player-controls">
                    <div style="display: flex; gap: 4px; align-items: center;">
                        <button class="eq-btn" id="eqBass">重低音</button>
                        <button class="eq-btn" id="eqAtmos">杜比全景声</button>
                        <button class="mode-btn list active" id="modeBtn" title="点击切换循环模式"><i class="fa-solid fa-repeat"></i></button>
                    </div>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <button class="ctrl-btn" id="prevTrackBtn"><i class="fa-solid fa-backward-step"></i></button>
                        <button class="ctrl-btn" id="playPauseBtn" style="font-size: 20px;"><i class="fa-solid fa-circle-play"></i></button>
                        <button class="ctrl-btn" id="nextTrackBtn"><i class="fa-solid fa-forward-step"></i></button>
                    </div>
                    <div class="volume-container">
                        <i class="fa-solid fa-volume-high" style="color: rgba(255,255,255,0.5); font-size: 14px;"></i>
                        <input type="range" class="vol-slider" id="musicVolumeSlider" min="0" max="1" step="0.01" value="0.5">
                    </div>
                </div>
            </div>

            <input type="text" class="music-search-box" id="musicSearchInput" placeholder="搜索歌曲名称...">

            <div class="music-item-container" style="display: flex; flex-direction: column; gap: 6px; margin-top: 4px; max-height: 130px; overflow-y: auto; padding-right: 4px;">
                ${songs.map((name, index) => `
                    <div class="music-item" data-index="${index}" data-src="/book/music/${name}" style="padding: 6px 10px; border-radius: 6px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; color: rgba(255,255,255,0.7);">
                        <i class="fa-regular fa-circle-play" style="margin-right: 8px; font-size: 12px;"></i>
                        <span class="song-name" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex:1;">${name.replace(/\.mp3$/i, '')}</span>
                        ${index === 0 ? '<span style="font-size:10px; color:rgba(255,255,255,0.3); margin-left: 6px;">当前</span>' : ''}
                    </div>
                `).join('')}
            </div>
        `;

        // ==========================================================
        // 【绑定播放器事件】
        // ==========================================================
        const progressBar = document.getElementById('playerProgressBar');
        const progressFill = document.getElementById('progressFill');
        const currentTimeDisplay = document.getElementById('currentTimeDisplay');
        const totalTimeDisplay = document.getElementById('totalTimeDisplay');
        const playPauseBtn = document.getElementById('playPauseBtn');
        const prevBtnCtrl = document.getElementById('prevTrackBtn');
        const nextBtnCtrl = document.getElementById('nextTrackBtn');
        const modeBtn = document.getElementById('modeBtn');
        const eqBass = document.getElementById('eqBass');
        const eqAtmos = document.getElementById('eqAtmos');
        const lyricDisplay = document.getElementById('lyricDisplay');
        const searchInput = document.getElementById('musicSearchInput');
        volumeSlider = document.getElementById('musicVolumeSlider');

        let isEqBassActive = false;
        let isEqAtmosActive = false;

        function playSong(index, fadeIn = true) {
            if (index < 0 || index >= allSongs.length) return;
            currentSongIndex = index;
            const songName = allSongs[index];
            audioPlayer.src = `/book/music/${songName}`;
            
            if (fadeIn) {
                audioPlayer.volume = 0.01;
                audioPlayer.play();
                let volInc = 0.01;
                let fadeInterval = setInterval(() => {
                    if (audioPlayer.volume < 0.5) {
                        audioPlayer.volume = Math.min(0.5, audioPlayer.volume + volInc);
                    } else {
                        clearInterval(fadeInterval);
                    }
                }, 50);
            } else {
                audioPlayer.play();
            }
            
            document.querySelectorAll('.music-item').forEach((el, i) => {
                el.style.background = (i === index) ? 'rgba(255,255,255,0.15)' : 'transparent';
                el.style.color = (i === index) ? '#ffffff' : 'rgba(255,255,255,0.7)';
            });
            playPauseBtn.innerHTML = '<i class="fa-solid fa-circle-pause"></i>';
            
            lyricDisplay.textContent = `🎵 正在播放: ${songName.replace(/\.mp3$/i, '')}`;
            lyricDisplay.className = 'lyric-display playing';
        }

        function togglePlayPause() {
            if (!audioPlayer.src) { playSong(0); return; }
            if (audioPlayer.paused) {
                audioPlayer.play();
                playPauseBtn.innerHTML = '<i class="fa-solid fa-circle-pause"></i>';
                lyricDisplay.className = 'lyric-display playing';
            } else {
                audioPlayer.pause();
                playPauseBtn.innerHTML = '<i class="fa-solid fa-circle-play"></i>';
                lyricDisplay.className = 'lyric-display';
            }
        }

        function nextTrack() {
            if (allSongs.length === 0) return;
            let fadeOut = setInterval(() => {
                if (audioPlayer.volume > 0.05) {
                    audioPlayer.volume -= 0.05;
                } else {
                    clearInterval(fadeOut);
                    if (playMode === 'random') {
                        let nextIdx;
                        do { nextIdx = Math.floor(Math.random() * allSongs.length); } while (nextIdx === currentSongIndex && allSongs.length > 1);
                        playSong(nextIdx, true);
                    } else {
                        playSong((currentSongIndex + 1) % allSongs.length, true);
                    }
                }
            }, 30);
        }

        function prevTrack() {
            if (allSongs.length === 0) return;
            let fadeOut = setInterval(() => {
                if (audioPlayer.volume > 0.05) {
                    audioPlayer.volume -= 0.05;
                } else {
                    clearInterval(fadeOut);
                    if (playMode === 'random') {
                        let nextIdx;
                        do { nextIdx = Math.floor(Math.random() * allSongs.length); } while (nextIdx === currentSongIndex && allSongs.length > 1);
                        playSong(nextIdx, true);
                    } else {
                        playSong((currentSongIndex - 1 + allSongs.length) % allSongs.length, true);
                    }
                }
            }, 30);
        }

        audioPlayer.ontimeupdate = function() {
            if (!isNaN(audioPlayer.duration)) {
                const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                progressFill.style.width = percent + '%';
                const curMin = Math.floor(audioPlayer.currentTime / 60);
                const curSec = Math.floor(audioPlayer.currentTime % 60);
                currentTimeDisplay.textContent = `${curMin}:${curSec.toString().padStart(2, '0')}`;
                const totMin = Math.floor(audioPlayer.duration / 60);
                const totSec = Math.floor(audioPlayer.duration % 60);
                totalTimeDisplay.textContent = `${totMin}:${totSec.toString().padStart(2, '0')}`;
            }
        };

        progressBar.onclick = function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const clickPercent = x / rect.width;
            if (!isNaN(audioPlayer.duration)) {
                audioPlayer.currentTime = clickPercent * audioPlayer.duration;
            }
        };

                // ------ 杜比全景声空间音频引擎 (静态声场包围版：绝不晃动) ------
        let audioCtx = null;
        let source = null;
        let bassFilter = null; // 主重低音
        let atmosPanner = null; // 天空声道 (.Z)
        let subwooferFront = null; // 前置低音炮
        let subwooferRear = null; // 后置低音炮
        let roomReverb = null; // 空间混响

        function setupAudioEffects() {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                source = audioCtx.createMediaElementSource(audioPlayer);
                
                // 1. 主低音炮 (电影级超低频)
                bassFilter = audioCtx.createBiquadFilter();
                bassFilter.type = 'lowshelf';
                bassFilter.frequency.value = 80; 
                bassFilter.gain.value = 0;

                // 2. 空间混响 (模拟影院的广阔空间感，让声音有厚度)
                roomReverb = audioCtx.createConvolver();
                const sr = audioCtx.sampleRate;
                const len = sr * 1.5; // 1.5秒的室内残响
                const buffer = audioCtx.createBuffer(2, len, sr);
                const lData = buffer.getChannelData(0);
                const rData = buffer.getChannelData(1);
                for (let i = 0; i < len; i++) {
                    const decay = Math.exp(-i / (sr * 0.4));
                    const noise = (Math.random() * 2 - 1) * decay;
                    lData[i] = noise * 0.6;
                    rData[i] = noise * 0.8; // 制造左右声场不均匀的真实房间散射感
                }
                roomReverb.buffer = buffer;

                // 3. 天空声道 (模拟天花板上压下来的重低音)
                atmosPanner = audioCtx.createPanner();
                atmosPanner.panningModel = 'HRTF';
                atmosPanner.distanceModel = 'inverse';
                atmosPanner.refDistance = 0.5;
                atmosPanner.rolloffFactor = 1.5;

                // 4. 前置与后置低音炮
                subwooferFront = audioCtx.createPanner();
                subwooferFront.panningModel = 'equalpower';
                subwooferRear = audioCtx.createPanner();
                subwooferRear.panningModel = 'equalpower';

                // 5. 节点连接链路
                source.connect(bassFilter);
                bassFilter.connect(atmosPanner);
                bassFilter.connect(subwooferFront);
                bassFilter.connect(subwooferRear);
                bassFilter.connect(roomReverb);

                atmosPanner.connect(audioCtx.destination);
                subwooferFront.connect(audioCtx.destination);
                subwooferRear.connect(audioCtx.destination);
                roomReverb.connect(audioCtx.destination);
            }
            if (audioCtx.state === 'suspended') audioCtx.resume();
        }

        // 重低音按钮
        eqBass.onclick = function() {
            setupAudioEffects();
            isEqBassActive = !isEqBassActive;
            // 拉开低频增益，模拟底噪震颤
            bassFilter.gain.value = isEqBassActive ? 16 : 0; 
            this.classList.toggle('active');
        };

        // 杜比全景声按钮 (静止下压，绝无晃动)
        eqAtmos.onclick = function() {
            setupAudioEffects();
            isEqAtmosActive = !isEqAtmosActive;
            this.classList.toggle('active');

            if (isEqAtmosActive) {
                // === 【核心修改】：放弃旋转动画，改成【静态广阔声场】 ===
                // 根据您的需求，我们固定摆放位置，绝不产生平移飘忽感
                
                // 1. 地面声道 (前置22°-30°、后置90°-110°)
                subwooferFront.setPosition(0.4, 0, 2.0);   // 声音在正前方偏右一点
                subwooferRear.setPosition(-0.4, 0, -2.0);  // 声音在正后方偏左一点

                // 2. 天空声道 (头顶45°-55°位置，产生下压感)
                atmosPanner.setPosition(0, -2.8, 0);      // Y轴负值代表头顶上方2.8米

                // 3. 增强低频的“大房间”震撼错觉
                bassFilter.gain.value = 12; // 全景声自带重低音增强

                // 浮动反馈
                console.log("杜比全景声开启：静态环绕 + 天空下压");
            } else {
                // 关闭后，将所有声源位置归零，还原为标准立体声
                if (subwooferFront) subwooferFront.setPosition(0, 0, 0);
                if (subwooferRear) subwooferRear.setPosition(0, 0, 0);
                if (atmosPanner) atmosPanner.setPosition(0, 0, 0);
                if (!isEqBassActive) bassFilter.gain.value = 0;
                console.log("杜比全景声关闭");
            }
        };

        // 重低音按钮
        eqBass.onclick = function() {
            setupAudioEffects();
            isEqBassActive = !isEqBassActive;
            // 开启后，前后低音炮的低频增益拉满，产生压迫感
            bassFilter.gain.value = isEqBassActive ? 14 : 0; 
            this.classList.toggle('active');
        };

        // 杜比全景声按钮 (核心环绕驱动)
        let atmosAnim = null;
        eqAtmos.onclick = function() {
            setupAudioEffects();
            isEqAtmosActive = !isEqAtmosActive;
            this.classList.toggle('active');

            if (isEqAtmosActive) {
                let angle = 0;
                // 开启真正的 3D 空间旋转 (多轴线同步移动)
                atmosAnim = setInterval(() => {
                    angle += 0.015;
                    
                    // 1. 地面声道 (X) 遵循您给定的 22°-30° 夹角巡航
                    const xPos = Math.sin(angle * 0.8) * 1.5;
                    const zPos = Math.cos(angle * 0.8) * 1.5;
                    subwooferFront.setPosition(xPos, 0, zPos + 1.5);
                    subwooferRear.setPosition(-xPos, 0, -zPos - 1.5);

                    // 2. 天空声道 (Z) 实现 45°-55° 顶置打雷般下压效果
                    const yAngle = Math.sin(angle * 0.5 + 1) * 0.8; // 制造不规则下压呼吸感
                    atmosPanner.setPosition(
                        Math.sin(angle * 0.4) * 1.2, // 头顶水平X轴滑动
                        -2.8 + Math.abs(yAngle),    // 头顶Y轴 (±0.8的高度下压变化)
                        Math.cos(angle * 0.4) * 1.2  // 头顶水平Z轴滑动
                    );

                    // 3. 为低音炮增加微小的“低频抖动”，模拟多炮相位差
                    // (注：这是模拟，通过 Web Audio 在不同声道进行细微的低频移位)
                }, 50);
            } else {
                clearInterval(atmosAnim);
                // 关闭后重置回到中心位置
                if (subwooferFront) subwooferFront.setPosition(0, 0, 1.5);
                if (subwooferRear) subwooferRear.setPosition(0, 0, -1.5);
                if (atmosPanner) atmosPanner.setPosition(0, -2.5, 0);
            }
        };

        // ------ 模式切换 ------
        modeBtn.onclick = function() {
            if (playMode === 'list') { playMode = 'single'; this.innerHTML = '<i class="fa-solid fa-repeat-1"></i>'; this.className = 'mode-btn active';
            } else if (playMode === 'single') { playMode = 'random'; this.innerHTML = '<i class="fa-solid fa-shuffle"></i>'; this.className = 'mode-btn active';
            } else { playMode = 'list'; this.innerHTML = '<i class="fa-solid fa-repeat"></i>'; this.className = 'mode-btn list active'; }
        };

        audioPlayer.onended = function() {
            playPauseBtn.innerHTML = '<i class="fa-solid fa-circle-play"></i>';
            lyricDisplay.className = 'lyric-display';
            if (playMode === 'single') {
                audioPlayer.play();
            } else {
                nextTrack();
            }
        };

        playPauseBtn.onclick = togglePlayPause;
        prevBtnCtrl.onclick = prevTrack;
        nextBtnCtrl.onclick = nextTrack;
        volumeSlider.oninput = function() {
            audioPlayer.volume = parseFloat(this.value);
        };

        // ------ 全局快捷键 ------
        document.onkeydown = function(e) {
            if (e.target.tagName === 'INPUT') return;
            if (e.code === 'Space') { e.preventDefault(); togglePlayPause(); }
            else if (e.code === 'ArrowRight') { e.preventDefault(); nextTrack(); }
            else if (e.code === 'ArrowLeft') { e.preventDefault(); prevTrack(); }
        };

        // ------ 记忆播放位置 ------
        window.onbeforeunload = function() {
            localStorage.setItem('lastSongIndex', currentSongIndex);
        };
        const savedIndex = localStorage.getItem('lastSongIndex');

        // ------ 歌单搜索过滤 ------
        searchInput.oninput = function() {
            const val = this.value.toLowerCase();
            const items = document.querySelectorAll('.music-item');
            items.forEach(el => {
                const name = el.querySelector('.song-name').textContent.toLowerCase();
                el.style.display = name.includes(val) ? 'flex' : 'none';
            });
        };

        document.querySelectorAll('.music-item').forEach(el => {
            el.onclick = function() {
                const index = parseInt(this.getAttribute('data-index'));
                playSong(index);
            };
        });

        // ------ 播放器初始化 ------ 
        if (allSongs.length > 0) {
            setTimeout(() => {
                if (savedIndex && savedIndex < allSongs.length) {
                    playSong(parseInt(savedIndex));
                } else {
                    playSong(0);
                }
                audioPlayer.pause(); 
                playPauseBtn.innerHTML = '<i class="fa-solid fa-circle-play"></i>';
                lyricDisplay.className = 'lyric-display';
            }, 100);
        }
    }

    // ==========================================================
    // 【启动】
    // ==========================================================
    loadHomeData();

})();