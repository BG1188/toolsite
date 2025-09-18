// ======== 时间与日期 ========
function updateClock() {
    const now = new Date();
    const date = now.toLocaleDateString("zh-CN", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
    const time = now.toLocaleTimeString("zh-CN", {
        hour: "2-digit", minute: "2-digit", second: "2-digit"
    });

    document.getElementById("date").textContent = date;
    document.getElementById("time").textContent = time;
}
setInterval(updateClock, 1000);
updateClock();

// ======== 天气 ========
async function fetchWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("网络错误");
        const data = await response.json();
        const weather = data.current_weather;

        const weatherMap = {
            0: "☀️ 晴天",
            1: "🌤️ 少云",
            2: "⛅ 阴天",
            3: "☁️ 多云",
            45: "🌫️ 雾",
            48: "🌫️ 雾",
            51: "🌦️ 小雨",
            61: "🌧️ 中雨",
            71: "❄️ 小雪",
            80: "🌦️ 阵雨",
            95: "⛈️ 雷雨"
        };

        const desc = weatherMap[weather.weathercode] || "未知天气";
        const temp = Math.round(weather.temperature);
        const wind = weather.windspeed;

        document.getElementById("weather").textContent =
            `${desc} | ${temp}℃ | 风速 ${wind} km/h`;
    } catch (err) {
        document.getElementById("weather").textContent = "天气加载失败";
    }
}
function getLocationAndWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
            err => document.getElementById("weather").textContent = "定位失败"
        );
    } else {
        document.getElementById("weather").textContent = "浏览器不支持定位";
    }
}
getLocationAndWeather();
setInterval(getLocationAndWeather, 600000);

// ======== 日历 ========
let currentDate = new Date();
const calendarTable = document.getElementById("calendar");

// 初始化时绑定一次事件委托（关键修改）
calendarTable.addEventListener('click', function(e) {
    if (e.target.tagName === 'TD' && e.target.hasAttribute('data-date')) {
        const dateParts = e.target.getAttribute('data-date').split(',').map(Number);
        showDayDetail(...dateParts);
        
        // 更新选中状态
        document.querySelectorAll('#calendar td').forEach(td => {
            td.classList.remove('selected');
        });
        e.target.classList.add('selected');
    }
});

function renderCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthYear = document.getElementById("monthYear");
    calendarTable.innerHTML = "";
    monthYear.textContent = `${year}年 ${month + 1}月`;

    const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
    let headerRow = "<tr>";
    weekdays.forEach(d => headerRow += `<th>${d}</th>`);
    headerRow += "</tr>";
    calendarTable.innerHTML += headerRow;

    let row = "<tr>";
    for (let i = 0; i < firstDay; i++) {
        row += "<td></td>";
    }
    for (let d = 1; d <= daysInMonth; d++) {
        if ((firstDay + d - 1) % 7 === 0 && d !== 1) {
            row += "</tr><tr>";
        }
        const today = new Date();
        const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        // 使用data属性存储日期，移除onclick属性（关键修改）
        row += `<td class="${isToday ? "today" : ""}" data-date="${year},${month},${d}">${d}</td>`;
    }
    row += "</tr>";
    calendarTable.innerHTML += row;

    // 默认显示今天详情
    showDayDetail(year, month, date.getDate());
}

document.getElementById("prev").onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
};
document.getElementById("next").onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
};

// ======== 农历计算（修复后） ========
function getLunarDate(year, month, day) {
    try {
        // 关键修复：确保传递给 solarlunar 的月份是 1-12（当前月份是从 renderCalendar 接收的 0-11）
        const lunar = solarlunar.solar2lunar(year, month + 1, day);
        // 处理农历特殊日期（如初一、十五等）
        const lunarDay = lunar.lDay === 1 ? '初一' : 
                         lunar.lDay === 15 ? '十五' : 
                         lunar.lDay;
        return `农历${lunar.lMonth}月${lunarDay}`;
    } catch (e) {
        console.error('农历计算错误:', e);
        return "农历计算失败";
    }
}

function showDayDetail(year, month, day) {
    try {
        const date = new Date(year, month, day);
        const weekdays = ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"];
        const weekday = weekdays[date.getDay()];
        // 注意：这里直接传递 month（0-11），在 getLunarDate 内部统一处理 +1
        const lunar = getLunarDate(year, month, day); 
        document.getElementById("dayDetail").textContent =
            `${year}年${month + 1}月${day}日 ${weekday} | ${lunar}`;
    } catch (e) {
        document.getElementById("dayDetail").textContent = "日期信息加载失败";
    }
}

// 初始化
renderCalendar(currentDate);