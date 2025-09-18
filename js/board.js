/* board.js
   - 支持：左侧月历（切换月/年），点击某天显示 农历 + 星期
   - 右侧：时钟（每秒刷新），天气（优先定位经纬度拉取）
   - 注意：请把 YOUR_API_KEY 替换为你的 OpenWeather API Key
*/

document.addEventListener('DOMContentLoaded', () => {
  // -------- 配置 --------
  const OPENWEATHER_API_KEY = "YOUR_API_KEY"; // ← 替换这里
  const DEFAULT_CITY = "Beijing";
  const WEATHER_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 分钟

  // -------- 元素引用 --------
  const monthTitle = document.getElementById('monthTitle');
  const calendarGrid = document.getElementById('calendarGrid');
  const dayInfo = document.getElementById('dayInfo');
  const timeEl = document.getElementById('time');
  const dateEl = document.getElementById('date');
  const weatherEl = document.getElementById('weather-body');
  const weatherLocationEl = document.getElementById('weather-location');
  const weatherNote = document.getElementById('weather-note');
  const refreshWeatherBtn = document.getElementById('refreshWeather');

  // -------- 日历状态 --------
  const today = new Date();
  let curYear = today.getFullYear();
  let curMonth = today.getMonth(); // 0-11
  let selected = { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };

  // -------- 时钟 --------
  function updateClock() {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit', second: '2-digit'});
    dateEl.textContent = now.toLocaleDateString('zh-CN', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'});
  }
  updateClock();
  setInterval(updateClock, 1000);

  // -------- 日历渲染 --------
  function renderCalendar(year, month) {
    calendarGrid.innerHTML = "";
    // 标题
    const monthName = new Date(year, month, 1).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
    monthTitle.textContent = monthName;

    // 以星期一为第一天（显示：一 二 三 四 五 六 日）
    const firstDay = new Date(year, month, 1).getDay(); // 0 Sun ... 6 Sat
    const startIndex = (firstDay + 6) % 7; // 把 Sun(0) -> 6, Mon(1) -> 0 ...
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    // 36 或 42 格子都可；我们做固定 6 行（42格），避免高度跳动
    for (let i = 0; i < 42; i++) {
      const cell = document.createElement('div');
      cell.className = 'day';
      // 计算对应的日期
      let dayNum, cellMonthOffset; // offset: -1 prev, 0 cur, 1 next
      const idx = i - startIndex;
      if (idx < 0) {
        dayNum = daysInPrev + idx + 1;
        cellMonthOffset = -1;
      } else if (idx >= daysInMonth) {
        dayNum = idx - daysInMonth + 1;
        cellMonthOffset = 1;
      } else {
        dayNum = idx + 1;
        cellMonthOffset = 0;
      }

      // 真实的 year/month/day
      let cellYear = year, cellMonth = month;
      if (cellMonthOffset === -1) {
        cellMonth = month - 1;
        if (cellMonth < 0) { cellMonth = 11; cellYear = year - 1; }
      } else if (cellMonthOffset === 1) {
        cellMonth = month + 1;
        if (cellMonth > 11) { cellMonth = 0; cellYear = year + 1; }
      }

      const cellDate = new Date(cellYear, cellMonth, dayNum);

      // 标记今天
      if (cellDate.toDateString() === new Date().toDateString()) {
        cell.classList.add('today');
      }
      // 标记选中
      if (cellYear === selected.year && cellMonth === selected.month && dayNum === selected.day) {
        cell.classList.add('selected');
      }
      if (cellMonthOffset !== 0) cell.classList.add('muted');

      // 显示日号
      const num = document.createElement('div');
      num.className = 'day-number';
      num.textContent = dayNum;
      cell.appendChild(num);

      // 点击事件：选择并显示详情
      cell.dataset.year = cellYear;
      cell.dataset.month = cellMonth;
      cell.dataset.day = dayNum;
      cell.addEventListener('click', onDayClick);

      calendarGrid.appendChild(cell);
    }
  }

  function onDayClick(e) {
    const cell = e.currentTarget;
    const y = parseInt(cell.dataset.year, 10);
    const m = parseInt(cell.dataset.month, 10);
    const d = parseInt(cell.dataset.day, 10);

    // 更新选中样式
    document.querySelectorAll('.day.selected').forEach(el => el.classList.remove('selected'));
    cell.classList.add('selected');

    selected = { year: y, month: m, day: d };

    const dt = new Date(y, m, d);
    const weekday = dt.toLocaleDateString('zh-CN', { weekday: 'long' });

    const lunar = getLunarString(dt); // 使用 Intl（若浏览器支持）
    // 组装详情显示
    dayInfo.innerHTML = `
      <div style="font-weight:700; color:var(--gold); margin-bottom:6px;">
        ${y} 年 ${m+1} 月 ${d} 日 · ${weekday}
      </div>
      <div style="font-size:0.98rem; color:var(--cream);">
        ${lunar}
      </div>
    `;
  }

  // -------- 农历（优先使用 Intl 的 chinese calendar 支持）--------
  function getLunarString(dateObj) {
    // 尝试用 Intl (现代浏览器可能支持 'chinese' 日历)
    try {
      // 这里我们用区域标记 + 扩展 - 浏览器若支持，会返回农历
      const fmt = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      // 格式化后的字符串通常包含农历年月日（若浏览器支持）
      return fmt.format(dateObj);
    } catch (err) {
      // 不支持时，简单返回提示。你也可以在后续版本里替换为本地算法或调用第三方API。
      return '（当前浏览器不支持内建农历显示；如需精确农历，请启用 polyfill 或使用服务端/第三方 API）';
    }
  }

  // -------- 月份/年份导航按钮 --------
  document.getElementById('prevMonth').addEventListener('click', () => {
    curMonth--;
    if (curMonth < 0) { curMonth = 11; curYear--; }
    renderCalendar(curYear, curMonth);
  });
  document.getElementById('nextMonth').addEventListener('click', () => {
    curMonth++;
    if (curMonth > 11) { curMonth = 0; curYear++; }
    renderCalendar(curYear, curMonth);
  });
  document.getElementById('prevYear').addEventListener('click', () => { curYear--; renderCalendar(curYear, curMonth); });
  document.getElementById('nextYear').addEventListener('click', () => { curYear++; renderCalendar(curYear, curMonth); });

  // 初始化日历（第一页）
  renderCalendar(curYear, curMonth);

  // -------- 天气（优先使用经纬度） --------
  let weatherTimer = null;

  async function fetchWeatherByCoords(lat, lon) {
    if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === "8e41d8d75dbe69bee58bfa31b2c02f99") {
      weatherEl.textContent = "请在 board.js 中填写 OpenWeather API Key（YOUR_API_KEY）";
      weatherLocationEl.textContent = "未配置 API Key";
      return;
    }
    try {
      weatherEl.textContent = "正在加载天气…";
      weatherLocationEl.textContent = "定位中...";
      weatherNote.textContent = "";

      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=zh_cn`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      renderWeather(data, /*source*/ `经纬度 (${lat.toFixed(3)}, ${lon.toFixed(3)})`);
    } catch (err) {
      console.error("fetchWeatherByCoords error:", err);
      weatherEl.textContent = "天气加载失败";
      weatherLocationEl.textContent = "定位天气失败";
      weatherNote.textContent = "定位或网络失败，已回退到默认城市（若仍失败请检查 API Key）。";
      // 尝试回退到默认城市
      fetchWeatherByCity(DEFAULT_CITY);
    }
  }

  async function fetchWeatherByCity(city) {
    if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === "YOUR_API_KEY") {
      weatherEl.textContent = "请在 board.js 中填写 OpenWeather API Key（YOUR_API_KEY）";
      weatherLocationEl.textContent = "未配置 API Key";
      return;
    }
    try {
      weatherEl.textContent = "正在加载天气…";
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=zh_cn`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      renderWeather(data, data.name || city);
    } catch (err) {
      console.error("fetchWeatherByCity error:", err);
      weatherEl.textContent = "天气加载失败";
      weatherLocationEl.textContent = `城市：${city}`;
      weatherNote.textContent = "天气请求失败，请检查网络或 API Key。";
    }
  }

  function iconFromWeather(data) {
    if (!data || !data.weather || !data.weather[0]) return '❓';
    const main = data.weather[0].main || '';
    // 简单映射 -> 复古风我们用 Emoji 表示，风格可替换为自定义图标
    const map = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Haze': '🌫️',
      'Smoke': '🚬'
    };
    return map[main] || '🌈';
  }

  function renderWeather(data, locationLabel) {
    if (!data) {
      weatherEl.textContent = "无天气数据";
      return;
    }
    const icon = iconFromWeather(data);
    const temp = Math.round(data.main.temp);
    const desc = data.weather[0].description;
    const hum = data.main.humidity;
    const wind = data.wind && data.wind.speed ? `${data.wind.speed} m/s` : '-';
    weatherLocationEl.textContent = locationLabel || (data.name || '未知');
    weatherEl.innerHTML = `
      <div style="font-size:1.6rem; font-weight:700; color:var(--gold)">
        ${icon} ${temp}℃ <span class="small-muted" style="font-weight:600; margin-left:8px;">${desc}</span>
      </div>
      <div style="margin-top:8px; color:var(--cream);">
        湿度：${hum}% &nbsp; · &nbsp; 风速：${wind}
      </div>
    `;
    const now = new Date();
    weatherNote.textContent = `更新时间：${now.toLocaleTimeString('zh-CN', {hour:'2-digit', minute:'2-digit'})}`;
  }

  // 尝试使用浏览器定位
  function initWeather() {
    // 先清上一次定时器
    if (weatherTimer) clearInterval(weatherTimer);

    if ("geolocation" in navigator) {
      const opts = { enableHighAccuracy: false, timeout: 7000, maximumAge: 60 * 1000 };
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        fetchWeatherByCoords(latitude, longitude);
        weatherTimer = setInterval(() => fetchWeatherByCoords(latitude, longitude), WEATHER_REFRESH_INTERVAL);
      }, (err) => {
        console.warn("定位失败：", err);
        weatherNote.textContent = "定位失败：使用默认城市获取天气。";
        fetchWeatherByCity(DEFAULT_CITY);
        weatherTimer = setInterval(() => fetchWeatherByCity(DEFAULT_CITY), WEATHER_REFRESH_INTERVAL);
      }, opts);
    } else {
      // 不支持定位
      weatherNote.textContent = "浏览器不支持定位：使用默认城市获取天气。";
      fetchWeatherByCity(DEFAULT_CITY);
      weatherTimer = setInterval(() => fetchWeatherByCity(DEFAULT_CITY), WEATHER_REFRESH_INTERVAL);
    }
  }

  // 手动刷新按钮
  refreshWeatherBtn.addEventListener('click', () => {
    weatherNote.textContent = "手动刷新中…";
    initWeather();
  });

  // 首次加载天气
  initWeather();

  // 最后：默认选择当天并显示详情
  (function selectToday() {
    selected = { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };
    // 重新渲染以标注 selected
    renderCalendar(curYear, curMonth);
    // 显示详情
    const dt = new Date(selected.year, selected.month, selected.day);
    dayInfo.innerHTML = `
      <div style="font-weight:700; color:var(--gold); margin-bottom:6px;">
        ${selected.year} 年 ${selected.month+1} 月 ${selected.day} 日 · ${dt.toLocaleDateString('zh-CN', {weekday: 'long'})}
      </div>
      <div style="font-size:0.98rem; color:var(--cream);">
        ${getLunarString(dt)}
      </div>
    `;
  })();

});
