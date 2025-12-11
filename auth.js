import { defineStore } from 'pinia'
import { ref } from 'vue'
export const useAuthStore=defineStore('auth',()=>{
 const token=ref(localStorage.getItem('token')||'')
 const user=ref(JSON.parse(localStorage.getItem('user')||'null'))
 const lang=ref(localStorage.getItem('lang')||'ar')
 function setAuth(t,u){ token.value=t; user.value=u;
  localStorage.setItem('token',t); localStorage.setItem('user',JSON.stringify(u)) }
 function logout(){ token.value=''; user.value=null;
  localStorage.removeItem('token'); localStorage.removeItem('user') }
 function setLang(code){ lang.value=code; localStorage.setItem('lang',code);
  document.documentElement.dir = code==='ar'?'rtl':'ltr' }
 if(lang.value!=='ar') document.documentElement.dir='ltr'
 return {token,user,lang,setAuth,logout,setLang}
})