// 取得頁面元素
const projectTypeSelect = document.getElementById("projectType");
const step2 = document.getElementById("step2");
const step3 = document.getElementById("step3");
const step4 = document.getElementById("step4");
const projectForm = document.getElementById("projectForm");
const specificFields = document.getElementById("specificFields");
const errorMessages = document.getElementById("errorMessages");
const confirmBtn = document.getElementById("confirmBtn");

// 工程類別對應的欄位定義
const fieldDefinitions = {
  RC: [
    "基地面積(平方公尺)",
    "建築面積(平方公尺)",
    "總樓地板面積(平方公尺)",
    "外運土石體積(鬆方)(立方公尺)",
  ],
  SRC: [
    "基地面積(平方公尺)",
    "建築面積(平方公尺)",
    "總樓地板面積(平方公尺)",
    "外運土石體積(鬆方)(立方公尺)",
  ],
  拆除: ["總樓地板面積(平方公尺)", "外運土石體積(鬆方)(立方公尺)"],
  道路: [
    "施工面積(平方公尺)",
    "道路長度(公尺)",
    "外運土石體積(鬆方)(立方公尺)",
  ],
  隧道: [
    "隧道平面面積(平方公尺)",
    "隧道長度(公尺)",
    "外運土石體積(鬆方)(立方公尺)",
  ],
  管線: [
    "施工面積(平方公尺)",
    "道路長度(公尺)",
    "外運土石體積(鬆方)(立方公尺)",
  ],
  橋樑: [
    "橋面面積(平方公尺)",
    "橋面長度(公尺)",
    "外運土石體積(鬆方)(立方公尺)",
  ],
  社區: ["施工面積(公頃)", "外運土石體積(鬆方)(立方公尺)"],
  工業區: ["施工面積(公頃)", "外運土石體積(鬆方)(立方公尺)"],
  遊樂園: ["施工面積(公頃)", "外運土石體積(鬆方)(立方公尺)"],
  疏濬: ["施工面積(平方公尺)", "外運土石體積(鬆方)(立方公尺)"],
  其他: ["施工面積(平方公尺)", "外運土石體積(鬆方)(立方公尺)"],
};

/**
 * 當使用者更換工程類別（管制編號）時，
 * 重置整個表單（包括 commonFields 與 specificFields）
 * 並清除所有錯誤訊息。
 */
projectTypeSelect.addEventListener("change", function () {
  // 重置表單內所有輸入值（commonFields 與 error messages 不會自動清除）
  projectForm.reset();
  // 清空所有 error-msg 內容
  document
    .querySelectorAll(".error-msg")
    .forEach((el) => (el.textContent = ""));
  // 清空動態產生的欄位
  specificFields.innerHTML = "";

  const projectType = this.value;
  if (projectType) {
    step2.style.display = "block";
    step3.style.display = "block";
    step4.style.display = "block";
    generateSpecificFields(projectType);
  } else {
    step2.style.display = "none";
    step3.style.display = "none";
    step4.style.display = "none";
  }
});

/**
 * 動態產生欄位
 * 使用「工程類別 + 索引」作為唯一 ID
 */
function generateSpecificFields(projectType) {
  specificFields.innerHTML = "";
  const fields = fieldDefinitions[projectType];
  let htmlContent = "";

  fields.forEach((field, index) => {
    const uniqueId = `field_${projectType}_${index}`;
    const unit = field.includes("(公頃)")
      ? "公頃"
      : field.includes("(公尺)")
      ? "公尺"
      : field.includes("(立方公尺)")
      ? "立方公尺"
      : "平方公尺";

    htmlContent += `
      <label for="${uniqueId}">${field}：</label>
      <div class="input-wrapper">
        <input 
          type="number" 
          id="${uniqueId}" 
          data-unit="${unit}" 
          required
        />
        <span class="error-msg" id="${uniqueId}Error"></span>
      </div><br>
    `;
  });

  specificFields.innerHTML = htmlContent;
  addInputEventListeners();
}

/**
 * 為所有 input 欄位加上即時驗證事件
 */
function addInputEventListeners() {
  const inputs = projectForm.querySelectorAll("input");
  inputs.forEach((input) => {
    input.addEventListener("input", function () {
      validateField(this);
      if (this.type === "date") {
        validateDates();
      }
    });
  });
}

/**
 * 單一欄位驗證：採用字串正則檢查避免浮點數誤差
 */
function validateField(input) {
  const errorSpan = document.getElementById(`${input.id}Error`);
  errorSpan.textContent = "";
  let errorMessage = "";
  const inputVal = input.value.trim();

  if (!inputVal && input.required) {
    errorMessage = "此為必填欄位。";
  } else if (input.type === "date") {
    if (!inputVal) {
      errorMessage = "請選擇日期。";
    }
  } else if (input.type === "number" && inputVal) {
    if (isNaN(inputVal)) {
      errorMessage = "必須為數字。";
    } else {
      if (input.id === "projectCost" || input.id === "environmentalCost") {
        const integerRegex = /^[1-9]\d*$/;
        if (!integerRegex.test(inputVal)) {
          errorMessage = "必須為正整數。";
        }
      } else {
        const decimalRegex = /^[0-9]+(\.[0-9]{1,2})?$/;
        if (!decimalRegex.test(inputVal)) {
          errorMessage = "必須為正數且小數點後最多兩位。";
        } else if (parseFloat(inputVal) <= 0) {
          errorMessage = "必須大於 0。";
        }
      }
    }
  }

  errorSpan.textContent = errorMessage;
  return !errorMessage;
}

/**
 * 跨欄位驗證：檢查施工起日是否在施工迄日之前
 */
function validateDates() {
  const startDateEl = document.getElementById("startDate");
  const endDateEl = document.getElementById("endDate");
  const startDateError = document.getElementById("startDateError");
  const endDateError = document.getElementById("endDateError");

  if (startDateError) startDateError.textContent = "";
  if (endDateError) endDateError.textContent = "";

  const startDateVal = startDateEl.value.trim();
  const endDateVal = endDateEl.value.trim();

  if (startDateVal && endDateVal) {
    const startDateObj = new Date(startDateVal);
    const endDateObj = new Date(endDateVal);

    if (endDateObj < startDateObj) {
      endDateError.textContent = "施工迄日不得早於施工起日。";
      return false;
    }
  }
  return true;
}

/**
 * 確認按鈕點擊時執行整體驗證
 */
confirmBtn.addEventListener("click", function () {
  errorMessages.textContent = "";
  if (!validateForm()) {
    return;
  }
  alert("資料驗證成功！");
});

/**
 * 整體表單驗證（含跨欄位）
 */
function validateForm() {
  const form = projectForm.elements;
  let isValid = true;

  for (let i = 0; i < form.length; i++) {
    const element = form[i];
    if (element.type !== "button") {
      if (!validateField(element)) {
        isValid = false;
      }
    }
  }

  if (!validateDates()) {
    isValid = false;
  }

  return isValid;
}

// 為日期欄位加上變更事件（即時驗證日期先後順序）
const startDateEl = document.getElementById("startDate");
const endDateEl = document.getElementById("endDate");
if (startDateEl && endDateEl) {
  startDateEl.addEventListener("change", validateDates);
  endDateEl.addEventListener("change", validateDates);
}
