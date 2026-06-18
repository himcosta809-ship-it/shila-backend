# Shila Handicraft — Backend Deployment Guide

## What changed
- Products, orders, and messages now save to **MongoDB** (a real database)
- Every visitor — on any device, any browser — sees the same products
- The admin panel talks to the backend API (not localStorage)
- Images still upload to imgbb (your API key is already wired in)

---

## Step 1 — Create a free MongoDB database (5 min)

1. Go to **https://www.mongodb.com/cloud/atlas** and create a free account.
2. Click **Build a Database** → choose **Free (M0)** tier → pick any region → click **Create**.
3. On the "Security Quickstart" screen:
   - Username: `shilaadmin`  Password: make a strong one (save it!)
   - Click **Create User**
4. Under "Where would you like to connect from?" → choose **Cloud Environment** → Allow access from anywhere (`0.0.0.0/0`) → **Add IP Address** → **Finish and Close**
5. Back on the dashboard, click **Connect** on your cluster → **Connect your application**
   → Driver: Node.js, Version: 5.5 or later
   → Copy the connection string. It looks like:
   ```
   mongodb+srv://shilaadmin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Replace `<password>` with the password you created, and add the database name before `?`:
   ```
   mongodb+srv://shilaadmin:YourPassword@cluster0.xxxxx.mongodb.net/shila-handicraft?retryWrites=true&w=majority
   ```
   **Save this string — you'll need it in Step 2.**

---

## Step 2 — Deploy the backend to Render (free, 10 min)

1. Go to **https://render.com** and sign up (free).
2. Click **New +** → **Web Service**.
3. Connect your GitHub account and pick a new repo (create one called `shila-backend` on GitHub and upload the backend files: `server.js`, `auth.js`, `models/` folder, `package.json`, `.gitignore`).
4. Fill in the form:
   - **Name**: `shila-handicraft-api`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Scroll down to **Environment Variables** and add these 3:

   | Key | Value |
   |-----|-------|
   | `MONGODB_URI` | Your full MongoDB connection string from Step 1 |
   | `JWT_SECRET` | Any long random phrase, e.g. `shila_secret_2024_handicraft` |
   | `ADMIN_PASSWORD` | Your chosen admin password |

6. Click **Create Web Service**.
7. Wait ~2 minutes. Render shows a URL like `https://shila-handicraft-api.onrender.com`
8. Test it: open `https://shila-handicraft-api.onrender.com/api/health` in your browser. You should see `{"status":"ok"}`.

> **Note:** Render's free tier "sleeps" after 15 min of inactivity. The first request after sleep takes ~30 seconds. This is fine for a small shop.

---

## Step 3 — Update your frontend

Open `script.js` (in your main Shila Handicraft site) and change line 7:
```js
// FROM:
const API_BASE = 'https://shila-handicraft-api.onrender.com/api';
// Make sure this matches your exact Render URL
```

Open `admin.html` and change the same URL near line 2 of the `<script>` block:
```js
const API = 'https://shila-handicraft-api.onrender.com/api';
```

Both are already set to `shila-handicraft-api.onrender.com` — if Render gave you a different name, update both files.

---

## Step 4 — Upload files to GitHub & deploy

1. Upload the updated `script.js` and `admin.html` to your **shila-handicraft** GitHub repo (the front-end repo).
2. Netlify redeploys automatically.
3. Go to `https://shilahandicraft.com.np/admin.html`
4. Log in with username `admin` and the `ADMIN_PASSWORD` you set in Render.

---

## Step 5 — Seed your starter products (one-time)

On the admin dashboard, click the **"Seed Starter Products"** button.
This adds your 8 starting products to MongoDB. After that, all visitors see them.

> You only need to click this once on an empty database. After that, manage products through the Products page.

---

## Summary of what lives where

| Thing | Where |
|-------|-------|
| Front-end (HTML/CSS/JS) | GitHub → Netlify → shilahandicraft.com.np |
| Backend API | GitHub → Render → shila-handicraft-api.onrender.com |
| Database | MongoDB Atlas (free M0 cluster) |
| Product images | imgbb (your API key already in admin.html) |

All three are on free tiers. No credit card needed.

---

## Admin login
- **URL**: `https://shilahandicraft.com.np/admin.html`
- **Username**: `admin`
- **Password**: whatever you set as `ADMIN_PASSWORD` in Render

---

## Local development (optional)
```bash
cd shila-backend
cp .env.example .env
# Fill in .env with your MongoDB URI and secrets
npm install
npm run dev   # starts on http://localhost:5000
```
Then in `script.js` and `admin.html` change `API_BASE` to `http://localhost:5000/api`.
