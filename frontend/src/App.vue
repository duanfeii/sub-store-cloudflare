<template>
  <div
    class="app-shell"
    :class="{
      'app-shell--sidenav': shouldShowSideBar,
      'app-shell--sidenav-expanded': shouldShowSideBar && isSideNavExpanded,
    }"
  >
    <SideBar v-show="shouldShowSideBar" />
    <div class="app-shell__main">
      <NavBar />
      <main class="page-body">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import SideBar from "@/components/SideBar.vue";
import NavBar from "@/components/NavBar.vue";
import { useWideScreenNarrowMode } from "@/hooks/useWideScreenNarrowMode";
import { useThemes } from "@/hooks/useThemes";
import { useGlobalStore } from "@/store/global";
import { useSubsStore } from "@/store/subs";
import { SIDEBAR_EXPANDED_BREAKPOINT } from "@/store/system";
import { getFlowsUrlList } from "@/utils/getFlowsUrlList";
import { initStores } from "@/utils/initApp";
import { useWindowSize } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { computed, ref, watchEffect, onMounted } from "vue";

const subsStore = useSubsStore();
const globalStore = useGlobalStore();
const { shouldShowSideBar } = useWideScreenNarrowMode();
const { width: windowWidth } = useWindowSize();

const isSideNavExpanded = computed(
  () => windowWidth.value >= SIDEBAR_EXPANDED_BREAKPOINT,
);

const { subs, flows } = storeToRefs(subsStore);

const allLength = ref(null);

useThemes();

onMounted(() => {
  initStores(true, true, false);
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
  // Default: no sidenav offset (mobile / routes without shell nav)
  --app-sidenav-width: 0px;
}

// Chinese / CJK: avoid English-tuned negative tracking on titles and stats
:lang(zh),
:lang(zh-CN),
:lang(zh-TW),
:lang(zh-HK) {
  h1, h2, h3,
  .nav-title,
  .app-brand__name,
  .sidebar-brand__name,
  .overview-stat-label,
  .overview-stat-value {
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
  --app-sidenav-width: 0px;

  &--sidenav {
    --app-sidenav-width: #{$sidenav-width-collapsed};
  }

  &--sidenav-expanded {
    --app-sidenav-width: #{$sidenav-width-expanded};
  }
}

.app-shell__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 100%;
  width: 100%;
  box-sizing: border-box;
  transition: padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  .app-shell--sidenav & {
    @media screen and (min-width: $breakpoint-md) {
      padding-left: var(--app-sidenav-width);
    }
  }
}

.page-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  @include responsive-container-width;

  @media screen and (min-width: $breakpoint-md) {
    // Fluid content with a soft readability cap on very wide screens
    max-width: $content-max-width;
    margin-inline: auto;
    padding-inline: var(--space-5);
  }

  @media screen and (min-width: $breakpoint-xl) {
    padding-inline: var(--space-6);
  }
}
</style>
