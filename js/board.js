// 模块化封装 - 时钟模块
const Clock = {
    init() {
        this.update();
        setInterval(() => this.update(), 1000);
    },
    
    update() {
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
            second: "2-digit"
        };

        document.getElementById("date").textContent = now.toLocaleDateString("zh-CN", dateOptions);
        document.getElementById("time").textContent = now.toLocaleTimeString("zh-CN", timeOptions);
    }
};

// 模块化封装 - 天气模块
const Weather = {
    requestTimer: null,
    
    init() {
        this.fetch();
        // 每10分钟更新一次天气
        setInterval(() => this.fetch(), 600000);
    },
    
    fetch() {
        const weatherEl = document.getElementById("weather");
        weatherEl.textContent = "正在加载天气";
        weatherEl.classList.add("loading");
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => this.getWeatherData(pos.coords.latitude, pos.coords.longitude),
                err => {
                    weatherEl.textContent = "定位失败，点击重试";
                    weatherEl.classList.remove("loading");
                }
            );
        } else {
            weatherEl.textContent = "浏览器不支持定位";
            weatherEl.classList.remove("loading");
        }
    },
    
    async getWeatherData(lat, lon) {
        const weatherEl = document.getElementById("weather");
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

        try {
            // 防抖处理
            if (this.requestTimer) clearTimeout(this.requestTimer);
            
            this.requestTimer = setTimeout(async () => {
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
                weatherEl.classList.remove("loading");
            }, 1000);
        } catch (err) {
            weatherEl.textContent = "天气加载失败，点击重试";
            weatherEl.classList.remove("loading");
        }
    }
};

// 模块化封装 - 日历模块
const Calendar = {
    currentDate: new Date(),
    
    init() {
        this.render(this.currentDate);
        this.bindEvents();
    },
    
    render(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const monthYearEl = document.getElementById("monthYear");
        monthYearEl.textContent = `${year}年 ${month + 1}月`;

        // 创建文档片段优化DOM操作
        const fragment = document.createDocumentFragment();
        const table = document.createElement('table');
        table.id = "calendarTable";

        // 渲染表头
        const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
        let headerRow = "<tr>";
        weekdays.forEach(d => headerRow += `<th>${d}</th>`);
        headerRow += "</tr>";
        
        // 渲染日期
        let row = "<tr>";
        for (let i = 0; i < firstDay; i++) {
            row += "<td></td>";
        }
        
        const today = new Date();
        for (let d = 1; d <= daysInMonth; d++) {
            if ((firstDay + d - 1) % 7 === 0 && d !== 1) {
                row += "</tr><tr>";
            }
            
            const isToday = d === today.getDate() && 
                           month === today.getMonth() && 
                           year === today.getFullYear();
            const isSelected = d === date.getDate() &&
                              month === date.getMonth() &&
                              year === date.getFullYear();
            
            let className = [];
            if (isToday) className.push("today");
            if (isSelected) className.push("selected");
            
            row += `<td class="${className.join(' ')}" data-date="${year},${month},${d}">${d}</td>`;
        }
        row += "</tr>";
        
        table.innerHTML = headerRow + row;
        fragment.appendChild(table);
        
        // 替换旧表格
        const oldTable = document.getElementById("calendarTable");
        oldTable.parentNode.replaceChild(fragment, oldTable);

        // 默认显示当前日期详情
        this.showDayDetail(year, month, date.getDate());
    },
    
    bindEvents() {
        // 日期点击事件委托
        document.getElementById("calendarTable").addEventListener("click", (e) => {
            if (e.target.tagName === "TD" && e.target.dataset.date) {
                const [year, month, day] = e.target.dataset.date.split(",").map(Number);
                this.showDayDetail(year, month, day);
                
                // 更新选中状态
                document.querySelectorAll("#calendarTable td").forEach(td => 
                    td.classList.remove("selected")
                );
                e.target.classList.add("selected");
            }
        });
        
        // 月份切换按钮
        document.getElementById("prev").addEventListener("click", () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.render(this.currentDate);
        });
        
        document.getElementById("next").addEventListener("click", () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.render(this.currentDate);
        });
        
        // 年份快速切换
        document.getElementById("monthYear").addEventListener("click", () => {
            const year = this.currentDate.getFullYear();
            const newYear = prompt('请输入年份', year);
            if (newYear && !isNaN(newYear) && newYear >= 1900 && newYear <= 2100) {
                this.currentDate.setFullYear(newYear);
                this.render(this.currentDate);
            }
        });
        
        // 天气区域点击重试
        document.getElementById("weather").addEventListener("click", () => {
            Weather.fetch();
        });
    },
    
    getLunarDate(year, month, day) {
        const lunar = solarlunar.solar2lunar(year, month, day);
        return `农历${lunar.lMonth}月${lunar.lDay} ${lunar.Term ? lunar.Term : ''}`;
    },
    
    showDayDetail(year, month, day) {
        const date = new Date(year, month, day);
        const weekdays = ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"];
        const weekday = weekdays[date.getDay()];
        const lunar = this.getLunarDate(year, month + 1, day); // 月份+1适应solarlunar库
        
        document.getElementById("dayDetail").textContent =
            `${year}年${month + 1}月${day}日 ${weekday} | ${lunar}`;
    }
};

// 初始化所有模块
document.addEventListener('DOMContentLoaded', () => {
    Clock.init();
    Weather.init();
    Calendar.init();
});