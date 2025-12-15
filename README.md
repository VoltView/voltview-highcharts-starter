# VoltView Highcharts Starter

A starter kit for building beautiful energy consumption charts using the [VoltView API](https://docs.voltview.co.uk/api-reference/introduction) and [Highcharts](https://www.highcharts.com/).

![Monthly Energy Chart](https://voltview.co.uk/og-image.png)

## Features

- 📊 **Monthly Energy Consumption Chart** - Stacked column chart showing electricity and gas consumption
- 💷 **Cost Overlay** - Line chart overlay showing monthly energy costs
- 🌓 **Dark/Light Theme** - Full theme support with system preference detection
- ⚡ **Interactive Legend** - Click to toggle energy types and see cost updates
- 🎨 **Fully Customizable** - Easy to modify colors, styles, and chart options

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/voltview/voltview-highcharts-starter.git
cd voltview-highcharts-starter
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure your API credentials

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your VoltView API credentials:

```env
VOLTVIEW_API_URL=https://api.voltview.co.uk
VOLTVIEW_API_EMAIL=your-email@example.com
VOLTVIEW_API_PASSWORD=your-password
```

> **Note:** Don't have VoltView credentials? The app will show demo data until you configure them. Sign up at [voltview.co.uk](https://app.voltview.co.uk) to get your API access.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the chart.

## Project Structure

```
voltview-highcharts-starter/
├── app/
│   ├── api/
│   │   └── energy-data/
│   │       └── route.ts      # API route for fetching VoltView data
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout with theme provider
│   └── page.tsx              # Main page with chart
├── components/
│   ├── charts/
│   │   ├── styles/
│   │   │   └── chart-theme.ts  # Chart theming for dark/light mode
│   │   └── MonthlyEnergyChart.tsx  # Main chart component
│   ├── ThemeProvider.tsx     # Theme context provider
│   └── ThemeToggle.tsx       # Dark/light mode toggle
├── lib/
│   └── api.ts                # VoltView API client
├── types/
│   └── index.ts              # TypeScript type definitions
└── README.md
```

## Chart Customization

### Colors

Edit the series colors in `MonthlyEnergyChart.tsx`:

```typescript
series: [
  {
    name: 'Electricity',
    color: '#00AAFF',  // Blue
  },
  {
    name: 'Gas',
    color: '#FFBC99',  // Peach
  },
  {
    name: 'Cost',
    color: '#FF8C00',  // Orange
  },
]
```

### Theme

Modify the theme colors in `components/charts/styles/chart-theme.ts`:

```typescript
export const chartTheme = {
  light: {
    backgroundColor: '#FFFFFF',
    color: '#0A0A0A',
  },
  dark: {
    backgroundColor: '#111315',
    color: '#b8c5d6',
  },
};
```

## VoltView API

This starter uses the following VoltView API endpoints:

| Endpoint | Description |
|----------|-------------|
| `POST /auth/token` | Get authentication token |
| `GET /consumption/time-series` | Fetch consumption data |
| `GET /sites/energy-cost` | Fetch cost data |

For full API documentation, visit [docs.voltview.co.uk](https://docs.voltview.co.uk/api-reference/introduction).

### Available API Methods

```typescript
import { getMonthlyConsumption, getMonthlyCosts, getSiteConsumption } from '@/lib/api';

// Fetch monthly consumption for all sites
const consumption = await getMonthlyConsumption('2024-01-01', '2024-12-31');

// Fetch monthly costs for all sites
const costs = await getMonthlyCosts('2024-01-01', '2024-12-31');

// Fetch consumption for a specific site
const siteData = await getSiteConsumption('site-id', '2024-01-01', '2024-12-31', 'day');
```

## Adding More Charts

This starter is designed to be extended. Check out the VoltView API documentation to add more visualizations:

- **Load Curve Chart** - Hourly consumption patterns
- **Time Series Chart** - Flexible time-based analysis
- **Cost Breakdown** - Detailed cost analysis

## Tech Stack

- [Next.js 14](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Highcharts](https://www.highcharts.com/) - Charting library
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [next-themes](https://github.com/pacocoursey/next-themes) - Theme management

## License

MIT License - feel free to use this starter for your own projects.

## Links

- [VoltView Website](https://voltview.co.uk)
- [VoltView API Docs](https://docs.voltview.co.uk/api-reference/introduction)
- [Highcharts Docs](https://www.highcharts.com/docs/index)
