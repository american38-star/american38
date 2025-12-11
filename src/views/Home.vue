<template>
  <div class="home-container">

    <!-- الشريط العلوي -->
    <div class="top-bar">
      <div class="top-left">
        <i class="fas fa-headset icon"></i>
        <i class="fas fa-envelope icon"></i>
      </div>

      <div class="user-box">
        <div class="welcome">مرحبا، {{ username }}</div>
        <div class="balance">الرصيد: <strong>{{ balance }} USDT</strong></div>
      </div>

      <div class="lang-box">
        <i class="fas fa-globe"></i>
        عربي
      </div>
    </div>

    <!-- شريط الأزرار -->
    <div class="quick-buttons">
      <button class="quick-btn">وفر الوقت ⏱</button>
      <button class="quick-btn">وفر المال 💰</button>
    </div>

    <!-- شريط الإعلان -->
    <div class="notice-bar">
      🔊 شراكة عالمية مع Amazon, eBay, Etsy, Walmart وأكثر!
    </div>

    <!-- القائمة الرئيسية -->
    <div class="grid-menu">
      <div class="item" v-for="item in menu" :key="item.title" @click="go(item.route)">
        <div class="icon-box">
          <i :class="item.icon"></i>
        </div>
        <p>{{ item.title }}</p>
      </div>
    </div>

    <!-- البانر -->
    <div class="banner">
      <img src="https://i.ibb.co/H7J3mpm/amazon-banner.jpg" />
    </div>

  </div>
</template>

<script>
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default {
  name: "Home",

  data() {
    return {
      username: "جاري التحميل...",
      balance: 0,

      menu: [
        { title: "تعبئة رصيد", icon: "fas fa-coins", route: "/recharge" },
        { title: "سحب", icon: "fas fa-wallet", route: "/withdraw" },
        { title: "برنامج", icon: "fas fa-download", route: "/program" },
        { title: "الشركة", icon: "fas fa-building", route: "/company" },
        { title: "الأصدقاء", icon: "fas fa-users", route: "/team" },
        { title: "الوكالات", icon: "fas fa-id-card", route: "/agency" }
      ]
    };
  },

  created() {
    this.watchUser();
  },

  methods: {
    // 🔥 مراقبة حالة تسجيل الدخول
    watchUser() {
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          this.username = "غير مسجل";
          this.balance = 0;
          return;
        }

        await this.loadUserData(user.uid, user.email);
      });
    },

    // 🔥 تحميل بيانات المستخدم من Firestore
    async loadUserData(uid, email) {
      try {
        const snap = await getDoc(doc(db, "users", uid));

        if (snap.exists()) {
          const data = snap.data();

          this.username = data.username || data.email || email;
          this.balance = data.balance ?? 0;
        } else {
          // إذا ما لقى الوثيقة
          this.username = email;
          this.balance = 0;
        }
      } catch (err) {
        console.error("Error loading user data:", err);
        this.username = email;
        this.balance = 0;
      }
    },

    go(route) {
      this.$router.push(route);
    },
  }
};
</script>

<style scoped>
.home-container {
  direction: rtl;
  padding: 12px;
  background: linear-gradient(#0d6efd, #6bb4ff);
  min-height: 100vh;
  color: #fff;
}

/* الشريط العلوي */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* القائمة الرئيسية */
.grid-menu {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
  margin-top: 20px;
}

.item {
  background: #ffffffaa;
  color: #000;
  padding: 22px 10px;
  border-radius: 22px;
  text-align: center;
  font-weight: bold;
}

/* البانر */
.banner img {
  width: 100%;
  border-radius: 20px;
  margin-top: 25px;
}
</style>
