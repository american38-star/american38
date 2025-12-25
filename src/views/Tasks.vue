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
    <div v-if="game==='plinko'" class="card">    
    
      <h2>🔴 Plinko</h2>    
    
      <!-- اللوحة والمضاعفات في الأعلى -->    
      <div class="plinko-container">    
        <!-- اللوحة -->    
        <div class="plinko-board">    
          <div    
            v-for="(row,r) in rows"    
            :key="r"    
            class="row"    
          >    
            <span v-for="n in row" :key="n" class="dot"></span>    
          </div>    
        </div>    
    
        <!-- المضاعفات تحت آخر صف نقاط مباشرة -->    
        <div class="multipliers-row">    
          <div class="multiplier-item">x29</div>    
          <div class="multiplier-item">x4</div>    
          <div class="multiplier-item">x1.5</div>    
          <div class="multiplier-item">x0.3</div>    
          <div class="multiplier-item">x0.2</div>    
          <div class="multiplier-item">x0.3</div>    
          <div class="multiplier-item">x1.5</div>    
          <div class="multiplier-item">x4</div>    
          <div class="multiplier-item">x29</div>    
        </div>    
    
        <div    
          v-if="ball.active"    
          class="ball"    
          :style="{ top: ball.y+'px', left: ball.x+'px' }"    
        ></div>    
      </div>    
    
      <!-- حقل الرهان وزر ابدأ الآن في الأسفل -->    
      <div class="plinko-bet-controls">    
        <div class="bet-input-group">    
          <input 
            type="number" 
            v-model.number="plinkoBet" 
            placeholder="USDT" 
            class="small-input" 
          />    
          <button 
            :disabled="ball.active" 
            @click="startPlinko"
            class="start-button"
          >  
            ابدأ الآن  
          </button>    
        </div>    
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
      plinkoBet: null,    
      rows: [3,4,5,6,7,8,9,10],    
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
    
    /* ===== Chicken Road ===== */    
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
      if (!this.plinkoBet || this.plinkoBet <= 0 || this.plinkoBet > this.balance)    
        return;    
    
      this.balance -= this.plinkoBet;    
      await updateDoc(doc(db, "users", auth.currentUser.uid), {    
        balance: this.balance,    
      });    
    
      this.ball = { x: 150, y: 0, active: true };    
      this.dropBall();    
    },    
    
    dropBall() {    
      const interval = setInterval(async () => {    
        this.ball.y += 10;    
        this.ball.x += Math.random() > 0.5 ? 12 : -12;    
    
        if (this.ball.y >= 260) {    
          clearInterval(interval);    
          this.ball.active = false;    
    
          const index = Math.floor(Math.random() * this.plinkoMultipliers.length);    
          const multiplier = this.plinkoMultipliers[index];    
          const win = this.plinkoBet * multiplier;    
    
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
    
.road {    
  display: flex;    
  justify-content: space-between;    
  margin: 15px 0;    
}    
    
.step {    
  width: 13%;    
  background: #1e293b;    
  border-radius: 10px;    
  padding: 6px;    
  font-size: 13px;    
}    
    
.step.active {    
  background: #22c55e;    
  color: black;    
}    
    
.plinko-container {    
  position: relative;    
  margin: 15px auto 15px auto;    
}    
    
.plinko-board {    
  position: relative;    
  height: 290px;    
}    
    
.row {    
  display: flex;    
  justify-content: center;    
  margin: 7px 0;    
}    
    
.dot {    
  width: 9px;    
  height: 9px;    
  background: white;    
  border-radius: 50%;    
  margin: 9px 10px;    
}    
    
.ball {    
  position: absolute;    
  width: 14px;    
  height: 14px;    
  background: #ff2d55;    
  border-radius: 50%;    
  top: 0;    
  left: 50%;    
  transform: translateX(-50%);    
  z-index: 10;    
}    
    
.multipliers-row {    
  display: flex;    
  justify-content: center;    
  align-items: center;    
  margin-top: -8px;    
  padding-top: 0;    
  gap: 0.8px;    
}    
    
.multiplier-item {    
  padding: 1px 2px;    
  border-radius: 2px;    
  font-weight: bold;    
  font-size: 9px;    
  min-width: 23px;    
  text-align: center;    
  line-height: 1;    
  height: 15px;    
  display: flex;    
  align-items: center;    
  justify-content: center;    
}    
    
.multipliers-row .multiplier-item:nth-child(1),    
.multipliers-row .multiplier-item:nth-child(9) {    
  background: #dc2626; /* أحمر */    
}    
    
.multipliers-row .multiplier-item:nth-child(2),    
.multipliers-row .multiplier-item:nth-child(8) {    
  background: #22c55e; /* أخضر */    
  color: black;    
}    
    
.multipliers-row .multiplier-item:nth-child(3),    
.multipliers-row .multiplier-item:nth-child(7) {    
  background: #22c55e; /* أخضر */    
  color: black;    
}    
    
.multipliers-row .multiplier-item:nth-child(4),    
.multipliers-row .multiplier-item:nth-child(6) {    
  background: #facc15; /* أصفر */    
  color: black;    
}    
    
.multipliers-row .multiplier-item:nth-child(5) {    
  background: #facc15; /* أصفر */    
  color: black;    
}    
    
/* عناصر التحكم في الرهان */    
.plinko-bet-controls {    
  margin-top: 20px;    
  padding-top: 15px;    
  border-top: 1px solid #1e293b;    
}    
    
.bet-input-group {    
  display: flex;    
  justify-content: center;    
  gap: 10px;    
  align-items: center;    
}    
    
.small-input {    
  width: 100px;    
  padding: 8px 12px;    
  border-radius: 20px;    
  background: #1e293b;    
  color: white;    
  border: 1px solid #374151;    
  font-size: 14px;    
  text-align: center;    
}    
    
.small-input::placeholder {    
  color: #94a3b8;    
}    
    
.start-button {    
  padding: 8px 20px;    
  border-radius: 20px;    
  background: linear-gradient(135deg, #22c55e, #16a34a);    
  color: black;    
  border: none;    
  font-weight: bold;    
  font-size: 14px;    
  cursor: pointer;    
  transition: all 0.2s;    
}    
    
.start-button:disabled {    
  background: #4b5563;    
  color: #9ca3af;    
  cursor: not-allowed;    
}    
    
.start-button:not(:disabled):hover {    
  background: linear-gradient(135deg, #16a34a, #15803d);    
  transform: scale(1.05);    
}    
    
.result {    
  margin-top: 15px;    
  font-size: 18px;    
  font-weight: bold;    
}    
</style>
