import type { ThemeConfig } from 'antd';

/** TrackFlow design system — enterprise SaaS palette */
export const colors = {
  primary: '#2563EB',
  sider: '#1E293B',
  pageBg: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  siderText: '#E2E8F0',
  siderTextMuted: '#94A3B8',
  status: {
    open: '#EF4444',
    in_progress: '#F59E0B',
    resolved: '#22C55E',
  },
} as const;

export const trackflowTheme: ThemeConfig = {
  token: {
    colorPrimary: colors.primary,
    colorBgLayout: colors.pageBg,
    colorBgContainer: colors.surface,
    colorBgElevated: colors.surface,
    colorBorder: colors.border,
    colorBorderSecondary: colors.border,
    colorText: colors.textPrimary,
    colorTextSecondary: colors.textSecondary,
    colorTextHeading: colors.textPrimary,
    colorLink: colors.primary,
    borderRadius: 8,
    borderRadiusLG: 10,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 14,
    controlHeight: 36,
    lineHeight: 1.5,
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
    boxShadowSecondary: '0 4px 12px rgba(15, 23, 42, 0.06)',
  },
  components: {
    Layout: {
      siderBg: colors.sider,
      bodyBg: colors.pageBg,
      headerBg: colors.surface,
      triggerBg: colors.sider,
    },
    Menu: {
      darkItemBg: 'transparent',
      darkSubMenuItemBg: 'transparent',
      darkItemColor: colors.siderTextMuted,
      darkItemHoverBg: 'rgba(255, 255, 255, 0.06)',
      darkItemSelectedBg: 'rgba(37, 99, 235, 0.18)',
      darkItemSelectedColor: '#FFFFFF',
      itemBorderRadius: 6,
      itemMarginInline: 8,
      itemHeight: 40,
    },
    Card: {
      colorBgContainer: colors.surface,
      colorBorderSecondary: colors.border,
      paddingLG: 20,
      boxShadowTertiary: 'none',
    },
    Table: {
      headerBg: colors.pageBg,
      headerColor: colors.textSecondary,
      borderColor: colors.border,
      rowHoverBg: '#F1F5F9',
      cellPaddingBlock: 14,
      cellPaddingInline: 16,
    },
    Button: {
      primaryShadow: 'none',
      defaultShadow: 'none',
      fontWeight: 500,
    },
    Input: {
      colorBorder: colors.border,
      activeBorderColor: colors.primary,
      hoverBorderColor: '#CBD5E1',
    },
    Select: {
      colorBorder: colors.border,
    },
    Modal: {
      contentBg: colors.surface,
      headerBg: colors.surface,
      titleColor: colors.textPrimary,
    },
    Drawer: {
      colorBgElevated: colors.surface,
      footerPaddingBlock: 16,
      footerPaddingInline: 24,
    },
    Tag: {
      defaultBg: colors.pageBg,
      defaultColor: colors.textSecondary,
    },
    Divider: {
      colorSplit: colors.border,
    },
    Descriptions: {
      colorSplit: colors.border,
      labelBg: colors.pageBg,
    },
    Badge: {
      colorPrimary: colors.primary,
    },
  },
};
