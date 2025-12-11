<template>
  <div class="team-page">
    <!-- حالة التحميل -->
    <div v-if="loading" class="loading-box">جاري تحميل بيانات الفريق...</div>

    <!-- حالة الخطأ -->
    <div v-if="error" class="error-box">
      حدث خطأ أثناء جلب بيانات الفريق:<br />
      <strong>{{ error }}</strong>
    </div>

    <!-- كود الدعوة -->
    <div class="invite-section" v-if="!loading && !error">
      <h2>فريقك</h2>

      <div class="ref-box">
        <label>كود الإحالة:</label>
        <div class="ref-code">{{ referralCode || "غير متوفر" }}</div>
        <button @click="copyText(referralCode)">نسخ</button>
      </div>

      <div class="ref-box">
        <label>رابط الدعوة:</label>
        <div class="ref-code">{{ inviteLink || "غير متوفر" }}</div>
        <button @click="copyText(inviteLink)">نسخ</button>
      </div>
    </div>

    <!-- إحصائيات الفريق -->
    <div class="team-stats-box" v-if="!loading && !error">
      <div class="stat-row">
        <div class="stat-item">
          <div class="stat-title">انسحاب الفريق</div>
          <div class="stat-value">${{ teamStats.withdraw }}</div>
        </div>

        <div class="stat-item">
          <div class="stat-title">إعادة شحن الفريق</div>
          <div class="stat-value">${{ teamStats.recharge }}</div>
        </div>

        <div class="stat-item">
          <div class="stat-title">حجم الفريق</div>
          <div class="stat-value">{{ teamStats.totalMembers }}</div>
        </div>
      </div>

      <div class="stat-row">
        <div class="stat-item">
          <div class="stat-title">الانسحاب الأول</div>
          <div class="stat-value">{{ teamStats.firstWithdraw }}</div>
        </div>

        <div class="stat-item">
          <div class="stat-title">الشحن لأول مرة</div>
          <div class="stat-value">{{ teamStats.firstRecharge }}</div>
        </div>

        <div class="stat-item">
          <div class="stat-title">فريق جديد</div>
          <div class="stat-value">{{ teamStats.newMembers }}</div>
        </div>
      </div>
    </div>

    <!-- المستويات -->
    <div class="levels-container" v-if="!loading && !error">
      <div class="level-card level1">
        <div class="lvl-header">مستوى 1</div>
        <div class="lvl-body">
          <div>عدد الإحالات: <strong>{{ stats.l1.count }}</strong></div>
          <div>العمولة: <strong>6%</strong></div>
          <div>الدخل: <strong>{{ stats.l1.earnings.toFixed(2) }} USDT</strong></div>
        </div>
      </div>

      <div class="level-card level2">
        <div class="lvl-header">مستوى 2</div>
        <div class="lvl-body">
          <div>عدد الإحالات: <strong>{{ stats.l2.count }}</strong></div>
          <div>العمولة: <strong>2%</strong></div>
          <div>الدخل: <strong>{{ stats.l2.earnings.toFixed(2) }} USDT</strong></div>
        </div>
      </div>

      <div class="level-card level3">
        <div class="lvl-header">مستوى 3</div>
        <div class="lvl-body">
          <div>عدد الإحالات: <strong>{{ stats.l3.count }}</strong></div>
          <div>العمولة: <strong>1%</strong></div>
          <div>الدخل: <strong>{{ stats.l3.earnings.toFixed(2) }} USDT</strong></div>
        </div>
      </div>
    </div>

    <button class="btn-back" @click="$router.push('/home')">عودة</button>
  </div>
</template>

<script>
/*
  Team.vue النهائي — تجنّب تكرار الشحن/السحب + تجاهل السجلات غير المعتمدة
  تأكد:
   - مجموعات Firestore لديك: users, recharge_logs, withdraw_logs, referral_rewards (أو غيرها إذا سميت مختلف)
   - إذا سميت الحقول داخل السجلات بشكل مختلف غيّر userIdFieldInLogs / txIdFieldInLogs
*/

