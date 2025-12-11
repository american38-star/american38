<template>
  <div class="profile-wrapper">
    <h2 class="title">حسابي</h2>

    <div v-if="loading" class="loading">جاري التحميل...</div>

    <div v-else class="profile-box">
      <div class="avatar"></div>

      <h3 class="username">{{ userData.username || "User" }}</h3>

      <!-- البريد الإلكتروني -->
      <div class="info-item">
        <div class="left">
          <svg class="icon" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 13L2 6.76V18h20V6.76z"/>
            <path fill="currentColor" d="M12 11l10-6H2z"/>
          </svg>
          <span class="label">البريد الإلكتروني</span>
        </div>
        <div class="value scrollable">{{ userData.email }}</div>
      </div>

      <!-- معرف المستخدم -->
      <div class="info-item">
        <div class="left">
          <svg class="icon" viewBox="0 0 24 24">
            <path fill="currentColor"
              d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          <span class="label">المعرّف (ID)</span>
        </div>

        <div class="value scrollable">{{ userData.uid }}</div>
        <button class="copy-btn" @click="copy(userData.uid)">نسخ</button>
      </div>

      <!-- تاريخ التسجيل -->
      <div class="info-item">
        <div class="left">
          <svg class="icon" viewBox="0 0 24 24">
            <path fill="currentColor"
              d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z"/>
          </svg>
          <span class="label">تاريخ التسجيل</span>
        </div>

        <div class="value">{{ formattedDate }}</div>
      </div>

      <!-- الرصيد -->
      <div class="info-item">
        <div class="left">
          <svg class="icon" viewBox="0 0 24 24">
            <path fill="currentColor"
              d="M12 1a11 11 0 1 0 11 11A11.013 11.013 0 0 0 12 1zm1 17.93V19h-2v-.07A8.005 8.005 0 0 1 4.07 13H5v-2h-.93A8.005 8.005 0 0 1 11 4.07V4h2v.07A8.005 8.005 0 0 1 19.93 11H19v2h.93A8.005 8.005 0 0 1 13 18.93z"/>
          </svg>
          <span class="label">الرصيد المتاح</span>
        </div>

        <div class="value">USDT {{ userData.balance }}</div>
      </div>

      <!-- تغيير كلمة المرور -->
      <button class="btn edit-btn" @click="changePassword">
        تغيير كلمة المرور
      </button>

      <!-- تسجيل الخروج -->
      <button class="btn logout-btn" @click="logout">
        تسجيل الخروج
      </button>
    </div>
  </div>
</template>

<script>
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default {
  name: "Profile",

  data() {
    return {
      loading: true,
      userData: {
        email: "",
        uid: "",
        createdAt: "",
        balance: 0,
        username: "",
      },
    };
  },

  computed: {
    formattedDate() {
      if (!this.userData.createdAt) return "غير متوفر";

      const date = new Date(this.userData.createdAt);
      return isNaN(date.getTime())
        ? "غير متوفر"
        : date.toLocaleDateString("ar-EG");
    },
  },

  created() {
    this.loadUserData();
  },

  methods: {
    loadUserData() {
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          this.loading = false;
          alert("يرجى تسجيل الدخول.");
          return;
        }

        try {
          const snap = await getDoc(doc(db, "users", user.uid));

          if (snap.exists()) {
            const data = snap.data();

            this.userData = {
              email: data.email || user.email,
              uid: user.uid,
              createdAt: data.createdAt || user.metadata.creationTime,
              balance: data.balance ?? 0,
              username: data.username || user.email.split("@")[0],
            };
          }
        } catch (err) {
          console.error("Error loading profile:", err);
        }

        this.loading = false;
      });
    },

    copy(text) {
      navigator.clipboard.writeText(text);
      alert("تم النسخ ✓");
    },

    changePassword() {
      alert("سيتم إضافة تغيير كلمة المرور قريبًا.");
    },

    async logout() {
      await signOut(auth);
      this.$router.push("/login");
    },
  },
};
</script>

<style scoped>
.profile-wrapper {
  padding: 20px;
  min-height: 100vh;
  text-align: center;
  direction: rtl;
  background: linear-gradient(#0d6efd, #6bb4ff);
  color: #fff;
}

.profile-box {
  background: #ffffffee;
  padding: 20px;
  border-radius: 20px;
  box-shadow: 0 6px 20px #0003;
  max-width: 420px;
  margin: auto;
  color: #000;
}

.avatar {
  width: 110px;
  height: 110px;
  background: #d9e6ff;
  border-radius: 50%;
  margin: 0 auto 12px;
  border: 4px solid #0d6efd;
}

.username {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 15px;
}

.info-item {
  display: flex;
  align-items: center;
  background: #eef4ff;
  padding: 10px;
  margin: 8px 0;
  border-radius: 12px;
  gap: 10px;
}

.left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon {
  width: 20px;
  height: 20px;
  color: #0d6efd;
}

.label {
  font-size: 14px;
  color: #333;
}

.value {
  font-weight: bold;
  font-size: 14px;
  color: #000;
  margin-left: auto;
}

.scrollable {
  max-width: 150px;
  overflow-x: auto;
  white-space: nowrap;
}

.copy-btn {
  background: #0d6efd;
  color: white;
  padding: 6px 10px;
  border-radius: 8px;
  border: none;
  font-size: 13px;
}

.btn {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: none;
  font-size: 16px;
  margin-top: 12px;
  cursor: pointer;
}

.edit-btn {
  background: #0d6efd;
  color: white;
}

.logout-btn {
  background: #ff3b30;
  color: white;
}
</style>
