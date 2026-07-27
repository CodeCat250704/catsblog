/* ==========================================================
 * 【国际化多语言引擎 (联合国六语 + 繁/日)】
 * ========================================================== */

const LANG_DICT = {
    // --- 导航栏文字 ---
    'nav_home': {
        'zh-CN': '首页', 'zh-TW': '首頁', 'en': 'Home',
        'ja': 'ホーム', 'ru': 'Главная', 'es': 'Inicio', 'fr': 'Accueil'
    },
    'nav_categories': {
        'zh-CN': '分类', 'zh-TW': '分類', 'en': 'Categories',
        'ja': 'カテゴリ', 'ru': 'Категории', 'es': 'Categorías', 'fr': 'Catégories'
    },
    'nav_collection': {
        'zh-CN': '收藏', 'zh-TW': '收藏', 'en': 'Favorites',
        'ja': 'お気に入り', 'ru': 'Избранное', 'es': 'Favoritos', 'fr': 'Favoris'
    },
    'nav_notice': {
        'zh-CN': '通知', 'zh-TW': '通知', 'en': 'Notice',
        'ja': 'お知らせ', 'ru': 'Уведомления', 'es': 'Avisos', 'fr': 'Avis'
    },
    'nav_co-create': {
        'zh-CN': '共创', 'zh-TW': '共創', 'en': 'Co-create',
        'ja': '共同制作', 'ru': 'Сотворчество', 'es': 'Co-crear', 'fr': 'Co-créer'
    },
    'nav_submit': {
        'zh-CN': '投稿', 'zh-TW': '投稿', 'en': 'Submit',
        'ja': '投稿', 'ru': 'Отправить', 'es': 'Enviar', 'fr': 'Soumettre'
    },
    'nav_about': {
        'zh-CN': '关于', 'zh-TW': '關於', 'en': 'About',
        'ja': 'について', 'ru': 'О нас', 'es': 'Acerca de', 'fr': 'À propos'
    },
    'nav_settings': {
        'zh-CN': '设置', 'zh-TW': '設置', 'en': 'Settings',
        'ja': '設定', 'ru': 'Настройки', 'es': 'Ajustes', 'fr': 'Paramètres'
    },

    // --- 分类阅读器文字 ---
    'reader_empty_title': {
        'zh-CN': '阅读文章区域', 'zh-TW': '閱讀文章區域', 'en': 'Article Reader',
        'ja': '記事リーダー', 'ru': 'Читатель статей', 'es': 'Lector de artículos', 'fr': 'Lecteur d\'articles'
    },
    'reader_empty_desc': {
        'zh-CN': '请从左侧选择分类与文章以开始阅读', 'zh-TW': '請從左側選擇分類與文章以開始閱讀', 
        'en': 'Select a category and article from the left to start reading',
        'ja': '左からカテゴリと記事を選択して読み始めてください',
        'ru': 'Выберите категорию и статью слева, чтобы начать чтение',
        'es': 'Selecciona una categoría y un artículo desde la izquierda para comenzar a leer',
        'fr': 'Sélectionnez une catégorie et un article à gauche pour commencer à lire'
    },

    // --- 首页轮播文字 (动态词条) ---
    'home_click_details': {
        'zh-CN': '点击查看详情', 'zh-TW': '點擊查看詳情', 'en': 'Click for details',
        'ja': '詳細をクリック', 'ru': 'Нажмите для подробностей', 'es': 'Haga clic para más detalles', 'fr': 'Cliquez pour plus de détails'
    }
};

// 支持的语言列表
const SUPPORTED_LANGS = [
    { code: 'zh-CN', name: '简体中文' },
    { code: 'zh-TW', name: '繁體中文' },
    { code: 'en', name: 'English' },
    { code: 'ja', name: '日本語' },
    { code: 'ru', name: 'Русский' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' }
];

// 获取当前语言，默认为 zh-CN
let currentLang = localStorage.getItem('site_lang') || 'zh-CN';

// 核心翻译函数
function t(key) {
    if (!LANG_DICT[key]) return key; // 如果找不到这个词条，直接返回原词
    return LANG_DICT[key][currentLang] || LANG_DICT[key]['zh-CN']; // 找不到当前语言，回退中文
}

// 切换语言并刷新页面
function setLanguage(code) {
    currentLang = code;
    localStorage.setItem('site_lang', code);
    applyLanguage();
}

// 应用翻译到页面元素
function applyLanguage() {
    // 翻译导航和全局固定元素
    const elements = document.querySelectorAll('[data-lang-key]');
    elements.forEach(el => {
        const key = el.getAttribute('data-lang-key');
        el.textContent = t(key);
    });
}

// 初始化页面语言（加载完 DOM 后调用）
document.addEventListener('DOMContentLoaded', () => {
    // 把翻译函数挂到全局，以便其他模块调用
    window.__t = t;
    window.__setLang = setLanguage;
    window.__currentLang = currentLang;
    applyLanguage();
});