import { useMediaQuery } from "@vueuse/core";
import { computed } from "vue";

import { SIDEBAR_BREAKPOINT } from "@/store/system";

export const WIDE_SCREEN_NARROW_MODE_BREAKPOINT = SIDEBAR_BREAKPOINT;
export const WIDE_SCREEN_NARROW_MODE_QUERY = `(min-width: ${WIDE_SCREEN_NARROW_MODE_BREAKPOINT}px)`;

export const useWideScreenNarrowMode = () => {
  const isWideScreen = useMediaQuery(WIDE_SCREEN_NARROW_MODE_QUERY);

  const isWideScreenNarrowModeActive = computed(() => false);

  /**
   * Bottom TabBar disabled: primary nav is the top segmented control
   * (same language as desktop). Mobile uses safe-area padding instead.
   */
  const shouldShowTabBar = computed(() => false);

  const shouldShowSideBar = computed(() => false);

  return {
    isWideScreen,
    isWideScreenNarrowModeActive,
    shouldShowTabBar,
    shouldShowSideBar,
  };
};
