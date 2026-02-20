// Script to apply demo mode to all hidden feature pages
// This adds the demo mode check to each page

const fs = require('fs');
const path = require('path');

const pagesToUpdate = [
  {
    file: 'app/purchases/page.tsx',
    title: 'Purchase Orders Coming Soon',
    description: 'Complete purchase order management with supplier tracking will be available soon!'
  },
  {
    file: 'app/sales/page.tsx',
    title: 'Sales Management Coming Soon',
    description: 'Full sales tracking with customer management and invoicing will be available soon!'
  },
  {
    file: 'app/mortality/page.tsx',
    title: 'Mortality Tracking Coming Soon',
    description: 'Comprehensive mortality tracking and analysis will be available soon!'
  },
  {
    file: 'app/expenses/page.tsx',
    title: 'Expense Management Coming Soon',
    description: 'Complete expense tracking and categorization will be available soon!'
  },
  {
    file: 'app/reports/page.tsx',
    title: 'Reports Coming Soon',
    description: 'Detailed reports and analytics for all operations will be available soon!'
  },
  {
    file: 'app/financial-analytics/page.tsx',
    title: 'Financial Analytics Coming Soon',
    description: 'Advanced financial analytics and insights will be available soon!'
  },
  {
    file: 'app/products/page.tsx',
    title: 'Products Coming Soon',
    description: 'Product catalog and management will be available soon!'
  }
];

function updatePage(pageInfo) {
  const filePath = path.join(__dirname, pageInfo.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${pageInfo.file} - file not found`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if already updated
  if (content.includes('DEMO_MODE')) {
    console.log(`Skipping ${pageInfo.file} - already updated`);
    return;
  }
  
  // Add imports after "use client"
  const importToAdd = `import { DEMO_MODE } from "@/lib/demo-config"
import { ComingSoon } from "@/components/coming-soon"`;
  
  // Find the last import statement
  const lastImportIndex = content.lastIndexOf('import ');
  const endOfLastImport = content.indexOf('\n', lastImportIndex);
  
  content = content.slice(0, endOfLastImport + 1) + importToAdd + '\n' + content.slice(endOfLastImport + 1);
  
  // Find the export default function and add demo check
  const functionMatch = content.match(/export default function \w+\(\) \{/);
  if (functionMatch) {
    const functionStart = content.indexOf(functionMatch[0]) + functionMatch[0].length;
    
    const demoCheck = `
  // Show Coming Soon in demo mode
  if (DEMO_MODE) {
    return (
      <DashboardLayout>
        <ComingSoon 
          title="${pageInfo.title}" 
          description="${pageInfo.description}"
        />
      </DashboardLayout>
    )
  }
`;
    
    content = content.slice(0, functionStart) + demoCheck + content.slice(functionStart);
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✓ Updated ${pageInfo.file}`);
}

console.log('Applying demo mode to pages...\n');
pagesToUpdate.forEach(updatePage);
console.log('\nDone!');
