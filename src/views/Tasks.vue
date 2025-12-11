<template>
  <div class="tasks-page">

    <!-- العنوان -->
    <h2 class="title">المهمات اليومية</h2>
    <p class="sub">يتم إعادة ضبط العد التنازلي يوميًا الساعة 00:00 وتوزيع أرباح VIP تلقائيًا</p>

    <!-- المؤقت -->
    <div class="timer-box">
      <div class="timer-title">إعادة التعيين اليومي</div>
      <div class="timer-value">{{ timerText }}</div>

      <div class="stats-row">
        <div class="stat">
          <div class="label">المهام المتبقية</div>
          <div class="value">{{ tasksRemaining }}</div>
        </div>

        <div class="stat">
          <div class="label">جميع المهام</div>
          <div class="value">{{ tasksTotal }}</div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp
} from "firebase/firestore";

export default {
  name: "Tasks",

  data() {
    return {
      // العد التنازلي اليومي المشترك لجميع الحسابات
      timerMs: 0,
      timerInterval: null,

      // مهام ثابتة الآن (0)
      tasksTotal: 0,
      tasksRemaining: 0,
    };
  },

  computed: {
    timerText() {
      if (this.timerMs <= 0) return "00:00:00";

      const sec = Math.floor(this.timerMs / 1000);
      const h = String(Math.floor(sec / 3600)).padStart(2, "0");
      const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
      const s = String(sec % 60).padStart(2, "0");
      return `${h}:${m}:${s}`;
    },
  },

  async created() {
    this.startDailyTimer();
  },

  beforeUnmount() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  },

  methods: {
    // المؤقت اليومي الموحد
    startDailyTimer() {
      const now = new Date();
      const nextReset = new Date();
      nextReset.setHours(24, 0, 0, 0); // الساعة 00:00

      this.timerMs = nextReset - now;

      if (this.timerInterval) clearInterval(this.timerInterval);

      this.timerInterval = setInterval(async () => {
        this.timerMs -= 1000;

        // عند انتهاء المؤقت
        if (this.timerMs <= 0) {
          this.timerMs = 0;

          // توزيع أرباح VIP
          await this.giveVipDailyReward();

          // إعادة تشغيل المؤقت لليوم التالي
          this.startDailyTimer();
        }
      }, 1000);
    },

    // إضافة ربح VIP عند انتهاء الوقت
    async giveVipDailyReward() {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const vipRef = doc(db, "users", user.uid, "vip", "current");
        const vipSnap = await getDoc(vipRef);

        // إذا لا يوجد VIP
        if (!vipSnap.exists()) return;

        const vip = vipSnap.data();
        const daily = Number(vip.daily || 0);

        if (daily <= 0) return;

        // إضافة الربح
        const userRef = doc(db, "users", user.uid);

        await runTransaction(db, async (tx) => {
          const uSnap = await tx.get(userRef);
          const currentBalance = uSnap.exists()
            ? Number(uSnap.data().balance || 0)
            : 0;

          // إضافة الربح اليومي
          tx.update(userRef, {
            balance: currentBalance + daily,
          });

          // تحديث آخر وقت مكافأة
          tx.update(vipRef, {
            lastRewardAt: serverTimestamp(),
          });
        });

        console.log("✔ تمت إضافة ربح VIP اليومي تلقائيًا");
      } catch (err) {
        console.error("Daily VIP Reward Error:", err);
      }
    },
  },
};
</script>

<style scoped>
.tasks-page {
  direction: rtl;
  padding: 16px;
  min-height: 100vh;
  background: linear-gradient(#0d6efd, #6bb4ff);
  color: #fff;
}

.title {
  text-align: center;
  font-size: 22px;
  margin-bottom: 6px;
  font-weight: bold;
}

.sub {
  text-align: center;
  color: #e8f0ff;
  margin-bottom: 20px;
}

/* صندوق المؤقت */
.timer-box {
  background: #ffffffcc;
  color: black;
  padding: 16px;
  border-radius: 20px;
  text-align: center;
  margin-bottom: 20px;
}

.timer-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
}

.timer-value {
  background: black;
  color: white;
  font-size: 22px;
  font-weight: bold;
  padding: 8px 0;
  border-radius: 12px;
  margin-bottom: 15px;
}

/* الاحصائيات */
.stats-row {
  display: flex;
  justify-content: space-between;
}

.stat {
  width: 48%;
  background: #e6f0ff;
  border-radius: 12px;
  padding: 10px;
}

.label {
  color: #444;
  font-size: 14px;
}

.value {
  font-size: 20px;
  font-weight: bold;
  margin-top: 4px;
}
</style>
