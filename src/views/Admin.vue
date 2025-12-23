<template>
  <div class="admin-page">
    <!-- Header -->
    <div class="header-row">
      <h1 class="page-title">لوحة الإدارة</h1>
      <div class="header-actions">
        <button class="logout-btn" @click="logout">تسجيل خروج</button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button :class="['tab', activeTab === 'withdraws' ? 'active' : '']" @click="switchTab('withdraws')">
        طلبات السحب ({{ withdraws.length }})
      </button>
      <button :class="['tab', activeTab === 'recharges' ? 'active' : '']" @click="switchTab('recharges')">
        طلبات التعبئة ({{ rechargeRequests.length }})
      </button>
      <button :class="['tab', activeTab === 'users' ? 'active' : '']" @click="switchTab('users')">
        المستخدمون ({{ users.length }})
      </button>
      <button :class="['tab', activeTab === 'notifications' ? 'active' : '']" @click="switchTab('notifications')">
        الإشعارات
      </button>
      <button :class="['tab', activeTab === 'withdrawLogs' ? 'active' : '']" @click="switchTab('withdrawLogs')">
        سجل السحوبات
      </button>
      <!-- 🔥 علامة التبويب الجديدة لسجل التعبئة -->
      <button :class="['tab', activeTab === 'rechargeLogs' ? 'active' : '']" @click="switchTab('rechargeLogs')">
        سجل التعبئة
      </button>
    </div>

    <!-- طلبات السحب -->
    <div v-if="activeTab === 'withdraws'" class="panel">
      <div class="panel-header">
        <h2>طلبات السحب</h2>
        <div class="controls">
          <input v-model="withdrawFilter" placeholder="بحث عن بريد / محفظة..." />
          <select v-model="withdrawSort">
            <option value="newest">الأحدث أولاً</option>
            <option value="oldest">الأقدم أولاً</option>
            <option value="amount_desc">الأعلى مبلغ</option>
            <option value="amount_asc">الأقل مبلغ</option>
          </select>
          <button @click="loadWithdrawRequests" type="button">تحديث</button>
        </div>
      </div>

      <div v-if="loadingWithdraws" class="loading">⏳ جاري تحميل طلبات السحب...</div>
      <div v-else>
        <div v-if="filteredWithdraws.length === 0" class="empty">لا توجد طلبات سحب حالياً.</div>
        <div class="cards">
          <div class="card withdraw-card" v-for="req in filteredWithdraws" :key="req.id">
            <p><strong>البريد:</strong> {{ req.email || '—' }}</p>
            <p><strong>المبلغ:</strong> {{ req.amount }} USDT</p>
            <p><strong>الشبكة:</strong> {{ req.network || '—' }}</p>
            <p><strong>المحفظة:</strong> {{ req.wallet || '—' }}</p>
            <p class="muted">تم الإنشاء: {{ formatDate(req.createdAt) }}</p>
            <div class="card-actions">
              <button class="btn green" type="button" @click.stop="openApproveModal(req, 'withdraw')" :disabled="processingId === req.id">موافقة</button>
              <button class="btn red" type="button" @click.stop="openRejectModal(req, 'withdraw')" :disabled="processingId === req.id">رفض</button>
              <button class="btn ghost" type="button" @click.stop="viewWithdrawDetails(req)">تفاصيل</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- طلبات التعبئة -->
    <div v-if="activeTab === 'recharges'" class="panel">
      <div class="panel-header">
        <h2>طلبات التعبئة</h2>
        <div class="controls">
          <input v-model="rechargeFilter" placeholder="بحث بالبريد أو الشبكة أو الحالة..." />
          <select v-model="rechargeSort">
            <option value="newest">الأحدث أولاً</option>
            <option value="oldest">الأقدم أولاً</option>
            <option value="amount_desc">الأعلى مبلغ</option>
            <option value="amount_asc">الأقل مبلغ</option>
            <option value="status_pending">قيد المراجعة</option>
            <option value="status_approved">موافق عليها</option>
            <option value="status_rejected">مرفوضة</option>
          </select>
          <button @click="reloadRechargeRequests" type="button">تحديث</button>
          <button @click="markAllRechargeNotificationsRead" type="button">وضع إشعارات كمقروءة</button>
        </div>
      </div>

      <div v-if="loadingRecharges" class="loading">⏳ جاري تحميل طلبات التعبئة...</div>
      <div v-else>
        <div v-if="filteredRechargeRequests.length === 0" class="empty">لا توجد طلبات تعبئة حالياً.</div>
        <div class="cards">
          <div class="card recharge-card" v-for="r in filteredRechargeRequests" :key="r.id">
            <p><strong>البريد:</strong> {{ r.email || r.userEmail || '—' }}</p>
            <p><strong>المبلغ:</strong> {{ r.amount }} USDT</p>
            <p><strong>الشبكة:</strong> {{ r.network || '—' }}</p>
            <p><strong>حالة:</strong> {{ r.status || 'pending' }}</p>
            <p v-if="r.txid"><strong>TxID:</strong> {{ r.txid }}</p>
            <p class="muted">تم الإنشاء: {{ formatDate(r.createdAt) }}</p>
            <div class="card-actions">
              <button class="btn green" type="button" @click.stop="openApproveModal(r, 'recharge')" :disabled="processingId === r.id || r.status === 'approved'">موافقة</button>
              <button class="btn red" type="button" @click.stop="openRejectModal(r, 'recharge')" :disabled="processingId === r.id || r.status === 'rejected'">رفض</button>
              <button class="btn black" type="button" @click.stop="deleteRecharge(r)" :disabled="processingId === r.id">حذف</button>
              <button class="btn ghost" type="button" @click.stop="viewRechargeDetails(r)">تفاصيل</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- المستخدمين -->
    <div v-if="activeTab === 'users'" class="panel">
      <div class="panel-header">
        <h2>جميع المستخدمين</h2>
        <div class="controls">
          <input v-model="userFilter" placeholder="بحث بالبريد..." />
          <select v-model="userSort">
            <option value="email">ترتيب بالبريد</option>
            <option value="balance_desc">الرصيد (تنازلي)</option>
            <option value="balance_asc">الرصيد (تصاعدي)</option>
          </select>
          <button @click="loadUsers" type="button">تحديث</button>
        </div>
      </div>

      <div v-if="loadingUsers" class="loading">⏳ جاري تحميل المستخدمين...</div>
      <div v-else>
        <div v-if="filteredUsers.length === 0" class="empty">لا يوجد مستخدمين.</div>
        <div class="cards">
          <div class="card user-card" v-for="u in filteredUsers" :key="u.id">
            <p><strong>البريد:</strong> {{ u.email || '—' }}</p>
            <p><strong>رصيد:</strong> {{ u.balance ?? 0 }} USDT</p>
            <p><strong>الحالة:</strong> {{ u.blocked ? 'محظور' : 'فعال' }}</p>
            <div class="card-actions">
              <button class="btn green" type="button" @click="promptRecharge(u)">تعبئة رصيد</button>
              <button class="btn red" type="button" @click="promptDeduct(u)">سحب رصيد</button>
              <button class="btn blue" type="button" @click="sendResetPassword(u.email)">إعادة تعيين كلمة السر</button>
              <button class="btn black" type="button" @click="toggleBlockUser(u)">
                {{ u.blocked ? 'إلغاء الحظر' : 'حظر' }}
              </button>
              <button class="btn ghost" type="button" @click="viewUserNotifications(u)">
                الإشعارات ({{ u.notificationsCount || 0 }})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- الإشعارات -->
    <div v-if="activeTab === 'notifications'" class="panel">
      <div class="panel-header">
        <h2>إشعارات المستخدمين (عرض عام)</h2>
        <div class="controls">
          <input v-model="notifFilter" placeholder="بحث..." />
          <button @click="loadAllNotifications" type="button">تحميل</button>
        </div>
      </div>

      <div v-if="loadingNotifs" class="loading">⏳ جاري تحميل الإشعارات...</div>
      <div v-else>
        <div v-if="allNotifications.length === 0" class="empty">لا توجد إشعارات.</div>
        <div class="cards">
          <div class="card notif-card" v-for="n in filteredNotifications" :key="n.id">
            <p><strong>إلى:</strong> {{ n.email || n.userId }}</p>
            <p><strong>العنوان:</strong> {{ n.title }}</p>
            <p>{{ n.message }}</p>
            <p class="muted">الوقت: {{ formatDate(n.createdAt) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- سجل السحوبات -->
    <div v-if="activeTab === 'withdrawLogs'" class="panel">
      <div class="panel-header">
        <h2>سجل السحوبات</h2>
        <div class="controls">
          <input v-model="withdrawLogFilter" placeholder="بحث بالسعر أو البريد..." />
          <button @click="loadWithdrawLogs" type="button">تحديث</button>
        </div>
      </div>

      <div v-if="loadingWithdrawLogs" class="loading">⏳ جاري تحميل السجلات...</div>
      <div v-else>
        <div v-if="withdrawLogs.length === 0" class="empty">لا توجد سجلات.</div>
        <div class="cards">
          <div class="card log-card" v-for="l in filteredWithdrawLogs" :key="l.id">
            <p><strong>البريد:</strong> {{ l.email }}</p>
            <p><strong>المبلغ:</strong> {{ l.amount }} USDT</p>
            <p><strong>النوع:</strong> {{ l.type }}</p>
            <p class="muted">الوقت: {{ formatDate(l.createdAt) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 🔥 سجل التعبئة الجديد -->
    <div v-if="activeTab === 'rechargeLogs'" class="panel">
      <div class="panel-header">
        <h2>سجل تعبئة الرصيد</h2>
        <div class="controls">
          <input v-model="rechargeLogFilter" placeholder="بحث بالبريد أو المبلغ..." />
          <select v-model="rechargeLogSort">
            <option value="newest">الأحدث أولاً</option>
            <option value="oldest">الأقدم أولاً</option>
            <option value="amount_desc">الأعلى مبلغ</option>
            <option value="amount_asc">الأقل مبلغ</option>
          </select>
          <button @click="loadRechargeLogs" type="button">تحديث</button>
        </div>
      </div>

      <div v-if="loadingRechargeLogs" class="loading">⏳ جاري تحميل سجلات التعبئة...</div>
      <div v-else>
        <div v-if="rechargeLogs.length === 0" class="empty">لا توجد سجلات تعبئة.</div>
        <div class="cards">
          <div class="card log-card" v-for="log in filteredRechargeLogs" :key="log.id">
            <p><strong>البريد:</strong> {{ log.email || log.userEmail || '—' }}</p>
            <p><strong>المبلغ:</strong> {{ log.amount }} USDT</p>
            <p><strong>الحالة:</strong> 
              <span :class="{
                'status-approved': log.type === 'approved' || log.status === 'approved',
                'status-rejected': log.type === 'rejected' || log.status === 'rejected',
                'status-pending': log.type === 'pending' || log.status === 'pending'
              }">
                {{ log.type === 'approved' ? 'موافق' : log.type === 'rejected' ? 'مرفوض' : log.type || log.status || '—' }}
              </span>
            </p>
            <p v-if="log.reason"><strong>سبب الرفض:</strong> {{ log.reason }}</p>
            <p v-if="log.adminMessage"><strong>رسالة الأدمن:</strong> {{ log.adminMessage }}</p>
            <p class="muted">التاريخ: {{ formatDate(log.createdAt) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal رفض مع سبق -->
    <div v-if="showRejectModal" class="modal-backdrop" @click.self="closeRejectModal">
      <div class="modal">
        <h3>سبب الرفض</h3>
        <p><strong>المبلغ:</strong> {{ rejectModalData.amount }} USDT</p>
        <p><strong>المستخدم:</strong> {{ rejectModalData.email || rejectModalData.userEmail || '—' }}</p>
        <p><strong>النوع:</strong> {{ rejectModalData.type === 'recharge' ? 'تعبئة' : 'سحب' }}</p>
        
        <div class="input-box" style="margin-top: 15px;">
          <label>سبب الرفض (مطلوب 1-500 حرف)</label>
          <textarea 
            v-model="rejectReason" 
            placeholder="أدخل سبب الرفض..."
            rows="4"
            style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ccc;"
          ></textarea>
          <div v-if="rejectError" style="color: red; font-size: 12px; margin-top: 5px;">
            {{ rejectError }}
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn red" type="button" @click="confirmReject" :disabled="processingId === rejectModalData.id">
            تأكيد الرفض
          </button>
          <button class="btn ghost" type="button" @click="closeRejectModal">إلغاء</button>
        </div>
      </div>
    </div>

    <!-- Modal موافقة مع رسالة -->
    <div v-if="showApproveModal" class="modal-backdrop" @click.self="closeApproveModal">
      <div class="modal">
        <h3>رسالة الموافقة</h3>
        <p><strong>المبلغ:</strong> {{ approveModalData.amount }} USDT</p>
        <p><strong>المستخدم:</strong> {{ approveModalData.email || approveModalData.userEmail || '—' }}</p>
        <p><strong>النوع:</strong> {{ approveModalData.type === 'recharge' ? 'تعبئة' : 'سحب' }}</p>
        
        <div class="input-box" style="margin-top: 15px;">
          <label>رسالة للمستخدم (اختياري - 0-500 حرف)</label>
          <textarea 
            v-model="approveMessage" 
            placeholder="أدخل رسالة تهنئة أو تعليمات للمستخدم..."
            rows="4"
            style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ccc;"
          ></textarea>
          <div v-if="approveError" style="color: red; font-size: 12px; margin-top: 5px;">
            {{ approveError }}
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn green" type="button" @click="confirmApprove" :disabled="processingId === approveModalData.id">
            تأكيد الموافقة
          </button>
          <button class="btn ghost" type="button" @click="closeApproveModal">إلغاء</button>
        </div>
      </div>
    </div>

    <!-- Modal تفاصيل -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal">
        <h3>تفاصيل الطلب</h3>
        <p v-if="modalType === 'withdraw'"><strong>البريد:</strong> {{ modalData.email }}</p>
        <p v-if="modalType === 'withdraw'"><strong>المبلغ:</strong> {{ modalData.amount }}</p>
        <p v-if="modalType === 'withdraw'"><strong>الشبكة:</strong> {{ modalData.network }}</p>
        <p v-if="modalType === 'withdraw'"><strong>المحفظة:</strong> {{ modalData.wallet }}</p>
        <p v-if="modalType === 'recharge'"><strong>البريد:</strong> {{ modalData.email || modalData.userEmail }}</p>
        <p v-if="modalType === 'recharge'"><strong>المبلغ:</strong> {{ modalData.amount }}</p>
        <p v-if="modalType === 'recharge'"><strong>الشبكة:</strong> {{ modalData.network }}</p>
        <p v-if="modalType === 'recharge' && modalData.txid"><strong>TxID:</strong> {{ modalData.txid }}</p>
        <p class="muted">تم الإنشاء: {{ formatDate(modalData.createdAt) }}</p>
        <div class="modal-actions">
          <button v-if="modalType === 'withdraw'" class="btn green" type="button" @click.stop="openApproveModal(modalData, 'withdraw')" :disabled="processingId === modalData.id">موافقة</button>
          <button v-if="modalType === 'withdraw'" class="btn red" type="button" @click.stop="openRejectModal(modalData, 'withdraw')" :disabled="processingId === modalData.id">رفض</button>
          <button v-if="modalType === 'recharge'" class="btn green" type="button" @click.stop="openApproveModal(modalData, 'recharge')" :disabled="processingId === modalData.id || modalData.status === 'approved'">موافقة</button>
          <button v-if="modalType === 'recharge'" class="btn red" type="button" @click.stop="openRejectModal(modalData, 'recharge')" :disabled="processingId === modalData.id || modalData.status === 'rejected'">رفض</button>
          <button class="btn ghost" type="button" @click="closeModal">إغلاق</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  getAuth,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  limit
} from "firebase/firestore";
import { db } from "../firebase";

export default {
  name: "Admin",
  data() {
    return {
      activeTab: "withdraws",
      users: [],
      loadingUsers: true,
      userFilter: "",
      userSort: "email",
      withdraws: [],
      loadingWithdraws: true,
      withdrawFilter: "",
      withdrawSort: "newest",
      rechargeRequests: [],
      loadingRecharges: true,
      rechargeFilter: "",
      rechargeSort: "newest",
      rechargeUnsubscribe: null,
      allNotifications: [],
      loadingNotifs: false,
      notifFilter: "",
      withdrawLogs: [],
      loadingWithdrawLogs: false,
      withdrawLogFilter: "",
      
      // 🔥 البيانات الجديدة لسجل التعبئة
      rechargeLogs: [],
      loadingRechargeLogs: false,
      rechargeLogFilter: "",
      rechargeLogSort: "newest",
      
      showModal: false,
      modalData: {},
      modalType: "withdraw",
      authChecked: false,
      adminEmails: [
        "azad.333388@gmail.com",
        "admin2@gmail.com",
        "owner@gmail.com",
      ],
      currentUser: null,
      processingId: null,

      // بيانات لموذج الرفض
      showRejectModal: false,
      rejectModalData: {},
      rejectReason: "",
      rejectError: "",
      rejectType: "", // 'recharge' أو 'withdraw'

      // بيانات لموذج الموافقة مع رسالة
      showApproveModal: false,
      approveModalData: {},
      approveMessage: "",
      approveError: "",
      approveType: "", // 'recharge' أو 'withdraw'
    };
  },
  computed: {
    filteredUsers() {
      let list = [...this.users];
      if (this.userFilter) {
        const f = this.userFilter.toLowerCase();
        list = list.filter((u) =>
          String(u.email || "").toLowerCase().includes(f)
        );
      }
      if (this.userSort === "balance_desc")
        list.sort((a, b) => (b.balance || 0) - (a.balance || 0));
      else if (this.userSort === "balance_asc")
        list.sort((a, b) => (a.balance || 0) - (b.balance || 0));
      else
        list.sort((a, b) =>
          String(a.email || "").localeCompare(String(b.email || ""))
        );
      return list;
    },
    filteredWithdraws() {
      let list = [...this.withdraws];
      if (this.withdrawFilter) {
        const f = this.withdrawFilter.toLowerCase();
        list = list.filter(
          (r) =>
            (r.email || "").toLowerCase().includes(f) ||
            (r.wallet || "").toLowerCase().includes(f)
        );
      }
      if (this.withdrawSort === "newest")
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      else if (this.withdrawSort === "oldest")
        list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      else if (this.withdrawSort === "amount_desc")
        list.sort((a, b) => (b.amount || 0) - (a.amount || 0));
      else if (this.withdrawSort === "amount_asc")
        list.sort((a, b) => (a.amount || 0) - (b.amount || 0));
      return list;
    },
    filteredRechargeRequests() {
      let list = [...this.rechargeRequests];
      if (this.rechargeFilter) {
        const f = this.rechargeFilter.toLowerCase();
        list = list.filter(
          (r) =>
            (r.email || "").toLowerCase().includes(f) ||
            (r.network || "").toLowerCase().includes(f) ||
            (String(r.amount || "") || "").includes(f) ||
            (r.status || "").toLowerCase().includes(f)
        );
      }
      if (this.rechargeSort === "newest")
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      else if (this.rechargeSort === "oldest")
        list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      else if (this.rechargeSort === "amount_desc")
        list.sort((a, b) => (b.amount || 0) - (a.amount || 0));
      else if (this.rechargeSort === "amount_asc")
        list.sort((a, b) => (a.amount || 0) - (b.amount || 0));
      else if (this.rechargeSort === "status_pending")
        list = list.filter((r) => (r.status || "pending") === "pending");
      else if (this.rechargeSort === "status_approved")
        list = list.filter((r) => (r.status || "") === "approved");
      else if (this.rechargeSort === "status_rejected")
        list = list.filter((r) => (r.status || "") === "rejected");
      return list;
    },
    filteredNotifications() {
      if (!this.notifFilter) return this.allNotifications;
      const f = this.notifFilter.toLowerCase();
      return this.allNotifications.filter(
        (n) =>
          (n.message || "").toLowerCase().includes(f) ||
          (n.title || "").toLowerCase().includes(f) ||
          (n.email || "").toLowerCase().includes(f)
      );
    },
    filteredWithdrawLogs() {
      if (!this.withdrawLogFilter) return this.withdrawLogs;
      const f = this.withdrawLogFilter.toLowerCase();
      return this.withdrawLogs.filter(
        (l) =>
          String(l.amount || "").includes(f) ||
          (l.email || "").toLowerCase().includes(f)
      );
    },
    // 🔥 computed جديد لتصفية سجلات التعبئة
    filteredRechargeLogs() {
      let list = [...this.rechargeLogs];
      
      // التصفية حسب البحث
      if (this.rechargeLogFilter) {
        const f = this.rechargeLogFilter.toLowerCase();
        list = list.filter(
          (log) =>
            (log.email || "").toLowerCase().includes(f) ||
            (log.userEmail || "").toLowerCase().includes(f) ||
            String(log.amount || "").includes(f) ||
            (log.type || "").toLowerCase().includes(f) ||
            (log.status || "").toLowerCase().includes(f)
        );
      }
      
      // الترتيب
      if (this.rechargeLogSort === "newest")
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      else if (this.rechargeLogSort === "oldest")
        list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      else if (this.rechargeLogSort === "amount_desc")
        list.sort((a, b) => (b.amount || 0) - (a.amount || 0));
      else if (this.rechargeLogSort === "amount_asc")
        list.sort((a, b) => (a.amount || 0) - (b.amount || 0));
      
      return list;
    },
  },
  created() {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      this.authChecked = true;
      this.currentUser = user || null;
      if (!user) return this.$router.replace("/login");
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.exists() ? userDoc.data() : null;
        const isRoleAdmin =
          userData &&
          (userData.role === "admin" || userData.isAdmin === true);
        if (!isRoleAdmin && !this.adminEmails.includes(user.email)) {
          alert("غير مسموح بالدخول");
          return this.$router.replace("/403");
        }
      } catch (e) {
        console.error("admin check", e);
        return this.$router.replace("/403");
      }
      await Promise.all([
        this.loadWithdrawRequests(),
        this.loadUsers(),
        this.loadWithdrawLogs(),
      ]);
      this.attachRechargeListener();
    });
  },
  beforeUnmount() {
    if (this.rechargeUnsubscribe) {
      try { this.rechargeUnsubscribe(); } catch (e) {}
      this.rechargeUnsubscribe = null;
    }
  },
  methods: {
    // فتح موذج الموافقة
    openApproveModal(data, type) {
      this.approveModalData = data;
      this.approveType = type;
      this.approveMessage = "";
      this.approveError = "";
      this.showApproveModal = true;
      this.showModal = false; // إغلاق الموذج القديم
    },

    // إغلاق موذج الموافقة
    closeApproveModal() {
      this.showApproveModal = false;
      this.approveModalData = {};
      this.approveMessage = "";
      this.approveError = "";
    },

    // التحقق من رسالة الموافقة
    validateApproveMessage() {
      if (this.approveMessage.length > 500) {
        this.approveError = "الرسالة يجب أن تكون أقل من 500 حرف";
        return false;
      }
      this.approveError = "";
      return true;
    },

    // تأكيد الموافقة
    async confirmApprove() {
      if (!this.validateApproveMessage()) return;

      if (this.approveType === 'recharge') {
        await this.approveRechargeWithMessage(this.approveModalData, this.approveMessage);
      } else if (this.approveType === 'withdraw') {
        await this.approveWithdrawWithMessage(this.approveModalData, this.approveMessage);
      }
    },

    // فتح موذج الرفض
    openRejectModal(data, type) {
      this.rejectModalData = data;
      this.rejectType = type;
      this.rejectReason = "";
      this.rejectError = "";
      this.showRejectModal = true;
      this.showModal = false; // إغلاق الموذج القديم
    },

    // إغلاق موذج الرفض
    closeRejectModal() {
      this.showRejectModal = false;
      this.rejectModalData = {};
      this.rejectReason = "";
      this.rejectError = "";
    },

    // التحقق من سبب الرفض
    validateRejectReason() {
      if (!this.rejectReason || this.rejectReason.trim() === "") {
        this.rejectError = "يجب إدخال سبب الرفض";
        return false;
      }
      if (this.rejectReason.length < 1 || this.rejectReason.length > 500) {
        this.rejectError = "سبب الرفض يجب أن يكون بين 1 و 500 حرف";
        return false;
      }
      this.rejectError = "";
      return true;
    },

    // تأكيد الرفض
    async confirmReject() {
      if (!this.validateRejectReason()) return;

      if (this.rejectType === 'recharge') {
        await this.rejectRecharge(this.rejectModalData, this.rejectReason);
      } else if (this.rejectType === 'withdraw') {
        await this.rejectWithdraw(this.rejectModalData, this.rejectReason);
      }
    },

    async logout() {
      try {
        const auth = getAuth();
        await auth.signOut();
        this.$router.replace("/login");
      } catch (e) {
        alert("خطأ أثناء تسجيل الخروج");
      }
    },
    
    switchTab(tab) {
      this.activeTab = tab;
      if (tab === "withdraws") this.loadWithdrawRequests();
      else if (tab === "users") this.loadUsers();
      else if (tab === "notifications") this.loadAllNotifications();
      else if (tab === "withdrawLogs") this.loadWithdrawLogs();
      else if (tab === "recharges") {
        this.reloadRechargeRequests();
      }
      else if (tab === "rechargeLogs") { // 🔥 تحميل سجلات التعبئة عند النقر على التبويب
        this.loadRechargeLogs();
      }
    },
    
    async loadUsers() {
      try {
        this.loadingUsers = true;
        const snap = await getDocs(collection(db, "users"));
        this.users = snap.docs.map((d) => {
          const data = d.data() || {};
          return {
            id: d.id,
            email: data.email || "",
            balance: data.balance ?? 0,
            blocked: data.blocked ?? false,
            notificationsCount: data.notificationsCount ?? 0,
          };
        });
      } catch (e) {
        alert("خطأ عند تحميل المستخدمين");
      } finally {
        this.loadingUsers = false;
      }
    },
    
    promptRecharge(user) {
      const a = prompt("أدخل مبلغ التعبئة:");
      if (!a || isNaN(a)) return;
      this.rechargeUser(user.id, Number(a));
    },
    
    async rechargeUser(userId, amount) {
      try {
        const r = doc(db, "users", userId);
        const s = await getDoc(r);
        const cur = s.exists() ? Number(s.data().balance || 0) : 0;
        await updateDoc(r, { balance: cur + Number(amount) });
        alert("✔ تم تعبئة الرصيد");
        this.loadUsers();
      } catch (e) {
        alert("خطأ أثناء تعبئة الرصيد");
      }
    },
    
    promptDeduct(user) {
      const a = prompt("أدخل مبلغ الخصم:");
      if (!a || isNaN(a)) return;
      this.deductUser(user.id, Number(a));
    },
    
    async deductUser(userId, amount) {
      try {
        const r = doc(db, "users", userId);
        const s = await getDoc(r);
        const cur = s.exists() ? Number(s.data().balance || 0) : 0;
        await updateDoc(r, { balance: Math.max(0, cur - Number(amount)) });
        alert("✔ تم خصم المبلغ");
        this.loadUsers();
      } catch (e) {
        alert("خطأ أثناء خصم الرصيد");
      }
    },
    
    async sendResetPassword(email) {
      try {
        const auth = getAuth();
        await sendPasswordResetEmail(auth, email);
        alert("تم إرسال رابط إعادة التعيين");
      } catch (e) {
        alert("خطأ أثناء إرسال الرابط");
      }
    },
    
    async toggleBlockUser(user) {
      try {
        await updateDoc(doc(db, "users", user.id), {
          blocked: !user.blocked,
        });
        alert("✔ تم تحديث الحالة");
        this.loadUsers();
      } catch (e) {
        alert("خطأ أثناء تحديث الحالة");
      }
    },
    
    async viewUserNotifications(user) {
      await this.loadNotificationsForUser(user.id);
      this.activeTab = "notifications";
    },
    
    async loadWithdrawRequests() {
      try {
        this.loadingWithdraws = true;
        const snap = await getDocs(collection(db, "withdraw_requests"));
        this.withdraws = snap.docs.map((d) => {
          const data = d.data() || {};
          let createdAt = Date.now();
          if (data.createdAt) {
            if (typeof data.createdAt === "number") createdAt = data.createdAt;
            else if (data.createdAt.toMillis) createdAt = data.createdAt.toMillis();
          }
          return {
            id: d.id,
            userId: data.userId,
            email: data.email,
            amount: data.amount,
            network: data.network,
            wallet: data.wallet,
            oldBalance: data.oldBalance ?? null,
            createdAt,
          };
        });
      } catch (e) {
        alert("خطأ عند تحميل طلبات السحب");
      } finally {
        this.loadingWithdraws = false;
      }
    },
    
    viewWithdrawDetails(req) {
      this.modalData = req || {};
      this.modalType = "withdraw";
      this.showModal = true;
    },
    
    closeModal() {
      this.showModal = false;
      this.modalData = {};
      this.modalType = "withdraw";
    },
    
    async ensureAdmin() {
      try {
        const auth = getAuth();
        const user = auth.currentUser || this.currentUser;
        if (!user) return false;
        const d = await getDoc(doc(db, "users", user.uid));
        const u = d.exists() ? d.data() : null;
        if (u && (u.role === "admin" || u.isAdmin === true)) return true;
        if (this.adminEmails.includes(user.email)) return true;
        return false;
      } catch (e) {
        return false;
      }
    },
    
    // ✅ دالة تحديث المعاملة في collection transactions
    async updateTransactionDirectly(transactionId, updateData) {
      try {
        const transactionRef = doc(db, "transactions", transactionId);
        await updateDoc(transactionRef, {
          ...updateData,
          updatedAt: serverTimestamp()
        });
        console.log("✅ تم تحديث المعاملة:", transactionId);
        return true;
      } catch (error) {
        console.error("❌ خطأ في تحديث المعاملة:", error);
        return false;
      }
    },

    // ✅ دالة إنشاء معاملة جديدة
    async createTransactionForUser(userId, email, type, amount, status, reason = "", adminMessage = "") {
      try {
        const transactionData = {
          transactionId: "TRX" + Date.now(),
          userId: userId,
          email: email,
          type: type, // 'withdraw' أو 'recharge'
          amount: amount,
          currency: "USDT",
          status: status,
          adminAction: status === "approved" ? "approved" : status === "rejected" ? "rejected" : "",
          userMessage: status === "approved" ? "تمت الموافقة على طلبك" : 
                      status === "rejected" ? "تم رفض طلبك" : "",
          reason: reason,
          adminMessage: adminMessage,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          [status === "approved" ? "approvedAt" : status === "rejected" ? "rejectedAt" : ""]: serverTimestamp()
        };

        await addDoc(collection(db, "transactions"), transactionData);
        console.log("✅ تم إنشاء معاملة جديدة للمستخدم:", userId);
        return true;
      } catch (error) {
        console.error("❌ خطأ في إنشاء المعاملة:", error);
        return false;
      }
    },

    // دالة للموافقة على السحب مع رسالة
    async approveWithdrawWithMessage(req, message = "") {
      if (!req || !req.id) return;
      const allowed = await this.ensureAdmin();
      if (!allowed) return alert("غير مصرح لك");
      if (!confirm(`تأكيد الموافقة على ${req.amount} USDT؟`)) return;
      this.processingId = req.id;
      try {
        // 1. تحديث أو إنشاء المعاملة في transactions مع الرسالة
        if (req.userId) {
          await this.createTransactionForUser(
            req.userId,
            req.email,
            "withdraw",
            req.amount,
            "approved",
            "",
            message || "تمت الموافقة على طلب السحب"
          );
        }

        // 2. إضافة سجل
        await addDoc(collection(db, "withdraw_logs"), {
          userId: req.userId || null,
          email: req.email || null,
          amount: req.amount || 0,
          type: "approved",
          adminMessage: message || "",
          createdAt: serverTimestamp(),
        });
        
        // 3. إرسال إشعار للمستخدم مع الرسالة
        if (req.userId) {
          const notificationMessage = message 
            ? `تم تحويل ${req.amount} USDT. ${message}`
            : `تم تحويل ${req.amount} USDT.`;
            
          await addDoc(
            collection(db, "users", req.userId, "notifications"),
            {
              title: "تمت الموافقة على السحب",
              message: notificationMessage,
              read: false,
              createdAt: serverTimestamp(),
            }
          );
        }
        
        // 4. حذف الطلب من withdraw_requests
        const r = doc(db, "withdraw_requests", req.id);
        const ex = await getDoc(r);
        if (ex.exists()) await deleteDoc(r);
        
        alert("✔ تمت الموافقة");
        await this.loadWithdrawRequests();
        await this.loadWithdrawLogs();
      } catch (e) {
        console.error("خطأ في الموافقة:", e);
        alert("خطأ في الموافقة");
      } finally {
        this.processingId = null;
        this.closeModal();
        this.closeApproveModal();
      }
    },
    
    // دالة للموافقة على التعبئة مع رسالة
    async approveRechargeWithMessage(r, message = "") {
      if (!r || !r.id) return;
      const allowed = await this.ensureAdmin();
      if (!allowed) return alert("غير مصرح لك");
      if (!confirm(`تأكيد الموافقة على تعبئة ${r.amount} USDT للمستخدم ${r.userEmail || r.userId || ''}?`)) return;
      this.processingId = r.id;
      try {
        // 1. تحديث حالة الطلب في payments
        const pRef = doc(db, "payments", r.id);
        await updateDoc(pRef, { 
          status: "approved", 
          processedAt: serverTimestamp(),
          adminMessage: message || ""
        });

        // 2. إنشاء معاملة في transactions مع الرسالة
        if (r.userId) {
          await this.createTransactionForUser(
            r.userId,
            r.userEmail,
            "recharge",
            r.amount,
            "approved",
            "",
            message || "تمت الموافقة على طلب التعبئة"
          );
        }

        // 3. إضافة سجل مع الرسالة
        await addDoc(collection(db, "recharge_logs"), {
          userId: r.userId || null,
          email: r.userEmail || null,
          amount: r.amount || 0,
          type: "approved",
          adminMessage: message || "",
          createdAt: serverTimestamp(),
        });

        // 4. إرسال إشعار للمستخدم مع الرسالة
        if (r.userId) {
          const notificationMessage = message 
            ? `تمت إضافة ${r.amount} USDT إلى حسابك. ${message}`
            : `تمت إضافة ${r.amount} USDT إلى حسابك. شكراً لك.`;
            
          await addDoc(collection(db, "users", r.userId, "notifications"), {
            title: "تمت الموافقة على طلب التعبئة",
            message: notificationMessage,
            read: false,
            createdAt: serverTimestamp(),
          });

          // 5. تحديث رصيد المستخدم
          try {
            const userRef = doc(db, "users", r.userId);
            const uSnap = await getDoc(userRef);
            const cur = uSnap.exists() ? Number(uSnap.data().balance || 0) : 0;
            await updateDoc(userRef, { balance: cur + Number(r.amount || 0) });

            // 6. حساب أرباح الإحالة
            await this.calculateAndAddReferralEarnings(r.userId, r.amount, r.id);

          } catch (err) {
            console.warn("failed to update user balance after recharge approval:", err);
          }
        }

        alert("✔ تمت الموافقة على طلب التعبئة وتم إضافة أرباح الإحالة");
      } catch (e) {
        console.error("approveRecharge error:", e);
        alert("خطأ أثناء الموافقة على الطلب");
      } finally {
        this.processingId = null;
        this.closeModal();
        this.closeApproveModal();
      }
    },

    // ✅ دالة لرفض السحب مع سبب
    async rejectWithdraw(req, reason = "") {
      if (!req || !req.id) return;
      
      // إذا لم يتم إرسال السبب، نفتح الموذج
      if (!reason) {
        this.openRejectModal(req, 'withdraw');
        return;
      }
      
      const allowed = await this.ensureAdmin();
      if (!allowed) return alert("غير مصرح");
      if (!confirm(`تأكيد رفض سحب ${req.amount}؟`)) return;
      this.processingId = req.id;
      try {
        // 1. إنشاء معاملة مرفوضة في transactions
        if (req.userId) {
          await this.createTransactionForUser(
            req.userId,
            req.email,
            "withdraw",
            req.amount,
            "rejected",
            reason,
            "تم رفض طلب السحب"
          );
        }

        // 2. إعادة الرصيد إذا كان هناك oldBalance
        if (req.userId && typeof req.oldBalance === "number") {
          try {
            await updateDoc(doc(db, "users", req.userId), {
              balance: req.oldBalance,
            });
          } catch { }
        }

        // 3. إضافة سجل الرفض
        await addDoc(collection(db, "withdraw_logs"), {
          userId: req.userId || null,
          email: req.email || null,
          amount: req.amount || 0,
          type: "rejected",
          reason: reason,
          createdAt: serverTimestamp(),
        });

        // 4. إرسال إشعار للمستخدم مع السبب
        if (req.userId) {
          await addDoc(
            collection(db, "users", req.userId, "notifications"),
            {
              title: "تم رفض طلب السحب",
              message: `تم رفض سحب ${req.amount} USDT. السبب: ${reason}`,
              read: false,
              createdAt: serverTimestamp(),
            }
          );
        }

        // 5. حذف الطلب
        const r = doc(db, "withdraw_requests", req.id);
        const ex = await getDoc(r);
        if (ex.exists()) await deleteDoc(r);
        
        alert("❌ تم الرفض");
        await this.loadWithdrawRequests();
        await this.loadWithdrawLogs();
      } catch (e) {
        console.error("خطأ في رفض الطلب:", e);
        alert("خطأ في رفض الطلب");
      } finally {
        this.processingId = null;
        this.closeModal();
        this.closeRejectModal();
      }
    },
    
    async loadAllNotifications() {
      try {
        this.loadingNotifs = true;
        const snap = await getDocs(collection(db, "notifications"));
        this.allNotifications = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
      } catch (e) {
        this.allNotifications = [];
      } finally {
        this.loadingNotifs = false;
      }
    },
    
    async loadNotificationsForUser(id) {
      try {
        this.loadingNotifs = true;
        const snap = await getDocs(
          collection(db, "users", id, "notifications")
        );
        this.allNotifications = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          userId: id,
        }));
      } catch (e) {
        this.allNotifications = [];
      } finally {
        this.loadingNotifs = false;
      }
    },
    
    async loadWithdrawLogs() {
      try {
        this.loadingWithdrawLogs = true;
        const snap = await getDocs(collection(db, "withdraw_logs"));
        this.withdrawLogs = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
      } catch (e) {
        this.withdrawLogs = [];
      } finally {
        this.loadingWithdrawLogs = false;
      }
    },
    
    // 🔥 دالة جديدة لتحميل سجلات التعبئة
    async loadRechargeLogs() {
      try {
        this.loadingRechargeLogs = true;
        
        // محاولة جلب البيانات من collection recharge_logs أولاً
        try {
          const rechargeLogsSnap = await getDocs(query(
            collection(db, "recharge_logs"),
            orderBy("createdAt", "desc")
          ));
          
          this.rechargeLogs = rechargeLogsSnap.docs.map((d) => {
            const data = d.data() || {};
            return {
              id: d.id,
              type: data.type || '',
              amount: data.amount || 0,
              email: data.email || data.userEmail || '',
              userEmail: data.userEmail || data.email || '',
              reason: data.reason || '',
              adminMessage: data.adminMessage || '',
              createdAt: data.createdAt,
            };
          });
          
          // إذا وجدنا سجلات في recharge_logs، نوقف هنا
          if (this.rechargeLogs.length > 0) {
            console.log(`✅ تم تحميل ${this.rechargeLogs.length} سجل تعبئة من recharge_logs`);
            return;
          }
        } catch (err) {
          console.log("⚠ لا يوجد collection recharge_logs، جارٍ البحث في transactions...");
        }
        
        // إذا لم توجد سجلات في recharge_logs، نبحث في transactions
        try {
          const transactionsSnap = await getDocs(query(
            collection(db, "transactions"),
            where("type", "==", "recharge"),
            orderBy("createdAt", "desc")
          ));
          
          this.rechargeLogs = transactionsSnap.docs.map((d) => {
            const data = d.data() || {};
            return {
              id: d.id,
              type: data.status || '',
              status: data.status || '',
              amount: data.amount || 0,
              email: data.email || '',
              userEmail: data.email || '',
              reason: data.reason || '',
              adminMessage: data.adminMessage || '',
              createdAt: data.createdAt,
            };
          });
          
          console.log(`✅ تم تحميل ${this.rechargeLogs.length} سجل تعبئة من transactions`);
          
        } catch (err) {
          console.error("❌ خطأ في تحميل سجلات التعبئة:", err);
          this.rechargeLogs = [];
        }
        
      } catch (e) {
        console.error("خطأ عام في تحميل سجلات التعبئة:", e);
        this.rechargeLogs = [];
      } finally {
        this.loadingRechargeLogs = false;
      }
    },
    
    formatDate(ts) {
      if (!ts) return "-";
      try {
        if (ts.toMillis) ts = ts.toMillis();
        return new Date(Number(ts)).toLocaleString();
      } catch {
        return String(ts);
      }
    },
    
    attachRechargeListener() {
      try {
        if (this.rechargeUnsubscribe) {
          try { this.rechargeUnsubscribe(); } catch (e) {}
          this.rechargeUnsubscribe = null;
        }
        const q = query(collection(db, "payments"), orderBy("createdAt", "desc"));
        this.rechargeUnsubscribe = onSnapshot(q, (snap) => {
          const arr = snap.docs.map((d) => {
            const data = d.data() || {};
            let createdAt = Date.now();
            if (data.createdAt) {
              if (typeof data.createdAt === "number") createdAt = data.createdAt;
              else if (data.createdAt.toMillis) createdAt = data.createdAt.toMillis();
            }
            return {
              id: d.id,
              userId: data.userId || null,
              userEmail: data.email || data.userEmail || "",
              amount: data.amount || 0,
              network: data.network || "",
              txid: data.txid || "",
              proofURL: data.proofURL || null,
              status: data.status || "pending",
              createdAt,
            };
          });
          this.rechargeRequests = arr;
          this.loadingRecharges = false;
          const pendingCount = arr.filter(a => (a.status || 'pending') === 'pending').length;
          if (pendingCount > 0) {
            console.info(`طلبات تعبئة جديدة: ${pendingCount}`);
          }
        }, (err) => {
          console.error("recharge listener error:", err);
          this.loadingRecharges = false;
        });
      } catch (e) {
        console.error("attachRechargeListener error:", e);
        this.loadingRecharges = false;
      }
    },
    
    async reloadRechargeRequests() {
      this.loadingRecharges = true;
      try {
        const snap = await getDocs(query(collection(db, "payments"), orderBy("createdAt", "desc")));
        this.rechargeRequests = snap.docs.map((d) => {
          const data = d.data() || {};
          let createdAt = Date.now();
          if (data.createdAt) {
            if (typeof data.createdAt === "number") createdAt = data.createdAt;
            else if (data.createdAt.toMillis) createdAt = data.createdAt.toMillis();
          }
          return {
            id: d.id,
            userId: data.userId || null,
            userEmail: data.email || data.userEmail || "",
            amount: data.amount || 0,
            network: data.network || "",
            txid: data.txid || "",
            proofURL: data.proofURL || null,
            status: data.status || "pending",
            createdAt,
          };
        });
      } catch (e) {
        console.error("reloadRechargeRequests error:", e);
      } finally {
        this.loadingRecharges = false;
      }
    },
    
    viewRechargeDetails(r) {
      this.modalData = r || {};
      this.modalType = "recharge";
      this.showModal = true;
    },
    
    async markAllRechargeNotificationsRead() {
      alert("تم وضع إشعارات التعبئة كمقروءة (محلياً).");
    },

    // ✅ دالة لحساب وإضافة أرباح الإحالة تلقائياً
    async calculateAndAddReferralEarnings(userId, amount, rechargeId) {
      try {
        console.log(`🔗 بدء حساب أرباح الإحالة للمستخدم: ${userId}, المبلغ: ${amount}`);
        
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          console.log("❌ المستخدم غير موجود");
          return;
        }
        
        const userData = userSnap.data();
        const userEmail = userData.email || "";
        
        // نسبة العمولات لكل مستوى
        const commissionRates = {
          level1: 5,   // 5% للمستوى الأول (invitedBy)
          level2: 2,   // 2% للمستوى الثاني (level2)
          level3: 1,   // 1% للمستوى الثالث (level3)
        };
        
        // المستوى الأول: invitedBy
        if (userData.invitedBy) {
          try {
            const level1Ref = doc(db, "users", userData.invitedBy);
            const level1Snap = await getDoc(level1Ref);
            
            if (level1Snap.exists()) {
              const level1Data = level1Snap.data();
              const level1Amount = (amount * commissionRates.level1) / 100;
              const newBalance = (level1Data.balance || 0) + level1Amount;
              
              // تحديث رصيد المحيل بالمستوى الأول
              await updateDoc(level1Ref, { balance: newBalance });
              
              // إنشاء معاملة الإحالة للمستوى الأول
              await addDoc(collection(db, "transactions"), {
                transactionId: "REF" + Date.now() + Math.random().toString(36).substr(2, 5),
                userId: userData.invitedBy,
                email: level1Data.email || "",
                type: "referral_commission",
                amount: level1Amount,
                currency: "USDT",
                status: "completed",
                details: {
                  fromUserId: userId,
                  fromEmail: userEmail,
                  level: 1,
                  percentage: commissionRates.level1,
                  baseAmount: amount,
                  rechargeId: rechargeId,
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
              
              // إرسال إشعار للمحيل بالمستوى الأول
              await addDoc(collection(db, "users", userData.invitedBy, "notifications"), {
                title: "💰 عمولة إحالة جديدة",
                message: `لقد حصلت على عمولة إحالة بقيمة ${level1Amount} USDT (${commissionRates.level1}%) من ${userEmail}`,
                read: false,
                createdAt: serverTimestamp(),
              });
              
              console.log(`✅ إضافة ${level1Amount} USDT (${commissionRates.level1}%) للمستوى الأول: ${level1Data.email}`);
            }
          } catch (error) {
            console.error("❌ خطأ في حساب أرباح المستوى الأول:", error);
          }
        }
        
        // المستوى الثاني: level2
        if (userData.level2) {
          try {
            const level2Ref = doc(db, "users", userData.level2);
            const level2Snap = await getDoc(level2Ref);
            
            if (level2Snap.exists()) {
              const level2Data = level2Snap.data();
              const level2Amount = (amount * commissionRates.level2) / 100;
              const newBalance = (level2Data.balance || 0) + level2Amount;
              
              // تحديث رصيد المحيل بالمستوى الثاني
              await updateDoc(level2Ref, { balance: newBalance });
              
              // إنشاء معاملة الإحالة للمستوى الثاني
              await addDoc(collection(db, "transactions"), {
                transactionId: "REF" + Date.now() + Math.random().toString(36).substr(2, 6),
                userId: userData.level2,
                email: level2Data.email || "",
                type: "referral_commission",
                amount: level2Amount,
                currency: "USDT",
                status: "completed",
                details: {
                  fromUserId: userId,
                  fromEmail: userEmail,
                  level: 2,
                  percentage: commissionRates.level2,
                  baseAmount: amount,
                  rechargeId: rechargeId,
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
              
              // إرسال إشعار للمحيل بالمستوى الثاني
              await addDoc(collection(db, "users", userData.level2, "notifications"), {
                title: "💰 عمولة إحالة جديدة",
                message: `لقد حصلت على عمولة إحالة بقيمة ${level2Amount} USDT (${commissionRates.level2}%) من ${userEmail}`,
                read: false,
                createdAt: serverTimestamp(),
              });
              
              console.log(`✅ إضافة ${level2Amount} USDT (${commissionRates.level2}%) للمستوى الثاني: ${level2Data.email}`);
            }
          } catch (error) {
            console.error("❌ خطأ في حساب أرباح المستوى الثاني:", error);
          }
        }
        
        // المستوى الثالث: level3
        if (userData.level3) {
          try {
            const level3Ref = doc(db, "users", userData.level3);
            const level3Snap = await getDoc(level3Ref);
            
            if (level3Snap.exists()) {
              const level3Data = level3Snap.data();
              const level3Amount = (amount * commissionRates.level3) / 100;
              const newBalance = (level3Data.balance || 0) + level3Amount;
              
              // تحديث رصيد المحيل بالمستوى الثالث
              await updateDoc(level3Ref, { balance: newBalance });
              
              // إنشاء معاملة الإحالة للمستوى الثالث
              await addDoc(collection(db, "transactions"), {
                transactionId: "REF" + Date.now() + Math.random().toString(36).substr(2, 7),
                userId: userData.level3,
                email: level3Data.email || "",
                type: "referral_commission",
                amount: level3Amount,
                currency: "USDT",
                status: "completed",
                details: {
                  fromUserId: userId,
                  fromEmail: userEmail,
                  level: 3,
                  percentage: commissionRates.level3,
                  baseAmount: amount,
                  rechargeId: rechargeId,
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
              
              // إرسال إشعار للمحيل بالمستوى الثالث
              await addDoc(collection(db, "users", userData.level3, "notifications"), {
                title: "💰 عمولة إحالة جديدة",
                message: `لقد حصلت على عمولة إحالة بقيمة ${level3Amount} USDT (${commissionRates.level3}%) من ${userEmail}`,
                read: false,
                createdAt: serverTimestamp(),
              });
              
              console.log(`✅ إضافة ${level3Amount} USDT (${commissionRates.level3}%) للمستوى الثالث: ${level3Data.email}`);
            }
          } catch (error) {
            console.error("❌ خطأ في حساب أرباح المستوى الثالث:", error);
          }
        }
        
        console.log(`🎉 تم إكمال حساب أرباح الإحالة بنجاح`);
        
      } catch (error) {
        console.error("❌ خطأ في حساب أرباح الإحالة:", error);
        throw error;
      }
    },

    // ✅ دالة لرفض التعبئة مع سبب
    async rejectRecharge(r, reason = "") {
      if (!r || !r.id) return;
      
      // إذا لم يتم إرسال السبب، نفتح الموذج
      if (!reason) {
        this.openRejectModal(r, 'recharge');
        return;
      }
      
      const allowed = await this.ensureAdmin();
      if (!allowed) return alert("غير مصرح لك");
      if (!confirm(`تأكيد رفض طلب التعبئة ${r.amount} USDT للمستخدم ${r.userEmail || r.userId || ''}?`)) return;
      this.processingId = r.id;
      try {
        // 1. تحديث حالة الطلب في payments
        const pRef = doc(db, "payments", r.id);
        await updateDoc(pRef, { status: "rejected", processedAt: serverTimestamp() });

        // 2. إنشاء معاملة مرفوضة في transactions
        if (r.userId) {
          await this.createTransactionForUser(
            r.userId,
            r.userEmail,
            "recharge",
            r.amount,
            "rejected",
            reason,
            "تم رفض طلب التعبئة"
          );
        }

        // 3. إضافة سجل الرفض
        await addDoc(collection(db, "recharge_logs"), {
          userId: r.userId || null,
          email: r.userEmail || null,
          amount: r.amount || 0,
          type: "rejected",
          reason: reason,
          createdAt: serverTimestamp(),
        });

        // 4. إرسال إشعار للمستخدم مع السبب
        if (r.userId) {
          await addDoc(collection(db, "users", r.userId, "notifications"), {
            title: "تم رفض طلب التعبئة",
            message: `تم رفض طلب تعبئة ${r.amount} USDT. السبب: ${reason}`,
            read: false,
            createdAt: serverTimestamp(),
          });
        }

        alert("❌ تم رفض طلب التعبئة");
      } catch (e) {
        console.error("rejectRecharge error:", e);
        alert("حدث خطأ أثناء رفض الطلب");
      } finally {
        this.processingId = null;
        this.closeModal();
        this.closeRejectModal();
      }
    },
    
    async deleteRecharge(r) {
      if (!r || !r.id) return;
      const allowed = await this.ensureAdmin();
      if (!allowed) return alert("غير مصرح لك");
      if (!confirm("هل أنت متأكد أنك تريد حذف هذا الطلب نهائياً؟")) return;
      this.processingId = r.id;
      try {
        await deleteDoc(doc(db, "payments", r.id));
        await addDoc(collection(db, "recharge_logs"), {
          userId: r.userId || null,
          email: r.userEmail || null,
          amount: r.amount || 0,
          type: "deleted",
          createdAt: serverTimestamp(),
        });
        alert("تم حذف الطلب");
      } catch (e) {
        console.error("deleteRecharge error:", e);
        alert("خطأ أثناء حذف الطلب");
      } finally {
        this.processingId = null;
      }
    },
    
    detachRechargeListener() {
      if (this.rechargeUnsubscribe) {
        try { this.rechargeUnsubscribe(); } catch (e) {}
        this.rechargeUnsubscribe = null;
      }
    },
    
    async markAllRechargeNotificationsReadServerSide() {
      alert("ميزة وضع الإشعارات كمقروءة تحتاج تنفيذ على حسب تصميم قاعدة البيانات.");
    },
  },
};
</script>

<style scoped>
/* تحسينات التصغير والضغط */
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.logout-btn {
  background: #ff4444;
  color: white;
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-size: 12px;
  height: 30px;
}

.admin-page {
  direction: rtl;
  padding: 12px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: Inter, system-ui, Arial;
  min-height: 100vh;
}

.page-title {
  text-align: left;
  font-size: 18px;
  color: #0b5cff;
  margin-bottom: 6px;
  font-weight: 600;
}

.tabs {
  display: flex;
  gap: 6px;
  justify-content: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.tab {
  padding: 6px 10px;
  background: #f1f5ff;
  border: 1px solid rgba(11, 92, 255, 0.06);
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 12px;
  min-height: 30px;
  flex: 1;
  min-width: 120px;
  text-align: center;
}

.tab.active {
  background: linear-gradient(90deg, #0066ff, #00c6ff);
  color: white;
}

.panel {
  background: #fff;
  padding: 12px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(9, 30, 66, 0.04);
  margin-bottom: 12px;
  max-height: 500px;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.panel-header h2 {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.controls {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}

.controls input,
.controls select {
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid #ddd;
  font-size: 11px;
  height: 28px;
  min-width: 150px;
}

.controls button {
  padding: 5px 8px;
  border-radius: 6px;
  border: none;
  background: #0b5cff;
  color: white;
  cursor: pointer;
  font-size: 11px;
  height: 28px;
  white-space: nowrap;
}

.cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card {
  background: #fff;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 3px 8px rgba(9, 30, 66, 0.03);
  border: 1px solid #eee;
}

.card p {
  margin: 4px 0;
  font-size: 11px;
  line-height: 1.3;
}

.card strong {
  font-weight: 600;
}

.muted {
  color: #666;
  font-size: 10px;
}

.card-actions {
  display: flex;
  gap: 5px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.btn {
  padding: 4px 8px;
  border-radius: 6px;
  border: none;
  color: white;
  cursor: pointer;
  font-weight: 600;
  font-size: 10px;
  height: 26px;
  min-width: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.green {
  background: #28a745;
}

.red {
  background: #dc3545;
}

.blue {
  background: #007bff;
}

.black {
  background: #333;
}

.ghost {
  background: #e6eefc;
  color: #123;
}

.loading {
  text-align: center;
  padding: 10px;
  color: #666;
  font-size: 12px;
}

.empty {
  text-align: center;
  padding: 12px;
  color: #999;
  font-size: 12px;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
}

.modal {
  background: white;
  padding: 12px;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  max-height: 80vh;
  overflow-y: auto;
}

.modal h3 {
  font-size: 14px;
  margin: 0 0 10px 0;
  color: #333;
  font-weight: 600;
}

.modal p {
  margin: 5px 0;
  font-size: 11px;
  line-height: 1.3;
}

.modal-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  justify-content: flex-end;
}

/* 🔥 أنماط جديدة لحالات السجلات */
.status-approved {
  color: #28a745;
  font-weight: bold;
}

.status-rejected {
  color: #dc3545;
  font-weight: bold;
}

.status-pending {
  color: #ffc107;
  font-weight: bold;
}

/* تحسينات للعرض على الشاشات الصغيرة */
@media (max-width: 768px) {
  .admin-page {
    padding: 8px;
  }

  .tabs {
    gap: 4px;
  }

  .tab {
    padding: 5px 8px;
    font-size: 11px;
    min-width: 100px;
  }

  .panel-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .controls {
    width: 100%;
  }

  .controls input,
  .controls select {
    flex: 1;
    min-width: auto;
  }

  .card-actions {
    justify-content: center;
  }

  .btn {
    flex: 1;
    min-width: auto;
  }
}
</style>
