# Feature Branch: Monetization & Authentication

**Branch:** `feature/monetization`
**Created:** 2026-04-15
**Status:** 🚧 In Development

---

## 🎯 Objectives

This branch focuses on adding **user authentication** and **monetization features** that require deeper user access and data restrictions.

### Core Goals:
1. **User Authentication** - Secure login/signup system
2. **Premium Features** - Tiered access (Free vs Premium)
3. **User Data** - Profile management, preferences
4. **Restrictions** - Feature gating based on subscription
5. **Analytics** - User behavior tracking for monetization

---

## 📋 Planned Features

### Phase 1: Authentication 🔐
- [ ] User registration (email + password)
- [ ] Social login (Google, GitHub)
- [ ] JWT-based authentication
- [ ] Session management
- [ ] Password reset flow
- [ ] Email verification

### Phase 2: User Profiles 👤
- [ ] User profile page
- [ ] Avatar customization (beyond shop)
- [ ] Profile statistics
- [ ] Account settings
- [ ] Privacy settings

### Phase 3: Subscription Tiers 💎
- [ ] Free tier (current features)
- [ ] Premium tier ($4.99/month)
  - Cloud sync across devices
  - Advanced analytics
  - Exclusive themes/avatars
  - Priority support
  - Unlimited frozen sessions
- [ ] Pro tier ($9.99/month)
  - Everything in Premium
  - Team features
  - API access
  - Custom integrations

### Phase 4: Payment Integration 💳
- [ ] Stripe integration
- [ ] Subscription management
- [ ] Payment history
- [ ] Invoice generation
- [ ] Refund handling

### Phase 5: Feature Restrictions 🔒
- [ ] Feature gating middleware
- [ ] Premium-only components
- [ ] Upgrade prompts/modals
- [ ] Trial period system (7 days)
- [ ] Downgrade flow

### Phase 6: Analytics & Tracking 📊
- [ ] User engagement metrics
- [ ] Conversion tracking
- [ ] Churn analysis
- [ ] A/B testing framework
- [ ] Revenue dashboard

---

## 🛠️ Technical Stack

### Backend Options:
| Option | Pros | Cons |
|--------|------|------|
| **Supabase** | Fast setup, built-in auth, PostgreSQL | Vendor lock-in |
| **Firebase** | Google ecosystem, easy auth | Pricing at scale |
| **Custom (Node.js + PostgreSQL)** | Full control, no vendor lock-in | More development time |

**Recommended:** Supabase (fastest to MVP)

### Frontend Additions:
- `@supabase/supabase-js` - Backend client
- `react-hook-form` - Form handling
- `zod` - Validation
- `stripe-js` - Payment processing
- `@stripe/react-stripe-js` - React Stripe components

---

## 📁 New File Structure

```
src/
├── auth/                    # NEW
│   ├── AuthProvider.tsx
│   ├── useAuth.ts
│   ├── LoginForm.tsx
│   ├── SignupForm.tsx
│   └── ProtectedRoute.tsx
├── components/
│   ├── premium/            # NEW
│   │   ├── PremiumModal.tsx
│   │   ├── FeatureGate.tsx
│   │   └── UpgradePrompt.tsx
│   └── ...
├── pages/                   # NEW
│   ├── Profile.tsx
│   ├── Settings.tsx
│   ├── Subscription.tsx
│   └── ...
└── ...
```

---

## 🔒 Security Considerations

- JWT tokens with short expiry
- Refresh token rotation
- HTTPS only
- Password hashing (bcrypt)
- Rate limiting on auth endpoints
- CORS configuration
- Input validation (zod)
- XSS protection

---

## 📊 Database Schema (Supabase)

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  stripe_subscription_id TEXT UNIQUE,
  tier TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Stats
CREATE TABLE user_stats (
  user_id UUID REFERENCES profiles(id) PRIMARY KEY,
  quests_completed INTEGER DEFAULT 0,
  bosses_defeated INTEGER DEFAULT 0,
  total_xp_earned INTEGER DEFAULT 0,
  days_active INTEGER DEFAULT 0,
  last_active TIMESTAMP
);
```

---

## 🧪 Testing Requirements

- [ ] Auth flow tests
- [ ] Protected route tests
- [ ] Feature gate tests
- [ ] Payment flow tests (Stripe test mode)
- [ ] Subscription upgrade/downgrade tests
- [ ] Token refresh tests

---

## 🚀 Deployment Checklist

- [ ] Environment variables configured
- [ ] Supabase project setup
- [ ] Stripe account connected
- [ ] Email templates configured
- [ ] Webhook endpoints deployed
- [ ] SSL certificates valid
- [ ] CDN configured for assets

---

## 📈 Success Metrics

| Metric | Target |
|--------|--------|
| Conversion rate (Free → Premium) | 5% |
| Churn rate (monthly) | < 3% |
| MRR (Month 1) | $500 |
| MRR (Month 6) | $5,000 |
| User retention (30-day) | 60% |

---

## 🔗 Related Branches

- `master` - Current stable (0.3.0)
- `staging` - Pre-production testing
- `prod` - Production deployment

---

## 📝 Development Notes

- Keep `master` branch stable
- Merge to `staging` for testing
- Deploy to production from `staging` only
- All features must have tests before merge
- Document breaking changes in CHANGELOG

---

**Last Updated:** 2026-04-15
**Branch Owner:** @defzky
