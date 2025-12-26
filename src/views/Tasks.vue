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
    
        <!-- عرض جميع الكرات النشطة -->
        <div 
          v-for="(ball, index) in activeBalls" 
          :key="index"
          class="ball" 
          :style="{ 
            top: ball.y + 'px', 
            left: ball.x + 'px',
            'background-color': ball.color
          }"
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
      // مصفوفة لتخزين جميع الكرات النشطة
      activeBalls: [],
      dropIntervals: {}, // لتخزين الـ intervals لكل كرة
      ballCounter: 0, // عداد لإنشاء IDs فريدة للكرات
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
      this.activeBalls = [];
      this.game = g;    
      this.errorMessage = "";    
      this.chickenErrorMessage = "";    
      
      // إيقاف جميع الـ intervals
      Object.values(this.dropIntervals).forEach(interval => {
        clearInterval(interval);
      });
      this.dropIntervals = {};
      this.ballCounter = 0;
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
    
      // إنشاء كرة جديدة
      const ballId = ++this.ballCounter;
      const colors = ['#ff2d55', '#ff9500', '#34c759', '#007aff', '#ff3b30', '#5ac8fa', '#ffcc00'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const newBall = {
        id: ballId,
        x: 150,
        y: 0,
        color: randomColor,
        multiplier: null,
        multiplierIndex: null,
        finalX: null,
        active: true
      };
      
      this.activeBalls.push(newBall);
      this.dropBall(ballId);
    },    
    
    dropBall(ballId) {    
      // البحث عن الكرة في المصفوفة
      const ballIndex = this.activeBalls.findIndex(b => b.id === ballId);
      if (ballIndex === -1) return;
      
      const ball = this.activeBalls[ballIndex];
      
      // حساب المضاعف النهائي
      const multiplierIndex = this.calculateFinalMultiplierIndex();    
      const multiplier = this.plinkoMultipliers[multiplierIndex];    
      
      // تحديث بيانات الكرة
      ball.multiplier = multiplier;
      ball.multiplierIndex = multiplierIndex;
      ball.finalX = this.getMultiplierPosition(multiplierIndex);
      
      // حركة الكرة
      let currentStep = 0;  
      const totalSteps = 40;  
      const startX = 150;  
      const startY = 0;  
      const finalY = 260;  
      const finalX = ball.finalX;
      
      // حفظ الـ interval
      this.dropIntervals[ballId] = setInterval(async () => {    
        currentStep++;  
        const progress = Math.min(currentStep / totalSteps, 1);  
        
        // تحديث موقع الكرة
        ball.y = startY + (finalY - startY) * progress;  
        
        // حركة X بثلاث مراحل  
        if (progress < 0.4) {  
          // مرحلة عشوائية  
          ball.x = startX + (Math.random() - 0.5) * 60;  
        } else if (progress < 0.8) {  
          // مرحلة توجيه  
          const phaseProgress = (progress - 0.4) / 0.4;  
          ball.x = startX + (finalX - startX) * phaseProgress * 0.5;  
        } else {  
          // مرحلة نهائية دقيقة  
          const finalProgress = (progress - 0.8) / 0.2;  
          ball.x = finalX - 10 + finalProgress * 10;  
        }  
        
        // تأمين الكرة ضمن الحدود  
        ball.x = Math.max(30, Math.min(370, ball.x));  
        
        // عند الوصول  
        if (progress >= 1) {  
          clearInterval(this.dropIntervals[ballId]);  
          delete this.dropIntervals[ballId];
          
          // ضبط الموضع النهائي بدقة  
          ball.x = finalX;  
          ball.y = finalY;  
          
          setTimeout(async () => {  
            ball.active = false;  
            
            const win = this.plinkoBet * multiplier;    
            this.balance += win;    
  
            await updateDoc(doc(db, "users", auth.currentUser.uid), {    
              balance: this.balance,    
            });    
  
            this.result = `🎯 ربحت ${win.toFixed(2)} USDT (x${multiplier})`;  
            
            // إزالة الكرة بعد 2 ثانية
            setTimeout(() => {
              const index = this.activeBalls.findIndex(b => b.id === ballId);
              if (index !== -1) {
                this.activeBalls.splice(index, 1);
              }
            }, 2000);
          }, 400);  
        }    
      }, 50);  
    },    
    
    // حساب المضاعف النهائي بناءً على الاحتمالات    
    calculateFinalMultiplierIndex() {    
      const random = Math.random();    
      
      if (random < 0.02) {  
        return Math.random() > 0.5 ? 0 : 8;  
      } else if (random < 0.07) {  
        return Math.random() > 0.5 ? 1 : 7;  
      } else if (random < 0.17) {  
        return Math.random() > 0.5 ? 2 : 6;  
      } else if (random < 0.47) {  
        return Math.random() > 0.5 ? 3 : 5;  
      } else {  
        return 4;  
      }    
    },    
    
    // الحصول على موضع المضاعف بدقة  
    getMultiplierPosition(index) {    
      // المواقع المحددة بناءً على العرض 420px - متقاربة جداً  
      const positions = [35, 77, 119, 161, 203, 245, 287, 329, 371];    
      return positions[index];    
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
  height: 320px; /* إرجاع الارتفاع الأصلي */    
}    
    
.row {    
  display: flex;    
  justify-content: center;    
  margin: 10px 0; /* إرجاع المسافة الأصلية */    
}    
    
.dot {    
  width: 9px; /* إرجاع الحجم الأصلي */    
  height: 9px;    
  background: white;    
  border-radius: 50%;    
  margin: 9px 10px; /* إرجاع المسافة الأصلية */    
}    
    
.ball {    
  position: absolute;    
  width: 14px; /* إرجاع الحجم الأصلي */    
  height: 14px;    
  background: #ff2d55;    
  border-radius: 50%;    
  top: 0;    
  left: 150px;    
  transform: translateX(-50%);    
  z-index: 10;    
  transition: left 0.05s linear, top 0.05s linear;    
}    
    
.multipliers-row {    
  display: flex;    
  justify-content: center;    
  align-items: center;    
  margin-top: 15px; /* نفس المسافة */    
  padding-top: 0;    
  gap: 1px; /* تقريب جداً من بعضها */    
}    
    
.multiplier-item {    
  padding: 1px 2px; /* تقليل الحشو */    
  border-radius: 2px;    
  font-weight: bold;    
  font-size: 9px; /* نفس حجم الخط */    
  min-width: 24px; /* نفس العرض */    
  text-align: center;    
  line-height: 1;    
  height: 15px; /* نفس الارتفاع */    
  display: flex;    
  align-items: center;    
  justify-content: center;    
}    
    
.multipliers-row .multiplier-item:nth-child(1),    
.multipliers-row .multiplier-item:nth-child(9) {    
  background: #dc2626;    
}    
    
.multipliers-row .multiplier-item:nth-child(2),    
.multipliers-row .multiplier-item:nth-child(8) {    
  background: #22c55e;    
  color: black;    
}    
    
.multipliers-row .multiplier-item:nth-child(3),    
.multipliers-row .multiplier-item:nth-child(7) {    
  background: #22c55e;    
  color: black;    
}    
    
.multipliers-row .multiplier-item:nth-child(4),    
.multipliers-row .multiplier-item:nth-child(6) {    
  background: #facc15;    
  color: black;    
}    
    
.multipliers-row .multiplier-item:nth-child(5) {    
  background: #facc15;    
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
