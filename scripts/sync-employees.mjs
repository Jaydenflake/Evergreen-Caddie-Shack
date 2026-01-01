import SftpClient from 'ssh2-sftp-client';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Debug: Check what was loaded
console.log('Environment variables loaded:');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'Present' : 'Missing');
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing');
console.log('');

const SFTP_CONFIG = {
  host: 'us.sftp.domo.com',
  port: 22,
  username: 'evergreenclubs',
  password: 'lKC2BushKkgDEPrH'
};

const CSV_FILE_NAME = 'Evergreen Employees.csv';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use service role key for admin operations (bypasses RLS)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env file');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  Warning: Using ANON key instead of SERVICE_ROLE_KEY');
  console.warn('⚠️  Add SUPABASE_SERVICE_ROLE_KEY to .env to bypass RLS restrictions');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function downloadEmployeeCSV() {
  const sftp = new SftpClient();

  try {
    console.log('Connecting to SFTP server...');
    await sftp.connect(SFTP_CONFIG);
    console.log('Connected successfully!');

    // List files to verify the CSV exists
    console.log('Listing files on SFTP server...');
    const fileList = await sftp.list('/');
    console.log('Available files:', fileList.map(f => f.name).join(', '));

    // Find the employee CSV file
    const targetFile = fileList.find(f => f.name === CSV_FILE_NAME);

    if (!targetFile) {
      throw new Error(`File "${CSV_FILE_NAME}" not found on SFTP server`);
    }

    console.log(`Downloading ${CSV_FILE_NAME}...`);
    const localPath = path.join(process.cwd(), 'temp_employees.csv');
    await sftp.get(`/${CSV_FILE_NAME}`, localPath);
    console.log('Download complete!');

    await sftp.end();

    return localPath;
  } catch (error) {
    await sftp.end();
    throw error;
  }
}

function parseEmployeeCSV(filePath) {
  console.log('Parsing CSV file...');
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  console.log(`Parsed ${records.length} employee records`);

  // Map CSV columns to our database schema
  // CSV Headers: Employee First Name, Employee Last Name, Company Title, Status,
  // Department Code, Department Title, Job Title, Employment Category, Pay Type, etc.
  const employees = records.map(record => {
    const firstName = record['Employee First Name'] || '';
    const lastName = record['Employee Last Name'] || '';
    const fullName = `${firstName} ${lastName}`.trim();

    return {
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      company_title: record['Company Title'] || null,
      department_title: record['Department Title'] || null,
      job_title: record['Job Title'] || null,
    };
  });

  // Filter out any records without a name
  const validEmployees = employees.filter(emp =>
    emp.first_name &&
    emp.first_name.trim() &&
    emp.last_name &&
    emp.last_name.trim()
  );

  console.log(`Found ${validEmployees.length} valid employee records`);

  return validEmployees;
}

async function syncEmployeesToDatabase(employees) {
  console.log('Syncing employees to Supabase...');

  try {
    // Clear existing employees
    console.log('Clearing existing employee records...');
    const { error: deleteError } = await supabase
      .from('employees')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('Error clearing employees:', deleteError);
      throw deleteError;
    }

    // Insert new employees in batches (Supabase has a limit)
    const batchSize = 100;
    let successCount = 0;

    for (let i = 0; i < employees.length; i += batchSize) {
      const batch = employees.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('employees')
        .insert(batch)
        .select();

      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
        throw error;
      }

      successCount += batch.length;
      console.log(`Inserted batch ${i / batchSize + 1}: ${successCount}/${employees.length} employees`);
    }

    console.log(`Successfully synced ${successCount} employees to database!`);
    return successCount;
  } catch (error) {
    console.error('Database sync error:', error);
    throw error;
  }
}

async function main() {
  console.log('=== Employee Sync Script Started ===\n');

  let tempFilePath = null;

  try {
    // Step 1: Download CSV from SFTP
    tempFilePath = await downloadEmployeeCSV();

    // Step 2: Parse CSV
    const employees = parseEmployeeCSV(tempFilePath);

    if (employees.length === 0) {
      console.warn('Warning: No valid employees found in CSV file');
      return;
    }

    // Step 3: Sync to database
    await syncEmployeesToDatabase(employees);

    console.log('\n=== Sync completed successfully! ===');

  } catch (error) {
    console.error('\n=== Sync failed ===');
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    // Cleanup: Remove temporary CSV file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      console.log('Cleaned up temporary file');
    }
  }
}

// Run the script
main();