import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default {
  name: "Team",
  data() {
    return {
      referralCode: "",
      inviteLink: "",
      loading: true,
      error: null,

      // عدّل هذه القيم حسب حقولك في السجلات
      userIdFieldInLogs: "userId", // الحقل داخل recharge_logs/withdraw_logs الذي يحتوي UID
      txIdFieldInLogs: "txid", // إن كنت تستخدم معرف عملية (TxID) لتجنّب التكرار

      teamStats: {
        withdraw: "0.00",
        recharge: "0.00",
        totalMembers: 0,
        newMembers: 0,
        firstRecharge: 0,
        firstWithdraw: 0,
      },

      stats: {
        l1: { count: 0, earnings: 0 },
        l2: { count: 0, earnings: 0 },
        l3: { count: 0, earnings: 0 },
      },
    };
  },

  created() {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        this.loading = false;
        return;
      }

      try {
        const uid = user.uid;
        // جلب بيانات المستخدم لإظهار referralCode
        const udoc = await getDoc(doc(db, "users", uid));
        if (udoc.exists()) {
          const data = udoc.data();
          this.referralCode = data.referralCode || uid.substring(0, 6);
          this.inviteLink = `${window.location.origin}/register?ref=${this.referralCode}`;
        } else {
          this.referralCode = uid.substring(0, 6);
          this.inviteLink = `${window.location.origin}/register?ref=${this.referralCode}`;
        }

        // تحميل المستويات والإحصائيات
        await this.loadTeamLevels(uid);
        await this.loadTeamStats(uid);
      } catch (err) {
        console.error("Team load error:", err);
        this.error = err.message || String(err);
      } finally {
        this.loading = false;
      }
    });
  },

  methods: {
    copyText(text) {
      if (!text) {
        alert("لا يوجد شيء للنسخ");
        return;
      }
      navigator.clipboard
        .writeText(text)
        .then(() => alert("تم النسخ"))
        .catch(() => alert("فشل النسخ — انسخ يدويًا"));
    },

    // تقسيم مصفوفة إلى chunks (Firestore 'in' limit)
    chunkArray(arr, size = 10) {
      const res = [];
      for (let i = 0; i < arr.length; i += size) {
        res.push(arr.slice(i, i + size));
      }
      return res;
    },

    // ========== مستويات الفريق ==========
    async loadTeamLevels(uid) {
      try {
        const usersRef = collection(db, "users");

        // L1
        const q1 = query(usersRef, where("invitedBy", "==", uid));
        const s1 = await getDocs(q1);
        const level1Ids = s1.docs.map((d) => d.id);
        this.stats.l1.count = level1Ids.length;

        // L2 (invitedBy in level1Ids) chunked
        let level2Ids = [];
        if (level1Ids.length) {
          const chunks = this.chunkArray(level1Ids, 10);
          for (const ch of chunks) {
            const q2 = query(usersRef, where("invitedBy", "in", ch));
            const s2 = await getDocs(q2);
            level2Ids = level2Ids.concat(s2.docs.map((d) => d.id));
          }
        }
        this.stats.l2.count = level2Ids.length;

        // L3 (invitedBy in level2Ids) chunked
        let level3Ids = [];
        if (level2Ids.length) {
          const chunks2 = this.chunkArray(level2Ids, 10);
          for (const ch of chunks2) {
            const q3 = query(usersRef, where("invitedBy", "in", ch));
            const s3 = await getDocs(q3);
            level3Ids = level3Ids.concat(s3.docs.map((d) => d.id));
          }
        }
        this.stats.l3.count = level3Ids.length;

        // إجمالي أعضاء فريدين
        const allIds = [...level1Ids, ...level2Ids, ...level3Ids];
        const uniqueIds = Array.from(new Set(allIds));
        this.teamStats.totalMembers = uniqueIds.length;

        // حساب أرباح الإحالة (إن وجدت)
        await this.loadReferralRewards(uid);
      } catch (err) {
        console.error("loadTeamLevels error:", err);
        throw err;
      }
    },

    async loadReferralRewards(uid) {
      try {
        const rewardsRef = collection(db, "referral_rewards");
        const calc = async (level) => {
          const q = query(rewardsRef, where("receiver", "==", uid), where("level", "==", level));
          const s = await getDocs(q);
          return s.docs.reduce((sum, d) => sum + Number(d.data().amount || 0), 0);
        };

        this.stats.l1.earnings = await calc(1);
        this.stats.l2.earnings = await calc(2);
        this.stats.l3.earnings = await calc(3);
      } catch (err) {
        console.warn("loadReferralRewards warning:", err);
        this.stats.l1.earnings = 0;
        this.stats.l2.earnings = 0;
        this.stats.l3.earnings = 0;
      }
    },

    // ========== تحميل إحصائيات الشحن/السحب مع تجنّب التكرار ==========
    async loadTeamStats(uid) {
      try {
        const usersRef = collection(db, "users");

        // أعضاء المستوى الأول
        const q1 = query(usersRef, where("invitedBy", "==", uid));
        const s1 = await getDocs(q1);
        const level1Members = s1.docs.map((d) => d.id);

        // level2
        let level2Members = [];
        if (level1Members.length) {
          for (const ch of this.chunkArray(level1Members, 10)) {
            const q2 = query(usersRef, where("invitedBy", "in", ch));
            const s2 = await getDocs(q2);
            level2Members = level2Members.concat(s2.docs.map((d) => d.id));
          }
        }

        // level3
        let level3Members = [];
        if (level2Members.length) {
          for (const ch of this.chunkArray(level2Members, 10)) {
            const q3 = query(usersRef, where("invitedBy", "in", ch));
            const s3 = await getDocs(q3);
            level3Members = level3Members.concat(s3.docs.map((d) => d.id));
          }
        }

        // أعضاء فريدون
        const all = [...level1Members, ...level2Members, ...level3Members];
        const membersUnique = Array.from(new Set(all));

        // newMembers = عدد مستوى 1 (اختياري)
        this.teamStats.newMembers = level1Members.length;

        // عدادات
        let withdrawSum = 0;
        let rechargeSum = 0;
        let firstWithdrawCount = 0;
        let firstRechargeCount = 0;

        // مجموعات لمنع العد المزدوج - نستخدم txid أو doc.id كفاصل فريد
        const seenRechargeTx = new Set();
        const seenWithdrawTx = new Set();

        const uidField = this.userIdFieldInLogs;
        const txField = this.txIdFieldInLogs;

        // لكل عضو فريد
        for (const memberId of membersUnique) {
          // ===== withdraw_logs =====
          const withdrawQ = query(collection(db, "withdraw_logs"), where(uidField, "==", memberId));
          const wSnap = await getDocs(withdrawQ);

          let memberHadWithdraw = false;
          wSnap.forEach((d) => {
            const data = d.data() || {};

            // تَأكُّد: فقط احسب السجلات المعتمدة (approved)
            // البعض يستخدم 'type' والبعض يستخدم 'status'، لذلك نفحص كلاهما إن وُجد
            if (data.type && String(data.type).toLowerCase() !== "approved") return;
            if (data.status && String(data.status).toLowerCase() !== "approved") return;

            const key = (data[txField] && String(data[txField])) || d.id;
            if (seenWithdrawTx.has(key)) return;
            seenWithdrawTx.add(key);

            const amt = Number(data.amount || 0);
            if (!isNaN(amt) && amt !== 0) {
              withdrawSum += amt;
              memberHadWithdraw = true;
            }
          });
          if (memberHadWithdraw) firstWithdrawCount++;

          // ===== recharge_logs =====
          const rechargeQ = query(collection(db, "recharge_logs"), where(uidField, "==", memberId));
          const rSnap = await getDocs(rechargeQ);

          let memberHadRecharge = false;
          rSnap.forEach((d) => {
            const data = d.data() || {};

            // فقط نحسب إذا السجل معتمد (approved)
            if (data.type && String(data.type).toLowerCase() !== "approved") return;
            if (data.status && String(data.status).toLowerCase() !== "approved") return;

            const key = (data[txField] && String(data[txField])) || d.id;
            if (seenRechargeTx.has(key)) return;
            seenRechargeTx.add(key);

            const amt = Number(data.amount || 0);
            if (!isNaN(amt) && amt !== 0) {
              rechargeSum += amt;
              memberHadRecharge = true;
            }
          });
          if (memberHadRecharge) firstRechargeCount++;
        }

        // النتائج النهائية
        this.teamStats.withdraw = parseFloat(withdrawSum || 0).toFixed(2);
        this.teamStats.recharge = parseFloat(rechargeSum || 0).toFixed(2);
        this.teamStats.firstWithdraw = firstWithdrawCount;
        this.teamStats.firstRecharge = firstRechargeCount;
        this.teamStats.totalMembers = membersUnique.length;
      } catch (err) {
        console.error("loadTeamStats error:", err);
        this.error = err.message || String(err);
      }
    },
  },
};
</script>

