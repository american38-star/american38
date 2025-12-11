<template>
  <div class="task-container">

    <!-- العنوان -->
    <div class="header">
      <h2>المهام اليومية</h2>
      <p>أكمل مهامك اليومية لتحصل على الأرباح</p>
    </div>

    <!-- العداد -->
    <div class="countdown-box">
      ⏳ إعادة التعيين اليومية بعد:
      <span class="time">{{ formattedTime }}</span>
    </div>

    <!-- إحصائيات -->
    <div class="stats-box">
      <div class="stat">
        <p class="value">{{ tasksDone }}</p>
        <p class="label">المهام المنجزة</p>
      </div>

      <div class="stat">
        <p class="value">{{ tasks.length }}</p>
        <p class="label">إجمالي المهام</p>
      </div>
    </div>

    <!-- قائمة المهام -->
    <div class="task-card" v-for="task in tasks" :key="task.id">

      <div class="task-info">
        <h3>{{ task.title }}</h3>
        <p class="desc">ربح المهمة: {{ task.reward }} USDT</p>
      </div>

      <button
        class="btn"
        :class="task.done ? 'disabled' : ''"
        @click="startTask(task)"
      >
        {{ task.done ? 'مكتملة ✔' : 'بدء المهمة' }}
      </button>

    </div>

  </div>
</template>

<script>
export default {
  name: "Task",

  data() {
    return {
      tasksDone: 0,
      nextResetTime: null,
      timer: null,

      tasks: [
        { id: 1, title: "مهمة رقم 1", reward: 3.00, done: false },
        { id: 2, title: "مهمة رقم 2", reward: 3.00, done: false },
        { id: 3, title: "مهمة رقم 3", reward: 3.00, done: false },
      ]
    };
  },

  computed: {
    formattedTime() {
      const diff = this.getRemainingTime();

      const h = String(Math.floor(diff / 3600)).padStart(2, "0");
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
      const s = String(diff % 60).padStart(2, "0");

      return `${h}:${m}:${s}`;
    }
  },

  methods: {
    startTask(task) {
      if (task.done) return;

      task.done = true;
      this.tasksDone++;

      alert(`تم إكمال المهمة! ربحت: ${task.reward} USDT`);
    },

    getRemainingTime() {
      const now = Math.floor(Date.now() / 1000);
      const diff = this.nextResetTime - now;

      return diff > 0 ? diff : 0;
    },

    resetTasks() {
      this.tasks.forEach(t => (t.done = false));
      this.tasksDone = 0;
    },

    initializeCountdown() {
      const saved = localStorage.getItem("nextResetTime");

      if (saved) {
        this.nextResetTime = Number(saved);
      } else {
        this.setNewResetTime();
      }

      this.timer = setInterval(() => {
        const remaining = this.getRemainingTime();

        if (remaining <= 0) {
          this.resetTasks();
          this.setNewResetTime();
        }
      }, 1000);
    },

    setNewResetTime() {
      const now = Math.floor(Date.now() / 1000);
      this.nextResetTime = now + 24 * 60 * 60;

      localStorage.setItem("nextResetTime", this.nextResetTime);
    }
  },

  mounted() {
    this.initializeCountdown();
  },

  beforeUnmount() {
    clearInterval(this.timer);
  }
};
</script>

<style scoped>
.task-container {
  padding: 15px;
  direction: rtl;
  background: #f1f5ff;
  min-height: 100vh;
}

/* العنوان */
.header {
  text-align: center;
  margin-bottom: 12px;
}

.header h2 {
  color: #0d6efd;
  font-weight: bold;
}

.countdown-box {
  background: #fff;
  padding: 10px;
  border-radius: 14px;
  text-align: center;
  font-weight: bold;
  color: #0d6efd;
  margin-bottom: 15px;
  box-shadow: 0 1px 10px #0002;
}

.time {
  color: #ff0000;
}

/* الإحصائيات */
.stats-box {
  display: flex;
  justify-content: space-around;
  background: #0d6efd;
  border-radius: 18px;
  padding: 15px;
  color: white;
  margin-bottom: 18px;
}

.stat {
  text-align: center;
}

.value {
  font-size: 22px;
  font-weight: bold;
}

/* البطاقات */
.task-card {
  background: white;
  padding: 18px;
  border-radius: 18px;
  margin-bottom: 15px;
  box-shadow: 0 2px 10px #0001;
}

.task-info h3 {
  font-weight: bold;
}

.desc {
  color: #444;
}

/* الزر */
.btn {
  width: 100%;
  padding: 12px;
  background: #0d6efd;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 17px;
  font-weight: bold;
  margin-top: 12px;
}

.disabled {
  background: #999 !important;
}
</style>
