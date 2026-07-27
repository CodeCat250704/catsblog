(function() {
    // 模拟数据源：实际开发中可通过 fetch 请求读取 /book/information/ 下的 JSON
    const submitData = {
        rules: [
            "所有提交的作品必须为原创，严禁抄袭或侵犯他人版权。",
            "文章内容需积极向上，符合法律法规，不得包含恶意言论或敏感信息。",
            "审核周期通常为 4 至 6 个工作日，通过后将在首页展示。",
            "如审核不通过，我们会通过邮件告知具体原因及修改建议。"
        ],
        methods: [
            "请将您的文章或作品打包为 ZIP 或 RAR 格式的压缩包。",
            "按照博客规范，提供文章对应的 meta.json 以及 content.md 文件。",
            "content.md 为作品文件格式，如有照片请另附picture文件夹。",
            "通过下方任意邮箱发送至我们的投稿邮箱。"
        ],
        email: "xsh3304832000@163.com",
        reviewCycle: "4 至 6 个工作日内回复。",
        template: {
            to: "xsh3304832000@163.com",
            subject: "【投稿】[您的文章标题] - [您的昵称]",
            body: "尊敬的编辑老师：\n\n　　您好！附件是我的投稿作品《[文章标题]》。\n　　文章分类：[例如：前端开发]\n　　内容简介：[简要描述文章大意]\n\n　　期待您的审阅，谢谢！\n\n[您的姓名/昵称]\n[投稿日期]"
        }
    };

    // 渲染页面
    function renderSubmitUI() {
        // 1. 渲染审核规则与投稿方式
        const ruleContainer = document.querySelector('.submit-card:first-child .card-body');
        if (ruleContainer) {
            let html = `
                <div class="info-block">
                    <div class="info-title"><i class="fa-regular fa-circle-check" style="margin-right: 6px; color: #4F9CF7;"></i>审核规则</div>
                    <div class="info-text">
                        ${submitData.rules.map(rule => `<p>${rule}</p>`).join('')}
                    </div>
                </div>
                <div class="info-block">
                    <div class="info-title"><i class="fa-regular fa-file-lines" style="margin-right: 6px; color: #4F9CF7;"></i>投稿方式</div>
                    <div class="info-text">
                        ${submitData.methods.map(method => `<p>${method}</p>`).join('')}
                    </div>
                </div>
                <div class="info-block">
                    <div class="info-title"><i class="fa-regular fa-address-card" style="margin-right: 6px; color: #4F9CF7;"></i>联系方式</div>
                    <div class="info-text">
                        <strong>投稿邮箱：</strong> ${submitData.email}<br>
                        <strong>审稿周期：</strong> ${submitData.reviewCycle}
                    </div>
                </div>
            `;
            ruleContainer.innerHTML = html;
        }

        // 2. 渲染邮件模板
        const templateContainer = document.querySelector('.submit-card:nth-child(2) .template-box-black');
        if (templateContainer) {
            templateContainer.innerHTML = `
                <div>收件人： ${submitData.template.to}</div>
                <div style="margin-top: 8px;">主题： ${submitData.template.subject}</div>
                <div style="margin-top: 16px;">${submitData.template.body.replace(/\n/g, '<br>')}</div>
            `;
        }
    }

    // 执行渲染
    renderSubmitUI();

    console.log("投稿中心已加载，数据驱动版本。");
})();