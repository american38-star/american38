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

      <!-- المضاعفات (مرتبة مثل الصورة) -->
      <div class="multipliers-grid">
        <div
          v-for="(m,i) in plinkoMultipliers"
          :key="i"
          :class="['mult', multiplierClass(m)]"
        >
          x{{ m }}
        </div>
      </div>

      <!-- زر الإسقاط الدائري -->
      <div class="drop-btn-wrapper">
        <button
          class="drop-btn"
          :disabled="ball.active"
          @click="startPlinko"
        >
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

      /* ===== Chicken Road ===== */
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

      /* ===== Plinko ===== */
      plinkoBet: 100,
      rows: [3,4,5,6,7,8,9,10],
      plinkoMultipliers: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
      ball: {
        x: 190,
        y: 0,
        active: false,
      },
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
    if (snap.exists()) {
      this.balance = Number(snap.data().balance || 0);
    }
  },

  methods: {
    switchGame(g) {
      this.result = "";
      this.started = false;
      this.ball.active = false;
      this.game = g;
    },

    /* ===== Chicken ===== */
    async startChicken() {
      if (!this.bet || this.bet <= 0 || this.bet > this.balance) return;
      this.balance -= this.bet;
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        balance: this.balance,
      });
      this.started = true;
      this.position = 0;
    },

    goNext() {
      const loseChance = 0.4 + this.position * 0.07;
      if (Math.random() < loseChance) {
        this.result = "💥 خسرت";
        this.started = false;
        return;
      }
      if (this.position < this.steps.length - 1) {
        this.position++;
      } else {
        this.cashOutChicken();
      }
    },

    async cashOutChicken() {
      const profit = this.currentProfit;
      this.balance += profit;
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        balance: this.balance,
      });
      this.result = `🎉 ربحت ${profit.toFixed(2)} USDT`;
      this.started = false;
    },

    /* ===== Plinko ===== */
    async startPlinko() {
      if (this.ball.active) return;
      if (this.plinkoBet > this.balance) return;

      this.balance -= this.plinkoBet;
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        balance: this.balance,
      });

      this.ball = { x: 190, y: 0, active: true };
      this.dropBall();
    },

    dropBall() {
      const interval = setInterval(async () => {
        this.ball.y += 8;
        this.ball.x += Math.random() > 0.5 ? 10 : -10;

        if (this.ball.y >= 260) {
          clearInterval(interval);
          this.ball.active = false;

          const slotWidth = 380 / this.plinkoMultipliers.length;
          const index = Math.min(
            this.plinkoMultipliers.length - 1,
            Math.max(0, Math.floor(this.ball.x / slotWidth))
          );

          const multiplier = this.plinkoMultipliers[index];
          const win = this.plinkoBet * multiplier;

          this.balance += win;
          await updateDoc(doc(db, "users", auth.currentUser.uid), {
            balance: this.balance,
          });

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
.game-page {
  background: #0f172a;
  min-height: 100vh;
  color: white;
  padding: 15px;
  text-align: center;
}

.tabs {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 15px;
}

.tabs button {
  padding: 10px 14px;
  border-radius: 10px;
  background: #1e293b;
  color: white;
  border: none;
}

.tabs .active {
  background: #22c55e;
}

.card {
  background: #020617;
  border-radius: 14px;
  padding: 15px;
  max-width: 420px;
  margin: auto;
}

.plinko-board {
  position: relative;
  height: 300px;
  width: 380px;
  margin: 15px auto;
}

.row {
  display: flex;
  justify-content: center;
}

.dot {
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
  margin: 8px;
}

.ball {
  position: absolute;
  width: 14px;
  height: 14px;
  background: #ff2d55;
  border-radius: 50%;
}

.multipliers-grid {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 6px;
  width: 380px;
  margin: 10px auto;
}

.mult {
  padding: 8px 0;
  border-radius: 10px;
  font-weight: bold;
}

.high { background: #dc2626; }
.mid  { background: #22c55e; color: black; }
.low  { background: #facc15; color: black; }

.drop-btn-wrapper {
  margin-top: 12px;
}

.drop-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  font-size: 24px;
  background: #22c55e;
  color: black;
}

.result {
  margin-top: 15px;
  font-size: 18px;
  font-weight: bold;
}
</style>
