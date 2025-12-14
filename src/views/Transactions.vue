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
    loadTransactions() {
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          this.loading = false;
          return;
        }

        try {
          const q = query(
            collection(db, "transactions"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
          );

          const snap = await getDocs(q);

          this.transactions = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        } catch (err) {
          console.error("Error loading transactions:", err);
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
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return date.toLocaleString("ar-EG");
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

.tx-card {
  background: #ffffffee;
  padding: 14px;
  border-radius: 16px;
  margin-bottom: 14px;
  color: #000;
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
}

.status {
  font-weight: bold;
}

.status.pending {
  color: #ff9800;
}

.status.approved {
  color: #2e7d32;
}

.status.rejected {
  color: #d32f2f;
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