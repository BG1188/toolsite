// =================== 时间 & 日期 ===================
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

// =================== 天气（Open-Meteo + 定位） ===================
async function fetchWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

    try {
        const response = await fetch(url);
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
            () => document.getElementById("weather").textContent = "定位失败"
        );
    } else {
        document.getElementById("weather").textContent = "浏览器不支持定位";
    }
}
getLocationAndWeather();
setInterval(getLocationAndWeather, 600000);

// =================== 日历生成 ===================
let currentYear, currentMonth;

function renderCalendar(year, month) {
    const calendar = document.getElementById("calendar");
    calendar.innerHTML = "";

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 表头（周日-周六）
    const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
    let headerRow = "<tr>";
    weekdays.forEach(d => headerRow += `<th>${d}</th>`);
    headerRow += "</tr>";
    calendar.innerHTML += headerRow;

    let row = "<tr>";
    for (let i = 0; i < firstDay; i++) {
        row += "<td></td>";
    }

    for (let day = 1; day <= daysInMonth; day++) {
        if ((firstDay + day - 1) % 7 === 0 && day !== 1) {
            row += "</tr><tr>";
        }
        row += `<td onclick="showDayInfo(${year},${month},${day},this)">${day}</td>`;
    }
    row += "</tr>";
    calendar.innerHTML += row;

    document.getElementById("calendarTitle").textContent = `${year}年 ${month + 1}月`;
}

function showDayInfo(year, month, day, cell) {
    document.querySelectorAll("#calendar td").forEach(td => td.classList.remove("active"));
    cell.classList.add("active");

    const date = new Date(year, month, day);
    const weekday = date.toLocaleDateString("zh-CN", { weekday: "long" });

    // 农历计算（简单示例：调用天行API 或和风天气更准确）
    // 这里先写一个占位
    const lunar = "农历功能可接入 API";

    document.getElementById("dayInfo").textContent =
        `${year}年${month + 1}月${day}日 | ${weekday} | ${lunar}`;
}

document.getElementById("prevMonth").onclick = () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar(currentYear, currentMonth);
};
document.getElementById("nextMonth").onclick = () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar(currentYear, currentMonth);
};

// 初始化日历
const today = new Date();
currentYear = today.getFullYear();
currentMonth = today.getMonth();
renderCalendar(currentYear, currentMonth);
