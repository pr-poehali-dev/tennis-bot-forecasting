// Букмарклет для парсинга матчей с Liga Stavok
// Перетащи эту ссылку на панель закладок:
// javascript:(function(){const script=document.createElement('script');script.src='https://your-domain.poehali.dev/bookmarklet.js';document.body.appendChild(script);})();

(function() {
  console.log('🏓 TT Predict Parser запущен...');
  
  const matches = [];
  
  // Вариант 1: Поиск по всем элементам с текстом
  const allElements = document.querySelectorAll('*');
  const playerPattern = /([А-Яа-я\s\.\-]+[А-Яа-я])\s*[-–—vs\.]+\s*([А-Яа-я\s\.\-]+[А-Яа-я])/gi;
  
  allElements.forEach(el => {
    const text = el.textContent || el.innerText || '';
    
    // Пропускаем большие блоки
    if (text.length > 200) return;
    
    const match = text.match(playerPattern);
    if (match) {
      const parts = text.split(/[-–—vs\.]/);
      if (parts.length === 2) {
        const p1 = parts[0].trim();
        const p2 = parts[1].trim();
        
        // Проверка на валидность (имя + точка или инициал)
        if (p1.length > 3 && p2.length > 3 && p1.length < 50 && p2.length < 50) {
          matches.push({ player1: p1, player2: p2 });
        }
      }
    }
  });
  
  // Удаляем дубликаты
  const unique = [];
  const seen = new Set();
  matches.forEach(m => {
    const key = `${m.player1}|${m.player2}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(m);
    }
  });
  
  console.log('Найдено матчей:', unique);
  
  if (unique.length > 0) {
    localStorage.setItem('liga_stavok_import', JSON.stringify(unique));
    
    // Создаем красивое уведомление
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #22c55e;
      color: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      z-index: 999999;
      font-family: system-ui, -apple-system, sans-serif;
      min-width: 300px;
    `;
    notification.innerHTML = `
      <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">✅ Найдено ${unique.length} матчей!</div>
      <div style="font-size: 14px; opacity: 0.9; margin-bottom: 12px;">Данные сохранены. Переходи в админку для импорта.</div>
      <button onclick="window.open('/admin', '_blank'); this.parentElement.remove();" style="
        background: white;
        color: #22c55e;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        font-size: 14px;
      ">Открыть админку</button>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 10000);
  } else {
    alert('❌ Матчи не найдены на этой странице.\n\nУбедись, что ты на странице с настольным теннисом (Лига Про, Сетка Кап и т.д.)');
  }
})();
