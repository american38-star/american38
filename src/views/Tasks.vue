<template>
  <div class="game-page">

    <div class="top-bar">
      <div class="balance">رصيدك: {{ balance.toFixed(2) }} USDT</div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button :class="{active: game==='chicken'}" @click="switchGame('chicken')">
        🐔 Chicken Road
      </button>
      <button :class="{active: game==='plinko'}" @click="switchGame('plinko')">
        🔴 Plinko
      </button>
    </div>

    <!-- ================= CHICKEN ================= -->
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
          x{{ step.multiplier }}
          <div v-if="i===position">🐔</div>
        </div>
      </div>

      <div v-if="started" class="controls">
        <div>الربح: {{ currentProfit.toFixed(2) }} USDT</div>
        <button @click="goNext">تقدم</button>
        <button @click="cashOutChicken">سحب</button>
      </div>
    </div>

    <!-- ================= PLINKO ================= -->
    <div v-if="game==='plinko'" class="card">

      <h2>🔴 Plinko</h2>

      <div class="bet-box">
        <input type="number" v-model.number="plinkoBet" placeholder="مبلغ الرهان USDT" />
        <button :disabled="ball.active" @click="startPlinko">PLAY</button>
      </div>

      <div class="plinko-board">
        <div v-for="r in rows" :key="r" class="row">
          <span v-for="d in r" :key="d" class="dot"></span>
        </div>

        <div
          v-if="ball.active"
          class="ball"
          :style="{ top: ball.y+'px', left: ball.x+'px' }"
        ></div>
      </div>

      <div class="multipliers">
        <span
          v-for="(m,i) in plinkoMultipliers"
          :key="i"
          :class="multiplierClass(m)"
        >
          x{{ m }}
        </span>
      </div>
    </div>

    <div v-if="result" class="result">{{ result }}</div>

  </div>
</template>

<script>
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default {
  data() {
    return {
      game: "chicken",
      balance: 0,
      result: "",

      /* ===== Chicken ===== */
      bet: null,
      started: false,
      position: 0,
      steps: [
        { multiplier: 1.0 },
        { multiplier: 1.1 },
        { multiplier: 1.3 },
        { multiplier: 1.5 },
        { multiplier: 2 },
        { multiplier: 3 },
        { multiplier: 5 },
      ],

      /* ===== Plinko ===== */
      plinkoBet: null,
      rows: Array.from({ length: 8 }, (_, i) => i + 3),
      plinkoMultipliers: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
      ball: {
        x: 150,
        y: 0,
        active: false,
      },
    };
  },

  computed: {
    currentProfit() {
      return this.bet
        ? this.bet * this.steps[this.position].multiplier
        : 0;
    },
  },

  async created() {
    const user = auth.currentUser;
    if (!user) return;
    const snap = await getDoc(doc(db, "users", user.uid));
    this.balance = Number(snap.data().balance || 0);
  },

  methods: {
    switchGame(g) {
      this.started = false;
      this.ball.active = false;
      this.result = "";
      this.game = g;
    },

    /* ===== Chicken ===== */
    async startChicken() {
      if (!this.bet || this.bet > this.balance) return;
      this.balance -= this.bet;
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        balance: this.balance,
      });
      this.started = true;
      this.position = 0;
    },

    goNext() {
      const loseChance = 0.35 + this.position * 0.1;
      if (Math.random() < loseChance) {
        this.result = "💥 خسرت";
        this.started = false;
        return;
      }
      if (this.position < this.steps.length - 1) this.position++;
      else this.cashOutChicken();
    },

    async cashOutChicken() {
      const win = this.currentProfit;
      this.balance += win;
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        balance: this.balance,
      });
      this.result = `🎉 ربحت ${win.toFixed(2)} USDT`;
      this.started = false;
    },

    /* ===== Plinko ===== */
    async startPlinko() {
      if (!this.plinkoBet || this.plinkoBet > this.balance) return;

      this.balance -= this.plinkoBet;
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        balance: this.balance,
      });

      this.ball = { x: 150, y: 0, active: true };
      this.dropBall();
    },

    dropBall() {
      const interval = setInterval(async () => {
        this.ball.y += 12;
        this.ball.x += Math.random() > 0.5 ? 8 : -8;

        if (this.ball.y >= 270) {
          clearInterval(interval);
          this.ball.active = false;

          const index = Math.floor(
            Math.random() * this.plinkoMultipliers.length
          );

          const win = this.plinkoBet * this.plinkoMultipliers[index];
          this.balance += win;

          await updateDoc(doc(db, "users", auth.currentUser.uid), {
            balance: this.balance,
          });

          this.result = `🎯 ربحت ${win.toFixed(2)} USDT`;
        }
      }, 40);
    },

    multiplierClass(m) {
      if (m >= 10) return "high";
      if (m >= 1) return "mid";
      return "low";
    },
  },
};
</script>

<style scoped>
.multipliers span {
  padding: 6px 10px;
  border-radius: 6px;
  margin: 3px;
  font-weight: bold;
}
.high { background: red; }
.mid { background: orange; }
.low { background: green; }
</style>
