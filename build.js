import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { marked } from 'marked';

// Конфигурация
const config = {
    srcDir: './src',
    templatesDir: './templates',
    outputDir: './docs',
    baseUrl: '' // или '/ваш-репозиторий' для project pages
};

// Создаем выходную директорию
if (!existsSync(config.outputDir)) {
    mkdirSync(config.outputDir, { recursive: true });
}

// Функция для парсинга фронтматера
function parseFrontmatter(content) {
    const frontmatter = {};
    const lines = content.split('\n');
    
    if (lines[0] === '---') {
        let i = 1;
        while (i < lines.length && lines[i] !== '---') {
            const match = lines[i].match(/^([^:]+):\s*(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                
                // Попытка парсинга разных типов данных
                if (value === 'true') value = true;
                else if (value === 'false') value = false;
                else if (!isNaN(value) && value !== '') value = Number(value);
                else if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                
                frontmatter[key] = value;
            }
            i++;
        }
        return {
            frontmatter,
            content: lines.slice(i + 1).join('\n')
        };
    }
    
    return { frontmatter: {}, content };
}

// Функция для рендеринга шаблона
function renderTemplate(template, data) {
    let html = template;
    
    // Замена простых переменных {{variable}}
    html = html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] !== undefined ? data[key] : match;
    });
    
    // Обработка условных блоков {{#condition}}...{{/condition}}
    html = html.replace(/\{\{#(\w+)\}\}(.*?)\{\{\/\1\}\}/gs, (match, key, content) => {
        return data[key] ? content : '';
    });
    
    return html;
}

// Основная функция сборки
async function build() {
    console.log('Начало сборки...');
    
    // Читаем все шаблоны
    const templates = {};
    const templateFiles = readdirSync(config.templatesDir);
    
    for (const file of templateFiles) {
        if (file.endsWith('.html')) {
            const templatePath = join(config.templatesDir, file);
            templates[file] = readFileSync(templatePath, 'utf8');
        }
    }
    
    // Функция для обработки директорий рекурсивно
    function processDirectory(dir, basePath = '') {
        const items = readdirSync(dir);
        
        for (const item of items) {
            const fullPath = join(dir, item);
            const relativePath = join(basePath, item);
            const stat = statSync(fullPath);
            
            if (stat.isDirectory()) {
                processDirectory(fullPath, relativePath);
            } else if (item.endsWith('.md')) {
                processMarkdownFile(fullPath, relativePath);
            }
        }
    }
    
    // Функция обработки MD-файла
    function processMarkdownFile(filePath, relativePath) {
        console.log(`Обработка: ${relativePath}`);
        
        const content = readFileSync(filePath, 'utf8');
        const { frontmatter, content: markdownContent } = parseFrontmatter(content);
        
        // Конвертируем Markdown в HTML
        const htmlContent = marked.parse(markdownContent);
        
        // Определяем шаблон
        const templateName = frontmatter.template || 'base.html';
        const template = templates[templateName];
        
        if (!template) {
            console.warn(`Шаблон ${templateName} не найден для файла ${relativePath}`);
            return;
        }
        
        // Подготавливаем данные для шаблона
        const templateData = {
            ...frontmatter,
            content: htmlContent
        };
        
        // Рендерим шаблон
        const finalHtml = renderTemplate(template, templateData);
        
        // Определяем выходной путь
        const outputPath = relativePath.replace(/\.md$/, '.html');
        const fullOutputPath = join(config.outputDir, outputPath);
        
        // Создаем директории если нужно
        const outputDir = dirname(fullOutputPath);
        if (!existsSync(outputDir)) {
            mkdirSync(outputDir, { recursive: true });
        }
        
        // Сохраняем файл
        writeFileSync(fullOutputPath, finalHtml);
        console.log(`Создан: ${outputPath}`);
    }
    
    // Запускаем обработку
    processDirectory(config.srcDir);
    
    console.log('Сборка завершена!');
}

// Запускаем сборку
build().catch(console.error);