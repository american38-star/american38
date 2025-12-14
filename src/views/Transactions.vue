<template>
  <div class="transactions-wrapper">
    <h2 class="title">المعاملات</h2>

    <div v-if="loading" class="loading">جاري التحميل...</div>

    <div v-else>
      <div v-if="transactions.length === 0" class="empty">
        لا توجد معاملات
      </div>

      <div
        v-for="tx in transactions"
        :key="tx.id"
        class="tx-card"
      >
        <div class="row">
          <span class="label">النوع</span>
          <span class="value">{{ typeLabel(tx.type) }}</span>
        </div>

        <div class="row">
          <span class="label">المبلغ</span>
          <span class="value">{{ tx.amount }} USDT</span>
        </div>

        <div class="row">
          <span class="label">الحالة</span>
          <span :class="['status', tx.status]">
            {{ statusLabel(tx.status) }}
          </span>
        </div>

        <div class="row">
          <span class="label">التاريخ</span>
          <span class="value">{{ formatDate(tx.createdAt) }}</span>
        </div>

        <div
          v-if="tx.status === 'rejected' && tx.reason"
          class="reject-box"
        >
          <strong>سبب الرفض:</strong>
          <div>{{ tx.reason }}</div>
        </div>

        <div
          v-if="tx.adminMessage"
          class="admin-box"
        >
          <strong>رسالة الإدارة:</strong>
          <div>{{ tx.adminMessage }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default {
  name: "Transactions",

  data() {
    return {
      loading: true,
      transactions: [],
    };
  },

  created() {
    this.loadTransactions();
  },

  methods: {
    async loadTransactions() {
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          this.loading = false;
          return;
        }

        try {
          console.log("🔍 جاري تحميل معاملات المستخدم:", {
            uid: user.uid,
            email: user.email
          });

          let allTransactions = [];

          // البحث باستخدام userId فقط (تجنب استخدام email)
          try {
            const q1 = query(
              collection(db, "transactions"),
              where("userId", "==", user.uid),
              orderBy("createdAt", "desc")
            );
            const snap1 = await getDocs(q1);
            const transactionsByUserId = snap1.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt
            }));
            allTransactions = [...allTransactions, ...transactionsByUserId];
            console.log(`✅ وجدت ${transactionsByUserId.length} معاملة بـ userId`);
          } catch (error) {
            console.log("⚠️ لم يتم العثور على معاملات بـ userId:", error.message);
          }

          // البحث باستخدام email (إذا كان موجوداً في البيانات)
          try {
            const q2 = query(
              collection(db, "transactions"),
              where("email", "==", user.email),
              orderBy("createdAt", "desc")
            );
            const snap2 = await getDocs(q2);
            const transactionsByEmail = snap2.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt
            }));
            
            // دمج النتائج مع تجنب التكرار
            transactionsByEmail.forEach(tx => {
              if (!allTransactions.some(existing => existing.id === tx.id)) {
                allTransactions.push(tx);
              }
            });
            
            console.log(`✅ وجدت ${transactionsByEmail.length} معاملة بالبريد الإلكتروني`);
          } catch (error) {
            console.log("⚠️ لا توجد معاملات بالبريد الإلكتروني:", error.message);
          }

          // إذا لم توجد معاملات للمستخدم
          if (allTransactions.length === 0) {
            console.log("📭 لا توجد معاملات لهذا المستخدم بعد");
            this.transactions = [];
            this.loading = false;
            return;
          }

          // فرز المعاملات حسب التاريخ (من الأحدث للأقدم)
          allTransactions.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return dateB - dateA;
          });

          this.transactions = allTransactions;
          console.log(`🎉 إجمالي المعاملات المعروضة: ${this.transactions.length}`);

        } catch (err) {
          console.error("❌ خطأ في تحميل المعاملات:", err);
          alert("حدث خطأ في تحميل المعاملات. تحقق من Console للمزيد من التفاصيل.");
        }

        this.loading = false;
      });
    },

    typeLabel(type) {
      if (type === "recharge") return "تعبئة رصيد";
      if (type === "withdraw") return "سحب رصيد";
      if (type === "vip") return "VIP";
      return type;
    },

    statusLabel(status) {
      if (status === "pending") return "قيد الانتظار";
      if (status === "approved") return "موافق";
      if (status === "rejected") return "مرفوض";
      return status;
    },

    formatDate(ts) {
      if (!ts) return "غير متوفر";
      
      try {
        let date;
        if (ts.toDate) {
          date = ts.toDate();
        } else if (ts.seconds) {
          date = new Date(ts.seconds * 1000);
        } else {
          date = new Date(ts);
        }
        
        return date.toLocaleString("ar-EG", {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        console.error("خطأ في تنسيق التاريخ:", error, ts);
        return "تاريخ غير صالح";
      }
    },
  },
};
</script>

<style scoped>
.transactions-wrapper {
  padding: 16px;
  min-height: 100vh;
  direction: rtl;
  background: linear-gradient(#0d6efd, #6bb4ff);
}

.title {
  text-align: center;
  color: white;
  margin-bottom: 16px;
}

.loading,
.empty {
  text-align: center;
  color: white;
  margin-top: 40px;
}

.empty {
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 12px;
  margin-top: 20px;
}

.tx-card {
  background: #ffffffee;
  padding: 14px;
  border-radius: 16px;
  margin-bottom: 14px;
  color: #000;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.label {
  font-size: 13px;
  color: #555;
}

.value {
  font-weight: bold;
  color: #333;
}

.status {
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 4px;
}

.status.pending {
  color: #ff9800;
  background-color: #fff3e0;
}

.status.approved {
  color: #2e7d32;
  background-color: #e8f5e9;
}

.status.rejected {
  color: #d32f2f;
  background-color: #ffebee;
}

.reject-box {
  background: #ffe5e5;
  padding: 8px;
  border-radius: 10px;
  margin-top: 8px;
  color: #b00020;
  font-size: 13px;
}

.admin-box {
  background: #e3f2fd;
  padding: 8px;
  border-radius: 10px;
  margin-top: 8px;
  font-size: 13px;
}
</style>
