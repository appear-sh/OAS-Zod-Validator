import { promises as fs } from 'fs';
import { glob } from 'glob';
import path from 'path';

/**
 * Updates test files to use Vitest instead of Jest
 */
async function updateTestFiles() {
  console.log('Updating test files to use Vitest instead of Jest...');

  // Find all test files
  const testFiles = await glob('src/**/*.test.{ts,js}');
  testFiles.push(...(await glob('src/**/*.spec.{ts,js}')));
  
  console.log(`Found ${testFiles.length} test files to update`);

  for (const file of testFiles) {
    console.log(`Updating ${file}...`);
    try {
      // Read file content
      let content = await fs.readFile(file, 'utf-8');

      // Check if the file already has Vitest imports to avoid duplicate processing
      if (content.includes("from 'vitest'")) {
        console.log(`  File ${file} already has Vitest imports, skipping...`);
        continue;
      }
      
      // Add Vitest import if no test utilities are imported
      if (!content.includes("from '@jest/globals'")) {
        const importMatch = content.match(/^(import .*?from .*?;(\s*\n|\s*$))+/m);
        if (importMatch) {
          const importSection = importMatch[0];
          const newImportSection = `${importSection}import { describe, test, expect, vi } from 'vitest';\n`;
          content = content.replace(importSection, newImportSection);
        } else {
          // If no imports, add at the top
          content = `import { describe, test, expect, vi } from 'vitest';\n${content}`;
        }
      } else {
        // Replace Jest imports with Vitest
        content = content.replace(
          /import\s+{([^}]*)}\s+from\s+['"]@jest\/globals['"];?/g, 
          (match, importList) => {
            // Replace jest with vi in the import list
            const newImportList = importList
              .split(',')
              .map(item => {
                const trimmed = item.trim();
                return trimmed === 'jest' ? 'vi' : trimmed;
              })
              .join(', ');
            
            return `import { ${newImportList} } from 'vitest';`;
          }
        );
      }
      
      // Replace any other Jest-specific imports if needed
      
      // Replace jest functions with vi
      content = content.replace(/jest\./g, 'vi.');
      content = content.replace(/jest\.fn/g, 'vi.fn');
      content = content.replace(/jest\.mock/g, 'vi.mock');
      content = content.replace(/jest\.spyOn/g, 'vi.spyOn');
      
      // Write updated content back to file
      await fs.writeFile(file, content, 'utf-8');
      
    } catch (error) {
      console.error(`Error updating ${file}:`, error);
    }
  }
  
  console.log('Test files updated successfully!');
}

// Run the update function
updateTestFiles().catch(error => {
  console.error('Error updating test files:', error);
  process.exit(1);
}); 