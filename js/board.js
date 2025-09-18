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

function renderCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const calendar = document.getElementById("calendar");
    const monthYear = document.getElementById("monthYear");
    calendar.innerHTML = "";
    monthYear.textContent = `${year}年 ${month + 1}月`;

    const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
    let headerRow = "<tr>";
    weekdays.forEach(d => headerRow += `<th>${d}</th>`);
    headerRow += "</tr>";
    calendar.innerHTML += headerRow;

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
        row += `<td class="${isToday ? "today" : ""}" onclick="showDayDetail(${year}, ${month}, ${d})">${d}</td>`;
    }
    row += "</tr>";
    calendar.innerHTML += row;

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

// ======== 农历计算（使用 lunar-javascript） ========
function getLunarDate(year, month, day) {
    try {
        // lunar-javascript 要求月份为 1-12
        const lunar = lunar.solar2lunar(year, month, day);
        const monthStr = lunar.isLeap() ? `闰${lunar.getMonthInChinese()}` : lunar.getMonthInChinese();
        const dayStr = lunar.getDayInChinese();
        return `农历${monthStr}月${dayStr}`;
    } catch (e) {
        console.error('农历计算错误:', e);
        return "农历计算失败";
    }
}

function showDayDetail(year, month, day) {
    try {
        const date = new Date(year, month, day);
        const weekday = ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"][date.getDay()];
        // 转换为 1-12 月传递给农历计算
        const lunar = getLunarDate(year, month + 1, day);
        document.getElementById("dayDetail").textContent =
            `${year}年${month + 1}月${day}日 ${weekday} | ${lunar}`;
    } catch (e) {
        console.error('日期详情错误:', e);
        document.getElementById("dayDetail").textContent = "日期信息加载失败";
    }
}

// 初始化
renderCalendar(currentDate);