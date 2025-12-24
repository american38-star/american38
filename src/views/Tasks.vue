<template>
  <div class="game-page">

    <!-- الرصيد -->
    <div class="top-bar">
      <div class="balance">رصيدك: {{ balance.toFixed(2) }} USDT</div>
    </div>

    <!-- التبويبات -->
    <div class="tabs">
      <button :class="{active: game==='chicken'}" @click="switchGame('chicken')">
        🐔 Chicken Road
      </button>
      <button :class="{active: game==='plinko'}" @click="switchGame('plinko')">
        🔴 Plinko
      </button>
    </div>

    <!-- ================= CHICKEN ROAD ================= -->
    <div v-if="game==='chicken'" class="card">
      <h2>🐔 Chicken Road</h2>

      <div v-if="!started" class="bet-box">
        <input type="number" v-model.number="bet" placeholder="مبلغ الرهان USDT" />
        <button @click="startChicken">ابدأ</button>
      </div>

      <div v-if="started" class="road">
        <div
          v-for="(step,i) in steps"
          :key="i"
          class="step"
          :class="{active:i===position}"
        >
          x{{ step.multiplier.toFixed(2) }}
          <div v-if="i===position" class="icon">🐔</div>
        </div>
      </div>

      <div v-if="started" class="controls">
        <div class="profit">الربح: {{ currentProfit.toFixed(2) }} USDT</div>
        <button @click="goNext">تقدم</button>
        <button @click="cashOutChicken">سحب</button>
      </div>
    </div>

    <!-- ================= PLINKO ================= -->
    <div v-if="game==='plinko'" class="card plinko-card">
      <h2>🔴 Plinko</h2>

      <!-- اللوحة -->
      <div class="plinko-board">
        <div v-for="(row,r) in rows" :key="r" class="row">
          <span v-for="n in row" :key="n" class="dot"></span>
        </div>

        <div
          v-if="ball.active"
          class="ball"
          :style="{ top: ball.y+'px', left: ball.x+'px' }"
        ></div>
      </div>

      <!-- المضاعفات (مرفوعة + مصغرة) -->
      <div class="multipliers-grid">
        <div
          v-for="(m,i) in plinkoMultipliers"
          :key="i"
          :class="['mult', multiplierClass(m)]"
        >
          x{{ m }}
        </div>
      </div>

      <!-- زر الإسقاط -->
      <div class="drop-btn-wrapper">
        <button class="drop-btn" :disabled="ball.active" @click="startPlinko">
          ⬇️
        </button>
      </div>
    </div>

    <div v-if="result" class="result">{{ result }}</div>

  </div>
</template>

<script>
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default {
  name: "Games",
  data() {
    return {
      game: "chicken",
      balance: 0,
      result: "",

      bet: null,
      started: false,
      position: 0,
      steps: [
        { multiplier: 1.0 },
        { multiplier: 1.1 },
        { multiplier: 1.3 },
        { multiplier: 1.5 },
        { multiplier: 2.0 },
        { multiplier: 3.0 },
        { multiplier: 5.0 },
      ],

      plinkoBet: 100,
      rows: [3,4,5,6,7,8,9,10],
      plinkoMultipliers: [29,4,1.5,0.3,0.2,0.3,1.5,4,29],
      ball: { x: 190, y: 0, active: false },
    };
  },

  computed: {
    currentProfit() {
      if (!this.bet) return 0;
      return this.bet * this.steps[this.position].multiplier;
    },
  },

  async created() {
    const user = auth.currentUser;
    if (!user) return;
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) this.balance = Number(snap.data().balance || 0);
  },

  methods: {
    switchGame(g) {
      this.result = "";
      this.started = false;
      this.ball.active = false;
      this.game = g;
    },

    async startChicken() {
      if (!this.bet || this.bet > this.balance) return;
      this.balance -= this.bet;
      await updateDoc(doc(db, "users", auth.currentUser.uid), { balance: this.balance });
      this.started = true;
      this.position = 0;
    },

    goNext() {
      if (Math.random() < 0.4 + this.position * 0.07) {
        this.result = "💥 خسرت";
        this.started = false;
        return;
      }
      this.position < this.steps.length - 1 ? this.position++ : this.cashOutChicken();
    },

    async cashOutChicken() {
      const profit = this.currentProfit;
      this.balance += profit;
      await updateDoc(doc(db, "users", auth.currentUser.uid), { balance: this.balance });
      this.result = `🎉 ربحت ${profit.toFixed(2)} USDT`;
      this.started = false;
    },

    async startPlinko() {
      if (this.ball.active || this.plinkoBet > this.balance) return;
      this.balance -= this.plinkoBet;
      await updateDoc(doc(db, "users", auth.currentUser.uid), { balance: this.balance });
      this.ball = { x: 190, y: 0, active: true };
      this.dropBall();
    },

    dropBall() {
      const i = setInterval(async () => {
        this.ball.y += 8;
        this.ball.x += Math.random() > 0.5 ? 10 : -10;

        if (this.ball.y >= 260) {
          clearInterval(i);
          this.ball.active = false;
          const w = 380 / this.plinkoMultipliers.length;
          const index = Math.min(this.plinkoMultipliers.length-1, Math.max(0, Math.floor(this.ball.x / w)));
          const win = this.plinkoBet * this.plinkoMultipliers[index];
          this.balance += win;
          await updateDoc(doc(db, "users", auth.currentUser.uid), { balance: this.balance });
          this.result = `🎯 ربحت ${win.toFixed(2)} USDT`;
        }
      }, 30);
    },

    multiplierClass(m) {
      if (m >= 10) return "high";
      if (m <= 0.3) return "low";
      return "mid";
    },
  },
};
</script>

<style scoped>
.multipliers-grid {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 4px;
  width: 380px;
  margin: -10px auto 8px; /* ⬆️ مرفوعة */
}

.mult {
  padding: 4px 0;        /* ⬇️ أصغر */
  font-size: 12px;       /* ⬇️ تصغير الأرقام */
  border-radius: 8px;
  font-weight: bold;
}
</style>
