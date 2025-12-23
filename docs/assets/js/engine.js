class GameEngine {
  constructor(storage, onLog) {
    this.storage = storage;
    this.onLog = onLog;
    this.save = this.storage.loadSave();
    this.state = "MAIN";
    this.run = null;
    this.enterMain();
  }

  emitSystem(text) {
    this.onLog({ type: "system", text });
  }

  emitPlayer(text) {
    this.onLog({ type: "player", text });
  }

  resetGame() {
    this.save = this.storage.resetSave();
    this.emitSystem("세이브를 초기화했습니다.");
    this.enterMain();
  }

  handleInput(rawText) {
    const text = rawText.trim().toLowerCase();
    if (!text) {
      return { openHelp: false };
    }

    this.emitPlayer(rawText);

    if (text === "help") {
      this.emitSystem("도움말을 열었습니다.");
      return { openHelp: true };
    }

    if (text === "reset") {
      this.resetGame();
      return { openHelp: false };
    }

    if (text === "back") {
      this.handleBack();
      return { openHelp: false };
    }

    if (this.state === "MAIN") {
      this.handleMainInput(text);
    } else if (this.state === "GARAGE") {
      this.handleGarageInput(text);
    } else if (this.state === "RUN") {
      this.handleRunInput(text);
    } else if (this.state === "RESULT") {
      this.handleResultInput(text);
    }

    return { openHelp: false };
  }

  handleBack() {
    if (this.state === "GARAGE" || this.state === "RESULT") {
      this.enterMain();
      return;
    }

    if (this.state === "RUN") {
      this.emitSystem("RUN에서는 뒤로 갈 수 없습니다. (입력 예: hit, charge, focus)");
      return;
    }

    this.emitSystem("이전 상태로 이동할 수 없습니다.");
  }

  enterMain() {
    this.state = "MAIN";
    const { coins, parts, bestScore } = this.save;
    this.emitSystem(
      `환영합니다!\nCoins: ${coins} | Parts: ${parts} | BestScore: ${bestScore}`
    );
    this.emitSystem("선택지를 입력하세요:\n1) Garage\n2) Start Run\n3) Help");
  }

  enterGarage() {
    this.state = "GARAGE";
    const { coins, parts, blueprints, bestScore, equipment } = this.save;
    const blueprintCount = Object.values(blueprints).reduce((sum, value) => sum + value, 0);
    this.emitSystem(
      `GARAGE\nCoins: ${coins} | Parts: ${parts} | Blueprints: ${blueprintCount} | BestScore: ${bestScore}`
    );
    this.emitSystem(
      `장비 레벨\n- Glove Lv.${equipment.gloveLv} (tapDamage +${equipment.gloveLv}/lv)\n- Hammer Lv.${equipment.hammerLv} (chargedDamage +${equipment.hammerLv * 3}/lv)\n- Drone Lv.${equipment.droneLv} (카운터 감소 +${equipment.droneLv}/lv)`
    );
    this.emitSystem(
      "선택지를 입력하세요:\n1) Upgrade Glove\n2) Upgrade Hammer\n3) Upgrade Drone\n4) Start Run\n5) Back(Main)"
    );
  }

  enterRun() {
    this.state = "RUN";
    this.run = {
      timeLeft: 40.0,
      stageIndex: 0,
      stageHP: 180,
      combo: 0,
      maxCombo: 0,
      counterGauge: 0,
      stunTurns: 0,
      pointerIndex: this.randomPointer(),
      totalDamage: 0,
      perfectCount: 0,
      resultStatus: "FAIL",
    };
    this.emitSystem("RUN 시작! 금고에 접근했다.");
    this.emitRunPrompt();
  }

  enterResult(resultStatus) {
    this.state = "RESULT";
    this.run.resultStatus = resultStatus;
    const remainingSeconds = Math.floor(this.run.timeLeft);
    const score =
      this.run.totalDamage +
      this.run.perfectCount * 50 +
      this.run.maxCombo * 20 +
      remainingSeconds * 10;
    const rank = this.getRank(score);
    const rewardCoins = this.randomRange(50, 90);
    const rewardParts = this.randomRange(1, 3);
    const blueprintChance = rank === "S" ? 0.1 : 0.05;
    const gotBlueprint = Math.random() < blueprintChance;

    this.save.coins += rewardCoins;
    this.save.parts += rewardParts;
    if (gotBlueprint) {
      const id = "vault_core";
      this.save.blueprints[id] = (this.save.blueprints[id] || 0) + 1;
    }
    if (score > this.save.bestScore) {
      this.save.bestScore = score;
    }
    this.storage.saveSave(this.save);

    const statusText = resultStatus === "CLEAR" ? "CLEAR" : "FAIL";
    const blueprintText = gotBlueprint ? "Blueprint 획득!" : "Blueprint 없음";

    this.emitSystem(
      `${statusText}!\nRank: ${rank} | Score: ${score}\nRewards: +${rewardCoins} Coins, +${rewardParts} Parts, ${blueprintText}\nBestScore: ${this.save.bestScore}`
    );
    this.emitSystem("선택지를 입력하세요:\n1) Run Again\n2) Back to Garage\n3) Back to Main");
  }

  handleMainInput(text) {
    if (text === "1" || text === "garage") {
      this.enterGarage();
      return;
    }
    if (text === "2" || text === "start") {
      this.enterRun();
      return;
    }
    if (text === "3" || text === "help") {
      this.emitSystem("help를 입력하거나 상단 Help 버튼을 눌러 주세요.");
      return;
    }

    this.emitSystem("잘못된 입력입니다. (예: 1, 2, 3, garage, start)");
  }

  handleGarageInput(text) {
    if (text === "1" || text === "upgrade glove") {
      this.upgradeEquipment("gloveLv", "Glove");
      return;
    }
    if (text === "2" || text === "upgrade hammer") {
      this.upgradeEquipment("hammerLv", "Hammer");
      return;
    }
    if (text === "3" || text === "upgrade drone") {
      this.upgradeEquipment("droneLv", "Drone");
      return;
    }
    if (text === "4" || text === "start") {
      this.enterRun();
      return;
    }
    if (text === "5" || text === "back") {
      this.enterMain();
      return;
    }

    this.emitSystem(
      "잘못된 입력입니다. (예: 1, 2, 3, 4, 5, upgrade glove, start)"
    );
  }

  handleRunInput(text) {
    if (this.run.stunTurns > 0) {
      this.processStunTurn();
      if (this.state === "RUN") {
        this.emitRunPrompt();
      }
      return;
    }

    if (text !== "hit" && text !== "charge" && text !== "focus" && text !== "1" && text !== "2" && text !== "3") {
      this.emitSystem("잘못된 입력입니다. (예: hit, charge, focus)");
      return;
    }

    const action = this.normalizeRunAction(text);
    this.processRunAction(action);
  }

  handleResultInput(text) {
    if (text === "1" || text === "again") {
      this.enterRun();
      return;
    }
    if (text === "2" || text === "garage") {
      this.enterGarage();
      return;
    }
    if (text === "3" || text === "main") {
      this.enterMain();
      return;
    }

    this.emitSystem("잘못된 입력입니다. (예: 1, 2, 3, again, garage, main)");
  }

  upgradeEquipment(key, label) {
    const current = this.save.equipment[key];
    if (current >= 10) {
      this.emitSystem(`${label}은(는) 이미 최대 레벨입니다.`);
      return;
    }
    const cost = (current + 1) * 100;
    if (this.save.coins < cost) {
      this.emitSystem(`Coins가 부족합니다. 필요 Coins: ${cost}`);
      return;
    }
    this.save.coins -= cost;
    this.save.equipment[key] += 1;
    this.storage.saveSave(this.save);
    this.emitSystem(`${label} 강화 성공! Lv.${this.save.equipment[key]} (Coins -${cost})`);
    this.enterGarage();
  }

  normalizeRunAction(text) {
    if (text === "1" || text === "hit") return "HIT";
    if (text === "2" || text === "charge") return "CHARGE";
    return "FOCUS";
  }

  processStunTurn() {
    this.emitSystem("STUN… 금고의 충격파!");
    this.run.stunTurns -= 1;
    this.run.combo = 0;
    this.applyTimeLoss(1.0);
    if (this.run.timeLeft <= 0) {
      this.enterResult("FAIL");
    }
  }

  processRunAction(action) {
    const tapDamage = 10 + this.save.equipment.gloveLv;
    const chargedDamage = 45 + this.save.equipment.hammerLv * 3;
    let rawDamage = 0;
    let grade = "";
    let gradeMultiplier = 1;

    if (action === "FOCUS") {
      rawDamage = Math.round(tapDamage * 0.4);
      grade = "FOCUS";
      gradeMultiplier = 1;
      this.run.counterGauge = Math.max(0, this.run.counterGauge - (10 + this.save.equipment.droneLv));
    } else {
      rawDamage = action === "HIT" ? tapDamage : chargedDamage;
      const diff = Math.abs(this.run.pointerIndex - 3);
      if (diff === 0) {
        grade = "Perfect";
        gradeMultiplier = 2.0;
      } else if (diff === 1) {
        grade = "Great";
        gradeMultiplier = 1.5;
      } else if (diff === 2) {
        grade = "Good";
        gradeMultiplier = 1.0;
      } else {
        grade = "Miss";
        gradeMultiplier = 0;
      }
    }

    const comboMultiplier = this.getComboMultiplier(this.run.combo);
    const finalDamage = Math.round(rawDamage * gradeMultiplier * comboMultiplier);

    if (grade === "Perfect") {
      this.run.combo += 2;
      this.run.perfectCount += 1;
      this.run.counterGauge = Math.max(0, this.run.counterGauge - (15 + this.save.equipment.droneLv));
      this.emitSystem("쾅!! CRITICAL!!");
    } else if (grade === "Great") {
      this.run.combo += 1;
      this.emitSystem("쿵! 좋은 타이밍!");
    } else if (grade === "Good") {
      this.run.combo += 1;
      this.emitSystem("탁! 조금 아쉽다!");
    } else if (grade === "Miss") {
      this.run.combo = 0;
      this.run.counterGauge += 10;
      this.emitSystem("헛스윙… 금고가 반격을 준비한다!");
    } else if (grade === "FOCUS") {
      this.emitSystem("집중! 타이밍을 조정한다.");
    }

    if (this.run.combo > this.run.maxCombo) {
      this.run.maxCombo = this.run.combo;
    }

    if (finalDamage > 0) {
      this.run.stageHP -= finalDamage;
      this.run.totalDamage += finalDamage;
      this.emitSystem(`데미지: ${finalDamage}`);
    }

    if (this.run.counterGauge >= 100) {
      this.run.counterGauge = 0;
      this.run.stunTurns = 1;
    }

    if (action === "HIT") {
      this.applyTimeLoss(1.6);
    } else if (action === "CHARGE") {
      this.applyTimeLoss(2.0);
    } else {
      this.applyTimeLoss(1.2);
    }

    if (this.run.timeLeft <= 0) {
      this.enterResult("FAIL");
      return;
    }

    if (this.run.stageHP <= 0) {
      if (this.run.stageIndex === 0) {
        this.emitSystem("방어막이 깨졌다! 약점이 드러난다!");
        this.run.stageIndex = 1;
        this.run.stageHP = 120;
      } else if (this.run.stageIndex === 1) {
        this.emitSystem("약점 파괴! 코어가 노출됐다!");
        this.run.stageIndex = 2;
        this.run.stageHP = 220;
      } else {
        this.emitSystem("— FINAL SMASH —");
        this.emitSystem("코어 폭발! 금고 파괴 성공!");
        this.enterResult("CLEAR");
        return;
      }
    }

    this.run.pointerIndex = this.randomPointer();
    this.emitRunPrompt();
  }

  emitRunPrompt() {
    const stageInfo = this.getStageInfo();
    const indicator = this.getIndicator();
    const coreWarning =
      this.run.stageIndex === 2 && this.run.stageHP <= 22
        ? "\n코어가 불안정하게 떨린다…"
        : "";
    this.emitSystem(
      `Stage: ${stageInfo.name} | HP: ${this.run.stageHP} | Time: ${this.run.timeLeft.toFixed(
        1
      )}\nCombo: ${this.run.combo} | MaxCombo: ${this.run.maxCombo} | CounterGauge: ${this.run.counterGauge}\nWeakness Indicator: ${indicator}${coreWarning}\n선택지:\n1) HIT\n2) CHARGE\n3) FOCUS`
    );
  }

  getStageInfo() {
    if (this.run.stageIndex === 0) {
      return { name: "Shield", max: 180 };
    }
    if (this.run.stageIndex === 1) {
      return { name: "WeakPoint", max: 120 };
    }
    return { name: "Core", max: 220 };
  }

  getIndicator() {
    const slots = Array(7).fill(".");
    slots[this.run.pointerIndex] = "^";
    return `[${slots.join("")}]`;
  }

  getComboMultiplier(combo) {
    if (combo >= 60) return 1.6;
    if (combo >= 40) return 1.4;
    if (combo >= 20) return 1.25;
    if (combo >= 10) return 1.1;
    return 1.0;
  }

  applyTimeLoss(amount) {
    this.run.timeLeft = Math.max(0, this.run.timeLeft - amount);
  }

  getRank(score) {
    if (score >= 2200) return "S";
    if (score >= 1700) return "A";
    if (score >= 1200) return "B";
    return "C";
  }

  randomPointer() {
    return Math.floor(Math.random() * 7);
  }

  randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

window.CoreBreakerEngine = GameEngine;
