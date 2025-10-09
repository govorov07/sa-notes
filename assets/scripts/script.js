// Автоматическое создание оглавления
document.addEventListener('DOMContentLoaded', function() {
	// Принудительное аппаратное ускорение для анимаций
	const style = document.createElement('style');
	style.textContent = `.toc-link, .tree-link, .jira-issue-key, .scroll-to-top, .copy-button, .confluence-macro, .styled-list > li {transform: translateZ(0); backface-visibility: hidden; perspective: 1000px;}`;
	document.head.appendChild(style);
	
	const toc = document.getElementById('toc');
	const articleToc = document.getElementById('articleToc');
	const scrollToTopBtn = document.getElementById('scrollToTop');
	const headers = document.querySelectorAll('h1, h2, h3, h4');
	const tocLinks = [];
	
	// Создаем элементы оглавления
	headers.forEach(header => {
		if (!header.id) return;
		
		const level = parseInt(header.tagName.substring(1));
		const listItem = document.createElement('li');
		listItem.className = 'toc-item';
		
		const link = document.createElement('a');
		link.href = `#${header.id}`;
		link.textContent = header.textContent;
		link.className = `toc-link toc-level-${level}`;
		
		listItem.appendChild(link);
		toc.appendChild(listItem);
		
		tocLinks.push({
			link: link,
			element: header
		});
	});
	
	// Скрываем оглавление если мало разделов
	if (tocLinks.length <= 2) {
		articleToc.style.display = 'none';
	}
	
	// Подсветка активного раздела
	function updateActiveTocLink() {
		const scrollPosition = window.scrollY + 100;
		
		let currentActive = null;
		
		for (let i = tocLinks.length - 1; i >= 0; i--) {
			const { link, element } = tocLinks[i];
			const elementTop = element.offsetTop;
			
			if (scrollPosition >= elementTop) {
				currentActive = link;
				break;
			}
		}
		
		// Удаляем активный класс у всех ссылок
		tocLinks.forEach(({ link }) => {
			link.classList.remove('active');
		});
		
		// Добавляем активный класс текущей ссылке
		if (currentActive) {
			currentActive.classList.add('active');
			
			// Прокручиваем оглавление к активному элементу
			const tocContainer = document.getElementById('articleToc');
			const activeRect = currentActive.getBoundingClientRect();
			const tocRect = tocContainer.getBoundingClientRect();
			
			if (activeRect.bottom > tocRect.bottom || activeRect.top < tocRect.top) {
				currentActive.scrollIntoView({
					behavior: 'smooth',
					block: 'center'
				});
			}
		}
	}
	
	// Плавная прокрутка к разделам
	document.querySelectorAll('.toc-link').forEach(link => {
		link.addEventListener('click', function(e) {
			e.preventDefault();
			const targetId = this.getAttribute('href');
			const targetElement = document.querySelector(targetId);
			
			if (targetElement) {
				const offsetTop = targetElement.offsetTop - 100;
				window.scrollTo({
					top: offsetTop,
					behavior: 'smooth'
				});
			}
		});
	});
	
	// Показ/скрытие кнопки "Вверх"
	function toggleScrollToTopButton() {
		if (window.pageYOffset > 300) {
			scrollToTopBtn.classList.add('show');
		} else {
			scrollToTopBtn.classList.remove('show');
		}
	}
	
	// Прокрутка к началу страницы
	scrollToTopBtn.addEventListener('click', function() {
		window.scrollTo({
			top: 0,
			behavior: 'smooth'
		});
	});

	// Регистрируем язык PlantUML для Prism.js
	Prism.languages.plantuml = {
		'comment': {
			pattern: /('.*|\\'.*|'.*\\')/,
			greedy: true
		},
		'directive': {
			pattern: /@\w+/,
			alias: 'keyword'
		},
		'keyword': /\b(startuml|enduml|title|actor|participant|boundary|control|entity|database|collections|queue|as)\b/,
		'string': {
			pattern: /"[^"]*"|'[^']*'/,
			greedy: true
		},
		'actor': {
			pattern: /actor\s+"[^"]*"/,
			inside: {
				'keyword': /actor/,
				'string': /"[^"]*"/
			}
		},
		'participant': {
			pattern: /participant\s+"[^"]*"/,
			inside: {
				'keyword': /participant/,
				'string': /"[^"]*"/
			}
		},
		'arrow': {
			pattern: /->|-->|->>|-->>|<-|<<-|<-|<<--/,
			alias: 'operator'
		},
		'activation': /\b(activate|deactivate|create|destroy)\b/,
		'alt': /\b(alt|else|end|opt|loop|par|break|critical|group)\b/,
		'note': {
			pattern: /note\s+(left|right|top|bottom)\s+of\s+"[^"]*"/,
			inside: {
				'keyword': /note/,
				'string': /"[^"]*"/
			}
		},
		'title': {
			pattern: /title\s+[^\n]+/,
			inside: {
				'keyword': /title/,
				'string': /[^\n]+/
			}
		}
	};
	
	// Применяем Prism.js ко всем блокам кода
	Prism.highlightAll();
	
	// Сворачиваем оглавление при скролле (опционально)
	let lastScrollTop = 0;
	function handleScroll() {
		const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
		
		if (scrollTop > lastScrollTop && scrollTop > 200) {
			// Прокрутка вниз - можно добавить компактный режим
			articleToc.classList.add('toc-compact');
		} else {
			articleToc.classList.remove('toc-compact');
		}
		
		lastScrollTop = scrollTop;
		updateActiveTocLink();
		toggleScrollToTopButton();
	}
	
	// Слушатели событий
	window.addEventListener('scroll', handleScroll);
	window.addEventListener('resize', updateActiveTocLink);
	
	// Инициализация
	updateActiveTocLink();
	toggleScrollToTopButton();
});