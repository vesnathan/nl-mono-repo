# Google AdSense Setup Guide

## Overview
This guide walks you through setting up Google AdSense for The Story Hub. AdSense provides non-intrusive, brand-safe advertising that respects your Patreon supporters.

## Prerequisites
- A Google account
- Your production domain (CloudFront URL or custom domain)
- Site must comply with AdSense policies (no illegal content, violence, adult content, etc.)

## Step 1: Create AdSense Account

1. Go to https://www.google.com/adsense
2. Click "Get Started"
3. Enter your CloudFront URL or custom domain
4. Select your account type (Individual or Business)
5. Accept the AdSense Terms and Conditions

## Step 2: Add Your Site

1. In AdSense dashboard, go to "Sites"
2. Click "Add site"
3. Enter your site URL: `https://your-cloudfront-url.cloudfront.net` (or your custom domain)
4. Click "Save and continue"

## Step 3: Get Your AdSense Code

### Option A: Auto Ads (Recommended for Start)
1. Go to "Ads" → "By site"
2. Click "Get code" next to your site
3. Copy the AdSense code snippet (looks like this):
   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygid.js?client=ca-pub-XXXXXXXXXXXXXX"
        crossorigin="anonymous"></script>
   ```
4. Note your Publisher ID: `ca-pub-XXXXXXXXXXXXXX`

### Option B: Manual Ad Units (More Control)
1. Go to "Ads" → "By ad unit"
2. Click "Display ads"
3. Create ad units for each placement:
   - **Between Stories Ad**: 728x90 (Leaderboard) or Responsive
   - **Footer Ad**: 728x90 (Leaderboard) or Responsive
   - **Homepage Ad**: 300x250 (Medium Rectangle) or Responsive
4. Copy the code for each ad unit

## Step 4: Verify Site Ownership

Google will ask you to verify site ownership:

1. **AdSense verification code** will be shown in your dashboard
2. Add this code to your site's `<head>` section (already implemented in The Story Hub)
3. Click "Verify" in AdSense dashboard
4. Wait for Google to crawl your site (can take 24-48 hours)

## Step 5: Configure Ad Settings in The Story Hub

### Admin Settings Panel
1. Log in to The Story Hub as admin
2. Go to Admin Settings
3. Navigate to "Advertising Settings" section
4. Enter your AdSense Publisher ID: `ca-pub-XXXXXXXXXXXXXX`
5. Toggle "Enable Ads" to ON
6. Save settings

### Ad Placement Options
You can configure which ad placements are active:
- **Between Stories** - Shows between story listings on homepage
- **Story End** - Shows after completing a story chapter
- **Footer** - Shows at bottom of pages

## Step 6: Configure AdSense Policies

### Content Filtering (IMPORTANT)
1. Go to "Blocking controls" → "Content"
2. Enable blocking for:
   - ✅ Sensitive content
   - ✅ Adult content
   - ✅ Deceptive ads
   - ✅ Violence
   - ✅ Gambling
   - ✅ Politics (optional)
3. Set sensitivity to "Maximum filtering"

### Ad Review Center
1. Go to "Blocking controls" → "Ad review center"
2. Enable "Review ads before they appear on your site" (optional but recommended)
3. Review and approve/block ads as they come in

### General Categories
1. Go to "Blocking controls" → "General categories"
2. Block categories that don't fit your audience:
   - Politics (if desired)
   - Religion
   - Dating
   - Get rich quick schemes
   - Ringtones/Downloadables

## Step 7: Payment Setup

1. Go to "Payments" → "Payments info"
2. Enter your tax information
3. Verify your address (Google will send a PIN via mail)
4. Add payment method (bank account or wire transfer)
5. Set payment threshold (default: $100)

## Step 8: Monitor Performance

### Key Metrics to Watch
1. **RPM** (Revenue per 1000 impressions) - Target: $2-10
2. **CTR** (Click-through rate) - Target: 0.5-2%
3. **CPC** (Cost per click) - Target: $0.20-$2.00
4. **Invalid clicks** - Keep below 1%

### Optimization Tips
1. Wait 2-4 weeks for AdSense to optimize ad delivery
2. Monitor which placements perform best
3. Disable underperforming placements
4. Never click your own ads (will get banned)
5. Don't ask users to click ads (policy violation)

## The Story Hub Integration Details

### How Ads Respect Patreon Supporters
- **Bronze+ Patreon supporters**: NO ADS (ad-free experience)
- **Free users**: See ads in designated placements
- User's `patreonInfo.tier` is checked before showing ads

### Ad Placements (Unobtrusive)
1. **Homepage**: Between story cards (after every 3rd story)
2. **Story End**: After completing a chapter (before branch selection)
3. **Footer**: At bottom of long-form pages

### What's NOT Shown
- ❌ Mid-chapter interruptions
- ❌ Sidebar ads (distracting while reading)
- ❌ Pop-ups or interstitials
- ❌ Auto-play video ads
- ❌ Any ads during active reading

## Troubleshooting

### Site Not Approved
- **Issue**: "Site doesn't comply with policies"
- **Solution**: Ensure you have enough content (10+ stories), privacy policy, and terms of service

### Ads Not Showing
- **Issue**: Blank ad spaces
- **Solution**:
  - Check if AdSense Publisher ID is correct
  - Wait 24-48 hours for Google to start serving ads
  - Check browser console for errors
  - Verify site is not in test/dev mode

### Low Revenue
- **Issue**: Making less than expected
- **Solution**:
  - Wait 2-4 weeks for optimization
  - Ensure ads are visible (not blocked by adblockers)
  - Check ad placements aren't being hidden by CSS
  - Increase traffic to the site

### Policy Violations
- **Issue**: Warning email from Google
- **Solution**:
  - Review AdSense policy email
  - Remove violating content immediately
  - Submit reconsideration request
  - Monitor "Policy center" in AdSense dashboard

## Important Notes

### Do's ✅
- Wait for organic traffic (don't buy traffic)
- Create quality content regularly
- Monitor invalid click activity
- Respond to policy violations quickly
- Keep AdSense code up to date

### Don'ts ❌
- Click your own ads
- Ask users to click ads
- Buy traffic from low-quality sources
- Use misleading ad labels
- Place ads on error pages or thank you pages
- Use more than 3 ad units per page (AdSense limit)

## Support Resources

- **AdSense Help**: https://support.google.com/adsense
- **Policy Guide**: https://support.google.com/adsense/answer/48182
- **Community Forum**: https://support.google.com/adsense/community
- **Status Dashboard**: https://www.google.com/appsstatus/dashboard

## Next Steps After Setup

1. ✅ Get AdSense account approved
2. ✅ Add Publisher ID to The Story Hub admin settings
3. ✅ Enable ads
4. ✅ Configure brand safety filters
5. ✅ Set up payment method
6. ⏳ Wait 24-48 hours for ads to start serving
7. ⏳ Monitor performance for 2-4 weeks
8. 🎯 Optimize based on data
