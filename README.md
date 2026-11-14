# Business App Starter

Build and run your own business software, with an AI engineer doing the coding.

This starter is a real, working app: **sign-in, a private customer list, monthly payments and email**, with security built in. You describe what you want in plain English, and Claude builds it.

**Free and open source** under the [MIT license](LICENSE). Use it, change it, and build and sell whatever you make with it.

---

## Get started (about 30 minutes)

### 1. Get the accounts you'll need
You'll sign up for each as you go. Claude walks you through it.

| Service | What it does for you | Cost to start |
|---|---|---|
| [Claude](https://claude.ai) (Pro plan or above) | Your AI engineer | Paid plan |
| [GitHub](https://github.com/signup) | Stores your app's code | Free |
| [Vercel](https://vercel.com/signup) | Puts your app on the internet | Free |
| [Supabase](https://supabase.com/dashboard) | Your database and user logins | Free |
| [Stripe](https://dashboard.stripe.com/register) | Takes payments | Free, per-transaction fees |
| [Resend](https://resend.com/signup) | Sends emails | Free |

Tip: sign up for Vercel and Supabase **with your GitHub account**. It's faster and connects everything.

### 2. Make your own copy
Click the green **Use this template** button at the top of this page → **Create a new repository** → name it after your business → **Create**.

### 3. Open it in Claude Code
**[▶ Start building](https://claude.ai/code?prompt=%2Fsetup)** opens Claude Code. Choose **your new repository**, then send the message.

> **First time in Claude Code on the web?** In your environment settings, set Network access to **Limited** and add these domains:
> `*.supabase.co` `api.supabase.com` `*.vercel.com` `api.stripe.com` `api.resend.com`

Prefer the desktop app or terminal? Open your repository there and type `/setup`.

### 4. Follow along
Claude connects each service one at a time, puts your app online and makes it yours. When it's done you'll have a live website.

---

## After setup: how to build anything

Just describe what you want:

> *"I want customers to be able to book a 30-minute call with me. Let's plan it."*

Useful commands:

| Type | What happens |
|---|---|
| `/plan-feature` | Claude interviews you and writes a plan before building |
| `/security-audit` | A full security check with a plain-English report |
| `/check-secrets` | Makes sure no passwords or keys have leaked |
| `/test-data-isolation` | Proves customers can't see each other's data |
| `/prelaunch` | The checklist before you take real payments |

## Built-in safety
- A **guard** stops the AI from putting keys in your code or running dangerous commands.
- Your **database refuses** to show anyone data that isn't theirs.
- **GitHub checks every change** for leaked keys, vulnerable packages and broken tests.
- **Payments use test mode** until you choose to go live.

Details: [SECURITY.md](SECURITY.md)
