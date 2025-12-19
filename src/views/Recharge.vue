<template>
  <div class="recharge-page">
    <div class="card">
      <h2 class="title">تعبئة الرصيد (USDT)</h2>

      <!-- اختيار الشبكة -->
      <div class="field network-field">
        <label>اختر الشبكة</label>
        <div class="network-row">
          <div class="usdt-badge">USDT</div>
          <select v-model="network" class="small-select">
            <option value="TRC20">TRC20</option>
            <option value="ERC20">ERC20</option>
            <option value="BEP20">BEP20</option>
            <option value="SOL">SOL</option>
          </select>
        </div>
      </div>

      <!-- QR -->
      <div class="qr-box">
        <img :src="getQr(network)" alt="QR" class="qr" />
      </div>

      <!-- عنوان المحفظة -->
      <div class="field">
        <label>عنوان المحفظة</label>
        <div class="address-row">
          <button class="copy-btn" @click="copyAddress">نسخ</button>

          <input
            class="address-input"
            :value="getAddress(network)"
            readonly
            ref="addrInput"
            @click="$refs.addrInput.select()"
          />
        </div>
        <div v-if="copied" class="copy-msg">تم النسخ ✓</div>
      </div>

      <!-- المبلغ -->
      <div class="field">
        <label>المبلغ (USDT)</label>
        <input
          class="input"
          type="number"
          v-model.number="amount"
          placeholder="أدخل المبلغ"
        />
      </div>

      <!-- TxID -->
      <div class="field">
        <label>معرف التحويل (TxID)</label>
        <input
          class="input"
          type="text"
          v-model="txid"
          placeholder="مثال: TX123..."
        />
      </div>

      <!-- زر الإرسال -->
      <button class="btn primary" @click="submit" :disabled="loading">
        {{ loading ? "جارٍ الإرسال..." : "إرسال طلب التعبئة" }}
      </button>

      <!-- رسالة -->
      <div
        v-if="message"
        class="message"
        :class="{ error: messageType === 'error' }"
      >
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script>
import { getAuth } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export default {
  name: "Recharge",

  data() {
    return {
      network: "TRC20",
      amount: null,
      txid: "",
      copied: false,
      loading: false,
      message: "",
      messageType: "info",

      addresses: {
        TRC20: "TNabUE7114PbHQ4PYK4y53fMBANQ6Q837R",
        ERC20: "0x8A52D2e160DD3F2AC524e2c60acb9cA990c5A070",
        BEP20: "0x8A52D2e160DD3F2AC524e2c60acb9cA990c5A070",
        SOL: "4AKmCRQ5sewUiJ8YRqSbBjr817byg829hswXQ9pT7gW9",
      },

      userEmail: "",
      userId: "",
    };
  },

  created() {
    const auth = getAuth();
    auth.onAuthStateChanged((u) => {
      if (u) {
        this.userEmail = u.email;
        this.userId = u.uid;
      }
    });
  },

  methods: {
    /***
     * إصلاح مشكلة QR — الآن يعمل دائماً على Vercel بدون require
     */
    getQr(net) {
      return `/qr/${net}.png`;
    },

    getAddress(net) {
      return this.addresses[net] || "";
    },

    async copyAddress() {
      const text = this.getAddress(this.network);
      if (!text) return;

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const input = this.$refs.addrInput;
          input.removeAttribute("readonly");
          input.select();
          document.execCommand("copy");
          input.setAttribute("readonly", true);
        }

        this.copied = true;
        setTimeout(() => (this.copied = false), 1500);
      } catch (err) {
        alert("فشل النسخ — قم بالنسخ يدوياً.");
      }
    },

    async submit() {
      this.message = "";

      if (!this.userId) {
        this.message = "يرجى الانتظار… يتم تسجيل الدخول";
        this.messageType = "error";
        return;
      }

      if (!this.amount || this.amount <= 0) {
        this.message = "أدخل مبلغ صالح.";
        this.messageType = "error";
        return;
      }

      if (!this.txid || this.txid.trim() === "") {
        this.message = "أدخل معرف التحويل (TxID).";
        this.messageType = "error";
        return;
      }

      this.loading = true;

      try {
        // 1. حفظ في payments (كما كان)
        await addDoc(collection(db, "payments"), {
          userId: this.userId,
          email: this.userEmail,
          amount: this.amount,
          txid: this.txid,
          network: this.network,
          status: "pending",
          createdAt: serverTimestamp(),
        });

        // 2. ✅ أضفت هذا: حفظ في transactions لكي تظهر في صفحة المعاملات
        await addDoc(collection(db, "transactions"), {
          userId: this.userId,
          email: this.userEmail,
          type: "recharge",
          amount: this.amount,
          network: this.network,
          txid: this.txid,
          status: "pending",
          reason: "",
          adminMessage: "",
          createdAt: serverTimestamp(),
        });

        this.message = "✔ تم إرسال طلب التعبئة بنجاح.";
        this.messageType = "info";

        this.amount = null;
        this.txid = "";
      } catch (err) {
        console.error(err);
        this.message = "حدث خطأ أثناء الإرسال.";
        this.messageType = "error";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.recharge-page {
  display: flex;
  justify-content: center;
  padding: 10px;
}

.card {
  width: 100%;
  max-width: 420px;
  background: white;
  padding: 18px;
  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(9, 30, 66, 0.05);
  margin-bottom: 80px;
}

.title {
  text-align: center;
  font-size: 20px;
  color: #0b5cff;
  margin-bottom: 16px;
}

.network-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.usdt-badge {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #f4fbff;
  font-weight: 900;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #0b5cff;
}

.small-select {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
}

.qr-box {
  display: flex;
  justify-content: center;
  margin: 18px 0;
}

.qr {
  width: 150px;
  height: 150px;
  border-radius: 12px;
}

.field {
  margin-bottom: 16px;
}

.field label {
  font-size: 14px;
  margin-bottom: 6px;
  display: block;
}

.address-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.copy-btn {
  padding: 10px 14px;
  background: #0b5cff;
  color: white;
  border-radius: 12px;
  border: none;
  font-weight: 900;
}

.address-input {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #e6eefc;
}

.btn.primary {
  width: 100%;
  padding: 16px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(90deg, #007bff, #00c6ff);
  color: white;
  font-size: 17px;
  font-weight: 900;
}

.message {
  margin-top: 12px;
  padding: 12px;
  border-radius: 12px;
  background: #eef7ff;
  color: #0b5cff;
}

.message.error {
  background: #ffe3e3;
  color: #bb0000;
}
</style>
