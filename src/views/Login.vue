<template>
  <div class="container">
    <div class="card">
      <h2 class="title">تسجيل الدخول</h2>

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

      <!-- زر تسجيل الدخول مع Loader -->
      <button class="btn" @click="loginUser" :disabled="loading">
        <span v-if="!loading">تسجيل الدخول</span>
        <span v-else class="loader"></span>
      </button>

      <p class="link">
        ليس لديك حساب؟
        <router-link to="/register">إنشاء حساب</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import router from "../router";

export default {
  data() {
    return {
      email: "",
      password: "",
      showPassword: false,
      loading: false,
    };
  },

  methods: {
    togglePassword() {
      this.showPassword = !this.showPassword;
    },

    async loginUser() {
      if (!this.email || !this.password) {
        return alert("يرجى تعبئة الحقول");
      }

      this.loading = true;

      try {
        const auth = getAuth();

        // تسجيل الدخول
        await signInWithEmailAndPassword(auth, this.email, this.password);

        const user = auth.currentUser;
        if (!user) {
          alert("حدث خطأ غير متوقع");
          return;
        }

        // جلب بيانات المستخدم
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        // 🔥 التحقق من الحظر
        if (userSnap.exists() && userSnap.data().blocked === true) {
          alert("🚫 حسابك محظور. يرجى التواصل مع الدعم.");
          await auth.signOut();
          return;
        }

        // 🔥 تسجيل دخول الأدمن
        if (
          this.email === "azad.333388@gmail.com" &&
          this.password === "admin0997408001AZAD"
        ) {
          return router.push("/admin");
        }

        // 🔥 تسجيل دخول المستخدم العادي
        router.push("/home");

      } catch (error) {
        alert("خطأ: " + error.message);
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

/* Loader */
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
