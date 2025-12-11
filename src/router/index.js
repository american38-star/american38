import { createRouter, createWebHistory } from "vue-router";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// ===== Import Views =====
import Login from "../views/Login.vue";
import Register from "../views/Register.vue";
import Home from "../views/Home.vue";
import Tasks from "../views/Tasks.vue";
import VIP from "../views/VIP.vue";
import Profile from "../views/Profile.vue";
import Recharge from "../views/Recharge.vue";
import Withdraw from "../views/Withdraw.vue";
import Team from "../views/Team.vue";
import Admin from "../views/Admin.vue";
import Forbidden from "../views/Forbidden.vue";

// ===== Admin Emails =====
const admins = [
  "azad.333388@gmail.com",
  "admin2@gmail.com",
  "owner@gmail.com",
];

// ===== Routes =====
const routes = [
  { path: "/", redirect: "/login" },

  {
    path: "/login",
    name: "login",
    component: Login,
    meta: { guestOnly: true },
  },
  {
    path: "/register",
    name: "register",
    component: Register,
    meta: { guestOnly: true },
  },

  // Authenticated Routes
  { path: "/home", component: Home, meta: { requiresAuth: true } },
  { path: "/tasks", component: Tasks, meta: { requiresAuth: true } },
  { path: "/vip", component: VIP, meta: { requiresAuth: true } },
  { path: "/profile", component: Profile, meta: { requiresAuth: true } },
  { path: "/recharge", component: Recharge, meta: { requiresAuth: true } },
  { path: "/withdraw", component: Withdraw, meta: { requiresAuth: true } },
  { path: "/team", component: Team, meta: { requiresAuth: true } },

  // Admin
  { path: "/admin", component: Admin, meta: { requiresAdmin: true } },

  { path: "/403", component: Forbidden },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// ===================================================
// 🔥 حل مشكلة التأخير في Firebase Auth
// ===================================================
let authReady = false;
let currentUser = null;

const auth = getAuth();

// تحميل المستخدم مرة واحدة فقط
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  authReady = true;
});

// ===================================================
// 🔥 Navigation Guard
// ===================================================
router.beforeEach(async (to, from, next) => {
  // انتظر تحميل حالة تسجيل الدخول Firebase
  if (!authReady) {
    await new Promise((resolve) => {
      const timer = setInterval(() => {
        if (authReady) {
          clearInterval(timer);
          resolve();
        }
      }, 20);
    });
  }

  const { requiresAuth, guestOnly, requiresAdmin } = to.meta;

  // ===================== الضيوف فقط =====================
  if (guestOnly && currentUser) {
    return admins.includes(currentUser.email)
      ? next("/admin")
      : next("/home");
  }

  // ===================== يحتاج تسجيل دخول =====================
  if (requiresAuth && !currentUser) {
    return next("/login");
  }

  // ===================== يحتاج أن يكون أدمن =====================
  if (requiresAdmin) {
    if (currentUser && admins.includes(currentUser.email)) {
      return next();
    } else {
      return next("/403");
    }
  }

  return next();
});

export default router;
