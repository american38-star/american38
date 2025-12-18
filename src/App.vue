<template>
  <div id="app">

    <!-- زر تغيير اللغة -->
    <div class="circle-btn lang-btn" @click="toggleLanguageMenu">
      🌐
      <span class="lang-code">{{ currentLang }}</span>
    </div>

    <!-- زر بابلوين (فقاعة) لعرض السنة الجديدة -->
    <div class="bubble-chat-btn" @click="toggleNewYearMessage">
      <div class="bubble-chat-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" 
                fill="#3b82f6" stroke="#3b82f6" stroke-width="1.5"/>
          <path d="M7 9H17M7 13H14" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="bubble-notification">🎉</div>
    </div>

    <!-- نافذة بابلوين للرسالة -->
    <div v-if="showNewYearMessage" class="bubble-chat-overlay" @click="closeNewYearMessage">
      <div class="bubble-chat-window" @click.stop>
        <div class="bubble-chat-header">
          <div class="bubble-chat-title">
            <div class="bubble-avatar">🎁</div>
            <div>
              <div class="bubble-sender">Mall of the World</div>
              <div class="bubble-time">عرض خاص</div>
            </div>
          </div>
          <button class="bubble-close-btn" @click="closeNewYearMessage">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="#666" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        
        <div class="bubble-chat-body">
          <div class="bubble-message bubble-received">
            <div class="bubble-tail"></div>
            <div class="bubble-content">
              <strong>🎉✨ عرض رأس السنة الجديد – فرصة ذهبية! ✨🎉</strong>
              <br><br>
              بمناسبة حلول رأس السنة الجديدة، يسرّ Mall of the World أن يقدّم لكم عرضًا خاصًا ومحدودًا 🎁
              <br><br>
              <strong>🔔 تفاصيل العرض:</strong><br>
              قم بدعوة 10 أشخاص جدد للتسجيل في المنصة، ويجب على كل شخص منهم القيام بشحن رصيد بقيمة 100 دولار.
              <br><br>
              <strong>🎁 المكافأة:</strong><br>
              عند استيفاء الشروط كاملة، ستحصل مباشرة على جائزة نقدية بقيمة 100 دولار 💰
              <br><br>
              <strong>📌 الشروط:</strong><br>
              • الدعوات يجب أن تكون عن طريق رابط الإحالة الخاص بك<br>
              • كل مستخدم مدعو يجب أن يشحن 100 دولار على الأقل<br>
              • العرض ساري لفترة محدودة بمناسبة رأس السنة
              <br><br>
              <strong>🚀 لا تفوّت الفرصة، ابدأ بدعوة أصدقائك الآن واحتفل بالعام الجديد مع أرباح حقيقية!</strong>
              <br><br>
              <em>🎆 Mall of the World يتمنى لكم سنة جديدة مليئة بالنجاح والربح 🎆</em>
            </div>
            <div class="bubble-time">12:00</div>
          </div>
        </div>
        
        <div class="bubble-chat-footer">
          <button class="bubble-action-btn" @click="closeNewYearMessage">
            فهمت وشكرًا! 🎯
          </button>
        </div>
      </div>
    </div>

    <!-- زر الدعم -->
    <a class="circle-btn support-btn"
       href="https://t.me/mall_oftheworld"
       target="_blank">
      🎧
    </a>

    <!-- زر انستغرام -->
    <a class="circle-btn instagram-btn"
       href="https://www.instagram.com/mall_oftheworld?igsh=OXR1emp3N2k2d2Yz"
       target="_blank">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.8 2H16.2C19.4 2 22 4.6 22 7.8V16.2C22 19.4 19.4 22 16.2 22H7.8C4.6 22 2 19.4 2 16.2V7.8C2 4.6 4.6 2 7.8 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12C8.5 13.933 10.067 15.5 12 15.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M17.5 6.5H17.51" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </a>

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
            🎉🎉🎉🎉 مرحبا بالجميع! تأسست Mall of the world في سنغافورة في 20 أغسطس 2021 ومقرها حاليًا في منطقة الأعمال المركزية في سنغافورة. نحن شركة استثمار في التجارة الإلكترونية مع فريق تقني قوي وقوة مالية قوية. يتعاون Mall of the world مع عشرات شركات التجارة الإلكترونية مثل Amazon و eBay و Tiktok و Aliexpress و Alibaba و Shopee ، إلخ. لمساعدة التجار على زيادة مبيعات المنتجات الخاصة بهم ، ويمكننا أيضًا تحقيق أرباح منه. عندما تتصاعد على منصتنا ، تشارك في مساعدة البائعين على زيادة المبيعات ، بحيث يمكنك أيضًا كسب المال منها. حتى يتمكن الجميع من إعادة الشحن بثقة ، هذا مشروع جيد لجني الأموال. 🔇🔇🔇
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
      showNewYearMessage: false, // حالة رسالة السنة الجديدة

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
    },

    toggleNewYearMessage() {
      this.showNewYearMessage = !this.showNewYearMessage;
    },

    closeNewYearMessage() {
      this.showNewYearMessage = false;
    }
  }
};
</script>

