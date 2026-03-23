import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PromptCard from '@components/PromptCard';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

// ============================================================
// PURPOSE: Test the PromptCard UI component
// - Does it show the right content (text, tag, username)?
// - Does the copy button work correctly?
// - Do Edit/Delete buttons appear only when they should?
// - Does the expiry badge show up correctly?
// ============================================================

// Mock next-auth — so we can pretend a user is logged in or not
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock next/image — Next.js Image component doesn't work in tests,
// so we replace it with a plain <img> tag
jest.mock('next/image', () => {
  const MockImage = (props) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  };
  MockImage.displayName = 'MockImage';
  return MockImage;
});

// Mock fetch — so when the copy button calls the API, we don't make real requests
global.fetch = jest.fn(() => Promise.resolve({ ok: true }));

// This is a fake prompt object that looks like what our real app uses
const mockPost = {
  _id: '123',
  creator: {
    _id: 'user1',
    username: 'testuser',
    image: '/assets/images/logo.svg',
  },
  prompt: 'Test prompt content',
  tag: 'testtag',
  isPrivate: false,
  expiresAt: null,
};

describe('PromptCard Component', () => {
  beforeEach(() => {
    // Before each test: user is NOT logged in, we're on the home page
    useSession.mockReturnValue({ data: null });
    usePathname.mockReturnValue('/');
    // Mock the browser's clipboard API (not available in test environment)
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn() },
    });
    jest.clearAllMocks();
  });

  // ─── RENDERING TESTS ────────────────────────────────────

  // Check: Does the card show the prompt text, tag, and username?
  test('renders prompt text and tag correctly', () => {
    render(<PromptCard post={mockPost} />);

    expect(screen.getByText('Test prompt content')).toBeInTheDocument();
    expect(screen.getByText('#testtag')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  // Check: If a public prompt is expiring soon, does it show an "Expires in" badge?
  test('renders expiry badge for a public prompt with expiry', () => {
    const expiringPost = {
      ...mockPost,
      expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
    };

    render(<PromptCard post={expiringPost} />);

    expect(screen.getByText(/Expires in/)).toBeInTheDocument();
  });

  // Check: Private prompts should NOT show any expiry badge
  test('does NOT render expiry badge for private prompt', () => {
    const privatePost = {
      ...mockPost,
      isPrivate: true,
      expiresAt: null,
    };

    render(<PromptCard post={privatePost} />);

    expect(screen.queryByText(/Expires/)).not.toBeInTheDocument();
  });

  // Check: Permanent prompts (no expiresAt) should NOT show any expiry badge
  test('does NOT render expiry badge for permanent prompt (no expiresAt)', () => {
    const permanentPost = {
      ...mockPost,
      expiresAt: null,
    };

    render(<PromptCard post={permanentPost} />);

    expect(screen.queryByText(/Expires/)).not.toBeInTheDocument();
  });

  // ─── TAG CLICK TEST ─────────────────────────────────────

  // Check: When user clicks a tag like "#testtag", does it trigger the handler?
  test('calls handleTagClick when tag is clicked', () => {
    const handleTagClick = jest.fn();
    render(<PromptCard post={mockPost} handleTagClick={handleTagClick} />);

    fireEvent.click(screen.getByText('#testtag'));

    expect(handleTagClick).toHaveBeenCalledWith('testtag');
  });

  // ─── COPY BUTTON TESTS ─────────────────────────────────

  // Check: Clicking the copy button should copy the prompt text to clipboard
  test('copies prompt text to clipboard when copy button is clicked', async () => {
    render(<PromptCard post={mockPost} />);

    // Find the copy icon by its alt text and click its parent div
    const copyIcon = screen.getByAltText('copy_icon');
    fireEvent.click(copyIcon.closest('div'));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Test prompt content');
  });

  // Check: After clicking copy, the icon should change to a tick,
  // then go back to the copy icon after 3 seconds
  test('shows tick icon after copy and reverts back', async () => {
    jest.useFakeTimers();
    render(<PromptCard post={mockPost} />);

    const copyBtn = screen.getByAltText('copy_icon').closest('div');
    fireEvent.click(copyBtn);

    // Right after clicking, tick icon should appear
    expect(screen.getByAltText('tick_icon')).toBeInTheDocument();

    // Fast-forward 3 seconds — copy icon should come back
    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.getByAltText('copy_icon')).toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  // Check: When user copies a prompt, the app should also call the API
  // to track the copy (for trending/analytics)
  test('tracks copy by calling the API', async () => {
    render(<PromptCard post={mockPost} />);

    const copyBtn = screen.getByAltText('copy_icon').closest('div');
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/prompt/123/copy', { method: 'PATCH' });
    });
  });

  // ─── EDIT/DELETE BUTTON TESTS ───────────────────────────

  // Check: Edit and Delete buttons should ONLY appear when:
  // 1. The logged-in user is the creator of the prompt
  // 2. The user is on the /profile page
  test('shows edit and delete buttons only if user is creator and on profile page', () => {
    useSession.mockReturnValue({ data: { user: { id: 'user1' } } });
    usePathname.mockReturnValue('/profile');

    render(<PromptCard post={mockPost} />);

    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  // Check: If a DIFFERENT user is logged in (not the creator), buttons should NOT appear
  test('does NOT show edit/delete buttons when user is not the creator', () => {
    useSession.mockReturnValue({ data: { user: { id: 'otherUser' } } });
    usePathname.mockReturnValue('/profile');

    render(<PromptCard post={mockPost} />);

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  // Check: Even if the user is the creator, buttons should NOT appear on non-profile pages
  test('does NOT show edit/delete buttons on non-profile pages', () => {
    useSession.mockReturnValue({ data: { user: { id: 'user1' } } });
    usePathname.mockReturnValue('/'); // home page, not profile

    render(<PromptCard post={mockPost} />);

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  // Check: Clicking the "Edit" button should trigger the handleEdit callback
  test('calls handleEdit when Edit is clicked', () => {
    useSession.mockReturnValue({ data: { user: { id: 'user1' } } });
    usePathname.mockReturnValue('/profile');

    const handleEdit = jest.fn();
    render(<PromptCard post={mockPost} handleEdit={handleEdit} />);

    fireEvent.click(screen.getByText('Edit'));
    expect(handleEdit).toHaveBeenCalledTimes(1);
  });

  // Check: Clicking the "Delete" button should trigger the handleDelete callback
  test('calls handleDelete when Delete is clicked', () => {
    useSession.mockReturnValue({ data: { user: { id: 'user1' } } });
    usePathname.mockReturnValue('/profile');

    const handleDelete = jest.fn();
    render(<PromptCard post={mockPost} handleDelete={handleDelete} />);

    fireEvent.click(screen.getByText('Delete'));
    expect(handleDelete).toHaveBeenCalledTimes(1);
  });

  // ─── AUTH EDGE CASE ─────────────────────────────────────

  // Check: If NO user is logged in at all, Edit/Delete should never appear
  test('does NOT show edit/delete when not logged in', () => {
    useSession.mockReturnValue({ data: null });
    usePathname.mockReturnValue('/profile');

    render(<PromptCard post={mockPost} />);

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });
});
