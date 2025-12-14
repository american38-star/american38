<template>
  <div class="vip-page">
    <div class="container">
      <h1 class="page-title">💎 مستويات VIP — Premium</h1>

      <div v-if="loading" class="center">
        <div class="spinner-lg"></div>
        <div class="loading-text">جارٍ تحميل حالة VIP...</div>
      </div>

      <div v-else>
        <!-- حالة المستخدم الحالية -->
        <div v-if="userVip" class="current-vip">
          <div class="current-left">
            <div class="badge">مفعل الآن</div>
            <div class="vip-name">VIP {{ userVip.level }}</div>
            <div class="vip-daily">ربح يومي: <strong>{{ userVip.daily }} USDT</strong></div>
            <div class="vip-remaining">⏰ المتبقي: {{ remainingText }}</div>
          </div>

          <div class="current-right">
            <button class="btn-ghost" @click="goToDetails">تفاصيل المستوى</button>
            <button class="btn-secondary" @click="cancelVip" :disabled="processing">
              إلغاء الاشتراك
            </button>
          </div>
        </div>

        <!-- قائمة المستويات -->
        <div class="list">
          <div
            class="card"
            v-for="plan in plans"
            :key="plan.level"
            :class="{ active: userVip && userVip.level === plan.level }"
          >
            <div class="card-left">
              <div class="icon-wrap">
                <div class="icon-placeholder">💎</div>
                <div class="level-badge">VIP {{ plan.level }}</div>
              </div>
            </div>

            <div class="card-body">
              <div class="card-title">{{ plan.name }}</div>

              <div class="meta-row">
                <div class="meta">
                  <div class="meta-label">💵 السعر</div>
                  <div class="meta-value">{{ plan.price }} USDT</div>
                </div>

                <div class="meta">
                  <div class="meta-label">💰 ربح يومي</div>
                  <div class="meta-value">{{ plan.daily }} USDT</div>
                </div>

                <div class="meta">
                  <div class="meta-label">⭐ مهام يومية</div>
                  <div class="meta-value">{{ plan.tasks }}</div>
                </div>
              </div>

              <div class="card-footer">
                <div class="total">إجمالي: {{ plan.total }} USDT</div>

                <div class="actions">
                  <button
                    class="btn-primary"
                    v-if="!isActivePlan(plan)"
                    @click="buyPlan(plan)"
                    :disabled="processing"
                  >
                    اشترِ الآن — {{ plan.price }} USDT
                  </button>

                  <button class="btn-disabled" v-else disabled>مفعل الآن</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="notes">
          <p>
            ملاحظة: عند الشراء يُخصم السعر ثم يُضاف ربح يومي أولي (purchase bonus).
            العدّ التنازلي **موحّد عالميًا** ويبدأ عند التوقيت النظامي اليومي المحدد (06:30 UTC).
            حينما تنتهي دورة VIP ستُمنح المكافأة لجميع المستخدمين في نفس الثانية.
          </p>
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
  collection,
  serverTimestamp,
  Timestamp,
  setDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default {
  name: "VIP",
  data() {
    return {
      loading: true,
      processing: false,
      userVip: null,
      remainingMs: 0,
      intervalId: null,

      // خطط VIP مع تقليل المدة إلى 21 ساعة (75600 ثانية بدلاً من 86400)
      plans: [
        { level: 1, name: "VIP 1", price: 12, tasks: 1, daily: 3, total: 1095, durationSeconds: 75600 },
        { level: 2, name: "VIP 2", price: 52, tasks: 1, daily: 13, total: 4745, durationSeconds: 75600 },
        { level: 3, name: "VIP 3", price: 100, tasks: 1, daily: 26, total: 9490, durationSeconds: 75600 },
        { level: 4, name: "VIP 4", price: 300, tasks: 1, daily: 82, total: 29930, durationSeconds: 75600 },
        { level: 5, name: "VIP 5", price: 500, tasks: 1, daily: 145, total: 52925, durationSeconds: 75600 },
        { level: 6, name: "VIP 6", price: 1500, tasks: 1, daily: 479, total: 174835, durationSeconds: 75600 },
        { level: 7, name: "VIP 7", price: 3000, tasks: 1, daily: 1078, total: 393470, durationSeconds: 75600 },
        { level: 8, name: "VIP 8", price: 5000, tasks: 1, daily: 2000, total: 730000, durationSeconds: 75600 },
        { level: 9, name: "VIP 9", price: 10000, tasks: 1, daily: 4546, total: 1659290, durationSeconds: 75600 },
        { level: 10, name: "VIP 10", price: 30000, tasks: 1, daily: 17699, total: 6460135, durationSeconds: 75600 },
        { level: 11, name: "VIP 11", price: 90000, tasks: 1, daily: 81818, total: 29863570, durationSeconds: 75600 },
      ],

      globalCycleHourUTC: 6,
      globalCycleMinuteUTC: 30,
    };
  },

  computed: {
    remainingText() {
      if (!this.userVip || !this.userVip.vipEnd) return "--:--:--";
      const ms = Math.max(0, this.remainingMs || 0);
      const sec = Math.floor(ms / 1000);
      const h = String(Math.floor(sec / 3600)).padStart(2, "0");
      const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
      const s = String(sec % 60).padStart(2, "0");
      return `${h}:${m}:${s}`;
    },
  },

  created() {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        this.loading = false;
        this.userVip = null;
        return;
      }
      await this.init();
    });
  },

  beforeUnmount() {
    if (this.intervalId) clearInterval(this.intervalId);
  },

  methods: {
    isActivePlan(plan) {
      return this.userVip && this.userVip.level === plan.level;
    },

    copyText(text) {
      try {
        navigator.clipboard.writeText(text);
        alert("تم النسخ");
      } catch {
        alert("فشل النسخ — انسخ يدويًا");
      }
    },

    getNextGlobalCycleFromMs(msRef) {
      const ref = msRef ? new Date(msRef) : new Date();
      const next = new Date(ref.getTime());
      next.setUTCHours(this.globalCycleHourUTC, this.globalCycleMinuteUTC, 0, 0);
      if (next.getTime() <= ref.getTime()) {
        next.setTime(next.getTime() + 24 * 3600 * 1000);
      }
      return next;
    },

    async init() {
      this.loading = true;
      this.userVip = null;
      try {
        const user = auth.currentUser;
        if (!user) {
          this.loading = false;
          return;
        }

        const vipDocRef = doc(db, "users", user.uid, "vip", "current");
        const vipSnap = await getDoc(vipDocRef);
        if (!vipSnap.exists()) {
          this.userVip = null;
          this.loading = false;
          return;
        }

        const data = vipSnap.data();
        this.userVip = {
          level: data.level || null,
          price: data.price || 0,
          daily: data.daily || 0,
          vipStart: data.vipStart || null,
          vipEnd: data.vipEnd || null,
          durationSeconds: data.durationSeconds || 75600,
          lastRewardAt: data.lastRewardAt || null,
        };

        await this.settleMissedCyclesIfAny(user.uid, vipDocRef);

        const vipSnap2 = await getDoc(vipDocRef);
        if (vipSnap2.exists()) {
          const d2 = vipSnap2.data();
          this.userVip = {
            level: d2.level || null,
            price: d2.price || 0,
            daily: d2.daily || 0,
            vipStart: d2.vipStart || null,
            vipEnd: d2.vipEnd || null,
            durationSeconds: d2.durationSeconds || 75600,
            lastRewardAt: d2.lastRewardAt || null,
          };
        }

        this.startTimer();
      } catch (err) {
        console.error("VIP init error:", err);
        this.userVip = null;
      } finally {
        this.loading = false;
      }
    },

    async settleMissedCyclesIfAny(uid, vipDocRef) {
      try {
        await runTransaction(db, async (tx) => {
          const vipSnap = await tx.get(vipDocRef);
          if (!vipSnap.exists()) return;

          const vipData = vipSnap.data();
          if (!vipData.vipEnd || !vipData.daily) return;

          const vipEndMs = vipData.vipEnd.toMillis ? vipData.vipEnd.toMillis() : vipData.vipEnd;
          const nowMs = Date.now();
          const durationMs = (vipData.durationSeconds || 75600) * 1000;

          if (nowMs <= vipEndMs) return;

          const diffMs = nowMs - vipEndMs;
          const extraCycles = Math.floor(diffMs / durationMs) + 1;
          const totalReward = Number(vipData.daily || 0) * extraCycles;

          const userRef = doc(db, "users", uid);
          const userSnap = await tx.get(userRef);
          const currentBal = userSnap.exists() ? Number(userSnap.data().balance || 0) : 0;
          tx.update(userRef, { balance: currentBal + totalReward });

          const newVipEnd = Timestamp.fromMillis(vipEndMs + extraCycles * durationMs);
          tx.update(vipDocRef, { vipEnd: newVipEnd, lastRewardAt: serverTimestamp() });

          const logsRef = collection(db, "vip_rewards");
          const logDocRef = doc(logsRef);
          tx.set(logDocRef, {
            uid,
            amount: totalReward,
            cycles: extraCycles,
            type: "missed_settlement",
            createdAt: serverTimestamp(),
          });
        });
      } catch (e) {
        console.error("settleMissedCycles error:", e);
      }
    },

    startTimer() {
      if (!this.userVip || !this.userVip.vipEnd) return;

      const vipEndMs = this.userVip.vipEnd.toMillis ? this.userVip.vipEnd.toMillis() : this.userVip.vipEnd;
      this.remainingMs = vipEndMs - Date.now();

      if (this.intervalId) clearInterval(this.intervalId);
      this.intervalId = setInterval(async () => {
        this.remainingMs -= 1000;
        if (this.remainingMs <= 0) {
          await this.onCycleComplete();
        }
      }, 1000);
    },

    async onCycleComplete() {
      if (this.processing) return;
      this.processing = true;
      const user = auth.currentUser;
      if (!user) {
        this.processing = false;
        return;
      }

      const vipDocRef = doc(db, "users", user.uid, "vip", "current");
      const userRef = doc(db, "users", user.uid);

      try {
        await runTransaction(db, async (tx) => {
          const vipSnap = await tx.get(vipDocRef);
          if (!vipSnap.exists()) return;

          const vipData = vipSnap.data();
          const daily = Number(vipData.daily || 0);
          const durationSeconds = Number(vipData.durationSeconds || 75600);
          const vipEndMs = vipData.vipEnd.toMillis ? vipData.vipEnd.toMillis() : vipData.vipEnd;
          const nowMs = Date.now();
          if (nowMs < vipEndMs) return;

          const userSnap = await tx.get(userRef);
          const curBal = userSnap.exists() ? Number(userSnap.data().balance || 0) : 0;
          tx.update(userRef, { balance: curBal + daily });

          const newVipEnd = Timestamp.fromMillis(vipEndMs + durationSeconds * 1000);
          tx.update(vipDocRef, { vipEnd: newVipEnd, lastRewardAt: serverTimestamp() });

          const logsRef = collection(db, "vip_rewards");
          const logDocRef = doc(logsRef);
          tx.set(logDocRef, {
            uid: user.uid,
            amount: daily,
            type: "daily",
            createdAt: serverTimestamp(),
            level: vipData.level || null,
          });
        });

        await this.init();
      } catch (e) {
        console.error("onCycleComplete error:", e);
      } finally {
        this.processing = false;
      }
    },

    async buyPlan(plan) {
      const user = auth.currentUser;
      if (!user) return alert("يرجى تسجيل الدخول أولًا.");
      if (this.processing) return;

      this.processing = true;
      try {
        const userRef = doc(db, "users", user.uid);
        const vipDocRef = doc(db, "users", user.uid, "vip", "current");
        const purchasesRef = collection(db, "vip_purchases");
        const rewardsRef = collection(db, "vip_rewards");

        await runTransaction(db, async (tx) => {
          const uSnap = await tx.get(userRef);
          if (!uSnap.exists()) throw new Error("لم يتم العثور على حساب المستخدم.");

          const balance = Number(uSnap.data().balance || 0);
          if (balance < plan.price) throw new Error("رصيد غير كافٍ لشراء هذا المستوى.");

          const newBalance = balance - plan.price + plan.daily;
          tx.update(userRef, { balance: newBalance });

          const nowMs = Date.now();
          const nextGlobalDate = this.getNextGlobalCycleFromMs(nowMs);
          const vipEndTs = Timestamp.fromDate(nextGlobalDate);

          tx.set(vipDocRef, {
            level: plan.level,
            price: plan.price,
            daily: plan.daily,
            durationSeconds: plan.durationSeconds || 75600,
            vipStart: Timestamp.fromMillis(nowMs),
            vipEnd: vipEndTs,
            lastRewardAt: serverTimestamp(),
            purchasedAt: serverTimestamp(),
          });

          const pDocRef = doc(purchasesRef);
          tx.set(pDocRef, {
            uid: user.uid,
            planId: plan.level,
            level: plan.level,
            price: plan.price,
            daily: plan.daily,
            createdAt: serverTimestamp(),
            type: "purchase",
          });

          const rDocRef = doc(rewardsRef);
          tx.set(rDocRef, {
            uid: user.uid,
            amount: plan.daily,
            type: "purchase_bonus",
            createdAt: serverTimestamp(),
            level: plan.level,
          });
        });

        await this.init();
        alert("✔ تم شراء VIP بنجاح. أُضيف الربح الأولي إلى رصيدك.");
      } catch (err) {
        console.error("buyPlan error:", err);
        alert(err.message || "فشل شراء المستوى. تأكد من الرصيد وحاول لاحقًا.");
      } finally {
        this.processing = false;
      }
    },

    async cancelVip() {
      if (!confirm("هل أنت متأكد أنك تريد إلغاء حالة VIP؟ (لن يتم رد الأموال)")) return;
      const user = auth.currentUser;
      if (!user) return;
      this.processing = true;
      try {
        const vipDocRef = doc(db, "users", user.uid, "vip", "current");
        await setDoc(vipDocRef, { cancelledAt: serverTimestamp(), level: null }, { merge: true });
        await this.init();
        alert("تم إلغاء حالة VIP محليًا. ملاحظة: لا توجد استرجاعات تلقائية.");
      } catch (e) {
        console.error("cancelVip", e);
        alert("خطأ أثناء الإلغاء.");
      } finally {
        this.processing = false;
      }
    },

    goToDetails() {
      this.$router.push("/vip");
    },
  },
};
</script>

