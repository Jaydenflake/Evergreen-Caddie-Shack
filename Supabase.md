# Supabase Development Workflow

## Overview

This document describes the SQL file management workflow for our Supabase backend. This workflow ensures we maintain a complete backup of our database schema and can easily apply incremental updates.

## File Structure

### 1. `full-project.sql`
**Purpose:** Complete database schema that can recreate the entire backend from scratch

**Usage:**
- Can be run in the SQL editor of a blank Supabase project to recreate everything
- Serves as a backup if the backend gets corrupted
- Used at the start of each Claude session to understand the current state of the backend

**Maintenance:**
- Updated after every backend change to reflect the current state
- Should always represent the complete, up-to-date schema

### 2. `update.sql`
**Purpose:** Temporary file containing only the SQL commands needed for the current update

**Usage:**
- Contains ONLY the changes needed for the current modification
- Contents can be copied and pasted directly into Supabase SQL editor
- Wiped and replaced with each new update

**Maintenance:**
- Completely wiped and replaced before each update
- After changes are applied, the commands are integrated into `full-project.sql`

## Development Workflow

### Making Backend Changes

When you need to update the Supabase backend, follow these steps:

1. **Wipe and Replace `update.sql`**
   - Clear all existing content
   - Write ONLY the SQL commands needed for the current change
   - Ensure commands are ready to copy/paste into SQL editor

2. **Update `full-project.sql`**
   - Integrate the changes from `update.sql`
   - Ensure the file reflects the complete current state
   - Maintain proper order (extensions, tables, functions, policies, etc.)

3. **Apply Changes**
   - Copy contents of `update.sql`
   - Paste into Supabase SQL editor
   - Execute the commands

### Session Start Procedure

At the beginning of each Claude session:

1. Read `full-project.sql` to understand the current backend state
2. Review recent changes if needed
3. Proceed with development tasks

## Best Practices

- **Always maintain both files:** Never update one without the other
- **Test SQL before committing:** Ensure commands in `update.sql` work before updating `full-project.sql`
- **Keep `full-project.sql` organized:** Group related objects (tables together, functions together, etc.)
- **Use comments:** Document complex logic or important decisions in SQL files
- **Version control:** Commit both files to git after successful updates

## File Locations

- `full-project.sql` - Root directory
- `update.sql` - Root directory

## Example Workflow

```
User: "Add a new column 'bio' to the users table"

Claude:
1. Wipes update.sql and writes:
   ALTER TABLE users ADD COLUMN bio TEXT;

2. Updates full-project.sql to include the bio column in the CREATE TABLE statement

3. User copies update.sql contents to Supabase SQL editor and executes
```

## Recovery Procedure

If the Supabase backend becomes corrupted or needs to be reset:

1. Create a new blank Supabase project (or reset existing)
2. Copy entire contents of `full-project.sql`
3. Paste into Supabase SQL editor
4. Execute
5. Backend is fully restored

## Notes

- `update.sql` is ephemeral - it only matters until changes are applied
- `full-project.sql` is the source of truth for the current state
- Always read this file at the start of sessions to follow the proper workflow
