const SAVE_KEY = "core_breaker_text_save_v1";

function defaultSave() {
  return {
    coins: 250,
    parts: 5,
    blueprints: {},
    equipment: { gloveLv: 1, hammerLv: 1, droneLv: 1 },
    bestScore: 0,
  };
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return defaultSave();
    }
    const data = JSON.parse(raw);
    return {
      ...defaultSave(),
      ...data,
      equipment: {
        ...defaultSave().equipment,
        ...(data.equipment || {}),
      },
      blueprints: data.blueprints || {},
    };
  } catch (error) {
    console.warn("세이브 로드 실패", error);
    return defaultSave();
  }
}

function saveSave(data) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

function resetSave() {
  const data = defaultSave();
  saveSave(data);
  return data;
}

window.CoreBreakerStorage = {
  loadSave,
  saveSave,
  resetSave,
};