<style scoped>
/* Page layout */
.vip-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f3f8ff 0%, #ffffff 100%);
  padding: 18px;
  direction: rtl;
  color: #123;
  font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
}
.container {
  max-width: 920px;
  margin: 0 auto;
}
/* Title */
.page-title {
  text-align: center;
  font-size: 26px;
  font-weight: 800;
  color: #0b5cff;
  margin-bottom: 18px;
  text-shadow: 0 6px 20px rgba(11,92,255,0.08);
}
/* Loading */
.center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 0;
}
.spinner-lg {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 6px solid rgba(0,0,0,0.06);
  border-top-color: #0b5cff;
  animation: spin 0.8s linear infinite;
}
.loading-text {
  color: #666;
  font-weight: 600;
}
/* Current VIP card */
.current-vip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #fffaf6, #f6fbff);
  border: 1px solid rgba(11,92,255,0.06);
  padding: 14px;
  border-radius: 12px;
  margin-bottom: 18px;
  box-shadow: 0 6px 18px rgba(11,92,255,0.06);
}
.current-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.badge {
  display: inline-block;
  background: linear-gradient(90deg, #ffd27a, #ffb347);
  color: #3a2a00;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 13px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}
.vip-name {
  font-weight: 900;
  font-size: 20px;
  color: #222;
}
.vip-daily {
  color: #0b5cff;
  font-weight: 700;
}
.vip-remaining {
  color: #d30b0b;
  font-weight: 700;
}
.current-right {
  display: flex;
  gap: 10px;
  align-items: center;
}
/* list */
.list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 14px;
}
/* card */
.card {
  display: flex;
  gap: 16px;
  align-items: center;
  background: linear-gradient(180deg, #ffffff, #fbfdff);
  border-radius: 12px;
  padding: 12px;
  border: 1px solid rgba(11,92,255,0.04);
  transition: transform .16s ease, box-shadow .16s ease;
  box-shadow: 0 6px 18px rgba(9,30,66,0.03);
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 40px rgba(9,30,66,0.06);
}
.card.active {
  outline: 3px solid rgba(11,92,255,0.08);
}
.card-left {
  width: 110px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.icon-wrap {
  position: relative;
  width: 86px;
  height: 86px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.icon-placeholder {
  width: 86px;
  height: 86px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 40px;
  object-fit: contain;
  border-radius: 12px;
  background: linear-gradient(180deg, #fff, #f5fbff);
  box-shadow: 0 8px 22px rgba(11,92,255,0.06);
}
.level-badge {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(90deg, #ffd27a, #ffb347);
  color: #3a2a00;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 12px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.06);
}
.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.card-title {
  font-weight: 800;
  font-size: 18px;
  color: #123;
}
.meta-row {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}
.meta {
  min-width: 120px;
  background: rgba(13,86,255,0.03);
  padding: 8px 10px;
  border-radius: 8px;
  text-align: center;
}
.meta-label {
  font-size: 13px;
  color: #666;
}
.meta-value {
  font-weight: 800;
  color: #0b5cff;
  margin-top: 4px;
}
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}
.total {
  color: #444;
  font-weight: 700;
}
.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.btn-primary {
  background: linear-gradient(90deg, #0066ff, #00c6ff);
  color: white;
  padding: 10px 14px;
  border-radius: 10px;
  border: none;
  font-weight: 800;
  cursor: pointer;
}
.btn-disabled {
  background: #888;
  color: white;
  padding: 8px 12px;
  border-radius: 10px;
  font-weight: 700;
}
.btn-secondary {
  background: white;
  color: #0b5cff;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(11,92,255,0.12);
  cursor: pointer;
}
.btn-ghost {
  background: rgba(11,92,255,0.06);
  color: #0b5cff;
  padding: 8px 12px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
}
.notes {
  margin-top: 16px;
  color: #666;
  font-size: 13px;
  text-align: center;
}
@media (max-width: 680px) {
  .card { flex-direction: row; gap: 10px; }
  .meta-row { gap: 8px; }
  .card-left { width: 86px; }
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
