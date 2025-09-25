class MarkdownLoader {
    constructor() {
        this.cache = new Map();
        this.config = {
            basePath: 'content/',
            enableCache: true,
            autoHeaders: true
        };
    }

    async load(containerId, mdFile, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Контейнер ${containerId} не найден`);
            return;
        }

        // Показываем индикатор загрузки
        container.innerHTML = '<div class="loading">Загрузка...</div>';

        try {
            const fullPath = this.config.basePath + mdFile;
            let content;

            // Проверяем кэш
            if (this.config.enableCache && this.cache.has(fullPath)) {
                content = this.cache.get(fullPath);
            } else {
                const response = await fetch(fullPath);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                content = await response.text();
                if (this.config.enableCache) {
                    this.cache.set(fullPath, content);
                }
            }

            // Рендеринг Markdown
            const html = this.renderMarkdown(content, options);
            container.innerHTML = html;

            // Обработка после рендеринга
            this.postRender(container, options);

        } catch (error) {
            console.error('Ошибка загрузки MD:', error);
            container.innerHTML = `
                <div class="error">
                    <h3>Ошибка загрузки содержимого</h3>
                    <p>Файл: ${mdFile}</p>
                    <button onclick="mdLoader.load('${containerId}', '${mdFile}')">
                        Повторить загрузку
                    </button>
                </div>
            `;
        }
    }

    renderMarkdown(content, options) {
        // Кастомные правила для marked
        const renderer = new marked.Renderer();
        
        // Автоматические якоря для заголовков
        if (options.autoHeaders !== false) {
            renderer.heading = (text, level) => {
                const slug = text.toLowerCase()
                    .replace(/[^\wа-яё]+/g, '-')
                    .replace(/^-+|-+$/g, '');
                return `<h${level} id="${slug}">
                    <a href="#${slug}" class="header-anchor">#</a>
                    ${text}
                </h${level}>`;
            };
        }

        return marked.parse(content, { renderer });
    }

    postRender(container, options) {
        // Подсветка кода
        if (typeof Prism !== 'undefined') {
            Prism.highlightAllUnder(container);
        }

        // Обработка внутренних ссылок
        this.processInternalLinks(container);

        // Обработка изображений
        this.processImages(container);
    }

    processInternalLinks(container) {
        const links = container.querySelectorAll('a[href^="#"]');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const target = document.getElementById(targetId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    processImages(container) {
        const images = container.querySelectorAll('img');
        images.forEach(img => {
            img.loading = 'lazy';
            img.addEventListener('click', () => this.openImageModal(img.src));
        });
    }

    openImageModal(src) {
        // Реализация модального окна для изображений
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); display: flex; align-items: center;
            justify-content: center; z-index: 1000;
        `;
        modal.innerHTML = `
            <img src="${src}" style="max-width: 90%; max-height: 90%">
            <button style="position: absolute; top: 20px; right: 20px; background: red; color: white; border: none; padding: 10px; cursor: pointer;">×</button>
        `;
        modal.querySelector('button').onclick = () => modal.remove();
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        document.body.appendChild(modal);
    }
}

// Глобальный экземпляр
const mdLoader = new MarkdownLoader();