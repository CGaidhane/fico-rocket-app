import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function generateTest() {
  // Initialize Gemini with your API Key
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  try {
    // Read the PR diff
    if (!fs.existsSync('pr_diff.txt')) {
      console.log('No diff found. Exiting.');
      return;
    }
    
    const diffContent = fs.readFileSync('pr_diff.txt', 'utf-8');
    if (!diffContent.trim()) {
      console.log('Empty diff. Exiting.');
      return;
    }

    const prompt = `
    You are an expert QA Automation Engineer. Look at this Git Diff for a web project:
    ${diffContent}
    
    Write a JavaScript test file (using standard testing libraries like Jest or simple JS assertions) to test the new changes. 
    Output ONLY the raw JavaScript code. Do not use markdown code blocks (\`\`\`). Do not include any explanations.
    `;

    console.log('Generating tests with Gemini...');
    const result = await model.generateContent(prompt);
    
    // Clean up the response to ensure it's just raw code
    let responseText = result.response.text().trim();
    if (responseText.startsWith('```javascript')) responseText = responseText.replace('```javascript', '');
    if (responseText.startsWith('```js')) responseText = responseText.replace('```js', '');
    if (responseText.endsWith('```')) responseText = responseText.substring(0, responseText.length - 3);

    // Save the output to a test file
    const testsDir = path.join(process.cwd(), 'tests');
    if (!fs.existsSync(testsDir)) {
      fs.mkdirSync(testsDir);
    }
    
    fs.writeFileSync(path.join(testsDir, 'ai_generated.test.js'), responseText.trim());
    console.log('Test file saved to tests/ai_generated.test.js');

  } catch (error) {
    console.error('Error generating tests:', error);
  }
}

generateTest();