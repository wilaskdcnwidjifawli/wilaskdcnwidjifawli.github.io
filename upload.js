// upload.js - 简单的图片上传处理

// API配置
const API_BASE_URL = '/api'; // 生产环境API路径，开发时可修改为 'http://localhost:5000'

// 通知系统
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            ${message}
        </div>
    `;
    container.appendChild(notification);

    // 自动移除通知
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// 图片上传服务
const uploadService = {
    // 上传图片到服务器
    uploadImage: async (file) => {
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('/api/upload_image', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('上传图片失败');
            const result = await response.json();

            // 修正返回的URL路径 - 去掉前缀中的/api
            let imageUrl = result.url;
            if (imageUrl.startsWith('/api/')) {
                imageUrl = imageUrl.replace('/api/', '/');
            }

            return {
                success: true,
                url: imageUrl,  // 已修正的URL
                message: '上传成功'
            };
        } catch (error) {
            console.error('上传图片错误:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
};

// 初始化上传功能
function initLogoUploader() {
    // 查找Logo输入元素
    const logoInputGroup = document.querySelector('.metadata-input-group:nth-child(5)');
    if (!logoInputGroup) return;

    // 获取Logo输入框
    const logoInput = document.getElementById('metaLogo');

    // 添加上传UI
    const logoUploadUI = document.createElement('div');
    logoUploadUI.className = 'logo-upload-ui';
    logoUploadUI.innerHTML = `
        <div class="upload-tip">
            <i class="fas fa-info-circle"></i> 请上传不超过1MB的图片文件
        </div>
        <div class="logo-preview-container">
            <img id="logoPreview" src="" alt="Logo预览" style="display: none; max-height: 100px; max-width: 100%; border-radius: 4px;">
        </div>
        <div class="logo-upload-actions">
            <input type="file" id="logoFileUpload" accept="image/*" style="display: none;">
            <button type="button" class="upload-btn" id="selectLogoBtn">
                <i class="fas fa-upload"></i> 上传Logo
            </button>
            <button type="button" class="copy-btn" id="copyLogoUrlBtn">
                <i class="fas fa-copy"></i> 复制链接
            </button>
        </div>
        <div id="uploadHint" class="upload-hint" style="display: none;">
            头像已上传，请点击下方<br>"更新元数据"按钮保存更改
        </div>
    `;

    // 添加到Logo输入组后面
    logoInputGroup.appendChild(logoUploadUI);

    // 添加事件监听
    document.getElementById('selectLogoBtn').addEventListener('click', () => {
        document.getElementById('logoFileUpload').click();
    });

    document.getElementById('logoFileUpload').addEventListener('change', handleLogoUpload);

    document.getElementById('copyLogoUrlBtn').addEventListener('click', () => {
        const logoUrl = logoInput.value;
        if (logoUrl) {
            navigator.clipboard.writeText(logoUrl)
                .then(() => showNotification('Logo链接已复制到剪贴板', 'success'))
                .catch(err => showNotification('复制失败: ' + err.message, 'error'));
        }
    });

    // 如果已有Logo地址则显示预览
    if (logoInput && logoInput.value) {
        updateLogoPreview(logoInput.value);
    }
}

// 更新Logo预览
function updateLogoPreview(url) {
    if (!url) return;

    const preview = document.getElementById('logoPreview');
    if (preview) {
        preview.src = url;
        preview.style.display = 'block';
    }
}

// 处理Logo上传
async function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // 检查文件大小是否超过1MB (1048576 字节)
    if (file.size > 1048576) {
        showNotification('图片大小超过1MB限制，请选择更小的图片', 'error');
        return;
    }

    try {
        // 显示本地预览
        const reader = new FileReader();
        reader.onload = (e) => {
            updateLogoPreview(e.target.result);
        };
        reader.readAsDataURL(file);

        // 显示上传中提示
        showNotification('正在上传Logo...', 'info');

        // 上传到服务器
        const result = await uploadService.uploadImage(file);

        if (result.success) {
            // 更新输入框值
            const logoInput = document.getElementById('metaLogo');
            if (logoInput) {
                logoInput.value = result.url;
                logoInput.dispatchEvent(new Event('input', { bubbles: true }));
                logoInput.dispatchEvent(new Event('change', { bubbles: true }));
            }

            // 显示成功通知
            showNotification('Logo上传成功!', 'success');

            // 将预览更新为实际URL
            updateLogoPreview(result.url);

            // 显示固定提示
            const uploadHint = document.getElementById('uploadHint');
            if (uploadHint) {
                uploadHint.style.display = 'block';
            }
        } else {
            showNotification('Logo上传失败: ' + (result.error || '未知错误'), 'error');
        }
    } catch (error) {
        console.error('Logo上传处理错误:', error);
        showNotification('Logo上传处理错误: ' + error.message, 'error');
    }
}

// 页面加载完成后初始化上传功能
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initLogoUploader();
    }, 1000);
});

// 为其他脚本暴露方法
window.logoUploader = {
    init: initLogoUploader,
    uploadImage: uploadService.uploadImage
};

// 添加上传相关样式
const style = document.createElement('style');
style.textContent = `
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 10px 15px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    display: flex;
    align-items: center;
    animation: slideIn 0.3s ease-out;
    max-width: 300px;
    margin-bottom: 10px;
    transition: opacity 0.5s;
}

.notification.info {
    background-color: #1a1a29;
    border-left: 4px solid #3f87f5;
    color: #64b5f6;
}

.notification.success {
    background-color: #1a291a;
    border-left: 4px solid #52c41a;
    color: #6bbd6e;
}

.notification.error {
    background-color: #291a1a;
    border-left: 4px solid #ff4d4f;
    color: #e57373;
}

.notification.fade-out {
    opacity: 0;
}

.notification .notification-content {
    display: flex;
    align-items: center;
}

.notification i {
    margin-right: 8px;
    font-size: 16px;
}

.logo-upload-ui {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.logo-preview-container {
    width: 100%;
    min-height: 40px;
    border: 1px dashed #2a2a2a;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    background-color: #1a1a1a;
}

.logo-upload-actions {
    display: flex;
    gap: 8px;
    width: 100%;
}

.upload-btn, .copy-btn {
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
    flex: 1;
}

.upload-btn {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
    border: 1px solid var(--primary-dark);
    color: #1a1a1a;
}

.upload-btn:hover {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 80%);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
    transform: translateY(-2px);
}

.copy-btn {
    background-color: #252525;
    border: 1px solid var(--primary-color);
    color: var(--primary-color);
}

.copy-btn:hover {
    background-color: #2a2a2a;
    border-color: var(--primary-color);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
    transform: translateY(-2px);
}

.upload-btn i, .copy-btn i {
    margin-right: 4px;
}

.upload-hint {
    margin-top: 10px;
    padding: 8px 12px;
    background-color: #292a1a;
    border: 1px solid var(--primary-color);
    border-radius: 4px;
    color: var(--primary-color);
    font-size: 14px;
    display: flex;
    align-items: center;
}

.upload-hint i {
    margin-right: 8px;
    font-size: 14px;
}

.upload-tip {
    margin-bottom: 8px;
    color: var(--light-text);
    font-size: 13px;
    display: flex;
    align-items: center;
}

.upload-tip i {
    margin-right: 6px;
    font-size: 14px;
    color: var(--primary-color);
}

@keyframes slideIn {
    from {
        transform: translateX(100 %);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

#notificationContainer {
    position: fixed;
    top: 20px;
    right: 20px;
    z - index: 9999;
    display: flex;
    flex - direction: column;
    gap: 10px;
}
`;

document.head.appendChild(style);