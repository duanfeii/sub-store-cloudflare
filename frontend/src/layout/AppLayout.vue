<template>
  <div class="app-layout-wrapper">
    <router-view />
  </div>
  <TabBar v-if="shouldShowTabBar" />
</template>

<script lang="ts" setup>
  import TabBar from '@/components/TabBar.vue';
  import { computed } from 'vue';
  import { useWideScreenNarrowMode } from '@/hooks/useWideScreenNarrowMode';

  const { shouldShowTabBar } = useWideScreenNarrowMode();

  const height = computed(() => {
    if (shouldShowTabBar.value) {
      return 'calc(56px + env(safe-area-inset-bottom))';
    } else {
      return '16px';
    }
  });
</script>

<style scoped lang="scss">
  .app-layout-wrapper {
    flex: 1 1 auto;
    width: 100%;
    min-width: 0;
    min-height: 0;
    /* Reserve space for fixed NavBar (56px) + optional mobile TabBar */
    padding-top: 56px;
    padding-bottom: v-bind(height);
    box-sizing: border-box;
    overflow: auto;
  }
</style>
