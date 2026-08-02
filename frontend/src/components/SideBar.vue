<template>
  <aside
    class="side-bar-wrapper"
    :class="{ 'is-expanded': isExpanded }"
    aria-label="Primary"
  >
    <div class="sidebar-brand" @click="router.push('/')" role="link" tabindex="0"
      @keydown.enter.prevent="router.push('/')">
      <img class="sidebar-brand__logo" :src="brandLogo" alt="" width="28" height="28" />
      <span class="sidebar-brand__name" v-show="isExpanded">Sub Store</span>
    </div>

    <nav class="sidebar-content">
      <div class="menu-items">
        <div
          class="menu-item"
          :class="{ active: activeTab === 0 }"
          role="link"
          tabindex="0"
          @click="router.push('/subs')"
          @keydown.enter.prevent="router.push('/subs')"
        >
          <nut-icon name="link" size="22px" />
          <span class="label" v-show="isExpanded">{{ $t('tabBar.sub') }}</span>
        </div>

        <div
          class="menu-item"
          :class="{ active: activeTab === 1 }"
          role="link"
          tabindex="0"
          @click="router.push('/tools')"
          @keydown.enter.prevent="router.push('/tools')"
        >
          <nut-icon name="more-x" size="22px" />
          <span class="label" v-show="isExpanded">{{ $t('tabBar.tools') }}</span>
        </div>

        <div
          class="menu-item"
          :class="{ active: activeTab === 2 }"
          role="link"
          tabindex="0"
          @click="router.push('/my')"
          @keydown.enter.prevent="router.push('/my')"
        >
          <div class="icon-container">
            <nut-icon name="setting" size="22px" />
          </div>
          <span class="label" v-show="isExpanded">{{ $t('tabBar.my') }}</span>
        </div>
      </div>
    </nav>
  </aside>
</template>

<script lang="ts" setup>
import brandLogo from "@/assets/icons/logo.png";
import { SIDEBAR_EXPANDED_BREAKPOINT } from "@/store/system";
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useWindowSize } from '@vueuse/core';

const route = useRoute();
const router = useRouter();
const routeList = ['/subs', '/tools', '/my'];
const activeTab = ref(routeList.indexOf(route.path));

watch(
  () => route.path,
  (newPath) => {
    let matchedIndex = routeList.indexOf(newPath);
    if (matchedIndex === -1) {
      if (newPath.includes('/subs')) matchedIndex = 0;
      else if (newPath.includes('/tools')) matchedIndex = 1;
      else if (newPath.includes('/my')) matchedIndex = 2;
    }
    if (matchedIndex !== -1) {
      activeTab.value = matchedIndex;
    }
  },
  { immediate: true }
);

const { width: windowWidth } = useWindowSize();

const isExpanded = computed(() => {
  return windowWidth.value >= SIDEBAR_EXPANDED_BREAKPOINT;
});
</script>

<style lang="scss" scoped>
.side-bar-wrapper {
  display: none; // Hidden by default, shown on medium+ screens

  @media screen and (min-width: $breakpoint-md) {
    display: flex;
    flex-direction: column;
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    height: 100%;
    width: $sidenav-width-collapsed;
    padding: 12px 0;
    box-sizing: border-box;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 110;

    background: var(--tab-bar-color);
    border-right: 1px solid var(--divider-color);
    border-radius: 0;
    box-shadow: none;
    backdrop-filter: blur(var(--tab-bar-blur, 20px));
    -webkit-backdrop-filter: blur(var(--tab-bar-blur, 20px));
    transform: none;
  }

  &.is-expanded {
    @media screen and (min-width: $breakpoint-md) {
      width: $sidenav-width-expanded;
    }
  }

  .sidebar-brand {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 40px;
    margin: 4px 8px 16px;
    padding: 6px 8px;
    border-radius: 12px;
    cursor: pointer;
    user-select: none;
    color: var(--primary-text-color);
    transition: background-color 0.2s ease;

    &:hover {
      background: rgba(148, 163, 184, 0.08);
    }

    &:focus {
      outline: none;
    }

    &:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    &__logo {
      width: 28px;
      height: 28px;
      flex-shrink: 0;
      border-radius: 8px;
      object-fit: contain;
    }

    &__name {
      font-weight: 600;
      font-size: 14px;
      letter-spacing: -0.02em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  &.is-expanded .sidebar-brand {
    justify-content: flex-start;
  }

  .sidebar-content {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .menu-items {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
  }

  .menu-item {
    cursor: pointer;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    color: var(--lowest-text-color);
    width: calc(100% - 12px);
    margin: 0 6px;
    padding: 12px 14px;
    border-radius: 12px;
    box-sizing: border-box;
    transition: color 0.2s ease, background-color 0.2s ease, transform 0.15s ease;

    // Shared active-state language with TabBar
    &.active {
      color: var(--primary-color);
      background: color-mix(in srgb, var(--primary-color) 12%, transparent);
      font-weight: 600;
    }

    &:hover:not(.active) {
      color: var(--primary-text-color);
      background: rgba(148, 163, 184, 0.08);
    }

    &:focus {
      outline: none;
    }

    &:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .icon-container {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .label {
      margin-left: 12px;
      font-weight: 600;
      white-space: nowrap;
      font-size: 14px;
      line-height: 1;
    }
  }

  // Collapsed icon-only mode
  &:not(.is-expanded) {
    .menu-item {
      padding: 14px 0;
      justify-content: center;

      .label {
        display: none;
      }
    }
  }

  .nut-badge__content.is-dot {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--nut-badge-background-color, #e2231a);
  }
}
</style>
