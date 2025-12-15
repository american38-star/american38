<template>
  <div class="transactions-wrapper">
    <h2 class="title">المعاملات</h2>

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
        <!-- إخفاء الزر بناءً على قيمة showTestButton -->
        <button v-if="showTestButton" @click="createTestTransaction" class="test-btn">
          ➕ إنشاء معاملة تجريبية
        </button>
      </div>

      <div v-else>
        <p class="count-info">عدد المعاملات: {{ transactions.length }}</p>
        
        <div
          v-for="tx in transactions"
          :key="tx.id"
          class="tx-card"
        >
          <!-- 🔥 رسالة موافقة الأدمن - الجديدة 🔥 -->
          <div v-if="tx.adminAction === 'approved' && tx.userMessage" class="approval-box">
            <div class="approval-icon">✅</div>
            <div class="approval-text">{{ tx.userMessage }}</div>
            <div v-if="tx.approvedAt" class="approval-date">
              تمت الموافقة في: {{ formatDate(tx.approvedAt) }}
            </div>
          </div>

          <!-- رسالة رفض الأدمن -->
          <div v-if="tx.adminAction === 'rejected' && tx.reason" class="reject-box">
            <div class="reject-icon">❌</div>
            <div class="reject-text">
              <strong>تم الرفض:</strong> {{ tx.reason }}
            </div>
          </div>

          <div class="row">
            <span class="label">المعرف</span>
            <span class="value">{{ tx.id.substring(0, 8) }}...</span>
          </div>

          <div class="row">
            <span class="label">النوع</span>
            <span class="value">{{ typeLabel(tx.type) }}</span>
          </div>

          <div class="row">
            <span class="label">المبلغ</span>
            <span class="value">{{ tx.amount }} {{ tx.currency || 'USDT' }}</span>
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

          <!-- 🔥 معلومات إضافية 🔥 -->
          <div v-if="tx.email" class="row">
            <span class="label">البريد</span>
            <span class="value email">{{ tx.email }}</span>
          </div>

          <div v-if="tx.transactionId" class="row">
            <span class="label">كود المعاملة</span>
            <span class="value code">{{ tx.transactionId }}</span>
          </div>

          <div v-if="tx.adminId" class="row">
            <span class="label">الأدمن</span>
            <span class="value admin">ID: {{ tx.adminId }}</span>
          </div>

          <div v-if="tx.adminMessage && tx.adminMessage !== ''" class="admin-box">
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
  getDocs,
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
      showTestButton: false // إخفاء زر الاختبار
    };
  },

  created() {
    this.loadTransactions();
    // 🔥 الاستماع للتغييرات في الوقت الحقيقي 🔥
    this.setupRealtimeListener();
  },

  methods: {
    async loadTransactions() {
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          this.loading = false;
          console.log("❌ لا يوجد مستخدم مسجل دخول");
          return;
        }

        this.currentUserId = user.uid;
        console.log("🔍 جاري تحميل معاملات المستخدم:", user.uid);

        try {
          // المحاولة الأولى: مع الفهرس (إذا كان موجوداً)
          if (this.useIndex) {
            try {
              const q = query(
                collection(db, "transactions"),
                where("userId", "==", user.uid),
                orderBy("createdAt", "desc")
              );
              
              const snapshot = await getDocs(q);
              this.transactions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              
              console.log(`✅ تم تحميل ${this.transactions.length} معاملة باستخدام الفهرس`);
              this.checkForApprovals(); // 🔥 تفقد الموافقات
              this.loading = false;
              return;
              
            } catch (indexError) {
              console.log("⚠️ خطأ في الفهرس، جرب الطريقة البديلة:", indexError.message);
              this.indexError = true;
              this.useIndex = false;
              // استمر للطريقة البديلة
            }
          }

          // الطريقة البديلة: بدون orderBy
          try {
            const q = query(
              collection(db, "transactions"),
              where("userId", "==", user.uid)
            );
            
            const snapshot = await getDocs(q);
            let transactions = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            // ترتيب يدوي
            transactions.sort((a, b) => {
              const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
              const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
              return dateB - dateA;
            });
            
            this.transactions = transactions;
            console.log(`✅ تم تحميل ${transactions.length} معاملة بدون فهرس`);
            this.checkForApprovals(); // 🔥 تفقد الموافقات
            
          } catch (error) {
            console.error("❌ خطأ في الطريقة البديلة:", error);
            this.transactions = [];
          }
          
        } catch (err) {
          console.error("❌ خطأ عام في تحميل المعاملات:", err);
          this.transactions = [];
        }

        this.loading = false;
      });
    },

    // 🔥 دالة للاستماع للتغييرات في الوقت الحقيقي 🔥
    setupRealtimeListener() {
      onAuthStateChanged(auth, async (user) => {
        if (!user) return;
        
        // هذا يتطلب إضافة onSnapshot
        // يمكنك تفعيله لاحقاً إذا أردت تحديث تلقائي
        console.log("👂 الاستماع للتحديثات في الوقت الحقيقي...");
      });
    },

    // 🔥 دالة للتحقق من المعاملات التي تمت الموافقة عليها 🔥
    checkForApprovals() {
      const approvedTransactions = this.transactions.filter(tx => 
        tx.adminAction === 'approved' || tx.userMessage?.includes('موافقة')
      );
      
      if (approvedTransactions.length > 0) {
        console.log(`✅ تم العثور على ${approvedTransactions.length} معاملة موافق عليها`);
        
        // يمكن إضافة إشعار للمستخدم هنا
        approvedTransactions.forEach(tx => {
          if (tx.userMessage) {
            console.log(`📩 رسالة للمستخدم: ${tx.userMessage}`);
          }
        });
      }
    },

    // دالة للتحميل بدون فهرس
    async loadTransactionsWithoutIndex() {
      this.loading = true;
      this.indexError = false;
      this.useIndex = false;
      await this.loadTransactions();
    },

    // دالة لإنشاء معاملة تجريبية (معدلة مع الحقول الجديدة)
    async createTestTransaction() {
      try {
        const user = auth.currentUser;
        if (!user) {
          alert("يجب تسجيل الدخول أولاً");
          return;
        }

        // 🔥 بيانات المعاملة الجديدة مع الحقول الكاملة 🔥
        const transactionData = {
          transactionId: "TEST" + Date.now(), // 🔥 جديد
          userId: user.uid,
          email: user.email, // 🔥 جديد
          type: "withdrawal",
          amount: Math.floor(Math.random() * 500) + 100,
          currency: "USDT", // 🔥 جديد
          status: "pending",
          adminId: "", // 🔥 جديد
          adminMessage: "",
          adminAction: "", // 🔥 جديد - سيتم تعبئته عند الموافقة
          userMessage: "", // 🔥 جديد - سيتم تعبئته عند الموافقة
          reason: "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(), // 🔥 جديد
          approvedAt: null // 🔥 جديد
        };

        console.log("📝 جاري إنشاء معاملة تجريبية:", transactionData);

        const docRef = await addDoc(collection(db, "transactions"), transactionData);
        
        console.log("✅ تم إنشاء معاملة جديدة:", docRef.id);
        alert(`تم إنشاء معاملة تجريبية بنجاح!\nالمبلغ: ${transactionData.amount} ${transactionData.currency}`);
        
        // إعادة تحميل القائمة
        this.loading = true;
        await this.loadTransactions();
        
      } catch (error) {
        console.error("❌ خطأ في إنشاء المعاملة:", error);
        alert("خطأ: " + error.message);
      }
    },

    typeLabel(type) {
      const types = {
        recharge: "تعبئة رصيد",
        withdraw: "سحب رصيد",
        withdrawal: "سحب رصيد", // 🔥 إضافة withdrawal
        deposit: "إيداع",
        vip: "VIP"
      };
      return types[type] || type;
    },

    statusLabel(status) {
      const statuses = {
        pending: "قيد الانتظار",
        approved: "موافق",
        rejected: "مرفوض",
        completed: "مكتمل"
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

.test-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 15px;
  font-size: 14px;
}

.test-btn:hover {
  background: #45a049;
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
}

/* 🔥 صندوق الموافقة 🔥 */
.approval-box {
  background: linear-gradient(to right, #e8f5e9, #c8e6c9);
  border: 2px solid #4caf50;
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 15px;
  text-align: center;
  animation: pulse 2s infinite;
}

.approval-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.approval-text {
  color: #2e7d32;
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 5px;
}

.approval-date {
  color: #388e3c;
  font-size: 12px;
  opacity: 0.8;
}

/* صندوق الرفض */
.reject-box {
  background: #ffebee;
  border: 1px solid #f44336;
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 15px;
  color: #d32f2f;
}

.reject-icon {
  font-size: 20px;
  margin-bottom: 8px;
  text-align: center;
}

.reject-text {
  text-align: center;
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

.value.email {
  font-size: 12px;
  color: #2196f3;
}

.value.code {
  font-size: 11px;
  color: #9c27b0;
  direction: ltr;
}

.value.admin {
  font-size: 11px;
  color: #ff9800;
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

.admin-box {
  background: #e3f2fd;
  padding: 8px;
  border-radius: 10px;
  margin-top: 8px;
  font-size: 13px;
}

/* 🔥 تأثير نبضي للموافقة 🔥 */
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
  100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
}
</style>
