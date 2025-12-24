<template>
  <div class="game-page">

    <h2 class="title">🐔 Chicken Road</h2>
    <p class="sub">
      كل خطوة مخاطرة… القرار بيدك 🔥
    </p>

    <div class="balance">
      رصيدك: {{ balance.toFixed(2) }} USDT
    </div>

    <!-- تحميل -->
    <div v-if="loading" class="result">
      ⏳ جاري تحميل اللعبة...
    </div>

    <!-- إدخال الرهان -->
    <div v-if="!started && !loading" class="bet-box">
      <input
        type="number"
        v-model.number="bet"
        placeholder="أدخل مبلغ USDT"
      />
      <button @click="startGame">
        ابدأ اللعب
      </button>
    </div>

    <!-- الطريق -->
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

      <button
        class="cashout"
        @click="cashOut"
        :disabled="position === 0"
      >
        سحب الأرباح
      </button>
    </div>

    <!-- الرسائل -->
    <div v-if="result" class="result">
      {{ result }}
    </div>

  </div>
</template>

<script>
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default {
  name: "ChickenRoad",

  data() {
    return {
      balance: 0,
      bet: null,
      started: false,
      position: 0,
      result: "",
      steps: [],
      loading: true,

      // إعدادات
      baseWinRate: 0.35,
      decreasePerLevel: 0.03,
      minWinRate: 0.05,
      gameEnabled: true,
    };
  },

  computed: {
    currentProfit() {
      if (!this.started || !this.steps[this.position]) return 0;
      return this.bet * this.steps[this.position].multiplier;
    },
  },

  async created() {
    await this.loadBalance();
    await this.loadGameSettings();
    this.loading = false;
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

    async loadGameSettings() {
      const snap = await getDoc(doc(db, "game_settings", "main"));
      if (!snap.exists()) return;

      const data = snap.data();

      this.baseWinRate = data.baseWinRate;
      this.decreasePerLevel = data.decreasePerLevel;
      this.minWinRate = data.minWinRate;
      this.gameEnabled = data.gameEnabled;

      this.steps = data.multipliers.map((m, i) => {
        const chance = Math.max(
          this.baseWinRate - i * this.decreasePerLevel,
          this.minWinRate
        );
        return {
          multiplier: m,
          winChance: chance,
        };
      });
    },

    async startGame() {
      this.result = "";

      if (!this.gameEnabled) {
        this.result = "🚫 اللعبة متوقفة حالياً";
        return;
      }

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

      this.started = true;
      this.position = 0;
    },

    goNext() {
      const step = this.steps[this.position];
      if (!step) return;

      const roll = Math.random();

      if (roll > step.winChance) {
        this.result = "💥 خسرت!";
        this.started = false;
        this.bet = null;
        return;
      }

      if (this.position < this.steps.length - 1) {
        this.position++;
      } else {
        this.cashOut();
      }
    },

    async cashOut() {
      const user = auth.currentUser;
      if (!user) return;

      const profit = this.currentProfit;
      this.balance += profit;

      await updateDoc(doc(db, "users", user.uid), {
        balance: this.balance,
      });

      this.result = `🎉 ربحت ${profit.toFixed(2)} USDT`;
      this.started = false;
      this.bet = null;
    },
  },
};
</script>