<style>
body {
  margin: 0;
}

/* الأزرار الأساسية */
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
  text-decoration: none;
}

.lang-code {
  font-size: 10px;
  margin-top: -4px;
  opacity: 0.8;
}

.lang-btn {
  right: 15px;
}

/* زر بابلوين */
.bubble-chat-btn {
  position: fixed;
  top: 90px;
  right: 70px;
  width: 48px;
  height: 48px;
  background: #3b82f6;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 9999;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
  transition: all 0.3s ease;
}

.bubble-chat-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.bubble-chat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.bubble-notification {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ef4444;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* نافذة بابلوين */
.bubble-chat-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.bubble-chat-window {
  width: 90%;
  max-width: 400px;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  animation: bubbleSlide 0.3s ease;
}

@keyframes bubbleSlide {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.bubble-chat-header {
  background: #3b82f6;
  color: white;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bubble-chat-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bubble-avatar {
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #3b82f6;
}

.bubble-sender {
  font-weight: bold;
  font-size: 16px;
}

.bubble-time {
  font-size: 12px;
  opacity: 0.8;
}

.bubble-close-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: background 0.2s;
}

.bubble-close-btn:hover {
  background: rgba(255,255,255,0.2);
}

/* جسم المحادثة */
.bubble-chat-body {
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.bubble-message {
  position: relative;
  margin-bottom: 16px;
}

.bubble-received {
  text-align: right;
}

.bubble-tail {
  position: absolute;
  bottom: -8px;
  right: 10px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid #e5e7eb;
}

.bubble-content {
  background: #e5e7eb;
  padding: 12px 16px;
  border-radius: 18px;
  border-top-right-radius: 4px;
  display: inline-block;
  max-width: 100%;
  text-align: right;
  line-height: 1.5;
  font-size: 14px;
}

.bubble-message .bubble-time {
  font-size: 11px;
  color: #666;
  margin-top: 4px;
  text-align: right;
}

/* تذييل بابلوين */
.bubble-chat-footer {
  padding: 16px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.bubble-action-btn {
  width: 100%;
  padding: 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s;
}

.bubble-action-btn:hover {
  background: #2563eb;
}

/* زر انستغرام */
.instagram-btn {
  left: 75px; /* تحت زر الدعم مباشرة */
  top: 90px;
}

.instagram-btn svg {
  fill: none;
  stroke: #E1306C; /* اللون الوردي المشهور لانستغرام */
  stroke-width: 1.5;
}

.support-btn {
  left: 15px;
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

/* تكييفات للهواتف */
@media (max-width: 768px) {
  .bubble-chat-btn {
    right: 70px;
  }
  
  .bubble-chat-window {
    width: 95%;
    max-height: 80vh;
  }
}
</style>
