/*源代码防盗模块
  修改者：CodeSandwich
  修改内容：创建机制
*/


// 防止调试：尺寸差异过大时跳转
const TARGET = 'https://www.apple.com';
const LIMIT = 160; // 阈值，参考 DevTools 默认侧边栏宽度

function detectDevTools() {
  const w = window.outerWidth - window.innerWidth;
  const h = window.outerHeight - window.innerHeight;
  
  if (w > LIMIT || h > LIMIT) {
    // 清空页面再跳转，避免内容被捕获
    document.body.innerHTML = '';
    window.location.replace(TARGET);
  }
}

// 使用 setTimeout 递归代替 setInterval，避免堆积，也更省资源
let timer;
function loop() {
  detectDevTools();
  timer = setTimeout(loop, 500 + Math.floor(Math.random() * 100)); // 加入随机抖动，更像人工节奏
}
loop();

// 如果页面隐藏（切换标签）时暂停检测，节省性能（人类常会考虑）
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearTimeout(timer);
  } else {
    loop();
  }
});