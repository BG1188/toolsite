// 实时更新时间 & 日期
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
updateClock(); // 页面加载立即执行一次

// 获取天气信息（OpenWeather API 示例）
async function fetchWeather() {
    const apiKey = "97b149c5b098a517bb6c43c2c97aa36a"; // ⚠️ 需要申请 OpenWeather API Key
    const city = "Beijing"; // 可以换成你的城市
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=zh_cn`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("网络错误");
        const data = await response.json();
        const temp = Math.round(data.main.temp);
        const desc = data.weather[0].description;
        document.getElementById("weather").textContent = `${city}：${desc}，${temp}℃`;
    } catch (err) {
        document.getElementById("weather").textContent = "天气加载失败";
    }
}

// 每隔 10 分钟刷新一次天气
fetchWeather();
setInterval(fetchWeather, 600000);
