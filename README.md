# VoltView Highcharts Starter

A starter kit for building energy consumption charts using the [VoltView API](https://docs.voltview.co.uk/api-reference/introduction) and [Highcharts](https://www.highcharts.com/).

![Monthly Energy Chart](https://voltview.co.uk/og-image.png)

## Features

- 📊 **Monthly Energy Consumption Chart** - Stacked column chart showing electricity and gas consumption
- 💷 **Cost Overlay** - Line chart overlay showing monthly energy costs
- 💰 **Multi-Currency Support** - Display costs in GBP (£) or USD ($)
- 🌓 **Dark/Light Theme** - Full theme support with system preference detection
- ⚡ **Interactive Legend** - Click to toggle energy types and see cost updates
- 🎨 **Fully Customisable** - Easy to modify colours, styles, and chart options

## Prerequisites

- **Node.js** 20.x or higher (check with `node --version`)
- **npm** 9.x or higher (comes with Node.js)
- **VoltView API credentials** (optional - demo data works without them)

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

Edit `.env` with your VoltView API key:

```env
VOLTVIEW_API_URL=https://api.voltview.co.uk
VOLTVIEW_API_KEY=your-api-key-here
```

> **Note:** Don't have a VoltView API key? The app will show demo data until you configure it. Sign up at [voltview.co.uk](https://app.voltview.co.uk) to get your API key.

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

## Chart Customisation

### Currency

The chart supports both GBP (£) and USD ($). Use the currency selector in the top-right corner to switch between currencies. The currency formatting is automatically applied to:
- Y-axis labels
- Tooltips
- Data labels on the cost line

### Colours

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

This starter uses the VoltView API v1 endpoints. All API calls are made **server-side** in the Next.js API route, ensuring your API key never reaches the browser.

### Authentication

The starter uses API key authentication:
- **Endpoint**: `POST /v1/requestToken`
- **Header**: `x-api-key: <your-api-key>`
- Returns a JWT token that is cached and reused until expiration

### Data Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /v1/sites/timeSeries` | Fetch consumption data for all sites |
| `GET /v1/sites/cost` | Fetch cost data for all sites |
| `GET /v1/sites/{siteId}/timeSeries` | Fetch consumption data for a specific site |
| `GET /v1/sites/{siteId}/cost` | Fetch cost data for a specific site |

For full API documentation, visit [docs.voltview.co.uk](https://docs.voltview.co.uk/api-reference/introduction).

### Available API Methods

```typescript
import { 
  getMonthlyConsumption, 
  getMonthlyCosts, 
  getSiteConsumption,
  getSiteCosts 
} from '@/lib/api';

// Fetch monthly consumption for all sites
const consumption = await getMonthlyConsumption('2025-01-01', '2025-12-31');

// Fetch monthly costs for all sites
const costs = await getMonthlyCosts('2025-01-01', '2025-12-31');

// Fetch consumption for a specific site
const siteData = await getSiteConsumption('site-id', '2025-01-01', '2025-12-31', 'month');

// Fetch costs for a specific site
const siteCosts = await getSiteCosts('site-id', '2025-01-01', '2025-12-31', 'month');
```

> **Note**: All API methods automatically handle authentication using your `VOLTVIEW_API_KEY` environment variable. The JWT token is cached and refreshed as needed.

## Adding More Charts

This starter is designed to be extended. Check out the VoltView API documentation to add more visualizations:

- **Load Curve Chart** - Hourly consumption patterns
- **Time Series Chart** - Flexible time-based analysis
- **Cost Breakdown** - Detailed cost analysis

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `VOLTVIEW_API_URL` (optional, defaults to `https://api.voltview.co.uk`)
   - `VOLTVIEW_API_KEY` (required for real data)
   - `VOLTVIEW_USER_ID` (optional, if required by `/v1/requestToken`)
   - `VOLTVIEW_USER_EMAIL` (optional, if required by `/v1/requestToken`)
4. Deploy!

The app will automatically build and deploy. Demo data will be shown if the API key is not configured.

### Other Platforms

This is a standard Next.js app and can be deployed to:
- **Netlify** - Similar to Vercel, add environment variables in dashboard
- **Railway** - Add environment variables in project settings
- **AWS Amplify** - Configure environment variables in console
- **Docker** - Build with `docker build -t voltview-starter .` (requires Dockerfile)

## Troubleshooting

### Chart not displaying

- **Check browser console** for errors
- **Verify API credentials** - Check `.env` file has correct values
- **Check network tab** - Ensure API calls are succeeding (or falling back to demo data)

### "API not configured" error

This is expected if you haven't set up VoltView credentials. The app will automatically show demo data. To use real data:
1. Sign up at [app.voltview.co.uk](https://app.voltview.co.uk)
2. Get your API credentials
3. Add them to `.env` file
4. Restart the dev server

### Build errors

- **Node version mismatch** - Ensure you're using Node.js 20.x. Use `nvm use` if you have `.nvmrc`
- **TypeScript errors** - Run `npm run lint` to see detailed errors
- **Missing dependencies** - Delete `node_modules` and `package-lock.json`, then run `npm install`

### Chart looks broken in production

- **Check Highcharts license** - Ensure you have a valid Highcharts license for production use
- **Verify environment variables** - They must be set in your deployment platform
- **Check browser compatibility** - Highcharts requires modern browsers (Chrome, Firefox, Safari, Edge)

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
