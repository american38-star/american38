<template>
  <div class="transactions-wrapper">
    <h2 class="title">المعاملات</h2>

    <!-- ✅ رسالة تأكيد للموافقة -->
    <div v-if="successMessage" class="success-notification">
      🎉 {{ successMessage }}
      <button @click="successMessage = ''" class="close-btn">✕</button>
    </div>

    <div v-if="loading" class="loading">جاري التحميل...</div>

    <div v-else-if="indexError" class="error-box">
      <h3>⚠️ تحتاج إلى إنشاء فهرس في Firebase</h3>
      <p>لإصلاح المشكلة الدائمة:</p>
      <ol>
        <li>اذهب لـ <a href="https://console.firebase.google.com/" target="_blank">Firebase Console</a></li>
        <li>اختر مشروعك: <strong>american-54cbd</strong></li>
        <li>اذهب لـ Firestore Database → Indexes</li>
        <li>أنشئ فهرس لـ collection "transactions" مع الحقول: userId (Ascending), createdAt (Descending)</li>
        <li>انتظر دقيقتين ثم أعد تحميل هذه الصفحة</li>
      </ol>
      <button @click="loadTransactionsWithoutIndex" class="retry-btn">
        🔄 محاولة التحميل بدون فهرس (مؤقت)
      </button>
    </div>

    <div v-else>
      <div v-if="transactions.length === 0" class="empty">
        <p>لا توجد معاملات</p>
        <p class="uid-info">UID الحالي: {{ currentUserId }}</p>
      </div>

      <div v-else>
        <p class="count-info">عدد المعاملات: {{ transactions.length }}</p>
        
        <div
          v-for="tx in transactions"
          :key="tx.id"
          class="tx-card"
        >
          <!-- ✅ تأكيد الموافقة -->
          <div v-if="tx.status === 'approved'" class="approved-banner">
            ✅ تمت الموافقة على طلبك بنجاح
          </div>

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

          <div v-if="tx.userId" class="row">
            <span class="label">User ID</span>
            <span class="value uid">{{ tx.userId.substring(0, 10) }}...</span>
          </div>

          <!-- ✅ رسالة خاصة للموافقة -->
          <div v-if="tx.status === 'approved' && tx.adminMessage" class="approved-message">
            <strong>تمت الموافقة على طلبك</strong>
            <p>{{ tx.adminMessage }}</p>
          </div>

          <div
            v-if="tx.status === 'rejected' && tx.reason"
            class="reject-box"
          >
            <strong>سبب الرفض:</strong>
            <div>{{ tx.reason }}</div>
          </div>

          <div
            v-if="tx.status === 'pending' && tx.adminMessage"
            class="admin-box"
          >
            <strong>رسالة الإدارة:</strong>
            <div>{{ tx.adminMessage }}</div>
          </div>
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
  onSnapshot, // ⬅️ بدلاً من getDocs
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default {
  name: "Transactions",

  data() {
    return {
      loading: true,
      transactions: [],
      indexError: false,
      currentUserId: "",
      useIndex: true,
      showTestButton: false,
      successMessage: "",
      unsubscribe: null // للتتبع
    };
  },

  created() {
    this.loadTransactions();
  },

  beforeUnmount() {
    // تنظيف الاشتراك عند الخروج
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  },

  methods: {
    loadTransactions() {
      onAuthStateChanged(auth, (user) => {
        if (!user) {
          this.loading = false;
          console.log("❌ لا يوجد مستخدم مسجل دخول");
          return;
        }

        this.currentUserId = user.uid;
        console.log("🔍 جاري تحميل معاملات المستخدم:", user.uid);

        // تنظيف الاشتراك السابق
        if (this.unsubscribe) {
          this.unsubscribe();
        }

        try {
          // استخدام onSnapshot للتحديث الفوري
          const q = query(
            collection(db, "transactions"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
          );

          this.unsubscribe = onSnapshot(q, 
            (snapshot) => {
              console.log("🔄 تحديث تلقائي للمعاملات");

              const transactionsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));

              // ✅ اكتشاف المعاملات التي تحولت إلى "approved"
              this.detectNewApprovals(transactionsData);

              this.transactions = transactionsData;
              this.loading = false;
              this.indexError = false;
              
              console.log(`✅ تم تحديث ${transactionsData.length} معاملة`);
            },
            (error) => {
              console.error("❌ خطأ في الاستماع:", error);
              
              if (error.code === 'failed-precondition') {
                this.indexError = true;
                this.useIndex = false;
              }
              
              this.loading = false;
            }
          );

        } catch (err) {
          console.error("❌ خطأ في تحميل المعاملات:", err);
          this.loading = false;
        }
      });
    },

    // ✅ اكتشاف المعاملات التي تمت الموافقة عليها حديثاً
    detectNewApprovals(newTransactions) {
      if (this.transactions.length === 0) return;

      newTransactions.forEach(newTx => {
        const oldTx = this.transactions.find(t => t.id === newTx.id);
        
        if (oldTx && oldTx.status === 'pending' && newTx.status === 'approved') {
          this.successMessage = `✅ تمت الموافقة على طلبك! المبلغ: ${newTx.amount} USDT`;
          
          // تختفي الرسالة بعد 10 ثواني
          setTimeout(() => {
            this.successMessage = "";
          }, 10000);
        }
      });
    },

    // دالة للتحميل بدون فهرس
    async loadTransactionsWithoutIndex() {
      this.loading = true;
      this.indexError = false;
      this.useIndex = false;
      
      if (this.unsubscribe) {
        this.unsubscribe();
      }
      
      this.loadTransactions();
    },

    // دالة لإنشاء معاملة تجريبية (إخفاءها)
    async createTestTransaction() {
      try {
        const user = auth.currentUser;
        if (!user) {
          alert("يجب تسجيل الدخول أولاً");
          return;
        }

        const transactionData = {
          userId: user.uid,
          type: "deposit",
          amount: Math.floor(Math.random() * 500) + 100,
          status: "pending",
          createdAt: serverTimestamp(),
          reason: "",
          adminMessage: ""
        };

        const docRef = await addDoc(collection(db, "transactions"), transactionData);
        
        alert(`تم إنشاء معاملة بنجاح!\nالمبلغ: ${transactionData.amount} USDT`);
        
      } catch (error) {
        console.error("❌ خطأ في إنشاء المعاملة:", error);
        alert("خطأ: " + error.message);
      }
    },

    typeLabel(type) {
      const types = {
        recharge: "تعبئة رصيد",
        withdraw: "سحب رصيد",
        deposit: "إيداع",
        vip: "VIP"
      };
      return types[type] || type;
    },

    statusLabel(status) {
      const statuses = {
        pending: "قيد الانتظار",
        approved: "✅ موافق",
        rejected: "❌ مرفوض"
      };
      return statuses[status] || status;
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
  font-size: 24px;
}

.success-notification {
  background: #d4edda;
  color: #155724;
  padding: 12px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 2px solid #28a745;
  display: flex;
  justify-content: space-between;
  align-items: center;
  animation: slideDown 0.5s ease;
}

@keyframes slideDown {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.close-btn {
  background: none;
  border: none;
  color: #155724;
  font-size: 18px;
  cursor: pointer;
}

.loading {
  text-align: center;
  color: white;
  margin-top: 40px;
  font-size: 18px;
}

.error-box {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  padding: 20px;
  border-radius: 10px;
  margin: 20px 0;
  color: #856404;
  text-align: right;
}

.error-box ol {
  margin-right: 20px;
}

.error-box a {
  color: #007bff;
  font-weight: bold;
}

.retry-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  margin-top: 15px;
  cursor: pointer;
  font-size: 14px;
  width: 100%;
}

.retry-btn:hover {
  background: #218838;
}

.empty {
  text-align: center;
  color: white;
  margin-top: 40px;
  background: rgba(255, 255, 255, 0.1);
  padding: 30px;
  border-radius: 16px;
}

.uid-info {
  font-size: 12px;
  opacity: 0.8;
  margin: 10px 0;
  direction: ltr;
  word-break: break-all;
  background: rgba(0, 0, 0, 0.2);
  padding: 8px;
  border-radius: 8px;
}

.count-info {
  color: white;
  text-align: center;
  margin-bottom: 15px;
  font-weight: bold;
}

.tx-card {
  background: #ffffffee;
  padding: 14px;
  border-radius: 16px;
  margin-bottom: 14px;
  color: #000;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  border: 1px solid #ddd;
}

.approved-banner {
  background: linear-gradient(90deg, #28a745, #20c997);
  color: white;
  padding: 8px 12px;
  border-radius: 8px 8px 0 0;
  margin: -14px -14px 10px -14px;
  text-align: center;
  font-weight: bold;
  font-size: 14px;
}

.approved-message {
  background: #e8f5e9;
  padding: 12px;
  border-radius: 8px;
  margin-top: 10px;
  color: #2e7d32;
  border-right: 4px solid #4CAF50;
}

.approved-message strong {
  display: block;
  margin-bottom: 5px;
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

.value.uid {
  font-size: 11px;
  color: #888;
  direction: ltr;
}

.status {
  font-weight: bold;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
}

.status.pending {
  color: #ff9800;
  background-color: #fff3e0;
  border: 1px solid #ff9800;
}

.status.approved {
  color: #155724;
  background-color: #d4edda;
  border: 2px solid #28a745;
}

.status.rejected {
  color: #721c24;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
}

.reject-box {
  background: #ffe5e5;
  padding: 8px;
  border-radius: 10px;
  margin-top: 8px;
  color: #b00020;
  font-size: 13px;
  border-right: 4px solid #dc3545;
}

.admin-box {
  background: #e3f2fd;
  padding: 8px;
  border-radius: 10px;
  margin-top: 8px;
  font-size: 13px;
  border-right: 4px solid #2196F3;
}
</style>
