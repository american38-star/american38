<template>
  <div class="game-page">

    <!-- اختيار اللعبة -->
    <div class="tabs">
      <button :class="{active: game==='chicken'}" @click="game='chicken'">
        🐔 Chicken Road
      </button>
      <button :class="{active: game==='plinko'}" @click="game='plinko'">
        🔴 Plinko
      </button>
    </div>

    <div class="balance">
      رصيدك: {{ balance.toFixed(2) }} USDT
    </div>

    <!-- ================= CHICKEN ROAD ================= -->
    <div v-if="game==='chicken'">

      <h2>🐔 Chicken Road</h2>

      <div v-if="!started" class="bet-box">
        <input type="number" v-model.number="bet" placeholder="مبلغ الرهان" />
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
        <div>الربح: {{ currentProfit.toFixed(2) }}</div>
        <button @click="goNext">تقدم</button>
        <button @click="cashOutChicken">سحب</button>
      </div>

    </div>

    <!-- ================= PLINKO ================= -->
    <div v-if="game==='plinko'" class="plinko">

      <h2>🔴 Plinko</h2>

      <div v-if="!plinkoStarted" class="bet-box">
        <input type="number" v-model.number="plinkoBet" placeholder="مبلغ الرهان" />
        <button @click="startPlinko">PLAY</button>
      </div>

      <!-- اللوحة -->
      <div class="board">
        <div
          v-for="(row,r) in rows"
          :key="r"
          class="row"
        >
          <span v-for="(dot,d) in row" :key="d" class="dot"></span>
        </div>

        <!-- الكرة -->
        <div
          v-if="ball.active"
          class="ball"
          :style="{ top: ball.y+'px', left: ball.x+'px' }"
        ></div>
      </div>

      <!-- المضاعفات -->
      <div class="multipliers">
        <span
          v-for="(m,i) in plinkoMultipliers"
          :key="i"
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
        { multiplier: 1 },
        { multiplier: 1.3 },
        { multiplier: 1.7 },
        { multiplier: 2.5 },
        { multiplier: 4 },
      ],

      /* ===== Plinko ===== */
      plinkoBet: null,
      plinkoStarted: false,
      rows: Array.from({ length: 8 }, (_, i) =>
        Array.from({ length: i + 3 })
      ),
      plinkoMultipliers: [0.3, 0.5, 1, 1.5, 3, 5, 10],
      ball: {
        x: 150,
        y: 0,
        active: false,
      },
    };
  },

  computed: {
    currentProfit() {
      return this.bet ? this.bet * this.steps[this.position].multiplier : 0;
    },
  },

  async created() {
    const user = auth.currentUser;
    if (!user) return;
    const snap = await getDoc(doc(db, "users", user.uid));
    this.balance = Number(snap.data().balance || 0);
  },

  methods: {
    /* ===== Chicken ===== */
    async startChicken() {
      if (!this.bet || this.bet > this.balance) return;
      this.balance -= this.bet;
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        balance: this.balance,
      });
      this.started = true;
      this.position = 0;
      this.result = "";
    },

    goNext() {
      if (Math.random() > 0.4 - this.position * 0.05) {
        this.result = "💥 خسرت";
        this.started = false;
        return;
      }
      if (this.position < this.steps.length - 1) this.position++;
      else this.cashOutChicken();
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
      if (!this.plinkoBet || this.plinkoBet > this.balance) return;

      this.balance -= this.plinkoBet;
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        balance: this.balance,
      });

      this.ball = { x: 150, y: 0, active: true };
      this.dropBall();
    },

    dropBall() {
      let interval = setInterval(async () => {
        this.ball.y += 10;
        this.ball.x += Math.random() > 0.5 ? 6 : -6;

        if (this.ball.y > 260) {
          clearInterval(interval);
          this.ball.active = false;

          const index = Math.floor(Math.random() * this.plinkoMultipliers.length);
          const win =
            this.plinkoBet * this.plinkoMultipliers[index];

          this.balance += win;
          await updateDoc(doc(db, "users", auth.currentUser.uid), {
            balance: this.balance,
          });

          this.result = `🎯 Plinko ربحت ${win.toFixed(2)} USDT`;
        }
      }, 40);
    },
  },
};
</script>

<style scoped>
.game-page {
  background: #0f172a;
  color: white;
  min-height: 100vh;
  padding: 15px;
  text-align: center;
}

.tabs button {
  margin: 5px;
  padding: 10px;
}
.tabs .active {
  background: #22c55e;
}

.balance {
  margin: 10px 0;
  font-weight: bold;
}

.road {
  display: flex;
  justify-content: space-between;
}
.step {
  background: #1e293b;
  padding: 10px;
  border-radius: 8px;
}
.step.active {
  background: #22c55e;
}

.plinko .board {
  position: relative;
  height: 300px;
  margin: 10px auto;
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
  background: red;
  border-radius: 50%;
}

.multipliers span {
  margin: 4px;
  padding: 4px 8px;
  background: #1e293b;
  border-radius: 6px;
}

.result {
  margin-top: 15px;
  font-size: 18px;
}
</style>