<style scoped>
/* نفس التنسيق السابق */
.team-page { direction: rtl; padding: 12px; background: #f0f5ff; min-height: 100vh; }
.invite-section { background: #fff; padding: 15px; border-radius: 12px; box-shadow: 0 4px 12px #0001; margin-bottom: 20px; text-align: center; }
.ref-box { display:flex; align-items:center; justify-content:center; margin:8px 0; }
.ref-code { background:#f1f1f1; padding:8px 12px; border-radius:8px; margin:0 8px; flex:1; word-break:break-all; }
.team-stats-box { background:#fff; padding:15px; border-radius:14px; box-shadow:0 4px 12px #0001; margin-bottom:20px; }
.stat-row { display:flex; justify-content:space-between; margin-bottom:12px; }
.stat-item { text-align:center; flex:1; }
.stat-title { color:#444; font-size:14px; margin-bottom:4px; }
.stat-value { font-size:16px; font-weight:bold; color:#000; }
.levels-container { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:12px; }
.level-card { border-radius:14px; color:white; padding:12px; min-height:160px; }
.level1 { background: linear-gradient(135deg,#ff5f6d,#ffc371); }
.level2 { background: linear-gradient(135deg,#42e695,#3bb2b8); }
.level3 { background: linear-gradient(135deg,#667eea,#764ba2); }
.btn-back { margin-top:24px; width:100%; padding:12px; border-radius:12px; border:2px solid #0d6efd; background:white; color:#0d6efd; font-size:17px; }
.loading-box, .error-box { background:white; margin:16px; padding:14px; border-radius:12px; text-align:center; box-shadow:0 4px 12px #0001; }
.error-box { color:#b00020; }
</style>
