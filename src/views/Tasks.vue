<template>
  <div class="game-page">
    <h2 class="title">🐔 Chicken Road</h2>

    <div v-if="!gameEnabled" class="result">
      🚫 اللعبة متوقفة حالياً
    </div>

    <div v-else>
      <div class="balance">
        رصيدك: {{ balance.toFixed(2) }} USDT
      </div>

      <!-- الرهان -->
      <div v-if="!started" class="bet-box">
        <input type="number" v-model.number="bet" placeholder="أدخل مبلغ الرهان" />
        <button @click="startGame">ابدأ اللعب</button>
      </div>

      <!-- الطريق -->
      <div v-if="started" class="road">
        <div
          v-for="(m, i) in multipliers"
          :key="i"
          class="step"
          :class="{ active: i === position }"
        >
          <div>x{{ m }}</div>
          <div v-if="i === position">🐔</div>
        </div>
      </div>

      <!-- التحكم -->
      <div v-if="started" class="controls">
        <div class="profit">
          الربح الحالي: {{ currentProfit.toFixed(2) }} USDT
        </div>

        <button class="forward" @click="goNext">إلى الأمام</button>
        <button class="cashout" @click="cashOut" :disabled="position === 0">
          سحب
        </button>
      </div>

      <div v-if="result" class="result">{{ result }}</div>
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

      // من لوحة الإدارة
      multipliers: [],
      baseWinRate: 0.3,
      decreasePerLevel: 0.03,
      minWinRate: 0.05,
      gameEnabled: true,
    };
  },

  computed: {
    currentProfit() {
      if (!this.started) return 0;
      return this.bet * this.multipliers[this.position];
    },
  },

  async created() {
    await this.loadBalance();
    await this.loadGameSettings();
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
      const snap = await getDoc(doc(db, "settings", "game_settings"));
      if (!snap.exists()) return;

      const d = snap.data();
      this.multipliers = d.multipliers || [];
      this.baseWinRate = d.baseWinRate;
      this.decreasePerLevel = d.decreasePerLevel;
      this.minWinRate = d.minWinRate;
      this.gameEnabled = d.gameEnabled;
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

      this.started = true;
      this.position = 0;
    },

    goNext() {
      const level = this.position;
      let winChance =
        this.baseWinRate - level * this.decreasePerLevel;

      if (winChance < this.minWinRate) {
        winChance = this.minWinRate;
      }

      const roll = Math.random();

      if (roll > winChance) {
        this.result = "💥 خسرت!";
        this.started = false;
        this.bet = null;
        return;
      }

      if (this.position < this.multipliers.length - 1) {
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
