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
    
      <!-- شكل الدجاج الكامل -->    
      <div class="chicken-container">    
        <div class="chicken">🐔</div>    
      </div>    
    
      <!-- الطريق مع المضاعفات -->    
      <div v-if="started" class="road">    
        <div    
          v-for="(step,i) in steps"    
          :key="i"    
          class="step"    
          :class="{active:i===position}"    
        >    
          x{{ step.multiplier.toFixed(2) }}    
          <div v-if="i===position" class="chicken-icon">🐔</div>    
        </div>    
      </div>    
    
      <!-- حقل الرهان وزر ابدأ الآن في الأسفل -->    
      <div class="chicken-bet-controls">    
        <div v-if="!started" class="bet-input-group">    
          <div class="input-wrapper">    
            <input 
              type="number" 
              v-model.number="bet" 
              placeholder="USDT" 
              class="small-input" 
              @input="clearChickenError"
            />    
            <div v-if="chickenErrorMessage" class="error-message">{{ chickenErrorMessage }}</div>    
          </div>    
          <button 
            @click="validateAndStartChicken"
            class="start-button"
          >  
            ابدأ الآن  
          </button>    
        </div>    
      </div>    
    
      <!-- عناصر التحكم أثناء اللعبة -->    
      <div v-if="started" class="controls">    
        <div class="profit">الربح: {{ currentProfit.toFixed(2) }} USDT</div>    
        <div class="action-buttons">    
          <button @click="goNext" class="action-btn">تقدم</button>    
          <button @click="cashOutChicken" class="action-btn">سحب</button>    
        </div>    
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
          <div class="multiplier-item" style="min-width: 25px;">x29</div>    
          <div class="multiplier-item">x4</div>    
          <div class="multiplier-item">x1.5</div>    
          <div class="multiplier-item">x0.3</div>    
          <div class="multiplier-item">x0.2</div>    
          <div class="multiplier-item">x0.3</div>    
          <div class="multiplier-item">x1.5</div>    
          <div class="multiplier-item">x4</div>    
          <div class="multiplier-item" style="min-width: 25px;">x29</div>    
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
          <div class="input-wrapper">    
            <input 
              type="number" 
              v-model.number="plinkoBet" 
              placeholder="USDT" 
              class="small-input" 
              @input="clearError"
            />    
            <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>    
          </div>    
          <button 
            @click="validateAndStart"
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
      errorMessage: "",    
      chickenErrorMessage: "",    
    
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
      // لتخزين المضاعف الذي وقعت عليه الكرة    
      finalMultiplier: null,    
      finalMultiplierIndex: null,    
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
      this.errorMessage = "";    
      this.chickenErrorMessage = "";    
      this.finalMultiplier = null;    
      this.finalMultiplierIndex = null;    
    },    
    
    /* ===== Chicken Road ===== */    
    validateAndStartChicken() {    
      if (!this.bet || this.bet <= 0) {    
        this.chickenErrorMessage = "ادخل مبلغ الرهان";    
        return;    
      }    
      
      if (this.bet > this.balance) {    
        this.chickenErrorMessage = "الرصيد غير كافي";    
        return;    
      }    
      
      this.chickenErrorMessage = "";    
      this.startChicken();    
    },    
    
    async startChicken() {    
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
    
    clearChickenError() {    
      this.chickenErrorMessage = "";    
    },    
    
    /* ===== Plinko ===== */    
    validateAndStart() {    
      if (!this.plinkoBet || this.plinkoBet <= 0) {    
        this.errorMessage = "ادخل مبلغ الرهان";    
        return;    
      }    
      
      if (this.plinkoBet > this.balance) {    
        this.errorMessage = "الرصيد غير كافي";    
        return;    
      }    
      
      this.errorMessage = "";    
      this.startPlinko();    
    },    
    
    async startPlinko() {    
      this.balance -= this.plinkoBet;    
      await updateDoc(doc(db, "users", auth.currentUser.uid), {    
        balance: this.balance,    
      });    
    
      this.ball = { x: 150, y: 0, active: true };    
      this.finalMultiplier = null;    
      this.finalMultiplierIndex = null;    
      this.result = "";    
      this.dropBall();    
    },    
    
    dropBall() {    
      // حساب المضاعف النهائي مسبقاً قبل تحريك الكرة    
      const multiplierIndex = this.calculateFinalMultiplierIndex();    
      const multiplier = this.plinkoMultipliers[multiplierIndex];    
      this.finalMultiplier = multiplier;    
      this.finalMultiplierIndex = multiplierIndex;    
      
      // إحداثيات X النهائية لكل مضاعف (بدقة أكثر)    
      const targetX = this.calculateExactTargetX(multiplierIndex);    
      
      // بدء حركة الكرة  
      const startX = 150; // مركز البداية  
      let currentStep = 0;  
      const totalSteps = 26; // عدد الخطوات للنزول  
      
      const interval = setInterval(async () => {    
        currentStep++;  
        this.ball.y = currentStep * 10; // نزول بمقدار 10px كل خطوة  
        
        // حساب التقدم في الحركة الأفقية نحو الهدف  
        const progress = currentStep / totalSteps;  
        const easeProgress = this.easeInOutCubic(progress);  
        
        // تحريك الكرة تدريجياً نحو الهدف النهائي  
        this.ball.x = startX + (targetX - startX) * easeProgress;  
    
        if (this.ball.y >= 260) {    
          clearInterval(interval);    
          this.ball.active = false;    
          
          // التأكد من أن الكرة في الموضع الصحيح  
          this.ball.x = targetX;  
          
          // حساب الربح بناءً على المضاعف المحدد مسبقاً    
          const win = this.plinkoBet * multiplier;    
          this.balance += win;    
    
          await updateDoc(doc(db, "users", auth.currentUser.uid), {    
            balance: this.balance,    
          });    
    
          this.result = `🎯 ربحت ${win.toFixed(2)} USDT (x${multiplier})`;    
        }    
      }, 40);    
    },    
    
    // حساب المضاعف النهائي بناءً على الاحتمالات    
    calculateFinalMultiplierIndex() {    
      const random = Math.random();    
      
      // احتمالات مرتبطة بمضاعفات Plinko النموذجية (مصححة)  
      if (random < 0.02) { // 2% فرصة للحصول على x29  
        return Math.random() > 0.5 ? 0 : 8;  
      } else if (random < 0.07) { // 5% فرصة للحصول على x4  
        return Math.random() > 0.5 ? 1 : 7;  
      } else if (random < 0.17) { // 10% فرصة للحصول على x1.5  
        return Math.random() > 0.5 ? 2 : 6;  
      } else if (random < 0.47) { // 30% فرصة للحصول على x0.3  
        return Math.random() > 0.5 ? 3 : 5;  
      } else { // 53% فرصة للحصول على x0.2  
        return 4;  
      }    
    },    
    
    // حساب موقع X النهائي بدقة  
    calculateExactTargetX(multiplierIndex) {    
      // إحداثيات X للمضاعفات من اليسار إلى اليمين (بدقة أكثر)  
      const multiplierPositions = [30, 75, 120, 165, 210, 255, 300, 345, 390];    
      return multiplierPositions[multiplierIndex];    
    },  
    
    // دالة لتسهيل الحركة (easing function)  
    easeInOutCubic(t) {  
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;  
    },    
    
    clearError() {    
      this.errorMessage = "";    
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
    
/* ============ Chicken Road Styles ============ */    
.chicken-container {    
  margin: 20px auto;    
  display: flex;    
  justify-content: center;    
  align-items: center;    
}    
    
.chicken {    
  font-size: 80px;    
  animation: bounce 2s infinite;    
}    
    
@keyframes bounce {    
  0%, 100% { transform: translateY(0); }    
  50% { transform: translateY(-10px); }    
}    
    
.road {    
  display: flex;    
  justify-content: space-between;    
  margin: 20px 0;    
  background: rgba(30, 41, 59, 0.5);    
  padding: 15px;    
  border-radius: 12px;    
}    
    
.step {    
  width: 13%;    
  background: #1e293b;    
  border-radius: 10px;    
  padding: 10px 0;    
  font-size: 14px;    
  position: relative;    
  min-height: 60px;    
  display: flex;    
  flex-direction: column;    
  justify-content: center;    
  align-items: center;    
}    
    
.step.active {    
  background: #22c55e;    
  color: black;    
  font-weight: bold;    
}    
    
.chicken-icon {    
  font-size: 24px;    
  margin-top: 5px;    
}    
    
.chicken-bet-controls {    
  margin-top: 20px;    
  padding-top: 15px;    
  border-top: 1px solid #1e293b;    
}    
    
.controls {    
  margin-top: 20px;    
  padding-top: 15px;    
  border-top: 1px solid #1e293b;    
}    
    
.profit {    
  font-size: 18px;    
  font-weight: bold;    
  color: #22c55e;    
  margin-bottom: 15px;    
}    
    
.action-buttons {    
  display: flex;    
  justify-content: center;    
  gap: 15px;    
}    
    
.action-btn {    
  padding: 10px 25px;    
  border-radius: 20px;    
  background: #1e293b;    
  color: white;    
  border: none;    
  font-weight: bold;    
  font-size: 14px;    
  cursor: pointer;    
  transition: all 0.2s;    
  min-width: 100px;    
}    
    
.action-btn:hover {    
  background: #22c55e;    
  color: black;    
  transform: scale(1.05);    
}    
    
/* ============ Plinko Styles ============ */    
.plinko-container {    
  position: relative;    
  margin: 15px auto 15px auto;    
}    
    
.plinko-board {    
  position: relative;    
  height: 285px;    
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
  margin-top: -12px;    
  padding-top: 0;    
  gap: 0.8px;    
}    
    
.multiplier-item {    
  padding: 1px 3px;    
  border-radius: 2px;    
  font-weight: bold;    
  font-size: 9px;    
  min-width: 24px;    
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
    
/* ============ Common Controls Styles ============ */    
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
    
.input-wrapper {    
  position: relative;    
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
    
.small-input:focus {    
  outline: none;    
  border-color: #22c55e;    
}    
    
.small-input::placeholder {    
  color: #94a3b8;    
}    
    
.error-message {    
  position: absolute;    
  top: 100%;    
  left: 50%;    
  transform: translateX(-50%);    
  color: #ef4444;    
  font-size: 11px;    
  margin-top: 4px;    
  white-space: nowrap;    
  background: rgba(220, 38, 38, 0.1);    
  padding: 2px 6px;    
  border-radius: 4px;    
  border: 1px solid #ef4444;    
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
    
.start-button:hover {    
  background: linear-gradient(135deg, #16a34a, #15803d);    
  transform: scale(1.05);    
}    
    
.result {    
  margin-top: 15px;    
  font-size: 18px;    
  font-weight: bold;    
}    
</style>
