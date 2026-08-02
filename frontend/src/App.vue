<template>
  <div class="app-shell">
    <div class="app-shell__main">
      <NavBar />
      <main class="page-body">
        <!-- Unauthorized / backend unreachable: always show in-page token form -->
        <AdminTokenPanel v-if="showAuthGate" />
        <router-view v-else />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import AdminTokenPanel from "@/components/AdminTokenPanel.vue";
import NavBar from "@/components/NavBar.vue";
import { useThemes } from "@/hooks/useThemes";
import { useGlobalStore } from "@/store/global";
import { useSubsStore } from "@/store/subs";
import { getFlowsUrlList } from "@/utils/getFlowsUrlList";
import { initStores } from "@/utils/initApp";
import { storeToRefs } from "pinia";
import { computed, ref, watchEffect, onMounted } from "vue";

const subsStore = useSubsStore();
const globalStore = useGlobalStore();

const { subs, flows } = storeToRefs(subsStore);
const { isLoading, fetchResult } = storeToRefs(globalStore);

const allLength = ref(null);

/** After first load finishes without success, block pages behind the token form. */
const showAuthGate = computed(
  () => !isLoading.value && !fetchResult.value,
);

useThemes();

onMounted(() => {
  // Silent boot: do not toast "数据刷新完成" on every page entry.
  // Refresh button paths still call initStores(true, ...).
  initStores(false, true, false);
});

watchEffect(() => {
  const flowKeys = getFlowsUrlList(subs.value).map(([url]) => url);
  allLength.value = flowKeys.length;
  globalStore.setFlowFetching(
    flowKeys.some(url => !(url in flows.value)),
  );
});
</script>

<style lang="scss">
#app {
  font-family: var(--font-sans), "nutui-iconfont", sans-serif;
  position: absolute;
  min-height: 100%;
  width: 100%;
  background: var(--background-color);
  overflow: hidden;
  overflow-y: auto;
}

// Chinese / CJK: avoid English-tuned negative tracking on titles
:lang(zh),
:lang(zh-CN),
:lang(zh-TW),
:lang(zh-HK) {
  h1, h2, h3,
  .nav-title,
  .app-brand__name {
    letter-spacing: 0;
  }
}

.app-shell {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-height: 100%;
  width: 100%;
  box-sizing: border-box;
}

.app-shell__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 100%;
  width: 100%;
  box-sizing: border-box;
}

.page-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
  width: 100%;
  max-width: $content-max-width;
  margin-left: auto;
  margin-right: auto;
  min-width: 0;
  box-sizing: border-box;
  /* Slightly tighter horizontal pad on phones; desktop keeps 24px */
  padding: 12px 14px 20px;

  @media screen and (min-width: $breakpoint-sm) {
    padding: 16px 16px 24px;
  }

  @media screen and (min-width: $breakpoint-md) {
    padding-left: 24px;
    padding-right: 24px;
  }
}
</style>
