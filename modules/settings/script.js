(function() {
    console.log('设置页面加载完成。');

    const darkModeToggle = document.getElementById('darkModeToggle');
    const blurSlider = document.getElementById('blurSlider');

    // 1. 毛玻璃透明度调节
    if (blurSlider) {
        blurSlider.addEventListener('input', (e) => {
            const val = e.target.value;
            document.querySelectorAll('.glass-panel').forEach(el => {
                el.style.backdropFilter = `blur(${val}px)`;
            });
        });
    }

    // 2. 深色模式切换开关 (模拟状态变更)
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

    // 辅助函数：切换主题
    function applyDarkMode(isDark) {
        if (isDark) {
            // 模拟反转色达到深色效果
            document.body.style.filter = 'invert(1) hue-rotate(180deg)';
            document.querySelector('.background-layer').style.filter = 'invert(1) hue-rotate(180deg)';
        } else {
            document.body.style.filter = 'none';
            document.querySelector('.background-layer').style.filter = 'none';
        }
    }
})();