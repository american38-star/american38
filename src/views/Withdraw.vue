<template>
  <div class="withdraw-page">
    <h2 class="title">سحب الأرباح</h2>
    <p class="sub">قم بإدخال معلومات السحب الخاصة بك</p>

    <!-- رصيد المستخدم -->
    <div class="balance-box">
      <p>رصيدك الحالي:</p>
      <h2>{{ balance }} USDT</h2>
    </div>

    <!-- مبلغ السحب -->
    <div class="input-box">
      <label>المبلغ</label>
      <input type="number" v-model="amount" placeholder="أدخل المبلغ" />
    </div>

    <!-- الشبكة -->
    <div class="input-box">
      <label>اختر الشبكة</label>
      <select v-model="selectedNetwork">
        <option disabled value="">اختر الشبكة</option>
        <option v-for="net in networks" :key="net">{{ net }}</option>
      </select>
    </div>

    <!-- عنوان المحفظة -->
    <div class="input-box">
      <label>عنوان المحفظة</label>
      <input type="text" v-model="wallet" placeholder="USDT عنوان محفظتك" />
    </div>

    <!-- زر السحب -->
    <button class="submit-btn" @click="submitWithdraw">
      سحب الآن
    </button>
  </div>
</template>

<script>
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  runTransaction,
  collection,
  serverTimestamp
} from "firebase/firestore";

export default {
  name: "Withdraw",

  data() {
    return {
      balance: 0,
      amount: "",
      wallet: "",
      selectedNetwork: "",
      networks: ["TRC20", "ERC20", "BEP20"],
    };
  },

  async created() {
    await this.loadBalance();
  },

  methods: {
    async loadBalance() {
      const user = auth.currentUser;
      if (!user) return;

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        this.balance = snap.data().balance ?? 0;
      }
    },

    async submitWithdraw() {
      if (!this.amount || !this.wallet || !this.selectedNetwork) {
        alert("⚠️ يرجى تعبئة جميع الحقول");
        return;
      }

      if (this.amount <= 0) {
        alert("⚠️ المبلغ غير صالح");
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        alert("الرجاء تسجيل الدخول من جديد");
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const withdrawRef = collection(db, "withdraw_requests");

      try {
        await runTransaction(db, async (tx) => {
          const userSnap = await tx.get(userRef);
          if (!userSnap.exists()) throw new Error("User not found");

          const userData = userSnap.data();

          // 🔥 منع المحظور من السحب
          if (userData.blocked === true) {
            throw new Error("🚫 حسابك محظور من السحب!");
          }

          const currentBalance = Number(userData.balance || 0);
          const amountNum = Number(this.amount);

          if (amountNum > currentBalance) {
            throw new Error("⚠️ المبلغ أكبر من رصيدك!");
          }

          // 1️⃣ خصم الرصيد
          tx.update(userRef, {
            balance: currentBalance - amountNum
          });

          // 2️⃣ إضافة طلب السحب داخل withdrawal_requests
          const newReq = doc(withdrawRef);
          tx.set(newReq, {
            userId: user.uid,
            email: user.email, // ⭐ تم إضافة البريد هنا
            amount: amountNum,
            wallet: this.wallet,
            network: this.selectedNetwork,
            status: "pending",
            createdAt: serverTimestamp(),
            oldBalance: currentBalance
          });
        });

        alert("✅ تم إرسال طلب السحب وخصم الرصيد بنجاح");
        this.amount = "";
        this.wallet = "";
        this.selectedNetwork = "";

        this.$router.push("/home");

      } catch (e) {
        alert("خطأ: " + e.message);
      }
    },
  },
};
</script>

<style scoped>
.withdraw-page {
  direction: rtl;
  padding: 20px;
  background: #f3f7ff;
  min-height: 100vh;
}

.title {
  text-align: center;
  color: #0d6efd;
  font-size: 26px;
  margin-bottom: 5px;
}

.sub {
  text-align: center;
  color: #666;
  margin-bottom: 25px;
}

.balance-box {
  background: white;
  padding: 15px;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 2px 10px #0001;
  margin-bottom: 25px;
}

.balance-box h2 {
  color: #0d6efd;
}

.input-box {
  margin-bottom: 20px;
}

.input-box label {
  font-weight: bold;
  margin-bottom: 5px;
  display: block;
}

.input-box input,
.input-box select {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #ccc;
  font-size: 16px;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: #0d6efd;
  color: white;
  border: none;
  font-weight: bold;
  border-radius: 12px;
  font-size: 18px;
  margin-top: 10px;
}
</style>
