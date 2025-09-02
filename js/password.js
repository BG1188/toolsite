document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("passwordForm");
  const inputText = document.getElementById("inputText");
  const fixedParam = document.getElementById("fixedParam");
  const resultBox = document.getElementById("resultBox");
  const generatedPassword = document.getElementById("generatedPassword");
  const copyBtn = document.getElementById("copyBtn");

  // 从 localStorage 读取固定参数
  fixedParam.value = localStorage.getItem("fixedParam") || "";

  // 密码生成规则
  function generatePassword(input, fixed) {
    // 简单加密逻辑：拼接+Base64+随机数
    const raw = input + fixed;
    let base64 = btoa(unescape(encodeURIComponent(raw)));
    let randomPart = Math.random().toString(36).slice(-4).toUpperCase();
    return base64.slice(0, 8) + randomPart;
  }

  // 表单提交
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = inputText.value.trim();
    const fixed = fixedParam.value.trim();

    if (!input || !fixed) {
      alert("请填写所有必填字段");
      return;
    }

    // 保存固定参数
    localStorage.setItem("fixedParam", fixed);

    const password = generatePassword(input, fixed);
    generatedPassword.value = password;
    resultBox.style.display = "block";
  });

  // 复制按钮
  copyBtn.addEventListener("click", () => {
    generatedPassword.select();
    document.execCommand("copy");
    alert("密码已复制！");
  });
});
