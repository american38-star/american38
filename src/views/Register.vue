<template>
  <div class="container">
    <div class="card">
      <h2 class="title">إنشاء حساب</h2>

      <!-- البريد الإلكتروني -->
      <label class="label">البريد الإلكتروني</label>
      <input
        type="email"
        v-model="email"
        placeholder="البريد الإلكتروني"
        class="input"
      />

      <!-- كلمة المرور -->
      <label class="label">كلمة المرور</label>
      <div class="input-box">
        <input
          :type="showPassword ? 'text' : 'password'"
          v-model="password"
          placeholder="كلمة المرور"
          class="input"
        />
        <span class="toggle" @click="togglePassword">
          {{ showPassword ? "إخفاء" : "إظهار" }}
        </span>
      </div>

      <!-- كود الإحالة -->
      <label class="label">كود الإحالة</label>
      <input
        type="text"
        v-model="inviteCode"
        placeholder="كود الإحالة"
        class="input"
      />

      <!-- زر إنشاء الحساب -->
      <button class="btn" @click="registerUser" :disabled="loading">
        <span v-if="!loading">إنشاء حساب</span>
        <span v-else class="loader"></span>
      </button>

      <p class="link">
        لديك حساب؟
        <router-link to="/login">تسجيل الدخول</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import {
  getAuth,
  createUserWithEmailAndPassword,
  browserLocalPersistence,
} from "firebase/auth";

import { db } from "../firebase";

import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

import router from "../router";

export default {
  name: "RegisterPage",

  data() {
    return {
      email: "",
      password: "",
      inviteCode: "",
      showPassword: false,
      loading: false,
    };
  },

  created() {
    // قراءة كود الإحالة من رابط ?ref=xxxx
    const ref = this.$route.query.ref;
    if (ref) {
      this.inviteCode = String(ref).trim();
    }
  },

  methods: {
    togglePassword() {
      this.showPassword = !this.showPassword;
    },

    // ========================================================
    // ================ إنشاء حساب جديد =======================
    // ========================================================
    async registerUser() {
      if (!this.email || !this.password) {
        alert("يرجى تعبئة جميع الحقول");
        return;
      }

      this.loading = true;

      try {
        const auth = getAuth();
        await auth.setPersistence(browserLocalPersistence);

        // إنشاء الحساب
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          this.email.trim(),
          this.password
        );

        const user = userCredential.user;

        let inviterUID = null;
        let level2 = null;
        let level3 = null;

        // ===============================
        // التحقق من كود الإحالة 3 مستويات
        // ===============================
        if (this.inviteCode) {
          const enteredCode = String(this.inviteCode).trim();

          // منع الإحالة الذاتية
          if (enteredCode === user.uid.substring(0, 6)) {
            alert("لا يمكنك استخدام كود الإحالة الخاص بك");
          } else {
            // البحث عن صاحب الكود
            const q = query(
              collection(db, "users"),
              where("referralCode", "==", enteredCode)
            );
            const result = await getDocs(q);

            if (!result.empty) {
              const inviterDoc = result.docs[0];
              inviterUID = inviterDoc.id;

              // مستوى 2
              const inviterData = inviterDoc.data();
              if (inviterData.invitedBy) {
                level2 = inviterData.invitedBy;
              }

              // مستوى 3
              if (level2) {
                const docLevel2 = await getDoc(doc(db, "users", level2));
                if (docLevel2.exists()) {
                  const level2Data = docLevel2.data();
                  if (level2Data.invitedBy) {
                    level3 = level2Data.invitedBy;
                  }
                }
              }
            }
          }
        }

        // =====================================================
        // إنشاء مستخدم جديد مع 3 مستويات إحالة
        // =====================================================
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: this.email.trim(),
          referralCode: user.uid.substring(0, 6),

          // مستويات الإحالة
          invitedBy: inviterUID || null, // المستوى الأول
          level2: level2 || null,
          level3: level3 || null,

          // بيانات الحساب
          balance: 0,
          vipLevel: 0,
          blocked: false,
          createdAt: serverTimestamp(),
        });

        // الانتقال للصفحة الرئيسية
        router.push("/home");
      } catch (err) {
        console.error("Register error:", err);
        alert("خطأ: " + (err.message || String(err)));
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  min-height: 100vh;
  background: linear-gradient(#0d6efd, #6bb4ff);
}

.card {
  background: white;
  width: 90%;
  max-width: 380px;
  padding: 25px;
  border-radius: 20px;
  box-shadow: 0 4px 12px #0003;
}

.title {
  text-align: center;
  margin-bottom: 20px;
  font-weight: bold;
}

.label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
}

.input {
  width: 100%;
  padding: 12px;
  margin-bottom: 15px;
  border-radius: 10px;
  border: 1px solid #ccc;
}

.input-box {
  position: relative;
}

.toggle {
  position: absolute;
  left: 15px;
  top: 12px;
  color: #0d6efd;
  cursor: pointer;
  font-size: 14px;
}

.btn {
  width: 100%;
  padding: 12px;
  border: none;
  background: #007bff;
  color: white;
  border-radius: 8px;
  font-size: 18px;
  cursor: pointer;
}

.link {
  text-align: center;
  margin-top: 15px;
}

.loader {
  width: 20px;
  height: 20px;
  border: 3px solid #fff;
  border-top: 3px solid transparent;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
