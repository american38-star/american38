<template>
  <div class="plinko-page">
    <h2 class="title">🎯 Plinko</h2>

    <div class="balance">
      رصيدك: {{ balance.toFixed(2) }} USDT
    </div>

    <!-- الإعدادات -->
    <div v-if="!playing" class="controls-box">
      <input
        type="number"
        v-model.number="bet"
        placeholder="مبلغ الرهان USDT"
      />

      <select v-model="risk">
        <option value="low">Low Risk</option>
        <option value="medium">Medium Risk</option>
        <option value="high">High Risk</option>
      </select>

      <button @click="startGame">PLAY</button>
    </div>

    <!-- لوحة بلينكو -->
    <div v-if="playing" class="board">
      <div
        v-for="(row, r) in rows"
        :key="r"
        class="row"
      >
        <span
          v-for="(dot, d) in row"
          :key="d"
          class="dot"
        ></span>
      </div>

      <div class="ball">🔴</div>
    </div>

    <!-- المضاعفات -->
    <div class="multipliers">
      <div
        v-for="(m, i) in multipliers"
        :key="i"
        class="mult"
      >
        x{{ m }}
      </div>
    </div>

    <div v-if="result" class="result">
      {{ result }}
    </div>
  </div>
</template>

<script>
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default {
  name: "PlinkoGame",

  data() {
    return {
      balance: 0,
      bet: null,
      playing: false,
      result: "",
      risk: "medium",

      // عدد الصفوف
      rowCount: 8,

      // ربح الجلسة
      sessionProfit: 0,

      multipliers: [],
    };
  },

  computed: {
    rows() {
      return Array.from({ length: this.rowCount }, (_, i) =>
        Array(i + 1).fill(0)
      );
    },

    // 🧠 نسبة الفوز الذكية
    winChance() {
      let base =
        this.risk === "low" ? 0.45 :
        this.risk === "medium" ? 0.32 : 0.18;

      base -= Math.max(this.sessionProfit, 0) * 0.03;
      if (base < 0.08) base = 0.08;

      return base;
    },
  },

  async created() {
    await this.loadBalance();
    this.buildMultipliers();
  },

  methods: {
    async loadBalance() {
      const user = auth.currentUser;
      if (!user) return;

      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        this.balance = Number(snap.data().balance || 0);
      }
    },

    buildMultipliers() {
      if (this.risk === "low") {
        this.multipliers = [0.5, 0.8, 1, 1.2, 1.5, 1.2, 1, 0.8, 0.5];
      } else if (this.risk === "medium") {
        this.multipliers = [0.3, 0.5, 0.8, 1, 1.5, 2, 1.5, 0.8, 0.3];
      } else {
        this.multipliers = [0.2, 0.3, 0.5, 1, 3, 5, 3, 0.5, 0.2];
      }
    },

    async startGame() {
      this.result = "";

      if (!this.bet || this.bet <= 0) {
        this.result = "⚠️ أدخل مبلغ صحيح";
        return;
      }

      if (this.bet > this.balance) {
        this.result = "❌ الرصيد غير كافي";
        return;
      }

      const user = auth.currentUser;
      if (!user) return;

      this.balance -= this.bet;
      await updateDoc(doc(db, "users", user.uid), {
        balance: this.balance,
      });

      this.buildMultipliers();
      this.playing = true;

      setTimeout(this.finishGame, 1500);
    },

    async finishGame() {
      const roll = Math.random();

      let index;
      if (roll < this.winChance) {
        index = Math.floor(this.multipliers.length / 2);
      } else {
        index = Math.floor(Math.random() * this.multipliers.length);
      }

      const multiplier = this.multipliers[index];
      const win = this.bet * multiplier;

      this.sessionProfit += win - this.bet;
      this.balance += win;

      const user = auth.currentUser;
      await updateDoc(doc(db, "users", user.uid), {
        balance: this.balance,
      });

      this.result =
        win > this.bet
          ? `🎉 ربحت ${win.toFixed(2)} USDT`
          : `💥 خسرت ${this.bet.toFixed(2)} USDT`;

      this.playing = false;
      this.bet = null;
    },
  },
};
</script>

<style scoped>
.plinko-page {
  direction: rtl;
  min-height: 100vh;
  background: radial-gradient(circle, #1a2a3a, #0b1320);
  color: #fff;
  padding: 20px;
  text-align: center;
}

.title { font-size: 26px; margin-bottom: 10px; }
.balance { font-weight: bold; margin-bottom: 15px; }

.controls-box input,
.controls-box select {
  width: 80%;
  padding: 10px;
  border-radius: 10px;
  margin-bottom: 10px;
  border: none;
}

.controls-box button {
  width: 80%;
  padding: 14px;
  border-radius: 14px;
  background: #00ff7f;
  border: none;
  font-weight: bold;
}

.board {
  margin: 20px 0;
}

.row {
  display: flex;
  justify-content: center;
}

.dot {
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  margin: 8px;
}

.ball {
  font-size: 28px;
  margin: 10px 0;
}

.multipliers {
  display: flex;
  justify-content: space-between;
}

.mult {
  width: 10%;
  background: #ff9800;
  border-radius: 8px;
  padding: 6px;
  font-size: 12px;
}

.result {
  margin-top: 20px;
  font-size: 20px;
  font-weight: bold;
}
</style>
