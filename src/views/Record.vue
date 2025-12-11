<template>
  <div class="record-page">

    <h2 class="title">سجل العمليات</h2>

    <!-- Tabs -->
    <div class="tabs">
      <button 
        v-for="t in tabs" 
        :key="t" 
        class="tab"
        :class="{ active: currentTab === t }"
        @click="currentTab = t"
      >
        {{ t }}
      </button>
    </div>

    <!-- القائمة -->
    <div v-if="filtered.length === 0" class="empty">
      لا يوجد سجلات حالياً.
    </div>

    <div class="record-box" v-for="item in filtered" :key="item.id">

      <div class="row1">
        <span class="type">{{ item.type }}</span>
        <span class="amount">{{ item.amount }} USDT</span>
      </div>

      <div class="row2">
        <span class="date">{{ item.date }}</span>
        <span 
          class="status" 
          :class="item.status"
        >
          {{ translateStatus(item.status) }}
        </span>
      </div>

    </div>

  </div>
</template>

<script>
export default {
  name: "Record",
  data() {
    return {
      tabs: ["الإيداع", "السحب", "المهام"],
      currentTab: "الإيداع",
      records: [
        { id: 1, type: "إيداع", amount: 50, date: "2025-01-01", status: "success" },
        { id: 2, type: "سحب", amount: 20, date: "2025-01-03", status: "pending" },
        { id: 3, type: "مهمة", amount: 3, date: "2025-01-04", status: "success" },
        { id: 4, type: "إيداع", amount: 100, date: "2025-01-05", status: "failed" }
      ]
    };
  },
  computed: {
    filtered() {
      if (this.currentTab === "الإيداع") {
        return this.records.filter(r => r.type === "إيداع");
      }
      if (this.currentTab === "السحب") {
        return this.records.filter(r => r.type === "سحب");
      }
      if (this.currentTab === "المهام") {
        return this.records.filter(r => r.type === "مهمة");
      }
      return [];
    }
  },
  methods: {
    translateStatus(s) {
      return {
        success: "✔ ناجح",
        pending: "⌛ قيد المراجعة",
        failed: "❌ مرفوض"
      }[s];
    }
  }
};
</script>

<style scoped>
.record-page {
  padding: 15px;
  direction: rtl;
  background: #f4f7ff;
  min-height: 100vh;
}

.title {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
}

/* Tabs */
.tabs {
  display: flex;
  background: white;
  padding: 5px;
  border-radius: 15px;
  margin-bottom: 20px;
}

.tab {
  flex: 1;
  padding: 12px;
  border: none;
  background: transparent;
  font-size: 16px;
  cursor: pointer;
  border-radius: 12px;
}

.tab.active {
  background: #0d6efd;
  color: white;
}

/* سجل */
.record-box {
  background: white;
  padding: 15px;
  border-radius: 15px;
  box-shadow: 0 2px 8px #0002;
  margin-bottom: 12px;
}

.row1, .row2 {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.amount {
  font-weight: bold;
}

.status {
  font-weight: bold;
}

.status.success {
  color: green;
}

.status.pending {
  color: orange;
}

.status.failed {
  color: red;
}

.empty {
  text-align: center;
  padding: 20px;
  opacity: 0.6;
}
</style>
