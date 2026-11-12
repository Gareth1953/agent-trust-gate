import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./browser-test',timeout:30000,workers:1,retries:0,reporter:'list',use:{headless:true,
  ...(process.env.ATG_TEST_CHROMIUM?{launchOptions:{executablePath:process.env.ATG_TEST_CHROMIUM}}:{})}});
