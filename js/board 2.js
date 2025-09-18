// ======== 时间与日期 ========
function updateClock() {
    const now = new Date();
    // 优化时间格式：去除秒数前的空格，增加视觉紧凑度
    const date = now.toLocaleDateString("zh-CN", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
    const time = now.toLocaleTimeString("zh-CN", {
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false // 强制24小时制，避免上午/下午显示
    }).replace(/\s+/g, ''); // 清除多余空格

    document.getElementById("date").textContent = date;
    document.getElementById("time").textContent = time;
}
// 立即执行+定时器更新
updateClock();
setInterval(updateClock, 1000);

// ======== 天气 ========
async function fetchWeather(lat, lon) {
    const weatherEl = document.getElementById("weather");
    weatherEl.textContent = "正在加载天气...";
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);
        const data = await response.json();
        const weather = data.current_weather;

        // 补充更多天气码映射，覆盖更多场景
        const weatherMap = {
            0: "☀️ 晴天", 1: "🌤️ 少云", 2: "⛅ 多云", 3: "☁️ 阴天",
            45: "🌫️ 雾", 48: "🌫️ 霜雾", 51: "🌦️ 毛毛雨", 53: "🌦️ 小雨", 55: "🌦️ 中雨",
            56: "❄️ 冻毛毛雨", 57: "❄️ 冻小雨", 61: "🌧️ 小雨", 63: "🌧️ 中雨", 65: "🌧️ 大雨",
            66: "❄️ 冻小雨", 67: "❄️ 冻大雨", 71: "❄️ 小雪", 73: "❄️ 中雪", 75: "❄️ 大雪",
            77: "❄️ 雪粒", 80: "🌦️ 阵雨", 81: "🌦️ 中阵雨", 82: "🌦️ 大阵雨",
            85: "❄️ 小阵雪", 86: "❄️ 大阵雪", 95: "⛈️ 雷阵雨", 96: "⛈️ 冰雹阵雨", 99: "⛈️ 大冰雹阵雨"
        };

        const desc = weatherMap[weather.weathercode] || `未知天气(${weather.weathercode})`;
        const temp = Math.round(weather.temperature);
        const wind = weather.windspeed;
        weatherEl.textContent = `${desc} | ${temp}℃ | 风速 ${wind} km/h`;
    } catch (err) {
        weatherEl.textContent = "天气加载失败，点击重试";
        // 点击重试功能
        weatherEl.addEventListener("click", () => getLocationAndWeather(), { once: true });
    }
}

function getLocationAndWeather() {
    const weatherEl = document.getElementById("weather");
    if (navigator.geolocation) {
        weatherEl.textContent = "正在获取位置...";
        navigator.geolocation.getCurrentPosition(
            pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
            err => {
                const errMsg = {
                    1: "用户拒绝定位", 2: "位置获取失败", 3: "定位超时"
                }[err.code] || "定位异常";
                weatherEl.textContent = `定位失败: ${errMsg}，点击重试`;
                weatherEl.addEventListener("click", () => getLocationAndWeather(), { once: true });
            }
        );
    } else {
        weatherEl.textContent = "浏览器不支持定位";
    }
}
// 初始加载+10分钟更新一次
getLocationAndWeather();
setInterval(getLocationAndWeather, 600000);

// ======== 日历 ========
let currentDate = new Date();
const calendarTable = document.getElementById("calendar");

// 事件委托：只绑定一次，解决动态元素点击问题（核心修复）
calendarTable.addEventListener('click', function(e) {
    if (e.target.tagName === 'TD' && e.target.dataset.date) {
        const [year, month, day] = e.target.dataset.date.split(',').map(Number);
        showDayDetail(year, month, day);
        
        // 选中状态更新：移除其他选中，添加当前选中
        document.querySelectorAll('#calendar td').forEach(td => {
            td.classList.remove('selected');
        });
        e.target.classList.add('selected');
    }
});

function renderCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-11
    const firstDay = new Date(year, month, 1).getDay(); // 0(日)-6(六)
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // 当月天数

    const monthYearEl = document.getElementById("monthYear");
    monthYearEl.textContent = `${year}年 ${month + 1}月`; // 显示1-12月

    // 清空日历表格
    calendarTable.innerHTML = "";

    // 1. 渲染表头（星期）
    const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
    let headerRow = document.createElement('tr');
    weekdays.forEach(weekday => {
        const th = document.createElement('th');
        th.textContent = weekday;
        headerRow.appendChild(th);
    });
    calendarTable.appendChild(headerRow);

    // 2. 渲染日期行
    let row = document.createElement('tr');
    // 填充月初空白单元格（第一行前面的空列）
    for (let i = 0; i < firstDay; i++) {
        const emptyTd = document.createElement('td');
        emptyTd.classList.add('empty'); // 空单元格可加样式
        row.appendChild(emptyTd);
    }

    // 填充当月日期
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        // 每7天换一行
        if ((firstDay + day - 1) % 7 === 0 && day !== 1) {
            calendarTable.appendChild(row);
            row = document.createElement('tr');
        }

        const td = document.createElement('td');
        td.textContent = day;
        // 存储完整日期（用于点击时获取）
        td.dataset.date = `${year},${month},${day}`;

        // 标记今天
        const isToday = day === today.getDate() && 
                       month === today.getMonth() && 
                       year === today.getFullYear();
        if (isToday) td.classList.add('today');

        // 标记当前选中日期（切换月份时保持选中）
        const isSelected = day === currentDate.getDate() && 
                          month === currentDate.getMonth() && 
                          year === currentDate.getFullYear();
        if (isSelected) td.classList.add('selected');

        row.appendChild(td);
    }

    // 添加最后一行
    calendarTable.appendChild(row);

    // 默认显示当前日期详情
    showDayDetail(year, month, currentDate.getDate());
}

// 月份切换按钮事件
document.getElementById("prev").addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
});
document.getElementById("next").addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
});

// ======== 农历计算（适配官方 lunar-javascript 1.7.4） ========
function getLunarDate(year, month, day) {
    try {
        // 官方库要求：月份为1-12，直接传递转换后的月份
        const lunar = window.lunar.solar2lunar(year, month, day);
        // 处理闰月（如"闰二月"）
        const monthPrefix = lunar.isLeap() ? '闰' : '';
        // 官方库方法：getMonthInChinese() 返回"正/二/.../腊"，getDayInChinese() 返回"初一/初二/..."
        return `农历${monthPrefix}${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
    } catch (e) {
        console.error('农历计算错误:', e);
        return "农历计算失败";
    }
}

function showDayDetail(year, month, day) {
    try {
        const targetDate = new Date(year, month, day);
        const weekday = ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"][targetDate.getDay()];
        // 关键：传递1-12月给农历函数（month是0-11，需+1）
        const lunar = getLunarDate(year, month + 1, day);
        document.getElementById("dayDetail").textContent =
            `${year}年${month + 1}月${day}日 ${weekday} | ${lunar}`;
    } catch (e) {
        console.error('日期详情错误:', e);
        document.getElementById("dayDetail").textContent = "日期信息加载失败";
    }
}

// 初始化日历
renderCalendar(currentDate);