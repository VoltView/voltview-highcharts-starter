type ChartThemeConfig = {
  backgroundColor: string;
  color: string;
};

type ChartTheme = {
  light: ChartThemeConfig;
  dark: ChartThemeConfig;
};

export const chartTheme: ChartTheme = {
  light: {
    backgroundColor: '#FFFFFF',
    color: '#0A0A0A',
  },
  dark: {
    backgroundColor: '#111315',
    color: '#b8c5d6',
  },
};

export const tooltipTheme: ChartTheme = {
  light: {
    backgroundColor: '#FFFFFF',
    color: '#0A0A0A',
  },
  dark: {
    backgroundColor: '#1a1d21',
    color: '#b8c5d6',
  },
};

export const legendTheme: ChartTheme = {
  light: {
    backgroundColor: 'transparent',
    color: '#0A0A0A',
  },
  dark: {
    backgroundColor: 'transparent',
    color: '#b8c5d6',
  },
};
