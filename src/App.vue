<template>
  <div id="app">

    <!-- زر تغيير اللغة -->
    <div class="circle-btn lang-btn" @click="toggleLanguageMenu">
      🌐
      <span class="lang-code">{{ currentLang }}</span>
    </div>

    <!-- قائمة اللغات -->
    <div v-if="showLangMenu" class="lang-menu">
      <div 
        class="lang-item" 
        v-for="l in languages" 
        :key="l.code"
        @click="setLanguage(l)"
      >
        {{ l.name }}
      </div>
    </div>

    <!-- زر الدعم -->
    <a class="circle-btn support-btn"
       href="https://t.me/American_38X"
       target="_blank">
      🎧
    </a>

    <!-- الصفحات -->
    <router-view />

    <!-- ⭐ شريط التنقل بدون وميض ⭐ -->
    <BottomNav v-if="authLoaded && showBottomNav" />

    <!-- إعلان Popup -->
    <div id="companyAd" class="ad-overlay" v-if="showAd">
      <div class="ad-box">
        <h2>إعلان</h2>

        <div class="ad-content">
          <p>
            🎉🎉🎉 مرحبا بالجميع! تأسست Mall of the world في سنغافورة في 20 أغسطس 2021 ومقرها حاليًا في منطقة الأعمال المركزية في سنغافورة. نحن شركة استثمار في التجارة الإلكترونية مع فريق تقني قوي وقوة مالية قوية.
            <br>
            يتعاون Mall of the world مع عشرات شركات التجارة الإلكترونية مثل Amazon و eBay و Tiktok و Aliexpress و Alibaba و Shopee، إلخ. لمساعدة التجار على زيادة مبيعات المنتجات الخاصة بهم، ويمكننا أيضًا تحقيق أرباح منه.
            <br><br>
            👍1: الحد الأدنى لمبلغ إعادة الشحن: 12 USDT، الحد الأدنى للسحب النقدي: 3 USDT
            <br>
            💰2: تستثمر المنصة على مستوى العالم.
            <br>
            🌈3: وقت إعادة تعيين المهمة هو الساعة 12 ظهراً.
            <br>
            🕯4: يمكنك سحب النقد مرة واحدة فقط في اليوم.
          </p>
        </div>

        <button @click="closeAd">أنا أعرف</button>
      </div>
    </div>
  </div>
</template>

<script>
import BottomNav from "./components/BottomNav.vue";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default {
  components: { BottomNav },

  data() {
    return {
      authLoaded: false,
      user: null,

      showLangMenu: false,
      currentLang: "AR", // الافتراضي

      showAd: false,  // حالة الإعلان

      languages: [
        { name: "Polski", code: "PL" },
        { name: "English", code: "EN" },
        { name: "Français", code: "FR" },
        { name: "Italiano", code: "IT" },
        { name: "日本語", code: "JP" },
        { name: "한국인", code: "KR" },
        { name: "Deutsch", code: "DE" },
        { name: "Русский", code: "RU" },
        { name: "Tiếng Việt", code: "VI" },
        { name: "Português", code: "PT" },
        { name: "Türkçe", code: "TR" },
        { name: "Español", code: "ES" },
        { name: "فارسی", code: "FA" },
        { name: "العربي", code: "AR" }
      ]
    };
  },

  created() {
    const auth = getAuth();

    // استرجاع اللغة المحفوظة
    const saved = localStorage.getItem("app_language");
    if (saved) this.currentLang = saved;

    onAuthStateChanged(auth, (u) => {
      this.user = u;
      this.authLoaded = true;
      
      // إظهار الإعلان بعد تسجيل الدخول
      if (this.user) {
        this.showAd = true;
      }
    });
  },

  computed: {
    showBottomNav() {
      if (!this.user) return false;

      const path = this.$route.path;
      const hidden = ["/login", "/register", "/admin", "/403"];

      return !hidden.some((r) => path.startsWith(r));
    }
  },

  methods: {
    toggleLanguageMenu() {
      this.showLangMenu = !this.showLangMenu;
    },

    setLanguage(lang) {
      this.currentLang = lang.code;
      localStorage.setItem("app_language", lang.code);
      this.showLangMenu = false;
    },

    closeAd() {
      this.showAd = false; // إغلاق الإعلان
    }
  }
};
</script>

<style>
body {
  margin: 0;
}

.circle-btn {
  position: fixed;
  top: 90px;
  width: 48px;
  height: 48px;
  background: #ffffff;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #333;
  font-size: 20px;
  cursor: pointer;
  z-index: 9999;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  flex-direction: column;
}

.lang-code {
  font-size: 10px;
  margin-top: -4px;
  opacity: 0.8;
}

.lang-btn {
  right: 15px;
}

/* القائمة */
.lang-menu {
  position: fixed;
  top: 145px;
  right: 15px;
  width: 140px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
  z-index: 9999;
  overflow: hidden;
}

.lang-item {
  padding: 10px;
  font-size: 15px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  text-align: right;
}

.lang-item:last-child {
  border-bottom: none;
}

.lang-item:hover {
  background: #f5faff;
}

.support-btn {
  left: 15px;
  text-decoration: none;
}

/* إعلان Popup */
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
