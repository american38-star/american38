import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {

  // -------------------------------
  // قراءة الـ Token
  // -------------------------------
  const token = ref(localStorage.getItem('token') || '')

  // -------------------------------
  // قراءة بيانات المستخدم بشكل آمن
  // -------------------------------
  const user = ref(null)

  try {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      user.value = JSON.parse(savedUser)
    }
  } catch (e) {
    console.error("خطأ في قراءة بيانات المستخدم:", e)
  }

  // -------------------------------
  // اللغة
  // -------------------------------
  const lang = ref(localStorage.getItem('lang') || 'ar')
  document.documentElement.dir = lang.value === 'ar' ? 'rtl' : 'ltr'

  // -------------------------------
  // تخزين معلومات المستخدم
  // -------------------------------
  function setAuth(t, u) {
    token.value = t
    user.value = u
    localStorage.setItem('token', t)
    localStorage.setItem('user', JSON.stringify(u))
  }

  // -------------------------------
  // تسجيل الخروج
  // -------------------------------
  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  // -------------------------------
  // تغيير اللغة
  // -------------------------------
  function setLang(code) {
    lang.value = code
    localStorage.setItem('lang', code)
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr'
  }

  return {
    token,
    user,
    lang,
    setAuth,
    logout,
    setLang,
  }
})
