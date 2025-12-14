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
      <div
        class="item"
        v-for="item in menu"
        :key="item.title"
        @click="go(item.route)"
      >
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

    <!-- إعلان Popup -->
    <div id="companyAd" class="ad-overlay" v-if="showAd">
      <div class="ad-box">
        <h2>إعلان</h2>

        <div class="ad-content">
          <p>
            🎉🎉🎉🎉 مرحبا بالجميع! تأسست Mall of the world في سنغافورة في 20 أغسطس 2021 ومقرها حاليًا في منطقة الأعمال المركزية في سنغافورة. نحن شركة استثمار في التجارة الإلكترونية مع فريق تقني قوي وقوة مالية قوية.
            <br>
            يتعاون Mall of the world مع عشرات شركات التجارة الإلكترونية مثل Amazon و eBay و Tiktok و Aliexpress و Alibaba و Shopee ، إلخ. لمساعدة التجار على زيادة مبيعات المنتجات الخاصة بهم ، ويمكننا أيضًا تحقيق أرباح منه.
            <br><br>
            👍1: الحد الأدنى لمبلغ إعادة الشحن: 12 USDT ، الحد الأدنى للسحب النقدي: 3 USDT
            <br>
            💰2: تستثمر المنصة على مستوى العالم ، لذا فإن الاستثمار يدعم فقط إعادة شحن العملة المشفرة.
            <br>
            🌈3: وقت إعادة تعيين المهمة هو الساعة 12 ظهراً في سنغافورة. يمكنك الحصول على الربح من خلال استكمال أوامر التاجر كل يوم (مرة واحدة في اليوم ، صالحة لمدة 365 يومًا).
            <br>
            🕯4: يمكنك سحب النقد مرة واحدة فقط في اليوم ، لا يوجد حد زمني ، يمكنك سحب النقد في أي وقت ، ووقت الانسحاب هو 1 إلى 5 دقائق ، والحد الأدنى لمبلغ السحب هو 3 USDT ، ولا يوجد حد أعلى.
            <br><br>
            عندما يصل مبلغ إعادة الشحن إلى المبلغ المقابل التالي ، سيتم ترقية الحساب تلقائيًا إلى VIP. كلما زادت مبلغ إعادة الشحن ، كلما زاد عدد USDT في اليوم!
            <br><br>
            👍vip1: إعادة شحن 12 USDT ، الإيرادات اليومية 3 USDT
            <br>
            👍vip2: إعادة الشحن 52 USDT ، الدخل اليومي 13 USDT
            <br>
            👍vip3: إعادة شحن 100 USDT ، الدخل اليومي 26 USDT
            <br>
            👍vip4: إعادة شحن 300 USDT ، الدخل اليومي 82 USDT
            <br>
            👍VIP5: إعادة شحن 500 USDT ، الدخل اليومي 145 USDT
            <br>
            👍vip6: إعادة شحن 1500 USDT ، الدخل اليومي 479 USDT
            <br>
            👍VIP7: إعادة شحن 3000 USDT ، الدخل اليومي 1078 USDT
            <br>
            👍VIP8: إعادة شحن 5000 USDT ، الدخل اليومي 2000 USDT
            <br>
            👍vip9: إعادة شحن 10000 USDT ، الدخل اليومي USDT
            <br>
            👍VIP10: إعادة شحن 30000 USDT ، الدخل اليومي 17699 USDT
            <br>
            👍VIP11: إعادة شحن 90،000 دولار أمريكي ، الدخل اليومي 81،818 USDT
            <br><br>
            يمكن للمستخدمين Mall of the world الترويج لنظامنا الأساسي من خلال روابط التوصية ودعوة أصدقائك للانضمام إلينا على Facebook و Twitter و Instagram و YouTube و Tiktok و Kaokao و WhatsApp و Telegram. عندما يسجل شخص ما وينتهي من Top-Up ، تحصل على مكافأة تصل إلى 9 ٪.
            <br><br>
            🤝team المستوى 3 إعادة شحن مكافأة تصل إلى 9 ٪
            <br>
            🤝level 1 مكافأة إعادة شحن الأعضاء: 6 ٪
            <br>
            🤝level 2 مكافأة إعادة شحن الأعضاء: 2 ٪
            <br>
            🤝level 3 مكافأة إعادة شحن الأعضاء: 1 ٪
            <br>
            🤑team إعادة شحن المستوى الأول البالغ 1000 دولار أمريكي ، ويمكنك الحصول على 60 USDT
            <br>
            🤑team إعادة الشحن الثانوي البالغ 1000 دولار أمريكي ، يمكنك الحصول على 20 USDT
            <br>
            🤑team المستوى 3 إعادة شحن 1000 USDT ، ويمكنك الحصول على 10 USDT
          </p>
        </div>

        <button @click="closeAd">أنا أعرف</button>
      </div>
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
      showAd: false,  // حالة عرض الإعلان عند الضغط على زر الشركة

      menu: [
        { title: "تعبئة رصيد", icon: "fas fa-coins", route: "/recharge" },
        { title: "سحب", icon: "fas fa-wallet", route: "/withdraw" },
        { title: "المعاملات", icon: "fas fa-history", route: "/transactions" },
        { title: "برنامج", icon: "fas fa-download", route: "/program" },
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

    // عرض الإعلان عند الضغط على زر "الشركة"
    showCompanyAd() {
      this.showAd = true;
    },

    // إغلاق الإعلان
    closeAd() {
      this.showAd = false;
    }
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

.top-left {
  display: flex;
  gap: 12px;
}

.icon {
  font-size: 22px;
  color: white;
}

.user-box {
  text-align: left;
}

.welcome {
  font-size: 16px;
  font-weight: bold;
}

.balance {
  margin-top: 4px;
  font-size: 14px;
}

/* شريط الأزرار السريعة */
.quick-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.quick-btn {
  flex: 1;
  padding: 12px;
  background: #ffffff;
  border: none;
  border-radius: 12px;
  font-weight: bold;
  color: #0d6efd;
  cursor: pointer;
}

/* شريط الإعلان */
.notice-bar {
  background: #ff5722;
  color: white;
  padding: 10px;
  border-radius: 12px;
  text-align: center;
  margin-top: 18px;
  font-weight: bold;
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
  cursor: pointer;
  transition: transform 0.2s;
}

.item:hover {
  transform: scale(1.03);
}

.icon-box {
  font-size: 28px;
  margin-bottom: 8px;
  color: #0d6efd;
}

/* البانر */
.banner img {
  width: 100%;
  border-radius: 20px;
  margin-top: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* إعلان */
.ad-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.ad-box {
  background: #eaf2ff;
  width: 90%;
  max-width: 400px;
  margin: 15% auto;
  border-radius: 15px;
  padding: 15px;
  text-align: center;
}

.ad-box h2 {
  background: #3b82f6;
  color: white;
  padding: 10px;
  border-radius: 10px;
}

.ad-content {
  max-height: 250px;
  overflow-y: auto;
  margin: 10px 0;
  font-size: 14px;
}

.ad-box button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
}
</style>
