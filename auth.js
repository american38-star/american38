import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {

  // -------------------------------
  // قراءة الـ Token
  // -------------------------------
  const token = ref(localStorage.getItem('token') || '')

  // -------------------------------
  // قراءة بيانات المستخدم بدون أخطاء JSON.parse
  // -------------------------------
  let savedUser = null
  try {
    savedUser = JSON.parse(localStorage.getItem('user'))
  } catch (e) {
    savedUser = null
  }

  const user = ref(savedUser)

  // -------------------------------
  // إضافة userId (الـ UID الخاص بالمستخدم)
  // -------------------------------
  const userId = ref(user.value?.uid || '')

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
    userId.value = u?.uid || ''
    localStorage.setItem('token', t)
    localStorage.setItem('user', JSON.stringify(u))
  }

  // -------------------------------
  // تسجيل الخروج
  // -------------------------------
  function logout() {
    token.value = ''
    user.value = null
    userId.value = ''
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
    userId,  // إضافة userId
    lang,
    setAuth,
    logout,
    setLang,
  }
})
