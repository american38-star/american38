<template>
  <div class="game-page">

    <h2 class="title">🐔 Chicken Road</h2>
    <p class="sub">
      كل خطوة مخاطرة… القرار بيدك 🔥
    </p>

    <div class="balance">
      رصيدك: {{ balance.toFixed(2) }} USDT
    </div>

    <!-- إدخال الرهان -->
    <div v-if="!started" class="bet-box">
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

      // ستأتي من Firestore
      steps: [],
    };
  },

  computed: {
    currentProfit() {
      if (!this.started || !this.steps.length) return 0;
      return this.bet * this.steps[this.position].multiplier;
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
      const snap = await getDoc(doc(db, "settings", "chickenRoad"));
      if (snap.exists()) {
        this.steps = snap.data().steps || [];
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

      this.started = true;
      this.position = 0;
    },

    goNext() {
      const step = this.steps[this.position];
      const roll = Math.random();

      // خسارة
      if (roll > step.winChance) {
        this.result = "💥 خسرت! الحظ لم يكن معك";
        this.started = false;
        this.bet = null;
        return;
      }

      // تقدم
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

<style scoped>
.game-page {
  direction: rtl;
  padding: 20px;
  min-height: 100vh;
  background: #111;
  color: #fff;
  text-align: center;
}

.title { font-size: 24px; }
.sub { color: #bbb; margin-bottom: 12px; }
.balance { font-weight: bold; margin-bottom: 15px; }

.bet-box input {
  width: 80%;
  padding: 10px;
  border-radius: 10px;
  margin-bottom: 10px;
  border: none;
}

.bet-box button {
  width: 80%;
  padding: 12px;
  border-radius: 12px;
  background: #0d6efd;
  color: white;
  border: none;
}

.road {
  display: flex;
  justify-content: space-between;
  margin: 20px 0;
}

.step {
  width: 15%;
  background: #333;
  border-radius: 12px;
  padding: 10px;
}

.step.active { background: #0d6efd; }
.multiplier { font-weight: bold; }
.chicken { font-size: 26px; margin-top: 5px; }

.controls button {
  width: 45%;
  padding: 12px;
  border-radius: 12px;
  margin: 5px;
  border: none;
}

.forward { background: #28a745; color: white; }
.cashout { background: #ffc107; color: black; }

.result {
  margin-top: 20px;
  font-size: 20px;
  font-weight: bold;
}
</style>
