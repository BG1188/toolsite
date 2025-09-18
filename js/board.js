// ======== 时间与日期 ========
function updateClock() {
    const now = new Date();
    const dateOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    };
    const timeOptions = {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false // 24小时制
    };

    document.getElementById("date").textContent = now.toLocaleDateString("zh-CN", dateOptions);
    document.getElementById("time").textContent = now.toLocaleTimeString("zh-CN", timeOptions);
}
// 立即执行一次再开始定时器
updateClock();
setInterval(updateClock, 1000);

// ======== 天气 ========
async function fetchWeather(lat, lon) {
    const weatherEl = document.getElementById("weather");
    weatherEl.textContent = "正在加载天气...";
    
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

        weatherEl.textContent = `${desc} | ${temp}℃ | 风速 ${wind} km/h`;
    } catch (err) {
        weatherEl.textContent = "天气加载失败，点击重试";
        // 添加点击重试功能
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
                weatherEl.textContent = "定位失败，点击重试";
                weatherEl.addEventListener("click", () => getLocationAndWeather(), { once: true });
            }
        );
    } else {
        weatherEl.textContent = "浏览器不支持定位";
    }
}
getLocationAndWeather();
// 每10分钟更新一次天气
setInterval(getLocationAndWeather, 600000);

// ======== 日历 ========
let currentDate = new Date();
let selectedDate = currentDate; // 记录选中的日期

function renderCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const calendarTable = document.getElementById("calendar");
    const monthYear = document.getElementById("monthYear");
    calendarTable.innerHTML = "";
    monthYear.textContent = `${year}年 ${month + 1}月`;

    // 创建表头
    const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
    let headerRow = document.createElement("tr");
    weekdays.forEach(d => {
        const th = document.createElement("th");
        th.textContent = d;
        headerRow.appendChild(th);
    });
    calendarTable.appendChild(headerRow);

    // 创建日期行
    let row = document.createElement("tr");
    // 填充月初空白
    for (let i = 0; i < firstDay; i++) {
        const td = document.createElement("td");
        row.appendChild(td);
    }

    // 填充日期
    const today = new Date();
    for (let d = 1; d <= daysInMonth; d++) {
        // 换行处理
        if ((firstDay + d - 1) % 7 === 0 && d !== 1) {
            calendarTable.appendChild(row);
            row = document.createElement("tr");
        }

        const td = document.createElement("td");
        td.textContent = d;
        td.dataset.date = `${year},${month},${d}`; // 存储完整日期

        // 判断是否是今天
        const isToday = d === today.getDate() && 
                       month === today.getMonth() && 
                       year === today.getFullYear();
        if (isToday) {
            td.classList.add("today");
        }

        // 判断是否是选中日期
        const isSelected = d === selectedDate.getDate() && 
                          month === selectedDate.getMonth() && 
                          year === selectedDate.getFullYear();
        if (isSelected) {
            td.classList.add("selected");
        }

        // 添加点击事件
        td.addEventListener("click", () => {
            // 移除之前的选中状态
            document.querySelectorAll("#calendar td.selected").forEach(cell => {
                cell.classList.remove("selected");
            });
            // 添加新的选中状态
            td.classList.add("selected");
            // 更新选中日期并显示详情
            selectedDate = new Date(year, month, d);
            showDayDetail(year, month, d);
        });

        row.appendChild(td);
    }
    calendarTable.appendChild(row);

    // 默认显示选中日期详情
    showDayDetail(year, month, selectedDate.getDate());
}

// 月份切换
document.getElementById("prev").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
});

document.getElementById("next").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
});

// ======== 农历计算 ========
function getLunarDate(year, month, day) {
    const lunar = solarlunar.solar2lunar(year, month, day);
    // 增加节气显示
    return `农历${lunar.lMonth}月${lunar.lDay} ${lunar.Term || ''}`;
}

function showDayDetail(year, month, day) {
    const date = new Date(year, month, day);
    const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    const weekday = weekdays[date.getDay()];
    const lunar = getLunarDate(year, month + 1, day); // 适配solarlunar的月份从1开始
    document.getElementById("dayDetail").textContent = 
        `${year}年${month + 1}月${day}日 ${weekday} | ${lunar}`;
}

// 初始化日历
renderCalendar(currentDate);