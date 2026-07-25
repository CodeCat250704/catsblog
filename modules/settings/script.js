(function() {
    console.log('设置页面已加载 (完美联动版)');

    const darkModeToggle = document.getElementById('darkModeToggle');
    const blurSlider = document.getElementById('blurSlider');

    // 1. 毛玻璃透明度调节 (直接操作所有玻璃面板)
    if (blurSlider) {
        // 读取上次保存的模糊值
        const savedBlur = localStorage.getItem('glassBlur') || '15';
        blurSlider.value = savedBlur;
        applyBlur(savedBlur);

        blurSlider.addEventListener('input', (e) => {
            const val = e.target.value;
            localStorage.setItem('glassBlur', val);
            applyBlur(val);
        });
    }

    function applyBlur(val) {
        document.querySelectorAll('.glass-panel').forEach(el => {
            el.style.backdropFilter = `blur(${val}px)`;
        });
    }

    // 2. 深色模式切换开关
    if (darkModeToggle) {
        // 恢复本地保存的状态
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        darkModeToggle.checked = savedDarkMode;
        applyDarkMode(savedDarkMode);

        darkModeToggle.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            localStorage.setItem('darkMode', isChecked);
            applyDarkMode(isChecked);
        });
    }

    // 辅助函数：切换主题 (针对设置模块新增的 CSS 类)
    function applyDarkMode(isDark) {
        if (isDark) {
            document.body.classList.add('dark-theme');
            // 更改背景图的滤镜 (让深色模式下背景暗一点，突出白字)
            document.querySelector('.background-layer').style.filter = 'brightness(0.5)';
        } else {
            document.body.classList.remove('dark-theme');
            document.querySelector('.background-layer').style.filter = 'none';
        }
    }

})();