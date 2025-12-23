<template>
  <div class="game-page">

    <h2 class="title">🐔 Chicken Road</h2>
    <p class="sub">غامر وتقدم خطوة بخطوة واربح USDT</p>

    <!-- إدخال الرهان -->
    <div v-if="!started" class="bet-box">
      <input
        type="number"
        v-model.number="bet"
        placeholder="أدخل مبلغ USDT"
      />
      <button @click="startGame" :disabled="bet <= 0">
        ابدأ اللعب
      </button>
    </div>

    <!-- ساحة اللعب -->
    <div v-if="started" class="road">

      <div
        v-for="(step, i) in steps"
        :key="i"
        class="step"
        :class="{ active: i === position }"
      >
        <div class="multiplier">x{{ step.multiplier }}</div>
        <div v-if="i === position" class="chicken">🐔</div>
      </div>

    </div>

    <!-- التحكم -->
    <div v-if="started" class="controls">
      <div class="profit">
        الربح الحالي: {{ currentProfit.toFixed(2) }} USDT
      </div>

      <button class="forward" @click="goNext">
        إلى الأمام
      </button>

      <button class="cashout" @click="cashOut">
        سحب الأرباح
      </button>
    </div>

    <!-- النتيجة -->
    <div v-if="result" class="result" :class="result">
      {{ result === 'win' ? '🎉 ربحت!' : '💥 خسرت!' }}
    </div>

  </div>
</template>

<script>
export default {
  name: "ChickenRoad",

  data() {
    return {
      bet: 0,
      started: false,
      position: 0,
      result: null,

      steps: [
        { multiplier: 1.2, loseChance: 0.1 },
        { multiplier: 1.5, loseChance: 0.15 },
        { multiplier: 2.0, loseChance: 0.2 },
        { multiplier: 3.2, loseChance: 0.3 },
        { multiplier: 5.0, loseChance: 0.45 },
      ],
    };
  },

  computed: {
    currentProfit() {
      if (!this.started) return 0;
      return this.bet * this.steps[this.position].multiplier;
    },
  },

  methods: {
    startGame() {
      this.started = true;
      this.position = 0;
      this.result = null;
    },

    goNext() {
      const step = this.steps[this.position];
      const roll = Math.random();

      if (roll < step.loseChance) {
        this.result = "lose";
        this.started = false;
        return;
      }

      if (this.position < this.steps.length - 1) {
        this.position++;
      }
    },

    cashOut() {
      this.result = "win";
      this.started = false;

      // 🔥 هنا لاحقًا:
      // أضف الربح إلى رصيد USDT في Firestore
    },
  },
};
</script>

<style scoped>
.game-page {
  direction: rtl;
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(#222, #444);
  color: #fff;
  text-align: center;
}

.title {
  font-size: 24px;
  margin-bottom: 5px;
}

.sub {
  color: #ccc;
  margin-bottom: 20px;
}

.bet-box input {
  width: 80%;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 10px;
  border: none;
}

.bet-box button {
  width: 80%;
  padding: 12px;
  border-radius: 12px;
  background: #0d6efd;
  color: white;
  border: none;
  font-size: 16px;
}

.road {
  display: flex;
  justify-content: space-between;
  margin: 20px 0;
}

.step {
  width: 18%;
  background: #333;
  border-radius: 12px;
  padding: 10px;
  position: relative;
}

.step.active {
  background: #0d6efd;
}

.multiplier {
  font-weight: bold;
}

.chicken {
  font-size: 30px;
  margin-top: 10px;
}

.controls button {
  width: 45%;
  padding: 12px;
  border-radius: 12px;
  border: none;
  font-size: 16px;
  margin: 5px;
}

.forward {
  background: #28a745;
  color: white;
}

.cashout {
  background: #ffc107;
  color: black;
}

.result {
  margin-top: 20px;
  font-size: 22px;
  font-weight: bold;
}
</style>
