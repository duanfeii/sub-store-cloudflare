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

  const topInset = computed(() => {
    return 'calc(56px + env(safe-area-inset-top, 0px))';
  });

  const height = computed(() => {
    if (shouldShowTabBar.value) {
      return 'calc(56px + env(safe-area-inset-bottom, 0px))';
    }
    // No bottom tab bar: keep a short breathing room + home-indicator inset
    return 'calc(12px + env(safe-area-inset-bottom, 0px))';
  });
</script>

<style scoped lang="scss">
  .app-layout-wrapper {
    flex: 1 1 auto;
    width: 100%;
    min-width: 0;
    min-height: 0;
    /* Fixed NavBar (56px) + notch/status safe-area */
    padding-top: v-bind(topInset);
    padding-bottom: v-bind(height);
    box-sizing: border-box;
    overflow: auto;
  }
</style>
