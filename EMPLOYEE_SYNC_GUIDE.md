# Employee Sync Guide

This guide explains how to sync employee names from the SFTP CSV file to populate the validated dropdown in the nomination form.

## Overview

The system fetches employee data from a CSV file stored on an SFTP server (`Evergreen Employees.csv`) and imports it into a Supabase database table. This provides a validated list of employee names for the nomination form dropdown.

## Prerequisites

1. Supabase database with the `employees` table created
2. SFTP server credentials (already configured in the script)
3. `.env` file with Supabase credentials

## Setup

### 1. Run Database Migration

First, you need to create the `employees` table in your Supabase database. You can do this by:

**Option A: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/20250101000000_create_employees_table.sql`
4. Run the SQL

**Option B: Using Supabase CLI** (if installed)
```bash
supabase migration up
```

### 2. Configure Environment Variables

Add the Supabase Service Role Key to your `.env` file:

**Get your Service Role Key:**
1. Go to your Supabase Dashboard
2. Navigate to **Project Settings** → **API**
3. Copy the `service_role` key (NOT the anon key)
4. Add it to your `.env` file

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**⚠️ IMPORTANT:** The service role key bypasses Row Level Security and should be kept **SECRET**. Never commit it to version control!

## Running the Sync

To sync employees from the SFTP server to your database:

```bash
npm run sync-employees
```

### What the Script Does

1. **Connects to SFTP**: Connects to `us.sftp.domo.com` using provided credentials
2. **Downloads CSV**: Downloads the `Evergreen Employees.csv` file
3. **Parses Data**: Parses the CSV and extracts employee information
4. **Syncs to Database**: Clears existing employee records and imports the new data
5. **Cleanup**: Removes temporary files

### Expected Output

```
=== Employee Sync Script Started ===

Connecting to SFTP server...
Connected successfully!
Listing files on SFTP server...
Available files: Evergreen Employees.csv, other-file.csv
Downloading Evergreen Employees.csv...
Download complete!
Parsing CSV file...
Parsed 150 employee records
Found 150 valid employee records
Syncing employees to Supabase...
Clearing existing employee records...
Inserted batch 1: 100/150 employees
Inserted batch 2: 150/150 employees
Successfully synced 150 employees to database!

=== Sync completed successfully! ===
```

## CSV File Format

The script expects the CSV to have the following columns (adjust in `scripts/sync-employees.mjs` if needed):

- `Full Name` or `Name` or `Employee Name` (required)
- `Email` (optional)
- `Department` (optional)
- `Location` or `Club` (optional)
- `Employee ID` or `ID` (optional)

## How It Works in the App

1. When users visit the **Nominate** page, the app fetches employees from the `employees` table
2. The dropdown shows all validated employee names with their department/location
3. Users can only select from the validated list
4. If no employees are loaded, it falls back to showing profiles from the system

## Scheduling Regular Syncs

For automated syncing, you can:

### Option 1: Cron Job (Linux/Mac)
```bash
# Run daily at 2 AM
0 2 * * * cd /path/to/project && npm run sync-employees
```

### Option 2: Windows Task Scheduler
1. Open Task Scheduler
2. Create a new task
3. Set trigger (e.g., daily at 2 AM)
4. Action: Run `npm run sync-employees` in project directory

### Option 3: GitHub Actions (if project is on GitHub)
Create `.github/workflows/sync-employees.yml`:

```yaml
name: Sync Employees
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run sync-employees
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

## Troubleshooting

### Script fails to connect to SFTP
- Verify SFTP credentials are correct
- Check network connectivity
- Ensure port 22 is not blocked by firewall

### CSV file not found
- Verify the file name is exactly `Evergreen Employees.csv`
- Check that the file exists on the SFTP server
- Ensure you have read permissions

### Database sync fails
- Check Supabase credentials in `.env`
- Verify the `employees` table exists
- Check Row Level Security policies allow inserts

### No employees showing in dropdown
- Run the sync script at least once
- Check browser console for errors
- Verify the `employees` table has data in Supabase dashboard

## Security Notes

- SFTP credentials are stored in the sync script (server-side only)
- Never commit credentials to version control
- Consider using environment variables for SFTP credentials in production
- The script runs locally, keeping credentials secure

## Future Enhancements

Consider implementing:
- Supabase Edge Function for serverless syncing
- Webhook trigger from SFTP server when CSV updates
- Admin UI for manual sync trigger
- Sync history/logging table
- Incremental updates instead of full replacement
