<template>
  <div class="container">
    <h1 class="title">تعبئة رصيد</h1>
    <div class="login-card">
      <label style="font-weight:700;margin-bottom:8px;display:block">الاستقبال</label>
      <div style="display:flex;gap:12px;align-items:center;justify-content:center;margin-bottom:12px">
        <div style="font-weight:700">USDT</div>
      </div>

      <label style="font-weight:600;margin-bottom:8px;display:block">على الشبكة</label>
      <select v-model="network" @change="updateAddress" style="width:100%;padding:12px;border-radius:10px;margin-bottom:16px">
        <option value="erc20">ERC20</option>
        <option value="trc20">TRC20</option>
        <option value="bep20">BEP20</option>
        <option value="sol">SOL</option>
      </select>

      <div class="qr-box">
        <div style="display:flex;justify-content:center">
          <img :src="qrUrl" style="width:220px;height:220px;border-radius:12px;background:white;padding:10px" />
        </div>
        <div style="margin-top:12px;text-align:right;color:#999">عنوانك</div>
        <div style="display:flex;align-items:center;gap:10px;justify-content:space-between">
          <div style="color:green;font-weight:700;word-break:break-word;max-width:80%">{{ address }}</div>
          <div style="display:flex;gap:8px">
            <button @click="copyAddress" style="background:#fff;border:1px solid #ddd;padding:8px;border-radius:8px">نسخ</button>
          </div>
        </div>
      </div>

      <p style="font-size:13px;color:#777;margin-top:12px">فقط إرسال USDT على الشبكة المختارة إلى هذا العنوان.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const addresses = {
  erc20: "0x8574dE94D5DF925e8C9Db6282527Fd1539F9eD85",
  trc20: "TN8rsodYN8HNnBum853uENLrDDXL6BDMHk",
  bep20: "0x8574dE94D5DF925e8C9Db6282527Fd1539F9eD85",
  sol: "Hwnc8ypNMFkpEH7JP1GXgHUaYAS5fPgUhPyrtmip2zim"
}

const network = ref('erc20')
const address = ref(addresses.erc20)
const qrUrl = ref('')

function updateAddress(){
  address.value = addresses[network.value]
  // use qrserver to generate qr for address
  qrUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(address.value)}`
}

function copyAddress(){
  navigator.clipboard.writeText(address.value).then(()=>{
    alert('تم نسخ العنوان')
  })
}

onMounted(()=>{ updateAddress() })
</script>

<style scoped>
.container{max-width:420px;margin:0 auto}
.qr-box{background:#f5f6f8;padding:16px;border-radius:12px;margin-top:8px}
.login-card{background:linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.95));padding:16px;border-radius:12px}
</style>