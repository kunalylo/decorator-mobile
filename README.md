# FatafatDecor Partner (Decorator Mobile App)

React Native (Expo SDK 54) app for **decorators / delivery partners**. It mirrors the
architecture of the customer app (`fatafatdecor-mobile`) but implements the decorator
workflow that the decorator **web app** (`decorator-app`) already provides.

## What it does
- **Phone + password login** → JWT (no Google/Apple — partners are onboarded by the team)
- **Dashboard**: today's schedule, active jobs, stats, and live **New Order Requests**
  (accept / decline) with sound + buzz + a local notification on arrival
- **Order detail**: customer info, address + one-tap Google Maps, items / procurement
  checklist, completion-photo upload, and the full job lifecycle
- **Job lifecycle**: Start Navigation (notifies customer + generates OTP) → selfie
  check-in → enter customer OTP → 1-hour decorate timer → complete
- **Collect payment**: remaining balance via **cash** or **online (Razorpay)**
- **Gift deliveries**: accept / decline and a 4-step delivery progress flow
- **Calendar**: month view of booked jobs
- **Earnings**: total collected, cash pending, deposit cash (office / bank), history
- **Profile**: stats, change password, logout
- **Live GPS** is shared with the customer while a job is `en_route` / `arrived` / `decorating`

## Backend
Uses the **same Railway backend** as the customer app:
`https://api.fatafatdecor.ylo.co.in/api` — every `dp/*` endpoint it calls
(`dp/login`, `dp/dashboard/:id`, `dp/accept-order`, `dp/verify-otp`, `dp/complete`,
`dp/collect-payment`, `dp/earnings/:id`, `dp/accept-gift-order`, …) is already served there.

## App identity (separate from the customer app)
- slug: `fatafatdecor-decorator`
- bundle id / package: `in.co.ylo.fatafatdecor.decorator`
- display name: **FatafatDecor Partner**

Set a new EAS `projectId` in `app.json` before the first EAS build, and configure
production credentials (`credentials.json` + keystore) the same way the customer app does.

## Run locally
```bash
npm install
npx expo start          # then press a / i, or scan with a dev build
npx tsc --noEmit        # type-check
```

## Project layout
```
App.tsx                  root: fonts, auth gate, providers, navigator
src/navigation/          native-stack + navigationRef helpers
src/context/AppContext   all decorator state, handlers, polling, timer, GPS
src/lib/                 api (axios+JWT), constants, theme, storage, notify, utils
src/components/          Aurora, BottomNav, Toast, HapticButton
src/screens/             Auth, Home, Order, Verify, ActiveJob, Calendar, Earnings, Profile, GiftOrder
```
