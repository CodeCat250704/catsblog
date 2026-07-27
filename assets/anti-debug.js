/* ==========================================================
 * 【反调试爆头防御系统】
 * 原理：检测窗口内、外宽高差异。
 * 一旦用户打开开发者工具 (F12/右键检查等)，窗口尺寸变化会瞬间触发跳转。
 * ========================================================== */

(function() {
    "use strict";

    // 报警阈值：当浏览器外部高度与内部高度的差值超过 160 像素时，判定为打开了开发者工具。
    // 注意：Mac/Windows 浏览器边框厚度不同，阈值设置为 160 是安全的临界点。
    var THRESHOLD = 160;

    // 目标跳转地址 (苹果官网)
    var TARGET_URL = "https://www.apple.com";

    function antiDebugCheck() {
        try {
            var widthDiff = window.outerWidth - window.innerWidth;
            var heightDiff = window.outerHeight - window.innerHeight;

            // 一旦发现尺寸差异过大，触发爆头跳转
            if (widthDiff > THRESHOLD || heightDiff > THRESHOLD) {
                // 在执行跳转前，先把当前页面清空，防止数据在跳转瞬间被截取
                document.documentElement.innerHTML = '';
                // 强制跳转至苹果官网，且无法后退
                window.location.replace(TARGET_URL);
            }
        } catch (e) {
            // 如果有人在控制台试图阻断监测，我们什么也不做，保持静默运行。
        }
    }

    // 以最高频率进行监测（每 500 毫秒一次），不给调试者留下任何喘息的时间
    setInterval(antiDebugCheck, 500);
})();