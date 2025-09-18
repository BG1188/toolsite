// ======== 时间与日期 ========
function updateClock() {
    const now = new Date();
    const dateStr = now.toLocaleDateString("zh-CN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
    const timeStr = now.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
    document.getElementById("date").textContent = dateStr;
    document.getElementById("time").textContent = timeStr;
}
setInterval(updateClock, 1000);
updateClock();

// ======== 天气 ========
async function fetchWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("网络错误");
        const data = await res.json();
        const w = data.current_weather;

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

        const desc = weatherMap[w.weathercode] || "未知天气";
        const temp = Math.round(w.temperature);
        const wind = w.windspeed;

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
            () => document.getElementById("weather").textContent = "定位失败"
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
    document.getElementById("monthYear").textContent = `${year}年 ${month + 1}月`;

    // 生成表头
    const weekdays = ["日","一","二","三","四","五","六"];
    let html = "<tr>";
    weekdays.forEach(d => html += `<th>${d}</th>`);
    html += "</tr>";

    let day = 1;
    for (let i = 0; i < 6; i++) {
        html += "<tr>";
        for (let j = 0; j < 7; j++) {
            if ((i===0 && j<firstDay) || day>daysInMonth) {
                html += "<td></td>";
            } else {
                const today = new Date();
                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                html += `<td class="${isToday ? "today" : ""}" data-day="${day}">${day}</td>`;
                day++;
            }
        }
        html += "</tr>";
    }
    calendar.innerHTML = html;

    // 绑定点击事件
    calendar.querySelectorAll("td[data-day]").forEach(td => {
        td.addEventListener("click", () => {
            // 高亮选中
            calendar.querySelectorAll("td").forEach(x => x.classList.remove("active"));
            td.classList.add("active");
            const d = parseInt(td.dataset.day);
            showDayDetail(year, month, d);
        });
    });

    // 默认显示今天
    showDayDetail(year, month, date.getDate());
}

// ======== 农历计算（solarlunar.js） ========
function getLunarDate(year, month, day) {
    const lunar = solarlunar.solar2lunar(year, month, day);
    return `农历${lunar.lMonth}月${lunar.lDay}`;
}

function showDayDetail(year, month, day) {
    const date = new Date(year, month, day);
    const weekday = ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"][date.getDay()];
    const lunar = getLunarDate(year, month + 1, day); // month+1 适配 solarlunar
    document.getElementById("dayDetail").textContent =
        `${year}年${month + 1}月${day}日 ${weekday} | ${lunar}`;
}

// 翻页按钮
document.getElementById("prev").onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
};
document.getElementById("next").onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
};

// 初始化
renderCalendar(currentDate);
