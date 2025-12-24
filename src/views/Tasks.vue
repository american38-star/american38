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

      <!-- المضاعفات (مصغّرة ومرفوعة) -->
      <div class="multipliers-grid">
        <div
          v-for="(m,i) in plinkoMultipliers"
          :key="i"
          :class="['mult', multiplierClass(m)]"
        >
          x{{ m }}
        </div>
      </div>

      <!-- التحكم السفلي -->
      <div class="plinko-controls">
        <input
          type="number"
          v-model.number="plinkoBet"
          class="bet-input"
          placeholder="مبلغ الرهان"
        />

        <button
          class="drop-btn"
          :disabled="ball.active"
          @click="startPlinko"
        >
          ابدأ الآن
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
      game: "plinko",
      balance: 0,
      result: "",

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
      this.ball.active = false;
      this.game = g;
    },

    async startPlinko() {
      if (this.ball.active) return;
      if (!this.plinkoBet || this.plinkoBet <= 0) return;
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
  margin: 10px auto 5px;
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
  margin: 7px;
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
  gap: 4px;
  width: 380px;
  margin: 6px auto;
}

.mult {
  padding: 4px 0;
  border-radius: 8px;
  font-size: 12px;
  font-weight: bold;
}

.high { background: #dc2626; }
.mid  { background: #22c55e; color: black; }
.low  { background: #facc15; color: black; }

.plinko-controls {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}

.bet-input {
  width: 130px;
  padding: 10px;
  border-radius: 10px;
  border: none;
  text-align: center;
}

.drop-btn {
  padding: 10px 18px;
  border-radius: 50px;
  border: none;
  font-size: 15px;
  font-weight: bold;
  background: #22c55e;
  color: black;
}

.result {
  margin-top: 15px;
  font-size: 18px;
  font-weight: bold;
}
</style>
