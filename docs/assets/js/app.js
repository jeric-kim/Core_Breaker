(function () {
  const logEl = document.getElementById("log");
  const inputEl = document.getElementById("commandInput");
  const sendButton = document.getElementById("sendButton");
  const helpButton = document.getElementById("helpButton");
  const resetButton = document.getElementById("resetButton");
  const helpModal = document.getElementById("helpModal");
  const closeHelpButton = document.getElementById("closeHelpButton");
  const helpBody = document.getElementById("helpBody");

  const storage = window.CoreBreakerStorage;
  const engine = new window.CoreBreakerEngine(storage, appendLog);

  renderHelpContent();

  function appendLog(entry) {
    const item = document.createElement("div");
    item.className = `log__item log__item--${entry.type}`;
    item.textContent = entry.text;
    logEl.appendChild(item);
    scrollToBottom();
  }

  function scrollToBottom() {
    logEl.scrollTop = logEl.scrollHeight;
  }

  function handleSend() {
    const text = inputEl.value;
    if (!text.trim()) {
      return;
    }
    const result = engine.handleInput(text);
    inputEl.value = "";
    inputEl.focus();
    if (result.openHelp) {
      openHelp();
    }
  }

  function openHelp() {
    helpModal.classList.add("is-open");
    helpModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeHelp() {
    helpModal.classList.remove("is-open");
    helpModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function renderHelpContent() {
    helpBody.innerHTML = `
      <p>Core Breaker: Text는 텍스트 입력만으로 진행하는 금고 파괴 게임입니다.</p>
      <h3>목표</h3>
      <p>시간 내에 Shield → WeakPoint → Core를 파괴하고 높은 점수를 획득하세요.</p>
      <h3>상태</h3>
      <p>MAIN / GARAGE / RUN / RESULT 네 단계로 구성됩니다.</p>
      <h3>명령어</h3>
      <ul>
        <li>help: 도움말 열기</li>
        <li>reset: 세이브 초기화</li>
        <li>back: 이전 메뉴로 이동</li>
        <li>RUN 중 입력: hit, charge, focus</li>
      </ul>
      <h3>판정</h3>
      <p>Indicator 중앙일수록 Perfect! 콤보가 높을수록 데미지 배율 증가.</p>
      <h3>점수</h3>
      <p>총 데미지 + Perfect 보너스 + 최고 콤보 + 남은 시간.</p>
      <h3>보상</h3>
      <p>코인/부품 보상과 확률적 Blueprint 지급.</p>
      <h3>세이브</h3>
      <p>모든 진행은 로컬 저장소에 자동 저장됩니다.</p>
    `;
  }

  sendButton.addEventListener("click", handleSend);
  inputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleSend();
    }
  });

  helpButton.addEventListener("click", openHelp);
  closeHelpButton.addEventListener("click", closeHelp);
  helpModal.addEventListener("click", (event) => {
    if (event.target === helpModal) {
      closeHelp();
    }
  });

  resetButton.addEventListener("click", () => {
    engine.resetGame();
  });
})();
