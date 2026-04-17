# Deploying to Vercel

## Step 1: Push to GitHub (when you get back from the game)

I'll create a GitHub repo and push the code. You just need to:
1. Go to https://github.com/qu4ntum88/quantum-guides (once created)
2. Confirm you can see the code

## Step 2: Connect to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Select the `quantum-guides` repository from GitHub
4. Click "Import"
5. Vercel will auto-detect it's a Next.js project
6. Click "Deploy"
7. Wait ~3-5 minutes for deployment to complete

## Step 3: Your Live Site

Once deployed, you'll get a URL like `https://quantum-guides-[random].vercel.app`

That's it! The site is live and any push to the main branch will auto-deploy.

## Tomorrow's Work

When you're ready to iterate:
1. Make changes locally (edit files in VS Code or similar)
2. Git commit and push: `git add . && git commit -m "update" && git push`
3. Vercel automatically redeploys within seconds
4. You'll see the changes at your live URL

No need to manually rebuild or upload anything — it's all automatic.
