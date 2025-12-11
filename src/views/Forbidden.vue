<template>
  <div class="forbidden-container">
    <h1>🚫 403</h1>
    <h2>غير مسموح لك بالدخول إلى هذه الصفحة</h2>

    <p>هذا القسم خاص بالإدارة فقط.</p>

    <button @click="$router.push('/home')" class="btn">
      العودة إلى الصفحة الرئيسية
    </button>
  </div>
</template>

<script>
export default {
  name: "Forbidden",
};
</script>

<style scoped>
.forbidden-container {
  text-align: center;
  padding: 40px;
  direction: rtl;
}

h1 {
  font-size: 80px;
  margin: 0;
  color: #ff3b30;
}

h2 {
  font-size: 22px;
  margin-top: 10px;
  color: #333;
}

p {
  margin-top: 10px;
  font-size: 16px;
}

.btn {
  margin-top: 20px;
  padding: 10px 20px;
  background: #007bff;
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 16px;
  cursor: pointer;
}
</style>
