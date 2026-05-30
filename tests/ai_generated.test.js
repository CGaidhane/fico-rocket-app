const { execSync } = require('child_process');
const fs = require('fs');

// Mock child_process and fs module functions that would be used by the workflow's shell script.
jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));
jest.mock('fs', () => ({
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

describe('GitHub Workflow file download and commit logic', () => {
  const mockRepo = 'myorg/my-web-project';
  const mockIssueNumber = 42;
  const mockBranchName = 'feature/new-ai-tests';
  const mockGhToken = 'mock_gh_token_123';
  const testFilePath = 'tests/ai_generated.test.js';
  const mockTestContent = `describe('AI Generated Test', () => { it('should verify something', () => { expect(true).toBe(true); }); });`;
  const mockEncodedContent = Buffer.from(mockTestContent).toString('base64');

  // Helper function to simulate the workflow's core logic for testing purposes.
  // This function encapsulates the shell logic into a "testable" JS equivalent.
  // In a real GitHub Actions environment, this logic runs as shell commands.
  // For a Jest unit test, we simulate the calls that *would* happen.
  const simulateWorkflowStep = (
    repository,
    issueNumber,
    branchName,
    ghToken
  ) => {
    // 1. Download Test File via GitHub API
    const ref = `ai-tests-pr-${issueNumber}`;
    const apiUrl = `repos/${repository}/contents/${testFilePath}?ref=${ref}`;
    const downloadCommand = `gh api ${apiUrl} --jq '.content'`;

    // Simulate execSync for download.
    const encodedOutput = execSync(downloadCommand, {
      env: { ...process.env, GH_TOKEN: ghToken },
    });
    const decodedContent = Buffer.from(encodedOutput.toString(), 'base64').toString('utf8');

    fs.mkdirSync('tests', { recursive: true });
    fs.writeFileSync(testFilePath, decodedContent);

    // 2. Commit the file and push
    execSync('git config --global user.name "github-actions[bot]"');
    execSync('git config --global user.email "github-actions[bot]@users.noreply.github.com"');
    execSync(`git add ${testFilePath}`);
    execSync('git commit -m "Build: Embedded Gemini auto-generated test cases" || echo "No changes to commit"');
    execSync(`git push origin ${branchName}`);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for execSync to simulate successful operations
    execSync.mockImplementation((command) => {
      if (command.includes('gh api repos')) {
        return mockEncodedContent; // Return base64 encoded test content
      }
      return ''; // For git commands, return empty string for success
    });
  });

  it('should call gh api to download the test file, decode it, and write it to disk', () => {
    simulateWorkflowStep(mockRepo, mockIssueNumber, mockBranchName, mockGhToken);

    // Verify gh api command was called correctly with the token
    expect(execSync).toHaveBeenCalledWith(
      `gh api repos/${mockRepo}/contents/${testFilePath}?ref=ai-tests-pr-${mockIssueNumber} --jq '.content'`,
      { env: expect.objectContaining({ GH_TOKEN: mockGhToken }) }
    );

    // Verify file system operations
    expect(fs.mkdirSync).toHaveBeenCalledWith('tests', { recursive: true });
    expect(fs.writeFileSync).toHaveBeenCalledWith(testFilePath, mockTestContent);
  });

  it('should configure git, add, commit, and push the file with the correct message and branch', () => {
    simulateWorkflowStep(mockRepo, mockIssueNumber, mockBranchName, mockGhToken);

    // Verify git configuration
    expect(execSync).toHaveBeenCalledWith('git config --global user.name "github-actions[bot]"');
    expect(execSync).toHaveBeenCalledWith('git config --global user.email "github-actions[bot]@users.noreply.github.com"');

    // Verify git add, commit, and push
    expect(execSync).toHaveBeenCalledWith(`git add ${testFilePath}`);
    expect(execSync).toHaveBeenCalledWith('git commit -m "Build: Embedded Gemini auto-generated test cases" || echo "No changes to commit"');
    expect(execSync).toHaveBeenCalledWith(`git push origin ${mockBranchName}`);
  });

  it('should handle API download failures by throwing an error', () => {
    execSync.mockImplementation((command) => {
      if (command.includes('gh api repos')) {
        throw new Error('Failed to download from GitHub API');
      }
      return '';
    });

    expect(() =>
      simulateWorkflowStep(mockRepo, mockIssueNumber, mockBranchName, mockGhToken)
    ).toThrow('Failed to download from GitHub API');

    // Ensure subsequent steps (file write, git operations) are not called
    expect(fs.writeFileSync).not.toHaveBeenCalled();
    expect(execSync).not.toHaveBeenCalledWith(expect.stringContaining('git add'));
  });

  it('should handle git command failures after successful download', () => {
    execSync.mockImplementation((command) => {
      if (command.includes('git push')) {
        throw new Error('Git push failed');
      }
      // Ensure download and previous git commands succeed
      if (command.includes('gh api repos')) return mockEncodedContent;
      return '';
    });

    expect(() =>
      simulateWorkflowStep(mockRepo, mockIssueNumber, mockBranchName, mockGhToken)
    ).toThrow('Git push failed');

    // Ensure download and previous git commands were attempted
    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(execSync).toHaveBeenCalledWith(`git add ${testFilePath}`);
    expect(execSync).toHaveBeenCalledWith('git commit -m "Build: Embedded Gemini auto-generated test cases" || echo "No changes to commit"');
    // The failing command should have been called
    expect(execSync).toHaveBeenCalledWith(`git push origin ${mockBranchName}`);
  });
});